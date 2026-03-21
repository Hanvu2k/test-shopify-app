# Wishlist Tester Web UI — Wireframes Index

**Project**: wishlist-tester-2026-03
**Designer**: Emily Chen (Senior UX Designer)
**Date**: 2026-03-21
**Status**: PENDING APPROVAL

---

## Screen Inventory

| # | Screen | File | Status | User Stories |
|---|--------|------|--------|--------------|
| 01 | Main Screen | [01-main-screen.md](screens/01-main-screen.md) | READY | US-001, US-003, US-004, US-006, US-007 |
| 02 | Results Panel | [02-results-panel.md](screens/02-results-panel.md) | READY | US-007, US-008 |
| 03 | History Panel | [03-history-panel.md](screens/03-history-panel.md) | READY | US-009 |
| 04 | Save / Load Dialog | [04-save-load-dialog.md](screens/04-save-load-dialog.md) | READY | US-002 |
| 05 | URL Preview Panel | [05-url-preview.md](screens/05-url-preview.md) | READY | US-010 |

---

## Layout Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│  App Header (logo, version, docs link)                              │
├─────────────────────────────────────────────────────────────────────┤
│  Toolbar (URL input, Run, Abort, Save, Load, History)               │
├──────────────────────────────┬──────────────────────────────────────┤
│                              │                                      │
│  LEFT PANEL                  │  RIGHT PANEL                         │
│  JSON Editor (CodeMirror 6)  │  Results Stream                      │
│  - Syntax highlighting       │  - SSE test results                  │
│  - Inline validation         │  - Expandable details                │
│  - Line numbers              │  - Screenshots on failure            │
│  - Monospace font            │  - Summary bar                       │
│                              │                                      │
│         ↔ (resizable)        │                                      │
├──────────────────────────────┴──────────────────────────────────────┤
│  Status Bar (run state, progress, pass/fail counts, duration)       │
└─────────────────────────────────────────────────────────────────────┘

Optional overlays (appear above main layout):
  - History Panel   → right-side slide-in (screen 03)
  - Save Dialog     → centered modal (screen 04)
  - Load Dialog     → centered modal (screen 04)

Optional third panel (opt-in via toolbar):
  - URL Preview     → right panel alongside results (screen 05)
```

---

## Screen States Covered

| Screen | States Wireframed |
|--------|-------------------|
| 01 Main Screen | Empty, Ready, Running, Completed (pass), Completed (with fails), JSON error |
| 02 Results Panel | Empty, Running, All pass, With failures (collapsed + expanded), API fail detail, UI fail with screenshot, Aborted |
| 03 History Panel | Populated list, Run detail view, Empty state, Search filtered |
| 04 Save/Load Dialog | Save As, Overwrite confirmation, Success toast, Load (with files), Load (empty), Load (search filtered), Unsaved changes warning |
| 05 URL Preview | Collapsed (toolbar only), Three-column expanded, Loading, iframe blocked error, Empty URL state |

---

## Design Principles Applied

1. **Developer tool aesthetic** — VS Code/Postman visual language: dark-ready, monospace, dense information
2. **Functional over decorative** — Every element earns its space. No decorative chrome.
3. **Keyboard-first** — All critical actions reachable without mouse
4. **Progressive disclosure** — Details hidden by default, expanded on demand (result rows, preview panel)
5. **Non-blocking overlays** — History and dialogs don't replace the main view; they layer over it
6. **Accessibility** — ARIA roles, keyboard navigation, color + icon dual-coding for status

---

## Component Patterns

| Pattern | Used In |
|---------|---------|
| Split panel (resizable) | Main screen (editor + results) |
| Slide-in overlay panel | History panel |
| Centered modal dialog | Save As, Load, Unsaved changes warning |
| Inline expandable row | Results panel (failed test details) |
| Toolbar action group | Run/Abort, Save/Load dropdowns |
| Status bar | Main screen bottom |
| Toast notification | Save success |
| Three-column layout (opt-in) | URL preview expansion |

---

## Color / Theme Notes

The wireframes are intentionally monochrome ASCII. For implementation:

| Element | Dark Theme Suggestion |
|---------|----------------------|
| Background (app) | `#1e1e1e` (VS Code dark) |
| Panel background | `#252526` |
| Editor gutter | `#1e1e1e` |
| Toolbar | `#333333` |
| Status bar | `#007acc` (blue, VS Code style) |
| Pass indicator | `#4ec9b0` (green-teal) |
| Fail indicator | `#f44747` (red) |
| Running indicator | `#dcdcaa` (yellow) |
| Text (primary) | `#d4d4d4` |
| Text (muted) | `#808080` |
| Border | `#454545` |
| Run button (primary) | `#0e639c` → `#1177bb` hover |

---

## Approval Checklist

- [x] All user stories (US-001 through US-010 Web UI) have corresponding screens
- [x] Empty states shown for all panels
- [x] Loading states shown (running, SSE stream, iframe loading)
- [x] Error states shown (JSON validation, API fail, UI fail, iframe blocked)
- [x] Success states shown (all pass, save success)
- [x] Navigation flow documented (toolbar → panels → overlays)
- [x] Component descriptions included per screen
- [x] Interaction table included per screen
- [x] Accessibility notes included per screen
- [x] Desktop-first (this is a developer tool, no mobile view needed)

---

**Awaiting approval from PM / User before development begins.**
