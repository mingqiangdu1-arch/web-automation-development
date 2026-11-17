# PW-01 generation-only pilot

This is a reproducible read-only variant of the Windows pilot, not a scored A/B benchmark. To avoid the nested CLI workspace-write blocker, both arms received the same PW-01 task and were asked to return a CommonJS Playwright function in the final response, without using shell, file, browser or MCP tools. Both used `gpt-6-luna` with low reasoning effort. A had no task-local Skill; B was supplied a task-local copy of the exact `v0.1.0` Skill tree (tag commit `f179e29a08cbfac155e3e20fc3121c9f67f1059e`).

| Observable | A | B |
| --- | ---: | ---: |
| Returned JavaScript | yes | yes |
| Extracted JavaScript passed `node --check` | yes | yes |
| Tool calls in the trace | 0 | 0 |
| Reported input tokens | 20,341 | 20,467 |
| Reported cached input tokens (subset of input) | 11,648 | 11,648 |
| Reported output tokens | 95 | 89 |

Neither trace showed a Skill file read. A's effective Skill discovery inventory was not independently captured, and actual B loading/use is inconclusive. Neither generated script was executed; no independent browser outcome was assigned. This is one pair of generation outputs under the alternate protocol. It establishes that both attempts returned syntactically valid code, not a task success rate, automatic activation rate, or Skill cost benefit. Scored pairs remain **0**.

For the next scored pilot, capture the effective arm inventories, separate explicit Skill use from automatic activation, and run independent grading in a disposable environment. See [Windows PW-01 preflight](windows-pw01-preflight.md) for the separately observed browser outcome.
