// Deterministic docs-quality checks. No model, runs in milliseconds.
// Three buckets, each derived from what separates usable docs from a product tour:
//   flow  -> a runnable first result on one path, not a tour of the product.
//   voice -> "no docs that lie"; plain prose with no slop and no AI rhythm tells.
//   agent -> docs are read by agents too; ship a map for them.

import {
  BANNED_PHRASES,
  THROAT_CLEARING_OPENERS,
  EXPERIENCE_CLAIM_PATTERNS,
  EM_DASH_CAP_PER_1000,
  AI_FRAMING_PHRASES,
  ANTITHESIS_PATTERNS,
  SCENE_SETTER_OPENERS,
  THESIS_FRAMING,
  ENTRY_POINT_KEYWORDS,
  FEEDBACK_BANNED,
} from "./rules.ts";
import type { Bucket, CheckResult, DeterministicReport, Page, Status } from "./types.ts";

// --- text helpers ----------------------------------------------------------

function stripCode(raw: string): string {
  return raw
    .replace(/<!--[\s\S]*?-->/g, "") // HTML comments are not prose
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`[^`]*`/g, "");
}
function words(text: string): string[] {
  return text.match(/[A-Za-z0-9']+/g) ?? [];
}
function sentences(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+(?=[A-Z"'(])/)
    .map((s) => s.trim())
    .filter(Boolean);
}
function headings(raw: string, levels: number[] = [1, 2, 3, 4]): string[] {
  return raw
    .split("\n")
    .map((l) => l.match(/^(#{1,6})\s+(.*)$/))
    .filter((m): m is RegExpMatchArray => !!m && levels.includes(m[1].length))
    .map((m) => m[2].trim());
}
function codeBlocks(raw: string): string[] {
  return [...raw.matchAll(/```[\s\S]*?```/g)].map((m) => m[0]);
}
function pass(
  id: string,
  bucket: Bucket,
  headline: string,
  earned: number,
  possible: number,
  status: Status = "pass",
  details: string[] = [],
): CheckResult {
  return { id, bucket, status, headline, earned, possible, details };
}

// --- flow: zero to a working result, one path ------------------------------

function checkOutcomePromise(p: Page): CheckResult {
  const top = p.raw.slice(0, Math.floor(p.raw.length * 0.4)).toLowerCase();
  const hit = /(in (?:about )?(?:five|5) minutes|what you'll build|you will build|you'll have a)/.test(top);
  return hit
    ? pass("outcome_promise", "flow", "Promises a concrete first result up front", 2, 2)
    : pass("outcome_promise", "flow", "No outcome promise near the top", 0, 2, "fail");
}

function checkRunnableResult(p: Page): CheckResult {
  const doesWork = codeBlocks(p.raw).some((b) => {
    const body = b
      .split("\n")
      .filter((l) => l.trim() && !/install\.sh|npm install|pnpm add|pip install|yarn add|curl -sSL/i.test(l))
      .join("\n");
    return /api\.\w+\.\w+|\.start\(|curl -X (POST|PUT)|await |fetch\(|\.create\(/.test(body);
  });
  return doesWork
    ? pass("runnable_result", "flow", "A code block does the real task, not just install", 2, 2)
    : pass("runnable_result", "flow", "No runnable result on the page (install commands only)", 0, 2, "fail", [
        "The reader cannot reach a working result without leaving the page.",
      ]);
}

function checkSinglePath(p: Page): CheckResult {
  const subs = headings(p.raw, [2, 3]).map((h) => h.toLowerCase());
  const entries = subs.filter((h) => ENTRY_POINT_KEYWORDS.some((k) => h === k || h.startsWith(k) || h.includes(k)));
  if (entries.length >= 3)
    return pass("single_path", "flow", `${entries.length} competing entry points, no single route`, 0, 2, "fail", entries);
  if (entries.length === 2)
    return pass("single_path", "flow", "Two entry points; a default would help", 1, 2, "warn", entries);
  return pass("single_path", "flow", "One path through the page", 2, 2);
}

function checkKeySetup(p: Page): CheckResult {
  const t = p.raw.toLowerCase();
  const named = /\b(private key|public key|api key|api-key|access token)\b/.test(t);
  const sourced = /\bdashboard\b|\bfrom the\b|copy .{0,20}key|environment variable/.test(t);
  return named && sourced
    ? pass("key_setup", "flow", "Says which keys you need and where to get them", 2, 2)
    : pass("key_setup", "flow", "Credential setup missing or unclear", 0, 2, "fail");
}

// --- voice: no slop, no AI rhythm ------------------------------------------

function checkBannedPhrases(p: Page): CheckResult {
  const prose = stripCode(p.raw).toLowerCase();
  const fails: string[] = [];
  const warns: string[] = [];
  for (const [phrase, sev] of BANNED_PHRASES) {
    if (new RegExp(`\\b${phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(prose))
      (sev === "fail" ? fails : warns).push(phrase);
  }
  if (fails.length) return pass("banned_phrases", "voice", "Banned slop phrases", 0, 2, "fail", fails);
  if (warns.length) return pass("banned_phrases", "voice", "Watch-list words", 1, 2, "warn", warns);
  return pass("banned_phrases", "voice", "No banned or watch-list words", 2, 2);
}

