#!/usr/bin/env node
import { spawnSync } from "node:child_process";

function run(command, args) {
  return spawnSync(command, args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

const checks = [];
const version = run("kapso", ["--version"]);

if (version.error?.code === "ENOENT") {
  checks.push({
    name: "kapso-cli",
    status: "missing",
    detail: "Install with: npm install -g @kapso/cli",
  });
} else {
  checks.push({
    name: "kapso-cli",
    status: version.status === 0 ? "ok" : "error",
    detail: (version.stdout || version.stderr).trim(),
  });
}

if (version.status === 0) {
  const status = run("kapso", ["status"]);
  checks.push({
    name: "kapso-status",
    status: status.status === 0 ? "ok" : "needs-attention",
    detail: (status.stdout || status.stderr).trim().split("\n").slice(0, 12).join("\n"),
  });
}

console.log(JSON.stringify({ checks }, null, 2));
