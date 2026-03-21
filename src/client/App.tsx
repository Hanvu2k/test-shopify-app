import { useState, useCallback, useRef } from 'react';

const MIN_PANEL_WIDTH_PX = 200;
const DEFAULT_SPLIT_PERCENT = 50;

/**
 * Root application layout.
 *
 * Structure:
 *   ┌─────────────────────────────────────────┐
 *   │ [Toolbar: URL input, Run, Abort, etc.]  │
 *   ├──────────────────┬──────────────────────┤
 *   │                  │                      │
 *   │  JSON Editor     │   Test Results       │
 *   │  (left panel)    │   (right panel)      │
 *   │                  │                      │
 *   ├──────────────────┴──────────────────────┤
 *   │ [Status bar: progress info]             │
 *   └─────────────────────────────────────────┘
 */
export function App() {
  const [splitPercent, setSplitPercent] = useState(DEFAULT_SPLIT_PERCENT);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  const handleDividerMouseDown = useCallback(() => {
    isDraggingRef.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const handleMouseMove = (event: MouseEvent) => {
      if (!isDraggingRef.current || !containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const containerWidth = containerRect.width;
      const offsetX = event.clientX - containerRect.left;

      const minPercent = (MIN_PANEL_WIDTH_PX / containerWidth) * 100;
      const maxPercent = 100 - minPercent;
      const clampedPercent = Math.min(Math.max((offsetX / containerWidth) * 100, minPercent), maxPercent);

      setSplitPercent(clampedPercent);
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, []);

  return (
    <div className="flex flex-col h-full bg-surface text-text-primary overflow-hidden">
      {/* Toolbar */}
      <header className="flex-none flex items-center gap-2 px-3 py-2 bg-surface-raised border-b border-border h-12">
        <ToolbarPlaceholder />
      </header>

      {/* Main split panel area */}
      <main
        ref={containerRef}
        className="flex flex-1 overflow-hidden min-h-0"
      >
        {/* Left panel: JSON Editor */}
        <section
          className="flex flex-col overflow-hidden"
          style={{ width: `${splitPercent}%`, minWidth: MIN_PANEL_WIDTH_PX }}
          aria-label="JSON Editor"
        >
          <div className="panel-header">
            <span>JSON Editor</span>
          </div>
          <EditorPlaceholder />
        </section>

        {/* Resizable divider */}
        <div
          role="separator"
          aria-label="Resize panels"
          aria-orientation="vertical"
          className="flex-none w-1 bg-border hover:bg-brand cursor-col-resize transition-colors duration-100 active:bg-brand"
          onMouseDown={handleDividerMouseDown}
        />

        {/* Right panel: Test Results */}
        <section
          className="flex flex-col flex-1 overflow-hidden min-w-0"
          style={{ minWidth: MIN_PANEL_WIDTH_PX }}
          aria-label="Test Results"
        >
          <div className="panel-header">
            <span>Test Results</span>
          </div>
          <ResultsPlaceholder />
        </section>
      </main>

      {/* Status bar */}
      <footer className="flex-none flex items-center gap-4 px-3 py-1 bg-brand text-white text-xs font-mono h-6 select-none">
        <StatusBarPlaceholder />
      </footer>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Placeholder sub-components (replaced in later tasks)
// ---------------------------------------------------------------------------

function ToolbarPlaceholder() {
  return (
    <div className="flex items-center gap-2 w-full">
      <input
        className="toolbar-input flex-1"
        type="url"
        placeholder="https://myshop.myshopify.com"
        readOnly
        aria-label="Target URL"
      />
      <button className="btn-primary" disabled aria-label="Run tests">
        Run
      </button>
      <button className="btn-danger" disabled aria-label="Abort tests">
        Abort
      </button>
      <button className="btn-ghost" disabled aria-label="Save test suite">
        Save
      </button>
      <button className="btn-ghost" disabled aria-label="Load test suite">
        Load
      </button>
    </div>
  );
}

function EditorPlaceholder() {
  return (
    <div className="flex flex-1 items-center justify-center code-area text-text-muted select-none">
      <div className="text-center space-y-2">
        <p className="text-base">JSON Editor</p>
        <p className="text-xs">CodeMirror 6 — Task 2.2</p>
      </div>
    </div>
  );
}

function ResultsPlaceholder() {
  return (
    <div className="flex flex-1 items-center justify-center code-area text-text-muted select-none">
      <div className="text-center space-y-2">
        <p className="text-base">Test Results</p>
        <p className="text-xs">SSE streaming panel — Task 2.3</p>
      </div>
    </div>
  );
}

function StatusBarPlaceholder() {
  return (
    <span className="text-white/70">
      Ready — Wishlist Tester v1.0
    </span>
  );
}
