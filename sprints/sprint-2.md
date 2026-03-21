# Sprint 2: Web UI Frontend

**Project ID**: wishlist-tester-2026-03
**Sprint**: 2 of 4
**Duration**: Week 2 (2026-03-28 to 2026-04-04)
**Goal**: Full Web UI with JSON editor, results panel, toolbar, history — ready to connect to backend
**Status**: PLANNED

---

## Task Details

### Task 2.1: React + Vite + TailwindCSS Setup [Frontend]
**Status**: [NOT STARTED]
**Estimated**: 2 hours | **Actual**: - hours
**Story Points**: 2
**Wireframe**: -

**Deliverables**:
- [ ] src/client/index.html
- [ ] src/client/main.tsx
- [ ] src/client/App.tsx (main layout with split panels)
- [ ] src/client/vite.config.ts
- [ ] src/client/tailwind.config.ts

**Acceptance Criteria**:
- [ ] Vite dev server runs on port 5273
- [ ] TailwindCSS configured and working
- [ ] Split panel layout renders (left editor, right results)

---

### Task 2.2: JSON Editor Component (CodeMirror 6) [Frontend]
**Status**: [NOT STARTED]
**Estimated**: 3 hours | **Actual**: - hours
**Story Points**: 5
**Wireframe**: 01-main-screen.md

**Deliverables**:
- [ ] src/client/components/Editor/JsonEditor.tsx
- [ ] src/client/components/Editor/index.ts

**Acceptance Criteria**:
- [ ] [FR6.3] CodeMirror 6 with JSON syntax highlighting
- [ ] JSON validation errors shown inline
- [ ] Resizable panel width
- [ ] Dark theme support

---

### Task 2.3: Results Panel Component [Frontend]
**Status**: [NOT STARTED]
**Estimated**: 3 hours | **Actual**: - hours
**Story Points**: 5
**Wireframe**: 02-results-panel.md

**Deliverables**:
- [ ] src/client/components/Results/ResultsPanel.tsx
- [ ] src/client/components/Results/TestResultCard.tsx
- [ ] src/client/components/Results/SummaryBar.tsx
- [ ] src/client/components/Results/index.ts

**Acceptance Criteria**:
- [ ] [FR6.4] Displays test results in real-time stream
- [ ] Each result shows: name, type badge (api/ui), status (pass/fail), duration
- [ ] Expandable details: assertion results, expected vs actual
- [ ] [FR6.9] Shows screenshot for UI test failures
- [ ] Summary bar: total, passed, failed, duration

---

### Task 2.4: Toolbar Component (Run/Abort/Save/Load/URL) [Frontend]
**Status**: [NOT STARTED]
**Estimated**: 3 hours | **Actual**: - hours
**Story Points**: 5
**Wireframe**: 01-main-screen.md

**Deliverables**:
- [ ] src/client/components/Toolbar/Toolbar.tsx
- [ ] src/client/components/Toolbar/SaveLoadDialog.tsx
- [ ] src/client/components/Toolbar/index.ts

**Acceptance Criteria**:
- [ ] [FR6.5] Run button triggers test execution
- [ ] [FR6.6] Abort button stops running tests
- [ ] [FR6.7] Save/Load dialog for test-suites/
- [ ] [FR6.10] URL input field for target web page
- [ ] Buttons disabled/enabled based on run state

---

### Task 2.5: History Panel + URL Preview + Hooks [Frontend]
**Status**: [NOT STARTED]
**Estimated**: 2 hours | **Actual**: - hours
**Story Points**: 3
**Wireframe**: 03-history-panel.md

**Deliverables**:
- [ ] src/client/components/History/HistoryPanel.tsx
- [ ] src/client/components/Preview/UrlPreview.tsx
- [ ] src/client/hooks/useTestRun.ts
- [ ] src/client/hooks/useSSE.ts

**Acceptance Criteria**:
- [ ] [FR6.8] History list shows past runs with date, suite name, pass/fail count
- [ ] Click to view past run details
- [ ] [FR6.10] URL preview iframe or link to target page
- [ ] useSSE hook handles EventSource connection
- [ ] useTestRun hook manages run state, results, abort

---

## Sprint Backlog (Machine-Parseable)

| ID | Task | Points | Status | Assignee | Wireframe |
|----|------|--------|--------|----------|-----------|
| 2.1 | React + Vite + TailwindCSS setup | 2 | | Frontend | - |
| 2.2 | JSON editor component (CodeMirror 6) | 5 | | Frontend | 01-main-screen.md |
| 2.3 | Results panel component | 5 | | Frontend | 02-results-panel.md |
| 2.4 | Toolbar (Run/Abort/Save/Load/URL) | 5 | | Frontend | 01-main-screen.md |
| 2.5 | History panel + URL preview + hooks | 3 | | Frontend | 03-history-panel.md |
| 2.6 | Code Review: Sprint 2 | 2 | | Reviewer | - |
| 2.7 | QA: Test Sprint 2 tasks | 3 | | QA | - |

---

## Sprint Summary

| Metric | Value |
|--------|-------|
| Total Tasks | 7 |
| Story Points | 25 |
| Estimated Hours | 13h |
| Actual Hours | -h |
| Velocity | -% |

| Role | Tasks | Points | Hours |
|------|-------|--------|-------|
| Frontend | 5 | 20 | 13h |
| Reviewer | 1 | 2 | -h |
| QA | 1 | 3 | -h |

---

## Definition of Done

### Functional Criteria
- [ ] JSON editor has syntax highlighting and validation
- [ ] Results panel renders test cards with pass/fail status
- [ ] Toolbar buttons work (Run triggers callback, Abort triggers callback)
- [ ] Save/Load dialog lists and manages test suite files
- [ ] History panel shows past run list

### Technical Criteria
- [ ] All tasks marked [COMPLETE] in Sprint Backlog
- [ ] Code reviewed (LGTM from google-code-reviewer)
- [ ] No TypeScript errors
- [ ] Components are properly typed with React.FC

### Quality Criteria
- [ ] UI looks clean, developer-tool aesthetic
- [ ] Responsive split panel layout
- [ ] No console errors

---

## Dependencies

| Dependency | Reason | Status |
|------------|--------|--------|
| Sprint 1 complete | Core types needed for result interfaces | Pending |
| Task 2.1 → all others | Vite/React setup needed first | Pending |
| Wireframes ready | UX wireframes for component layout | Pending |

---

## Risks & Blockers

| # | Type | Description | Impact | Mitigation | Owner | Status |
|---|------|-------------|--------|------------|-------|--------|
| 1 | Risk | CodeMirror 6 bundle size may be large | L | Tree-shake, lazy load | Frontend | Open |

---

## Notes

- All frontend code in src/client/ directory
- Components connect to backend in Sprint 3
- For Sprint 2, use mock data/callbacks to test UI components independently
- Wireframes from Sprint 0 guide component layout

---

## Sprint Retrospective

### What Went Well
- {TBD}

### What Needs Improvement
- {TBD}

### Carry Over to Next Sprint
- {TBD}

### Time Analysis
| Metric | Estimated | Actual | Variance |
|--------|-----------|--------|----------|
| Total Hours | 13h | TBDh | - |
| Velocity | 100% | -% | - |
