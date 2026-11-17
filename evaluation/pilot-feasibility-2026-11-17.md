# A/B pilot feasibility — 2026-11-17

**Status: BLOCKED in the current hosted executor; no independent A/B trial was completed.** This is an environment diagnostic, not evidence of Skill effectiveness. The previous [eight online smoke checks](online-smoke-2026-11-17.md) are not counted here.

## Actual checks

| Probe | Observation | Consequence |
| --- | --- | --- |
| Public TodoMVC endpoint | `curl -I https://demo.playwright.dev/todomvc/` returned HTTP 200 | The site was reachable from the executor at the time of the probe. |
| Codex CLI | `codex-cli 0.167.0-alpha.4`; `codex exec --json` exists | A noninteractive evaluation interface is present. |
| Codex MCP availability | `codex mcp list` returned no configured servers | No browser MCP was available to isolated Codex processes. |
| Installed Playwright package | `playwright` 1.62.1 resolved in the executor | JavaScript API package present, but a runnable local browser was not assured. |
| Browser launch | Playwright's managed Chromium executable was absent; `/usr/bin/chromium` launch failed with `socket() failed: Operation not permitted (1)` | Local Playwright browser trials could not run here. |
| Independent Codex startup | A minimal `codex exec --json --ephemeral --ignore-user-config` probe failed to initialize local state with `Read-only file system (os error 30)` | No controlled Codex run was captured in this environment. |

## Resolution

The current executor cannot satisfy the browser and independent Codex prerequisites. Do not label this as an A/B failure by either arm, or extrapolate from the earlier operator-controlled browser checks.

Use the [local runner](agent-ab-runner.mjs) in a disposable development VM/container or a local environment with working Codex CLI and Playwright Chromium. Confirm that neither arm inherits a globally installed copy of this Skill. Run the exact same prompts and environment for both arms. Keep raw JSONL traces and generated scripts private; only share reviewed aggregate results.

The runner uses existing upstream TodoMVC/The Internet tasks and does **not** create a new test website. Its independent grader checks page state after running generated scripts. This assesses scripted task completion, not the full value of route planning or all Skill behaviors. Skill activation remains `INCONCLUSIVE` unless observable from the Codex trace.
