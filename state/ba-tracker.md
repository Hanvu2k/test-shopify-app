# Requirements Gathering Tracker

**Project**: Wishlist Tester
**Project ID**: wishlist-tester-2026-03
**BA**: Business Analyst
**Started**: 2026-03-21
**Status**: COMPLETE

---

## Session Overview

**Total Requirements Categories**: 8 (FR1–FR8)
**Total Functional Requirements**: 35
**Total Non-Functional Requirements**: 8
**Total User Stories**: 11
**Completion**: 100%

---

## Client Requirements (Direct from Client)

| # | Requirement | Source | Priority |
|---|------------|--------|----------|
| CR-1 | Web UI Mode: React+Vite (5273) + Express (3737), SSE streaming | Client request | MUST |
| CR-2 | CLI Mode: npx tsx cli.ts, stdout results, stderr JSON summary | Client request | MUST |
| CR-3 | API test runner: HTTP fetch + status/body/jsonpath assertions | Client request | MUST |
| CR-4 | UI test runner: Playwright headless:false, click/fill/waitFor/assertText | Client request | MUST |
| CR-5 | Variable chaining: saveAs + {{varName}} interpolation | Client request | MUST |
| CR-6 | JSON editor with syntax highlighting | Client request | SHOULD |
| CR-7 | Save/load test suites, run history | Client request | SHOULD |
| CR-8 | Abort button to stop mid-run | Client request | MUST |
| CR-9 | URL input to preview target page | Client request | SHOULD |
| CR-10 | Error display: text details + screenshot on UI fail | Client request | SHOULD |
| CR-11 | Login/logout support for Shopify storefront | Client request | MUST |
| CR-12 | Settings changes via Shopify app API | Client request | MUST |

---

## Discovery Questions Asked

| # | Question | Answer | Date |
|---|----------|--------|------|
| Q1 | Test case JSON fields & assertion types? | name, type, url, method, body. Assertions: status code, body contains, JSON path match | 2026-03-21 |
| Q2 | UI test step syntax & login? | selector+action (click, fill, waitFor, assertText). Login/logout with email+pw | 2026-03-21 |
| Q3 | Additional Web UI features? | Save/load, history, syntax highlighting, abort, URL preview | 2026-03-21 |
| Q4 | saveAs extract sources? | Response body (JSON path) + UI element text | 2026-03-21 |
| Q5 | Target Shopify app details? | Dev app, expandable to others. Test on theme preview, settings via API | 2026-03-21 |
| Q6 | Error handling & reporting? | Web UI: text+screenshot. CLI: detailed errors | 2026-03-21 |

---

## Key Decisions & Design Choices

| Decision | Rationale | Date | Approved By |
|----------|-----------|------|-------------|
| React+Vite + Express stack | Client specified | 2026-03-21 | Client |
| Playwright headless:false | Visual browser needed for UI tests | 2026-03-21 | Client |
| TypeScript throughout | Client specified (.ts files, tsx) | 2026-03-21 | Client |
| Sequential test execution | Required for variable chaining | 2026-03-21 | BA |
| No wireframes | Developer tool, no complex UI design needed | 2026-03-21 | Client |

---

## Deliverables

- [x] Requirements gathered
- [x] SRS document created -> `requirements/srs.md`
- [x] User stories created -> `requirements/user-stories.md`
- [x] MoSCoW prioritization completed
- [ ] Hand off to CTO for system design

---

**Last Updated**: 2026-03-21
**Updated By**: Business Analyst
**Phase Status**: COMPLETE
