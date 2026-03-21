import { useState, useCallback, useRef, useEffect } from 'react';
import { Play, Square, Save, FolderOpen } from 'lucide-react';
import { SaveLoadDialog } from './SaveLoadDialog';

export interface ToolbarProps {
  targetUrl: string;
  onTargetUrlChange: (url: string) => void;
  onRun: () => void;
  onAbort: () => void;
  isRunning: boolean;
  onSave: (filename: string) => void;
  onLoad: (filename: string) => void;
  suiteFiles: string[];
}

type DialogMode = 'save' | 'load' | null;

export function Toolbar({
  targetUrl,
  onTargetUrlChange,
  onRun,
  onAbort,
  isRunning,
  onSave,
  onLoad,
  suiteFiles,
}: ToolbarProps) {
  const [dialogMode, setDialogMode] = useState<DialogMode>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);

  // Ctrl+Enter to run (when not already running)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !isRunning) {
        e.preventDefault();
        onRun();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isRunning, onRun]);

  const handleSave = useCallback(
    (filename: string) => {
      onSave(filename);
      setDialogMode(null);
    },
    [onSave],
  );

  const handleLoad = useCallback(
    (filename: string) => {
      onLoad(filename);
      setDialogMode(null);
    },
    [onLoad],
  );

  const handleDialogClose = useCallback(() => {
    setDialogMode(null);
  }, []);

  const handleOpenSave = useCallback(() => setDialogMode('save'), []);
  const handleOpenLoad = useCallback(() => setDialogMode('load'), []);

  return (
    <>
      <div
        className="flex items-center gap-2 w-full"
        role="toolbar"
        aria-label="Test run toolbar"
      >
        {/* URL input — takes most of the available width */}
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <label
            htmlFor="target-url"
            className="text-xs text-text-secondary whitespace-nowrap select-none hidden sm:block"
          >
            URL
          </label>
          <input
            ref={urlInputRef}
            id="target-url"
            type="url"
            value={targetUrl}
            onChange={(e) => onTargetUrlChange(e.target.value)}
            placeholder="https://myshop.myshopify.com"
            className="toolbar-input flex-1 min-w-0 font-mono"
            aria-label="Target URL"
            spellCheck={false}
            autoComplete="off"
            title="Target Shopify store URL"
          />
        </div>

        {/* Separator */}
        <div className="h-5 w-px bg-border flex-none" aria-hidden="true" />

        {/* Run button */}
        <button
          type="button"
          className="btn-primary flex-none"
          onClick={onRun}
          disabled={isRunning}
          aria-label={isRunning ? 'Tests are running' : 'Run test suite (Ctrl+Enter)'}
          title={isRunning ? 'Running…' : 'Run (Ctrl+Enter)'}
        >
          <Play size={13} aria-hidden="true" />
          <span>{isRunning ? 'Running…' : 'Run'}</span>
        </button>

        {/* Abort button — only visually enabled when running */}
        <button
          type="button"
          className="btn-danger flex-none"
          onClick={onAbort}
          disabled={!isRunning}
          aria-label="Abort running tests"
          aria-disabled={!isRunning}
          title="Abort"
        >
          <Square size={13} aria-hidden="true" />
          <span>Abort</span>
        </button>

        {/* Separator */}
        <div className="h-5 w-px bg-border flex-none" aria-hidden="true" />

        {/* Save button */}
        <button
          type="button"
          className="btn-ghost flex-none"
          onClick={handleOpenSave}
          aria-label="Save test suite"
          title="Save test suite"
        >
          <Save size={13} aria-hidden="true" />
          <span>Save</span>
        </button>

        {/* Load button */}
        <button
          type="button"
          className="btn-ghost flex-none"
          onClick={handleOpenLoad}
          aria-label="Load test suite"
          title="Load test suite"
        >
          <FolderOpen size={13} aria-hidden="true" />
          <span>Load</span>
        </button>
      </div>

      {/* Save / Load modal dialog */}
      {dialogMode !== null && (
        <SaveLoadDialog
          mode={dialogMode}
          suiteFiles={suiteFiles}
          onSave={handleSave}
          onLoad={handleLoad}
          onClose={handleDialogClose}
        />
      )}
    </>
  );
}
