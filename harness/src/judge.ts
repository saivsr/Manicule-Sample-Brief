// LLM-as-judge. Scores a page against rubric.md, in isolated context, and returns a
// structured verdict. Mirrors content-engine's critic subagent: the judge sees the
// rubric and the page, nothing else, and must cite evidence for every score.
//
// Uses the Vercel AI SDK + Claude, so the judge is one
// `generateObject` call with a Zod schema that the model must satisfy.

import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { JudgeReport } from "./types.ts";

const DIMENSIONS = [
  "Navigation & mental flow",
  "Information scent",
  "Task orientation",
  "Agent-readability",
  "Traceable accuracy",
  "Voice",
] as const;

const SYSTEM = `You are a documentation critic. You score one docs page against a fixed rubric.
You see only the rubric and the page. Score each of the six dimensions 0-10, cite specific
evidence from the page for every score (quote a heading, a sentence, or a structural fact),
and give one concrete fix. Be exacting: a docs page that reads fine but buries the reader's
first success is a low flow score, not a high one. Do not reward length. Return only the
structured object.`;

/**
 * Run the judge. Returns null if no ANTHROPIC_API_KEY is set or the ai SDK isn't installed,
 * so the harness degrades to deterministic-only exactly like content-engine's detect_ai.py.
 */
export async function runJudge(pageRaw: string, harnessDir: string): Promise<JudgeReport | null> {
  if (!process.env.ANTHROPIC_API_KEY) return null;

  let generateObject: typeof import("ai").generateObject;
  let anthropic: typeof import("@ai-sdk/anthropic").anthropic;
  let z: typeof import("zod").z;
  try {
    ({ generateObject } = await import("ai"));
    ({ anthropic } = await import("@ai-sdk/anthropic"));
    ({ z } = await import("zod"));
  } catch {
    return null; // deps not installed; deterministic-only
  }

  const rubric = readFileSync(join(harnessDir, "rubric.md"), "utf8");

  const schema = z.object({
    dimensions: z
      .array(
        z.object({
          name: z.enum(DIMENSIONS),
          score: z.number().min(0).max(10),
          severity: z.enum(["none", "minor", "serious", "blocker"]),
          evidence: z.string(),
          fix: z.string(),
        }),
      )
      .length(6),
    overall: z.number().min(0).max(10),
    verdict: z.enum(["ship", "revise", "reject"]),
    summary: z.string(),
  });

  const { object } = await generateObject({
    model: anthropic("claude-opus-4-8"),
    schema,
    system: SYSTEM,
    prompt: `RUBRIC\n\n${rubric}\n\n---\n\nPAGE TO SCORE\n\n${pageRaw}`,
  });

  // Enforce the rubric's own rule: a blocker on any dimension caps the verdict at "revise".
  const hasBlocker = object.dimensions.some((d) => d.severity === "blocker");
  if (hasBlocker && object.verdict === "ship") object.verdict = "revise";

  return object as JudgeReport;
}
