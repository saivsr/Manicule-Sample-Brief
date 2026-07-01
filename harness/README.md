# Docs-quality harness

A small eval harness that scores a docs page against a rubric ([`rubric.md`](rubric.md)) of what
separates docs that reach a working result from docs that only describe a product, so "good docs" is
something you can check on the way past instead of re-arguing every time. Two layers:

1. **Deterministic checks** ([`src/deterministic.ts`](src/deterministic.ts)): regex and
   counting, no model, milliseconds. Three buckets: **flow** (is there a runnable first result
   on one path?), **voice** (no slop, no AI rhythm), **agent** (is there a map for the machine
   reader?). The anti-slop word data is ported from a content pipeline I built; the
   **AI-rhythm checks are new** and catch what a word-list misses.
2. **LLM judge** ([`src/judge.ts`](src/judge.ts)): one `generateObject` call (Vercel AI SDK +
   Claude) that scores the six rubric dimensions 0-10 with cited evidence. Optional; the
   harness runs deterministic-only with no API key.

## Run it

```bash
# Node 24+ (strips TypeScript natively, no install needed):
node src/compare.ts                              # Vapi's page vs. the rebuild
node src/score.ts fixtures/ai-rhythm.slop.md     # score any single page

# Or with Bun (the target stack):
bun install && bun test
```

## What it says on these pages

```
                          overall   flow   voice   agent
my earlier AI-slop draft    26.3     25     53.8     0     <- caught by the rhythm checks
Vapi's current quickstart   41.7     25    100.0     0
the rebuild                100.0    100    100.0   100
```

- **Vapi's voice already scores 100.** Their prose is fine. They lose on **flow** (no runnable
  result on the page, five competing entry points) and on the **agent** map. The gap is in the
  structure, and that is the thing worth fixing first.
- **The gauge does more than rubber-stamp my own writing.** It flags my *own earlier draft* at
  26.3, because the rhythm checks catch the framing devices and negate-then-assert flips that a
  banned-word list waves through. The rebuild is written to pass the same checks, and clearing a
  checklist I designed is expected; the value is that it names Vapi's specific failures and
  enforces the rhythm rules on my own prose.

## The AI-rhythm checks

`checkFramingPhrases` (fail), `checkAntithesis`, `checkAnaphora`, `checkFragmentEmphasis`. These
target the patterns that read as machine-written even with a clean vocabulary: hollow framing
devices, the flip that negates one thing to assert another, runs of sentences that open the same
way, and one-word fragments used for effect. Sources are in the rubric's dimension 6.

## Files

| Path | What |
| --- | --- |
| `rubric.md` | Six dimensions of docs that get a developer to a result. |
| `src/rules.ts` | Banned-word data + AI-rhythm patterns. |
| `src/deterministic.ts` | The checks and bucket scoring. |
| `src/judge.ts` | Claude-as-judge against the rubric (Vercel AI SDK). |
| `src/compare.ts` · `src/score.ts` | CLIs. |
| `src/harness.test.ts` | `bun test` suite. |
| `fixtures/` | Vapi's captured page, my slop draft, for scoring. |
