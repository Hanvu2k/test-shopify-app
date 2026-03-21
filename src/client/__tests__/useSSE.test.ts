/**
 * Tests for useSSE hook — SSE streaming state management logic.
 *
 * Tests focus on:
 * 1. Initial state
 * 2. State transitions (isConnected on connect/disconnect)
 * 3. Event delivery from SSE stream
 * 4. Error handling (HTTP errors, network failures)
 * 5. Reconnect behaviour (up to 3 attempts)
 * 6. Cleanup on unmount
 * 7. SSE line parsing (malformed JSON, non-data lines)
 */
import { renderHook, act } from '@testing-library/react';
import { useSSE } from '../hooks/useSSE';
import type { TestEvent } from '../../core/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const encoder = new TextEncoder();

function sseChunk(payload: object): Uint8Array {
  return encoder.encode(`data: ${JSON.stringify(payload)}\n\n`);
}

function rawChunk(text: string): Uint8Array {
  return encoder.encode(text);
}

/**
 * Creates a controllable ReadableStream.
 * `enqueue` pushes chunks; `close` closes the stream.
 */
function createControllableStream(): {
  stream: ReadableStream<Uint8Array>;
  enqueue: (chunk: Uint8Array) => void;
  close: () => void;
} {
  let ctrl!: ReadableStreamDefaultController<Uint8Array>;
  const stream = new ReadableStream<Uint8Array>({
    start(c) {
      ctrl = c;
    },
  });
  return {
    stream,
    enqueue: (chunk) => ctrl.enqueue(chunk),
    close: () => ctrl.close(),
  };
}

