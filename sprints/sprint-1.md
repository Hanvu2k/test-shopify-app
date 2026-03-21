# Sprint 1: Core Engine + Project Setup

**Project ID**: wishlist-tester-2026-03
**Sprint**: 1 of 4
**Duration**: Week 1 (2026-03-21 to 2026-03-28)
**Goal**: Core test execution engine works — can run API + UI tests with variable chaining via code/tests
**Status**: PLANNED

---

## Task Details

### Task 1.1: Project Scaffolding + TypeScript Types [Backend]
**Status**: [COMPLETE]
**Estimated**: 2 hours | **Actual**: 1 hours
**Story Points**: 3
**Wireframe**: -

**Deliverables**:
- [x] src/package.json (dependencies: playwright, express, cors, concurrently, codemirror, react, vite, tailwindcss, tsx)
- [x] src/tsconfig.json
- [x] src/core/types.ts (TestSuite, TestCase, Assertion, TestResult, StepAction, SaveAs, RunSummary interfaces)

**Acceptance Criteria**:
- [x] [FR1.1] TestSuite interface has name, baseUrl, tests array
- [x] [FR1.2] TestCase interface has name, type, url, method, body, assertions, saveAs, steps
- [x] npm install succeeds with all dependencies

**Notes**: This task sets up the entire project. All other tasks depend on types.ts.

---

### Task 1.2: Variable Interpolator [Backend]
**Status**: [COMPLETE]
**Estimated**: 2 hours | **Actual**: 1 hours
**Story Points**: 3
**Wireframe**: -

**Deliverables**:
- [x] src/core/variable-interpolator.ts

**Acceptance Criteria**:
- [x] [FR4.1] Replaces {{varName}} in all string fields
- [x] [FR4.4] Interpolation works on url, body, assertions, steps
- [x] [FR4.5] Throws clear error when variable not defined

---

### Task 1.3: API Runner [Backend]
**Status**: [NOT STARTED]
**Estimated**: 3 hours | **Actual**: - hours
**Story Points**: 5
**Wireframe**: -

**Deliverables**:
- [ ] src/core/api-runner.ts

**Acceptance Criteria**:
- [ ] [FR2.1] Makes HTTP request with correct method/url/body
- [ ] [FR2.2] Asserts status code matches expected
- [ ] [FR2.3] Asserts body contains expected string
- [ ] [FR2.4] Asserts JSON path matches expected value
- [ ] [FR2.5] Extracts value from response body via JSON path (saveAs)
- [ ] Returns TestResult with pass/fail + assertion details

---

### Task 1.4: Playwright Runner [Backend]
**Status**: [NOT STARTED]
**Estimated**: 4 hours | **Actual**: - hours
**Story Points**: 5
**Wireframe**: -

**Deliverables**:
- [ ] src/core/playwright-runner.ts

**Acceptance Criteria**:
- [ ] [FR3.1] Launches Chromium headless:false
- [ ] [FR3.2] Navigates to specified URL
- [ ] [FR3.3] Executes click, fill, waitFor, assertText steps
- [ ] [FR3.4] Supports login flow (fill email + password + submit)
- [ ] [FR3.6] Extracts UI element text for saveAs
- [ ] [FR3.7] Captures screenshot on failure → screenshots/

---

### Task 1.5: Suite Runner Orchestrator [Backend]
**Status**: [NOT STARTED]
**Estimated**: 3 hours | **Actual**: - hours
**Story Points**: 5
**Wireframe**: -

**Deliverables**:
- [ ] src/core/suite-runner.ts

**Acceptance Criteria**:
- [ ] [FR5.1] Parses and validates test suite JSON
- [ ] [FR5.2] Executes tests sequentially (variable chaining order)
- [ ] [FR5.3] Routes to api-runner or playwright-runner by type
- [ ] [FR5.4] Manages shared variable store
- [ ] [FR5.5] Emits per-test result events via callback
- [ ] [FR5.6] Supports abort/cancel
- [ ] [FR5.7] Returns summary: total, passed, failed, skipped, duration

