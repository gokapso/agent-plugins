import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const pluginRoot = path.join(root, "plugins/kapso");
const manifestPath = path.join(pluginRoot, ".codex-plugin/plugin.json");
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
const semver = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;
const hexColor = /^#[0-9A-F]{6}$/i;
const errors = [];

function requireString(object, key, label = key) {
  if (typeof object[key] !== "string" || object[key].trim() === "") {
    errors.push(`${label} must be a non-empty string`);
  }
}

function ensureRelativeFile(rawPath, label) {
  if (typeof rawPath !== "string" || rawPath.trim() === "") {
    errors.push(`${label} must be a non-empty relative path`);
    return;
  }

  if (rawPath.startsWith("/") || rawPath.includes("..")) {
    errors.push(`${label} must stay inside the plugin archive`);
    return;
  }

  const fullPath = path.join(pluginRoot, rawPath);
  if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isFile()) {
    errors.push(`${label} points to a missing file`);
  }
}

requireString(manifest, "name");
requireString(manifest, "version");
requireString(manifest, "description");

if (typeof manifest.version === "string" && !semver.test(manifest.version)) {
  errors.push("version must be strict semver");
}

if (manifest.skills !== "./skills/") {
  errors.push("skills must resolve to ./skills/");
}

if (manifest.mcpServers !== "./.mcp.json") {
  errors.push("mcpServers must resolve to ./.mcp.json");
}

ensureRelativeFile("./.mcp.json", "mcpServers");

const iface = manifest.interface ?? {};
for (const field of ["displayName", "shortDescription", "longDescription", "developerName", "category"]) {
  requireString(iface, field, `interface.${field}`);
}

if (!Array.isArray(iface.capabilities) || !iface.capabilities.every((value) => typeof value === "string" && value.trim() !== "")) {
  errors.push("interface.capabilities must be an array of strings");
}

if (!Array.isArray(iface.defaultPrompt) || iface.defaultPrompt.length === 0) {
  errors.push("interface.defaultPrompt must be a non-empty array");
}

if (iface.brandColor && !hexColor.test(iface.brandColor)) {
  errors.push("interface.brandColor must use #RRGGBB");
}

for (const field of ["composerIcon", "logo"]) {
  if (iface[field]) {
    ensureRelativeFile(iface[field], `interface.${field}`);
  }
}

const skillNames = ["integrate-whatsapp", "automate-whatsapp", "observe-whatsapp"];
for (const skillName of skillNames) {
  const skillPath = path.join(pluginRoot, "skills", skillName, "SKILL.md");
  if (!fs.existsSync(skillPath)) {
    errors.push(`skill ${skillName} is missing SKILL.md`);
    continue;
  }

  const contents = fs.readFileSync(skillPath, "utf8");
  if (!contents.startsWith("---\n") || contents.indexOf("\n---", 4) === -1) {
    errors.push(`skill ${skillName} must include YAML frontmatter`);
    continue;
  }

  const frontmatter = contents.slice(4, contents.indexOf("\n---", 4));
  if (!frontmatter.includes(`name: ${skillName}`)) {
    errors.push(`skill ${skillName} frontmatter must include name`);
  }
  if (!/description:\s*["']?.+/.test(frontmatter)) {
    errors.push(`skill ${skillName} frontmatter must include description`);
  }
}

if (errors.length > 0) {
  console.error("Codex plugin validation failed:");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log("Kapso Codex plugin manifest is valid.");
