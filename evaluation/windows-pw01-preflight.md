# PW-01 Windows preflight

This is a local environment and assertion check, not a Skill A/B result.

- Evaluator source: `29ed9d1d5badf51d805e4da6eb51b85daee638bb`. Its Skill tree matches the `v0.1.0` tag.
- `node evaluation/agent-ab-runner.mjs --dry-run` produced 16 planned trials. This validates scheduling only.
- Playwright 1.62.1 launched installed Edge 157.0.4341.60 headless. In a fresh browser context, the [official TodoMVC demo](https://demo.playwright.dev/todomvc/) initially had zero items. A trusted preflight script added `Buy groceries`; the observed list contained exactly that item and the active counter showed `1 item left`.
- The installed Codex CLI rejected `--full-auto` as an unexpected argument. In a disposable checkout, replacing it with `--sandbox workspace-write` allowed the A attempt to start, but its effective environment still reported read-only and denied shell access. It produced no automation file. B and the generated-code grader were not run in that attempt.

The browser result establishes that the target page and the PW-01 outcome assertions are usable in this environment. It does not establish Skill isolation, automatic loading, agent success, or relative cost. The grader loads generated Node code; run it only in a separately isolated environment that has no sensitive credentials. Raw traces and machine-specific paths are excluded from this report.
