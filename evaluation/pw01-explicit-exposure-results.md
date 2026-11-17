# PW-01: independent browser results with explicit Skill exposure

The standard workspace-writing runner was blocked on this host. This bounded variant used two read-only Codex CLI calls with the same TodoMVC task, `gpt-6-luna`, low reasoning effort, and an invocation-only disable for the user-installed Skill. A received the task alone. B received the same task plus the exact `v0.1.0` SKILL.md from commit `f179e29a08cbfac155e3e20fc3121c9f67f1059e` in its input. This tests explicit content exposure, not Codex's native Skill loader.

Both outputs were checked against an exact allowed program before execution; the only difference was a local variable name. The existing independent PW-01 grader then executed each output in a fresh Edge browser context on the official Playwright TodoMVC demo.

| Recorded measure | A | B |
| --- | --- | --- |
| Task-local Skill file present | No | No; text provided inline |
| Content supplied | No | Yes |
| Native Skill loaded / auto-triggered | Not measured | Not measured |
| Observable post-action verification rule | Followed: exact target text waited for | Followed: exact target text waited for |
| Independent browser outcome | PASS: exactly one Buy groceries; 1 item left | PASS: exactly one Buy groceries; 1 item left |
| CLI input / output tokens | 20,173 / 92 | 22,701 / 89 |

One independently scored pair for this variant; zero scored pairs for the original native-activation protocol. Neither semantic quality nor an efficiency benefit can be inferred from an identical solution and one sample. Token counts are single-run observations and include the added Skill text in B. PW-01 does not exercise edit cancellation, unknown-write recovery or any other scenario. Raw traces and generated files are not distributed.
