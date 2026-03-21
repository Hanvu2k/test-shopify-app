import { memo, useState, useCallback, useRef, useEffect } from 'react';
import { Clock, X, CheckCircle, XCircle, ChevronLeft, Search } from 'lucide-react';
import type { TestResult } from '../../../../core/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface HistoryEntry {
  id: string;
  timestamp: Date;
  suiteName: string;
  total: number;
  passed: number;
  failed: number;
  duration: number;
  results: TestResult[];
}

interface HistoryPanelProps {
  entries: HistoryEntry[];
  onSelectRun: (entry: HistoryEntry) => void;
  onClearHistory: () => void;
  isOpen: boolean;
  onClose: () => void;
}

// ---------------------------------------------------------------------------
// Date grouping utilities
// ---------------------------------------------------------------------------

function getDateLabel(date: Date): string {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const entryDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

  if (entryDay.getTime() === today.getTime()) return 'Today';
  if (entryDay.getTime() === yesterday.getTime()) return 'Yesterday';
  return entryDay.toISOString().slice(0, 10);
}

function groupEntriesByDate(entries: HistoryEntry[]): Array<{ label: string; items: HistoryEntry[] }> {
  const groups = new Map<string, HistoryEntry[]>();

  for (const entry of entries) {
    const label = getDateLabel(entry.timestamp);
    const existing = groups.get(label);
    if (existing) {
      existing.push(entry);
    } else {
      groups.set(label, [entry]);
    }
  }

  return Array.from(groups.entries()).map(([label, items]) => ({ label, items }));
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

// ---------------------------------------------------------------------------
// Run detail view
// ---------------------------------------------------------------------------

interface RunDetailViewProps {
  entry: HistoryEntry;
  onBack: () => void;
}

const RunDetailView = memo(({ entry, onBack }: RunDetailViewProps) => {
  const allPassed = entry.failed === 0;

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <button
        onClick={onBack}
        className="flex items-center gap-1 px-4 py-2 text-sm text-text-muted hover:text-text-primary transition-colors"
        aria-label="Back to history list"
      >
        <ChevronLeft size={16} />
        Back to list
      </button>

      <div className="px-4 pb-3 border-b border-border">
        <h3 className="font-semibold text-text-primary truncate">{entry.suiteName}</h3>
        <div className="flex items-center gap-2 mt-1 text-xs text-text-muted">
          {allPassed ? (
            <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
          ) : (
            <XCircle size={14} className="text-red-500 flex-shrink-0" />
          )}
          <span>
            {entry.timestamp.toLocaleDateString()} at {formatTime(entry.timestamp)}
          </span>
          <span>|</span>
          <span>
            {entry.passed}/{entry.total} passed
          </span>
          <span>|</span>
          <span>{formatDuration(entry.duration)}</span>
        </div>
      </div>

      <ul className="flex-1 overflow-y-auto px-4 py-2 space-y-1" role="list" aria-label="Test results">
        {entry.results.map((result, index) => {
          const isPassed = result.status === 'pass';
          return (
            <li
              key={`${result.name}-${index}`}
              className="flex items-center gap-3 py-2 border-b border-border/50 text-sm"
            >
              {isPassed ? (
                <CheckCircle size={14} className="text-green-500 flex-shrink-0" />
              ) : (
                <XCircle size={14} className="text-red-500 flex-shrink-0" />
              )}
              <span className="flex-1 truncate text-text-primary">{result.name}</span>
              <span className="text-xs text-text-muted bg-surface-raised px-1.5 py-0.5 rounded font-mono">
                {result.type}
              </span>
              <span className="text-xs text-text-muted font-mono">{formatDuration(result.duration)}</span>
            </li>
          );
        })}
      </ul>

      <div className="px-4 py-3 border-t border-border text-xs text-text-muted">
        Summary: {entry.total} tests | {entry.passed} passed | {entry.failed} failed | {formatDuration(entry.duration)}
      </div>
    </div>
  );
});

RunDetailView.displayName = 'RunDetailView';

// ---------------------------------------------------------------------------
// History row
// ---------------------------------------------------------------------------

interface HistoryRowProps {
  entry: HistoryEntry;
  onClick: () => void;
}

const HistoryRow = memo(({ entry, onClick }: HistoryRowProps) => {
  const allPassed = entry.failed === 0;

  return (
    <li>
      <button
        onClick={onClick}
        className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-surface-raised transition-colors rounded"
        aria-label={`View run: ${entry.suiteName} at ${formatTime(entry.timestamp)}, ${entry.passed}/${entry.total} passed`}
      >
        {allPassed ? (
          <CheckCircle size={16} className="text-green-500 flex-shrink-0" />
        ) : (
          <XCircle size={16} className="text-red-500 flex-shrink-0" />
        )}
        <span className="flex-1 truncate text-sm text-text-primary max-w-[160px]">
          {entry.suiteName}
        </span>
        <span className="text-xs text-text-muted font-mono">
          {entry.passed}/{entry.total}
        </span>
        <span className="text-xs text-text-muted font-mono">
          {formatTime(entry.timestamp)}
        </span>
      </button>
    </li>
  );
});

