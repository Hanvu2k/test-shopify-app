# Screen 04: Save / Load Dialog

**Purpose**: File management dialogs for saving test suites to disk and loading existing ones. Maps to the `test-suites/` directory on the backend.

**User Stories**: US-002

---

## Save As Dialog

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│ ● ● ●  │  ◀ ▶ ↻  │  🔒 http://localhost:5273                               │ ≡ │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│ ┌────────────────────────────┐   ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│ │  Editor (dimmed)           │░░░░                                                  │
│ │                            │░░░░  ┌─────────────────────────────────────────┐    │
│ │                            │░░░░  │  💾 Save Test Suite               ✕     │    │
│ │                            │░░░░  │                                         │    │
│ │                            │░░░░  │  Save to: test-suites/                  │    │
│ │                            │░░░░  │                                         │    │
│ │                            │░░░░  │  Filename:                              │    │
│ │                            │░░░░  │  ┌───────────────────────────────────┐  │    │
│ │                            │░░░░  │  │ wishlist-add-remove              │  │    │
│ │                            │░░░░  │  └───────────────────────────────────┘  │    │
│ │                            │░░░░  │  Will save as: wishlist-add-remove.json │    │
│ │                            │░░░░  │                                         │    │
│ │                            │░░░░  │  Existing files in test-suites/:        │    │
│ │                            │░░░░  │  ┌───────────────────────────────────┐  │    │
│ │                            │░░░░  │  │  📄 api-only-suite.json          │  │    │
│ │                            │░░░░  │  │  📄 ui-login-flow.json           │  │    │
│ │                            │░░░░  │  │  📄 wishlist-add-remove.json     │  │    │
│ │                            │░░░░  │  │                                  │  │    │
│ │                            │░░░░  │  └───────────────────────────────────┘  │    │
│ │                            │░░░░  │                                         │    │
│ │                            │░░░░  │        [ Cancel ]    [ 💾 Save ]        │    │
│ │                            │░░░░  │                       ══════════        │    │
│ └────────────────────────────┘░░░░  └─────────────────────────────────────────┘    │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Save As Dialog — Overwrite Confirmation

```
┌─────────────────────────────────────────────────────────────────┐
│  💾 Save Test Suite                                    ✕         │
│                                                                  │
│  Save to: test-suites/                                           │
│                                                                  │
│  Filename:                                                       │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ wishlist-add-remove                                     │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  ⚠ wishlist-add-remove.json already exists.                     │
│    Saving will overwrite the existing file.                      │
│                                                                  │
│              [ Cancel ]    [ Overwrite ]                         │
│                              ═══════════                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Save Success Toast (Transient)

```
                                        ╭──────────────────────────────╮
                                        │  ✅ Saved: wishlist-add-      │
                                        │     remove.json               │
                                        ╰──────────────────────────────╯
                                          (appears bottom-right, 2s auto-dismiss)
