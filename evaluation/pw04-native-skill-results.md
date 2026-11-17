# PW-04: native Skill A/B on filtering and persistence

Four fresh Codex app-server runs used gpt-6-luna at low effort, identical PW-04 task text and separate workspaces. A had no enabled target Skill. Both B trials explicitly selected the v0.1.0 project copy via native Skill input. The exact tagged SKILL.md body was observed in the raw trace for B1/B2 and not for A1/A2. No Skill body was appended to the task prompt. This does not measure automatic triggering.

The four outputs were reviewed before replay in independent, fresh Edge/Playwright contexts on the [official TodoMVC demo](https://demo.playwright.dev/todomvc/). The evaluator recorded the candidate scripts' own visits and visible rows for Active and Completed before and after one reload. It separately checked persisted storage and performed independent filter/reload readbacks. Each script itself checked the filtered lists and completed successfully.

| Trial | Native Skill body observed | Browser result | Reported input / output tokens |
| --- | --- | --- | --- |
| A1 | No | PASS | 26,252 / 497 |
| A2 | No | PASS | 26,252 / 351 |
| B1 | Yes | PASS | 29,139 / 464 |
| B2 | Yes | PASS | 28,945 / 426 |

All four trials created two records, marked exactly one completed, and preserved the correct filter results after reload. A and B both passed 2/2. This is one exploratory scenario, not evidence of a Skill improvement. Reported input includes context and cached tokens; do not infer billed cost or timing from these counts. The agent generated code without driving the browser itself; this is not an autonomous browser exploration measure. No raw trace, generated code, or profile is published.
