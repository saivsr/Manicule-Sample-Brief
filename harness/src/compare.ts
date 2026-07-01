// Compare two docs pages (before vs after) and print the delta.
// Usage: bun run src/compare.ts <before> <after>
// Defaults to the Vapi before/after in this repo when run with no args.

import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { runDeterministic } from "./deterministic.ts";
import { runJudge } from "./judge.ts";
import { loadPage, formatDeterministic, formatJudge } from "./report.ts";
import type { DeterministicReport } from "./types.ts";

const harnessDir = join(dirname(fileURLToPath(import.meta.url)), "..");

const DEFAULT_BEFORE = join(harnessDir, "fixtures", "vapi-quickstart.before.md");
const DEFAULT_AFTER = join(harnessDir, "..", "rebuild", "quickstart.md");

function deltaLine(label: string, before: number, after: number): string {
  const d = Math.round((after - before) * 10) / 10;
  const sign = d >= 0 ? "+" : "";
  return `  ${label.padEnd(22)} ${before.toFixed(1).padStart(6)}  →  ${after
    .toFixed(1)
    .padStart(6)}   (${sign}${d.toFixed(1)})`;
}

async function main() {
  const beforePath = process.argv[2] ?? DEFAULT_BEFORE;
  const afterPath = process.argv[3] ?? DEFAULT_AFTER;

  const before = loadPage(beforePath);
  const after = loadPage(afterPath);

  const bDet = runDeterministic(before);
  const aDet = runDeterministic(after);

  console.log(`\nBEFORE  ${beforePath}`);
  console.log(formatDeterministic(bDet));
  console.log(`\nAFTER   ${afterPath}`);
  console.log(formatDeterministic(aDet));

  console.log("\nDeterministic delta");
  console.log(deltaLine("Navigation & flow", bDet.buckets.flow, aDet.buckets.flow));
  console.log(deltaLine("Voice & anti-slop", bDet.buckets.voice, aDet.buckets.voice));
  console.log(deltaLine("Agent-readability", bDet.buckets.agent, aDet.buckets.agent));
  console.log(deltaLine("OVERALL", bDet.overall, aDet.overall));

  const [bJudge, aJudge] = await Promise.all([
    runJudge(before.raw, harnessDir),
    runJudge(after.raw, harnessDir),
  ]);
  if (bJudge && aJudge) {
    console.log("\nLLM judge delta");
    console.log(deltaLine("OVERALL (0-10)", bJudge.overall, aJudge.overall));
    console.log(`  before verdict: ${bJudge.verdict}   after verdict: ${aJudge.verdict}`);
  } else {
    console.log("\n" + formatJudge(null));
  }

  console.log("");
  // Emit a Markdown table for pasting into the teardown / README.
  printMarkdownTable(bDet, aDet, bJudge?.overall, aJudge?.overall);
}

function printMarkdownTable(
  b: DeterministicReport,
  a: DeterministicReport,
  bJudge?: number,
  aJudge?: number,
) {
  const rows = [
    ["Navigation & task flow", b.buckets.flow, a.buckets.flow],
    ["Voice & anti-slop", b.buckets.voice, a.buckets.voice],
    ["Agent-readability", b.buckets.agent, a.buckets.agent],
    ["Overall (deterministic)", b.overall, a.overall],
  ] as Array<[string, number, number]>;
  console.log("Paste-ready table:\n");
  console.log("| Dimension | Before | After |");
  console.log("| --- | --- | --- |");
  for (const [label, bv, av] of rows) {
    console.log(`| ${label} | ${bv.toFixed(1)} | ${av.toFixed(1)} |`);
  }
  if (bJudge != null && aJudge != null) {
    console.log(`| LLM judge (0-10) | ${bJudge.toFixed(1)} | ${aJudge.toFixed(1)} |`);
  }
}

main();
