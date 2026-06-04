import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const requiredFiles = [
  ".agents/plugins/marketplace.json",
  ".claude-plugin/marketplace.json",
  ".cursor-plugin/marketplace.json",
  "plugins/kapso/.codex-plugin/plugin.json",
  "plugins/kapso/.claude-plugin/plugin.json",
  "plugins/kapso/.cursor-plugin/plugin.json",
  "plugins/kapso/mcp.json",
  "plugins/kapso/README.md",
  "plugins/kapso/skills/integrate-whatsapp/SKILL.md",
  "plugins/kapso/skills/automate-whatsapp/SKILL.md",
  "plugins/kapso/skills/observe-whatsapp/SKILL.md"
];

for (const file of requiredFiles) {
  const fullPath = path.join(root, file);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Missing required file: ${file}`);
  }
}

const jsonFiles = requiredFiles.filter((file) => file.endsWith(".json"));
for (const file of jsonFiles) {
  const fullPath = path.join(root, file);
  JSON.parse(fs.readFileSync(fullPath, "utf8"));
}

const codexMarketplace = JSON.parse(
  fs.readFileSync(path.join(root, ".agents/plugins/marketplace.json"), "utf8")
);
const codexPlugin = codexMarketplace.plugins.find((plugin) => plugin.name === "kapso");

if (!codexPlugin) {
  throw new Error("Codex marketplace must include the kapso plugin.");
}

if (codexPlugin.source?.path !== "./plugins/kapso") {
  throw new Error("Codex marketplace source path must be ./plugins/kapso.");
}

console.log("Kapso agent plugin structure is valid.");
