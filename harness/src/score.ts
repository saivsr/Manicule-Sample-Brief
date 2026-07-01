// Score a single docs page. Usage: bun run src/score.ts <path-to-page>
//
// Exit codes mirror content-engine's score_draft.py:
//   0 = no failing checks   1 = at least one failing check   2 = warnings only

import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { runDeterministic } from "./deterministic.ts";
import { runJudge } from "./judge.ts";
import { loadPage, formatDeterministic, formatJudge } from "./report.ts";

const harnessDir = join(dirname(fileURLToPath(import.meta.url)), "..");

async function main() {
  const target = process.argv[2];
  if (!target) {
    console.error("usage: bun run src/score.ts <path-to-page>");
    process.exit(64);
  }

  const page = loadPage(target);
  const det = runDeterministic(page);

  console.log(`\nScoring ${target}\n`);
  console.log(formatDeterministic(det));
  console.log("");

  const judge = await runJudge(page.raw, harnessDir);
  console.log(formatJudge(judge));
  console.log("");

  const anyFail = det.checks.some((c) => c.status === "fail");
  const anyWarn = det.checks.some((c) => c.status === "warn");
  process.exit(anyFail ? 1 : anyWarn ? 2 : 0);
}

main();
