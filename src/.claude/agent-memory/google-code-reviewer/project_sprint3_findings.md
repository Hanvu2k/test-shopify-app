---
name: Sprint 3 code review findings
description: Backend server, SSE middleware, API routes, CLI, and frontend integration review for Sprint 3
type: project
---

Verdict: NEEDS MINOR. 0 major findings, 5 minor.

**Carry-forward from Sprint 2 (verified status):**
- App.tsx now wires real components (Toolbar, JsonEditor, ResultsPanel, HistoryPanel, UrlPreview) — RESOLVED.
- accumulatedResultsRef in useTestRun.ts is still written but never read (line 65, 141) — still dead code, not fixed.
- formatDuration duplication across components — not in scope for Sprint 3, deferred.

**No major issues found.**

**Minor issues:**

1. **run.ts: module-level singleton `activeController` — race condition risk (inherited from Sprint 1 concern)**
   `activeController` is a module-level variable. Under the current sequential constraint this is safe (409 guard at line 34 blocks a second run). However, the 409 check and the `activeController = controller` assignment are not atomic — if two requests arrive within the same event-loop tick before the first write completes (extremely unlikely in single-threaded Node.js but architecturally fragile), both could pass the null-check. Not exploitable in practice with Node.js single-threaded event loop, but worth a code comment explaining the assumption, especially since Sprint 1 flagged the broader singleton pattern.

2. **api.ts: `saveSuite` throws uncaught `SyntaxError` on invalid JSON in editor**
   `JSON.parse(content)` at line 67 in `api.ts:saveSuite` will throw a `SyntaxError` if the editor content is malformed JSON. The caller in App.tsx (line 86) wraps this in a try/catch that logs to console, so it won't crash the app. However, the error message surfaced to the user is the raw JS `SyntaxError` — not a user-friendly message. The same validation is done client-side in `useTestRun.startRun`, but `saveSuite` is called independently. Add a try/catch in `saveSuite` and throw an `ApiError`-style error with a clear message.

3. **api.ts: `fetchHistory` timestamp always `new Date()` — misleading history timestamps**
   `fetchHistory` at line 89 assigns `timestamp: new Date()` (the fetch time) rather than any real run timestamp from the `RunSummary`. `RunSummary` in `core/types.ts` does not include a `startedAt` field, so this is a data model gap. The history entry always shows "now" regardless of when the run actually happened. Minor for a dev tool, but noticeable when the page refreshes — all history entries loaded from the server appear to have just happened.

4. **useSSE.ts: `parseSSEChunk` discards `event:` type line — always dispatches as generic payload**
   The SSE wire format from `sse.ts` sends `event: {type}\ndata: {json}\n\n`. The `parseSSEChunk` function (line 30-43) only looks at `data:` lines and ignores `event:` lines entirely. This means the event type in the SSE frame is discarded and instead the type is read from the JSON payload (`event.type`). This works because the backend puts the type in both places, but the coupling is fragile — if a future event sends no `type` in the JSON body, the frontend loses the event type silently. Add a comment documenting this intentional design choice, or parse the `event:` line alongside `data:` for robustness.

5. **cli.ts: `parseSuiteFile` calls `process.exit(1)` inside a function — TypeScript control-flow issue**
   In `parseSuiteFile` (lines 47-74), the function has three `process.exit(1)` branches but TypeScript infers a `TestSuite` return type — the function signature hides the fact that it may never return. TypeScript doesn't model `process.exit` as `never` in this context because `rawContent` is assigned in the try block and read outside it (TypeScript sees a possible "used before assignment" path). The current code relies on the exit calls to prevent that path. This is idiomatic for CLI code but a noAssertionError `!` or `as TestSuite` cast at the bottom makes the intent explicit. A better pattern: return `TestSuite | never` by splitting into a `tryParseSuite` that returns `TestSuite | null` and letting main call `process.exit` — keeps the function pure and testable.

**Security audit — PASSED:**
- Path traversal in suites.ts: `validateFilename` correctly rejects `/`, `\\`, `..`, and strips leading dots. `path.join(SUITES_DIR, filename)` is safe. The resolved path is always within `test-suites/`.
- No injection risks: JSON body is serialized before write, never exec'd.
- CORS locked to `http://localhost:5273` — not a wildcard.
- No credentials hardcoded.
- No `eval`, no `exec`, no `child_process`.
- Body size capped at 1mb in express.json middleware.

**SSE format correctness — PASSED:**
- Server sends `event: {type}\ndata: {json}\n\n` — compliant RFC 8895 format.
- Client `parseSSEChunk` reads `data:` lines and parses JSON — works correctly with server format. Type is in JSON payload redundantly (see minor #4).
- `suite:complete` and `suite:error` close the stream client-side via `reader.cancel()`.
- `X-Accel-Buffering: no` header present for nginx proxy compatibility.

**Error handling — PASSED:**
- Invalid JSON in POST /api/run body: Express body-parser returns 400 before route handler.
- `suite` missing from body: 400 returned explicitly.
- Network errors: useSSE catches and calls `onError`, propagated to useTestRun state.
- Abort handling: client disconnects trigger `req.on('close')` → `controller.abort()` in run.ts.

**API design — PASSED:**
- RESTful: GET for reads, POST for writes/actions.
- Status codes: 400 (bad input), 404 (not found), 409 (conflict for double-run), 500 (server error).
- All error responses use consistent `{ error: string }` shape.

**Integration correctness — PASSED:**
- App.tsx wires: Toolbar (run/abort/save/load), JsonEditor, ResultsPanel, HistoryPanel, UrlPreview.
- useTestRun connects to useSSE → /api/run → SSE stream.
- abortRun calls both disconnect() (closes fetch stream) and apiAbortRun() (server-side abort).
- fetchSuiteList called on mount and after save.
- history from useTestRun (in-memory, client-side) wired to HistoryPanel. fetchHistory from api.ts is defined but not called in App.tsx — history is maintained client-side only per current design.

**Why:** History being only client-side (not loaded from server on page refresh) is consistent with the in-memory design documented in tech-stack.md. The `fetchHistory` function in api.ts is dead code in the current App.tsx wiring. Not a bug, but worth noting.

**How to apply:** Sprint 4 review should verify: (1) dead `accumulatedResultsRef` removed, (2) `fetchHistory` either wired or removed, (3) `RunSummary` timestamp field added if history persistence becomes a requirement.
