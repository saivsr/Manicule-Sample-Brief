# Docs quality rubric

The judgment behind the scorer, written down so it applies the same way twice. The six
dimensions come from what separates docs that get a developer to a working result from docs
that only describe a product:

- A developer wants a running result fast, on one path, not a tour of the product.
- Every command and snippet has to be real. Docs that lie about the product cost trust.
- Navigation carries more weight than prose: the reader has to find the path before reading it.
- Docs are read by agents as much as by people, so the machine reader needs a map too.

Each dimension is scored 0-10 by the LLM judge (`src/judge.ts`), which must cite evidence
from the page. The deterministic layer (`src/deterministic.ts`) enforces the checkable parts.

---

## 1. First result (does the reader reach a working result?)

- **10** One path to a running result, reachable on the page in about five minutes.
- **5** A result exists but the reader has to leave the page or pick between routes first.
- **0** No runnable result. The page describes the product instead of starting it.

Cite: where the first working result appears, and how many routes the reader must choose between.

## 2. Runnable and true (no docs that lie)

- **10** Every command and snippet is real and current, and would run as written.
- **5** Mostly right, with a stale value or an unexplained placeholder.
- **0** Code would not run, or invents endpoints/fields the product does not have.

Cite: any command you would not trust. (This sample uses the target's own snippets to hold the line here.)

## 3. One job, sequenced by need

- **10** The page does one job. Secondary choices are branches taken *after* first success, as links.
- **5** One job, but reference material sits on the critical path.
- **0** Several jobs share one page; the reader tours the product before running anything.

Cite: the section order, and anything on the path that a first-timer does not need yet.

## 4. Agent-readability

- **10** Ships an `AGENTS.md` with an explicit capability map, a clean `.md` twin, and points agents to it.
- **5** Some affordance (an `llms.txt` index) but no capability map for an agent to act on.
- **0** Nothing for the machine reader; it must parse rendered HTML and infer what the product does.

Cite: presence of `AGENTS.md`, a `.md` twin, and whether capabilities are explicit.
Note: `AGENTS.md` is the established convention (60k+ repos); `llms.txt` is a nice-to-have (~10% adoption).

## 5. Voice

- **10** Plain, outcome-first, in the product's own register. Short words, real verbs, no filler.
- **5** Clear but generic, or occasional hedging and padding.
- **0** Corporate or throat-clearing register; banned phrases.

Cite: the strongest and weakest sentences.

## 6. No AI rhythm

The tells a word-list misses: a flip that negates one thing to assert another where a plain
statement would do, a one-word fragment dropped in for effect, three parallel clauses where one
would carry the point, a run of sentences that all open on the same word, and a framing device
that adds nothing once you delete it.

- **10** None present. Sentence length varies, and contrasts do real work instead of decorating.
- **5** A couple of tells.
- **0** Clusters of them; the prose has the balanced, breathless cadence of a model.

Cite: any tell, quoted. (The deterministic layer flags these too; see `checkFramingPhrases`,
`checkAntithesis`, `checkAnaphora`, `checkFragmentEmphasis`.)

---

**Verdict:** ship if the mean is ≥ 8.0 with no dimension below 5. A single dimension at 0
caps the verdict at *revise*.
