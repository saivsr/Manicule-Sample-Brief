# AGENTS.md

Guidance for a coding agent working in this repository. If you are Claude Code, Cursor, or a similar
agent, read this first. It is the kind of map the repo's own essay argues every project should ship:
written to the tasks you will actually do here, not a tour of the product.

## What this repo is

A work sample for a developer-documentation studio. It rebuilds Vapi's quickstart, then proves the
rebuild with tooling.

- `site/` holds two rendered, self-contained HTML pages: `index.html` (the rebuilt Vapi quickstart)
  and `essay.html` (the companion essay). No build step; they deploy as a static site.
- `blog/docs-your-agents-cant-test.md` is the essay's Markdown source. `site/essay.html` is the
  rendered version of it. Keep the two in sync when you edit prose.
- `rebuild/` is the drop-in source for the quickstart: `quickstart.mdx`, its `.md` twin, and a
  Vapi-facing `AGENTS.md`.
- `eval/` is the agent-comprehension eval. `grade.ts` scores an agent's integration code against
  Vapi's OpenAPI spec; `runs/` holds the raw agent outputs; `RESULTS.md` explains the method.
- `geo/` is a static AEO/GEO/SEO checker (`check.ts`) with its scorecard.
- `harness/` is the docs-quality scorer and the editorial `lint` gate.
- `scout.md` is the scouting memo and `VERIFICATION.md` is the spec check against Vapi's OpenAPI.

## Environment

- Node 24 or newer. Every TypeScript file runs directly with `node file.ts`. There is no build step
  and there are no dependencies.
- The anti-slop scorer is an external skill at
  `~/.claude/skills/content-engine/scripts/score_draft.py` (Python 3, standard library only).

## Commands

```bash
# Editorial gate over every deliverable prose file. Exit it clean before shipping prose.
node harness/src/lint.ts

# Score one agent run for the eval (correctness is defined by Vapi's OpenAPI spec).
node eval/grade.ts eval/runs/A1.txt

# Score a rendered page for search, answer, and generative engines.
node geo/check.ts site/essay.html site/index.html

# Serve the site locally.
python3 -m http.server --directory site 8000
```

## Rules for editing

1. No em-dashes, in prose or in code comments. The lint gate and the content-engine scorer both fail
   on them.
2. Run `node harness/src/lint.ts` before you ship any prose change. It catches slop, AI-rhythm tells,
   scene-setting openers, and parroted jargon. Fix every failure it reports.
3. When you change essay prose, change it in both `blog/docs-your-agents-cant-test.md` and
   `site/essay.html`. They must match.
4. Structured data in the site pages must be true: a real author, accurate dates, and steps that
   match the page. Do not invent schema to raise a `geo/check.ts` score.
5. Do not claim any code was run live against a paid API. Correctness here comes from Vapi's
   published spec, not from execution.
6. A push to `main` redeploys the site on Vercel. `/` serves the quickstart and `/essay` serves the
   essay.

## A note on this file

The essay in this repo argues that an `AGENTS.md` is not a guaranteed win, and that its value should
be measured rather than assumed. This one is kept short and tied to the commands and rules an agent
needs here. If it drifts from the repo it is worse than nothing, so update it when you change the
layout or the tooling.
