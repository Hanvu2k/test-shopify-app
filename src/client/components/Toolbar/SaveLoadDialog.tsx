import { useEffect, useRef, useState, useCallback } from 'react';
import { X, Save, FileText } from 'lucide-react';

interface SaveLoadDialogProps {
  mode: 'save' | 'load';
  suiteFiles: string[];
  onSave: (filename: string) => void;
  onLoad: (filename: string) => void;
  onClose: () => void;
}

export function SaveLoadDialog({
  mode,
  suiteFiles,
  onSave,
  onLoad,
  onClose,
}: SaveLoadDialogProps) {
  const [filename, setFilename] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  // Focus the input on open (save mode) or trap focus (load mode)
  useEffect(() => {
    if (mode === 'save' && inputRef.current) {
      inputRef.current.focus();
    }
  }, [mode]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleOverlayClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose],
  );

  const handleSaveSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = filename.trim();
      if (!trimmed) return;
      // Automatically append .json extension if absent
      const finalName = trimmed.endsWith('.json') ? trimmed : `${trimmed}.json`;
      onSave(finalName);
    },
    [filename, onSave],
  );

  const handleLoadSelect = useCallback(
    (name: string) => {
      onLoad(name);
    },
    [onLoad],
  );

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      role="dialog"
      aria-modal="true"
      aria-label={mode === 'save' ? 'Save test suite' : 'Load test suite'}
      onClick={handleOverlayClick}
    >
      {/* Dialog panel */}
      <div
        ref={dialogRef}
        className="relative w-full max-w-sm rounded-md bg-surface-raised border border-border shadow-2xl mx-4"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            {mode === 'save' ? (
              <Save size={14} className="text-text-secondary" />
            ) : (
              <FileText size={14} className="text-text-secondary" />
            )}
            <h2 className="text-sm font-medium text-text-primary">
              {mode === 'save' ? 'Save Test Suite' : 'Load Test Suite'}
            </h2>
          </div>
          <button
            type="button"
            aria-label="Close dialog"
            className="text-text-secondary hover:text-text-primary transition-colors p-0.5 rounded hover:bg-surface-overlay"
            onClick={onClose}
          >
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4">
          {mode === 'save' ? (
            <form onSubmit={handleSaveSubmit} className="space-y-3">
              <label className="block">
                <span className="text-xs text-text-secondary block mb-1.5">
                  Filename
                </span>
                <input
                  ref={inputRef}
                  type="text"
                  value={filename}
                  onChange={(e) => setFilename(e.target.value)}
                  placeholder="my-test-suite.json"
                  className="toolbar-input w-full font-mono"
                  aria-label="Test suite filename"
                  spellCheck={false}
                />
                <span className="text-xs text-text-muted mt-1 block">
                  Saved to test-suites/ directory. .json added automatically.
                </span>
              </label>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={onClose}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={!filename.trim()}
                >
                  <Save size={13} />
                  Save
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-2">
              {suiteFiles.length === 0 ? (
                <p className="text-sm text-text-muted text-center py-6">
                  No saved test suites found.
                </p>
              ) : (
                <ul
                  className="space-y-0.5 max-h-60 overflow-y-auto"
                  role="listbox"
                  aria-label="Available test suites"
                >
                  {suiteFiles.map((name) => (
                    <li key={name}>
                      <button
                        type="button"
                        role="option"
                        aria-selected="false"
                        className={[
                          'w-full flex items-center gap-2 px-3 py-2 rounded text-sm text-left',
                          'text-text-primary hover:bg-surface-overlay',
                          'transition-colors duration-100 font-mono',
                        ].join(' ')}
                        onClick={() => handleLoadSelect(name)}
                      >
                        <FileText size={13} className="text-text-secondary flex-none" />
                        <span className="truncate">{name}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex justify-end pt-1 border-t border-border">
                <button
                  type="button"
                  className="btn-ghost mt-2"
                  onClick={onClose}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
