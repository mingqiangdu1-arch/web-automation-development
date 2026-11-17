# Developer-value pilot: does the Skill improve actual automation development?

Status: **ready to run locally; no experimental result is claimed by this document.**

## What changed from the earlier A/B test

The earlier TodoMVC/The Internet pilots primarily asked Codex to generate code and had a separate program run it. Both arms passed, and the Skill arm spent more input tokens. This does not measure whether the Skill helps during **site exploration, tool-route selection, development, debugging, and business validation**.

This pilot gives both arms the same **end-to-end development request**, with shell and browser libraries available. The Agent must implement, run, debug, and check a real result. It does not receive implementation hints, the grading oracle, or a prescribed API/UI path.

## Upstream application and task provenance

Use the independent [GAD GUI/API Demo](https://github.com/jaktestowac/gad-gui-api-demo) testing application, not a custom-built site. Adapt its existing [article](https://github.com/jaktestowac/gad-gui-api-demo/blob/main/tests/test/articles.spec.js) and [comment](https://github.com/jaktestowac/gad-gui-api-demo/blob/main/tests/test/comments.spec.js) scenarios. GAD supports both GUI and documented REST APIs; its upstream tests exercise article paging/querying and article/comment detail endpoints.

The task is to develop and actually run a read-only collector for the **20 most recent articles**, including detail fields and the true comment count for each article. The runnable tool must be re-executable, return structured output, and report completion. The task is *not* to write a single Playwright snippet for a fixed action.

The independent grader uses GAD's source-supported read-only APIs to derive the expected record IDs, fields and per-article comment counts. **The Agent does not receive the grading code or expected data.** The upstream application is merely a disposable experimental dependency; no third-party source code is copied into this MIT-licensed repository.

## Run on an isolated local machine

Prerequisites: Node.js, authenticated Codex CLI, existing `evaluation` Playwright dependencies, and a separate, **disposable** local GAD instance. Do not run generated code in an environment with valuable customer data or personal browser sessions. Keep raw traces and workspaces private. `READ_ONLY=1` is an extra safeguard, not a guarantee against every side effect.

Option A: run the upstream Docker image (Docker must already be installed):

```powershell
docker run --rm -d --name wad-gad-pilot -e READ_ONLY=1 -p 127.0.0.1:3000:3000 jaktestowac/gad:2.5.5
```

Option B: follow the upstream repository's local Node.js setup (`npm i`, then `npm run start`); use the same read-only setting and an isolated data set. Do not mix this experiment with a real account or production application.

From this Skill repository, prepare the evaluator's dependencies:

```powershell
npm install --prefix evaluation
npx --prefix evaluation playwright install chromium
```

Inspect the planned task and A/B setup without contacting the Agent or GAD:

```powershell
node evaluation/developer-value-pilot.mjs --dry-run --model gpt-6.1-sol
```

Run a single paired trial on the same explicit model and effort (replace with a model available in your Codex installation):

```powershell
node evaluation/developer-value-pilot.mjs --model gpt-6.1-sol --effort low
```

The runner starts with an upstream API preflight. It stops if GAD is unreachable, the expected dataset is unavailable, the user-scope target Skill could contaminate A, or the application data drifts between arms. It creates separate temporary workspaces:

| A: baseline | B: Skill |
| --- | --- |
| Fresh Codex context, same development task | Fresh Codex context, same task |
| Target Skill not placed in the workspace | Complete `web-automation-development` directory placed in `.agents/skills/` and requested natively |
| Same model, reasoning, app state and dependencies | Same model, reasoning, app state and dependencies |

Only the B arm is asked to use the Skill. This is an **explicit-use value test**, not an automatic-trigger experiment.

The runner uses a workspace-write Codex sandbox with network access for the localhost test application. If your local sandbox blocks that access, stop and resolve the preflight condition rather than enabling full-machine permissions or reclassifying the run as a Skill failure.

## How to interpret the evidence

The runner saves private `codex.jsonl` traces, generated code, actual collector outputs, per-arm grading details and a paired summary under the OS temporary directory (`wad-developer-value/gad-pilot-*`). It does **not** publish these files or open a pull request automatically.

Measure two things separately:

1. **Independent outcome (automatic):** Are the 20 correct records present in date order, with unique IDs, correct detail fields, correct comment counts and an explicit complete report? Did the source dataset stay unchanged? `OUTPUT_PASS` means only these facts passed.
2. **Developer experience (trace review):** Did Codex actually inspect the site/API before hard-coding assumptions? Was a route chosen with evidence? How many code revisions, failed commands, repeated investigations and extra user hints occurred? What were the total tool calls, tokens and wall-clock duration? Did the Agent run the program twice, and did the second run preserve the same 20 records?

The following claims **cannot** be made from the current automated grader alone:

- The output is idempotent. The task asks for reruns, but the grader does not execute generated code outside the Agent sandbox; inspect the trace and rerun in a separate disposable environment if needed.
- The B arm loaded the Skill automatically. The pilot uses explicit selection, and loader evidence may remain `INCONCLUSIVE` if the CLI does not expose a successful read.
- The Skill caused any change in reasoning. Similar decisions can arise from the base model without the Skill.
- One observed success difference generalizes to other sites, models, browser tools or agents.

For each pair, write a short, honest conclusion using this table:

| Question | A | B | Evidence |
| --- | --- | --- | --- |
| Business result correct? | | | grader + output |
| First executable version successful? | | | trace timeline |
| Number of revisions / failed runs | | | trace timeline |
| Exploratory calls that resolved a real unknown | | | trace + source |
| Route selection justified and implemented? | | | code + observations |
| Resume/re-run verified? | | | two execution traces + output checks |
| Human interventions | | | session notes |
| Total tokens / tool calls / wall time | | | recorded telemetry |

**Decision rule:** If A and B deliver equivalent outcomes and B only adds token/time overhead, record **"no measured benefit on this development task"**. Do not keep increasing sample counts to search for a positive number. Inspect whether the task lacked a real decision point or the Skill repeated knowledge the model already had; consider narrowing or shortening the Skill. If B demonstrably avoids a failure, reduces rework, or completes a task A could not, retain the raw causal evidence and then replicate on one *different* upstream development scenario before making a public claim.

Keep a public case study short: initial task, same-arm conditions, observed implementation differences, actual outcome, exact cost and limits. Do not put private raw tool traces or real business data into the public repository. Existing simple A/B records remain in `evaluation/` as historical control observations, not advertised benefits.
