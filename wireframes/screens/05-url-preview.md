# Screen 05: URL Preview Panel

**Purpose**: Allows developers to view the target Shopify store page alongside their test editor, so they can inspect the page they are writing tests for without switching browser tabs.

**User Stories**: US-010

---

## URL Preview — Collapsed (Default in Toolbar)

In the default layout, the target URL is just an input field in the toolbar. This is the primary interaction point.

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│ ┌─────────────────────────────────────────────────────────────────────────────────┐ │
│ │  🌐 Target URL:  ┌────────────────────────────────────────────────────────────┐ │ │
│ │                  │ https://myshop.myshopify.com/products/test-product   [↗][👁]│ │ │
│ │                  └────────────────────────────────────────────────────────────┘ │ │
│ │                                                                                 │ │
│ │  [ ▶ Run ]  [ ■ Abort ]    [ 💾 Save ▼ ]  [ 📂 Load ▼ ]  [ 🕒 History ]        │ │
│ └─────────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────────┘

  [↗] = Open in new tab
  [👁] = Toggle preview panel (shows iframe below)
```

---

## URL Preview — Panel Expanded (Three-Column Layout)

When the developer clicks [👁], a third panel appears below the toolbar. The layout shifts to accommodate it.

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│ ● ● ●  │  ◀ ▶ ↻  │  🔒 http://localhost:5273                               │ ≡ │
├─────────────────────────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────────────────────────────┐ │
│ │  🧪 Wishlist Tester                                               v1.0  💡 Docs │ │
│ └─────────────────────────────────────────────────────────────────────────────────┘ │
│ ┌─────────────────────────────────────────────────────────────────────────────────┐ │
│ │  🌐 Target URL:  [ https://myshop.myshopify.com/products/test-product    ][↗][👁]│ │
│ │                                                                                 │ │
│ │  [ ▶ Run ]  [ ■ Abort ]    [ 💾 Save ▼ ]  [ 📂 Load ▼ ]  [ 🕒 History ]        │ │
│ └─────────────────────────────────────────────────────────────────────────────────┘ │
│ ┌──────────────────────┬──────────────────────┬──────────────────────────────────┐ │
│ │  📄 Editor           │  📊 Results          │  🌐 Preview                 ✕    │ │
│ │                      │                      │  [↗ Open in new tab]             │ │
│ ├──────────────────────┼──────────────────────┼──────────────────────────────────┤ │
│ │  1  {                │  ✅ Test 1  api 312ms │  ┌──────────────────────────┐   │ │
│ │  2    "name": "Wi..  │  ✅ Test 2  ui  1.2s  │  │ ┌──────────────────────┐ │   │ │
│ │  3    "baseUrl": ".. │  ❌ Test 3  ui  2.1s  │  │ │ myshop.myshopify.com │ │   │ │
│ │  4    "tests": [     │     ▶ Details         │  │ ├──────────────────────┤ │   │ │
│ │  5      {            │                       │  │ │                      │ │   │ │
│ │  6        "name":..  │                       │  │ │  [Shopify Page       │ │   │ │
│ │  7        "type":..  │                       │  │ │   Content Rendered   │ │   │ │
│ │  8        "method":  │                       │  │ │   in iframe]         │ │   │ │
│ │  9        "url": ".. │                       │  │ │                      │ │   │ │
│ │ 10        "body": {  │                       │  │ │  Product Title       │ │   │ │
│ │ 11  ~                │                       │  │ │  $49.99              │ │   │ │
│ │                      │                       │  │ │  [Add to Wishlist]   │ │   │ │
│ │                      │                       │  │ │                      │ │   │ │
│ │                      │                       │  │ └──────────────────────┘ │   │ │
│ │                      │                       │  └──────────────────────────┘   │ │
│ └──────────────────────┴──────────────────────┴──────────────────────────────────┘ │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐ │
│  │  Status: Idle  |  ...                                                           │ │
│  └─────────────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

Note: Three-column layout is narrower than the standard two-column. Each panel gets ~33% width. Developers with narrow screens may prefer the "open in new tab" option instead.

---

## URL Input States

### A. Empty (No URL entered)

```
┌──────────────────────────────────────────────────────────────────┐
│  🌐 Target URL:  ┌────────────────────────────────────────────┐  │
│                  │ Enter Shopify store URL...            [↗][👁]│  │
│                  └────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

### B. URL Entered (Valid)

```
┌──────────────────────────────────────────────────────────────────┐
│  🌐 Target URL:  ┌────────────────────────────────────────────┐  │
│                  │ https://myshop.myshopify.com/products/test │  │
│                  │                                       [↗][👁]│  │
│                  └────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

### C. Preview Loading

```
┌────────────────────────────────────────────────────────────────┐
│  🌐 Preview                                               ✕    │
│  ◐ Loading...                                                   │
├────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                                                          │  │
│  │                 ◐ Loading page...                        │  │
│  │                                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

### D. Preview Load Error (iframe blocked)

```
┌────────────────────────────────────────────────────────────────┐
│  🌐 Preview                                               ✕    │
│  ⚠ Cannot embed this page                                      │
├────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                                                          │  │
│  │  ⚠ This page cannot be displayed in a preview panel.    │  │
│  │                                                          │  │
│  │  The site may have X-Frame-Options restrictions.         │  │
│  │                                                          │  │
│  │  [ ↗ Open in New Tab ]                                   │  │
│  │                                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

Note: Many Shopify stores block iframe embedding via X-Frame-Options headers. The "Open in New Tab" fallback is critical.

### E. URL Not Set — Preview Panel Empty State

```
┌────────────────────────────────────────────────────────────────┐
│  🌐 Preview                                               ✕    │
├────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                                                          │  │
│  │   Enter a Target URL in the toolbar to preview          │  │
│  │   the page here.                                        │  │
│  │                                                          │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────┘
```

---

## Interactions

| Trigger | Action |
|---------|--------|
| Type in URL input | Updates target URL used for tests |
| Press Enter in URL input | If preview panel open: reloads iframe with new URL |
| Click [↗] (open in new tab) | Opens URL in a new browser tab |
| Click [👁] (toggle preview) | Shows/hides the preview panel. Triggers iframe load if URL is set |
| Click ✕ on preview panel | Closes preview panel, returns to two-column layout |
| URL input: lost focus | Saves URL to state, updates tests' baseUrl variable |

---

## Design Notes

- The URL entered here becomes the `baseUrl` variable available for test suite interpolation via `{{baseUrl}}`
- [↗] is always available as a fallback when iframe embedding fails
- Three-column layout is opt-in, not default — protects the editor's working space
- Preview panel has a mini address bar showing the current loaded URL (the iframe's own navigation is passive)
- Panel widths in three-column mode are equal thirds by default, but the dividers remain draggable

---

## Accessibility Notes

- URL input: `aria-label="Target Shopify store URL"`, `type="url"`, `autocomplete="url"`
- Open in new tab button: `aria-label="Open target URL in new tab"`, `target="_blank"` with `rel="noopener noreferrer"`
- Toggle preview button: `aria-label="Toggle page preview panel"`, `aria-pressed="true/false"`
- iframe: `title="Target store page preview"`
- Close preview button: `aria-label="Close preview panel"`
