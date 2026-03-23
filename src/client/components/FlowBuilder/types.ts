// =============================================================================
// FlowBuilder - Block Type Definitions
// Mirrors UiStep action types from core/types.ts for the visual flow builder.
// =============================================================================

/** All supported block action types — mirrors UiStep.action in core/types.ts */
export type BlockType =
  | 'click'
  | 'fill'
  | 'waitFor'
  | 'assertText'
  | 'navigate'
  | 'login'
  | 'logout';

/** Data payload stored inside each React Flow node.
 *  Index signature required by @xyflow/react v12 (Node<T> constrains T to Record<string, unknown>). */
export interface BlockNodeData {
  [key: string]: unknown;
  blockType: BlockType;
  /** User-defined name for this block */
  label: string;
  /** CSS selector (used by: click, fill, waitFor, assertText, logout) */
  selector?: string;
  /** Text to type into the element (fill action) */
  value?: string;
  /** Expected text content to assert (assertText action) */
  expected?: string;
  /** Target URL (navigate action) */
  url?: string;
  /** Login email credential (login action) */
  email?: string;
  /** Login password credential (login action) */
  password?: string;
}

// -----------------------------------------------------------------------------
// Block Palette Definitions
// -----------------------------------------------------------------------------

/** Describes a single configurable field on a block's properties panel */
export interface BlockField {
  key: keyof BlockNodeData;
  label: string;
  type: 'text' | 'password';
  placeholder: string;
  required: boolean;
}

/** Static metadata for a block type — used to render the palette and properties panel */
export interface BlockTypeDefinition {
  type: BlockType;
  /** Human-readable display name */
  label: string;
  /** Lucide icon component name */
  icon: string;
  /** TailwindCSS background color class */
  color: string;
  /** Ordered list of fields shown in the properties panel for this block type */
  fields: BlockField[];
}