HistoryRow.displayName = 'HistoryRow';

// ---------------------------------------------------------------------------
// Main HistoryPanel
// ---------------------------------------------------------------------------

export const HistoryPanel = memo(({
  entries,
  onSelectRun,
  onClearHistory,
  isOpen,
  onClose,
}: HistoryPanelProps) => {
  const [filterQuery, setFilterQuery] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<HistoryEntry | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const filterInputRef = useRef<HTMLInputElement>(null);

  // Reset to list when panel closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedEntry(null);
      setFilterQuery('');
    }
  }, [isOpen]);

  // Focus filter input when panel opens
  useEffect(() => {
    if (isOpen && filterInputRef.current) {
      filterInputRef.current.focus();
    }
  }, [isOpen]);

  // Trap focus and handle Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleRowClick = useCallback((entry: HistoryEntry) => {
    setSelectedEntry(entry);
    onSelectRun(entry);
  }, [onSelectRun]);

  const handleBackToList = useCallback(() => {
    setSelectedEntry(null);
  }, []);

  const handleOverlayClick = useCallback((event: React.MouseEvent) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  }, [onClose]);

  if (!isOpen) return null;

  const filteredEntries = filterQuery.trim()
    ? entries.filter((e) => e.suiteName.toLowerCase().includes(filterQuery.toLowerCase()))
    : entries;

  const groupedEntries = groupEntriesByDate(filteredEntries);

  return (
    // Overlay backdrop
    <div
      className="fixed inset-0 z-50 flex justify-end"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
      onClick={handleOverlayClick}
      aria-hidden="false"
    >
      {/* Panel */}
      <div
        ref={panelRef}
        role="dialog"
        aria-label="Test run history"
        aria-modal="true"
        className="flex flex-col w-[420px] max-w-full h-full bg-surface border-l border-border shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-brand" />
            <h2 className="font-semibold text-text-primary">Test Run History</h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Close history panel"
            className="p-1 rounded hover:bg-surface-raised transition-colors text-text-muted hover:text-text-primary"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        {selectedEntry ? (
          <RunDetailView entry={selectedEntry} onBack={handleBackToList} />
        ) : (
          <div className="flex flex-col flex-1 min-h-0">
            {/* Filter input */}
            <div className="px-4 py-3 border-b border-border flex-shrink-0">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
                <input
                  ref={filterInputRef}
                  type="text"
                  value={filterQuery}
                  onChange={(e) => setFilterQuery(e.target.value)}
                  placeholder="Filter runs..."
                  aria-label="Filter test runs by name"
                  className="w-full pl-9 pr-4 py-1.5 text-sm bg-surface-raised border border-border rounded text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-brand"
                />
                {filterQuery && (
                  <button
                    onClick={() => setFilterQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary"
                    aria-label="Clear filter"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* Empty state */}
            {entries.length === 0 ? (
              <div className="flex flex-1 items-center justify-center px-6">
                <div className="text-center p-8 rounded-lg border border-border">
                  <Clock size={32} className="mx-auto mb-3 text-text-muted opacity-50" />
                  <p className="text-sm font-medium text-text-muted">No runs yet</p>
                  <p className="text-xs text-text-muted mt-1 opacity-75">
                    Run a test suite and your history will appear here.
                  </p>
                </div>
              </div>
            ) : filteredEntries.length === 0 ? (
              <div className="flex flex-1 items-center justify-center px-6">
                <p className="text-sm text-text-muted">No runs match "{filterQuery}"</p>
              </div>
            ) : (
              /* Grouped run list */
              <ul className="flex-1 overflow-y-auto py-2" role="list" aria-label="Test run history list">
                {groupedEntries.map(({ label, items }) => (
                  <li key={label}>
                    <div className="px-4 py-2">
                      <p className="text-xs font-semibold text-text-muted uppercase tracking-wide">{label}</p>
                      <hr className="mt-1 border-border" />
                    </div>
                    <ul role="list">
                      {items.map((entry) => (
                        <HistoryRow
                          key={entry.id}
                          entry={entry}
                          onClick={() => handleRowClick(entry)}
                        />
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            )}

            {/* Footer actions */}
            {entries.length > 0 && (
              <div className="px-4 py-3 border-t border-border flex-shrink-0">
                <button
                  onClick={onClearHistory}
                  className="text-xs text-red-400 hover:text-red-300 transition-colors"
                  aria-label="Clear all history"
                >
                  Clear History
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

HistoryPanel.displayName = 'HistoryPanel';
