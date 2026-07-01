# Can a coding agent build from your docs?

*A coding agent can write a broken integration from your docs and never signal it. Score whether yours holds up.*

By Sai Vsr

A coding agent will read your quickstart and write an integration straight from it. When the page is thin, that code looks right and runs in the demo, and the mistake surfaces later, in production, on a customer's app with your name on the integration. Nothing fails at build time, because nothing it got wrong is a syntax error. This is not an edge case: [most professional developers now use AI coding tools daily](https://survey.stackoverflow.co/2025/ai), and the agents that take a whole task and write the integration are a growing part of that.

Your documentation has a second reader now, and it complains differently from the first. A confused human files a support ticket, which is a signal you can act on. When an agent gets confused, it writes something plausible and moves on, and you never hear about it. That is the failure mode Dachary Carey names in [her split between LLMs and agents as docs readers](https://dacharycarey.com/2026/02/26/llms-vs-agents-as-docs-consumers/): the agent gets truncated or thin content, returns a wrong answer, and neither you nor the developer ever finds out.

## We already gate code this way

We know how to handle code we cannot eyeball for correctness: we write a test that fails when the code breaks, and nobody merges a function just because it reads well. Documentation an agent builds from carries the same weight, yet the bar we hold it to is that a human skimmed it and felt it was clear. A page a person skims and calls clear can still leave a model short, because the model has to produce working code and cannot stop to ask a question.

The metric falls out of that comparison. Give a coding agent one fixed integration task, let it read a single docs page and nothing else, and grade the code it writes against the API's own specification: the endpoints and methods it called either exist and are shaped right, or they do not. A page that carries its weight produces correct code. A page that forces the agent to guess turns those guesses into failures you can count.

Most current advice fixes on the wrong question, whether a page ships an `AGENTS.md` or an `llms.txt`. The question that predicts anything is whether an agent can build the integration from the page in front of it. That is the one worth measuring.

## The proof: rebuilding a real quickstart

I tried this on [Vapi](https://vapi.ai), a voice-AI platform whose quickstart promises a working agent in five minutes, then asks you to choose among several entry points with the real code a page or two away. A person reads it and does fine; an agent hits a wall, because the page describes the product without ever stating the API, so the only way to integrate is to leave.

The eval is one fixed task: integrate Vapi's voice calling. The agent gets a single page as its only source and writes whatever code it can.

A grader then checks that code against Vapi's published OpenAPI spec, confirming the endpoints and methods it called are real and used the way the spec says. The grader never sees which page produced the code, so it cannot favor the rebuild, and correctness comes from the spec rather than my taste.

One rule sits above the score. If the private key turns up in client-side code, the result is capped no matter how clean the rest looks. An insecure integration is the exact thing this exercise exists to catch, so it does not earn partial credit. Each condition ran three times, so one lucky or unlucky run could not set the score.

Condition A gave the agent Vapi's current getting-started page. Told to invent nothing the docs left unstated, it averaged **62 out of 100** over three runs. It could not honestly do better, because the page never states the API. Compare the run that scored 54 with what the rebuild produced for the same step.

Current page, 62 out of 100:

```js
// const vapi = new Vapi(publicKey);   // <FILL FROM VAPI WEB SDK GUIDE>
button.addEventListener("click", () => {
  // <FILL FROM VAPI WEB SDK GUIDE>: start a web call to the assistant.
});
```

Rebuild, 100 out of 100:

```js
import Vapi from "@vapi-ai/web";

const vapi = new Vapi("YOUR_PUBLIC_KEY");
button.addEventListener("click", () => {
  vapi.start("YOUR_ASSISTANT_ID"); // opens the mic and starts the call
});
```

An agent that stops here is doing the right thing: it hit a gap the page left and refused to guess past it. The failure that costs you is the agent that fills those blanks with a confident guess and ships it, and nobody notices until a customer does.

Condition B gave the agent a rebuild of the same page, organized around one runnable path from creating an assistant through connecting and talking to it, with an `AGENTS.md` beside it. Every snippet was checked against Vapi's spec before publishing. This time the agent scored **100 out of 100** on all three runs. Everything else was held constant; the only change was the page the agent read.

A gap this size, from one API and one task, is not a universal constant. What makes it worth trusting is how it was produced: a fixed task, a rubric from the spec, a veto on insecure code, and repeated runs, so the score reflects the page and not my read of it.

The gap is not about writing quality. Vapi's prose scores full marks on the docs-quality pass I run; what pulls its total down is structure, one runnable path where the live page offers four and the API stated in place instead of a link away. Structure is fixable, and measuring the page is what surfaced it.

## What adding an `AGENTS.md` gets you

The reason to measure rather than assume is that the artifacts everyone ships right now do not reliably help. Adding an `AGENTS.md` to a repo gets treated as self-evidently good, and the evidence does not support that.

A recent [evaluation of these context files](https://arxiv.org/abs/2602.11988) found that providing them, whether a human wrote the file or an LLM generated it, did not generally improve an agent's task success, and raised inference cost by more than twenty percent on average. A separate [study of 2,303 of them across 1,925 repositories](https://arxiv.org/abs/2511.12884) found the files maintained like configuration, full of build commands and architecture notes, and light on the security and performance guidance an agent needs to write production-safe code.

The file gets added; the value does not follow. And `llms.txt`, the other artifact of the moment, [does nothing for Google Search or its AI answers](https://www.digitalapplied.com/blog/google-llms-txt-no-seo-value-lighthouse-audit-2026) by Google's own statement, since Search ignores it. It works only at the narrower layer where an agent fetches a page directly, not the broad discoverability win it is often sold as.

None of that is a reason to abandon the artifacts, but it is a strong reason to stop trusting them unmeasured. A context file merged on faith still costs tokens and can cost correctness, and it tells you nothing about either, because no one checked what an agent did with it. Write the same file against a real task, test it, and it earns whatever it earns.

My rebuild's [`AGENTS.md`](https://github.com/saivsr/Manicule-Sample-Brief/blob/main/rebuild/AGENTS.md) earned its 100 because it was written against the task and then checked against the result. Without that check it would be one more file I hoped was helping, with no way to know.

Others have measured this before me. Mintlify has run a [controlled experiment](https://www.mintlify.com/blog/structured-docs-coding-agents) showing structured docs gave coding agents roughly 64 percent more precise answers, about 39 percent better discoverability, half the token usage, and around 1.5 times faster responses against a no-docs baseline. Vercel has [made the point](https://vercel.com/kb/guide/make-your-documentation-readable-by-ai-agents) that an agent fetching a docs page should get markdown, not HTML. What is still mostly missing from the public record is a method you can rerun end to end, with the task, the grader, the veto, and the scoring all specified. That reproducibility is the contribution.

## Make it a gate

Treat agent-comprehension as a check that runs in your pipeline, the way CI gates code before it merges. Take your highest-traffic integration page, write one fixed task an agent should be able to finish from it, grade the output against your spec with a veto on the obvious security mistakes, and run it more than once so the number means something. After that, every edit to the page moves the number, and you learn whether a change helped or hurt before an agent meets it in the wild.

The score itself matters less than the method behind it. A fixed, spec-based test keeps working after the next model release changes how agents read a page, and it tells you plainly whether your docs hold up. Set it up once and you stop guessing.

## Common questions

### How is this different from a human reviewing the docs?

A human review checks whether the page reads clearly. The eval checks whether an agent can build correct code from it, which is a separate question and the one that fails without warning. Keep the human review and add the eval as a gate.

### Do I still need an `AGENTS.md` or an `llms.txt`?

Maybe. The evidence says those files do not reliably help, so treat them as candidates rather than cures. Add one, then measure whether an agent scores higher with it than without. If it does not, it is dead weight.

### What do I need to run this on my own docs?

A coding agent, one integration page, a fixed task, and your API's spec to grade against. Run each condition a few times so a single lucky run does not set the score, and cap anything that leaks a secret into client code.
