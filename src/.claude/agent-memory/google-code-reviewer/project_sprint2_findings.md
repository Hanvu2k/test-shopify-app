---
name: Sprint 2 code review findings
description: React frontend component issues found in Sprint 2 — module-scoped compartments, ARIA bugs, dead code, missing App.tsx wiring
type: project
---

Verdict: NEEDS MINOR. 2 major findings, 7 minor.

**Major issues identified:**

1. `editableCompartment` / `readOnlyCompartment` declared at module scope in `JsonEditor.tsx` — break multi-instance usage because Compartments are per-EditorState. Must be moved inside the component or a useRef.
2. `aria-selected="false"` hardcoded on every `role="option"` button in `SaveLoadDialog.tsx` — always false, never reflects actual selection. Drop `role="option"` + `aria-selected` or manage selection state properly.

**Minor issues:**

- `formatDuration` duplicated verbatim in SummaryBar.tsx, HistoryPanel.tsx, TestResultCard.tsx — extract to shared utils.
- Key prop in HistoryPanel result list uses `name-index` — fragile on reorder. Use stable id.
- SSE reconnect in useSSE.ts restarts the entire test run (no resume), undocumented — add warning comment or remove reconnect logic.
- `aria-hidden="false"` on HistoryPanel backdrop div is redundant default — remove.
- `accumulatedResultsRef` in useTestRun.ts is written but never read — dead ref, remove.
- App.tsx still uses placeholder sub-components with task-reference text (Task 2.2, Task 2.3) — real components not wired in; limits QA coverage.
- UrlPreview sandbox: `allow-scripts` + `allow-same-origin` together disable sandboxing for same-origin iframes — safe for external Shopify URLs but needs a code comment warning against pointing at localhost.

**Why:** No security-critical issues. No hardcoded credentials. No `any` types. Hook rules followed correctly. ARIA intent is good but execution has two bugs.

**How to apply:** Sprint 3 review should verify: (1) App.tsx wires real components, (2) compartments moved to instance scope in JsonEditor, (3) SaveLoadDialog ARIA corrected.
