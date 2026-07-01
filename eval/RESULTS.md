# Agent-comprehension eval: results

**The question:** whether the rebuild helps an AI agent write correct Vapi code, rather than only
claiming to. Shipping an `AGENTS.md` proves nothing on its own. This test compares the code an
agent writes from the current page against the code it writes from the rebuild.

## Setup

- **Task (identical for every run):** write the minimal code to create a Vapi assistant on the
  server, connect from a browser so a user can talk to it, and start the call from a click, with
  the private key kept server-side. Full prompt in `task.md`.
- **Condition A (control):** the agent may use only Vapi's current getting-started page
  (`../harness/fixtures/vapi-quickstart.before.md`).
- **Condition B:** the agent may use only the rebuild (`../rebuild/quickstart.md` + `AGENTS.md`).
- **Agents:** 3 independent runs per condition, each a fresh isolated coding agent with no web
  access and no shared memory. Outputs in `runs/`.
- **Grader:** `grade.ts`, deterministic and **condition-blind**. It scores code, never knowing
  which docs produced it. "Correct" is defined by Vapi's OpenAPI spec (see `../VERIFICATION.md`),
  not by my preference. A private key appearing in browser code is a scored veto.

## Result

| Run | Condition A (current page) | Condition B (rebuild + AGENTS.md) |
| --- | --- | --- |
| 1 | 66 | 100 |
| 2 | 66 | 100 |
| 3 | 54 | 100 |
| **Average** | **62** | **100** |

## How the score works

`grade.ts` gives 100 points across eight checks of whether the code does the real integration. It
runs on the code text and never sees which page produced it.

| Check | Points | Current page (A) | Rebuild (B) |
| --- | :---: | :---: | :---: |
| Writes the real `POST /assistant` call | 18 | placeholder | yes |
| Bearer auth on that call | 12 | sometimes | yes |
| Connects with `@vapi-ai/web` + `new Vapi()` | 16 | placeholder | yes |
| `vapi.start(assistantId)` | 14 | yes | yes |
| Starts from a user click | 12 | yes | yes |
| Uses the returned assistant `id` | 10 | yes | yes |
| No invented `projectId` | 8 | yes | yes |
| Calls only `api.vapi.ai` | 10 | yes | yes |

Plus a security veto: a private key in browser code caps the score at 40.

The current-page agents get the structure and the security right, because the task states those.
They lose the points tied to the actual API surface: the create-assistant endpoint and the Web SDK
import. Vapi's current page states neither, so the agent leaves them as placeholders (66 when it can
still write the Bearer header from general knowledge, 54 when it cannot). The rebuild states both, so
the agent writes them and reaches 100.

## What actually happened

The agents in condition A were not careless. They followed the rule "if the docs do not state it,
do not invent it," and Vapi's current page does not state the API. One wrote, verbatim:

> *"The snapshot does NOT state any concrete API surface: no REST endpoints, no SDK package names,
> no method signatures... the parts the docs do not specify are left as clearly-marked
> `<FILL FROM VAPI API/SDK REFERENCE>` placeholders rather than fabricated."*

So they got the *security* right (the key stayed server-side, because the task said so) but could
not produce a working integration. The create-assistant call and the SDK constructor came out as
placeholders:

```js
// Condition A (current page): forced to guess, so it commented the SDK out
// const vapi = new Vapi(publicKey);   // <FILL FROM VAPI WEB SDK GUIDE>
// ...and the create-assistant endpoint left unresolved
```

Condition B agents had the two exact calls and wrote them cleanly:

```js
// Condition B (rebuild + AGENTS.md): both calls written out, matches Vapi's spec (not executed)
const res = await fetch("https://api.vapi.ai/assistant", {
  headers: { Authorization: `Bearer ${process.env.VAPI_PRIVATE_KEY}` }, ...
});
import Vapi from "@vapi-ai/web";
const vapi = new Vapi("YOUR_PUBLIC_KEY");
document.querySelector("#talk").addEventListener("click", () => vapi.start("YOUR_ASSISTANT_ID"));
```

**The finding:** an agent that refuses to hallucinate cannot complete the integration from Vapi's
current getting-started page. From the rebuild plus an `AGENTS.md`, it completes it in all three
runs. That is the difference an agent-readable page makes in this test.

## Limits

- N = 3 per condition; this is a demonstration, not a paper. The gap is large and consistent, but
  small-sample.
- The agents are Claude subagents. A different model, or one told to guess freely, might score the
  current page higher by inventing an endpoint, which is the worse failure (wrong code that looks
  right). Either way, the current page does not do the work.
- "Correct" is defined by Vapi's published spec, not a live run (no key). The grader is heuristic
  and deterministic; its checks are listed in `grade.ts`.
- Reproduce: `node grade.ts runs/<file>.txt` for any run.
