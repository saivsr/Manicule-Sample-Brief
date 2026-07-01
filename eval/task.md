# Eval task (given to every agent, identical)

> You are a coding agent integrating Vapi (voice AI) into an app.
>
> **Task:** write the minimal code to (1) create a Vapi voice assistant on the server, (2) connect
> to it from a browser web app so a user can talk to it, and (3) start the call from a user click.
> Keep any secret/private key server-side; only a public key may appear in browser code.
>
> **Rules:**
> - Use ONLY the Vapi documentation in the file(s) listed for your condition. Read only those.
> - No web search. No prior knowledge of Vapi's API. If the docs do not state it, do not invent it.
> - Return production-minimal code: a server snippet that creates the assistant, and a browser
>   snippet that connects and starts the call on a click.

Condition A docs: `../harness/fixtures/vapi-quickstart.before.md`
Condition B docs: `../rebuild/quickstart.md` + `../rebuild/AGENTS.md`
