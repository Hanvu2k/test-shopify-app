# Sprint 5: Visual Flow Builder - Canvas + Blocks

**Project ID**: wishlist-tester-2026-03
**Sprint**: 5 of 6
**Duration**: Week 5 (2026-04-18 to 2026-04-25)
**Goal**: React Flow canvas with draggable blocks, block configuration, block palette — visual test builder working standalone
**Status**: PLANNED

---

## Task Details

### Task 5.1: Install React Flow + Block Type Definitions [Frontend]
**Status**: [COMPLETE]
**Estimated**: 2 hours | **Actual**: 0.5 hours
**Story Points**: 3
**Wireframe**: -

**Deliverables**:
- [x] package.json updated with @xyflow/react dependency
- [x] src/client/components/FlowBuilder/types.ts (FlowBlock, BlockType, FlowEdge types)
- [x] src/client/components/FlowBuilder/constants.ts (block type definitions with icons, labels, fields)

**Acceptance Criteria**:
- [x] React Flow installed and importable
- [x] BlockType enum: click, fill, waitFor, assertText, navigate, login, logout
- [x] Each block type has: label, icon, color, configurable fields list

---

### Task 5.2: Flow Canvas Component [Frontend]
**Status**: [NOT STARTED]
**Estimated**: 4 hours | **Actual**: - hours
**Story Points**: 8
**Wireframe**: -

**Deliverables**:
- [ ] src/client/components/FlowBuilder/FlowCanvas.tsx (React Flow canvas with zoom/pan)
- [ ] src/client/components/FlowBuilder/BlockNode.tsx (custom node component)
- [ ] src/client/components/FlowBuilder/FlowBuilder.tsx (container: canvas + palette)
- [ ] src/client/components/FlowBuilder/index.ts

**Acceptance Criteria**:
- [ ] [FR9.1] Canvas renders with React Flow, supports zoom/pan
- [ ] [FR9.2] Custom BlockNode displays: icon, label, action type, selector preview
- [ ] [FR9.4] Blocks connect via edges (linear 1→1)
- [ ] [FR9.6] Canvas supports select, delete blocks, undo
- [ ] Dark theme matching app aesthetic

---

### Task 5.3: Block Palette (Sidebar) [Frontend]
**Status**: [COMPLETE]
**Estimated**: 2 hours | **Actual**: 0.5 hours
**Story Points**: 3
**Wireframe**: -

**Deliverables**:
- [x] src/client/components/FlowBuilder/BlockPalette.tsx

**Acceptance Criteria**:
- [x] [FR9.5] Palette shows all 7 block types with icons and labels
- [x] Drag from palette → drop onto canvas creates new block
- [x] Palette compact, docked to side of canvas

---

### Task 5.4: Block Properties Panel [Frontend]
**Status**: [COMPLETE]
**Estimated**: 3 hours | **Actual**: 0.5 hours
**Story Points**: 5
**Wireframe**: -

**Deliverables**:
- [x] src/client/components/FlowBuilder/BlockProperties.tsx

**Acceptance Criteria**:
- [x] [FR9.3] Click block → properties panel shows editable fields
- [x] Fields vary by type: click/waitFor (selector), fill (selector+value), assertText (selector+expected), login (email+password), navigate (url)
- [x] Changes update block data in real-time
- [x] Label field for naming each block

---

### Task 5.5: Flow ↔ JSON Converter [Frontend]
**Status**: [COMPLETE]
**Estimated**: 3 hours | **Actual**: 1 hour
**Story Points**: 5
**Wireframe**: -

**Deliverables**:
- [x] src/client/components/FlowBuilder/flowConverter.ts

**Acceptance Criteria**:
- [x] [FR9.7] flowToJson(): Convert React Flow nodes+edges → TestSuite JSON
- [x] [FR9.8] jsonToFlow(): Convert TestSuite JSON → React Flow nodes+edges (import)
- [x] [FR9.9] Output matches existing TestSuite format (compatible with CLI, suite-runner)
- [x] Handles all 7 block types correctly
- [x] Preserves block order from edge connections

---

## Sprint Backlog (Machine-Parseable)

| ID | Task | Points | Status | Assignee | Wireframe |
|----|------|--------|--------|----------|-----------|
| 5.1 | Install React Flow + block type definitions | 3 | [COMPLETE] | Frontend | - |
| 5.2 | Flow canvas component (React Flow) | 8 | | Frontend | - |
| 5.3 | Block palette (sidebar) | 3 | [COMPLETE] | Frontend | - |
| 5.4 | Block properties panel | 5 | [COMPLETE] | Frontend | - |
| 5.5 | Flow ↔ JSON converter | 5 | | Frontend | - |
| 5.6 | Code Review: Sprint 5 | 2 | | Reviewer | - |
| 5.7 | QA: Test Sprint 5 tasks | 3 | | QA | - |

---

## Sprint Summary

| Metric | Value |
|--------|-------|
| Total Tasks | 7 |
| Story Points | 29 |
| Estimated Hours | 14h |
| Actual Hours | -h |
| Velocity | -% |

| Role | Tasks | Points | Hours |
|------|-------|--------|-------|
| Frontend | 5 | 24 | 14h |
| Reviewer | 1 | 2 | -h |
| QA | 1 | 3 | -h |

---

## Definition of Done

### Functional Criteria
- [ ] Blocks can be dragged from palette onto canvas
- [ ] Blocks connect with edges (linear flow)
- [ ] Block properties editable when selected
- [ ] Flow converts to valid TestSuite JSON
- [ ] Existing JSON test suites import as blocks

### Technical Criteria
- [ ] All tasks marked [COMPLETE] in Sprint Backlog
- [ ] Code reviewed (LGTM from google-code-reviewer)
- [ ] No TypeScript errors
- [ ] Unit tests for flowConverter

### Quality Criteria
- [ ] Canvas is smooth (no lag on 20+ blocks)
- [ ] Dark theme consistent with rest of app

---

## Dependencies

| Dependency | Reason | Status |
|------------|--------|--------|
| Sprint 1-4 complete | Core engine + existing UI | Done |
| Task 5.1 → all others | React Flow + types needed first | Pending |

---

## Risks & Blockers

| # | Type | Description | Impact | Mitigation | Owner | Status |
|---|------|-------------|--------|------------|-------|--------|
| 1 | Risk | React Flow bundle size may be large | L | Tree-shake, lazy load | Frontend | Open |
| 2 | Risk | Custom node styling complexity | M | Start with simple nodes, iterate | Frontend | Open |

---

## Notes

### Task 5.6: Code Review: Sprint 5 [Reviewer]
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

### Task 5.7: QA: Test Sprint 5 tasks [QA]
**Status**: [NOT STARTED]
**Estimated**: 2 hours | **Actual**: - hours
**Story Points**: 3
**Wireframe**: -

**Deliverables**:
- [ ] Tests for flowConverter (unit tests)
- [ ] Test report

**Acceptance Criteria**:
- [ ] flowConverter correctly converts flow ↔ JSON
- [ ] All block types handled
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
| Total Hours | 14h | TBDh | - |
| Velocity | 100% | -% | - |
