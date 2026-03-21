# Screen 02: Results Panel

**Purpose**: The right-side panel that streams test results in real-time via SSE. Each result is expandable to show full assertion details, expected vs actual values, and screenshots for UI test failures.

**User Stories**: US-007, US-008

---

## Results Panel — All States Overview

```
╔══════════════════════════════════════════════════════════╗
║  PANEL STATE REFERENCE                                   ║
╠══════════════════════════════════════════════════════════╣
║  A. Empty (pre-run)     → See section below              ║
║  B. Running             → Live streaming results         ║
║  C. Completed — All Pass → Green summary                 ║
║  D. Completed — With Fails → Red summary + details       ║
║  E. API failure detail  → Expected vs Actual             ║
║  F. UI failure detail   → Error + Screenshot             ║
╚══════════════════════════════════════════════════════════╝
```

---

## A. Empty State (Pre-Run)

```
┌────────────────────────────────────────────────────────┐
│  📊 Results                                             │
├────────────────────────────────────────────────────────┤
│                                                        │
│                                                        │
│            ┌──────────────────────────────┐            │
│            │                              │            │
│            │   📋 No results yet          │            │
│            │                              │            │
│            │   Write or load a test       │            │
│            │   suite, then click Run.     │            │
│            │                              │            │
│            └──────────────────────────────┘            │
│                                                        │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

## B. Running State (SSE Streaming)

```
┌────────────────────────────────────────────────────────┐
│  📊 Results  ◐ Running...  3 / 5                        │
│  [████████████░░░░░░░░░░░░] 60%                         │
├────────────────────────────────────────────────────────┤
│                                                        │
│  ✅  Update wishlist settings           api    312ms   │
│  ✅  Verify button appears on storefront  ui   1.2s    │
│  ✅  Add item to wishlist               api     88ms   │
│  ◐   Verify item in wishlist UI          ui  running   │
│  ○   Remove item from wishlist          api      --    │
│                                                        │
│                                                        │
└────────────────────────────────────────────────────────┘
```

**Legend:**
- `✅` — Passed
- `❌` — Failed
- `◐` — Currently running (animated spinner)
- `○` — Queued (not yet started)

---

## C. Completed — All Pass

```
┌────────────────────────────────────────────────────────┐
│  📊 Results  ✅ All tests passed                        │
├────────────────────────────────────────────────────────┤
│                                                        │
│  ✅  Update wishlist settings           api    312ms   │
│  ✅  Verify button appears on storefront  ui   1.2s    │
│  ✅  Add item to wishlist               api     88ms   │
│  ✅  Verify item in wishlist UI          ui   2.1s     │
│  ✅  Remove item from wishlist          api    201ms   │
│                                                        │
│  ────────────────────────────────────────────────────  │
│  ✅ 5 passed   ❌ 0 failed   ⏱ 4.3s total             │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

## D. Completed — With Failures (Collapsed)

```
┌────────────────────────────────────────────────────────┐
│  📊 Results  ❌ 1 test failed                           │
├────────────────────────────────────────────────────────┤
│                                                        │
│  ✅  Update wishlist settings           api    312ms   │
│  ✅  Verify button appears on storefront  ui   1.2s    │
│  ✅  Add item to wishlist               api     88ms   │
│  ❌  Verify item in wishlist UI          ui   2.1s  ▶  │
│  ✅  Remove item from wishlist          api    201ms   │
│                                                        │
│  ────────────────────────────────────────────────────  │
│  ✅ 4 passed   ❌ 1 failed   ⏱ 4.3s total             │
│                                                        │
└────────────────────────────────────────────────────────┘
```

Note: The `▶` arrow on failed rows indicates expandable details.

---

## E. API Test Failure — Expanded Detail

