import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

// Runs the Kapso plugin's agent evals. `claude plugin eval` expects the suite inside the plugin
// directory, but the suite lives in evals/kapso so it doesn't ship with the plugin. This copies
// the plugin and the suite into a temporary directory and runs the evals there.
// Usage, from the repository root: node scripts/run-agent-evals.mjs [claude plugin eval options]

const root = process.cwd();
const args = process.argv.slice(2);
const outputIndex = args.indexOf("--output-dir");

if (outputIndex === -1 || !args[outputIndex + 1]) {
  console.error("Pass --output-dir <dir>. The temporary plugin copy, where results go by default, is deleted after the run.");
  process.exit(1);
}

const outputDir = path.resolve(args[outputIndex + 1]);
if (outputDir === root || outputDir.startsWith(`${root}${path.sep}`)) {
  console.error("Keep --output-dir outside the repository: npm run validate rejects the absolute paths in eval results.");
  process.exit(1);
}

const staging = fs.mkdtempSync(path.join(os.tmpdir(), "kapso-evals-"));
const plugin = path.join(staging, "kapso");
fs.cpSync(path.join(root, "plugins/kapso"), plugin, { recursive: true });
fs.cpSync(path.join(root, "evals/kapso"), path.join(plugin, "evals"), { recursive: true });

// The copy is new on every run, so trust it here instead of being asked each time.
const trust = args.includes("--trust-plugin") ? [] : ["--trust-plugin"];
const result = spawnSync("claude", ["plugin", "eval", plugin, ...trust, ...args], { stdio: "inherit" });
fs.rmSync(staging, { recursive: true, force: true });

if (result.error) {
  console.error(`Couldn't run claude: ${result.error.message}`);
  process.exit(1);
}
process.exit(result.status ?? 1);
