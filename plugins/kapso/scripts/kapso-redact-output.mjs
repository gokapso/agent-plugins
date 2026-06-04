#!/usr/bin/env node

let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  input += chunk;
});
process.stdin.on("end", () => {
  const redacted = input
    .replace(/(KAPSO_API_KEY\s*=\s*)[^\s]+/gi, "$1[REDACTED]")
    .replace(/(api[_-]?key["']?\s*[:=]\s*["']?)[A-Za-z0-9._-]{12,}/gi, "$1[REDACTED]")
    .replace(/(token["']?\s*[:=]\s*["']?)[A-Za-z0-9._-]{12,}/gi, "$1[REDACTED]")
    .replace(/(secret["']?\s*[:=]\s*["']?)[A-Za-z0-9._-]{8,}/gi, "$1[REDACTED]")
    .replace(/(pat["']?\s*[:=]\s*["']?)[A-Za-z0-9._-]{12,}/gi, "$1[REDACTED]");
  process.stdout.write(redacted);
});
