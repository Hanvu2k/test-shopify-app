---
name: Sprint 5 code review findings
description: Code review results for Sprint 5 FlowBuilder components — React Flow canvas, BlockNode, BlockPalette, BlockProperties, flowConverter
type: project
---

Sprint 5 review verdict: NEEDS MAJOR

**Critical bug — wrong node type string in jsonToFlow:**
`flowConverter.ts` line 93 sets `type: 'blockNode'` on imported nodes, but the registered type in `FlowCanvas.tsx` is `'block'`. All JSON-imported nodes render as plain default React Flow nodes, not `BlockNode`. Round-trip import is broken.

**Why:** nodeTypes registry uses key `'block'` but converter hardcodes `'blockNode'`.
**How to apply:** Any future node type registration must be verified against all converter paths.

**Integration gap — FlowBuilder does not wire BlockPalette or BlockProperties:**
`FlowBuilder.tsx` uses empty `<div id="palette-slot" />` and `<div id="properties-slot" />` placeholders. `BlockPalette` and `BlockProperties` are not composed into `FlowBuilder`. `handleNodeDataUpdate` exists but is never passed to any child. Both panels are disconnected.

**DRY violation — ICON_MAP duplicated in 3 files:**
`BlockNode.tsx`, `BlockPalette.tsx`, and `BlockProperties.tsx` each define an identical `ICON_MAP` object. Should be extracted to `constants.ts`.

**Incomplete barrel export:**
`index.ts` does not export `BlockPalette` or `BlockProperties`. Consumers importing from the FlowBuilder module cannot access them.

**Minor — useCallback dependency on selectedNodeId in handleNodesChange:**
Causes the callback to be recreated on every selection change. Not a bug but causes unnecessary React Flow re-attachment.
