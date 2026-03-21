import { useEffect, useRef } from 'react';
import { TestResult, RunSummary } from '../../../../core/types';
import { TestResultCard } from './TestResultCard';
import { SummaryBar } from './SummaryBar';

interface ResultsPanelProps {
  results: TestResult[];
  summary: RunSummary | null;
  isRunning: boolean;
  progress?: { current: number; total: number };
}

function EmptyState() {
  return (
    <div className="flex flex-1 items-center justify-center text-text-muted select-none">
      <div className="text-center space-y-2 px-6">
        <div className="text-2xl" aria-hidden="true">📋</div>
        <p className="text-sm text-text-secondary">No results yet</p>
        <p className="text-xs">
          Write or load a test suite, then click{' '}
          <span className="text-brand font-semibold">Run</span>.
        </p>
      </div>
    </div>
  );
}

function ProgressBar({ current, total }: { current: number; total: number }) {
  const percent = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className="px-3 py-1.5 bg-surface-raised border-b border-border space-y-1">
      <div className="flex items-center justify-between text-xs font-mono text-text-secondary">
        <span className="flex items-center gap-1.5">
          {/* Spinner */}
          <svg
            className="animate-spin"
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            aria-hidden="true"
          >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
          <span>Running...</span>
        </span>
        <span className="text-text-muted">
          {current} / {total}
        </span>
      </div>

      {/* Progress bar track */}
      <div
        className="w-full h-1 rounded-full bg-surface-overlay overflow-hidden"
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label={`Running test ${current} of ${total}`}
      >
        <div
          className="h-full bg-brand rounded-full transition-all duration-300 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

export function ResultsPanel({ results, summary, isRunning, progress }: ResultsPanelProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest result as they stream in
  useEffect(() => {
    if (isRunning && endRef.current) {
      endRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [results.length, isRunning]);

  const isEmpty = results.length === 0 && !isRunning;

  return (
    <div className="flex flex-col flex-1 overflow-hidden min-h-0">
      {/* Progress bar — shown while running */}
      {isRunning && progress && (
        <ProgressBar current={progress.current} total={progress.total} />
      )}

      {/* Results list */}
      <div
        ref={scrollRef}
        className="flex flex-col flex-1 overflow-y-auto"
        aria-live="polite"
        aria-label="Test results"
        aria-atomic="false"
        aria-relevant="additions"
      >
        {isEmpty ? (
          <EmptyState />
        ) : (
          <>
            <div className="flex flex-col">
              {results.map((result, index) => (
                <TestResultCard
                  key={`${result.name}-${index}`}
                  result={result}
                />
              ))}
            </div>
            {/* Sentinel element for auto-scroll */}
            <div ref={endRef} aria-hidden="true" />
          </>
        )}
      </div>

      {/* Summary bar — shown when run is complete */}
      {summary && !isRunning && (
        <SummaryBar summary={summary} />
      )}
    </div>
  );
}
