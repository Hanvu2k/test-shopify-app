# Tech Stack: Wishlist Tester

**Project ID**: wishlist-tester-2026-03
**Author**: CTO - Super Agent Company
**Date**: 2026-03-21
**Status**: PENDING APPROVAL

---

## Stack Summary

| Layer | Technology | Version | Rationale |
|-------|-----------|---------|-----------|
| Frontend | React | 18.x | Client specified, SPA dev tool |
| Build Tool | Vite | 5.x | Client specified, fast HMR |
| UI Library | TailwindCSS | 3.x | Utility-first, rapid dev tool styling |
| JSON Editor | CodeMirror 6 | 6.x | Mature, extensible, JSON syntax highlighting + validation |
| Language | TypeScript | 5.x | Client specified (tsx, .ts throughout) |
| Backend | Express | 4.x | Client specified, SSE streaming support |
| Runtime | Node.js | 20+ | LTS, TypeScript support via tsx |
| Browser Automation | Playwright | 1.x | Client specified for UI tests |
| Database | None | - | File-based storage (test-suites/*.json) |

---

## Frontend Stack

### Core
- **Framework**: React 18 (SPA mode, no SSR needed)
- **Language**: TypeScript 5.x
- **Build**: Vite 5.x (dev server port 5273)
- **Styling**: TailwindCSS 3.x
- **State Management**: React useState/useReducer (simple state, no external store needed)

### Key Libraries
- **CodeMirror 6**: JSON editor with syntax highlighting, linting, autocompletion
- **EventSource API**: Native browser SSE for streaming test results
- **lucide-react**: Icons

### UI Layout (v2 — Visual Flow Builder)
- Left area (60%): Shopify theme preview (iframe) + theme password input
- Center area (40%): React Flow canvas with block palette
- Right panel: Test results stream (unchanged from v1)
- Top bar: URL input, theme password, Run/Abort, Save/Load, History

### Canvas Library
- **React Flow** (@xyflow/react): Node-based canvas for drag & drop blocks, edges, zoom/pan
- Custom node components for each block type (click, fill, waitFor, assertText, login, logout, navigate)
- Flow ↔ JSON bidirectional converter

---

## Backend Stack

### Core
- **Runtime**: Node.js 20+ LTS
- **Framework**: Express 4.x
- **Language**: TypeScript 5.x (via tsx runtime)
- **API Style**: REST + SSE (Server-Sent Events)

### Test Runners
- **API Runner**: Native `fetch` API for HTTP requests
- **UI Runner**: Playwright (Chromium, headless:false)
- **Variable Interpolation**: Custom template engine ({{varName}} syntax)

### File Storage
- **Test Suites**: JSON files in `test-suites/` directory
- **Screenshots**: Saved to `screenshots/` on UI test failure
- **Run History**: In-memory (runtime only) or simple JSON log file

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/run | Start test suite execution, returns SSE stream |
| POST | /api/abort | Abort running test suite |
| GET | /api/suites | List saved test suite files |
| GET | /api/suites/:name | Load specific test suite |
| POST | /api/suites/:name | Save test suite to file |
| GET | /api/history | Get recent test run history |

---

## Project Structure

```
src/
├── client/                  # React frontend (Vite)
│   ├── index.html
│   ├── main.tsx
│   ├── App.tsx
│   ├── components/
│   │   ├── Editor/          # JSON editor (CodeMirror)
│   │   ├── Results/         # SSE result stream display
│   │   ├── History/         # Run history panel
│   │   ├── Toolbar/         # Run/Abort/Save/Load buttons
│   │   └── Preview/         # Target URL preview
│   ├── hooks/               # Custom React hooks (useSSE, useTestRun)
│   └── styles/              # TailwindCSS config
│
├── server/                  # Express backend
│   ├── index.ts             # Express app entry
│   ├── routes/
│   │   ├── run.ts           # POST /api/run (SSE streaming)
│   │   ├── suites.ts        # CRUD test suites
│   │   └── history.ts       # Run history
│   └── middleware/
│       └── sse.ts           # SSE helper middleware
│
├── core/                    # Test execution engine (shared)
│   ├── suite-runner.ts      # Orchestrator
│   ├── api-runner.ts        # HTTP test runner
│   ├── playwright-runner.ts # Browser automation runner
│   ├── variable-interpolator.ts # {{varName}} replacement
│   └── types.ts             # TypeScript interfaces
│
├── cli.ts                   # CLI entry point
├── test-suites/             # Saved test suite JSON files
└── screenshots/             # UI test failure screenshots
```

---

## Development Setup

### Prerequisites
```bash
node >= 20.0.0
npm >= 10.0.0
```

### Local Development
```bash
# Install dependencies
npm install

# Run both frontend + backend in dev mode
npm run dev           # Starts Vite (5273) + Express (3737) concurrently

# CLI mode
npx tsx src/cli.ts test-suites/example.json
```

---

## Stack Decisions (ADRs)

### ADR-001: No Database
- **Date**: 2026-03-21
- **Status**: Accepted
- **Context**: Dev tool, test suites are JSON files, no user accounts
- **Decision**: File-based storage, no database needed
- **Consequences**: Simple deployment, no DB setup, limited query capability (acceptable)

### ADR-002: CodeMirror 6 for JSON Editor
- **Date**: 2026-03-21
- **Status**: Accepted
- **Context**: Need syntax highlighting + JSON validation in editor
- **Decision**: CodeMirror 6 — mature, extensible, good JSON mode
- **Alternatives**: Monaco (too heavy for this use case), Ace (older API)
- **Consequences**: Lighter bundle than Monaco, excellent JSON support

### ADR-003: Monorepo with Shared Core
- **Date**: 2026-03-21
- **Status**: Accepted
- **Context**: CLI and Web UI share test execution engine
- **Decision**: Single repo, `core/` directory shared between CLI and server
- **Consequences**: Code reuse, single `npm install`, simpler development

---

**Approved By**: CTO
**Review Date**: 2026-03-21