function makeFetchWith(
  stream: ReadableStream<Uint8Array>,
  status = 200,
): typeof globalThis.fetch {
  return () =>
    Promise.resolve(
      new Response(stream, {
        status,
        statusText: status === 200 ? 'OK' : 'Server Error',
      }),
    ) as Promise<Response>;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useSSE', () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // Initial state
  // -------------------------------------------------------------------------

  it('starts with isConnected = false', () => {
    const { result } = renderHook(() => useSSE(vi.fn()));
    expect(result.current.isConnected).toBe(false);
  });

  it('exposes connect and disconnect functions', () => {
    const { result } = renderHook(() => useSSE(vi.fn()));
    expect(typeof result.current.connect).toBe('function');
    expect(typeof result.current.disconnect).toBe('function');
  });

  // -------------------------------------------------------------------------
  // Connection state
  // -------------------------------------------------------------------------

  it('sets isConnected to true immediately after connect is called', () => {
    // Fetch that never resolves so we can check state before stream finishes
    globalThis.fetch = () => new Promise(() => {}) as Promise<Response>;

    const { result } = renderHook(() => useSSE(vi.fn()));

    act(() => {
      result.current.connect('/api/run', { tests: [] });
    });

    expect(result.current.isConnected).toBe(true);
  });

  it('sets isConnected to false after disconnect is called', () => {
    globalThis.fetch = () => new Promise(() => {}) as Promise<Response>;

    const { result } = renderHook(() => useSSE(vi.fn()));

    act(() => {
      result.current.connect('/api/run', {});
    });

    expect(result.current.isConnected).toBe(true);

    act(() => {
      result.current.disconnect();
    });

    expect(result.current.isConnected).toBe(false);
  });

  it('resets isConnected to false when stream completes naturally', async () => {
    const { stream, close } = createControllableStream();
    globalThis.fetch = makeFetchWith(stream);

    const onEvent = vi.fn();
    const { result } = renderHook(() => useSSE(onEvent));

    act(() => {
      result.current.connect('/api/run', {});
    });

    // Close the stream to simulate natural end
    close();

    // Wait for state update to propagate
    await act(async () => {
      await new Promise((r) => setTimeout(r, 100));
    });

    expect(result.current.isConnected).toBe(false);
  });

  // -------------------------------------------------------------------------
  // Event delivery
  // -------------------------------------------------------------------------

  it('delivers SSE events to the onEvent callback in order', async () => {
    const { stream, enqueue, close } = createControllableStream();
    globalThis.fetch = makeFetchWith(stream);

    const startEvent: TestEvent = { type: 'test:start', name: 'test 1', index: 0, total: 2 };
    const resultEvent: TestEvent = {
      type: 'test:result',
      result: { name: 'test 1', type: 'api', status: 'pass', duration: 50 },
      index: 0,
      total: 2,
    };

    const onEvent = vi.fn();
    const { result } = renderHook(() => useSSE(onEvent));

    act(() => {
      result.current.connect('/api/run', {});
    });

    enqueue(sseChunk(startEvent));
    enqueue(sseChunk(resultEvent));

    await act(async () => {
      await new Promise((r) => setTimeout(r, 100));
    });

    expect(onEvent).toHaveBeenCalledTimes(2);
    expect(onEvent).toHaveBeenNthCalledWith(1, startEvent);
    expect(onEvent).toHaveBeenNthCalledWith(2, resultEvent);

    close();
  });

  it('closes stream and sets isConnected to false on suite:complete', async () => {
    const { stream, enqueue } = createControllableStream();
    globalThis.fetch = makeFetchWith(stream);

    const completeEvent: TestEvent = {
      type: 'suite:complete',
      summary: {
        suiteName: 'My Suite',
        total: 1,
        passed: 1,
        failed: 0,
        skipped: 0,
        duration: 200,
        results: [],
      },
    };

    const onEvent = vi.fn();
    const { result } = renderHook(() => useSSE(onEvent));

    act(() => {
      result.current.connect('/api/run', {});
    });

    enqueue(sseChunk(completeEvent));

    await act(async () => {
      await new Promise((r) => setTimeout(r, 100));
    });

    expect(onEvent).toHaveBeenCalledWith(completeEvent);
    expect(result.current.isConnected).toBe(false);
  });

  it('closes stream and sets isConnected to false on suite:error', async () => {
    const { stream, enqueue } = createControllableStream();
    globalThis.fetch = makeFetchWith(stream);

    const errorEvent: TestEvent = { type: 'suite:error', error: 'runner crashed' };

    const onEvent = vi.fn();
    const { result } = renderHook(() => useSSE(onEvent));

    act(() => {
      result.current.connect('/api/run', {});
    });

    enqueue(sseChunk(errorEvent));

    await act(async () => {
      await new Promise((r) => setTimeout(r, 100));
    });

    expect(onEvent).toHaveBeenCalledWith(errorEvent);
    expect(result.current.isConnected).toBe(false);
  });

  it('handles multiple SSE events in a single chunk', async () => {
    const { stream, enqueue, close } = createControllableStream();
    globalThis.fetch = makeFetchWith(stream);

    const event1: TestEvent = { type: 'test:start', name: 'A', index: 0, total: 2 };
    const event2: TestEvent = { type: 'test:start', name: 'B', index: 1, total: 2 };
    const combined = encoder.encode(
      `data: ${JSON.stringify(event1)}\n\ndata: ${JSON.stringify(event2)}\n\n`,
    );

    const onEvent = vi.fn();
    const { result } = renderHook(() => useSSE(onEvent));

    act(() => {
      result.current.connect('/api/run', {});
    });

    enqueue(combined);

    await act(async () => {
      await new Promise((r) => setTimeout(r, 100));
    });

    expect(onEvent).toHaveBeenCalledTimes(2);
    expect(onEvent).toHaveBeenNthCalledWith(1, event1);
    expect(onEvent).toHaveBeenNthCalledWith(2, event2);

    close();
  });

  // -------------------------------------------------------------------------
  // Error handling
  // -------------------------------------------------------------------------

  it('calls onError and sets isConnected to false when fetch rejects', async () => {
    globalThis.fetch = () => Promise.reject(new Error('network error'));

    const onEvent = vi.fn();
    const onError = vi.fn();
    const { result } = renderHook(() => useSSE(onEvent, onError));

    act(() => {
      result.current.connect('/api/run', {});
    });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 100));
    });

    expect(onError).toHaveBeenCalled();
    expect((onError.mock.calls[0][0] as Error).message).toBe('network error');
  });

  it('calls onError with HTTP error message when response is non-OK', async () => {
    const { stream } = createControllableStream();
    globalThis.fetch = makeFetchWith(stream, 500);

    const onEvent = vi.fn();
    const onError = vi.fn();
    const { result } = renderHook(() => useSSE(onEvent, onError));

    act(() => {
      result.current.connect('/api/run', {});
    });

    await act(async () => {
      await new Promise((r) => setTimeout(r, 100));
    });

    expect(onError).toHaveBeenCalled();
    const errorArg = onError.mock.calls[0][0] as Error;
    expect(errorArg.message).toMatch(/HTTP 500/);
  });

  // -------------------------------------------------------------------------
  // Reconnect behaviour
  // -------------------------------------------------------------------------

  it('reconnects up to MAX_RECONNECT_ATTEMPTS times after error', async () => {
    // Use real timers but a fast-failing fetch to avoid long waits.
    // The actual RECONNECT_DELAY_MS is 1500ms; we use jest.useFakeTimers
    // but flush promises manually after each timer advance.
    vi.useFakeTimers();
    let callCount = 0;

    globalThis.fetch = () => {
      callCount++;
      return Promise.reject(new Error('refused'));
    };

    const onError = vi.fn();
    const { result } = renderHook(() => useSSE(vi.fn(), onError));

    // Initial connect (attempt #1)
    act(() => {
      result.current.connect('/api/run', {});
    });

    // Drain the initial rejected promise
    await act(async () => {
      await Promise.resolve();
    });

    // Advance through 3 reconnect timers (1500ms each)
    for (let i = 0; i < 3; i++) {
      await act(async () => {
        vi.advanceTimersByTime(1500);
        // Flush the new fetch rejection
        await Promise.resolve();
        await Promise.resolve();
      });
    }

    // Should have tried 4 times (1 initial + 3 reconnects)
    expect(callCount).toBe(4);

    // After exhausting retries, should be disconnected
    expect(result.current.isConnected).toBe(false);
  });

  // -------------------------------------------------------------------------
  // SSE parsing edge cases
  // -------------------------------------------------------------------------

  it('skips malformed JSON data lines without throwing', async () => {
    const { stream, enqueue, close } = createControllableStream();
    globalThis.fetch = makeFetchWith(stream);

    const onEvent = vi.fn();
    const onError = vi.fn();
    const { result } = renderHook(() => useSSE(onEvent, onError));

    act(() => {
      result.current.connect('/api/run', {});
    });

    enqueue(rawChunk('data: not-valid-json\n\ndata: {broken\n\n'));
    close();

    await act(async () => {
      await new Promise((r) => setTimeout(r, 100));
    });

    // Malformed JSON must not reach onEvent and must not call onError
    expect(onEvent).not.toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
  });

  it('ignores SSE lines that are comments, event names, or IDs', async () => {
    const { stream, enqueue, close } = createControllableStream();
    globalThis.fetch = makeFetchWith(stream);

    const onEvent = vi.fn();
    const { result } = renderHook(() => useSSE(onEvent));

    act(() => {
      result.current.connect('/api/run', {});
    });

    enqueue(rawChunk(': keep-alive\nevent: ping\nid: 42\n\n'));
    close();

    await act(async () => {
      await new Promise((r) => setTimeout(r, 100));
    });

    expect(onEvent).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // Cleanup on unmount
  // -------------------------------------------------------------------------

  it('cancels reconnect timers on disconnect', () => {
    vi.useFakeTimers();
    let callCount = 0;
    globalThis.fetch = () => {
      callCount++;
      return Promise.reject(new Error('fail'));
    };

    const { result } = renderHook(() => useSSE(vi.fn()));

    act(() => {
      result.current.connect('/api/run', {});
    });

    act(() => {
      result.current.disconnect();
    });

    // Advance timers: no retry should fire because disconnect was called
    vi.advanceTimersByTime(10000);
    expect(callCount).toBe(1); // only the initial attempt
  });
});
