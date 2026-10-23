import fs from "node:fs";
import path from "node:path";

// Turns a `claude plugin eval` aggregate-result.json into a readable report: plain text for
// the job log, and Markdown appended to $GITHUB_STEP_SUMMARY when that variable is set.
// Usage: node scripts/summarize-agent-evals.mjs <aggregate-result.json> [suite directory]

const resultPath = process.argv[2];
const suiteDir = process.argv[3] || "evals/kapso";
const env = process.env;
const model = env.EVAL_MODEL || "the agent model";
const judge = env.JUDGE_MODEL || "the judge model";
const runsPerCase = env.RUNS || "1";
const threshold = env.THRESHOLD || "0";
const toolPrefix = "mcp__plugin_kapso_kapso__";
const targets = {
  last_message: "the final reply",
  mock_calls: "the Kapso tool calls",
  trace: "the transcript",
  files: "the files the agent created"
};

function writeSummary(markdown) {
  if (env.GITHUB_STEP_SUMMARY) fs.appendFileSync(env.GITHUB_STEP_SUMMARY, `${markdown}\n`);
}

function oneLine(text, max) {
  const flat = String(text).replace(/\s+/g, " ").trim();
  return flat.length > max ? `${flat.slice(0, max - 1)}…` : flat;
}

function percent(value) {
  return `${Math.round((value ?? 0) * 100)}%`;
}

// Describes a failed check in plain words, from the grader record the eval tool writes.
function describe(check) {
  const text = String(check.explanation || "").trim();
  let match;

  if (/^skipped/i.test(text)) {
    return `not graded: ${oneLine(text, 120)}. This is not an agent failure`;
  }

  if ((match = text.match(/^grader threw: judge call failed: ([\s\S]+)$/))) {
    const reason = match[1].includes("safeguards flagged")
      ? "the judge model's safety filter refused to grade it"
      : `the judge call failed (${oneLine(match[1], 120)})`;
    return `not graded: ${reason}. This is a grading error, not an agent failure; rerun the case`;
  }

  if ((match = text.match(/^grader threw: ([\s\S]+)$/))) {
    return `not graded: ${oneLine(match[1], 160)}`;
  }

  if (Array.isArray(check.judgeVotes) && check.judgeVotes.length > 0) {
    const passed = check.judgeVotes.filter(Boolean).length;
    const needed = Math.floor(check.judgeVotes.length / 2) + 1;
    return `the judge failed the reply (${passed} of ${check.judgeVotes.length} votes passed, ${needed} needed)`;
  }

  if ((match = text.match(/^(.+) called (\d+)x \(expected (\d+)\.\.(\d+|∞)\)$/))) {
    const [, tool, count, min, max] = match;
    const name = tool.replace(toolPrefix, "");
    if (max === "0") return `expected no matching calls to ${name}, found ${count}`;
    if (max === "∞") return `expected at least ${min} matching call${min === "1" ? "" : "s"} to ${name}, found ${count}`;
    return `expected ${min} to ${max} matching calls to ${name}, found ${count}`;
  }

  if ((match = text.match(/^pattern not found in (\w+)$/))) {
    return `the expected text wasn't found in ${targets[match[1]] || match[1]}`;
  }

  if (text === "pattern found (expected absent)") {
    return "found something this check forbids (see its pattern)";
  }

  return text.split(toolPrefix).join("");
}

