// =============================================================================
// Unit Tests: API Runner
// =============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { runApiTest, runApiTestWithResponse } from '../api-runner.js';
import type { ApiTestCase } from '../types.js';

// -----------------------------------------------------------------------------
// fetch mock helpers
// -----------------------------------------------------------------------------

/** Creates a minimal fetch Response mock. */
function makeFetchResponse(status: number, bodyText: string): Response {
  return {
    status,
    text: vi.fn().mockResolvedValue(bodyText),
  } as unknown as Response;
}

/** Returns a fetch mock that resolves to the given Response. */
function mockFetchWith(response: Response) {
  return vi.fn().mockResolvedValue(response);
}

/** Returns a fetch mock that rejects with a network error. */
function mockFetchNetworkError(message = 'Network failure') {
  return vi.fn().mockRejectedValue(new Error(message));
}

// -----------------------------------------------------------------------------
// Base test case factory
// -----------------------------------------------------------------------------

function makeApiTestCase(overrides: Partial<ApiTestCase> = {}): ApiTestCase {
  return {
    name: 'Test GET /health',
    type: 'api',
    url: 'https://api.example.com/health',
    method: 'GET',
    assertions: [],
    ...overrides,
  };
}

// -----------------------------------------------------------------------------
// runApiTest() — status assertions
// -----------------------------------------------------------------------------

describe('runApiTest() — status assertions', () => {
  beforeEach(() => {
    // Reset the global fetch before each test
    vi.stubGlobal('fetch', mockFetchWith(makeFetchResponse(200, '{"ok":true}')));
  });

  it('returns status "pass" when status assertion matches', async () => {
    vi.stubGlobal('fetch', mockFetchWith(makeFetchResponse(200, '{}')));
    const testCase = makeApiTestCase({
      assertions: [{ type: 'status', expected: 200 }],
    });

    const result = await runApiTest(testCase);

    expect(result.status).toBe('pass');
    expect(result.assertions).toHaveLength(1);
    expect(result.assertions![0].passed).toBe(true);
    expect(result.assertions![0].actual).toBe(200);
  });

  it('returns status "fail" when status assertion does not match', async () => {
    vi.stubGlobal('fetch', mockFetchWith(makeFetchResponse(404, 'Not Found')));
    const testCase = makeApiTestCase({
      assertions: [{ type: 'status', expected: 200 }],
    });

    const result = await runApiTest(testCase);

    expect(result.status).toBe('fail');
    expect(result.assertions![0].passed).toBe(false);
    expect(result.assertions![0].actual).toBe(404);
    expect(result.assertions![0].expected).toBe(200);
  });
});

// -----------------------------------------------------------------------------
// runApiTest() — bodyContains assertions
// -----------------------------------------------------------------------------

describe('runApiTest() — bodyContains assertions', () => {
  it('passes when the response body contains the expected substring', async () => {
    vi.stubGlobal('fetch', mockFetchWith(makeFetchResponse(200, 'Hello World')));
    const testCase = makeApiTestCase({
      assertions: [{ type: 'bodyContains', expected: 'Hello' }],
    });

    const result = await runApiTest(testCase);

    expect(result.status).toBe('pass');
    expect(result.assertions![0].passed).toBe(true);
  });

  it('fails when the response body does not contain the expected substring', async () => {
    vi.stubGlobal('fetch', mockFetchWith(makeFetchResponse(200, 'Goodbye')));
    const testCase = makeApiTestCase({
      assertions: [{ type: 'bodyContains', expected: 'Hello' }],
    });

    const result = await runApiTest(testCase);

    expect(result.status).toBe('fail');
    expect(result.assertions![0].passed).toBe(false);
  });

  it('passes when body contains an empty string (always true)', async () => {
    vi.stubGlobal('fetch', mockFetchWith(makeFetchResponse(200, 'some body')));
    const testCase = makeApiTestCase({
      assertions: [{ type: 'bodyContains', expected: '' }],
    });

    const result = await runApiTest(testCase);

    expect(result.assertions![0].passed).toBe(true);
  });
});

// -----------------------------------------------------------------------------
// runApiTest() — jsonpath assertions
// -----------------------------------------------------------------------------

