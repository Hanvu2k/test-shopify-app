// =============================================================================
// BlockNode — Custom React Flow node for rendering test blocks on the canvas.
// Displays a colored header with icon + type label, and a body with the
// user-defined label and a truncated selector/value preview.
// =============================================================================

import { memo } from 'react';
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import {
  MousePointerClick,
  TextCursorInput,
  Clock,
  CheckCircle,
  Globe,
  LogIn,
  LogOut,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { BlockNodeData, BlockType } from './types';
import { BLOCK_TYPE_MAP } from './constants';

// ---------------------------------------------------------------------------
// Icon lookup — maps block type → lucide icon component
// ---------------------------------------------------------------------------

const ICON_MAP: Record<BlockType, LucideIcon> = {
  click: MousePointerClick,
  fill: TextCursorInput,
  waitFor: Clock,
  assertText: CheckCircle,
  navigate: Globe,
  login: LogIn,
  logout: LogOut,
};

// ---------------------------------------------------------------------------
// Color map — maps Tailwind bg class → inline hex for the header bar
// (inline styles avoid Tailwind purge issues with dynamic classes)
// ---------------------------------------------------------------------------

const COLOR_HEX: Record<string, string> = {
  'bg-blue-500': '#3b82f6',
  'bg-green-500': '#22c55e',
  'bg-yellow-500': '#eab308',
  'bg-purple-500': '#a855f7',
  'bg-cyan-500': '#06b6d4',
  'bg-orange-500': '#f97316',
  'bg-red-500': '#ef4444',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Return a short preview string for the block body (selector, url, etc.) */
function getPreview(data: BlockNodeData): string | null {
  if (data.selector) return data.selector;
  if (data.url) return data.url;
  if (data.email) return data.email;
  return null;
}

/** Truncate a string to maxLen characters with ellipsis */
function truncate(str: string, maxLen: number): string {
  return str.length > maxLen ? str.slice(0, maxLen) + '\u2026' : str;
}

// ---------------------------------------------------------------------------
// BlockNode component
// ---------------------------------------------------------------------------

type BlockNodeType = Node<BlockNodeData, 'block'>;

function BlockNodeComponent({ data, selected }: NodeProps<BlockNodeType>) {
  const definition = BLOCK_TYPE_MAP.get(data.blockType);
  const Icon = ICON_MAP[data.blockType];
  const typeLabel = definition?.label ?? data.blockType;
  const colorClass = definition?.color ?? 'bg-blue-500';
  const headerColor = COLOR_HEX[colorClass] ?? '#3b82f6';

  const preview = getPreview(data);

  return (
    <div
      className={[
        'rounded-lg overflow-hidden shadow-lg',
        'bg-surface-raised border',
        'transition-all duration-150',
        selected
          ? 'border-brand ring-1 ring-brand/50'
          : 'border-border hover:border-border-focus',
      ].join(' ')}
      style={{ width: 180 }}
    >
      {/* Target handle (top — incoming edge) */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-2.5 !h-2.5 !bg-border !border-2 !border-surface-raised !-top-1.5"
      />

      {/* Colored header bar */}
      <div
        className="flex items-center gap-1.5 px-2.5 py-1.5"
        style={{ backgroundColor: headerColor }}
      >
        {Icon && <Icon size={13} className="text-white shrink-0" />}
        <span className="text-white text-xs font-semibold uppercase tracking-wide truncate">
          {typeLabel}
        </span>
      </div>

      {/* Body */}
      <div className="px-2.5 py-2 space-y-1">
        {/* User-defined label */}
        <p className="text-text-primary text-xs font-medium truncate leading-tight">
          {data.label || 'Untitled'}
        </p>

        {/* Selector / value preview */}
        {preview && (
          <p className="text-text-muted text-xs font-mono truncate leading-tight">
            {truncate(preview, 28)}
          </p>
        )}
      </div>

      {/* Source handle (bottom — outgoing edge) */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-2.5 !h-2.5 !bg-border !border-2 !border-surface-raised !-bottom-1.5"
      />
    </div>
  );
}

export const BlockNode = memo(BlockNodeComponent);
