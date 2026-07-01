// geo/check.ts : a static AEO / GEO / SEO checker for a rendered HTML page.
//
// Dependency-free (Node 24 native TypeScript). No API keys, no network: every signal
// is read from the page source with string/regex extraction, the same way an answer
// engine's fetcher sees it.
//
// Three buckets:
//   SEO  : classic crawl/rank hygiene (title, meta, one H1, hierarchy, canonical).
//   AEO  : answer-engine extractability (schema, chunkable paragraphs, structure).
//   GEO  : generative-engine citation signals (author/Person schema, dates, E-E-A-T,
//          Open Graph, alt text, semantic HTML, verifiable facts).
//
// Calibrated for docs and essays, not marketing pages: question-form headings, FAQ
// schema, and tables are scored as bonuses when present and never penalised when
// absent, so the tool never pushes editorial prose toward a fake FAQ shape.
//
// Grounded in 2026 reality: `llms.txt` is reported only (Google confirmed in June 2026
// that it does nothing for Google Search or AI Overviews), so it never scores.
//
// Usage: node geo/check.ts <file.html> [<file2.html> ...]

import { readFileSync } from "node:fs";

type Status = "pass" | "warn" | "fail" | "info";
type Bucket = "SEO" | "AEO" | "GEO";
interface Check {
  id: string;
  bucket: Bucket;
  label: string;
  status: Status;
  earned: number;
  max: number; // 0 => informational, excluded from the score
  detail: string;
}

// --- extraction helpers ----------------------------------------------------

const strip = (s: string): string =>
  s.replace(/<[^>]+>/g, " ").replace(/&[a-z]+;/gi, " ").replace(/\s+/g, " ").trim();

const region = (html: string, tag: string): string =>
  html.match(new RegExp(`<${tag}[\\s\\S]*?</${tag}>`, "i"))?.[0] ?? "";

function attr(tag: string, name: string): string | null {
  const m =
    tag.match(new RegExp(`${name}\\s*=\\s*"([^"]*)"`, "i")) ??
    tag.match(new RegExp(`${name}\\s*=\\s*'([^']*)'`, "i"));
  return m ? m[1] : null;
}

function metaContent(head: string, key: "name" | "property", val: string): string | null {
  const tag = head.match(new RegExp(`<meta[^>]*${key}\\s*=\\s*["']${val}["'][^>]*>`, "i"))?.[0];
  return tag ? attr(tag, "content") : null;
}

function headings(body: string): { level: number; text: string }[] {
  return [...body.matchAll(/<h([1-6])[^>]*>([\s\S]*?)<\/h\1>/gi)].map((m) => ({
    level: Number(m[1]),
    text: strip(m[2]),
  }));
}

function paragraphs(body: string): string[] {
  return [...body.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)].map((m) => strip(m[1])).filter(Boolean);
}

