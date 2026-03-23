// =============================================================================
// BlockProperties — Side panel for editing a selected block's fields.
// Renders dynamic fields from BLOCK_TYPE_MAP plus a universal label input.
// Width: ~250px, docked to the right of the canvas area.
// =============================================================================

import React, { useCallback } from 'react';
import {
  MousePointerClick,
  TextCursorInput,
  Clock,
  CheckCircle,
  Globe,
  LogIn,
  LogOut,
  X,
} from 'lucide-react';
import { BLOCK_TYPE_MAP } from './constants';
import { BlockNodeData, BlockType } from './types';

// ---------------------------------------------------------------------------
// Icon map — keyed by the icon name stored in BlockTypeDefinition
// ---------------------------------------------------------------------------

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  MousePointerClick,
  TextCursorInput,
  Clock,
  CheckCircle,
  Globe,
  LogIn,
  LogOut,
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface BlockPropertiesProps {
  /** Currently selected block's data. null = no block selected. */
  nodeData: BlockNodeData | null;
  /** The type of the selected block. null when nodeData is null. */
  blockType: BlockType | null;
  /** Called with a partial update whenever any field changes. */
  onUpdate: (data: Partial<BlockNodeData>) => void;
  /** Called when the user closes the panel. */
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Helper: determine whether a field's input should use monospace font
// Selectors, URLs, and values benefit from monospace legibility.
// ---------------------------------------------------------------------------

const isMonoField = (key: string): boolean =>
  key === 'selector' || key === 'url' || key === 'value' || key === 'expected';

// ---------------------------------------------------------------------------
// BlockProperties component
// ---------------------------------------------------------------------------

export const BlockProperties: React.FC<BlockPropertiesProps> = ({
  nodeData,
  blockType,
  onUpdate,
  onClose,
}) => {
  // Empty-state: no block selected
  if (nodeData === null || blockType === null) {
    return (
      <aside
        className="flex items-center justify-center w-[250px] min-w-[250px] bg-gray-900 border-l border-gray-700 text-gray-500 text-xs select-none"
        aria-label="Block properties"
      >
        Select a block to edit
      </aside>
    );
  }

  const definition = BLOCK_TYPE_MAP.get(blockType);

  // Guard: unknown block type (shouldn't happen in practice)
  if (!definition) {
    return null;
  }

  const Icon = ICON_MAP[definition.icon];

  return (
    <BlockPropertiesPanel
      nodeData={nodeData}
      definition={definition}
      Icon={Icon}
      onUpdate={onUpdate}
      onClose={onClose}
    />
  );
};

// ---------------------------------------------------------------------------
// Inner panel — split out to avoid hooks-in-conditional lint issues
// ---------------------------------------------------------------------------

interface PanelProps {
  nodeData: BlockNodeData;
  definition: ReturnType<typeof BLOCK_TYPE_MAP.get> & {};
  Icon: React.ComponentType<{ size?: number; className?: string }> | undefined;
  onUpdate: (data: Partial<BlockNodeData>) => void;
  onClose: () => void;
}

const BlockPropertiesPanel: React.FC<PanelProps> = ({
  nodeData,
  definition,
  Icon,
  onUpdate,
  onClose,
}) => {
  const handleLabelChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      onUpdate({ label: e.target.value });
    },
    [onUpdate],
  );

  const handleFieldChange = useCallback(
    (key: keyof BlockNodeData, value: string) => {
      onUpdate({ [key]: value } as Partial<BlockNodeData>);
    },
    [onUpdate],
  );

  return (
    <aside
      className="flex flex-col w-[250px] min-w-[250px] bg-gray-900 border-l border-gray-700 shadow-lg overflow-y-auto"
      aria-label={`${definition.label} block properties`}
    >
      {/* ------------------------------------------------------------------ */}
      {/* Header: icon + block type label + close button                      */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-gray-700 shrink-0">
        {/* Colored icon badge */}
        <span
          className={`flex items-center justify-center w-6 h-6 rounded ${definition.color} shrink-0`}
        >
          {Icon && <Icon size={14} className="text-white" />}
        </span>

        {/* Block type name */}
        <span className="flex-1 text-sm font-semibold text-gray-100 truncate">
          {definition.label}
        </span>

        {/* Close button */}
        <button
          type="button"
          onClick={onClose}
          className="flex items-center justify-center w-6 h-6 rounded text-gray-400
                     hover:text-gray-100 hover:bg-gray-700 transition-colors duration-100"
          aria-label="Close properties panel"
          title="Close"
        >
          <X size={14} />
        </button>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Form fields                                                          */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col gap-4 p-3">
        {/* Universal label field */}
        <FieldGroup label="Label" fieldId="block-label" required={false}>
          <input
            id="block-label"
            type="text"
            value={nodeData.label}
            onChange={handleLabelChange}
            placeholder="Name this block…"
            className="w-full px-2 py-1.5 rounded bg-gray-800 border border-gray-600
                       text-sm text-gray-100 placeholder-gray-500
                       focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500
                       transition-colors duration-100"
            autoComplete="off"
            spellCheck={false}
          />
        </FieldGroup>

        {/* Dynamic fields defined by the block type */}
        {definition.fields.map((field) => {
          const rawValue = nodeData[field.key];
          const inputValue = typeof rawValue === 'string' ? rawValue : '';
          const mono = isMonoField(String(field.key));

          return (
            <FieldGroup
              key={String(field.key)}
              label={field.label}
              fieldId={`block-field-${String(field.key)}`}
              required={field.required}
            >
              <input
                id={`block-field-${String(field.key)}`}
                type={field.type}
                value={inputValue}
                onChange={(e) =>
                  handleFieldChange(field.key as keyof BlockNodeData, e.target.value)
                }
                placeholder={field.placeholder}
                className={[
                  'w-full px-2 py-1.5 rounded bg-gray-800 border border-gray-600',
                  'text-sm text-gray-100 placeholder-gray-500',
                  'focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500',
                  'transition-colors duration-100',
                  mono ? 'font-mono' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                autoComplete={field.type === 'password' ? 'current-password' : 'off'}
                spellCheck={false}
              />
            </FieldGroup>
          );
        })}
      </div>
    </aside>
  );
};

// ---------------------------------------------------------------------------
// FieldGroup — label + input wrapper
// ---------------------------------------------------------------------------

interface FieldGroupProps {
  label: string;
  fieldId: string;
  required: boolean;
  children: React.ReactNode;
}

const FieldGroup: React.FC<FieldGroupProps> = ({ label, fieldId, required, children }) => (
  <div className="flex flex-col gap-1">
    <label
      htmlFor={fieldId}
      className="flex items-center gap-1 text-xs font-medium text-gray-400 select-none"
    >
      {label}
      {required && (
        <span className="text-red-400" aria-hidden="true" title="Required">
          *
        </span>
      )}
    </label>
    {children}
  </div>
);

export default BlockProperties;
