# Sprint 3: Web UI Backend + CLI + Integration

**Project ID**: wishlist-tester-2026-03
**Sprint**: 3 of 4
**Duration**: Week 3 (2026-04-04 to 2026-04-11)
**Goal**: Full working app — Web UI connected to backend with SSE streaming, CLI mode operational
**Status**: PLANNED

---

## Task Details

### Task 3.1: Express Server + SSE Middleware [Backend]
**Status**: [COMPLETE]
**Estimated**: 2 hours | **Actual**: 1 hours
**Story Points**: 3
**Wireframe**: -

**Deliverables**:
- [x] src/server/index.ts (Express app, CORS, static serving)
- [x] src/server/middleware/sse.ts (SSE helper: setHeaders, sendEvent, close)

**Acceptance Criteria**:
- [x] [FR6.2] Express server runs on port 3737
- [x] CORS configured for Vite dev server (port 5273)
- [x] SSE middleware correctly sets headers and streams events

---

### Task 3.2: /api/run Endpoint (SSE Streaming) [Backend]
**Status**: [COMPLETE]
**Estimated**: 3 hours | **Actual**: 1 hours
**Story Points**: 5
**Wireframe**: -

**Deliverables**:
- [x] src/server/routes/run.ts

**Acceptance Criteria**:
- [x] [FR6.5] POST /api/run accepts test suite JSON body
- [x] Calls suite-runner.run() with SSE event callback
- [x] Each test result streamed as SSE event to client
- [x] [FR6.6] POST /api/abort cancels running suite
- [x] Summary event sent when suite completes
- [x] Handles errors gracefully (invalid JSON, runner errors)

---

### Task 3.3: /api/suites + /api/history Endpoints [Backend]
**Status**: [COMPLETE]
**Estimated**: 2 hours | **Actual**: 1 hours
**Story Points**: 3
**Wireframe**: -

**Deliverables**:
- [x] src/server/routes/suites.ts
- [x] src/server/routes/history.ts

**Acceptance Criteria**:
- [x] GET /api/suites lists JSON files in test-suites/
- [x] GET /api/suites/:name returns specific file content
- [x] POST /api/suites/:name saves JSON to file
- [x] GET /api/history returns recent run summaries

---

### Task 3.4: CLI Mode [Backend]
**Status**: [COMPLETE]
**Estimated**: 2 hours | **Actual**: 0.5 hours
**Story Points**: 3
**Wireframe**: -

**Deliverables**:
- [x] src/cli.ts

**Acceptance Criteria**:
- [x] [FR7.1] Runs via `npx tsx src/cli.ts <file.json>`
- [x] [FR7.2] Stdout: per-test detailed results (name, status, assertion details)
- [x] [FR7.3] Stderr: JSON summary { total, passed, failed, duration }
- [x] [FR7.4] Exit code 0 if all pass, 1 if any fail
- [x] [FR7.5] Detailed error on failure (expected vs actual)

---

### Task 3.5: Frontend-Backend Integration [Frontend]
**Status**: [NOT STARTED]
**Estimated**: 3 hours | **Actual**: - hours
**Story Points**: 5
**Wireframe**: -

**Deliverables**:
- [ ] src/client/hooks/useSSE.ts (updated: connect to real /api/run SSE)
- [ ] src/client/hooks/useTestRun.ts (updated: real API calls)
- [ ] src/client/services/api.ts (API client for suites, history, abort)

**Acceptance Criteria**:
- [ ] Run button → POST /api/run → SSE stream → results display
- [ ] Abort button → POST /api/abort → stops running tests
- [ ] Save → POST /api/suites/:name, Load → GET /api/suites/:name
- [ ] History loads from GET /api/history
- [ ] Error handling for network failures

---

## Sprint Backlog (Machine-Parseable)

