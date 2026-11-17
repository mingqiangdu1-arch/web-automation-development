# Online browser smoke checks — 2026-11-17

> **Exploratory browser checks, not a Skill efficacy benchmark.**  
> 8/8 selected page outcomes observed as expected; one run per case.  
> The `web-automation-development` Skill was **not** independently auto-triggered, and no no-Skill/with-Skill comparison, token accounting, or upstream automated test-suite run was conducted.

## Scope and method

- **Sites:** [Playwright TodoMVC demo](https://demo.playwright.dev/todomvc/) and [Sauce Labs The Internet](https://the-internet.herokuapp.com/).
- **Sources:** [Playwright TodoMVC test plan](https://github.com/microsoft/playwright/blob/main/examples/todomvc/specs/basic-operations.plan.md) and [The Internet examples](https://github.com/saucelabs/the-internet).
- **Executor:** connected Edge browser, operated through semantic browser controls and read-only DOM inspection. These actions were performed in this evaluation session; they were **not** a clean Codex baseline run.
- **Method:** perform the upstream example's user-visible operation, then independently inspect the final page state, applicable business text, frame scope, or rendered list.
- **Isolation:** TodoMVC used newly entered demonstration data in the browser's client-side state. The Internet examples were used without login or persistent business writes.
- **Evidence retention:** observed state summaries are recorded below. Full browser traces, screenshots and per-call token usage were **not** archived as artifacts; this report is not independently replayable as-is.

## Observed results

| Case | Existing upstream scenario | Expected observable state | Observed evidence | Outcome |
| --- | --- | --- | --- | --- |
| PW-01 | TodoMVC — add a single todo | New item appears; active count becomes 1 | `Buy groceries` rendered; counter `1 item left` | PASS |
| PW-02 | TodoMVC — edit a todo by double-click | Updated content shown; edit mode closes | `Buy organic groceries` rendered as a list item; edit box closed | PASS |
| PW-03 | TodoMVC — cancel edit with Escape | Original value preserved | Entered a temporary alternative and pressed Escape; prior content remained | PASS |
| PW-04 | TodoMVC — filter and persistence | Active/Completed show their appropriate items; state survives reload | Rendered Active list contained `Walk the dog`; Completed contained `Buy organic groceries`; checked state and content persisted after reload | PASS |
| TI-01 | The Internet — Dynamic Loading, Example 2 | Element appears after asynchronous delay | Final page contained heading `Hello World!` | PASS* |
| TI-02 | The Internet — Dynamic Controls, Enable/disable | Disabled input becomes enabled and accepts text | `Wait for it…` intermediate state; then enabled textbox accepted `ready` and page displayed `It's enabled!` | PASS |
| TI-03 | The Internet — Nested Frames | Reads come from the intended nested frame | `frame-top → frame-middle` yielded `MIDDLE`; `frame-bottom` yielded `BOTTOM` | PASS |
| TI-04 | The Internet — Shadow DOM | Correct host and slotted content identified | Two `my-paragraph` hosts; second contained `In a list!` | PASS |

`*` TI-01: an exact-text wait locator timed out although a later page snapshot and heading check showed the correct final state. This is a **locator/observation discrepancy**, not evidence that the site failed to render. The case is PASS for page outcome, with an evaluator reliability warning.

## Diagnostics worth retaining

1. **PW-04 — visibility ambiguity.** An early locator visibility check conflicted with the filter's on-screen list. Inspecting the DOM-backed, actually rendered `.todo-list li` elements resolved the ambiguity: Active showed `Walk the dog`; Completed showed `Buy organic groceries`. Future assertions should scope to the rendered business list, not use a single broad element existence/visibility signal.
2. **TI-01 — wait false negative.** The text-based wait reported a timeout, but the final heading was present. Separate **operation execution**, **selector behavior**, and **business final state** when assigning failures. Do not blindly retry an action merely because one observation primitive fails.
3. **TI-03 — frameset gap.** The top-level accessibility snapshot was empty on the legacy nested-frames page. The frame tree and correct text were still inspectable by entering the identified frame scope. A blank top-level snapshot does not prove the target page is blank.

## What these results do *not* establish

- **No Skill task success rate.** 8/8 describes the selected page behaviors when operated with browser tools; it is **not** evidence of an Agent loading, obeying or benefiting from this Skill.
- **No A/B efficiency gain.** There was no clean no-Skill arm, no controlled model/tool budget, no repeated run, and no normalized call/time/token ledger.
- **No write-recovery validation.** TodoMVC uses client-side state; server-side committed-but-response-lost, duplicate-submit prevention and API/UI equivalence remain untested.
- **No upstream suite pass.** Existing upstream scenarios/pages were exercised manually through browser controls; official Playwright/Sauce Labs test runners were not executed.
- **No generalizability claim.** The cases were each observed once and do not establish robust success across browsers, page versions or sites.

## Next experiments and release gates

1. **Clean automatic-trigger tests.** In a fresh Codex context, compare user phrasing with and without explicit `$web-automation-development` and record actual Skill-loading evidence. Include negative controls such as single screenshots or generic tool comparisons.
2. **Controlled A/B.** For a fixed subset of upstream scenarios, run default Agent versus `v0.1.0` in independent fresh contexts, same model, tool permissions, prompt, initial browser state and budget; repeat trials. Count business outcomes separately from process/safety conformance.
3. **Business write safety.** Prefer existing Restful Booker Platform tests in a locally isolated upstream instance; only consider response-failure injection if the server-committed/client-unknown condition is actually verified. If unavailable, label `NOT_COVERED`.
4. **Benchmark breadth.** Add existing BrowserGym/MiniWoB++ cases after checking upstream reward semantics; do not treat a reward signal as sufficient evidence without spot-checking final state.
5. **Publish only honest metrics.** Record evaluator version, upstream revision, PASS/FAIL/BLOCKED/INCONCLUSIVE, evidence location, actual usage data if available and explicit limitations. No claimed efficiency percentage before reproducible paired runs.

## Status

| Dimension | Current evidence |
| --- | --- |
| Selected online page outcomes | **8/8 observed PASS**, single-run exploratory checks |
| Skill auto-trigger | **Not measured** |
| Skill rule compliance | **Not measured as an independent Agent evaluation** |
| A/B task success lift | **Not measured** |
| Token/cost reduction | **Not measured** |
| API/UI route decisions | **Not measured** |
| Server write/recovery | **Not covered** |

This is an evidence baseline for planning `v0.2.0`, not a release qualification by itself.
