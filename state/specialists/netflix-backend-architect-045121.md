---
state: netflix-backend-architect
project: wishlist-tester-2026-03
title: Replace iframe proxy with Playwright screenshot streaming
description: Replace iframe proxy with Playwright screenshot-based preview service using periodic JPEG captures and HTTP polling
last_updated: 2026-03-23
---

## Task Assignment

| Field | Value |
|-------|-------|
| Title | Replace iframe proxy with Playwright screenshot streaming |
| Sprint | Sprint 7 |
| Scope | src/server/routes/preview.ts, src/server/index.ts, src/client/components/ThemePreview/ThemePreview.tsx, src/server/routes/proxy.ts |

## Current Progress

**Status**: [COMPLETE]

**Last completed**: All deliverables implemented — preview service, ThemePreview rewrite, index.ts update, proxy.ts deletion

**Next steps**: None — task complete

## Files Created/Modified

| File | Action | Notes |
|------|--------|-------|
| src/server/routes/preview.ts | CREATE | Playwright screenshot-based preview service with start/stop/navigate/highlight/screenshot endpoints |
| src/server/index.ts | MODIFY | Replaced proxy route registration with preview route |
| src/client/components/ThemePreview/ThemePreview.tsx | REWRITE | Replaced iframe approach with screenshot polling via img tag |
| src/server/routes/proxy.ts | DELETE | Removed iframe reverse proxy (replaced by Playwright preview) |

## Blockers

None currently.
