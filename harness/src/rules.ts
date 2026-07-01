// Rule data for the docs-quality harness.
//
// Two families:
//  1. Banned-word anti-slop, ported from the content-engine skill's score_draft.py
//     (validated against paired AI/human corpora + vendor detector data).
//  2. AI-RHYTHM tells: sentence-level patterns that read as machine-written even with no
//     banned words. These are the ones a word-list misses (the "X, not Y" flip, punchy
//     fragments, "here's the thing" framing). Sourced from published AI-writing-tell guides.

export type Severity = "fail" | "warn";

/** Case-insensitive, word-boundary-matched banned phrases. */
export const BANNED_PHRASES: Array<[string, Severity]> = [
  ["in today's fast-paced world", "fail"],
  ["in an era where", "fail"],
  ["in the world of", "fail"],
  ["in the realm of", "fail"],
  ["at its core", "fail"],
  ["it's worth noting", "fail"],
  ["it is important to note", "fail"],
  ["comprehensive guide", "fail"],
  ["robust solution", "fail"],
  ["delve into", "fail"],
  ["let's dive into", "fail"],
  ["unleash the power of", "fail"],
  ["unlock the potential of", "fail"],
  ["game-changer", "fail"],
  ["in conclusion", "fail"],
  ["the bottom line is", "fail"],
  ["needless to say", "fail"],
  ["at the end of the day", "fail"],
  ["best-in-class", "fail"],
  ["world-class", "fail"],
  ["cutting-edge", "fail"],
  ["state-of-the-art", "fail"],
  ["seamless", "warn"],
  ["effortless", "warn"],
  ["powerful", "warn"],
  ["leverage", "warn"],
  ["utilize", "fail"],
  ["simply", "warn"],
  ["just", "warn"],
];

/** Matched at the start of a sentence (after stripping bullets/whitespace). */
export const THROAT_CLEARING_OPENERS: string[] = [
  "in today's",
  "in conclusion",
  "at the end of the day",
  "needless to say",
  "it's worth noting that",
  "it is important to note that",
];

/** "In our experience" / "we've found" without backing. */
export const EXPERIENCE_CLAIM_PATTERNS: RegExp[] = [
  /\bin our experience\b/i,
  /\bwe've found\b/i,
  /\bwe have found\b/i,
];

export const EM_DASH_CAP_PER_1000 = 0; // docs voice: no em-dashes at all

// --- AI-rhythm tells -------------------------------------------------------

/** Hollow framing devices; removing them loses no meaning. Any hit fails. */
export const AI_FRAMING_PHRASES: string[] = [
  "here's the thing",
  "here is the thing",
  "here's what most",
  "what most people",
  "here's the line that does the work",
  "here is the line that does the work",
  "let's be honest",
  "to be honest",
  "the honest truth",
  "in all honesty",
  "the truth is",
  "make no mistake",
  "that's the beauty",
  "the best part",
  "here's a way to",
  "here is a way to",
  "here's how to",
  "here is how to",
];

/** Generic scene-setting openers ("Picture a...", "Imagine...", "Consider a..."). Matched at
 *  sentence start (mid-sentence "you might consider a..." is fine). Any hit fails. */
export const SCENE_SETTER_OPENERS: RegExp[] = [
  /^picture\s+(?:a|the|this|yourself|how)\b/i,
  /^imagine\b/i,
  /^consider\s+(?:a|the|this|for a moment)\b/i,
  /^visualize\b/i,
  /^think about\b/i,
  /^it'?s\s+\d{1,2}\s*(?:am|pm|o'clock)\b/i,
];

/** Thesis-framing that announces the point instead of making it. Any hit fails. */
export const THESIS_FRAMING: RegExp[] = [
  /\bis the (?:real )?problem worth solving\b/i,
  /\bthe problem worth solving\b/i,
  /\bthe (?:real|actual|core|underlying) problem (?:is|here is)\b/i,
  /\bthat'?s the (?:real )?(?:problem|question|issue)\b/i,
];

/** The "X, not Y" antithesis and its cousins. Warn (real contrasts exist, but they cluster). */
export const ANTITHESIS_PATTERNS: RegExp[] = [
  /\bnot just\b/i,
  /\bisn't just\b/i,
  /\bit's not\b[^.?!]*\bit's\b/i,
  /,\s+not\s+[a-z][a-z-]+[.?!]/i, // "..., not battle-tested."
];

/** Borrowed marketing slogans and honesty-hedges to keep out of the prose. */
export const FEEDBACK_BANNED: Array<[string, Severity]> = [
  ["zero-to-aha", "fail"],
  ["aha moment", "warn"],
  ["honest notes", "warn"],
  ["honest truth", "fail"],
];

/** Headings that mark a distinct "way to start", used to detect entry-point sprawl. */
export const ENTRY_POINT_KEYWORDS: string[] = [
  "dashboard",
  "web sdk",
  "client sdk",
  "cli",
  "api",
  "use cases",
  "ways to build",
  "quickstart",
  "no code",
];
