# GAD P1: gpt-6-luna API/UI route pair

One sequential native A/B pair used gpt-6-luna (low), identical prompts and a fixed GAD 2.5.5 snapshot. A had no enabled target Skill; B's trace confirmed native loading of the frozen Skill. Both agents had identical REST GET, artifact and execution tools plus a genuinely rendered Playwright snapshot broker for public list and detail pages. The broker used a fresh browser context, supported 24 rendered article links, and was available to collector code at runtime. It was not unrestricted Playwright; business writes were denied. The article/comment dataset fingerprint remained unchanged.

| Measure | A: no Skill | B: native Skill |
| --- | --- | --- |
| Final required output | FAIL: malformed JSONL and summary | PASS twice under the repository's six-field criterion |
| Executions | 5 | 4 |
| Tool calls (UI / API exploration) | 17 (3 / 5) | 19 (2 / 9) |
| Observed input / output tokens | 417,382 / 4,809 | 504,983 / 2,026 |
| End-to-end elapsed seconds | 133.18 | 88.62 |

Both explored actual UI and API. A retained browser list snapshot verification in the final collector and used API for details and counts, but emitted literal backslash-n separators and trailing text rather than parseable JSONL/JSON. Exit 0 and its declared summary did not constitute success. B first attempted per-record comparison of displayed text to raw API bodies and produced only three records. It then removed runtime browser verification and delivered stable API results for the required fields and counts. Its observed UI/API cross-check covers a sample article and the list, not independent per-record UI verification for all 20. Its run document incorrectly retained the earlier claim that the final collector checks all detail snapshots.

The temporary evaluator originally compared whole objects and rejected B's harmless additional image field. The repository protocol compares the six named fields (including JSON type); a symmetric regrade of saved outputs under that criterion passed B's final two runs. No reruns or changes were made to the delivered code. This is an output-quality contrast in one pair, not a full process pass in B and not evidence of causation or general efficiency. B used more observed tokens and tools, although this sequential B run ended sooner. Raw traces remain private. See [P0](gad-luna-p0-field-semantics.md) for the separate field-semantics replication.