```

---

## Load Dialog (Browse All Files)

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│ ● ● ●  │  ◀ ▶ ↻  │  🔒 http://localhost:5273                               │ ≡ │
├─────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                     │
│ ┌────────────────────────────┐   ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │
│ │  Editor (dimmed)           │░░░░                                                  │
│ │                            │░░░░  ┌─────────────────────────────────────────┐    │
│ │                            │░░░░  │  📂 Load Test Suite               ✕     │    │
│ │                            │░░░░  │                                         │    │
│ │                            │░░░░  │  ┌───────────────────────────────────┐  │    │
│ │                            │░░░░  │  │ 🔍 Search files...               │  │    │
│ │                            │░░░░  │  └───────────────────────────────────┘  │    │
│ │                            │░░░░  │                                         │    │
│ │                            │░░░░  │  test-suites/  (3 files)                │    │
│ │                            │░░░░  │  ┌───────────────────────────────────┐  │    │
│ │                            │░░░░  │  │                                  │  │    │
│ │                            │░░░░  │  │  📄 api-only-suite.json          │  │    │
│ │                            │░░░░  │  │     Modified: 2026-03-20  3 tests │  │    │
│ │                            │░░░░  │  │                                  │  │    │
│ │                            │░░░░  │  │  📄 ui-login-flow.json           │  │    │
│ │                            │░░░░  │  │     Modified: 2026-03-19  2 tests │  │    │
│ │                            │░░░░  │  │                                  │  │    │
│ │                            │░░░░  │  │▶ 📄 wishlist-add-remove.json     │  │    │
│ │                            │░░░░  │  │     Modified: 2026-03-21  5 tests │  │    │
│ │                            │░░░░  │  │                                  │  │    │
│ │                            │░░░░  │  └───────────────────────────────────┘  │    │
│ │                            │░░░░  │                                         │    │
│ │                            │░░░░  │        [ Cancel ]    [ 📂 Load ]        │    │
│ │                            │░░░░  │                       ═════════         │    │
│ └────────────────────────────┘░░░░  └─────────────────────────────────────────┘    │
│                                                                                     │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

Note: The `▶` highlights the currently selected row.

---

## Load Dialog — Empty State (No Files)

```
┌─────────────────────────────────────────────────────────────────┐
│  📂 Load Test Suite                                    ✕         │
│                                                                  │
│                                                                  │
│              ┌──────────────────────────────────┐               │
│              │                                  │               │
│              │   📁 No test suites saved yet    │               │
│              │                                  │               │
│              │   Save a test suite first to     │               │
│              │   see it listed here.            │               │
│              │                                  │               │
│              └──────────────────────────────────┘               │
│                                                                  │
│                         [ Close ]                                │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Load Dialog — Search Filtered

```
┌─────────────────────────────────────────────────────────────────┐
│  📂 Load Test Suite                                    ✕         │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ 🔍 wishlist                                        ✕    │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  test-suites/  (1 match)                                         │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                                                         │    │
│  │▶ 📄 wishlist-add-remove.json                            │    │
│  │     Modified: 2026-03-21  |  5 tests                    │    │
│  │                                                         │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│        [ Cancel ]    [ 📂 Load ]                                 │
│                       ═════════                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Unsaved Changes Warning (When Loading Over Edits)

```
┌─────────────────────────────────────────────────────────────────┐
│  ⚠ Unsaved Changes                                    ✕         │
│                                                                  │
│  You have unsaved changes in the editor.                         │
│  Loading a new file will discard them.                           │
│                                                                  │
│                                                                  │
│   [ Cancel ]    [ Discard & Load ]                               │
│                  ═════════════════                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## File List Item Anatomy

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│   [sel]  📄 [filename.json                    ]  [date]  [count] │
│    ▶/    max ~35 chars, truncated with …         modified  N tests│
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Interactions

| Trigger | Action |
|---------|--------|
| Click 💾 Save ▼ > "Save" | If file named: saves immediately with toast. If new/unsaved: opens Save As dialog |
| Click 💾 Save ▼ > "Save As..." | Always opens Save As dialog |
| Type filename | Auto-appends `.json` in preview, highlights any existing match in file list below |
| Click existing file in Save As list | Pre-fills filename input with that name |
| Click [Save] in dialog | Saves file, closes dialog, shows success toast |
| Click 📂 Load ▼ > recent file | Loads directly (prompts for unsaved changes if applicable) |
| Click 📂 Load ▼ > "Browse all..." | Opens Load dialog |
| Click file row in Load dialog | Selects row (highlighted with ▶) |
| Double-click file row | Selects and loads immediately |
| Click [Load] button | Loads selected file, closes dialog |
| Type in search | Filters file list in real-time |
| Press Escape | Closes dialog, no action |

---

## Accessibility Notes

- Dialogs use `role="dialog"`, `aria-modal="true"`, `aria-labelledby`
- Focus auto-moves to filename input on Save As open
- Focus auto-moves to search input on Load open
- File list uses `role="listbox"` with `role="option"` items
- Selected file: `aria-selected="true"`
- Press Enter on selected item to load
- Press Escape to dismiss
