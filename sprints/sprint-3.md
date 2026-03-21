# Sprint 3: Web UI Backend + CLI + Integration

**Project ID**: wishlist-tester-2026-03
**Sprint**: 3 of 4
**Duration**: Week 3 (2026-04-04 to 2026-04-11)
**Goal**: Full working app — Web UI connected to backend with SSE streaming, CLI mode operational
**Status**: PLANNED

---

## Task Details

### Task 3.1: Express Server + SSE Middleware [Backend]
**Status**: [NOT STARTED]
**Estimated**: 2 hours | **Actual**: - hours
**Story Points**: 3
**Wireframe**: -

**Deliverables**:
- [ ] src/server/index.ts (Express app, CORS, static serving)
- [ ] src/server/middleware/sse.ts (SSE helper: setHeaders, sendEvent, close)

**Acceptance Criteria**:
- [ ] [FR6.2] Express server runs on port 3737
- [ ] CORS configured for Vite dev server (port 5273)
- [ ] SSE middleware correctly sets headers and streams events

---

### Task 3.2: /api/run Endpoint (SSE Streaming) [Backend]
**Status**: [NOT STARTED]
**Estimated**: 3 hours | **Actual**: - hours
**Story Points**: 5
**Wireframe**: -

**Deliverables**:
- [ ] src/server/routes/run.ts

**Acceptance Criteria**:
- [ ] [FR6.5] POST /api/run accepts test suite JSON body
- [ ] Calls suite-runner.run() with SSE event callback
- [ ] Each test result streamed as SSE event to client
- [ ] [FR6.6] POST /api/abort cancels running suite
- [ ] Summary event sent when suite completes
- [ ] Handles errors gracefully (invalid JSON, runner errors)

---

### Task 3.3: /api/suites + /api/history Endpoints [Backend]
**Status**: [NOT STARTED]
**Estimated**: 2 hours | **Actual**: - hours
**Story Points**: 3
**Wireframe**: -

**Deliverables**:
- [ ] src/server/routes/suites.ts
- [ ] src/server/routes/history.ts

**Acceptance Criteria**:
- [ ] GET /api/suites lists JSON files in test-suites/
- [ ] GET /api/suites/:name returns specific file content
- [ ] POST /api/suites/:name saves JSON to file
- [ ] GET /api/history returns recent run summaries

---

### Task 3.4: CLI Mode [Backend]
**Status**: [NOT STARTED]
**Estimated**: 2 hours | **Actual**: - hours
**Story Points**: 3
**Wireframe**: -

**Deliverables**:
- [ ] src/cli.ts

**Acceptance Criteria**:
- [ ] [FR7.1] Runs via `npx tsx src/cli.ts <file.json>`
- [ ] [FR7.2] Stdout: per-test detailed results (name, status, assertion details)
- [ ] [FR7.3] Stderr: JSON summary { total, passed, failed, duration }
- [ ] [FR7.4] Exit code 0 if all pass, 1 if any fail
- [ ] [FR7.5] Detailed error on failure (expected vs actual)

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
| 3.4 | CLI mode | 3 | | Backend | - |
| 3.5 | Frontend-backend integration | 5 | | Frontend | - |
| 3.R | Code Review: Sprint 3 | 2 | | Reviewer | - |
| 3.Q | QA: Test Sprint 3 tasks | 3 | | QA | - |

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
