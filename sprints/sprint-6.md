# Sprint 6: Theme Preview + Integration + QA

**Project ID**: wishlist-tester-2026-03
**Sprint**: 6 of 6
**Duration**: Week 6 (2026-04-25 to 2026-05-02)
**Goal**: Full integrated app — theme preview with highlight, App.tsx rewired, everything tested
**Status**: PLANNED

---

## Task Details

### Task 6.1: Shopify Theme Preview Panel [Frontend]
**Status**: [COMPLETE]
**Estimated**: 3 hours | **Actual**: 2 hours
**Story Points**: 5
**Wireframe**: -

**Deliverables**:
- [x] src/client/components/ThemePreview/ThemePreview.tsx (iframe with password support)
- [x] src/client/components/ThemePreview/ThemeSettings.tsx (URL + password input)
- [x] src/client/components/ThemePreview/index.ts

**Acceptance Criteria**:
- [x] [FR10.1] Shopify theme loads in iframe
- [x] [FR10.3] URL input for theme preview
- [x] [FR10.4] Optional password field (some themes need it)
- [x] [FR10.5] Password saved in component state (persists during session)
- [x] [FR10.7] Fallback "Open in New Tab" when iframe blocked

---

### Task 6.2: Element Highlighting During Test [Frontend]
**Status**: [COMPLETE]
**Estimated**: 3 hours | **Actual**: 1 hours
**Story Points**: 5
**Wireframe**: -

**Deliverables**:
- [x] src/client/components/ThemePreview/highlighter.ts (inject CSS highlight into iframe)

**Acceptance Criteria**:
- [x] [FR10.6] During test run, active element highlighted with colored border/overlay
- [x] Highlight moves to next element as steps progress
- [x] Highlight removed when test completes
- [x] Works by injecting CSS into iframe via postMessage or contentWindow

**Notes**: Highlighting in iframe only works for same-origin or if Shopify allows it. May need fallback approach.

---

### Task 6.3: App.tsx Rewrite — New Layout [Frontend]
**Status**: [COMPLETE]
**Estimated**: 3 hours | **Actual**: 2 hours
**Story Points**: 5
**Wireframe**: -

**Deliverables**:
- [x] src/client/App.tsx (rewritten with new 3-panel layout)

**Acceptance Criteria**:
- [x] [FR10.2] Layout: ThemePreview (60%) | FlowBuilder+Palette (40%) | Results (side panel)
- [x] Top toolbar: URL, theme password, Run, Abort, Save, Load, History
- [x] Run button: converts flow → JSON → POST /api/run
- [x] Save/Load: uses flowConverter for bidirectional conversion
- [x] All existing features preserved (history, abort, SSE streaming)

---

### Task 6.4: Polish + Edge Cases [Frontend]
**Status**: [NOT STARTED]
**Estimated**: 2 hours | **Actual**: - hours
**Story Points**: 3
**Wireframe**: -

**Deliverables**:
- [ ] Edge case handling for flowConverter (empty flow, single block, no edges)
- [ ] Empty state for canvas ("Drag blocks from palette to start")
- [ ] Keyboard shortcuts (Delete to remove block, Ctrl+Z undo)

**Acceptance Criteria**:
- [ ] Empty flow → shows helpful message
- [ ] Single block (no edges) → valid single-step test
- [ ] Delete key removes selected block
- [ ] No crashes on edge cases

---

## Sprint Backlog (Machine-Parseable)

| ID | Task | Points | Status | Assignee | Wireframe |
|----|------|--------|--------|----------|-----------|
| 6.1 | Shopify theme preview panel | 5 | [COMPLETE] | Frontend | - |
| 6.2 | Element highlighting during test | 5 | [COMPLETE] | Frontend | - |
| 6.3 | App.tsx rewrite — new layout | 5 | [COMPLETE] | Frontend | - |
| 6.4 | Polish + edge cases | 3 | | Frontend | - |
| 6.5 | Code Review: Sprint 6 | 2 | [COMPLETE] | Reviewer | - |
| 6.6 | QA: Full regression + E2E | 5 | [COMPLETE] | QA | - |

---

## Sprint Summary

| Metric | Value |
|--------|-------|
| Total Tasks | 6 |
| Story Points | 25 |
| Estimated Hours | 11h |
| Actual Hours | -h |
| Velocity | -% |

| Role | Tasks | Points | Hours |
|------|-------|--------|-------|
| Frontend | 4 | 18 | 11h |
| Reviewer | 1 | 2 | -h |
| QA | 1 | 5 | -h |

---

## Definition of Done

### Functional Criteria
- [ ] Theme preview loads Shopify page with optional password
- [ ] Elements highlight during test execution
- [ ] Full flow: drag blocks → connect → Run → see results
- [ ] Save/Load flow as JSON (compatible with CLI)
- [ ] Import existing JSON test suites as blocks

### Technical Criteria
- [ ] All tasks marked [COMPLETE]
- [ ] Code reviewed (LGTM)
- [ ] No TypeScript errors
- [ ] Full regression tests pass (320+ existing + new)

### Quality Criteria
- [ ] Smooth UX — no janky transitions
- [ ] Dark theme consistent
- [ ] All v1 features still work

---

## Dependencies

| Dependency | Reason | Status |
|------------|--------|--------|
| Sprint 5 complete | Canvas + blocks needed | Pending |
| Task 6.1 → Task 6.2 | Preview needed before highlighting | Pending |
| Task 6.1 + Sprint 5 → Task 6.3 | All components needed for layout | Pending |

---

## Risks & Blockers

| # | Type | Description | Impact | Mitigation | Owner | Status |
|---|------|-------------|--------|------------|-------|--------|
| 1 | Risk | Iframe cross-origin blocks element highlighting | H | Fallback: highlight in results panel only | Frontend | Open |
| 2 | Risk | Shopify theme password flow may require form submit | M | Try URL param, fallback to manual | Frontend | Open |

---

## Notes

### Task 6.5: Code Review: Sprint 6 [Reviewer]
**Status**: [NOT STARTED]
**Estimated**: 1 hour | **Actual**: - hours
**Story Points**: 2
**Wireframe**: -

**Deliverables**:
- [ ] Code review report

**Acceptance Criteria**:
- [ ] All code reviewed
- [ ] LGTM or issues reported

---

### Task 6.6: QA: Full regression + E2E [QA]
**Status**: [NOT STARTED]
**Estimated**: 3 hours | **Actual**: - hours
**Story Points**: 5
**Wireframe**: -

**Deliverables**:
- [ ] Full regression test suite
- [ ] New tests for flow builder components
- [ ] Final QA sign-off

**Acceptance Criteria**:
- [ ] All existing tests pass (regression)
- [ ] New flow builder tests pass
- [ ] Flow ↔ JSON conversion fully tested
- [ ] QA sign-off

---

## Sprint Retrospective

### What Went Well
- {TBD}

### What Needs Improvement
- {TBD}

### Time Analysis
| Metric | Estimated | Actual | Variance |
|--------|-----------|--------|----------|
| Total Hours | 11h | TBDh | - |
| Velocity | 100% | -% | - |
