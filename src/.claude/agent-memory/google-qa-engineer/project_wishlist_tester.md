---
name: wishlist-tester project context
description: Core facts about the wishlist-tester-2026-03 project test setup and module structure
type: project
---

This is a Node.js/TypeScript ESM project (type: "module") with Vitest as the test runner.

Test setup:
- Vitest config at src/vitest.config.ts
- Tests in src/core/__tests__/
- Run with: npm test (or npx vitest run --coverage for coverage)

**Why:** Added Vitest during Sprint 1 QA (2026-03-21). No test runner existed before this sprint.

**How to apply:** When adding new tests, place them in src/core/__tests__/ and follow the existing test naming pattern. The project uses ESM so imports need .js extensions even for .ts source files.

Sprint 1 QA results (2026-03-21):
- 77 tests total, all passing
- variable-interpolator.ts: 100% coverage
- api-runner.ts: 95.37% statements, 88.57% branches
- suite-runner.ts: 84.1% statements, 83.63% branches
- Overall: 91.07% statements, 89.25% branches, 100% functions

Sprint 2 QA results (2026-03-21):
- 201 tests total (77 Sprint 1 + 124 new), all passing
- Test files in: src/client/__tests__/
- Dependencies added: happy-dom, @testing-library/react, @testing-library/jest-dom, @testing-library/user-event
- vitest.config.ts updated with environmentMatchGlobs for happy-dom on client tests
- useSSE.ts: 92.79% statements, 88.57% branches, 100% functions
- useTestRun.ts: 100% all metrics
- ResultsPanel.tsx: 100% all metrics
- SummaryBar.tsx: 100% all metrics
- Toolbar.tsx: 100% all metrics
- SaveLoadDialog.tsx: 100% statements, 96.42% branches
- TestResultCard.tsx: 100% all metrics
- Overall client+core: 96.31% statements, 93.82% branches, 100% functions

Notes:
- jsdom 27 has CSS ESM module issues with vitest; use happy-dom instead
- useSSE relies on fetch + ReadableStream mocking; use createControllableStream helper pattern
- useTestRun mock: vi.mock('../hooks/useSSE') captures callbacks for synthetic event injection
- Toolbar backdrop click test uses fireEvent.click(dialog) directly (not backdrop parent) due to e.target===e.currentTarget check
