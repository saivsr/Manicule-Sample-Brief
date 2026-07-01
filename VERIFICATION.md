# Code verification

Every API call and SDK line in the rebuild is checked against Vapi's own published sources,
not against memory. I do not have a Vapi key and did not run this against a live account, so
"correct" here means "matches Vapi's OpenAPI spec and API reference," verified July 2026.

Sources of truth:
- OpenAPI spec: `https://api.vapi.ai/api-json` (Swagger UI at `https://api.vapi.ai/api`)
- API reference: `https://docs.vapi.ai/api-reference/assistants/create`, `.../calls/create`
- Web SDK quickstart: `https://docs.vapi.ai/quickstart/web`; package `@vapi-ai/web` on npm

| Element used | What the rebuild does | Verified against | Result |
| --- | --- | --- | --- |
| Base URL `https://api.vapi.ai` | Server calls | OpenAPI `servers` + api-reference | Correct |
| `POST /assistant` | Create the agent | api-reference (Create Assistant); OpenAPI `CreateAssistantDTO` | Correct |
| `Authorization: Bearer <key>` | Server auth | OpenAPI security scheme = `bearer` (only scheme) | Correct |
| Fields `name`, `model{provider,model,messages}`, `voice{provider,voiceId}`, `firstMessage` | Assistant body | api-reference Create Assistant example | Correct |
| `model` present but not required | Assistant body | Create Assistant schema (model is optional) | Correct (kept for clarity) |
| **No `projectId`** anywhere | Auth / body | OpenAPI security = bearer only; docs: "the project is inferred from your API key" | Correct (a `projectId` field would be invented; the spec has none) |
| `npm i @vapi-ai/web` | Browser SDK | npm package `@vapi-ai/web` | Correct |
| `new Vapi("PUBLIC_KEY")` | Browser client | quickstart/web: constructor takes the **public** key | Correct |
| `vapi.start("ASSISTANT_ID")` | Start the call | quickstart/web: `start` accepts an assistantId string (or an inline config) | Correct |
| Start from a click | Browser mic gesture | Web platform requirement (getUserMedia needs a user gesture); reflected in Vapi's web usage | Correct |
| Embed widget `<script …widget.umd.js>` + `<vapi-widget public-key=… assistant-id=…>` | "Faster" option in the tip | docs `chat/web-widget` | Correct |
| `POST /call` with `{ assistantId, phoneNumberId, customer:{number} }` (in `AGENTS.md`) | Outbound phone call | api-reference (Create Call); `CreateCallDTO.assistantId` is the top-level string that references an existing assistant | Correct |

**What I could not fully see:** the OpenAPI `CreateAssistantDTO` / `CreateCallDTO` field lists are
truncated by the fetch tool, so the field names above are cross-checked against the rendered
api-reference examples rather than read straight from the raw schema. The security scheme (bearer,
no projectId) and the endpoint paths are confirmed directly from the spec.

**What I deliberately did not claim:** that the code runs end to end. It is faithful to Vapi's
documentation; a live run needs a paid key, which is out of scope here.
