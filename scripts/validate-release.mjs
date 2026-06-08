import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const pluginRoot = path.join(root, "plugins/kapso");
const errors = [];
const ignoredDirs = new Set([".git", "node_modules"]);
const riskyFilePatterns = [
  /^\.env(?:\.|$)/,
  /\.pem$/i,
  /\.key$/i,
  /\.p12$/i,
  /\.sqlite$/i,
  /\.db$/i
];
const localPathPatterns = [
  /\/Users\/[A-Za-z0-9._-]+/,
  /\/home\/[A-Za-z0-9._-]+/,
  /C:\\Users\\[A-Za-z0-9._-]+/i
];
const secretPatterns = [
  /\bsk-[A-Za-z0-9_-]{20,}\b/,
  /\bgh[pousr]_[A-Za-z0-9_]{20,}\b/,
  /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/,
  /\bwhsec_[A-Za-z0-9]{20,}\b/,
  /\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{10,}\b/
];
const textExtensions = new Set([
  ".js",
  ".mjs",
  ".json",
  ".md",
  ".mdc",
  ".txt",
  ".yml",
  ".yaml",
  ".gitignore"
]);

function fail(message) {
  errors.push(message);
}

function readJson(relativePath) {
  const fullPath = path.join(root, relativePath);
  try {
    return JSON.parse(fs.readFileSync(fullPath, "utf8"));
  } catch (error) {
    fail(`${relativePath} is not valid JSON: ${error.message}`);
    return null;
  }
}

function walk(dir, files = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignoredDirs.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      walk(fullPath, files);
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }
  return files;
}

function isRelativeInside(rawPath) {
  return typeof rawPath === "string" && rawPath.trim() !== "" && !rawPath.startsWith("/") && !rawPath.includes("..");
}

function ensureUrl(value, label, { httpsOnly = true } = {}) {
  if (typeof value !== "string" || value.trim() === "") {
    fail(`${label} must be a non-empty URL`);
    return;
  }
  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    fail(`${label} must be a valid URL`);
    return;
  }
  if (parsed.username || parsed.password) {
    fail(`${label} must not include credentials`);
  }
  if (httpsOnly && parsed.protocol !== "https:") {
    fail(`${label} must use https`);
  }
}

function ensureReadmeSections(relativePath, sections) {
  const text = fs.readFileSync(path.join(root, relativePath), "utf8");
  for (const section of sections) {
    if (!new RegExp(`^## ${section}$`, "m").test(text)) {
      fail(`${relativePath} is missing the "${section}" section`);
    }
  }
}

const allFiles = walk(root);

for (const file of allFiles) {
  const relative = path.relative(root, file);
  const basename = path.basename(file);

  if (riskyFilePatterns.some((pattern) => pattern.test(basename))) {
    fail(`Risky local or secret-bearing file should not be committed: ${relative}`);
  }

  if (path.extname(file) === ".json") {
    readJson(relative);
  }

  if (!textExtensions.has(path.extname(file)) && basename !== ".gitignore") {
    continue;
  }

  const text = fs.readFileSync(file, "utf8");
  for (const pattern of localPathPatterns) {
    if (pattern.test(text)) {
      fail(`${relative} contains a local filesystem path`);
      break;
    }
  }
  for (const pattern of secretPatterns) {
    if (pattern.test(text)) {
      fail(`${relative} contains a value that looks like a real secret`);
      break;
    }
  }
}

const packageJson = readJson("package.json");
if (packageJson) {
  if (packageJson.private !== true) fail("package.json must remain private");
  if (!packageJson.scripts?.validate) fail("package.json must define scripts.validate");
  if (!packageJson.scripts?.["check:syntax"]) fail("package.json must define scripts.check:syntax");
}

if (!fs.existsSync(path.join(root, ".github/workflows/validate.yml"))) {
  fail("Missing .github/workflows/validate.yml");
}
if (!fs.existsSync(path.join(root, "SECURITY.md"))) {
  fail("Missing SECURITY.md");
}
if (!fs.existsSync(path.join(root, "CONTRIBUTING.md"))) {
  fail("Missing CONTRIBUTING.md");
}
if (!fs.existsSync(path.join(pluginRoot, "CHANGELOG.md"))) {
  fail("Missing plugins/kapso/CHANGELOG.md");
}
if (!fs.existsSync(path.join(pluginRoot, "LICENSE"))) {
  fail("Missing plugins/kapso/LICENSE");
}

