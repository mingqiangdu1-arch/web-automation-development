# PW-01: native, explicitly selected Skill A/B

One independently browser-graded pair completed using Codex app-server. Both fresh, read-only threads used gpt-6-luna with low reasoning effort and identical task text. Outputs were returned as text and captured outside Codex. The user-installed copy was disabled through a process-local configuration. A had no enabled matching Skill; B had exactly one enabled project Skill from tag v0.1.0 (commit f179e29a08cbfac155e3e20fc3121c9f67f1059e).

B used the native turn/start input type `skill`, passing only its name and path. No Skill body was appended to the task prompt. The app-server trace contained a rawResponseItem/completed message with the exact tagged SKILL.md in B, and none in A. This verifies explicit native loading, not automatic discovery or triggering.

| Observable | A | B |
| --- | --- | --- |
| Task-local Skill file present | No | Yes |
| Exact Skill body in native context trace | Not observed, and no enabled copy in skills/list | Verified |
| Observable rule: verify the target after the action | Followed: waits for exact visible text | Followed: waits for the matching list item |
| Independent PW-01 outcome | PASS | PASS |
| Browser end state | Exactly one Buy groceries; 1 item left | Exactly one Buy groceries; 1 item left |

Both returned programs passed syntax checking and an exact, task-specific statement allowlist before the existing grader executed them in separate fresh Edge browser contexts. This is a single valid native explicit-selection pair, under a read-only generation variant. It does not establish a Skill improvement, native automatic triggering, or the workspace-write runner's compatibility. No raw traces or generated code are published.
