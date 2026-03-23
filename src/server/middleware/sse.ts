// =============================================================================
// SSE (Server-Sent Events) Middleware
// =============================================================================
// Provides helper functions for setting SSE headers, sending typed events,
// and cleanly closing the SSE connection. Used by the /api/run route to
// stream test execution events to the frontend in real-time.
// =============================================================================

import type { Response } from 'express';

/**
 * Sets the required HTTP headers for an SSE connection on the response.
 * Must be called before any sendEvent() calls.
 */
export function setSSEHeaders(res: Response): void {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering if proxied
  res.flushHeaders();
}

/**
 * Sends a single SSE event to the client.
 *
 * Wire format:
 *   event: {eventType}\n
 *   data: {JSON-stringified data}\n
 *   \n
 *
 * @param res       The Express response with SSE headers already set
 * @param eventType The SSE event name (e.g. 'test:start', 'test:result', 'suite:complete')
 * @param data      The payload to JSON-serialize into the data field
 */
export function sendEvent(res: Response, eventType: string, data: unknown): void {
  if (res.writableEnded) return;

  const payload = JSON.stringify(data);
  res.write(`event: ${eventType}\ndata: ${payload}\n\n`);
}

/**
 * Closes the SSE connection gracefully.
 */
export function closeSSE(res: Response): void {
  if (!res.writableEnded) {
    res.end();
  }
}
