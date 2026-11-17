# P1: TI-01 first native explicit pair

Two fresh read-only Codex app-server turns used the same task, gpt-6-luna and low reasoning effort. A had no enabled target Skill; B selected the pinned v0.1.0 project Skill through native Skill input. The raw trace contained the exact tagged body in B and not in A. Reviewed JavaScript outputs were syntax-checked and run by the existing independent grader in fresh Edge contexts against [Dynamic Loading Example 2](https://the-internet.herokuapp.com/dynamic_loading/2).

| Measure | A | B |
| --- | --- | --- |
| Task-local Skill file / actual read into context | Absent / not observed | Present / verified |
| Checks business readiness | Waits for visible result heading and checks exact text | Waits for visible result container and exact text |
| Independent browser result | PASS: Hello World! | PASS: Hello World! |
| Agent tool calls | 0 | 0 |
| CLI input / output tokens | 26,209 / 114 | 28,892 / 122 |

This is one TI-01 pilot pair, not the 16-trial batch. Both implementations exhibit the observable business-readiness rule; this does not show that the Skill caused adherence or improved efficiency. Comparable trial timing was not instrumented for this pair. No raw traces or generated code are published.
