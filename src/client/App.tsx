import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  Play,
  Square,
  Save,
  FolderOpen,
  Clock,
  ChevronDown,
  ChevronUp,
  Lock,
} from 'lucide-react';
import type { Node, Edge } from '@xyflow/react';

import { FlowBuilder, flowToJson, jsonToFlow, isFlowValid } from './components/FlowBuilder';
import type { BlockNodeData } from './components/FlowBuilder';
import { ResultsPanel } from './components/Results';
import { HistoryPanel } from './components/History';
import type { HistoryEntry } from './components/History';
import { useTestRun } from './hooks';
import { fetchSuiteList, loadSuite, saveSuite } from './services/api';
import { ThemePreview } from './components/ThemePreview';
import type { TestSuite } from '../core/types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_SUITE_NAME = 'Visual Flow Test';

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

/**
 * Root application layout — 3-panel visual flow builder.
 *
 * Structure:
 *   +--------------------------------------------------------------+
 *   | Toolbar: [URL] [Password] [Load] | [Run] [Abort] [Save] ... |
 *   +-------------------------------+-----------------------------+
 *   |  Theme Preview (60%)          |  Flow Builder (40%)         |
 *   +-------------------------------+-----------------------------+
 *   | Results Panel (collapsible bottom)                          |
 *   +--------------------------------------------------------------+
 *   | Status bar                                                   |
 *   +--------------------------------------------------------------+
 */