```
┌────────────────────────────────────────────────────────┐
│  📊 Results  ❌ 1 test failed                           │
├────────────────────────────────────────────────────────┤
│                                                        │
│  ✅  Update wishlist settings           api    312ms   │
│                                                        │
│  ❌  Check wishlist count               api    201ms ▼ │
│  ╔════════════════════════════════════════════════╗   │
│  ║  ❌ Assertion Failed                           ║   │
│  ║  ─────────────────────────────────────────    ║   │
│  ║  Type:     status                              ║   │
│  ║  Expected: 200                                 ║   │
│  ║  Actual:   404                                 ║   │
│  ║                                                ║   │
│  ║  Type:     jsonpath                            ║   │
│  ║  Path:     $.data.count                        ║   │
│  ║  Expected: 1                                   ║   │
│  ║  Actual:   (not found)                         ║   │
│  ║                                                ║   │
│  ║  Error: GET /apps/wishlist/api/items           ║   │
│  ║  Response: 404 Not Found                       ║   │
│  ╚════════════════════════════════════════════════╝   │
│                                                        │
│  ✅  Remove item from wishlist          api    201ms   │
│                                                        │
│  ────────────────────────────────────────────────────  │
│  ✅ 1 passed   ❌ 1 failed   ⏱ 0.5s total             │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

## F. UI Test Failure — Expanded Detail with Screenshot

```
┌────────────────────────────────────────────────────────┐
│  📊 Results  ❌ 1 test failed                           │
├────────────────────────────────────────────────────────┤
│                                                        │
│  ✅  Verify button appears on storefront  ui   1.2s    │
│                                                        │
│  ❌  Verify item in wishlist UI           ui   2.1s ▼  │
│  ╔════════════════════════════════════════════════╗   │
│  ║  ❌ Step Failed: assertText            step 3  ║   │
│  ║  ─────────────────────────────────────────    ║   │
│  ║  Selector:  .wishlist-count-badge              ║   │
│  ║  Expected:  "1"                                ║   │
│  ║  Actual:    "0"                                ║   │
│  ║                                                ║   │
│  ║  Error: Text assertion failed                  ║   │
│  ║  at step 3 of 4                                ║   │
│  ║                                                ║   │
│  ║  📷 Screenshot:                                ║   │
│  ║  ┌────────────────────────────────────────┐   ║   │
│  ║  │                                        │   ║   │
│  ║  │  [Browser screenshot at time of fail]  │   ║   │
│  ║  │  screenshots/verify-wishlist-ui.png    │   ║   │
│  ║  │                                        │   ║   │
│  ║  │  ┌───────────────────────────────┐     │   ║   │
│  ║  │  │  Wishlist (0)   ← badge       │     │   ║   │
│  ║  │  │  [Add to Wishlist]            │     │   ║   │
│  ║  │  └───────────────────────────────┘     │   ║   │
│  ║  │                                        │   ║   │
│  ║  └────────────────────────────────────────┘   ║   │
│  ║  [ 🔗 Open full screenshot ]                  ║   │
│  ╚════════════════════════════════════════════════╝   │
│                                                        │
│  ────────────────────────────────────────────────────  │
│  ✅ 1 passed   ❌ 1 failed   ⏱ 3.3s total             │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

## G. Aborted State

```
┌────────────────────────────────────────────────────────┐
│  📊 Results  ⚠ Aborted by user                         │
├────────────────────────────────────────────────────────┤
│                                                        │
│  ✅  Update wishlist settings           api    312ms   │
│  ✅  Verify button appears on storefront  ui   1.2s    │
│  ⛔  Add item to wishlist               api  aborted   │
│  ─   Verify item in wishlist UI          ui  skipped   │
│  ─   Remove item from wishlist          api  skipped   │
│                                                        │
│  ────────────────────────────────────────────────────  │
│  ✅ 2 passed  ❌ 0 failed  ⛔ 1 aborted  ─ 2 skipped  │
│                                                        │
└────────────────────────────────────────────────────────┘
```

---

## Result Row Anatomy

```
┌────────────────────────────────────────────────────────────────────┐
│                                                                    │
│   [icon]  [Test Name                       ]  [type]  [duration] [▶]│
│    ✅/❌    max ~40 chars, truncated with…     api/ui   123ms      │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘

Column widths (approximate):
  [icon]      4 chars
  [name]      40 chars (flex, truncated)
  [type]      4 chars  (api / ui)
  [duration]  8 chars  (right-aligned: 312ms, 1.2s, running)
  [▶]         3 chars  (only on failed rows)
```

---

## Interactions

| Trigger | Action |
|---------|--------|
| Click failed row (▶) | Toggles expanded detail section inline |
| Click [Open full screenshot] | Opens screenshot in new browser tab |
| Scroll results | Scrolls within results panel, toolbar stays fixed |
| New SSE event | New result row appended, panel auto-scrolls to bottom |
| Click passed row | No action (no details for passing tests) |

---

## Accessibility Notes

- Results region: `aria-live="polite"` for screen reader announcements
- Failed row expand toggle: `aria-expanded`, `aria-controls`
- Screenshot image: `alt="Screenshot at time of test failure for: [test name]"`
- Progress bar: `role="progressbar"`, `aria-valuenow`, `aria-valuemax`
- Status icons: text-based fallback (PASS/FAIL/RUNNING) for non-emoji rendering
