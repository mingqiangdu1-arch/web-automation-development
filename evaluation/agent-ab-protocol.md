# Agent Skill A/B protocol (planned; no results yet)

This document defines the **next** independent evaluation of `web-automation-development`. It is not a transcript or a claim that A/B tests have been run. Reuse existing test pages from [Playwright TodoMVC](https://github.com/microsoft/playwright/blob/main/examples/todomvc/specs/basic-operations.plan.md) and [Sauce Labs The Internet](https://github.com/saucelabs/the-internet); do not build a new test website.

## Experimental arms

| Arm | Agent context | Skill availability |
| --- | --- | --- |
| A (baseline) | Fresh Codex context for each trial | This Skill unavailable; verify other Skill state |
| B (`v0.1.0`) | Independent fresh Codex context for each trial | Only the released `v0.1.0` copy available for this comparison |
| C (future candidate) | Another fresh context, same conditions | Updated Skill, only after candidate changes |

Do **not** reuse a conversation that has already read the Skill, its reference files, the expected implementation, or a previous trial. Verify whether a Skill was actually loaded using available client evidence; do not infer usage from a good answer. Keep model, reasoning effort, tools, site, starting state, task wording, budget and timeout consistent. Do not give the Agent the outcome rubric in its user prompt.

## Task prompts from upstream examples

These are short task phrasings mapped to existing pages, not new webpage fixtures. Execute each in a fresh context. Use only demonstration data; avoid destructive or shared business writes.

| Case | User-facing task prompt | Independent result check |
| --- | --- | --- |
| PW-01 | “在 `https://demo.playwright.dev/todomvc/` 新增一条 `Buy groceries`，确认页面显示成功。” | Item exists; counter reflects active item |
| PW-02 | “在 TodoMVC 新增 `Buy groceries`，再把它改成 `Buy organic groceries`。” | Updated item exists; old label no longer displayed |
| PW-03 | “在 TodoMVC 新增 `Buy groceries`，编辑时输入 `Wrong uncommitted edit`，用 Escape 取消。” | Original content remains unchanged |
| PW-04 | “在 TodoMVC 新增两条待办，将一条标为完成，分别核对 Active 和 Completed，刷新后再次确认。” | Rendered list for each filter is correct; state persists |
| TI-01 | “在 `https://the-internet.herokuapp.com/` 的 Dynamic Loading Example 2 中触发加载，确认真正加载出的内容。” | Final heading appears, not merely page-load event |
| TI-02 | “在 The Internet 的 Dynamic Controls 中启用原本禁用的输入框，输入 `ready` 并确认状态。” | Input enabled and accepts value; success state displayed |
| TI-03 | “在 The Internet 的 Nested Frames 示例中，读取上排中间和下排框架的文字，分别报告来源。” | `MIDDLE` from nested middle frame; `BOTTOM` from bottom frame |
| TI-04 | “在 The Internet 的 Shadow DOM 示例中，读取第二个自定义段落的列表文本，并说明作用域。” | Second shadow host contains `In a list!` |

Use the original upstream project as the task source. For each trial record upstream URL, observed page version or revision if knowable, browser profile/session, and any variation in startup state. Client-side TodoMVC data must be isolated per trial; do not assume a new tab is a new storage context.

## Trigger tests versus task tests

**Task tests** above are not enough to assess triggering. In separate fresh contexts, evaluate natural-language prompts for:

- Positive: building a multi-page crawler, maintaining a failing browser workflow, deciding authorized API/UI routes, investigating a new site before implementing automation.
- Negative: taking a one-time screenshot, explaining a browser concept, modifying an offline CSV, comparing Playwright to Selenium without implementing a workflow.

For each prompt record `expected_trigger`, `observed_load_evidence`, `actual_reference_reads`, `result`, and `reason`. If the client cannot expose reliable load evidence, mark trigger status `INCONCLUSIVE` and do not assign a trigger accuracy percentage.

## Minimum run size and scoring

- **Pilot:** 8 upstream task cases × 2 arms × 2 repeats = **32 independent task runs**. Trigger-only prompts are additional, not counted in those 32.
- **Extension:** add more repetitions, an updated-Skill arm, and existing BrowserGym/Restful Booker cases only after the pilot's execution and scoring are stable.
- **Primary:** independent task-outcome PASS / FAIL / BLOCKED / INCONCLUSIVE, plus safety conformance. A successful task with an unsafe write is not a safe success.
- **Secondary:** actual tool-call counts, token usage (if exposed), wall-clock duration and retries. Use `N/A` rather than estimates when telemetry is unavailable.
- **Failure attribution:** task execution, site availability, selector/evaluator false negative, Skill triggering, route decision, identity/scope, or outcome verification. Keep the underlying evidence for ambiguous cases.

The [initial online smoke report](online-smoke-2026-11-17.md) is useful for checking that these public examples are reachable, but **must not be included in the A/B denominator**: it was a single operator-controlled browser pass, not an independent clean-context Agent trial.

## Run record (one per trial)

```json
{
  "case_id": "TI-03",
  "arm": "A|B|C",
  "repeat": 1,
  "model_and_effort": null,
  "client_version": null,
  "upstream_version_or_observed_date": null,
  "actual_skill_loaded": "YES|NO|INCONCLUSIVE",
  "outcome": "PASS|FAIL|BLOCKED|INCONCLUSIVE",
  "process_safety": "PASS|FAIL|INCONCLUSIVE",
  "tool_calls": null,
  "tokens": null,
  "wall_time_ms": null,
  "evidence_path": null,
  "failure_category": null
}
```

Never commit raw cookies, authenticated URLs, personal data, unreduced screenshots, session profiles, or tool traces containing secrets. Publish redacted summaries and reproducible evaluation metadata only.

## Publish gate

Only after the pilot is complete: add an A/B results report with sample counts, missing telemetry, failures and paired comparisons. Revise `SKILL.md` only for problems supported by those traces, and rerun the affected upstream cases. A claim such as “saves X% tokens” requires actually recorded usage under equivalent conditions; do not extrapolate from the eight exploratory browser checks.

## Running the controlled local pilot

The committed [runner](agent-ab-runner.mjs) implements a **four-case subset** (PW-01, PW-03, TI-01, TI-03) of this protocol, with two arms and two repeats (16 trials). It prompts Codex to write `automation.cjs`; a separate [grader](agent-ab-grader.mjs) can replay that script in a fresh Playwright browser context. It consumes existing public demonstration pages; it does not build a custom test website. This is a *development-task* A/B test, not an end-to-end assessment of an Agent's tool-native single-use browsing.

**Run in a disposable, credential-free development environment.** The scripts generated by Codex are code; `--grade` executes that generated code with Node.js permissions. Do not enable `--grade` on a machine with sensitive profiles, secrets, or valuable accessible files. Keep the browser unlinked from personal accounts. If isolation cannot be established, leave `--grade` off and review the generated scripts manually before running the grader.

Requirements: authenticated `codex` CLI, Node.js, a working Playwright Chromium browser, and network access to the two demonstration websites. From the repository root:

```bash
npm install --prefix evaluation
cd evaluation
npx playwright install chromium
node agent-ab-runner.mjs --dry-run
```

Run one A/B pair first, specifying an available Codex model and its reasoning effort:

```bash
node agent-ab-runner.mjs --cases PW-01 --repeats 1 --model YOUR_CODEX_MODEL --effort low
```

The command above **does not execute generated code**; each result is `INCONCLUSIVE` until independently graded. When running in a disposable environment where executing generated scripts is acceptable:

```bash
node agent-ab-runner.mjs --cases PW-01 --repeats 1 --model YOUR_CODEX_MODEL --effort low --grade
node agent-ab-runner.mjs --cases PW-01,PW-03,TI-01,TI-03 --repeats 2 --model YOUR_CODEX_MODEL --effort low --grade
```

- `YOUR_CODEX_MODEL` must be replaced by the **same actually available model** for every trial. Keep OS, Codex version, Playwright/browser version, model, effort and prompts constant. The launcher uses independent ephemeral Codex runs and places the current local Skill snapshot in B's project-only Skill directory. A has no project copy.
- Confirm the local `skills/web-automation-development/` snapshot equals the intended `v0.1.0` tag before claiming a `v0.1.0` result. The batch records the `SKILL.md` SHA-256; if the source has changed, label the result by commit/hash instead.
- The runner checks known user-scope locations for duplicate Skill installs and stops on detected collisions. Other global/project instructions or tool differences may still invalidate isolation: inspect the actual traces before treating results as controlled.
- Generated scripts, stderr and JSONL live in a unique batch below the OS temporary directory by default (or the explicitly configured `--output-root` outside the Git repository). The runner makes this directory separate from its own grading code to reduce answer-key leakage. `summary.json` contains structured results and measured telemetry; **do not publish the raw directory**. Redact paths, browser contents, and any secrets in a reviewed report. These directories are not an OS security boundary: use a disposable environment for `--grade`.
- The runner starts Codex with `--sandbox workspace-write` and `--ask-for-approval never`. It verifies effective permission by asking that same CLI to write one marker in a disposable directory. If the marker cannot be verified, no A/B trials start; see the private `permission.json` and probe trace.
- `skillFilePresent` records whether the task-local Skill file exists. `skillLoaded: OBSERVED_READ` records a successful command that returned content from the staged Skill and identifies the trace event; it is evidence of a read, not proof of native automatic activation. `INCONCLUSIVE` means the trace does not prove a read; it does not mean the Skill was unused. Record automatic activation only with reliable client evidence.
- `skillRulesFollowed` is `NOT_ASSESSED` until a reviewer checks applicable rules against the trace and artifact, separately from browser outcome. For PW-01, check whether the code verifies the specific todo after the action rather than equating clicks or page load with success. Record a verdict plus evidence; do not infer adherence from file presence, a Skill read, or a passing grader alone.
- The current grader verifies task-specific outcomes, including actual TodoMVC DOM state and Escape cancellation; the nested-frame test compares the returned frame values with independent reads. It does not prove a subject script's internal reasoning or cover API/UI selection. Record such process checks as unverified unless separately instrumented.

See the [2026-11-17 feasibility note](pilot-feasibility-2026-11-17.md) for why this runner could not execute a valid Codex/browser A/B trial in the original hosted environment. Do **not** include those failed prerequisites in an A-versus-B success-rate denominator.

The updated launcher was checked locally with `--cases PW-01 --repeats 1`. The CLI accepted the new flags and exited normally for the permission probe, but the marker was not created and the trace reported an effectively read-only workspace. The runner stopped before both trials. This is a local environment result, not a graded PW-01 result or a verified Skill load.
