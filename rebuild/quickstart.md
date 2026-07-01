<!-- Clean-Markdown twin of quickstart.mdx: the version an agent fetches when it appends
`.md` to the page URL. Same content, no components. -->

# Quickstart

Create a voice agent and talk to it in your browser in about five minutes.

> Building on Vapi with a coding agent (Claude Code, Cursor)? Point it at
> [AGENTS.md](/AGENTS.md). It gives an agent the two calls and the rules it needs to get
> this working without guessing.

## What you'll build

A voice agent that runs in your browser. You create the agent with one API call, connect to
it with the Web SDK, and talk to it out loud. It takes about five minutes.

## Before you start

You need a Vapi account and two keys from the [dashboard](https://dashboard.vapi.ai):

- your **private key**, used from your terminal to create the agent
- your **public key**, used in the browser to connect to it

## 1. Create an agent

Run this once. It returns an agent with an `id` that you use in the next step.

```bash
curl -X POST "https://api.vapi.ai/assistant" \
  -H "Authorization: Bearer $VAPI_PRIVATE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Support agent",
    "model": {
      "provider": "openai",
      "model": "gpt-4o",
      "messages": [{ "role": "system", "content": "You are Alex, a support agent for Acme." }]
    },
    "voice": { "provider": "11labs", "voiceId": "cgSgspJ2msm6clMCkdW9" },
    "firstMessage": "Hi, this is Alex from Acme. How can I help?"
  }'
```

Copy the `id` from the response.

## 2. Connect from your app

Install the Web SDK and create a client with your public key.

```bash
npm install @vapi-ai/web
```

```typescript
import Vapi from "@vapi-ai/web";

const vapi = new Vapi("YOUR_PUBLIC_KEY");
```

## 3. Talk to it

Start the call from a click, so the browser can ask for microphone access. Pass the agent
`id` from step 1.

```html
<button onclick="vapi.start('YOUR_ASSISTANT_ID')">Talk to the agent</button>
```

Open the page and click the button. The agent opens with its `firstMessage`, listens, and
answers out loud.

## What each part does

You'll usually touch three of the agent's fields, and you can change any one without touching the others:

- `model` generates the replies. Swap `gpt-4o` for another provider or model.
- `voice` sets how it sounds. Change the provider or `voiceId`.
- the transcriber turns what the caller says into text for the model. Vapi uses a default
  until you set your own.

## Where to go next

- **Change its behavior.** Edit the system prompt in `model.messages`.
- **Put it on a phone number.** Follow the [phone quickstart](/quickstart/phone) to take
  inbound and outbound calls.
- **Let it do things.** Add [tools](/tools) so the agent can look up an order or transfer to
  a human.
- **Ship it safely.** Move key handling to your server before production. See
  [security](/security).
