# System Architecture — Wishlist Tester

**Project**: Wishlist Tester
**Project ID**: wishlist-tester-2026-03
**Version**: 1.0
**Last Updated**: 2026-03-21
**Architect**: CTO - Super Agent Company

---

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Wishlist Tester                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌─────────────┐    ┌──────────────────────────────┐   │
│  │   CLI Mode   │    │       Web UI Mode            │   │
│  │  cli.ts      │    │  ┌────────┐  ┌───────────┐  │   │
│  │  stdin/out   │    │  │ React  │  │ Express   │  │   │
│  │              │    │  │ :5273  │→→│ :3737     │  │   │
│  └──────┬───────┘    │  │ Editor │  │ /api/run  │  │   │
│         │            │  │ Results│←←│ SSE stream│  │   │
│         │            │  └────────┘  └─────┬─────┘  │   │
│         │            └────────────────────┼────────┘   │
│         │                                 │            │
│         └────────────┬────────────────────┘            │
│                      ▼                                 │
│  ┌──────────────────────────────────────────────┐      │
│  │            Core Engine (shared)              │      │
│  │                                              │      │
│  │  suite-runner.ts                             │      │
│  │    ├── variable-interpolator.ts              │      │
│  │    ├── api-runner.ts ──→ fetch() ──→ Target  │      │
│  │    └── playwright-runner.ts ──→ Chromium     │      │
│  │                                              │      │
│  └──────────────────────────────────────────────┘      │
│                                                         │
│  ┌──────────┐  ┌─────────────┐                         │
│  │test-suites│  │ screenshots │                         │
│  │  *.json   │  │  *.png      │                         │
│  └──────────┘  └─────────────┘                         │
└─────────────────────────────────────────────────────────┘
```

---

## Component Breakdown

### 1. Core Engine (`src/core/`)

| Component | File | Responsibility |
|-----------|------|----------------|
| Suite Runner | `suite-runner.ts` | Orchestrates test execution, manages variable store, emits events |
| API Runner | `api-runner.ts` | Executes HTTP requests, evaluates assertions (status, body, jsonpath) |
| Playwright Runner | `playwright-runner.ts` | Launches Chromium, executes UI steps (click, fill, waitFor, assertText) |
| Variable Interpolator | `variable-interpolator.ts` | Replaces `{{varName}}` in strings, manages variable store |
| Types | `types.ts` | TypeScript interfaces for TestSuite, TestCase, TestResult, etc. |

### 2. Web UI Frontend (`src/client/`)

| Component | Responsibility |
|-----------|----------------|
| Editor Panel | CodeMirror 6 JSON editor with syntax highlighting + validation |
| Results Panel | Displays SSE-streamed test results in real-time |
| Toolbar | Run, Abort, Save, Load buttons + target URL input |
| History Panel | List of past test runs with summary |
| Preview Panel | iframe/link for target web page |

### 3. Web UI Backend (`src/server/`)

| Route | Method | Responsibility |
|-------|--------|----------------|
| `/api/run` | POST | Receive test suite JSON, execute via suite-runner, stream results via SSE |
| `/api/abort` | POST | Signal abort to running suite |
| `/api/suites` | GET | List test suite files from test-suites/ |
| `/api/suites/:name` | GET/POST | Load or save test suite JSON file |
| `/api/history` | GET | Return recent run history |

### 4. CLI (`src/cli.ts`)

- Parse command-line argument (JSON file path)
- Read and parse test suite JSON
- Execute via suite-runner with console output callback
- Print detailed results to stdout, JSON summary to stderr
- Exit code 0 (all pass) or 1 (any fail)

---

## Data Flow: Web UI Test Execution

```
User writes JSON in Editor
        │
        ▼
[Click Run] → POST /api/run { suite: {...} }
        │
        ▼
Express route handler
        │
        ▼
suite-runner.ts.run(suite, onEvent)
        │
        ├──→ For each test case:
        │    ├── variable-interpolator.interpolate(test, variables)
        │    ├── if type === "api":
        │    │     api-runner.run(test) → fetch() → assert → result
        │    │     if saveAs: extract values → variables
        │    └── if type === "ui":
        │          playwright-runner.run(test) → browser actions → assert → result
        │          if saveAs: extract element text → variables
        │          if fail: screenshot → screenshots/
        │
        ├── onEvent(result) → SSE write to response stream
        │
        └── Final: summary event { total, passed, failed, duration }

Frontend EventSource receives each SSE event → render in Results panel
```

---

## Data Flow: CLI Test Execution

```
npx tsx cli.ts test-suites/my-test.json
        │
        ▼
Read file → JSON.parse
        │
        ▼
suite-runner.ts.run(suite, onEvent)
        │
        ├── onEvent(result) → console.log to stdout (detailed)
        │
        └── Final: summary → console.error (JSON to stderr)

Process.exit(failCount > 0 ? 1 : 0)
```

---

## Test Suite JSON Schema

```json
{
  "name": "Wishlist Add/Remove Flow",
  "baseUrl": "https://myshop.myshopify.com",
  "tests": [
    {
      "name": "Update wishlist settings",
      "type": "api",
      "method": "POST",
      "url": "{{baseUrl}}/apps/wishlist/api/settings",
      "body": { "showButton": true },
      "assertions": [
        { "type": "status", "expected": 200 },
        { "type": "jsonpath", "path": "$.success", "expected": true }
      ],
      "saveAs": { "settingId": "$.data.id" }
    },
    {
      "name": "Verify button appears on storefront",
      "type": "ui",
      "url": "{{baseUrl}}/products/test-product",
      "steps": [
        { "action": "waitFor", "selector": ".wishlist-btn" },
        { "action": "assertText", "selector": ".wishlist-btn", "expected": "Add to Wishlist" },
        { "action": "click", "selector": ".wishlist-btn" }
      ],
      "saveAs": { "btnText": { "selector": ".wishlist-btn" } }
    }
  ]
}
```

---

## Technology Choices

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Frontend | React 18 + Vite | Client specified, fast DX for SPA tool |
| Styling | TailwindCSS | Utility-first, rapid prototyping |
| JSON Editor | CodeMirror 6 | Lightweight, great JSON support |
| Backend | Express 4 | Client specified, simple SSE support |
| TypeScript | 5.x | Full-stack type safety |
| Browser | Playwright | Client specified, Chromium headless:false |
| Storage | File system | No DB needed, JSON files for test suites |

---

## Security Considerations

- No authentication needed (local dev tool)
- Test suite JSON validated before execution (prevent injection)
- Playwright runs with limited permissions
- Credentials (Shopify login) should use env vars, not hardcoded in test suites

---

**Approved By**: CTO
**Review Date**: 2026-03-21
