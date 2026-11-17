# GAD P0: gpt-6-luna field-semantics rerun

One sequential native app-server A/B pair used gpt-6-luna (low), GAD 2.5.5, fresh workspaces and identical read-only API-only development tools. The expected output came from independent real API reads and included exact JSON types, 20 ranked article IDs, detail fields, linked comment counts and a complete summary. Both collectors ran twice; the source dataset fingerprint remained unchanged. A had no enabled target Skill, and the trace confirmed native loading of the frozen Skill in B. Neither task prompt named user_id as the prior source of failure.

Dataset gate: db-base-v2 was not present in the tested upstream image. db-base-big had sufficient records, but the latest 20 only contained numeric user_id values; it was unsuitable for the targeted mixed-type test. The original default snapshot provides the required edge case. This therefore reproduces the task under a different model, **not** on a different dataset.

| Measure | A: no Skill | B: native Skill |
| --- | ---: | ---: |
| Independent runs passing all output checks | 2/2 | 2/2 |
| Stable repeated output | yes | yes |
| Failed collector executions | 0 | 0 |
| Total lab tool calls (exploration GETs) | 10 (6) | 16 (12) |
| Observed input / output tokens | 172,547 / 1,598 | 324,618 / 1,543 |
| End-to-end elapsed seconds | 43.27 | 51.81 |

Both arms preserved the mixed source type; the earlier A-only conversion failure did not reproduce. B performed more exploratory calls and incurred more observed tokens and elapsed time in this one pair. Token counts include repeated context, not a billing estimate. No correctness or efficiency gain was observed on this pair; the small sample and reused data do not establish a general conclusion. The API/UI choice is outside P0.
