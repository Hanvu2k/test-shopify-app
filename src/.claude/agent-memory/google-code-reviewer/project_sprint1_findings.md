---
name: Sprint 1 code review findings
description: Key structural issues found in Sprint 1 core engine — dead code duplication, singleton concurrency risk, null serialization bug
type: project
---

Verdict: NEEDS MINOR. Three major findings, six minor.

**Major issues identified:**
1. `runApiTest` in api-runner.ts is ~80-line dead duplicate of `runApiTestWithResponse` — suite-runner only uses the latter.
2. `runUiTest` in playwright-runner.ts is ~130-line dead duplicate of `runUiTestWithPage` — same problem.
3. Module-level `browserInstance` singleton in playwright-runner.ts is not concurrency-safe under parallel `/api/run` requests — two concurrent launches can race before assignment completes.

**Minor issues:**
- `null`/`undefined` variables silently serialize to string "null"/"undefined" in variable-interpolator.ts — likely produces corrupt URLs.
- `Content-Type: application/json` sent unconditionally on all HTTP methods including GET — some strict servers reject this.
- `validateSuite` takes `unknown` but is called with typed `TestSuite` without `as unknown` cast — intent is opaque.
- Missing `pageerror` comment in `runUiTestWithPage` (present in `runUiTest`).
- `saveAs` extraction runs even on `fail` status (assertions failed but response received) — undocumented design choice.
- No unit tests exist yet (DoD requires 80%+ coverage — task 1.7 QA is pending).

**Why:** All security checks passed. No credentials hardcoded. JSONPath used safely (no eval mode). Variable interpolation uses regex, not eval.

**How to apply:** When reviewing Sprint 2+ work, verify the dead code duplicates were removed and the singleton concurrency issue was addressed if server routes are being built.
