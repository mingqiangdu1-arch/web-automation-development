# GAD developer-value pilot: restricted Docker pair

One completed local pair used gpt-6.1-sol, low reasoning effort, the same task and tools, and a disposable GAD 2.5.5 instance. A had no enabled target Skill; B selected the repository Skill at `374107efc4080c91f529f76cf3d1d23140dfa088` through native app-server Skill input. The raw context trace exposed the exact Skill body only in B. The initial orchestration attempt hit a JSON-RPC request/response ID collision before generating any artifacts; it is excluded. The scored pair used fresh workspaces.

This is an **API-only tooling variant**, not a completed run of the original unrestricted UI/API-choice runner. Both agents could explore allowlisted real GET endpoints, save their own collector and run document, execute and debug the collector, and inspect actual run output. Each execution used a disposable, non-root container with read-only root, temporary output, no credential mounts, and access to GAD through a GET-only proxy. A network probe showed direct GAD access was unavailable and the proxy rejected POST. The independent evaluator compared all six output fields (including JSON types), ID order, comment counts and completion summary to the GAD API oracle. The article/comment dataset fingerprint was unchanged.

| Measure | A | B |
| --- | ---: | ---: |
| Final strict output | FAIL: one user_id type mismatch | PASS |
| Final record count, ID order, comment counts | 20, correct, correct | 20, correct, correct |
| Last two runs of the same collector agree | Yes | Yes |
| Collector executions / nonzero exits | 4 / 2 | 3 / 1 |
| Lab tool calls | 14 | 14 |
| Reported input / output tokens | 277,586 / 2,243 | 338,741 / 2,184 |
| Elapsed seconds (concurrent, descriptive only) | 78.64 | 81.63 |

Both first implementations rejected a legitimate source record whose user_id was a string. A eventually coerced it to a number, producing a stable but nonconforming result; B accepted numeric strings and preserved the source value. B passed twice with the same collector. The quality difference is one field type in one pair, not a claim that the Skill caused it or generalizes. B used 61,096 more total recorded tokens; these counts include repeated context and do not represent billed cost. The route comparison, automatic triggering, and unknown-write recovery are unmeasured. Raw traces and outputs are private.