function jsonLd(html: string): unknown[] {
  const blocks = [
    ...html.matchAll(/<script[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi),
  ].map((m) => m[1]);
  const out: unknown[] = [];
  for (const b of blocks) {
    try {
      const p = JSON.parse(b);
      Array.isArray(p) ? out.push(...p) : out.push(p);
    } catch {
      /* invalid JSON-LD is caught by the schema check */
    }
  }
  return out;
}

function ldTypes(objs: unknown[]): string[] {
  const types: string[] = [];
  const walk = (o: unknown): void => {
    if (!o || typeof o !== "object") return;
    const rec = o as Record<string, unknown>;
    if (rec["@type"]) ([] as string[]).concat(rec["@type"] as string).forEach((t) => types.push(String(t)));
    for (const v of Object.values(rec)) {
      if (Array.isArray(v)) v.forEach(walk);
      else if (v && typeof v === "object") walk(v);
    }
  };
  objs.forEach(walk);
  return types;
}

const has = (types: string[], name: string): boolean =>
  types.some((t) => t.toLowerCase() === name.toLowerCase());

// --- the checks ------------------------------------------------------------

function run(file: string): Check[] {
  const html = readFileSync(file, "utf8");
  const head = region(html, "head");
  const body = region(html, "body") || html;
  const heads = headings(body);
  const paras = paragraphs(body);
  const ld = jsonLd(html);
  const types = ldTypes(ld);
  const c: Check[] = [];
  const add = (
    bucket: Bucket,
    id: string,
    label: string,
    ok: boolean,
    max: number,
    detail: string,
    partial = false,
  ) =>
    c.push({
      bucket,
      id,
      label,
      status: max === 0 ? "info" : ok ? "pass" : partial ? "warn" : "fail",
      earned: max === 0 ? 0 : ok ? max : partial ? Math.round(max / 2) : 0,
      max,
      detail,
    });

  // ---- SEO ----
  const title = strip(region(head, "title"));
  add("SEO", "title", "Title tag, 30-70 chars", !!title && title.length >= 30 && title.length <= 70, 2,
    title ? `"${title}" (${title.length})` : "missing", !!title);

  const desc = metaContent(head, "name", "description");
  add("SEO", "meta_description", "Meta description, 80-165 chars",
    !!desc && desc.length >= 80 && desc.length <= 165, 2,
    desc ? `${desc.length} chars` : "missing", !!desc);

  const h1s = heads.filter((h) => h.level === 1);
  add("SEO", "single_h1", "Exactly one H1", h1s.length === 1, 2,
    `${h1s.length} H1${h1s.length === 1 ? "" : "s"}`);

  let skips = 0;
  for (let i = 1; i < heads.length; i++) if (heads[i].level - heads[i - 1].level > 1) skips++;
  add("SEO", "hierarchy", "No skipped heading levels", skips === 0, 1,
    skips ? `${skips} skipped jump(s)` : "sequential");

  const links = [...body.matchAll(/<a\s[^>]*href\s*=\s*["']([^"']+)["']/gi)].map((m) => m[1]);
  const internal = links.filter((h) => h.startsWith("/") || h.startsWith("#") || h.startsWith("./")).length;
  const external = links.filter((h) => /^https?:/i.test(h)).length;
  add("SEO", "links", "Internal + external links", internal + external >= 2, 1,
    `${internal} internal, ${external} external`, internal + external >= 1);

  add("SEO", "viewport", "Mobile viewport meta", /width=device-width/i.test(metaContent(head, "name", "viewport") ?? ""), 1,
    metaContent(head, "name", "viewport") ? "present" : "missing");

  const canonical = head.match(/<link[^>]*rel\s*=\s*["']canonical["'][^>]*>/i)?.[0];
  add("SEO", "canonical", "Canonical URL", !!canonical, 1, canonical ? "present" : "missing");

  // ---- AEO ----
  const titleQ = /^(how|what|why|can|is|should|when|where|does|do)\b/i.test(title) || title.includes("?");
  const qHeads = heads.filter((h) => /\?$/.test(h.text) || /^(how|what|why|can|is|should|when|where)\b/i.test(h.text)).length;
  add("AEO", "question_form", "Question-form title or headings (bonus)", titleQ || qHeads > 0, titleQ || qHeads > 0 ? 1 : 0,
    titleQ ? "title is a question" : qHeads ? `${qHeads} question headings` : "n/a for this content type");

  const recognised = ["Article", "TechArticle", "BlogPosting", "HowTo", "FAQPage", "WebPage", "Person", "Organization"];
  const known = types.filter((t) => recognised.some((r) => r.toLowerCase() === t.toLowerCase()));
  add("AEO", "schema_present", "Valid JSON-LD schema present", known.length > 0, 2,
    known.length ? known.join(", ") : (ld.length ? "JSON-LD present but unrecognised type" : "none"));

  const distinct = new Set(types.map((t) => t.toLowerCase()));
  add("AEO", "schema_depth", "Two or more schema types", distinct.size >= 2, 1,
    `${distinct.size} type(s)`);

  const paraWords = paras.map((p) => p.split(/\s+/).length);
  const avgPara = paraWords.length ? Math.round(paraWords.reduce((a, b) => a + b, 0) / paraWords.length) : 0;
  add("AEO", "chunkable", "Chunkable paragraphs (avg <= 100 words)", avgPara > 0 && avgPara <= 100, 2,
    `avg ${avgPara} words/para`, avgPara > 0 && avgPara <= 130);

  const hasList = /<(ul|ol)[\s>]/i.test(body) || /<table[\s>]/i.test(body);
  add("AEO", "lists_tables", "Lists or tables for structured points (bonus)", hasList, hasList ? 1 : 0,
    hasList ? "present" : "n/a for this content type");

  add("AEO", "emphasis", "Bolded key terms", /<(strong|b)[\s>]/i.test(body), 1,
    /<(strong|b)[\s>]/i.test(body) ? "present" : "none");

  add("AEO", "sections", "Multiple H2 sections (scannable)", heads.filter((h) => h.level === 2).length >= 2, 1,
    `${heads.filter((h) => h.level === 2).length} H2 sections`);

  // ---- GEO ----
  const authored = has(types, "Person") || has(types, "Organization");
  add("GEO", "author_schema", "Author or publisher schema (Person/Organization)", authored, 2,
    authored ? types.filter((t) => /person|organization/i.test(t)).join(", ") : "missing");

  const dated =
    /"date(Published|Modified)"/i.test(JSON.stringify(ld)) ||
    /<time[^>]*datetime=/i.test(body) ||
    !!metaContent(head, "property", "article:published_time");
  add("GEO", "date", "Publication date (schema or <time>)", dated, 1, dated ? "present" : "missing");

  const byline = /\bBy\s+[A-Z][a-z]+/.test(body.slice(0, 4000)) || authored;
  add("GEO", "byline", "Byline or named author (E-E-A-T)", byline, 1, byline ? "present" : "missing");

  const og = ["og:title", "og:description", "og:type"].filter((p) => metaContent(head, "property", p)).length;
  add("GEO", "open_graph", "Open Graph tags (>=3)", og >= 3, 2, `${og}/3 core OG tags`, og >= 1);

  const imgs = [...body.matchAll(/<img\s[^>]*>/gi)].map((m) => m[0]);
  const svgFigs = [...body.matchAll(/<svg\s[^>]*>/gi)].map((m) => m[0]);
  const media = [...imgs, ...svgFigs];
  const described = media.filter((t) => ((attr(t, "alt") ?? attr(t, "aria-label") ?? "").trim().length > 0)).length;
  add("GEO", "alt_text", "Alt / aria-label on images and figures", media.length === 0 || described === media.length, media.length ? 1 : 0,
    media.length ? `${described}/${media.length} described` : "no media");

  const semantic = /<(article|main|section)[\s>]/i.test(body);
  add("GEO", "semantic_html", "Semantic HTML (article / main / section)", semantic, 1,
    semantic ? "present" : "none");

  const facts = (strip(body).match(/\b\d+([.,]\d+)?%?\b/g) ?? []).length;
  add("GEO", "fact_density", "Verifiable facts (numbers, >=6)", facts >= 6, 1, `${facts} numeric facts`, facts >= 3);

  return c;
}

// --- scoring + report ------------------------------------------------------

function bucketScore(checks: Check[], bucket: Bucket): number {
  const scored = checks.filter((c) => c.bucket === bucket && c.max > 0);
  const earned = scored.reduce((a, c) => a + c.earned, 0);
  const max = scored.reduce((a, c) => a + c.max, 0) || 1;
  return Math.round((earned / max) * 1000) / 10;
}

const glyph: Record<Status, string> = { pass: "PASS", warn: "WARN", fail: "FAIL", info: "----" };

function report(file: string): { seo: number; aeo: number; geo: number; composite: number } {
  const checks = run(file);
  const seo = bucketScore(checks, "SEO");
  const aeo = bucketScore(checks, "AEO");
  const geo = bucketScore(checks, "GEO");
  const composite = Math.round(((seo + aeo + geo) / 3) * 10) / 10;

  console.log(`\n\x1b[1m${file}\x1b[0m`);
  console.log(`  SEO ${seo}   AEO ${aeo}   GEO ${geo}   composite ${composite}`);
  for (const b of ["SEO", "AEO", "GEO"] as Bucket[]) {
    console.log(`  ${b}`);
    for (const c of checks.filter((x) => x.bucket === b))
      console.log(`    [${glyph[c.status]}] ${c.label} : ${c.detail}`);
  }
  const llms = "  note  llms.txt is not scored: Google confirmed (June 2026) it does not affect Search or AI answers.";
  console.log(llms);
  return { seo, aeo, geo, composite };
}

const files = process.argv.slice(2);
if (files.length === 0) {
  console.error("usage: node geo/check.ts <file.html> [<file2.html> ...]");
  process.exit(2);
}
const scores = files.map((f) => ({ f, ...report(f) }));
const allPass = scores.every((s) => s.composite >= 80);
console.log("");
process.exit(allPass ? 0 : 1);
