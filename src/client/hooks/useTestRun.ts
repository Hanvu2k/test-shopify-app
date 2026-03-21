import { useState, useCallback, useRef } from 'react';
import type { TestResult, RunSummary, TestEvent } from '../../../core/types';
import type { HistoryEntry } from '../components/History/HistoryPanel';
import { useSSE } from './useSSE';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const RUN_ENDPOINT = '/api/run';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type RunStatus = 'idle' | 'running' | 'complete' | 'error';

interface RunProgress {
  current: number;
  total: number;
}

export interface UseTestRunReturn {
  results: TestResult[];
  summary: RunSummary | null;
  isRunning: boolean;
  progress: RunProgress | null;
  error: string | null;
  startRun: (suiteJson: string) => void;
  abortRun: () => void;
  history: HistoryEntry[];
  clearHistory: () => void;
}

// ---------------------------------------------------------------------------
// ID generator for history entries
// ---------------------------------------------------------------------------

function generateRunId(): string {
  return `run-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ---------------------------------------------------------------------------
// useTestRun hook
// ---------------------------------------------------------------------------

/**
 * Manages the complete lifecycle of a test run:
 *   idle → running → complete
 *
 * Streams results via useSSE and accumulates them.
 * Completed runs are added to an in-memory history list.
 */
export function useTestRun(): UseTestRunReturn {
  const [status, setStatus] = useState<RunStatus>('idle');
  const [results, setResults] = useState<TestResult[]>([]);
  const [summary, setSummary] = useState<RunSummary | null>(null);
  const [progress, setProgress] = useState<RunProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  // Track the current run's start time for history entry creation
  const runStartTimeRef = useRef<Date | null>(null);
  const accumulatedResultsRef = useRef<TestResult[]>([]);

  const handleTestEvent = useCallback((event: TestEvent) => {
    switch (event.type) {
      case 'test:start': {
        setProgress({ current: event.index, total: event.total });
        break;
      }

      case 'test:result': {
        setProgress({ current: event.index + 1, total: event.total });
        setResults((prev) => {
          const updated = [...prev, event.result];
          accumulatedResultsRef.current = updated;
          return updated;
        });
        break;
      }

      case 'suite:complete': {
        setSummary(event.summary);
        setStatus('complete');
        setProgress(null);

        // Add to history
        const entry: HistoryEntry = {
          id: generateRunId(),
          timestamp: runStartTimeRef.current ?? new Date(),
          suiteName: event.summary.suiteName,
          total: event.summary.total,
          passed: event.summary.passed,
          failed: event.summary.failed,
          duration: event.summary.duration,
          results: event.summary.results,
        };

        setHistory((prev) => [entry, ...prev]);
        runStartTimeRef.current = null;
        break;
      }

      case 'suite:error': {
        setError(event.error);
        setStatus('error');
        setProgress(null);
        runStartTimeRef.current = null;
        break;
      }
    }
  }, []);

  const handleSSEError = useCallback((err: Error) => {
    setError(err.message);
    setStatus('error');
    setProgress(null);
  }, []);

  const { connect, disconnect, isConnected } = useSSE(handleTestEvent, handleSSEError);

  const startRun = useCallback((suiteJson: string) => {
    let parsedSuite: unknown;

    try {
      parsedSuite = JSON.parse(suiteJson);
    } catch {
      setError('Invalid JSON: unable to parse test suite');
      setStatus('error');
      return;
    }

    // Reset state for new run
    setResults([]);
    setSummary(null);
    setProgress(null);
    setError(null);
    setStatus('running');
    accumulatedResultsRef.current = [];
    runStartTimeRef.current = new Date();

    connect(RUN_ENDPOINT, parsedSuite);
  }, [connect]);

  const abortRun = useCallback(() => {
    disconnect();
    setStatus('idle');
    setProgress(null);
  }, [disconnect]);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  return {
    results,
    summary,
    isRunning: status === 'running' || isConnected,
    progress,
    error,
    startRun,
    abortRun,
    history,
    clearHistory,
  };
}
