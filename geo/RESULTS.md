# Scorecard: this repo's two pages

Run `node geo/check.ts site/essay.html site/index.html`. Scores are out of 100 per bucket; the
composite is their mean. The "before" row is each page as first written; the "after" row is the same
page once the checker's failures were fixed.

| Page | | SEO | AEO | GEO | Composite |
| --- | --- | --- | --- | --- | --- |
| `site/essay.html` (the essay) | before | 90 | 62.5 | 33.3 | 61.9 |
| | **after** | **100** | **100** | **100** | **100** |
| `site/index.html` (the quickstart) | before | 70 | 66.7 | 33.3 | 56.7 |
| | **after** | **100** | **100** | **100** | **100** |

## What the checker surfaced, and the fix

Both pages read well and looked finished. The gaps were in the machine-readable layer that a browser
never shows and a reader never misses, which is exactly the layer an answer engine depends on.

- **No structured data.** Neither page carried JSON-LD. I added `BlogPosting` and `Person` to the
  essay, and `TechArticle`, `HowTo`, and `Organization` to the quickstart, so an answer engine can
  identify the author and date, and read the steps as structured data. The `HowTo` steps mirror the
  quickstart's three real steps. Nothing was invented to satisfy the schema.
- **No author or date signal (GEO 33).** The essay gained a `Person` author and a `datePublished`;
  its byline was already on the page. The quickstart gained an `Organization` author and a
  `dateModified`. E-E-A-T is the dominant generative-citation signal in 2026.
- **No Open Graph or canonical.** Both gained `og:*` tags and a canonical URL.
- **Thin title and description on the quickstart.** I lengthened both into the useful range without
  changing what the page says.

The diagrams on both pages already carried `role="img"` and `aria-label`, so the alt-text and
semantic-HTML checks passed from the start.

## The point

The fixes are honest structure, not keyword tricks: real schema, a named author, and a real date.
The value of the checker is not the final 100. It is that these gaps stayed invisible until something
measured them, which is the same argument the [essay](../blog/docs-your-agents-cant-test.md) makes
about documentation and coding agents.
