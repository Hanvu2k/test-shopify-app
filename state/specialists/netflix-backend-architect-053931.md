---
state: netflix-backend-architect
project: wishlist-tester-2026-03
title: Reverse proxy for Shopify iframe embedding
description: Add reverse proxy route to strip CSP/X-Frame-Options headers and rewrite URLs so Shopify pages load in iframe from localhost
last_updated: 2026-03-23
---

## Task Assignment

| Field | Value |
|-------|-------|
| Title | Reverse proxy for Shopify iframe embedding |
| Sprint | Sprint 3 |
| Scope | src/server/routes/proxy.ts, src/server/index.ts, src/client/components/ThemePreview/ThemePreview.tsx |

## Current Progress

**Status**: [COMPLETE]

**Last completed**: All three deliverables implemented and type-checked

**Next steps**: None — task complete

## Files Created/Modified

| File | Action | Notes |
|------|--------|-------|
| src/server/routes/proxy.ts | CREATE | Reverse proxy endpoint |
| src/server/index.ts | MODIFY | Register proxy route |
| src/client/components/ThemePreview/ThemePreview.tsx | MODIFY | Use proxy URL for iframe |

## Blockers

None currently.
