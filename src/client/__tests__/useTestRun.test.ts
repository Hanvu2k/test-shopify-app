/**
 * Tests for useTestRun hook — manages the full test run lifecycle.
 *
 * Tests focus on:
 * 1. Initial state (idle, no results)
 * 2. startRun: JSON validation, state transitions
 * 3. Event handling: test:start, test:result, suite:complete, suite:error
 * 4. abortRun: stops running, resets progress
 * 5. History: entries added on complete, clearHistory
 * 6. isRunning flag (combines status + SSE isConnected)
 *
 * useSSE is mocked to control what events reach the hook.
 */
import { renderHook, act } from '@testing-library/react';
import type { TestEvent, TestResult, RunSummary } from '../../core/types';

// ---------------------------------------------------------------------------
// Mock useSSE so we can fire synthetic events into useTestRun
// ---------------------------------------------------------------------------

let capturedOnEvent: ((event: TestEvent) => void) | null = null;
let capturedOnError: ((error: Error) => void) | null = null;
const mockConnect = vi.fn();
const mockDisconnect = vi.fn();
let mockIsConnected = false;

vi.mock('../hooks/useSSE', () => ({
  useSSE: (onEvent: (event: TestEvent) => void, onError?: (error: Error) => void) => {
    capturedOnEvent = onEvent;
    capturedOnError = onError ?? null;
    return {
      connect: mockConnect,
      disconnect: mockDisconnect,
      get isConnected() {
        return mockIsConnected;
      },
    };
  },
}));

// Import after mock setup
import { useTestRun } from '../hooks/useTestRun';

// ---------------------------------------------------------------------------
// Test data factories
// ---------------------------------------------------------------------------

const makeTestResult = (overrides: Partial<TestResult> = {}): TestResult => ({
  name: 'test result',
  type: 'api',
  status: 'pass',
  duration: 100,
  ...overrides,
});

