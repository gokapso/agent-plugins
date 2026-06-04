#!/usr/bin/env node

let input = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  input += chunk;
});
process.stdin.on("end", () => {
  const lines = input.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const interesting = lines.filter((line) =>
    /(push plan|pushed|create|update|unchanged|warning|error|workflow|function|draft|open it)/i.test(line)
  );

  console.log("Kapso dry-run summary");
  console.log("=====================");
  if (interesting.length === 0) {
    console.log("No recognizable dry-run summary lines were found.");
    return;
  }
  for (const line of interesting.slice(0, 40)) {
    console.log(`- ${line}`);
  }
});