ensureReadmeSections("README.md", [
  "What It Includes",
  "Cursor",
  "Claude Code",
  "Codex",
  "Prerequisites",
  "Validation",
  "Safety"
]);

ensureReadmeSections("plugins/kapso/README.md", [
  "Description",
  "Features",
  "Prerequisites",
  "MCP",
  "Examples",
  "Safety",
  "Privacy Policy",
  "Support"
]);

const marketplace = readJson(".agents/plugins/marketplace.json");
if (marketplace) {
  const plugin = marketplace.plugins?.find((entry) => entry.name === "kapso");
  if (!plugin) {
    fail(".agents/plugins/marketplace.json must include the kapso plugin");
  } else {
    if (plugin.source?.source !== "local") fail("Codex marketplace source must be local");
    if (plugin.source?.path !== "./plugins/kapso") fail("Codex marketplace path must be ./plugins/kapso");
    if (plugin.policy?.authentication !== "ON_INSTALL") fail("Codex marketplace auth policy must be ON_INSTALL");
  }
}

const cursorMarketplace = readJson(".cursor-plugin/marketplace.json");
if (cursorMarketplace) {
  const plugin = cursorMarketplace.plugins?.find((entry) => entry.name === "kapso");
  if (!plugin) fail(".cursor-plugin/marketplace.json must include the kapso plugin");
  if (plugin && plugin.source !== "plugins/kapso") fail("Cursor marketplace source must be plugins/kapso");
}

const codexManifest = readJson("plugins/kapso/.codex-plugin/plugin.json");
if (codexManifest) {
  if (codexManifest.repository !== "https://github.com/gokapso/agent-plugins") {
    fail("Codex manifest repository must point to the public agent-plugins repo");
  }

  const iface = codexManifest.interface ?? {};
  ensureUrl(iface.websiteURL, "interface.websiteURL");
  ensureUrl(iface.privacyPolicyURL, "interface.privacyPolicyURL");
  ensureUrl(iface.documentationURL, "interface.documentationURL");

  if (!Array.isArray(iface.defaultPrompt) || iface.defaultPrompt.length < 3) {
    fail("interface.defaultPrompt must include at least three prompts");
  }
  if (!Array.isArray(iface.screenshots)) {
    fail("interface.screenshots must be an array");
  }
  for (const field of ["composerIcon", "logo"]) {
    if (!isRelativeInside(iface[field])) {
      fail(`interface.${field} must be a relative in-plugin path`);
      continue;
    }
    if (!fs.existsSync(path.join(pluginRoot, iface[field]))) {
      fail(`interface.${field} points to a missing file`);
    }
  }
}

for (const relativePath of ["plugins/kapso/mcp.json", "plugins/kapso/.mcp.json"]) {
  const mcp = readJson(relativePath);
  const server = mcp?.mcpServers?.kapso;
  if (!server?.url) {
    fail(`${relativePath} must define mcpServers.kapso.url`);
    continue;
  }
  ensureUrl(server.url, `${relativePath} mcpServers.kapso.url`);
}

const skillRoot = path.join(pluginRoot, "skills");
const skillDirs = fs.readdirSync(skillRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .filter((skill) => {
    const skillPath = path.join(skillRoot, skill);
    const hasSkill = fs.existsSync(path.join(skillPath, "SKILL.md"));
    const hasFiles = fs.readdirSync(skillPath).length > 0;
    if (!hasSkill && hasFiles) {
      fail(`Skill-like directory ${skill} is missing SKILL.md`);
    }
    return hasSkill;
  });

if (skillDirs.length < 3) fail("Expected at least three Kapso skills");

for (const skill of skillDirs) {
  const skillPath = path.join(pluginRoot, "skills", skill, "SKILL.md");
  if (!fs.existsSync(skillPath)) {
    fail(`Skill ${skill} is missing SKILL.md`);
    continue;
  }
  const text = fs.readFileSync(skillPath, "utf8");
  if (!text.startsWith("---\n")) fail(`Skill ${skill} must start with YAML frontmatter`);
  if (!new RegExp(`name:\\s*${skill}`).test(text.slice(0, 400))) {
    fail(`Skill ${skill} frontmatter must include matching name`);
  }
}

if (errors.length > 0) {
  console.error("Release validation failed:");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log(`Kapso release validation passed for ${allFiles.length} files.`);
