# P0: native automatic-trigger pilot

Four fresh Codex app-server turns used gpt-6-luna at low reasoning effort. For each prompt A had no enabled matching Skill and B exposed the pinned v0.1.0 project Skill (f179e29a08cbfac155e3e20fc3121c9f67f1059e). The two arms received identical natural-language text per scenario, without a Skill name or a native explicit selection.

| Scenario | Expected in B | A and B observations |
| --- | --- | --- |
| Design a reusable TodoMVC automation module that adds a todo and verifies persistence after reload; provide code and advice without visiting the site | Candidate for automatic use | Both completed. Neither trace exposed the exact Skill body or a tool read. B automatic loading is inconclusive. |
| Explain in one sentence how to take a single screenshot of the upstream Nested Frames page; no execution or script development | Full development Skill need not load | Both completed. Neither trace showed a Skill body or read. No observed false trigger in this sample. |

The previously recorded [native explicit PW-01 test](pw01-native-skill-results.md) is a positive control: the same telemetry could expose the exact body when the Skill was explicitly selected. That does not establish that all implicit loader paths expose equivalent evidence. Do not report trigger accuracy or change the Skill description based on this pair of prompts. This pilot measures activation evidence only, not browser outcomes.
