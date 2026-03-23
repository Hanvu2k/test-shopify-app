---
name: wishlist-tester project DevOps context
description: CI/CD and packaging setup for wishlist-tester-2026-03 (Node 20, Vite, Express, Playwright)
type: project
---

Task 4.3 (CI/CD + Packaging) completed in Sprint 4. GitHub Actions CI and Dockerfile created in src/.

**Why:** Single-container Express+Playwright app; CI runs tsc, vitest, vite build on push.

**How to apply:** If asked to modify or extend CI/CD for this project, the workflow is at `src/.github/workflows/ci.yml` and the container spec at `src/Dockerfile`. Node 20, npm ci, vite build, server entry is `server/index.ts` via tsx on port 3737.
