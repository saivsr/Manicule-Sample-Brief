# geo: an AEO / GEO / SEO checker for a rendered page

A page is discoverable only if the machines that read it can parse it. This is a small static
checker that scores a rendered HTML page for classic search, answer engines, and generative models.
It runs the loop the rest of this repo runs: it measures a page, and it re-measures after you fix
what it flags.

```bash
node geo/check.ts site/essay.html site/index.html
```

It runs on Node's native TypeScript with nothing to install, and it never touches the network or an
API key. Every signal is read from the page source with string extraction, the way an answer
engine's fetcher sees it.

## What it checks

About twenty checks in three buckets, each computable from the HTML alone.

**SEO**, the classic crawl and rank hygiene:

- a title tag in the 30 to 70 character range
- a meta description in the 80 to 165 character range
- exactly one `H1`, with no skipped heading levels
- internal and external links
- a mobile viewport and a canonical URL

**AEO**, what an answer engine can extract:

- JSON-LD schema, and how many distinct types it declares
- paragraphs short enough to chunk for retrieval
- lists or tables for structured points
- bolded key terms and scannable `H2` sections
- question-form headings (a bonus, not a requirement)

**GEO**, the signals a generative model uses to cite:

- an author or publisher declared in schema
- a publication or modified date
- a named byline
- Open Graph tags
- alt text on every image and figure
- semantic HTML and a density of verifiable facts

Each check returns pass, warn, or fail and earns points toward its bucket. The composite is the mean
of the three buckets.

## Calibration

The checker is tuned for documentation and essays, not marketing pages. Question-form headings, FAQ
schema, and tables score as bonuses when present and are never penalised when absent, so the tool
never pushes editorial prose toward a fake FAQ shape. A docs page authored by a company reads as an
`Organization`; an essay reads as a `Person`. Both satisfy the author signal.

## Grounded in 2026 reality

`llms.txt` is reported but never scored. Google [confirmed in June 2026](https://www.digitalapplied.com/blog/google-llms-txt-no-seo-value-lighthouse-audit-2026)
that it does nothing for Google Search or AI Overviews, so treating its presence as a ranking signal
would be measuring hype. The checker weights what the current evidence supports: structured data,
E-E-A-T, and content an engine can actually extract.

See [RESULTS.md](RESULTS.md) for the scorecard on this repo's two pages, before and after the fixes
the checker surfaced.
