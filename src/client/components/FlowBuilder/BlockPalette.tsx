// =============================================================================
// BlockPalette — Sidebar listing all draggable block types
// Reads from BLOCK_TYPES constant; no props required.
// =============================================================================

import React from 'react';
import {
  MousePointerClick,
  TextCursorInput,
  Clock,
  CheckCircle,
  Globe,
  LogIn,
  LogOut,
} from 'lucide-react';
import { BLOCK_TYPES } from './constants';
import { BlockType } from './types';

// ---------------------------------------------------------------------------
// Icon map — keyed by the icon name stored in BlockTypeDefinition
// ---------------------------------------------------------------------------

const ICON_MAP: Record<string, typeof MousePointerClick> = {
  MousePointerClick,
  TextCursorInput,
  Clock,
  CheckCircle,
  Globe,
  LogIn,
  LogOut,
};

// ---------------------------------------------------------------------------
// Drag handler — encodes block type into dataTransfer so FlowCanvas can read it
// ---------------------------------------------------------------------------

const onDragStart = (event: React.DragEvent, blockType: BlockType): void => {
  event.dataTransfer.setData('application/reactflow-blocktype', blockType);
  event.dataTransfer.effectAllowed = 'move';
};

// ---------------------------------------------------------------------------
// BlockPalette component
// ---------------------------------------------------------------------------

export const BlockPalette: React.FC = () => {
  return (
    <aside
      className="flex flex-col w-40 min-w-[160px] bg-gray-900 border-r border-gray-700 shadow-lg select-none"
      aria-label="Block palette"
    >
      {/* Header */}
      <div className="px-3 py-2 border-b border-gray-700">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          Blocks
        </h2>
      </div>

      {/* Block list */}
      <ul className="flex flex-col gap-0.5 p-2 overflow-y-auto">
        {BLOCK_TYPES.map((definition) => {
          const Icon = ICON_MAP[definition.icon];

          return (
            <li key={definition.type}>
              <div
                draggable
                onDragStart={(event) => onDragStart(event, definition.type)}
                className="flex items-center gap-2 px-2 py-1.5 rounded cursor-grab
                           text-gray-200 hover:bg-gray-700 active:cursor-grabbing
                           transition-colors duration-100"
                title={`Drag to add ${definition.label} block`}
              >
                {/* Colored icon badge */}
                <span
                  className={`flex items-center justify-center w-6 h-6 rounded ${definition.color} shrink-0`}
                >
                  {Icon && <Icon size={14} className="text-white" />}
                </span>

                {/* Block label */}
                <span className="text-xs font-medium leading-none truncate">
                  {definition.label}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </aside>
  );
};

export default BlockPalette;
