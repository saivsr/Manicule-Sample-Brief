# Scouting memo: Vapi

*For the manicule team. By Sai Vsr.*

Your Supermemory rebuild is the closest example I had of the bar I was aiming for: a quickstart
should land a developer on a working result before it asks them to choose anything. I ran that
idea on a company you do not work with yet.

## The prospect

Vapi, the developer platform for voice AI agents. It fits your ICP: an API company whose growth
depends on developers reaching a working call fast. It is not one of your customers. And its
quickstart has the same first-page gap your case study describes.

## The problem, from their own page

Vapi's quickstart makes the right promise in its first lines: *"Build your first voice agent in
5 minutes using our dashboard."* The page does not deliver on it. It offers four different
starting points at once (dashboard, Web SDK, CLI, and a use-cases gallery) and sends the reader
to the dashboard for the real work. The only code on the page is a one-line CLI install. A
developer who wants to see a voice agent running in their own editor has to choose a path and
leave the page to find code.

The promise is five minutes; the page spends them on a choice the reader cannot make yet.

## Why it costs Vapi

For an API company the quickstart is the top of the funnel. A developer who does not reach a
working call in the first sitting often does not come back, and may open a support ticket on the
way. Of every page Vapi could improve, this is the one that pays back first.

## What I changed, as a starter

I rebuilt the quickstart around one runnable path: create an agent with a single API call,
connect to it with the Web SDK, and talk to it in the browser. Prerequisites sit at the top, the
two keys are named in two lines, the code is on the page, and everything else moves to a short
"where to go next" list. It is written in Vapi's own voice, using Vapi's own SDK and API
snippets. The page, its clean Markdown twin, and an `AGENTS.md` are in `/rebuild`.

## What it does for a coding agent

Vapi's product is built for agents, so its docs have a second reader. Point a coding agent at
Vapi's current getting-started page and ask it to add a voice agent, and it has to guess. The
page tells it to read a separate `SKILL.md`, then offers four routes and no code. The two calls
it actually needs, one to create the assistant on the server and one to connect from the
browser, live on other pages.

The `AGENTS.md` in `/rebuild` hands that agent a single file: the two exact calls, the shape of
an assistant, and the four rules that trip agents up (keep the private key server-side, use the
public key in the browser, start the call from a click, buy a phone number before placing one).
Vapi already ships a section-level `llms.txt` and an MCP server, so they are not starting from
zero. The missing piece is one map an agent can act from without reading four pages, and that is
what this adds.
