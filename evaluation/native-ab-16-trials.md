# P1: native explicit-selection task batch

Four public upstream tasks × two fresh, read-only Codex app-server arms × two repeats = 16 independent trial outputs. Each pair used identical task text, gpt-6-luna, low reasoning effort and fresh browser contexts for independent grading. A had no enabled target Skill; B natively selected v0.1.0 (f179e29a08cbfac155e3e20fc3121c9f67f1059e). All 8 B traces exposed the exact tagged body; none of the 8 A traces did. No Skill text was appended to the prompt. This is not an automatic-trigger test.

| Case | A outcomes | B outcomes | Independently observed end state |
| --- | --- | --- | --- |
| PW-01 | 2/2 | 2/2 | One correct todo; active count one |
| PW-03 | 2/2 | 2/2 | Attempted edit and Escape observed; original todo retained |
| TI-01 | 2/2 | 2/2 | Loaded heading equals Hello World! |
| TI-03 | 2/2 | 2/2 | Returned values match independent middle/bottom frame reads |

Outputs were inspected, syntax-checked, and run with the same independent evaluator in fresh Edge contexts. Inputs and outputs below are per-turn reported tokens in repeat order; no cost is imputed. Tool calls were zero throughout. Comparable elapsed time was not instrumented.

| Case | A input / output (1; 2) | B input / output (1; 2) |
| --- | --- | --- |
| PW-01 | 26233/132; 26233/123 | 28930/152; 28930/123 |
| PW-03 | 26249/175; 26249/144 | 28946/177; 28946/177 |
| TI-01 | 26235/114; 26235/125 | 28932/123; 28932/135 |
| TI-03 | 26240/124; 26240/113 | 28937/125; 28937/120 |

Review of the artifacts found target readback in PW-01, Escape plus original-item checks in PW-03, content readiness checks in TI-01, and frame-scoped reads in TI-03 in both arms. These are case-specific observed rules, not a claim that every Skill instruction was followed. No scored failures were observed. The old grader's generic PW-01 success message wrongly mentioned edit cancellation; PW-01 never tested Escape, and its underlying list/counter checks were unaffected.

Both arms reached the same outcomes on this small sample. B reported 2,697 additional input tokens per turn; this includes the native context overhead and is not an estimate of net cost or broader efficiency. Raw traces and generated scripts are not published.
