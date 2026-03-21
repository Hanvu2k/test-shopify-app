import { useRef, useState, useCallback, useEffect } from 'react';
import type { TestEvent } from '../../core/types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_RECONNECT_ATTEMPTS = 3;
const RECONNECT_DELAY_MS = 1500;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UseSSEReturn {
  connect: (url: string, body: unknown) => void;
  disconnect: () => void;
  isConnected: boolean;
}

// ---------------------------------------------------------------------------
// SSE line parser
// ---------------------------------------------------------------------------

/**
 * Parses a raw SSE text chunk into an array of data payloads.
 * SSE format: lines starting with "data: " contain the payload.
 * An event is terminated by a blank line.
 */
function parseSSEChunk(chunk: string): string[] {
  const dataPayloads: string[] = [];
  const lines = chunk.split('\n');

  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const payload = line.slice('data: '.length).trim();
      if (payload) {
        dataPayloads.push(payload);
      }
    }
  }

  return dataPayloads;
}

// ---------------------------------------------------------------------------
// useSSE hook
// ---------------------------------------------------------------------------

/**
 * Manages a streaming SSE connection initiated via POST.
 *
 * Because the SSE stream is opened with a POST body (not a plain GET),
 * the native EventSource API cannot be used. Instead, we use fetch() and
 * read the response.body as a ReadableStream.
 */
export function useSSE(onEvent: (event: TestEvent) => void, onError?: (error: Error) => void): UseSSEReturn {
  const [isConnected, setIsConnected] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onEventRef = useRef(onEvent);
  const onErrorRef = useRef(onError);

  // Keep callback refs up-to-date without re-running effects
  onEventRef.current = onEvent;
  onErrorRef.current = onError;

  const disconnect = useCallback(() => {
    if (reconnectTimerRef.current !== null) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    reconnectAttemptsRef.current = 0;
    setIsConnected(false);
  }, []);

  const connectToStream = useCallback(async (url: string, body: unknown) => {
    // Abort any existing connection first
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    setIsConnected(true);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      if (!response.body) {
        throw new Error('Response body is null — SSE stream not available');
      }

      reconnectAttemptsRef.current = 0;

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        const rawChunk = decoder.decode(value, { stream: true });
        const payloads = parseSSEChunk(rawChunk);

        for (const payload of payloads) {
          try {
            const event = JSON.parse(payload) as TestEvent;
            onEventRef.current(event);

            // Close the stream once the suite completes
            if (event.type === 'suite:complete' || event.type === 'suite:error') {
              reader.cancel();
              setIsConnected(false);
              return;
            }
          } catch {
            // Malformed JSON in SSE payload — skip silently
          }
        }
      }

      setIsConnected(false);
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'AbortError') {
        // Intentional disconnect, do not reconnect
        setIsConnected(false);
        return;
      }

      const normalizedError = error instanceof Error ? error : new Error(String(error));
      onErrorRef.current?.(normalizedError);

      const canRetry = reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS;

      if (canRetry && !controller.signal.aborted) {
        reconnectAttemptsRef.current++;
        reconnectTimerRef.current = setTimeout(() => {
          connectToStream(url, body);
        }, RECONNECT_DELAY_MS);
      } else {
        setIsConnected(false);
      }
    }
  }, []);

  const connect = useCallback((url: string, body: unknown) => {
    reconnectAttemptsRef.current = 0;
    connectToStream(url, body);
  }, [connectToStream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimerRef.current !== null) {
        clearTimeout(reconnectTimerRef.current);
      }
      abortControllerRef.current?.abort();
    };
  }, []);

  return { connect, disconnect, isConnected };
}