// Cases in the suite directory, so cases that failed to load or never ran still show up.
function suiteCases() {
  if (!fs.existsSync(suiteDir)) return [];
  return fs
    .readdirSync(suiteDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .filter((entry) => ["prompt.md", "case.yaml"].some((file) => fs.existsSync(path.join(suiteDir, entry.name, file))))
    .map((entry) => entry.name);
}

if (!resultPath || !fs.existsSync(resultPath)) {
  const message = 'No eval results were written. The end of the "Run agent evals" step log shows why.';
  console.log(message);
  writeSummary(`## Kapso agent evals: ${model}\n\n${message}`);
  process.exit(0);
}

const result = JSON.parse(fs.readFileSync(resultPath, "utf8"));
const cases = result.cases.map((testCase) => {
  const runs = testCase.arms?.with ?? [];
  const failed = new Map();
  for (const run of runs) {
    for (const check of run.graders ?? []) {
      if (check.passed !== false) continue;
      const entry = failed.get(check.name) ?? { count: 0, first: check };
      entry.count += 1;
      failed.set(check.name, entry);
    }
  }
  const errors = runs
    .filter((run) => run.error || run.aborted)
    .map((run) => oneLine(run.error ?? `aborted: ${JSON.stringify(run.aborted)}`, 200));
  return { name: testCase.name, score: testCase.aggregates?.score, runs: runs.length, failed: [...failed], errors };
});
const ran = new Set(cases.map((testCase) => testCase.name));
const missing = suiteCases().filter((name) => !ran.has(name));
const problems = cases.filter((testCase) => testCase.failed.length > 0 || testCase.errors.length > 0);

const runsText = `${runsPerCase} run${runsPerCase === "1" ? "" : "s"} per case`;
const totals = `Suite score ${percent(result.aggregates?.overallScore)} across ${cases.length} cases. Cost $${(result.costUsd ?? 0).toFixed(2)}.`;
const setting = `Judge ${judge}, ${runsText}, threshold ${threshold}, Claude Code ${result.claudeVersion}.`;
const legend =
  `How to read this: each case runs several checks, and its score is the weighted share that passed; safety checks weigh more. ` +
  `A judged check asks ${judge} three times whether the reply meets the check's rubric, and passes with 2 of 3 votes. ` +
  `Each check is defined in ${suiteDir}/<case>/graders/<check>.md. ` +
  `The artifact has the HTML report and each run's transcript under traces/.`;

function failureLines(testCase) {
  const lines = [];
  for (const [check, { count, first }] of testCase.failed) {
    const text = describe(first);
    lines.push({
      check: testCase.runs > 1 ? `${check} (${count} of ${testCase.runs} runs)` : check,
      file: `${suiteDir}/${testCase.name}/graders/${check}.md`,
      text,
      // A check that couldn't be graded isn't an agent failure, so it gets its own marker.
      marker: text.startsWith("not graded") ? "?" : "✗",
      reply: first.evidence ? oneLine(first.evidence, 200) : null
    });
  }
  return lines;
}

// Plain text for the job log.
const log = [`Kapso agent evals: ${model}`, totals, setting];
if (result.partial) log.push(`Partial run: ${result.partialReason}.`);
log.push("");
for (const testCase of problems) {
  log.push(`${percent(testCase.score).padStart(4)}  ${testCase.name}`);
  for (const line of failureLines(testCase)) {
    log.push(`      ${line.marker} ${line.check}: ${line.text}`);
    if (line.reply) log.push(`        Reply: "${line.reply}"`);
  }
  for (const error of testCase.errors) log.push(`      ! A run didn't finish: ${error}`);
}
for (const name of missing) log.push(`   ?  ${name}: didn't run (the case failed to load, or the run stopped early)`);
const clean = cases.length - problems.length;
if (problems.length === 0 && missing.length === 0) log.push(`All ${cases.length} cases passed every check.`);
else if (clean > 0) log.push(`${clean} other case${clean === 1 ? "" : "s"} passed every check.`);
log.push("", legend);
console.log(log.join("\n"));

// Markdown for the run's Summary page.
const markdown = [`## Kapso agent evals: ${model}`, "", `${totals} ${setting}`];
if (result.partial) markdown.push("", `Partial run: ${result.partialReason}.`);
markdown.push("", "| Case | Score | Failed checks |", "| --- | --- | --- |");
for (const testCase of cases) {
  const names = [...failureLines(testCase).map((line) => line.check), ...(testCase.errors.length ? ["run errors"] : [])];
  markdown.push(`| ${testCase.name} | ${percent(testCase.score)} | ${names.join(", ")} |`);
}
for (const name of missing) markdown.push(`| ${name} | didn't run | |`);
if (problems.length > 0 || missing.length > 0) {
  markdown.push("", "### Failed checks", "");
  for (const testCase of problems) {
    for (const line of failureLines(testCase)) {
      markdown.push(`- ${line.marker} **${testCase.name}**, \`${line.check}\`: ${line.text}. Check file: \`${line.file}\``);
      if (line.reply) markdown.push(`  > ${line.reply}`);
    }
    for (const error of testCase.errors) markdown.push(`- **${testCase.name}**: a run didn't finish: ${error}`);
  }
  for (const name of missing) markdown.push(`- ? **${name}**: didn't run. The case failed to load, or the run stopped early; the "Run agent evals" step log says which.`);
}
markdown.push("", legend, "", `Commit ${(env.GITHUB_SHA || "").slice(0, 7) || "unknown"}.`);
writeSummary(markdown.join("\n"));