| ID | Task | Points | Status | Assignee | Wireframe |
|----|------|--------|--------|----------|-----------|
| 3.1 | Express server + SSE middleware | 3 | | Backend | - |
| 3.2 | /api/run endpoint (SSE streaming) | 5 | | Backend | - |
| 3.3 | /api/suites + /api/history endpoints | 3 | | Backend | - |
| 3.4 | CLI mode | 3 | [COMPLETE] | Backend | - |
| 3.5 | Frontend-backend integration | 5 | | Frontend | - |
| 3.6 | Code Review: Sprint 3 | 2 | | Reviewer | - |
| 3.7 | QA: Test Sprint 3 tasks | 3 | | QA | - |

---

## Sprint Summary

| Metric | Value |
|--------|-------|
| Total Tasks | 7 |
| Story Points | 24 |
| Estimated Hours | 12h |
| Actual Hours | -h |
| Velocity | -% |

| Role | Tasks | Points | Hours |
|------|-------|--------|-------|
| Backend | 4 | 14 | 9h |
| Frontend | 1 | 5 | 3h |
| Reviewer | 1 | 2 | -h |
| QA | 1 | 3 | -h |

---

## Definition of Done

### Functional Criteria
- [ ] Web UI: click Run → tests execute → results stream in real-time
- [ ] Web UI: Save and Load test suites work end-to-end
- [ ] Web UI: History shows past runs
- [ ] CLI: npx tsx src/cli.ts test.json runs correctly with stdout/stderr output
- [ ] Abort stops a running test suite

### Technical Criteria
- [ ] All tasks marked [COMPLETE] in Sprint Backlog
- [ ] Code reviewed (LGTM from google-code-reviewer)
- [ ] No TypeScript errors
- [ ] API endpoints validated with test requests

### Quality Criteria
- [ ] SSE stream has < 100ms latency per event
- [ ] Graceful error handling for invalid JSON, network errors
- [ ] CLI exit codes correct (0 = pass, 1 = fail)

---

## Dependencies

| Dependency | Reason | Status |
|------------|--------|--------|
| Sprint 1 complete | Core engine required for routes | Pending |
| Sprint 2 complete | Frontend components required for integration | Pending |
| Task 3.1 → Task 3.2, 3.3 | Server setup needed before routes | Pending |
| Task 3.2 + Sprint 2 → Task 3.5 | Both backend route and frontend needed for integration | Pending |

---

## Risks & Blockers

| # | Type | Description | Impact | Mitigation | Owner | Status |
|---|------|-------------|--------|------------|-------|--------|
| 1 | Risk | SSE connection may drop on long-running suites | M | Implement reconnection logic | Frontend | Open |

---

## Notes

### Task 3.6: Code Review: Sprint 3 [Reviewer]
**Status**: [NOT STARTED]
**Estimated**: 1 hour | **Actual**: - hours
**Story Points**: 2
**Wireframe**: -

**Deliverables**:
- [ ] Code review report for all Sprint 3 tasks

**Acceptance Criteria**:
- [ ] All code reviewed for quality, security, correctness
- [ ] LGTM or issues reported

---

### Task 3.7: QA: Test Sprint 3 tasks [QA]
**Status**: [NOT STARTED]
**Estimated**: 2 hours | **Actual**: - hours
**Story Points**: 3
**Wireframe**: -

**Deliverables**:
- [ ] Integration tests for API endpoints
- [ ] E2E tests for Web UI → Backend flow
- [ ] Test report

**Acceptance Criteria**:
- [ ] All API endpoints tested
- [ ] SSE streaming tested end-to-end
- [ ] CLI mode tested
- [ ] QA sign-off

---

## Notes

- Backend tasks (3.1-3.4) can start immediately after Sprint 1
- Task 3.5 (integration) depends on both Sprint 2 frontend and Sprint 3 backend routes
- CLI shares core engine with server — no duplication

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
| Total Hours | 12h | TBDh | - |
| Velocity | 100% | -% | - |
