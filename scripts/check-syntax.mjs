import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const checked = [];
const errors = [];
const ignoredDirs = new Set([".git", "node_modules"]);

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ignoredDirs.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      walk(fullPath);
      continue;
    }

    if (!entry.isFile() || !/\.(mjs|js)$/.test(entry.name)) continue;

    const result = spawnSync(process.execPath, ["--check", fullPath], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"]
    });

    checked.push(path.relative(root, fullPath));
    if (result.status !== 0) {
      errors.push({
        file: path.relative(root, fullPath),
        output: (result.stderr || result.stdout || "").trim()
      });
    }
  }
}

walk(root);

if (errors.length > 0) {
  console.error("JavaScript syntax check failed:");
  for (const error of errors) {
    console.error(`\n${error.file}`);
    console.error(error.output);
  }
  process.exit(1);
}

console.log(`JavaScript syntax is valid for ${checked.length} files.`);