---

## Sprint Backlog (Machine-Parseable)

| ID | Task | Points | Status | Assignee | Wireframe |
|----|------|--------|--------|----------|-----------|
| 1.1 | Project scaffolding + TypeScript types | 3 | COMPLETE | Backend | - |
| 1.2 | Variable interpolator | 3 | COMPLETE | Backend | - |
| 1.3 | API runner | 5 | | Backend | - |
| 1.4 | Playwright runner | 5 | | Backend | - |
| 1.5 | Suite runner orchestrator | 5 | | Backend | - |
| 1.6 | Code Review: Sprint 1 | 2 | | Reviewer | - |
| 1.7 | QA: Test Sprint 1 tasks | 3 | | QA | - |

---

## Sprint Summary

| Metric | Value |
|--------|-------|
| Total Tasks | 7 |
| Story Points | 26 |
| Estimated Hours | 14h |
| Actual Hours | -h |
| Velocity | -% |

| Role | Tasks | Points | Hours |
|------|-------|--------|-------|
| Backend | 5 | 21 | 14h |
| Reviewer | 1 | 2 | -h |
| QA | 1 | 3 | -h |

---

## Definition of Done

### Functional Criteria
- [ ] API runner can make HTTP requests and check all 3 assertion types
- [ ] Playwright runner can navigate, click, fill, waitFor, assertText in browser
- [ ] Suite runner executes mixed api/ui tests in order with variable chaining
- [ ] Variable interpolation replaces {{varName}} correctly across all fields

### Technical Criteria
- [ ] All tasks marked [COMPLETE] in Sprint Backlog
- [ ] Code reviewed (LGTM from google-code-reviewer)
- [ ] No TypeScript errors (npx tsc --noEmit passes)
- [ ] Unit tests written for core modules

### Quality Criteria
- [ ] Clear error messages for invalid test suite JSON
- [ ] Clear error for undefined variables
- [ ] Screenshot captured on UI test failure

---

## Dependencies

| Dependency | Reason | Status |
|------------|--------|--------|
| Task 1.1 → all others | Types + package.json needed first | Pending |
| Task 1.2 → Task 1.5 | Suite runner uses interpolator | Pending |
| Task 1.3 → Task 1.5 | Suite runner uses api-runner | Pending |
| Task 1.4 → Task 1.5 | Suite runner uses playwright-runner | Pending |

---

## Risks & Blockers

| # | Type | Description | Impact | Mitigation | Owner | Status |
|---|------|-------------|--------|------------|-------|--------|
| 1 | Risk | Playwright browser launch may fail in some environments | M | Document prerequisites, fallback to headless | Backend | Open |

---

## Notes

### Task 1.6: Code Review: Sprint 1 [Reviewer]
**Status**: [NOT STARTED]
**Estimated**: 1 hour | **Actual**: - hours
**Story Points**: 2
**Wireframe**: -

**Deliverables**:
- [ ] Code review report for all Sprint 1 tasks

**Acceptance Criteria**:
- [ ] All code reviewed for quality, security, correctness
- [ ] LGTM or issues reported

---

### Task 1.7: QA: Test Sprint 1 tasks [QA]
**Status**: [NOT STARTED]
**Estimated**: 2 hours | **Actual**: - hours
**Story Points**: 3
**Wireframe**: -

**Deliverables**:
- [ ] Unit tests for core modules
- [ ] Test report

**Acceptance Criteria**:
- [ ] Core engine modules tested
- [ ] 80%+ coverage on new code
- [ ] QA sign-off

---

## Notes

- All code in src/core/ directory — shared between Web UI and CLI
- Tasks 1.2, 1.3, 1.4 can run in parallel after 1.1 completes
- Task 1.5 depends on 1.2, 1.3, 1.4

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
| Total Hours | 14h | TBDh | - |
| Velocity | 100% | -% | - |