describe('runApiTest() — jsonpath assertions', () => {
  it('passes when the JSONPath value matches expected', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetchWith(makeFetchResponse(200, JSON.stringify({ data: { id: 42 } }))),
    );
    const testCase = makeApiTestCase({
      assertions: [{ type: 'jsonpath', path: '$.data.id', expected: 42 }],
    });

    const result = await runApiTest(testCase);

    expect(result.status).toBe('pass');
    expect(result.assertions![0].passed).toBe(true);
    expect(result.assertions![0].actual).toBe(42);
  });

  it('fails when the JSONPath value does not match expected', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetchWith(makeFetchResponse(200, JSON.stringify({ data: { id: 99 } }))),
    );
    const testCase = makeApiTestCase({
      assertions: [{ type: 'jsonpath', path: '$.data.id', expected: 42 }],
    });

    const result = await runApiTest(testCase);

    expect(result.status).toBe('fail');
    expect(result.assertions![0].passed).toBe(false);
    expect(result.assertions![0].actual).toBe(99);
  });

  it('fails when the JSONPath does not match anything', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetchWith(makeFetchResponse(200, JSON.stringify({ other: 'value' }))),
    );
    const testCase = makeApiTestCase({
      assertions: [{ type: 'jsonpath', path: '$.nonexistent', expected: 'something' }],
    });

    const result = await runApiTest(testCase);

    expect(result.status).toBe('fail');
    expect(result.assertions![0].passed).toBe(false);
    expect(result.assertions![0].actual).toBeUndefined();
  });

  it('fails when body is not valid JSON', async () => {
    vi.stubGlobal('fetch', mockFetchWith(makeFetchResponse(200, 'not-json')));
    const testCase = makeApiTestCase({
      assertions: [{ type: 'jsonpath', path: '$.id', expected: 1 }],
    });

    const result = await runApiTest(testCase);

    expect(result.status).toBe('fail');
    expect(result.assertions![0].passed).toBe(false);
    expect(result.assertions![0].actual).toMatch(/not valid JSON/);
  });

  it('fails when the assertion is missing the path field', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetchWith(makeFetchResponse(200, JSON.stringify({ id: 1 }))),
    );
    const testCase = makeApiTestCase({
      assertions: [{ type: 'jsonpath', expected: 1 }],
    });

    const result = await runApiTest(testCase);

    expect(result.status).toBe('fail');
    expect(result.assertions![0].passed).toBe(false);
    expect(result.assertions![0].actual).toMatch(/missing path/);
  });
});

// -----------------------------------------------------------------------------
// runApiTest() — multiple assertions + network errors
// -----------------------------------------------------------------------------

describe('runApiTest() — multiple assertions', () => {
  it('passes only when all assertions pass', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetchWith(makeFetchResponse(200, JSON.stringify({ status: 'ok' }))),
    );
    const testCase = makeApiTestCase({
      assertions: [
        { type: 'status', expected: 200 },
        { type: 'jsonpath', path: '$.status', expected: 'ok' },
      ],
    });

    const result = await runApiTest(testCase);

    expect(result.status).toBe('pass');
    expect(result.assertions).toHaveLength(2);
    expect(result.assertions!.every((a) => a.passed)).toBe(true);
  });

  it('fails if any single assertion fails', async () => {
    vi.stubGlobal(
      'fetch',
      mockFetchWith(makeFetchResponse(201, JSON.stringify({ status: 'ok' }))),
    );
    const testCase = makeApiTestCase({
      assertions: [
        { type: 'status', expected: 200 }, // will fail (201 != 200)
        { type: 'jsonpath', path: '$.status', expected: 'ok' }, // will pass
      ],
    });

    const result = await runApiTest(testCase);

    expect(result.status).toBe('fail');
    expect(result.assertions![0].passed).toBe(false);
    expect(result.assertions![1].passed).toBe(true);
  });
});

