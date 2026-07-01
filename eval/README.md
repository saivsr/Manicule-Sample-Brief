# Agent-comprehension eval

Coding agents read docs to write integration code, so a page's real test is whether one can build
from it. This eval gives a coding agent a task and two versions of the docs, then scores whether
the code it writes is correct against Vapi's own OpenAPI spec.

- `task.md`: the identical task every agent gets.
- `runs/A1..A3`: code written from Vapi's current getting-started page.
- `runs/B1..B3`: code written from the rebuild + `AGENTS.md`.
- `grade.ts`: the condition-blind, deterministic grader (correctness defined by Vapi's spec).
- `RESULTS.md`: the results, and where the test is limited.

**Result: current page averages 62/100; rebuild + `AGENTS.md` scores 100/100.** An agent that
refuses to hallucinate cannot complete the integration from the current page; it can from the rebuild.

Reproduce a single grade:

```bash
node grade.ts runs/B1.txt
```

Grade all runs:

```bash
for f in runs/*.txt; do echo "$f"; node grade.ts "$f" | grep '"score"'; done
```
