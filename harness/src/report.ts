// Loading and pretty-printing helpers shared by the score and compare CLIs.

import { readFileSync, readdirSync } from "node:fs";
import { dirname } from "node:path";
import type { DeterministicReport, JudgeReport, Page } from "./types.ts";
import { BUCKET_LABEL } from "./types.ts";

export function loadPage(path: string): Page {
  const raw = readFileSync(path, "utf8");
  const dir = dirname(path);
  let siblings: string[] = [];
  try {
    siblings = readdirSync(dir);
  } catch {
    siblings = [];
  }
  return { path, dir, raw, siblings };
}

const bar = (pct: number, width = 24): string => {
  const filled = Math.round((pct / 100) * width);
  return "█".repeat(filled) + "░".repeat(width - filled);
};

const mark = (status: string): string =>
  status === "pass" ? "✓" : status === "warn" ? "~" : "✗";

export function formatDeterministic(r: DeterministicReport): string {
  const lines: string[] = [];
  lines.push("Deterministic checks");
  for (const c of r.checks) {
    lines.push(`  ${mark(c.status)} [${c.bucket}] ${c.headline}`);
    for (const d of c.details) lines.push(`      ${d}`);
  }
  lines.push("");
  for (const b of ["flow", "voice", "agent"] as const) {
    lines.push(`  ${BUCKET_LABEL[b].padEnd(22)} ${bar(r.buckets[b])} ${r.buckets[b].toFixed(1)}`);
  }
  lines.push(`  ${"OVERALL".padEnd(22)} ${bar(r.overall)} ${r.overall.toFixed(1)} / 100`);
  return lines.join("\n");
}

export function formatJudge(j: JudgeReport | null): string {
  if (!j)
    return "LLM judge   skipped (set ANTHROPIC_API_KEY and `bun install` to enable the Claude judge)";
  const lines: string[] = [];
  lines.push(`LLM judge   verdict: ${j.verdict.toUpperCase()}  ·  ${j.overall.toFixed(1)} / 10`);
  for (const d of j.dimensions) {
    const sev = d.severity === "none" ? "" : `  (${d.severity})`;
    lines.push(`  ${d.score.toFixed(1)}/10  ${d.name}${sev}`);
    lines.push(`         evidence: ${d.evidence}`);
    lines.push(`         fix: ${d.fix}`);
  }
  lines.push(`  summary: ${j.summary}`);
  return lines.join("\n");
}
