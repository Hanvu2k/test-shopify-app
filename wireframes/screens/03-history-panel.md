# Screen 03: History Panel

**Purpose**: An overlay/side panel showing a chronological list of past test runs. Developers can review previous runs and load their results for comparison or debugging.

**User Stories**: US-009

---

## History Panel — Overlay on Main Screen

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│ ● ● ●  │  ◀ ▶ ↻  │  🔒 http://localhost:5273                               │ ≡ │
├─────────────────────────────────────────────────────────────────────────────────────┤
│ ┌────────────────────────────────────┐                                              │
│ │  🧪 Wishlist Tester               │                                              │
│ └────────────────────────────────────┘                                              │
│ ┌────────────────────────────────────┐                                              │
│ │  🌐 Target URL: [ https://...    ] │                                              │
│ │  [ ▶ Run ]  [ ■ ]  [ 💾 ▼ ] [ 📂 ▼]│                                              │
│ └────────────────────────────────────┘                                              │
│                                                                                     │
│ ┌──────────────────────────────────┐░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│ │  Editor content (dimmed)         │░░┌─────────────────────────────────────────┐ │
│ │  ...                             │░░│  🕒 Test Run History               ✕ close│
│ │  ...                             │░░│                                         │ │
│ │  ...                             │░░│  ┌──────────────────────────────────┐   │ │
│ │  ...                             │░░│  │ 🔍 Filter runs...                │   │ │
│ │  ...                             │░░│  └──────────────────────────────────┘   │ │
│ │  ...                             │░░│                                         │ │
│ │                                  │░░│  Today                                  │ │
│ │                                  │░░│  ─────────────────────────────────────  │ │
│ │                                  │░░│  ✅  wishlist-add-remove   5/5  14:32   │ │
│ │                                  │░░│  ❌  wishlist-add-remove   4/5  11:15   │ │
│ │                                  │░░│                                         │ │
│ │                                  │░░│  Yesterday                              │ │
│ │                                  │░░│  ─────────────────────────────────────  │ │
│ │                                  │░░│  ✅  api-only-suite        3/3  16:44   │ │
│ │                                  │░░│  ✅  ui-login-flow         2/2  14:20   │ │
│ │                                  │░░│  ❌  api-only-suite        2/3  09:05   │ │
│ │                                  │░░│                                         │ │
│ │                                  │░░│  2026-03-19                             │ │
│ │                                  │░░│  ─────────────────────────────────────  │ │
│ │                                  │░░│  ✅  wishlist-add-remove   5/5  17:02   │ │
│ │                                  │░░│  ✅  wishlist-add-remove   5/5  10:11   │ │
│ │                                  │░░│                                         │ │
│ │                                  │░░│  [ Load More... ]                       │ │
│ └──────────────────────────────────┘░░└─────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## History Row — Detail

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  [icon]  [suite name               ]  [N/N]  [time]             │
│  ✅/❌    max ~30 chars               pass    HH:MM              │
│           count                                                  │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘

Example rows:
  ✅  wishlist-add-remove.json     5/5   14:32
  ❌  wishlist-add-remove.json     4/5   11:15    ← 1 failure
  ✅  api-only-suite.json          3/3   09:05
```

---

## History Panel — Run Detail View (After Clicking a Row)

```
┌─────────────────────────────────────────────────────────────────┐
│  🕒 Test Run History                              ✕ close        │
│                                                                  │
│  ◂ Back to list                                                  │
│  ──────────────────────────────────────────────────────────      │
│  wishlist-add-remove.json                                        │
│  2026-03-21 at 11:15  |  ❌ 4/5 passed  |  4.3s                 │
│                                                                  │
│  Target URL: https://myshop.myshopify.com/products/test-product  │
│                                                                  │
│  ──────────────────────────────────────────────────────────      │
│                                                                  │
│  ✅  Update wishlist settings         api   312ms                │
│  ✅  Verify button appears            ui    1.2s                 │
│  ✅  Add item to wishlist             api    88ms                │
│  ❌  Verify item in wishlist UI       ui    2.1s   ▶             │
│  ✅  Remove item from wishlist        api   201ms                │
│                                                                  │
│  ─────────────────────────────────────────────────              │
│  Summary: 5 tests  |  4 ✅  |  1 ❌  |  4.3s                   │
│                                                                  │
│  [ 📂 Load This Suite into Editor ]                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Empty State (No History)

```
┌─────────────────────────────────────────────────────────────────┐
│  🕒 Test Run History                              ✕ close        │
│                                                                  │
│                                                                  │
│             ┌──────────────────────────────────┐                │
│             │                                  │                │
│             │   🕒 No runs yet                 │                │
│             │                                  │                │
│             │   Run a test suite and your      │                │
│             │   history will appear here.      │                │
│             │                                  │                │
│             └──────────────────────────────────┘                │
│                                                                  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Filter Interaction

```
┌──────────────────────────────────┐
│ 🔍 Filter runs...                │
└──────────────────────────────────┘
         │ (user types "api")
         ▼
┌──────────────────────────────────┐
│ 🔍 api              ✕            │
└──────────────────────────────────┘

Results filtered to only show runs where
suite name contains "api":

  Yesterday
  ─────────────────────────────────────
  ✅  api-only-suite        3/3  16:44
  ❌  api-only-suite        2/3  09:05
```

---

## Interactions

| Trigger | Action |
|---------|--------|
| Click 🕒 History in toolbar | Opens history overlay panel from right edge |
| Click ✕ close | Closes overlay, returns to main view |
| Click outside overlay | Closes overlay |
| Click run row | Navigates to run detail view within panel |
| Click ◂ Back | Returns to run list from detail view |
| Click [Load This Suite] | Loads the suite JSON into the editor |
| Type in filter | Filters list in real-time by suite name |
| Click [Load More...] | Fetches older history entries |

---

## Design Notes

- Panel slides in from right edge over the main screen (not a modal blocking the editor)
- Background is dimmed with `░` overlay to indicate focus is on the panel
- Panel width: ~420px fixed
- Run list is scrollable independently
- Date grouping: "Today", "Yesterday", then absolute dates (2026-03-19)
- Pass/fail icon colors: green for ✅, red for ❌ (same as Results panel)

---

## Accessibility Notes

- Panel uses `role="dialog"` with `aria-label="Test run history"`
- Close button: `aria-label="Close history panel"`
- Focus trapped inside panel when open
- Press Escape to close
- Filter input: `aria-label="Filter test runs by name"`