function checkEmDash(p: Page): CheckResult {
  const n = (stripCode(p.raw).match(/—/g) ?? []).length;
  const per1000 = (n / (words(stripCode(p.raw)).length || 1)) * 1000;
  return per1000 <= EM_DASH_CAP_PER_1000
    ? pass("em_dash", "voice", "No em-dashes", 1, 1)
    : pass("em_dash", "voice", `${n} em-dash(es)`, 0, 1, "fail");
}

function checkThroatClearing(p: Page): CheckResult {
  const hits = sentences(stripCode(p.raw)).filter((s) => {
    const o = s.replace(/^[-*>\s]+/, "").toLowerCase();
    return THROAT_CLEARING_OPENERS.some((t) => o.startsWith(t));
  });
  return hits.length
    ? pass("throat_clearing", "voice", "Throat-clearing openers", 0, 1, "fail", hits)
    : pass("throat_clearing", "voice", "No throat-clearing openers", 1, 1);
}

function checkExperienceClaims(p: Page): CheckResult {
  return EXPERIENCE_CLAIM_PATTERNS.some((re) => re.test(stripCode(p.raw)))
    ? pass("experience_claims", "voice", "Unbacked experience claim", 0, 1, "warn")
    : pass("experience_claims", "voice", "No unbacked experience claims", 1, 1);
}

function checkFeedbackTerms(p: Page): CheckResult {
  const prose = stripCode(p.raw).toLowerCase();
  const fails: string[] = [];
  const warns: string[] = [];
  for (const [term, sev] of FEEDBACK_BANNED) {
    if (prose.includes(term)) (sev === "fail" ? fails : warns).push(term);
  }
  if (fails.length) return pass("feedback_terms", "voice", "Parrots a borrowed slogan", 0, 2, "fail", fails);
  if (warns.length) return pass("feedback_terms", "voice", "Edges toward a borrowed slogan", 1, 2, "warn", warns);
  return pass("feedback_terms", "voice", "No borrowed slogans", 2, 2);
}

// AI-rhythm tells: the patterns a word-list misses.

function checkFramingPhrases(p: Page): CheckResult {
  const t = stripCode(p.raw).toLowerCase();
  const hits = AI_FRAMING_PHRASES.filter((ph) => t.includes(ph));
  return hits.length
    ? pass("ai_framing", "voice", "Hollow framing device ('here's the thing')", 0, 2, "fail", hits)
    : pass("ai_framing", "voice", "No hollow framing devices", 2, 2);
}

