import { useState, useCallback, useRef, useEffect } from 'react';
import { Clock, Globe } from 'lucide-react';
import { Toolbar } from './components/Toolbar/Toolbar';
import { JsonEditor } from './components/Editor/JsonEditor';
import { ResultsPanel } from './components/Results/ResultsPanel';
import { HistoryPanel } from './components/History/HistoryPanel';
import type { HistoryEntry } from './components/History/HistoryPanel';
import { UrlPreview } from './components/Preview/UrlPreview';
import { useTestRun } from './hooks/useTestRun';
import { fetchSuiteList, loadSuite, saveSuite } from './services/api';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MIN_PANEL_WIDTH_PX = 200;
const DEFAULT_SPLIT_PERCENT = 50;

const DEFAULT_EDITOR_VALUE = JSON.stringify(
  {
    name: 'My Test Suite',
    baseUrl: 'https://myshop.myshopify.com',
    tests: [],
  },
  null,
  2,
);

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

/**
 * Root application layout.
 *
 * Structure:
 *   +-------------------------------------------+
 *   | [Toolbar: URL, Run, Abort, Save, Load]    |
 *   +-------------------+-----------------------+
 *   |                   |                       |
 *   |  JSON Editor      |   Test Results        |
 *   |  (left panel)     |   (right panel)       |
 *   |                   |                       |
 *   +-------------------+-----------------------+
 *   | [Status bar: progress, history, preview]  |
 *   +-------------------------------------------+
 */
export function App() {
  // ---- Split panel state ----
  const [splitPercent, setSplitPercent] = useState(DEFAULT_SPLIT_PERCENT);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  // ---- Application state ----
  const [editorValue, setEditorValue] = useState(DEFAULT_EDITOR_VALUE);
  const [targetUrl, setTargetUrl] = useState('');
  const [suiteFiles, setSuiteFiles] = useState<string[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // ---- Test run state (from hook) ----
  const {
    results,
    summary,
    isRunning,
    progress,
    error,
    startRun,
    abortRun,
    history,
    clearHistory,
  } = useTestRun();

  // ---- Load suite list on mount ----
  useEffect(() => {
    fetchSuiteList()
      .then(setSuiteFiles)
      .catch(() => {
        // Suite list unavailable — non-critical, user can still type JSON
      });
  }, []);

  // ---- Refresh suite list after save ----
  const handleSave = useCallback(async (filename: string) => {
    try {
      await saveSuite(filename, editorValue);
      const updatedList = await fetchSuiteList();
      setSuiteFiles(updatedList);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save suite';
      console.error('[App] Save failed:', message);
    }
  }, [editorValue]);

  const handleLoad = useCallback(async (filename: string) => {
    try {
      const content = await loadSuite(filename);
      setEditorValue(content);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load suite';
      console.error('[App] Load failed:', message);
    }
  }, []);

  const handleRun = useCallback(() => {
    startRun(editorValue);
  }, [editorValue, startRun]);

  const handleSelectHistoryRun = useCallback((entry: HistoryEntry) => {
    // When user selects a history run, show its results in the panel
    // (This is informational — the results are displayed inside HistoryPanel itself)
  }, []);

  const toggleHistory = useCallback(() => {
    setIsHistoryOpen((prev) => !prev);
  }, []);

  const togglePreview = useCallback(() => {
    setIsPreviewOpen((prev) => !prev);
  }, []);

  // ---- Resizable divider ----
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
      const clampedPercent = Math.min(
        Math.max((offsetX / containerWidth) * 100, minPercent),
        maxPercent,
      );

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

  // ---- Status bar text ----
  const statusText = isRunning
    ? `Running... ${progress ? `${progress.current}/${progress.total}` : ''}`
    : error
      ? `Error: ${error}`
      : summary
        ? `Done: ${summary.passed}/${summary.total} passed in ${(summary.duration / 1000).toFixed(1)}s`
        : 'Ready';

  return (
    <div className="flex flex-col h-full bg-surface text-text-primary overflow-hidden">
      {/* Toolbar */}
      <header className="flex-none flex items-center gap-2 px-3 py-2 bg-surface-raised border-b border-border h-12">
        <Toolbar
          targetUrl={targetUrl}
          onTargetUrlChange={setTargetUrl}
          onRun={handleRun}
          onAbort={abortRun}
          isRunning={isRunning}
          onSave={handleSave}
          onLoad={handleLoad}
          suiteFiles={suiteFiles}
        />
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
          <JsonEditor
            value={editorValue}
            onChange={setEditorValue}
            placeholder="Paste or write your test suite JSON here..."
          />
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
          <ResultsPanel
            results={results}
            summary={summary}
            isRunning={isRunning}
            progress={progress ?? undefined}
          />
        </section>

        {/* URL Preview panel (right side, conditionally rendered) */}
        {isPreviewOpen && (
          <UrlPreview
            url={targetUrl}
            isOpen={isPreviewOpen}
            onToggle={togglePreview}
          />
        )}
      </main>

      {/* Status bar */}
      <footer className="flex-none flex items-center gap-4 px-3 py-1 bg-brand text-white text-xs font-mono h-6 select-none">
        <span className="text-white/90 flex-1 truncate">
          {statusText}
        </span>

        {/* History toggle */}
        <button
          type="button"
          onClick={toggleHistory}
          className="flex items-center gap-1 text-white/70 hover:text-white transition-colors"
          aria-label="Toggle history panel"
          title="Test run history"
        >
          <Clock size={12} />
          <span>History{history.length > 0 ? ` (${history.length})` : ''}</span>
        </button>

        {/* Preview toggle */}
        <button
          type="button"
          onClick={togglePreview}
          className="flex items-center gap-1 text-white/70 hover:text-white transition-colors"
          aria-label="Toggle URL preview"
          title="URL preview"
        >
          <Globe size={12} />
          <span>Preview</span>
        </button>
      </footer>

      {/* Overlay panels */}
      <HistoryPanel
        entries={history}
        isOpen={isHistoryOpen}
        onClose={toggleHistory}
        onSelectRun={handleSelectHistoryRun}
        onClearHistory={clearHistory}
      />
    </div>
  );
}
