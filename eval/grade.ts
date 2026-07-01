// grade.ts : deterministic, condition-blind grader for the agent-comprehension eval.
//
// It scores a block of agent-written integration code against what Vapi's API actually is
// (verified against their OpenAPI spec : see ../VERIFICATION.md), not against my preferences.
// The grader never sees which condition produced the code, so it cannot favour one.
//
// Usage: node grade.ts <path-to-code-file>   ->   prints JSON { score, veto, checks }

import { readFileSync } from "node:fs";

interface Check { id: string; points: number; pass: boolean; note: string }

export function grade(code: string): { score: number; veto: boolean; checks: Check[] } {
  const c = code;
  const lc = code.toLowerCase();

  // Split into a rough "browser/client" region vs "server" region for the security check.
  // Client markers: new Vapi(, onclick, document., window., <button, import Vapi from "@vapi-ai/web".
  const clientIdx = Math.min(
    ...["new vapi(", "onclick", "@vapi-ai/web", "<button", "document.", "window."]
      .map((m) => { const i = lc.indexOf(m); return i === -1 ? Infinity : i; }),
  );
  const clientRegion = clientIdx === Infinity ? "" : lc.slice(Math.max(0, clientIdx - 200), clientIdx + 400);

  const checks: Check[] = [
    {
      id: "creates_assistant",
      points: 18,
      pass: /api\.vapi\.ai\/assistant/.test(lc) || /assistants?\.create\(/.test(lc),
      note: "Creates the assistant via POST https://api.vapi.ai/assistant (or SDK equivalent).",
    },
    {
      id: "server_auth_bearer",
      points: 12,
      pass: /authorization/.test(lc) && /bearer/.test(lc),
      note: "Authenticates the server call with an Authorization: Bearer header.",
    },
    {
      id: "web_sdk_connect",
      points: 16,
      pass: /@vapi-ai\/web/.test(lc) && /new\s+vapi\s*\(/.test(lc),
      note: "Connects from the browser with @vapi-ai/web and new Vapi(...).",
    },
    {
      id: "start_call",
      points: 14,
      pass: /vapi\.start\s*\(/.test(lc),
      note: "Starts the call with vapi.start(assistantId).",
    },
    {
      id: "starts_from_gesture",
      points: 12,
      pass: /onclick|addeventlistener\s*\(\s*['"]click|\.onclick|button/.test(lc) &&
        /vapi\.start/.test(lc),
      note: "Starts the call from a user gesture (a click), so the mic is granted.",
    },
    {
      id: "uses_returned_id",
      points: 10,
      pass: /assistant\.id|\.assistantid|assistantid|response\.id|\bid\b\s*[:=]/.test(lc),
      note: "Uses the id returned by assistant creation.",
    },
    {
      id: "no_invented_project_id",
      points: 8,
      pass: !/project[_-]?id/.test(lc),
      note: "Does not invent a projectId (Vapi infers the project from the key).",
    },
    {
      id: "no_hallucinated_host",
      points: 10,
      // any api.<host> that is not api.vapi.ai is a hallucinated endpoint
      pass: !([...lc.matchAll(/https?:\/\/api\.[a-z0-9.-]+/g)].some((m) => m[0] !== "https://api.vapi.ai")),
      note: "Calls only api.vapi.ai; no invented endpoints.",
    },
  ];

  // SECURITY VETO: the private/secret key must never appear in the browser/client region.
  const privateInClient = /(private|secret)[_-]?key|vapi_private/.test(clientRegion);
  const veto = privateInClient;

  let score = checks.filter((x) => x.pass).reduce((a, x) => a + x.points, 0);
  if (veto) score = Math.min(score, 40); // shipping a private key to the browser caps the grade

  checks.push({
    id: "security_key_placement",
    points: 0,
    pass: !privateInClient,
    note: privateInClient
      ? "VETO: a private/secret key appears in browser code."
      : "Private key kept out of browser code.",
  });

  return { score, veto, checks };
}

if (process.argv[2]) {
  const path = process.argv[2];
  const res = grade(readFileSync(path, "utf8"));
  console.log(JSON.stringify({ file: path, ...res }, null, 2));
}