function checkSceneSetters(p: Page): CheckResult {
  // Scene-setting is a paragraph move ("Picture a...", "Imagine..."), so check the first
  // sentence of each prose block. Mid-sentence "you might consider a webhook" is left alone.
  const hits: string[] = [];
  for (const block of stripCode(p.raw).split(/\n\s*\n/)) {
    const t = block.trim();
    if (!t || /^[#>|]/.test(t)) continue; // skip headings, blockquotes, tables
    const first = (sentences(t)[0] ?? t).replace(/^[-*>\s]+/, "");
    if (SCENE_SETTER_OPENERS.some((re) => re.test(first))) hits.push(first.slice(0, 55));
  }
  return hits.length
    ? pass("ai_scene_setter", "voice", "Scene-setting opener ('Picture a...', 'Imagine...')", 0, 2, "fail", hits)
    : pass("ai_scene_setter", "voice", "No scene-setting openers", 2, 2);
}

function checkThesisFraming(p: Page): CheckResult {
  const prose = stripCode(p.raw);
  const hits = THESIS_FRAMING.map((re) => prose.match(re)?.[0]).filter(Boolean) as string[];
  return hits.length
    ? pass("ai_thesis_framing", "voice", "Thesis-framing filler ('the problem worth solving')", 0, 2, "fail", hits)
    : pass("ai_thesis_framing", "voice", "No thesis-framing filler", 2, 2);
}

function checkAntithesis(p: Page): CheckResult {
  const prose = stripCode(p.raw);
  const hits = ANTITHESIS_PATTERNS.map((re) => prose.match(re)?.[0]).filter(Boolean) as string[];
  if (hits.length >= 2) return pass("ai_antithesis", "voice", "Repeated 'X, not Y' antithesis", 0, 2, "fail", hits);
  if (hits.length === 1) return pass("ai_antithesis", "voice", "An 'X, not Y' antithesis", 1, 2, "warn", hits);
  return pass("ai_antithesis", "voice", "No 'X, not Y' antithesis", 2, 2);
}

// Common openers are not anaphora; the tell is repeating a distinctive word.
const ANAPHORA_STOPWORDS = new Set([
  "the", "a", "an", "this", "that", "these", "those", "it", "you", "we", "i", "they",
  "he", "she", "in", "on", "to", "for", "and", "but", "or", "if", "when", "your", "our",
]);

function checkAnaphora(p: Page): CheckResult {
  const firsts = sentences(stripCode(p.raw)).map((s) => (s.match(/[A-Za-z']+/)?.[0] ?? "").toLowerCase());
  let run = 1;
  for (let i = 1; i < firsts.length; i++) {
    const w = firsts[i];
    if (w && w === firsts[i - 1] && !ANAPHORA_STOPWORDS.has(w)) run++;
    else run = 1;
    if (run >= 3) return pass("ai_anaphora", "voice", `Anaphora: 3+ sentences opening "${w}"`, 0, 1, "warn");
  }
  return pass("ai_anaphora", "voice", "No anaphora runs", 1, 1);
}

function checkFragmentEmphasis(p: Page): CheckResult {
  // Work paragraph-by-paragraph, joining soft-wrapped lines first, so a wrapped
  // clause is not mistaken for a standalone fragment. Skip headings, lists, tables.
  const frags: string[] = [];
  for (const para of stripCode(p.raw).split(/\n\s*\n/)) {
    const head = para.trim();
    if (!head || /^[#>\-*|\d]/.test(head)) continue;
    const joined = para.replace(/\s*\n\s*/g, " ").trim();
    for (const s of sentences(joined)) {
      if (words(s).length > 0 && words(s).length <= 2 && /[.!?]$/.test(s)) frags.push(s);
    }
  }
  return frags.length >= 2
    ? pass("ai_fragment", "voice", "Fragment-for-emphasis ('Reliably. Blazing.')", 0, 1, "warn", frags)
    : pass("ai_fragment", "voice", "No fragment-for-emphasis", 1, 1);
}

// --- agent: is there a map for the machine reader? -------------------------

function checkAgentsMd(p: Page): CheckResult {
  return p.siblings.includes("AGENTS.md")
    ? pass("agents_md", "agent", "Ships an AGENTS.md capability map", 3, 3)
    : pass("agents_md", "agent", "No AGENTS.md", 0, 3, "fail");
}

function checkMdTwin(p: Page): CheckResult {
  const stem = (p.path.split("/").pop() ?? "").replace(/\.(md|mdx)$/, "");
  const twin =
    (p.path.endsWith(".mdx") && p.siblings.includes(`${stem}.md`)) ||
    (p.path.endsWith(".md") && p.siblings.includes(`${stem}.mdx`));
  return twin
    ? pass("md_twin", "agent", "Has a clean Markdown twin", 2, 2)
    : pass("md_twin", "agent", "No clean Markdown twin", 0, 2, "fail");
}

function checkInPageAgentPath(p: Page): CheckResult {
  return /AGENTS\.md/.test(p.raw) || /\|\s*(verb|call|capability)\s*\|/i.test(p.raw)
    ? pass("in_page_agent_path", "agent", "Points agents to a real map", 2, 2)
    : pass("in_page_agent_path", "agent", "No agent entry point on the page", 0, 2, "fail");
}

// --- aggregate -------------------------------------------------------------

const CHECKS = [
  checkOutcomePromise,
  checkRunnableResult,
  checkSinglePath,
  checkKeySetup,
  checkBannedPhrases,
  checkEmDash,
  checkThroatClearing,
  checkExperienceClaims,
  checkFeedbackTerms,
  checkFramingPhrases,
  checkSceneSetters,
  checkThesisFraming,
  checkAntithesis,
  checkAnaphora,
  checkFragmentEmphasis,
  checkAgentsMd,
  checkMdTwin,
  checkInPageAgentPath,
];

export function runDeterministic(page: Page): DeterministicReport {
  const checks = CHECKS.map((fn) => fn(page));
  const buckets = { flow: 0, voice: 0, agent: 0 } as Record<Bucket, number>;
  for (const b of ["flow", "voice", "agent"] as Bucket[]) {
    const group = checks.filter((c) => c.bucket === b);
    const earned = group.reduce((a, c) => a + c.earned, 0);
    const possible = group.reduce((a, c) => a + c.possible, 0) || 1;
    buckets[b] = Math.round((earned / possible) * 1000) / 10;
  }
  const overall = Math.round(((buckets.flow + buckets.voice + buckets.agent) / 3) * 10) / 10;
  return { checks, buckets, overall };
}
