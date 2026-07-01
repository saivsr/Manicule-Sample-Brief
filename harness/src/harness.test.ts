// Deterministic-layer tests. Run with `bun test`.
// No network or API key required.

import { test, expect } from "bun:test";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { runDeterministic } from "./deterministic.ts";
import { loadPage } from "./report.ts";

const dir = join(dirname(fileURLToPath(import.meta.url)), "..");
const before = runDeterministic(loadPage(join(dir, "fixtures", "vapi-quickstart.before.md")));
const after = runDeterministic(loadPage(join(dir, "..", "rebuild", "quickstart.md")));
const slop = runDeterministic(loadPage(join(dir, "fixtures", "ai-rhythm.slop.md")));

const find = (r: ReturnType<typeof runDeterministic>, id: string) => r.checks.find((c) => c.id === id);

test("the rebuild scores higher overall than Vapi's current page", () => {
  expect(after.overall).toBeGreaterThan(before.overall);
});

test("the gain is in flow, not voice (structure was the problem)", () => {
  expect(after.buckets.flow).toBeGreaterThan(before.buckets.flow);
});

test("Vapi's page has no runnable result (install commands only)", () => {
  expect(find(before, "runnable_result")?.status).toBe("fail");
});

test("Vapi's page presents multiple competing entry points", () => {
  expect(find(before, "single_path")?.status).toBe("fail");
});

test("the rebuild reaches a runnable result on one path", () => {
  expect(find(after, "runnable_result")?.status).toBe("pass");
  expect(find(after, "single_path")?.status).toBe("pass");
});

test("the rhythm checks catch my own earlier AI-slop draft", () => {
  expect(find(slop, "ai_framing")?.status).toBe("fail"); // "here is the line that does the work"
  expect(find(slop, "ai_antithesis")?.status).not.toBe("pass"); // "not before" / "not battle-tested"
});

test("the rebuild passes the rhythm checks the slop draft failed", () => {
  expect(find(after, "ai_framing")?.status).toBe("pass");
  expect(find(after, "ai_antithesis")?.status).toBe("pass");
});

test("no shipped page carries an em-dash", () => {
  expect(find(after, "em_dash")?.status).toBe("pass");
});