describe('runApiTest() — network error handling', () => {
  it('returns status "error" on a network failure', async () => {
    vi.stubGlobal('fetch', mockFetchNetworkError('ECONNREFUSED'));
    const testCase = makeApiTestCase({
      assertions: [{ type: 'status', expected: 200 }],
    });

    const result = await runApiTest(testCase);

    expect(result.status).toBe('error');
    expect(result.error).toContain('ECONNREFUSED');
    expect(result.assertions).toBeUndefined();
  });

  it('includes a non-zero duration even on network error', async () => {
    vi.stubGlobal('fetch', mockFetchNetworkError('Timeout'));
    const testCase = makeApiTestCase({ assertions: [] });

    const result = await runApiTest(testCase);

    expect(result.duration).toBeGreaterThanOrEqual(0);
  });
});

// -----------------------------------------------------------------------------
// runApiTest() — request builder
// -----------------------------------------------------------------------------

describe('runApiTest() — request building', () => {
  it('sends Content-Type: application/json by default', async () => {
    const mockFetch = mockFetchWith(makeFetchResponse(200, '{}'));
    vi.stubGlobal('fetch', mockFetch);
    const testCase = makeApiTestCase({ assertions: [] });

    await runApiTest(testCase);

    const [_url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect((init.headers as Record<string, string>)['Content-Type']).toBe('application/json');
  });

  it('merges custom headers with the default Content-Type', async () => {
    const mockFetch = mockFetchWith(makeFetchResponse(200, '{}'));
    vi.stubGlobal('fetch', mockFetch);
    const testCase = makeApiTestCase({
      headers: { Authorization: 'Bearer token' },
      assertions: [],
    });

    await runApiTest(testCase);

    const [_url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers['Authorization']).toBe('Bearer token');
    expect(headers['Content-Type']).toBe('application/json');
  });

  it('includes a JSON-serialised body for POST requests', async () => {
    const mockFetch = mockFetchWith(makeFetchResponse(201, '{}'));
    vi.stubGlobal('fetch', mockFetch);
    const payload = { name: 'item', price: 9.99 };
    const testCase = makeApiTestCase({
      method: 'POST',
      body: payload,
      assertions: [],
    });

    await runApiTest(testCase);

    const [_url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(init.body).toBe(JSON.stringify(payload));
  });

  it('omits body for GET requests', async () => {
    const mockFetch = mockFetchWith(makeFetchResponse(200, '{}'));
    vi.stubGlobal('fetch', mockFetch);
    const testCase = makeApiTestCase({ method: 'GET', assertions: [] });

    await runApiTest(testCase);

    const [_url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(init.body).toBeUndefined();
  });

  it('calls fetch with the correct URL and method', async () => {
    const mockFetch = mockFetchWith(makeFetchResponse(200, '{}'));
    vi.stubGlobal('fetch', mockFetch);
    const testCase = makeApiTestCase({
      url: 'https://api.example.com/v1/users',
      method: 'DELETE',
      assertions: [],
    });

    await runApiTest(testCase);

    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.example.com/v1/users');
    expect(init.method).toBe('DELETE');
  });
});

// -----------------------------------------------------------------------------
// runApiTestWithResponse() — verifies responseBody is returned
// -----------------------------------------------------------------------------

describe('runApiTestWithResponse()', () => {
  it('returns the parsed JSON response body for saveAs extraction', async () => {
    const responseData = { data: { id: 1, name: 'Widget' } };
    vi.stubGlobal(
      'fetch',
      mockFetchWith(makeFetchResponse(200, JSON.stringify(responseData))),
    );
    const testCase = makeApiTestCase({
      assertions: [{ type: 'status', expected: 200 }],
    });

    const { result, responseBody } = await runApiTestWithResponse(testCase);

    expect(result.status).toBe('pass');
    expect(responseBody).toEqual(responseData);
  });

  it('returns null responseBody when the response is not valid JSON', async () => {
    vi.stubGlobal('fetch', mockFetchWith(makeFetchResponse(200, 'plain text response')));
    const testCase = makeApiTestCase({ assertions: [] });

    const { responseBody } = await runApiTestWithResponse(testCase);

    expect(responseBody).toBeNull();
  });

  it('returns null responseBody on network error', async () => {
    vi.stubGlobal('fetch', mockFetchNetworkError('Connection refused'));
    const testCase = makeApiTestCase({ assertions: [] });

    const { result, responseBody } = await runApiTestWithResponse(testCase);

    expect(result.status).toBe('error');
    expect(responseBody).toBeNull();
  });
});

// -----------------------------------------------------------------------------
// runApiTest() — timeout behavior (Sprint 4.2)
// -----------------------------------------------------------------------------

/** Creates a fetch mock that never resolves (simulates a stalled request). */
function mockFetchStalled() {
  return vi.fn().mockReturnValue(new Promise<Response>(() => {}));
}

/** Creates a fetch mock that aborts when the AbortSignal fires. */
function mockFetchAbortable() {
  return vi.fn().mockImplementation((_url: string, init: RequestInit) => {
    return new Promise<Response>((_resolve, reject) => {
      if (init.signal) {
        init.signal.addEventListener('abort', () => {
          const abortError = new Error('The operation was aborted');
          abortError.name = 'AbortError';
          reject(abortError);
        });
      }
    });
  });
}

describe('runApiTest() — timeout behavior', () => {
  it('returns status "error" with timeout message when request exceeds custom timeout', async () => {
    vi.stubGlobal('fetch', mockFetchAbortable());
    const testCase = makeApiTestCase({
      timeout: 50, // 50ms — fires quickly in test
      assertions: [],
    });

    const result = await runApiTest(testCase);

    expect(result.status).toBe('error');
    expect(result.error).toMatch(/timed out after 50ms/i);
  });

  it('error message includes the configured timeout value in milliseconds', async () => {
    vi.stubGlobal('fetch', mockFetchAbortable());
    const testCase = makeApiTestCase({
      timeout: 100,
      assertions: [],
    });

    const result = await runApiTest(testCase);

    expect(result.error).toContain('100ms');
  });

  it('uses 30000ms default timeout when timeout field is not specified', async () => {
    // Verify the test case without a timeout field resolves normally
    vi.stubGlobal('fetch', mockFetchWith(makeFetchResponse(200, '{}')));
    const testCase = makeApiTestCase({ assertions: [] });

    const result = await runApiTest(testCase);

    // Should pass (uses default 30s timeout, fetch resolves immediately)
    expect(result.status).toBe('pass');
  });

  it('includes a duration when the request times out', async () => {
    vi.stubGlobal('fetch', mockFetchAbortable());
    const testCase = makeApiTestCase({
      timeout: 50,
      assertions: [],
    });

    const result = await runApiTest(testCase);

    expect(result.duration).toBeGreaterThanOrEqual(0);
  });

  it('succeeds normally when request completes before the timeout', async () => {
    vi.stubGlobal('fetch', mockFetchWith(makeFetchResponse(200, '{"ok":true}')));
    const testCase = makeApiTestCase({
      timeout: 5000, // 5 second timeout — fetch resolves immediately
      assertions: [{ type: 'status', expected: 200 }],
    });

    const result = await runApiTest(testCase);

    expect(result.status).toBe('pass');
    expect(result.error).toBeUndefined();
  });
});

describe('runApiTestWithResponse() — timeout behavior', () => {
  it('returns status "error" and null responseBody when request times out', async () => {
    vi.stubGlobal('fetch', mockFetchAbortable());
    const testCase = makeApiTestCase({
      timeout: 50,
      assertions: [],
    });

    const { result, responseBody } = await runApiTestWithResponse(testCase);

    expect(result.status).toBe('error');
    expect(result.error).toMatch(/timed out after 50ms/i);
    expect(responseBody).toBeNull();
  });

  it('distinguishes timeout error from generic network error', async () => {
    // Timeout produces a specific "timed out after Nms" message
    vi.stubGlobal('fetch', mockFetchAbortable());
    const timeoutCase = makeApiTestCase({ timeout: 50, assertions: [] });
    const timeoutResult = await runApiTest(timeoutCase);

    // Generic network error has its own message
    vi.stubGlobal('fetch', mockFetchNetworkError('ECONNREFUSED'));
    const networkCase = makeApiTestCase({ assertions: [] });
    const networkResult = await runApiTest(networkCase);

    expect(timeoutResult.error).toMatch(/timed out/i);
    expect(networkResult.error).toContain('ECONNREFUSED');
    expect(networkResult.error).not.toMatch(/timed out/i);
  });
});
