// Shared types for the docs-quality harness.

export type Status = "pass" | "warn" | "fail";

/** One deterministic check against a page. */
export interface CheckResult {
  id: string;
  bucket: Bucket;
  status: Status;
  headline: string;
  details: string[];
  /** Points earned toward this bucket's score, out of `possible`. */
  earned: number;
  possible: number;
}

/** The three things a docs page has to get right. */
export type Bucket = "flow" | "voice" | "agent";

export const BUCKET_LABEL: Record<Bucket, string> = {
  flow: "Navigation & task flow",
  voice: "Voice & anti-slop",
  agent: "Agent-readability",
};

/** A page loaded from disk, with the directory context the agent checks need. */
export interface Page {
  path: string;
  dir: string;
  raw: string;
  /** Sibling filenames in the same directory (for AGENTS.md / .md-twin checks). */
  siblings: string[];
}

export interface DeterministicReport {
  checks: CheckResult[];
  buckets: Record<Bucket, number>; // 0-100 per bucket
  overall: number; // 0-100, mean of buckets
}

/** One dimension of the LLM judge's rubric verdict. */
export interface JudgeDimension {
  name: string;
  score: number; // 0-10
  severity: "none" | "minor" | "serious" | "blocker";
  evidence: string;
  fix: string;
}

export interface JudgeReport {
  dimensions: JudgeDimension[];
  overall: number; // 0-10
  verdict: "ship" | "revise" | "reject";
  summary: string;
}
