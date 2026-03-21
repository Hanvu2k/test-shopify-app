---
name: wishlist-tester-2026-03 project context
description: Key facts about the wishlist-tester project — stack, structure, and variable interpolation conventions
type: project
---

Wishlist Tester is a Shopify developer tool (TypeScript/Node 20, Express 4, Playwright) supporting both Web UI and CLI modes for API + UI test automation with variable chaining.

**Why:** Client-specified stack. Core engine in `src/core/` is shared between CLI (`src/cli.ts`) and Express server (`src/server/`).

**How to apply:** All core modules go in `src/core/`. Variable interpolation uses `{{varName}}` syntax. JSONPath extraction via `jsonpath-plus`. Task 1.1 (scaffolding + types) is COMPLETE. Task 1.2 (variable interpolator) is COMPLETE.
