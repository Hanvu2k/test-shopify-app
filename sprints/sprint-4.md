# Sprint 4: QA + Polish + Deployment

**Project ID**: wishlist-tester-2026-03
**Sprint**: 4 of 4
**Duration**: Week 4 (2026-04-11 to 2026-04-18)
**Goal**: Production-ready tool — fully tested, polished, packaged for distribution
**Status**: PLANNED

---

## Task Details

### Task 4.1: Example Test Suites + npm Scripts [Backend]
**Status**: [COMPLETE]
**Estimated**: 1 hour | **Actual**: 0.5 hours
**Story Points**: 2
**Wireframe**: -

**Deliverables**:
- [x] src/test-suites/example-api-test.json (sample API test suite)
- [x] src/test-suites/example-ui-test.json (sample UI test suite)
- [x] src/test-suites/example-mixed-test.json (sample mixed suite with variable chaining)
- [x] package.json scripts: dev, build, start, cli

**Acceptance Criteria**:
- [x] Example test suites demonstrate all features
- [x] npm run dev starts both Vite + Express concurrently
- [x] npm run build produces production build
- [x] npm run cli -- test.json runs CLI mode

---

### Task 4.2: Error Handling + Edge Cases Polish [Backend]
**Status**: [COMPLETE]
**Estimated**: 2 hours | **Actual**: 1 hour
**Story Points**: 3
**Wireframe**: -

**Deliverables**:
- [x] src/core/suite-runner.ts (improved error handling)
- [x] src/core/api-runner.ts (timeout, network error handling)
- [x] src/core/playwright-runner.ts (timeout, element not found handling)

**Acceptance Criteria**:
- [x] Graceful timeout handling for API requests
- [x] Graceful timeout for Playwright steps
- [x] Element not found produces clear error (not crash)
- [x] Invalid JSON in test suite produces helpful validation error
- [x] One test failure doesn't crash the entire suite

---

### Task 4.3: CI/CD + Packaging [DevOps]
**Status**: [COMPLETE]
**Estimated**: 2 hours | **Actual**: 0.5 hours
**Story Points**: 3
**Wireframe**: -

**Deliverables**:
- [x] src/.github/workflows/ci.yml (lint, type check, test)
- [x] src/Dockerfile (optional, for containerized runs)

**Acceptance Criteria**:
- [x] GitHub Actions CI runs on push
- [x] Type checking passes in CI
- [x] Tool can be run without Docker (node + npm only)

---

## Sprint Backlog (Machine-Parseable)

| ID | Task | Points | Status | Assignee | Wireframe |
|----|------|--------|--------|----------|-----------|
| 4.1 | Example test suites + npm scripts | 2 | | Backend | - |
| 4.2 | Error handling + edge cases polish | 3 | | Backend | - |
| 4.3 | CI/CD + packaging | 3 | [COMPLETE] | DevOps | - |
| 4.4 | Code Review: Sprint 4 | 2 | | Reviewer | - |
| 4.5 | QA: Full regression + E2E tests | 5 | | QA | - |

---

## Sprint Summary

| Metric | Value |
|--------|-------|
| Total Tasks | 5 |
| Story Points | 15 |
| Estimated Hours | 5h |
| Actual Hours | -h |
| Velocity | -% |

| Role | Tasks | Points | Hours |
|------|-------|--------|-------|
| Backend | 2 | 5 | 3h |
| DevOps | 1 | 3 | 2h |
| Reviewer | 1 | 2 | -h |
| QA | 1 | 5 | -h |

---

## Definition of Done

### Functional Criteria
- [ ] All features from SRS working end-to-end
- [ ] Example test suites run successfully (both api and ui types)
- [ ] Error handling graceful for all edge cases
- [ ] npm scripts work: dev, build, start, cli

### Technical Criteria
- [ ] All tasks marked [COMPLETE] in Sprint Backlog
- [ ] Code reviewed (LGTM from google-code-reviewer)
- [ ] No TypeScript errors
- [ ] E2E tests pass
- [ ] CI pipeline green

### Quality Criteria
- [ ] Tool ready for daily use by developers
- [ ] No crashes on invalid input
- [ ] Clear documentation (README with usage)

---

## Dependencies

| Dependency | Reason | Status |
|------------|--------|--------|
| Sprint 3 complete | Full integration needed before polish | Pending |

---

## Risks & Blockers

| # | Type | Description | Impact | Mitigation | Owner | Status |
|---|------|-------------|--------|------------|-------|--------|
| - | - | None identified | - | - | - | - |

---

## Notes

### Task 4.4: Code Review: Sprint 4 [Reviewer]
**Status**: [NOT STARTED]
**Estimated**: 1 hour | **Actual**: - hours
**Story Points**: 2
**Wireframe**: -

**Deliverables**:
- [ ] Code review report for all Sprint 4 tasks

**Acceptance Criteria**:
- [ ] All code reviewed for quality, security, correctness
- [ ] LGTM or issues reported

---

### Task 4.5: QA: Full regression + E2E tests [QA]
**Status**: [NOT STARTED]
**Estimated**: 3 hours | **Actual**: - hours
**Story Points**: 5
**Wireframe**: -

**Deliverables**:
- [ ] Full regression test suite
- [ ] E2E test report
- [ ] Final QA sign-off

**Acceptance Criteria**:
- [ ] All features from SRS verified
- [ ] Edge cases tested (invalid JSON, network errors, timeouts)
- [ ] CLI and Web UI both pass
- [ ] QA final sign-off

---

## Notes

- This sprint focuses on quality, not new features
- QA task (4.Q) is the most important — full regression testing
- All bugs found by QA should be fixed within this sprint

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
| Total Hours | 5h | TBDh | - |
| Velocity | 100% | -% | - |
