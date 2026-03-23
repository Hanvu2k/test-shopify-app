---
name: Sprint 4 code review findings
description: Example test suites, error handling polish, CI/CD, and Dockerfile review for Sprint 4
type: project
---

Verdict: NEEDS MAJOR. 1 major finding, 3 minor.

**No regressions from Sprint 3 findings. All 5 Sprint 3 minor issues remain unresolved but unchanged.**

**MAJOR issue:**

1. **Dockerfile: `npm ci --production` breaks both build and runtime**
   `/home/han/test-claude/projects/wishlist-tester-2026-03/src/Dockerfile` line 8 uses `npm ci --production`, which excludes devDependencies. Both `vite` (used in `RUN npx vite build` on the next line) and `tsx` (used in `CMD ["node", "--import", "tsx", "server/index.ts"]`) are in devDependencies. The image build will fail at `npx vite build`, and the container start command would also fail. Fix: remove `--production`, or adopt a two-stage build (build stage installs all deps + builds, production stage copies artifacts and runs `npm ci --production`).

**Minor issues:**

2. **CI: server TypeScript not built in CI pipeline**
   `ci.yml` runs `npx vite build` (frontend only). The production `npm run build` script runs `vite build && tsc -p tsconfig.server.json`. The server TypeScript is not compiled in CI. The earlier `npx tsc --noEmit` step likely covers server files depending on tsconfig.json scope, but the server-specific build is not verified.

3. **api-runner.ts: `runApiTest` duplicates `runApiTestWithResponse` logic (carry-forward)**
   Both exported functions contain identical timeout + fetch + error-handling code. `runApiTest` is not called from suite-runner.ts. Dead code duplication. Flagged since Sprint 1.

4. **example-mixed-test.json: saveAs `uuid` saved but never used downstream**
   The "mixed test with variable chaining" example saves `uuid` from the API test but doesn't reference `{{uuid}}` in the subsequent UI test. Doesn't demonstrate chaining end-to-end. Documentation gap only — not a runtime bug.

**Security audit — PASSED:**
- No credentials hardcoded in any Sprint 4 file.
- Example suites use public test endpoints (httpbin.org, example.com).
- CI workflow: no secret injection issues.
- Dockerfile: no secrets baked in (aside from the --production bug above).

**Task 4.1 (example test suites + npm scripts) — PASSED:**
- All three JSON files are valid and conform to TestSuite schema.
- npm scripts: dev, build, start, cli all correct.

**Task 4.2 (error handling polish) — PASSED (with carry-forward duplication):**
- Timeout handling in api-runner uses AbortController + clearTimeout correctly. No timer leaks.
- playwright-runner step executors wrap waitForSelector in try/catch with descriptive errors. No crashes.
- stepTimeout wired correctly with 30s default.

**Task 4.3 (CI/CD + Dockerfile) — NEEDS MAJOR fix in Dockerfile. CI is minor.**