export function App() {
  // ---- Theme preview state ----
  const [themeUrl, setThemeUrl] = useState('');
  const [themePassword, setThemePassword] = useState('');

  // ---- Flow builder state ----
  const [flowNodes, setFlowNodes] = useState<Node<BlockNodeData>[]>([]);
  const [flowEdges, setFlowEdges] = useState<Edge[]>([]);

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

  // ---- Suite management ----
  const [suiteFiles, setSuiteFiles] = useState<string[]>([]);

  // ---- UI state ----
  const [isResultsOpen, setIsResultsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [highlightSelector, setHighlightSelector] = useState<string | null>(null);
  const [flowBuilderKey, setFlowBuilderKey] = useState(0);
  const [themePreviewKey, setThemePreviewKey] = useState(0);

  // ---- Load suite list on mount ----
  useEffect(() => {
    fetchSuiteList()
      .then(setSuiteFiles)
      .catch(() => {
        // Suite list unavailable — non-critical
      });
  }, []);

  // ---- Open results panel when tests start running ----
  useEffect(() => {
    if (isRunning) {
      setIsResultsOpen(true);
    }
  }, [isRunning]);

  // ---- Highlight current selector during run ----
  useEffect(() => {
    if (!isRunning || results.length === 0) {
      if (!isRunning) setHighlightSelector(null);
      return;
    }

    // Extract the selector from the latest result's last step
    const latestResult = results[results.length - 1];
    // The test name often doesn't contain the selector, but during execution
    // we can derive it from the flow nodes matching the current progress index
    if (progress && progress.current > 0) {
      const currentNodeIndex = progress.current - 1;
      const node = flowNodes[currentNodeIndex];
      if (node?.data?.selector) {
        setHighlightSelector(node.data.selector as string);
      } else {
        setHighlightSelector(null);
      }
    }
  }, [results, isRunning, progress, flowNodes]);

  // ---- Clear highlight when test completes ----
  useEffect(() => {
    if (!isRunning && summary) {
      setHighlightSelector(null);
    }
  }, [isRunning, summary]);

  // ---- Flow change handler ----
  const handleFlowChange = useCallback(
    (nodes: Node<BlockNodeData>[], edges: Edge[]) => {
      setFlowNodes(nodes);
      setFlowEdges(edges);
    },
    [],
  );

  // ---- Run: convert flow to JSON and start ----
  const handleRun = useCallback(() => {
    if (!isFlowValid(flowNodes)) {
      return;
    }

    const suite = flowToJson(flowNodes, flowEdges, {
      baseUrl: themeUrl || undefined,
      suiteName: DEFAULT_SUITE_NAME,
    });

    startRun(JSON.stringify(suite));
    setIsResultsOpen(true);
  }, [flowNodes, flowEdges, themeUrl, startRun]);

  // ---- Save: convert flow to JSON and persist ----
  const handleSave = useCallback(async () => {
    if (!isFlowValid(flowNodes)) return;

    const suite = flowToJson(flowNodes, flowEdges, {
      baseUrl: themeUrl || undefined,
      suiteName: DEFAULT_SUITE_NAME,
    });

    const filename = prompt('Save suite as:', `${DEFAULT_SUITE_NAME}.json`);
    if (!filename) return;

    try {
      await saveSuite(filename, JSON.stringify(suite));
      const updatedList = await fetchSuiteList();
      setSuiteFiles(updatedList);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save suite';
      console.error('[App] Save failed:', message);
    }
  }, [flowNodes, flowEdges, themeUrl]);

  // ---- Load Suite: pick a file, parse JSON, convert to flow ----
  const handleLoadSuite = useCallback(async () => {
    if (suiteFiles.length === 0) {
      console.warn('[App] No suite files available');
      return;
    }

    const filename = prompt(
      `Load suite (available: ${suiteFiles.join(', ')}):`,
      suiteFiles[0],
    );
    if (!filename) return;

    try {
      const content = await loadSuite(filename);
      const suite: TestSuite = JSON.parse(content);
      const { nodes, edges } = jsonToFlow(suite);
      setFlowNodes(nodes);
      setFlowEdges(edges);
      setFlowBuilderKey((k) => k + 1); // Force remount to pick up new nodes/edges

      // Set the base URL from the loaded suite if available
      if (suite.baseUrl) {
        setThemeUrl(suite.baseUrl);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load suite';
      console.error('[App] Load failed:', message);
    }
  }, [suiteFiles]);

  // ---- Load theme URL into preview (force remount iframe) ----
  const handleLoadTheme = useCallback(() => {
    setThemePreviewKey((k) => k + 1);
  }, []);

  // ---- History toggle ----
  const toggleHistory = useCallback(() => {
    setIsHistoryOpen((prev) => !prev);
  }, []);

  // ---- Results toggle ----
  const toggleResults = useCallback(() => {
    setIsResultsOpen((prev) => !prev);
  }, []);

  // ---- History run selection (load into results view) ----
  const handleSelectHistoryRun = useCallback((_entry: HistoryEntry) => {
    // History panel handles its own detail display
  }, []);

  // ---- Status bar text ----
  const statusText = useMemo(() => {
    if (isRunning) {
      return `Running... ${progress ? `${progress.current}/${progress.total}` : ''}`;
    }
    if (error) return `Error: ${error}`;
    if (summary) {
      return `Done: ${summary.passed}/${summary.total} passed in ${(summary.duration / 1000).toFixed(1)}s`;
    }
    return 'Ready';
  }, [isRunning, progress, error, summary]);

  const hasResults = results.length > 0 || isRunning || summary !== null;

  return (
    <div className="flex flex-col h-full bg-surface text-text-primary overflow-hidden">
      {/* ================================================================
          Toolbar
          ================================================================ */}
      <header className="flex-none flex items-center gap-2 px-3 py-2 bg-surface-raised border-b border-border h-12">
        {/* Left group: Theme URL + Password + Load */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <input
            type="url"
            value={themeUrl}
            onChange={(e) => setThemeUrl(e.target.value)}
            placeholder="Theme URL (e.g. https://myshop.myshopify.com)"
            aria-label="Theme URL"
            className="flex-1 min-w-[200px] max-w-[400px] px-3 py-1.5 text-sm bg-surface border border-border rounded text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-brand"
          />

          <div className="relative">
            <Lock
              size={12}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
            />
            <input
              type="password"
              value={themePassword}
              onChange={(e) => setThemePassword(e.target.value)}
              placeholder="Password"
              aria-label="Theme password"
              className="w-[120px] pl-7 pr-3 py-1.5 text-sm bg-surface border border-border rounded text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-brand"
            />
          </div>

          <button
            type="button"
            onClick={handleLoadTheme}
            className="px-3 py-1.5 text-sm bg-surface-overlay border border-border rounded hover:bg-surface-raised transition-colors text-text-secondary"
            title="Load theme preview"
          >
            Load
          </button>
        </div>

        {/* Divider */}
        <div className="w-px h-6 bg-border" />

        {/* Right group: Run, Abort, Save, Load Suite, History */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            type="button"
            onClick={handleRun}
            disabled={isRunning || !isFlowValid(flowNodes)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium bg-brand text-white rounded hover:bg-brand/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Run test suite"
          >
            <Play size={14} />
            Run
          </button>

          <button
            type="button"
            onClick={abortRun}
            disabled={!isRunning}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-red-600 text-white rounded hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            title="Abort test run"
          >
            <Square size={14} />
            Abort
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={!isFlowValid(flowNodes)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-surface-overlay border border-border rounded hover:bg-surface-raised disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-text-secondary"
            title="Save suite to file"
          >
            <Save size={14} />
            Save
          </button>

          <button
            type="button"
            onClick={handleLoadSuite}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-surface-overlay border border-border rounded hover:bg-surface-raised transition-colors text-text-secondary"
            title="Load suite from file"
          >
            <FolderOpen size={14} />
            Load Suite
          </button>

          <button
            type="button"
            onClick={toggleHistory}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-surface-overlay border border-border rounded hover:bg-surface-raised transition-colors text-text-secondary"
            title="Test run history"
          >
            <Clock size={14} />
            History
            {history.length > 0 && (
              <span className="ml-0.5 text-xs bg-brand/20 text-brand px-1.5 py-0.5 rounded-full font-mono">
                {history.length}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* ================================================================
          Main content: Theme Preview (60%) | Flow Builder (40%)
          ================================================================ */}
      <main className="flex flex-1 overflow-hidden min-h-0">
        {/* Left panel: Theme Preview */}
        <section
          className="flex flex-col overflow-hidden"
          style={{ width: '60%' }}
          aria-label="Theme Preview"
        >
          <div className="panel-header">
            <span>Theme Preview</span>
          </div>
          <div className="flex-1 overflow-hidden">
            <ThemePreview
              key={themePreviewKey}
              url={themeUrl}
              password={themePassword || undefined}
              highlightSelector={highlightSelector}
            />
          </div>
        </section>

        {/* Divider between preview and flow builder */}
        <div className="flex-none w-px bg-border" />

        {/* Right panel: Flow Builder */}
        <section
          className="flex flex-col flex-1 overflow-hidden min-w-0"
          aria-label="Flow Builder"
        >
          <div className="panel-header">
            <span>Flow Builder</span>
          </div>
          <div className="flex-1 overflow-hidden">
            <FlowBuilder
              key={flowBuilderKey}
              onFlowChange={handleFlowChange}
              initialNodes={flowNodes}
              initialEdges={flowEdges}
            />
          </div>
        </section>
      </main>

      {/* ================================================================
          Results Panel (collapsible bottom)
          ================================================================ */}
      {hasResults && (
        <section
          className={`flex-none border-t border-border bg-surface transition-all duration-200 ${
            isResultsOpen ? 'h-[280px]' : 'h-8'
          }`}
          aria-label="Test Results"
        >
          {/* Collapse/Expand toggle bar */}
          <button
            type="button"
            onClick={toggleResults}
            className="w-full flex items-center justify-between px-3 py-1 bg-surface-raised border-b border-border text-xs text-text-secondary hover:text-text-primary transition-colors h-8"
            aria-label={isResultsOpen ? 'Collapse results panel' : 'Expand results panel'}
          >
            <span className="font-medium">
              Results
              {summary && !isRunning && (
                <span className="ml-2 font-mono text-text-muted">
                  {summary.passed}/{summary.total} passed
                </span>
              )}
              {isRunning && progress && (
                <span className="ml-2 font-mono text-text-muted">
                  Running {progress.current}/{progress.total}
                </span>
              )}
            </span>
            {isResultsOpen ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>

          {/* Results content */}
          {isResultsOpen && (
            <div className="overflow-hidden" style={{ height: 'calc(100% - 32px)' }}>
              <ResultsPanel
                results={results}
                summary={summary}
                isRunning={isRunning}
                progress={progress ?? undefined}
              />
            </div>
          )}
        </section>
      )}

      {/* ================================================================
          Status bar
          ================================================================ */}
      <footer className="flex-none flex items-center gap-4 px-3 py-1 bg-brand text-white text-xs font-mono h-6 select-none">
        <span className="text-white/90 flex-1 truncate">{statusText}</span>
      </footer>

      {/* ================================================================
          Overlay panels
          ================================================================ */}
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
