/**
 * Unit tests for SSE middleware helpers.
 *
 * Tests cover:
 * 1. setSSEHeaders — sets correct headers and flushes
 * 2. sendEvent — correct SSE wire format, skips if stream ended
 * 3. closeSSE — ends stream, skips if already ended
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { setSSEHeaders, sendEvent, closeSSE } from '../middleware/sse.js';
import type { Response } from 'express';

// ---------------------------------------------------------------------------
// Mock Response factory
// ---------------------------------------------------------------------------

function createMockResponse(writableEnded = false): Response {
  return {
    setHeader: vi.fn(),
    flushHeaders: vi.fn(),
    write: vi.fn(),
    end: vi.fn(),
    writableEnded,
  } as unknown as Response;
}

// ---------------------------------------------------------------------------
// setSSEHeaders
// ---------------------------------------------------------------------------

describe('setSSEHeaders', () => {
  it('sets Content-Type to text/event-stream', () => {
    const res = createMockResponse();
    setSSEHeaders(res);
    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/event-stream');
  });

  it('sets Cache-Control to no-cache', () => {
    const res = createMockResponse();
    setSSEHeaders(res);
    expect(res.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-cache');
  });

  it('sets Connection to keep-alive', () => {
    const res = createMockResponse();
    setSSEHeaders(res);
    expect(res.setHeader).toHaveBeenCalledWith('Connection', 'keep-alive');
  });

  it('sets X-Accel-Buffering to no to disable nginx buffering', () => {
    const res = createMockResponse();
    setSSEHeaders(res);
    expect(res.setHeader).toHaveBeenCalledWith('X-Accel-Buffering', 'no');
  });

  it('calls flushHeaders after setting all headers', () => {
    const res = createMockResponse();
    setSSEHeaders(res);
    expect(res.flushHeaders).toHaveBeenCalledOnce();
  });
});

// ---------------------------------------------------------------------------
// sendEvent
// ---------------------------------------------------------------------------

describe('sendEvent', () => {
  it('writes the correct SSE wire format', () => {
    const res = createMockResponse();
    const data = { type: 'test:start', name: 'My Test', index: 0, total: 3 };
    sendEvent(res, 'test:start', data);
    expect(res.write).toHaveBeenCalledWith(
      `event: test:start\ndata: ${JSON.stringify(data)}\n\n`,
    );
  });

  it('does not write when writableEnded is true', () => {
    const res = createMockResponse(true);
    sendEvent(res, 'test:start', { name: 'skipped' });
    expect(res.write).not.toHaveBeenCalled();
  });

  it('serializes nested objects in the data field', () => {
    const res = createMockResponse();
    const data = { result: { status: 'pass', duration: 42, assertions: [] } };
    sendEvent(res, 'test:result', data);
    const written = (res.write as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(written).toContain(`data: ${JSON.stringify(data)}`);
  });

  it('uses the eventType in the event: field', () => {
    const res = createMockResponse();
    sendEvent(res, 'suite:complete', {});
    const written = (res.write as ReturnType<typeof vi.fn>).mock.calls[0][0] as string;
    expect(written).toMatch(/^event: suite:complete\n/);
  });
});

// ---------------------------------------------------------------------------
// closeSSE
// ---------------------------------------------------------------------------

describe('closeSSE', () => {
  it('calls res.end() when stream is still writable', () => {
    const res = createMockResponse(false);
    closeSSE(res);
    expect(res.end).toHaveBeenCalledOnce();
  });

  it('does not call res.end() when stream is already ended', () => {
    const res = createMockResponse(true);
    closeSSE(res);
    expect(res.end).not.toHaveBeenCalled();
  });
});
