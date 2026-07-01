// lint.ts: the editorial gate. Runs every deterministic check over all deliverable prose and
// exits non-zero on any FAIL, so no draft ships with an em-dash, an AI-rhythm tell, a banned
// phrase, or a borrowed slogan. Pair it with the isolated critic
// (see ../rubric.md) for the things regex cannot catch.
//
// Usage: node src/lint.ts            (lints the default deliverable set)
//        node src/lint.ts <files...> (lints specific files)

import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { existsSync } from "node:fs";
import { runDeterministic } from "./deterministic.ts";
import { loadPage } from "./report.ts";

const root = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

// Deliverable prose a reader sees. The editorial rules apply here. Rule-definition files
// (rubric.md) are excluded because they necessarily quote the patterns they ban.
const DEFAULT = [
  "README.md",
  "AGENTS.md",
  "scout.md",
  "VERIFICATION.md",
  "rebuild/quickstart.md",
  "rebuild/quickstart.mdx",
  "rebuild/AGENTS.md",
  "eval/README.md",
  "eval/RESULTS.md",
  "blog/docs-your-agents-cant-test.md",
];

const files = process.argv.slice(2).length
  ? process.argv.slice(2)
  : DEFAULT.map((f) => join(root, f)).filter(existsSync);

let violations = 0;
for (const f of files) {
  const rep = runDeterministic(loadPage(f));
  // Editorial gate = the voice bucket only (slop, em-dashes, AI-rhythm, jargon). The flow/agent
  // buckets are for scoring a docs *page*, not for linting prose, so they are not applied here.
  const fails = rep.checks.filter((c) => c.bucket === "voice" && c.status === "fail");
  const short = f.replace(root + "/", "");
  if (fails.length === 0) {
    console.log(`  ok    ${short}`);
  } else {
    violations += fails.length;
    console.log(`  FAIL  ${short}`);
    for (const c of fails) console.log(`          ${c.headline}${c.details.length ? ": " + c.details.join(", ") : ""}`);
  }
}

console.log(`\n${violations === 0 ? "clean" : violations + " violation(s)"} across ${files.length} files`);
process.exit(violations === 0 ? 0 : 1);
