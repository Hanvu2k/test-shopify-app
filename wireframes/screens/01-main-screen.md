# Screen 01: Main Screen

**Purpose**: Primary developer workspace — split-panel layout with JSON editor on the left and test results streaming on the right. This is the screen developers spend 90% of their time on.

**User Stories**: US-001, US-003, US-004, US-006, US-007

---

## Desktop View (Default State — Suite Loaded, Ready to Run)

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│ ● ● ●  │  ◀ ▶ ↻  │  🔒 http://localhost:5273                               │ ≡ │
├─────────────────────────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────────────────────────────┐ │
│ │  🧪 Wishlist Tester                                               v1.0  💡 Docs │ │
│ └─────────────────────────────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────────────────────────────┐ │
│ │  🌐 Target URL:  [ https://myshop.myshopify.com/products/test-product        ] │ │
│ │                                                                                 │ │
│ │  [ ▶ Run ]  [ ■ Abort ]    [ 💾 Save ▼ ]  [ 📂 Load ▼ ]  [ 🕒 History ]      │ │
│ └─────────────────────────────────────────────────────────────────────────────────┘ │
│ ┌──────────────────────────────────┬──────────────────────────────────────────────┐ │
│ │  📄 Test Suite Editor            │  📊 Results                                  │ │
│ │  wishlist-add-remove.json  ●     │  Ready — click Run to start                  │ │
│ ├──────────────────────────────────┼──────────────────────────────────────────────┤ │
│ │  1  {                            │                                              │ │
│ │  2    "name": "Wishlist Flow",   │                                              │ │
│ │  3    "baseUrl": "https://my..   │                                              │ │
│ │  4    "tests": [                 │                                              │ │
│ │  5      {                        │          ┌──────────────────────────────┐    │ │
│ │  6        "name": "Update set..  │          │                              │    │ │
│ │  7        "type": "api",         │          │   No results yet.            │    │ │
│ │  8        "method": "POST",      │          │                              │    │ │
│ │  9        "url": "{{baseUrl}}/.. │          │   Write a test suite and     │    │ │
│ │ 10        "body": {              │          │   click Run to execute.      │    │ │
│ │ 11          "showButton": true   │          │                              │    │ │
│ │ 12        },                     │          └──────────────────────────────┘    │ │
│ │ 13        "assertions": [        │                                              │ │
│ │ 14          {                    │                                              │ │
│ │ 15            "type": "status",  │                                              │ │
│ │ 16            "expected": 200    │                                              │ │
│ │ 17          }                    │                                              │ │
│ │ 18        ]                      │                                              │ │
│ │ 19      },                       │                                              │ │
│ │ 20      {                        │                                              │ │
│ │ 21        "name": "Verify btn",  │                                              │ │
│ │ 22        "type": "ui",          │                                              │ │
│ │ 23        "url": "{{baseUrl}}/.. │                                              │ │
│ │ 24        "steps": [             │                                              │ │
│ │ 25          {                    │                                              │ │
│ │ 26            "action": "wait..  │                                              │ │
│ │ 27  ~                            │                                              │ │
│ │                                  │                                              │ │
│ ├──────────────────────────────────┴──────────────────────────────────────────────┤ │
│ │  ↔ drag to resize                                                               │ │
│ └─────────────────────────────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐ │
│  │  Status: Idle  |  Suite: wishlist-add-remove.json  |  Tests: 5  |  Last: --    │ │
│  └─────────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Desktop View (Running State — Tests In Progress)

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│ ● ● ●  │  ◀ ▶ ↻  │  🔒 http://localhost:5273                               │ ≡ │
├─────────────────────────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────────────────────────────┐ │
│ │  🧪 Wishlist Tester                                               v1.0  💡 Docs │ │
│ └─────────────────────────────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────────────────────────────┐ │
│ │  🌐 Target URL:  [ https://myshop.myshopify.com/products/test-product        ] │ │
│ │                                                                                 │ │
│ │  [ ▷ Running... ]  [ ■ Abort ]    [ 💾 Save ▼ ]  [ 📂 Load ▼ ]  [ 🕒 History ] │ │
│ └─────────────────────────────────────────────────────────────────────────────────┘ │
│ ┌──────────────────────────────────┬──────────────────────────────────────────────┐ │
│ │  📄 Test Suite Editor            │  📊 Results  ◐ Running...  3 / 5             │ │
│ │  wishlist-add-remove.json  ●     │  [████████████░░░░░░░░] 60%                  │ │
│ ├──────────────────────────────────┼──────────────────────────────────────────────┤ │
│ │  1  {                            │                                              │ │
│ │  2    "name": "Wishlist Flow",   │  ✅ Update wishlist settings     api   312ms │ │
│ │  3    "baseUrl": "https://my..   │  ✅ Verify button appears        ui    1.2s  │ │
│ │  4    "tests": [                 │  ✅ Add item to wishlist          api   88ms  │ │
│ │  5      {                        │  ◐ Verify item in wishlist UI    ui   running │ │
│ │  6        "name": "Update set..  │  ○ Remove item from wishlist     api   --    │ │
│ │  7        "type": "api",         │                                              │ │
│ │  8        "method": "POST",      │  ─────────────────────────────────────────  │ │
│ │  9        "url": "{{baseUrl}}/.. │                                              │ │
│ │ 10        "body": {              │                                              │ │
│ │ 11          "showButton": true   │                                              │ │
│ │ 12        },                     │                                              │ │
│ │ 13        "assertions": [        │                                              │ │
│ │ 14          {                    │                                              │ │
│ │ 15            "type": "status",  │                                              │ │
│ │ 16            "expected": 200    │                                              │ │
│ │ 17          }                    │                                              │ │
│ │                                  │                                              │ │
│ ├──────────────────────────────────┴──────────────────────────────────────────────┤ │
│ │  ↔ drag to resize                                                               │ │
│ └─────────────────────────────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐ │
│  │  ◐ Running  |  3 / 5 completed  |  Passed: 3  |  Failed: 0  |  Elapsed: 1.6s  │ │
│  └─────────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Desktop View (Completed State — Pass + Fail)

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│ ● ● ●  │  ◀ ▶ ↻  │  🔒 http://localhost:5273                               │ ≡ │
├─────────────────────────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────────────────────────────┐ │
│ │  🧪 Wishlist Tester                                               v1.0  💡 Docs │ │
│ └─────────────────────────────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────────────────────────────┐ │
│ │  🌐 Target URL:  [ https://myshop.myshopify.com/products/test-product        ] │ │
│ │                                                                                 │ │
│ │  [ ▶ Run Again ]  [ ■ Abort ]    [ 💾 Save ▼ ]  [ 📂 Load ▼ ]  [ 🕒 History ]  │ │
│ └─────────────────────────────────────────────────────────────────────────────────┘ │
│ ┌──────────────────────────────────┬──────────────────────────────────────────────┐ │
│ │  📄 Test Suite Editor            │  📊 Results  ✅ 4 passed  ❌ 1 failed        │ │
│ │  wishlist-add-remove.json  ●     │  Completed in 4.3s                           │ │
│ ├──────────────────────────────────┼──────────────────────────────────────────────┤ │
│ │  1  {                            │                                              │ │
│ │  2    "name": "Wishlist Flow",   │  ✅ Update wishlist settings     api   312ms │ │
│ │  3    "baseUrl": "https://my..   │  ✅ Verify button appears        ui    1.2s  │ │
│ │  4    "tests": [                 │  ✅ Add item to wishlist          api   88ms  │ │
│ │  5      {                        │  ❌ Verify item in wishlist UI    ui    2.1s  │ │
│ │  6        "name": "Update set..  │     ▶ [Show Details]                         │ │
│ │  7        "type": "api",         │  ✅ Remove item from wishlist     api   201ms │ │
│ │  8        "method": "POST",      │                                              │ │
│ │  9        "url": "{{baseUrl}}/.. │  ─────────────────────────────────────────  │ │
│ │ 10        "body": {              │  Summary: 5 tests  |  4 ✅  |  1 ❌  | 4.3s  │ │
│ │ 11          "showButton": true   │                                              │ │
│ │ 12        },                     │                                              │ │
│ │ 13        "assertions": [        │                                              │ │
│ │ 14          {                    │                                              │ │
│ │ 15            "type": "status",  │                                              │ │
│ │ 16            "expected": 200    │                                              │ │
│ │ 17          }                    │                                              │ │
│ │                                  │                                              │ │
│ ├──────────────────────────────────┴──────────────────────────────────────────────┤ │
│ │  ↔ drag to resize                                                               │ │
│ └─────────────────────────────────────────────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐ │
│  │  ❌ Done  |  5 / 5 completed  |  Passed: 4  |  Failed: 1  |  Duration: 4.3s   │ │
│  └─────────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Desktop View (JSON Validation Error State)

```
┌──────────────────────────────────┐
│  📄 Test Suite Editor            │
│  unsaved  ●                      │
├──────────────────────────────────┤
│  1  {                            │
│  2    "name": "Wishlist Flow",   │
│  3    "tests": [                 │
│  4      {                        │
│  5        "type": "api"          │  ← missing comma
│  6        "method": "POST",      │  ← ~~~~~~~~~~~~~~~~~~
│  7  ~                            │     ^ Expected ',' or '}'
│                                  │
│  ⚠ JSON Error: line 6            │
│  Expected ',' or '}' after       │
│  property value in object        │
└──────────────────────────────────┘
```

---

## Toolbar Detail

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│  🌐 Target URL:  ┌──────────────────────────────────────────────────────────────┐  │
│                  │ https://myshop.myshopify.com/products/test-product           │  │
│                  └──────────────────────────────────────────────────────────────┘  │
│                                                                                     │
│  ┌─────────────┐  ┌────────────┐    ┌────────────────┐  ┌────────────────┐  ┌───┐ │
│  │  ▶  Run     │  │  ■  Abort  │    │  💾  Save  ▼   │  │  📂  Load  ▼  │  │ 🕒 │ │
│  │  ═══════════│  │            │    │                │  │               │  │    │ │
│  └─────────────┘  └────────────┘    └────────────────┘  └────────────────┘  └───┘ │
│   Primary action   Disabled when                          Opens dropdown     History │
│                    not running                                                panel  │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Save Dropdown (Expanded)

```
  ┌────────────────┐
  │  💾  Save  ▼   │
  │  ═══════════   │
  └────────┬───────┘
           │
           ▼
  ┌──────────────────────────┐
  │  💾 Save                 │
  │  💾 Save As...           │
  └──────────────────────────┘
```

---

## Load Dropdown (Expanded)

```
  ┌────────────────┐
  │  📂  Load  ▼   │
  └────────┬───────┘
           │
           ▼
  ┌──────────────────────────────┐
  │  Recent Files                │
  │  ─────────────────────────  │
  │  📄 wishlist-add-remove.json │
  │  📄 api-only-suite.json      │
  │  📄 ui-login-flow.json       │
  │  ─────────────────────────  │
  │  📁 Browse all files...      │
  └──────────────────────────────┘
```

---

## Component Descriptions

| Component | Description |
|-----------|-------------|
| App Header | Logo + version, minimal 1-line bar |
| Toolbar | Target URL input (full width), action buttons row |
| Run Button | Primary green accent, disabled during run |
| Abort Button | Secondary style, only active during run |
| Save Dropdown | Saves to current file or opens Save As dialog |
| Load Dropdown | Inline recent list + browse option |
| History Button | Icon button, opens history overlay |
| Editor Panel | CodeMirror 6 area with line numbers, monospace font |
| Editor Header | Filename + unsaved indicator dot |
| Results Panel | Streams results from SSE, fixed monospace display |
| Results Header | Live counter during run, summary after completion |
| Resize Handle | Horizontal drag divider between panels (↔) |
| Status Bar | Bottom bar: run state, test count, pass/fail, duration |

---

## Interactions

| Trigger | Action |
|---------|--------|
| Click Run | Sends POST /api/run with suite JSON + target URL, opens SSE stream, switches Run button to Running state |
| Click Abort | Sends POST /api/abort, marks remaining tests as skipped |
| Drag resize handle | Adjusts left/right panel width ratio |
| Click Save | If filename set: saves immediately. If new: opens Save As dialog |
| Click Load | Expands dropdown with recent files + Browse option |
| Click History | Opens history overlay panel (see screen 03) |
| Click result row | Expands inline details (see screen 02) |
| Type in editor | Real-time JSON validation, error underlines inline |
| Click ▶ [Show Details] | Expands error details under failed test row |

---

## States

| State | Description |
|-------|-------------|
| Empty (no suite) | Editor shows placeholder JSON skeleton, results panel shows empty state message |
| Ready | Suite loaded, Run button active, results clear |
| Running | Run button shows "Running...", Abort active, results stream in, progress bar in results header |
| Completed (all pass) | Green summary, Run Again button |
| Completed (with failures) | Red summary, failed tests show expand arrow |
| JSON error | Red underline in editor, error message below editor |
| Aborting | "Aborting..." message, remaining tests marked as Skipped |

---

## Accessibility Notes

- Run button must have aria-label="Run test suite"
- Abort button disabled state should reflect aria-disabled
- Results stream region should use aria-live="polite"
- Editor requires accessible label: "Test suite JSON editor"
- Status bar uses role="status" for screen readers
- Color is not the sole indicator of pass/fail (icons used alongside)
