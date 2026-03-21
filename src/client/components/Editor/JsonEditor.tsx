import { useEffect, useRef } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { EditorState, Compartment } from '@codemirror/state';
import { json, jsonParseLinter } from '@codemirror/lang-json';
import { oneDark } from '@codemirror/theme-one-dark';
import { linter, lintGutter } from '@codemirror/lint';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface JsonEditorProps {
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  placeholder?: string;
}

// ---------------------------------------------------------------------------
// Custom theme extensions to match app's dark aesthetic
// ---------------------------------------------------------------------------

const editorTheme = EditorView.theme({
  '&': {
    height: '100%',
    fontSize: '13px',
    fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", "Consolas", monospace',
  },
  '.cm-scroller': {
    overflow: 'auto',
    fontFamily: 'inherit',
  },
  '.cm-content': {
    padding: '8px 0',
    caretColor: '#61afef',
  },
  '.cm-focused': {
    outline: 'none',
  },
  '.cm-editor': {
    height: '100%',
  },
  // Lint gutter alignment
  '.cm-gutter.cm-lint-markers': {
    width: '16px',
  },
});

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/**
 * JsonEditor — CodeMirror 6 editor with JSON language support, syntax
 * highlighting, inline linting, and one-dark theme.
 *
 * Uses useRef + useEffect to imperatively manage the EditorView lifecycle.
 * Value synchronization is done via EditorView.dispatch to avoid destroying
 * and re-creating the view on every keystroke.
 */
// Compartments allow dynamic reconfiguration of individual extensions
const editableCompartment = new Compartment();
const readOnlyCompartment = new Compartment();

export function JsonEditor({ value, onChange, readOnly = false, placeholder }: JsonEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  // Track the last value we pushed in so the sync effect can skip no-ops
  const externalValueRef = useRef(value);

  // Keep stable onChange reference so the listener extension doesn't rebuild
  const onChangeRef = useRef(onChange);
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Initialize editor once on mount
  useEffect(() => {
    if (!containerRef.current) return;

    const extensions = [
      basicSetup,
      json(),
      oneDark,
      editorTheme,
      lintGutter(),
      linter(jsonParseLinter()),
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          const newValue = update.state.doc.toString();
          externalValueRef.current = newValue;
          onChangeRef.current(newValue);
        }
      }),
      editableCompartment.of(EditorView.editable.of(!readOnly)),
      readOnlyCompartment.of(EditorState.readOnly.of(readOnly)),
    ];

    if (placeholder) {
      extensions.push(
        EditorView.theme({
          '.cm-placeholder': {
            color: '#5c6370',
            fontStyle: 'italic',
          },
        })
      );
    }

    const state = EditorState.create({
      doc: value,
      extensions,
    });

    const view = new EditorView({
      state,
      parent: containerRef.current,
    });

    viewRef.current = view;
    externalValueRef.current = value;

    return () => {
      view.destroy();
      viewRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Intentionally empty: editor is initialized once

  // Sync external value changes into the editor without re-initializing
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    const currentDoc = view.state.doc.toString();
    if (currentDoc === value) return; // Already in sync

    // Replace entire document content
    view.dispatch({
      changes: {
        from: 0,
        to: currentDoc.length,
        insert: value,
      },
    });

    externalValueRef.current = value;
  }, [value]);

  // Sync readOnly changes via compartment reconfiguration
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;

    view.dispatch({
      effects: [
        editableCompartment.reconfigure(EditorView.editable.of(!readOnly)),
        readOnlyCompartment.reconfigure(EditorState.readOnly.of(readOnly)),
      ],
    });
  }, [readOnly]);

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-hidden min-h-0"
      style={{ height: '100%' }}
      aria-label={placeholder ?? 'JSON editor'}
      role="textbox"
      aria-multiline
    />
  );
}

// ---------------------------------------------------------------------------
// Format utility (exported for toolbar use)
// ---------------------------------------------------------------------------

/**
 * Attempt to pretty-print a JSON string. Returns the formatted string on
 * success, or the original string on parse failure.
 */
export function formatJson(raw: string): string {
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
}
