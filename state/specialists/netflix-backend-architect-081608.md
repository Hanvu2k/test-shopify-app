---
state: netflix-backend-architect
project: wishlist-tester-2026-03
title: Share Playwright browser between Preview and Test Runner
description: Create shared browser-manager singleton so preview and test runner use same Playwright browser instance, eliminating extra window
last_updated: 2026-03-23
---

## Task Assignment

| Field | Value |
|-------|-------|
| Title | {TASK_TITLE} |
| Sprint | Sprint {N} |
| Scope | {SCOPE_DIRECTORY} |

## Current Progress

**Status**: [COMPLETE]

**Last completed**: All deliverables implemented and TypeScript compilation verified.

**Next steps**: None -- task complete.

## Files Created/Modified

| File | Action | Notes |
|------|--------|-------|
| src/server/browser-manager.ts | CREATE | Shared Playwright browser singleton with preview page + test context management |
| src/server/routes/preview.ts | UPDATE | Uses browser-manager instead of managing its own browser/context |
| src/server/routes/run.ts | UPDATE | Creates test context from browser-manager, passes to suite-runner |
| src/core/playwright-runner.ts | UPDATE | Accepts optional browserContext in RunUiTestOptions, skips standalone launch when provided |
| src/core/suite-runner.ts | UPDATE | Passes browserContext through to playwright-runner, skips closeBrowser when external context used |
| src/server/index.ts | UPDATE | Graceful shutdown calls browser-manager closeBrowser |

## Blockers

None.
