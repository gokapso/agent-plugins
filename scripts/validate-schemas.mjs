import Ajv from "ajv/dist/2020.js";
import addFormats from "ajv-formats";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const schemaRoot = path.join(root, "schemas");

const ajv = new Ajv({ allErrors: true, strict: true });
addFormats(ajv);

for (const schemaFile of fs.readdirSync(schemaRoot).filter((file) => file.endsWith(".schema.json"))) {
  const schemaPath = path.join(schemaRoot, schemaFile);
  ajv.addSchema(JSON.parse(fs.readFileSync(schemaPath, "utf8")), schemaFile);
}

const validations = [
  [".agents/plugins/marketplace.json", "codex-marketplace.schema.json"],
  [".cursor-plugin/marketplace.json", "cursor-marketplace.schema.json"],
  [".claude-plugin/marketplace.json", "claude-marketplace.schema.json"],
  ["plugins/kapso/.cursor-plugin/plugin.json", "cursor-plugin.schema.json"],
  ["plugins/kapso/.codex-plugin/plugin.json", "codex-plugin.schema.json"]
];

const errors = [];

for (const [relativePath, schemaId] of validations) {
  const validator = ajv.getSchema(schemaId);
  if (!validator) {
    errors.push(`${schemaId}: schema was not registered`);
    continue;
  }

  const data = JSON.parse(fs.readFileSync(path.join(root, relativePath), "utf8"));
  if (!validator(data)) {
    for (const error of validator.errors ?? []) {
      const location = error.instancePath || "/";
      errors.push(`${relativePath}${location}: ${error.message}`);
    }
  }
}

if (errors.length > 0) {
  console.error("Schema validation failed:");
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log(`Schema validation passed for ${validations.length} manifests.`);
