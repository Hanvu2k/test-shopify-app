# Memory Index — google-code-reviewer

## Project

- [Sprint 1 code review findings](project_sprint1_findings.md) — Dead code duplication in api-runner/playwright-runner, singleton concurrency risk, null serialization bug. Verdict: NEEDS MINOR.
- [Sprint 2 code review findings](project_sprint2_findings.md) — Module-scoped CodeMirror compartments, hardcoded aria-selected, dead ref, App.tsx not wired to real components. Verdict: NEEDS MINOR.
- [Sprint 3 code review findings](project_sprint3_findings.md) — Dead accumulatedResultsRef persists, saveSuite uncaught SyntaxError, misleading history timestamps, SSE event: line ignored, CLI process.exit inside function. Verdict: NEEDS MINOR.
- [Sprint 4 code review findings](project_sprint4_findings.md) — Dockerfile broken (npm ci --production excludes vite+tsx), CI doesn't build server TS, runApiTest dead-code duplication. Verdict: NEEDS MAJOR.
- [Sprint 5 code review findings](project_sprint5_findings.md) — Wrong node type string breaks jsonToFlow import, FlowBuilder not wired to BlockPalette/BlockProperties, ICON_MAP duplicated 3x, incomplete barrel. Verdict: NEEDS MAJOR.
