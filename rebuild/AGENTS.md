# AGENTS.md: Vapi

Guidance for an AI agent building on Vapi. If you are a coding agent such as Claude Code
or Cursor, read this before writing code. It is the machine-readable companion to the
[Quickstart](/quickstart.md).

## What Vapi is

A developer platform for voice AI agents. You create an agent (called an assistant) with
one API call, then connect to it from the web, a phone number, or the API. Vapi runs the
speech-to-text, model, and text-to-speech pipeline.

## Keys

Two keys, from the dashboard at https://dashboard.vapi.ai:

- **Private key**: server-side, for the REST API. Send as `Authorization: Bearer <key>`.
- **Public key**: browser-side, for the Web SDK.

Never put the private key in client code.

## Core calls

These are the calls to reach a working voice agent. Fields shown are from Vapi's own docs.

**Create an assistant** (returns an `id`):

```bash
curl -X POST "https://api.vapi.ai/assistant" \
  -H "Authorization: Bearer $VAPI_PRIVATE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Support agent",
    "model": { "provider": "openai", "model": "gpt-4o",
      "messages": [{ "role": "system", "content": "You are Alex, a support agent for Acme." }] },
    "voice": { "provider": "11labs", "voiceId": "cgSgspJ2msm6clMCkdW9" },
    "firstMessage": "Hi, this is Alex from Acme. How can I help?"
  }'
```

**Connect from the browser** (Web SDK):

```typescript
import Vapi from "@vapi-ai/web";
const vapi = new Vapi("YOUR_PUBLIC_KEY");
vapi.start("YOUR_ASSISTANT_ID"); // call from a user click so the browser grants the mic
```

**Place an outbound phone call**:

```bash
curl -X POST "https://api.vapi.ai/call" \
  -H "Authorization: Bearer $VAPI_PRIVATE_KEY" \
  -H "Content-Type: application/json" \
  -d '{ "assistantId": "your-assistant-id",
        "phoneNumberId": "your-phone-number-id",
        "customer": { "number": "+1234567890" } }'
```

## An assistant's shape

- `model`: the provider and model that generate replies, plus the system `messages`.
- `voice`: the provider and `voiceId` for speech output.
- `transcriber`: speech-to-text. Optional; Vapi uses a default if you omit it.
- `firstMessage`: what the agent says when the call opens.

## Rules for agents

1. Keep the private key server-side. In the browser, use only the public key.
2. Call `vapi.start()` from a user gesture (a click), or the browser blocks the microphone.
3. To end a web call and release the mic, stop the call when you are done. See the Web SDK
   reference for `stop()` and the event handlers (`vapi.on(...)`); this file omits them to avoid
   drifting from it.
4. A phone call needs a `phoneNumberId`. Buy or import a number in the dashboard first.

## Where to look next

- Full docs index: https://docs.vapi.ai/llms.txt
- This page as clean Markdown: append `.md` to the URL.