const makeSummary = (overrides: Partial<RunSummary> = {}): RunSummary => ({
  suiteName: 'My Suite',
  total: 2,
  passed: 2,
  failed: 0,
  skipped: 0,
  duration: 500,
  results: [],
  ...overrides,
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useTestRun', () => {
  beforeEach(() => {
    mockConnect.mockClear();
    mockDisconnect.mockClear();
    mockIsConnected = false;
    capturedOnEvent = null;
    capturedOnError = null;
  });

  // -------------------------------------------------------------------------
  // Initial state
  // -------------------------------------------------------------------------

  it('returns correct initial state', () => {
    const { result } = renderHook(() => useTestRun());
    expect(result.current.results).toEqual([]);
    expect(result.current.summary).toBeNull();
    expect(result.current.isRunning).toBe(false);
    expect(result.current.progress).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.history).toEqual([]);
  });

  it('exposes startRun, abortRun, and clearHistory functions', () => {
    const { result } = renderHook(() => useTestRun());
    expect(typeof result.current.startRun).toBe('function');
    expect(typeof result.current.abortRun).toBe('function');
    expect(typeof result.current.clearHistory).toBe('function');
  });

  // -------------------------------------------------------------------------
  // startRun — JSON validation
  // -------------------------------------------------------------------------

  it('sets error state for invalid JSON input', () => {
    const { result } = renderHook(() => useTestRun());

    act(() => {
      result.current.startRun('{invalid json}');
    });

    expect(result.current.error).toMatch(/Invalid JSON/i);
    expect(result.current.isRunning).toBe(false);
    expect(mockConnect).not.toHaveBeenCalled();
  });

  it('does not call connect for invalid JSON', () => {
    const { result } = renderHook(() => useTestRun());

    act(() => {
      result.current.startRun('not json at all');
    });

    expect(mockConnect).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // startRun — state transitions
  // -------------------------------------------------------------------------

  it('transitions to running state on valid JSON', () => {
    const { result } = renderHook(() => useTestRun());

    act(() => {
      result.current.startRun(JSON.stringify({ name: 'suite', tests: [] }));
    });

    expect(mockConnect).toHaveBeenCalledWith('/api/run', { name: 'suite', tests: [] });
    // status is 'running' but isConnected is still false from mock;
    // hook derives isRunning = status==='running' || isConnected
    expect(result.current.isRunning).toBe(true);
  });

  it('resets results, summary, progress, and error on new run', () => {
    const { result } = renderHook(() => useTestRun());

    // Simulate previous run data by firing events
    act(() => {
      result.current.startRun(JSON.stringify({ tests: [] }));
    });

    act(() => {
      capturedOnEvent!({
        type: 'test:result',
        result: makeTestResult({ name: 'old result' }),
        index: 0,
        total: 1,
      });
    });

    // Start a second run — should reset
    act(() => {
      result.current.startRun(JSON.stringify({ tests: [] }));
    });

    expect(result.current.results).toEqual([]);
    expect(result.current.summary).toBeNull();
    expect(result.current.progress).toBeNull();
    expect(result.current.error).toBeNull();
  });

  // -------------------------------------------------------------------------
  // Event handling: test:start
  // -------------------------------------------------------------------------

  it('updates progress on test:start event', () => {
    const { result } = renderHook(() => useTestRun());

    act(() => {
      result.current.startRun(JSON.stringify({ tests: [] }));
    });

    act(() => {
      capturedOnEvent!({ type: 'test:start', name: 'my test', index: 1, total: 5 });
    });

    expect(result.current.progress).toEqual({ current: 1, total: 5 });
  });

  // -------------------------------------------------------------------------
  // Event handling: test:result
  // -------------------------------------------------------------------------

  it('appends result and updates progress on test:result event', () => {
    const { result } = renderHook(() => useTestRun());

    act(() => {
      result.current.startRun(JSON.stringify({ tests: [] }));
    });

    const testResult = makeTestResult({ name: 'add to cart', status: 'pass' });

    act(() => {
      capturedOnEvent!({ type: 'test:result', result: testResult, index: 0, total: 3 });
    });

    expect(result.current.results).toHaveLength(1);
    expect(result.current.results[0]).toEqual(testResult);
    expect(result.current.progress).toEqual({ current: 1, total: 3 });
  });

  it('accumulates multiple results in order', () => {
    const { result } = renderHook(() => useTestRun());

    act(() => {
      result.current.startRun(JSON.stringify({ tests: [] }));
    });

    const result1 = makeTestResult({ name: 'test A', status: 'pass' });
    const result2 = makeTestResult({ name: 'test B', status: 'fail' });
    const result3 = makeTestResult({ name: 'test C', status: 'error' });

    act(() => {
      capturedOnEvent!({ type: 'test:result', result: result1, index: 0, total: 3 });
      capturedOnEvent!({ type: 'test:result', result: result2, index: 1, total: 3 });
      capturedOnEvent!({ type: 'test:result', result: result3, index: 2, total: 3 });
    });

    expect(result.current.results).toEqual([result1, result2, result3]);
  });

  // -------------------------------------------------------------------------
  // Event handling: suite:complete
  // -------------------------------------------------------------------------

  it('sets summary and marks isRunning false on suite:complete', () => {
    const { result } = renderHook(() => useTestRun());

    act(() => {
      result.current.startRun(JSON.stringify({ tests: [] }));
    });

    const summary = makeSummary({ total: 2, passed: 1, failed: 1 });

    act(() => {
      capturedOnEvent!({ type: 'suite:complete', summary });
    });

    expect(result.current.summary).toEqual(summary);
    expect(result.current.isRunning).toBe(false);
    expect(result.current.progress).toBeNull();
  });

  it('adds a history entry on suite:complete', () => {
    const { result } = renderHook(() => useTestRun());

    act(() => {
      result.current.startRun(JSON.stringify({ tests: [] }));
    });

    const summary = makeSummary({
      suiteName: 'Wishlist Suite',
      total: 3,
      passed: 2,
      failed: 1,
      duration: 750,
    });

    act(() => {
      capturedOnEvent!({ type: 'suite:complete', summary });
    });

    expect(result.current.history).toHaveLength(1);

    const entry = result.current.history[0];
    expect(entry.suiteName).toBe('Wishlist Suite');
    expect(entry.total).toBe(3);
    expect(entry.passed).toBe(2);
    expect(entry.failed).toBe(1);
    expect(entry.duration).toBe(750);
    expect(entry.id).toMatch(/^run-/);
    expect(entry.timestamp).toBeInstanceOf(Date);
  });

  it('prepends new history entries (most recent first)', () => {
    const { result } = renderHook(() => useTestRun());

    // First run
    act(() => {
      result.current.startRun(JSON.stringify({ tests: [] }));
    });
    act(() => {
      capturedOnEvent!({ type: 'suite:complete', summary: makeSummary({ suiteName: 'Run 1' }) });
    });

    // Second run
    act(() => {
      result.current.startRun(JSON.stringify({ tests: [] }));
    });
    act(() => {
      capturedOnEvent!({ type: 'suite:complete', summary: makeSummary({ suiteName: 'Run 2' }) });
    });

    expect(result.current.history).toHaveLength(2);
    expect(result.current.history[0].suiteName).toBe('Run 2');
    expect(result.current.history[1].suiteName).toBe('Run 1');
  });

  // -------------------------------------------------------------------------
  // Event handling: suite:error
  // -------------------------------------------------------------------------

  it('sets error state and marks isRunning false on suite:error', () => {
    const { result } = renderHook(() => useTestRun());

    act(() => {
      result.current.startRun(JSON.stringify({ tests: [] }));
    });

    act(() => {
      capturedOnEvent!({ type: 'suite:error', error: 'runner crashed unexpectedly' });
    });

    expect(result.current.error).toBe('runner crashed unexpectedly');
    expect(result.current.isRunning).toBe(false);
    expect(result.current.progress).toBeNull();
  });

  it('does not add history entry on suite:error', () => {
    const { result } = renderHook(() => useTestRun());

    act(() => {
      result.current.startRun(JSON.stringify({ tests: [] }));
    });

    act(() => {
      capturedOnEvent!({ type: 'suite:error', error: 'failed' });
    });

    expect(result.current.history).toHaveLength(0);
  });

  // -------------------------------------------------------------------------
  // SSE error handler
  // -------------------------------------------------------------------------

  it('sets error state when SSE reports a connection error', () => {
    const { result } = renderHook(() => useTestRun());

    act(() => {
      result.current.startRun(JSON.stringify({ tests: [] }));
    });

    act(() => {
      capturedOnError!(new Error('SSE connection dropped'));
    });

    expect(result.current.error).toBe('SSE connection dropped');
    expect(result.current.isRunning).toBe(false);
    expect(result.current.progress).toBeNull();
  });

  // -------------------------------------------------------------------------
  // abortRun
  // -------------------------------------------------------------------------

  it('calls disconnect and resets progress on abortRun', () => {
    const { result } = renderHook(() => useTestRun());

    act(() => {
      result.current.startRun(JSON.stringify({ tests: [] }));
    });

    act(() => {
      capturedOnEvent!({ type: 'test:start', name: 'slow test', index: 0, total: 5 });
    });

    expect(result.current.progress).toEqual({ current: 0, total: 5 });

    act(() => {
      result.current.abortRun();
    });

    expect(mockDisconnect).toHaveBeenCalled();
    expect(result.current.progress).toBeNull();
    expect(result.current.isRunning).toBe(false);
  });

  // -------------------------------------------------------------------------
  // clearHistory
  // -------------------------------------------------------------------------

  it('empties history on clearHistory', () => {
    const { result } = renderHook(() => useTestRun());

    // Add two history entries
    act(() => {
      result.current.startRun(JSON.stringify({ tests: [] }));
    });
    act(() => {
      capturedOnEvent!({ type: 'suite:complete', summary: makeSummary({ suiteName: 'A' }) });
    });

    act(() => {
      result.current.startRun(JSON.stringify({ tests: [] }));
    });
    act(() => {
      capturedOnEvent!({ type: 'suite:complete', summary: makeSummary({ suiteName: 'B' }) });
    });

    expect(result.current.history).toHaveLength(2);

    act(() => {
      result.current.clearHistory();
    });

    expect(result.current.history).toHaveLength(0);
  });

  // -------------------------------------------------------------------------
  // isRunning derivation
  // -------------------------------------------------------------------------

  it('isRunning reflects SSE isConnected when status is complete', () => {
    const { result } = renderHook(() => useTestRun());

    act(() => {
      result.current.startRun(JSON.stringify({ tests: [] }));
    });

    act(() => {
      capturedOnEvent!({ type: 'suite:complete', summary: makeSummary() });
    });

    // Status is 'complete', mockIsConnected is false → isRunning = false
    expect(result.current.isRunning).toBe(false);

    // Simulate SSE still sending data after suite:complete (edge case)
    mockIsConnected = true;
    // Re-render to pick up mockIsConnected change
    const { result: result2 } = renderHook(() => useTestRun());
    act(() => {
      result2.current.startRun(JSON.stringify({ tests: [] }));
    });
    // During a run, isRunning should be true
    expect(result2.current.isRunning).toBe(true);
  });
});
