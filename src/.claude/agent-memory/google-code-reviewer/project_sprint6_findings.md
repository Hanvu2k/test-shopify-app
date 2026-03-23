---
name: Sprint 6 code review findings
description: Code review results for Sprint 6 — ThemePreview iframe/security, highlighter injection safety, App.tsx rewrite integration
type: project
---

Sprint 6 review verdict: NEEDS MINOR

**Bug — handleLoadTheme is a no-op:**
`App.tsx` `handleLoadTheme` calls `setThemeUrl((prev) => prev)`. React bails out of state updates when the functional updater returns the same reference. The "Load" button in the toolbar does nothing when the URL is already set. `ThemePreview` already reacts to `themeUrl` changes, so `handleLoadTheme` should either be removed (URL is reactive already) or trigger a real re-mount by tracking a "loadKey" counter.

**Why:** Functional updater returning the same value is a React optimization bail-out.
**How to apply:** Any "force re-render by setting state to same value" pattern needs a counter or key prop.

**Dead `ThemeSettings` component not wired in App.tsx:**
`ThemeSettings.tsx` was built for Task 6.1 and exported from the barrel (`index.ts`), but `App.tsx` duplicates the URL+password+Load UI inline instead of using it. `ThemeSettings` is dead code.

**Why:** App.tsx was written independently and reproduced the toolbar UI rather than composing ThemeSettings.
**How to apply:** Minor — component still works correctly; redundancy should be resolved before the sprint ends.

**`initialNodes`/`initialEdges` prop pattern breaks `handleLoadSuite`:**
`FlowBuilder` uses `useNodesState(initialNodes)` / `useEdgesState(initialEdges)`. React Flow's `useNodesState` only reads the initial value on mount; subsequent prop changes are silently ignored. When `App.tsx` loads a suite via `handleLoadSuite`, it calls `setFlowNodes(nodes)` + `setFlowEdges(edges)`, which updates the props passed to `FlowBuilder`, but the mounted `FlowBuilder` never re-initializes its canvas. The flow canvas stays empty after a Load Suite. This is a functional regression.

**Why:** useNodesState is like useState — it ignores prop changes after mount.
**How to apply:** `FlowBuilder` should expose a controlled pattern (accept nodes/edges + onChange and drive React Flow with them) or provide an imperative handle to reset the graph.

**Persistent dead code — `accumulatedResultsRef` (regression from Sprint 3):**
`useTestRun.ts` still defines and writes `accumulatedResultsRef` but never reads it. Was flagged in Sprint 3. Still not cleaned up.

**Sprint 5 regression resolved — node type string now correct:**
`flowConverter.ts` correctly uses `type: 'block'` (was `'blockNode'` in Sprint 5). Verified.

**Sprint 5 regression resolved — FlowBuilder wires BlockPalette and BlockProperties:**
`FlowBuilder.tsx` now composes `<BlockPalette />` and `<BlockProperties />` with all handlers. Verified.

**Sprint 5 regression resolved — barrel export now complete:**
`FlowBuilder/index.ts` exports `BlockPalette`, `BlockProperties`, and all converter functions. Verified.

**ICON_MAP still duplicated across 3 files (carry-over from Sprint 5):**
`BlockNode.tsx`, `BlockPalette.tsx`, `BlockProperties.tsx` each define an identical `ICON_MAP`. Not resolved in Sprint 6.

**iframe sandbox — correct:**
`sandbox="allow-scripts allow-same-origin allow-forms allow-popups"` is appropriately restrictive. `allow-top-navigation` and `allow-modals` are correctly excluded. No issue.

**highlighter.ts — XSS safety OK:**
`HIGHLIGHT_CSS` contains no user-supplied data. The `selector` passed to `querySelector` is validated implicitly (invalid selectors are caught). Class names are constants. No injection vector.

**attemptPasswordSubmit — correct use of native setter:**
Shopify uses vanilla JS forms; native setter + bubbled input/change events is the right approach. The `try/catch` around the whole block handles cross-origin correctly.

**Cross-origin iframe highlight — correctly handled:**
`getIframeDocument` returns `null` for cross-origin. Both `highlightElement` and `clearHighlight` no-op silently. The sprint notes acknowledge this limitation.

**Progress-based highlight index is unreliable:**
`App.tsx` derives `highlightSelector` from `flowNodes[progress.current - 1]`. This assumes `flowNodes` array order equals execution order. After user drag-reorder or after edge reconnection (delete mid-chain), the `flowNodes` array order may not match the topological execution order produced by `flowToJson`. The highlight will point to the wrong element.

**Why:** flowNodes is insertion-ordered; getOrderedNodes follows edges. They can diverge.
**How to apply:** Minor — either track the executing node by matching against ordered nodes, or emit the selector from the server via SSE.
