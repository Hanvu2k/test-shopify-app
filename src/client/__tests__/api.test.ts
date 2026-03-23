/**
 * Unit tests for api.ts — the thin HTTP client service.
 *
 * fetch is mocked globally to avoid real network requests.
 *
 * Tests cover:
 * 1. fetchSuiteList — returns list, throws ApiError on non-OK
 * 2. loadSuite — returns formatted JSON string, throws on 404
 * 3. saveSuite — sends correct request, throws on failure
 * 4. fetchHistory — maps RunSummary array to HistoryEntry format
 * 5. abortRun — sends POST /api/abort, handles 404 as success
 * 6. handleResponse — throws ApiError with server error message when available
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchSuiteList, loadSuite, saveSuite, fetchHistory, abortRun } from '../services/api';
import type { RunSummary } from '../../core/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeOkResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function makeErrorResponse(status: number, errorBody?: { error: string }): Response {
  return new Response(errorBody ? JSON.stringify(errorBody) : null, {
    status,
    statusText: 'Error',
    headers: { 'Content-Type': 'application/json' },
  });
}

function makeSummary(overrides: Partial<RunSummary> = {}): RunSummary {
  return {
    suiteName: 'Test Suite',
    total: 3,
    passed: 2,
    failed: 1,
    skipped: 0,
    duration: 250,
    results: [],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

let originalFetch: typeof globalThis.fetch;

beforeEach(() => {
  originalFetch = globalThis.fetch;
});

afterEach(() => {
  globalThis.fetch = originalFetch;
});

// ---------------------------------------------------------------------------
// fetchSuiteList
// ---------------------------------------------------------------------------

describe('fetchSuiteList', () => {
  it('returns a string array of suite filenames on success', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(makeOkResponse(['suite-a.json', 'suite-b.json']));
    const result = await fetchSuiteList();
    expect(result).toEqual(['suite-a.json', 'suite-b.json']);
  });

  it('calls GET /api/suites', async () => {
    const fetchMock = vi.fn().mockResolvedValue(makeOkResponse([]));
    globalThis.fetch = fetchMock;
    await fetchSuiteList();
    expect(fetchMock).toHaveBeenCalledWith('/api/suites');
  });

  it('throws ApiError with status 500 on server error', async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(makeErrorResponse(500, { error: 'disk failure' }));
    await expect(fetchSuiteList()).rejects.toMatchObject({
      name: 'ApiError',
      status: 500,
      message: 'disk failure',
    });
  });
});

// ---------------------------------------------------------------------------
// loadSuite
// ---------------------------------------------------------------------------

describe('loadSuite', () => {
  it('returns the suite content as a formatted JSON string', async () => {
    const suite = { name: 'My Suite', tests: [] };
    globalThis.fetch = vi.fn().mockResolvedValue(makeOkResponse(suite));
    const result = await loadSuite('my-suite.json');
    expect(result).toBe(JSON.stringify(suite, null, 2));
  });

  it('URL-encodes the suite name in the request URL', async () => {
    const fetchMock = vi.fn().mockResolvedValue(makeOkResponse({}));
    globalThis.fetch = fetchMock;
    await loadSuite('my suite.json');
    expect(fetchMock).toHaveBeenCalledWith('/api/suites/my%20suite.json');
  });

  it('throws ApiError with status 404 when suite does not exist', async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(makeErrorResponse(404, { error: 'Suite not found' }));
    await expect(loadSuite('missing.json')).rejects.toMatchObject({
      name: 'ApiError',
      status: 404,
      message: 'Suite not found',
    });
  });
});

// ---------------------------------------------------------------------------
// saveSuite
// ---------------------------------------------------------------------------

describe('saveSuite', () => {
  it('sends a POST request with the parsed JSON body', async () => {
    const fetchMock = vi.fn().mockResolvedValue(makeOkResponse({ ok: true, filename: 'test.json' }));
    globalThis.fetch = fetchMock;

    const content = JSON.stringify({ name: 'Test Suite', tests: [] });
    await saveSuite('test.json', content);

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/suites/test.json');
    expect(options.method).toBe('POST');
    expect(options.headers).toMatchObject({ 'Content-Type': 'application/json' });
    expect(JSON.parse(options.body as string)).toEqual({ name: 'Test Suite', tests: [] });
  });

  it('URL-encodes the suite name', async () => {
    const fetchMock = vi.fn().mockResolvedValue(makeOkResponse({ ok: true, filename: 'x.json' }));
    globalThis.fetch = fetchMock;
    await saveSuite('my suite.json', '{}');
    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toBe('/api/suites/my%20suite.json');
  });

  it('throws ApiError on server error', async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(makeErrorResponse(500, { error: 'write failed' }));
    await expect(saveSuite('fail.json', '{}')).rejects.toMatchObject({
      name: 'ApiError',
      status: 500,
    });
  });

  it('throws SyntaxError when content is not valid JSON', async () => {
    globalThis.fetch = vi.fn();
    await expect(saveSuite('x.json', 'not json')).rejects.toThrow(SyntaxError);
  });
});

// ---------------------------------------------------------------------------
// fetchHistory
// ---------------------------------------------------------------------------

describe('fetchHistory', () => {
  it('maps RunSummary array to HistoryEntry format', async () => {
    const summaries: RunSummary[] = [
      makeSummary({ suiteName: 'Suite A', passed: 3, failed: 0 }),
      makeSummary({ suiteName: 'Suite B', passed: 1, failed: 2 }),
    ];
    globalThis.fetch = vi.fn().mockResolvedValue(makeOkResponse(summaries));

    const entries = await fetchHistory();

    expect(entries).toHaveLength(2);
    expect(entries[0].suiteName).toBe('Suite A');
    expect(entries[0].passed).toBe(3);
    expect(entries[0].failed).toBe(0);
    expect(entries[1].suiteName).toBe('Suite B');
  });

  it('each HistoryEntry has a unique id, timestamp, and result fields', async () => {
    const summaries = [makeSummary()];
    globalThis.fetch = vi.fn().mockResolvedValue(makeOkResponse(summaries));

    const entries = await fetchHistory();

    expect(entries[0].id).toMatch(/^server-/);
    expect(entries[0].timestamp).toBeInstanceOf(Date);
    expect(Array.isArray(entries[0].results)).toBe(true);
  });

  it('throws ApiError when server returns error', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(makeErrorResponse(500));
    await expect(fetchHistory()).rejects.toMatchObject({ name: 'ApiError', status: 500 });
  });
});

// ---------------------------------------------------------------------------
// abortRun
// ---------------------------------------------------------------------------

describe('abortRun', () => {
  it('sends POST /api/abort', async () => {
    const fetchMock = vi.fn().mockResolvedValue(makeOkResponse({ ok: true }));
    globalThis.fetch = fetchMock;
    await abortRun();
    expect(fetchMock).toHaveBeenCalledWith('/api/abort', { method: 'POST' });
  });

  it('resolves successfully when server returns 200', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(makeOkResponse({ ok: true }));
    await expect(abortRun()).resolves.toBeUndefined();
  });

  it('resolves successfully when server returns 404 (no active run)', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(makeErrorResponse(404));
    // 404 is treated as success — no active run is a valid state
    await expect(abortRun()).resolves.toBeUndefined();
  });

  it('throws ApiError when server returns 500', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(makeErrorResponse(500, { error: 'abort failed' }));
    await expect(abortRun()).rejects.toMatchObject({ name: 'ApiError', status: 500 });
  });
});

// ---------------------------------------------------------------------------
// handleResponse — ApiError message extraction
// ---------------------------------------------------------------------------

describe('ApiError message extraction', () => {
  it('uses the server error message when body contains { error: string }', async () => {
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(makeErrorResponse(422, { error: 'Validation failed' }));
    await expect(fetchSuiteList()).rejects.toMatchObject({ message: 'Validation failed' });
  });

  it('falls back to HTTP status message when body is not JSON', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue(
      new Response('plain text error', { status: 503, statusText: 'Service Unavailable' }),
    );
    await expect(fetchSuiteList()).rejects.toMatchObject({ message: expect.stringMatching(/503/) });
  });
});
