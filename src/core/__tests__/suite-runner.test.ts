// =============================================================================
// Unit Tests: Suite Runner
// =============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { TestSuite, TestResult, OnTestEvent, ApiTestCase } from '../types.js';

// -----------------------------------------------------------------------------
// Module mocks — must be declared before importing the module under test
// -----------------------------------------------------------------------------

vi.mock('../api-runner.js', () => ({
  runApiTestWithResponse: vi.fn(),
}));

vi.mock('../playwright-runner.js', () => ({
  runUiTestWithPage: vi.fn(),
  closeBrowser: vi.fn().mockResolvedValue(undefined),
}));

import { runSuite } from '../suite-runner.js';
import { runApiTestWithResponse } from '../api-runner.js';
import { runUiTestWithPage, closeBrowser } from '../playwright-runner.js';

const mockRunApiTestWithResponse = vi.mocked(runApiTestWithResponse);
const mockRunUiTestWithPage = vi.mocked(runUiTestWithPage);
const mockCloseBrowser = vi.mocked(closeBrowser);

// -----------------------------------------------------------------------------
// Factories
// -----------------------------------------------------------------------------

function makePassApiResult(name: string): TestResult {
  return {
    name,
    type: 'api',
    status: 'pass',
    duration: 10,
    assertions: [{ type: 'status', expected: 200, actual: 200, passed: true }],
  };
}

function makeApiTestCase(overrides: Partial<ApiTestCase> = {}): ApiTestCase {
  return {
    name: 'GET /health',
    type: 'api',
    url: 'https://api.example.com/health',
    method: 'GET',
    assertions: [{ type: 'status', expected: 200 }],
    ...overrides,
  };
}

function makeSuite(overrides: Partial<TestSuite> = {}): TestSuite {
  return {
    name: 'My Test Suite',
    tests: [],
    ...overrides,
  };
}

function collectEvents(onEvent: OnTestEvent): ReturnType<typeof vi.fn> {
  return onEvent as ReturnType<typeof vi.fn>;
}

// -----------------------------------------------------------------------------
// Validation
// -----------------------------------------------------------------------------

describe('runSuite() — validation', () => {
  it('emits suite:error and returns empty summary when suite has no name', async () => {
    const onEvent = vi.fn();
    // An object with the wrong shape — runtime validation should catch this
    const badSuite = { tests: [] } as unknown as TestSuite;
    const summary = await runSuite(badSuite, onEvent);

    expect(onEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'suite:error' }),
    );
    expect(summary.total).toBe(0);
  });

  it('emits suite:error when suite has no name', async () => {
    const onEvent = vi.fn();
    const badSuite = { name: '', tests: [] } as TestSuite;
    await runSuite(badSuite, onEvent);

    expect(onEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'suite:error', error: expect.stringContaining('name') }),
    );
  });

  it('emits suite:error when tests is not an array', async () => {
    const onEvent = vi.fn();
    const badSuite = { name: 'suite', tests: 'not-array' } as unknown as TestSuite;
    await runSuite(badSuite, onEvent);

    expect(onEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'suite:error' }),
    );
  });

  it('emits suite:error when an API test case is missing assertions array', async () => {
    const onEvent = vi.fn();
    const badSuite: TestSuite = {
      name: 'suite',
      tests: [
        { name: 'no assertions', type: 'api', url: 'https://x.com', method: 'GET' } as ApiTestCase,
      ],
    };
    await runSuite(badSuite, onEvent);

    expect(onEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'suite:error' }),
    );
  });

  it('emits suite:error when a test case has an invalid type', async () => {
    const onEvent = vi.fn();
    const badSuite = {
      name: 'suite',
      tests: [{ name: 'bad', type: 'graphql', url: 'https://x.com' }],
    } as unknown as TestSuite;
    await runSuite(badSuite, onEvent);

    expect(onEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'suite:error' }),
    );
  });
});

// -----------------------------------------------------------------------------
// Empty suite
// -----------------------------------------------------------------------------

describe('runSuite() — empty suite', () => {
  it('returns a summary with zeros for an empty tests array', async () => {
    const onEvent = vi.fn();
    const suite = makeSuite({ tests: [] });

    const summary = await runSuite(suite, onEvent);

    expect(summary.total).toBe(0);
    expect(summary.passed).toBe(0);
    expect(summary.failed).toBe(0);
    expect(summary.skipped).toBe(0);
    expect(summary.results).toHaveLength(0);
  });

  it('emits suite:complete for an empty suite', async () => {
    const onEvent = vi.fn();
    await runSuite(makeSuite({ tests: [] }), onEvent);

    expect(onEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'suite:complete' }),
    );
  });
});

// -----------------------------------------------------------------------------
// Routing to api-runner
// -----------------------------------------------------------------------------

describe('runSuite() — API test routing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('routes API tests to runApiTestWithResponse', async () => {
    const apiCase = makeApiTestCase({ name: 'Login API' });
    const suite = makeSuite({ tests: [apiCase] });
    const onEvent = vi.fn();

    mockRunApiTestWithResponse.mockResolvedValue({
      result: makePassApiResult('Login API'),
      responseBody: null,
    });

    await runSuite(suite, onEvent);

    expect(mockRunApiTestWithResponse).toHaveBeenCalledTimes(1);
    expect(mockRunApiTestWithResponse).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Login API', type: 'api' }),
    );
  });

  it('records a passing API result in the summary', async () => {
    const suite = makeSuite({ tests: [makeApiTestCase({ name: 'Health Check' })] });
    const onEvent = vi.fn();

    mockRunApiTestWithResponse.mockResolvedValue({
      result: makePassApiResult('Health Check'),
      responseBody: null,
    });

    const summary = await runSuite(suite, onEvent);

    expect(summary.total).toBe(1);
    expect(summary.passed).toBe(1);
    expect(summary.failed).toBe(0);
  });

  it('records a failing API result in the summary', async () => {
    const suite = makeSuite({ tests: [makeApiTestCase({ name: 'Fail Test' })] });
    const onEvent = vi.fn();

    mockRunApiTestWithResponse.mockResolvedValue({
      result: { name: 'Fail Test', type: 'api', status: 'fail', duration: 5 },
      responseBody: null,
    });

    const summary = await runSuite(suite, onEvent);

    expect(summary.failed).toBe(1);
    expect(summary.passed).toBe(0);
  });
});

// -----------------------------------------------------------------------------
// Event emission
// -----------------------------------------------------------------------------

describe('runSuite() — event emission', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('emits test:start before each test', async () => {
    const suite = makeSuite({ tests: [makeApiTestCase({ name: 'Alpha' })] });
    const onEvent = vi.fn();

    mockRunApiTestWithResponse.mockResolvedValue({
      result: makePassApiResult('Alpha'),
      responseBody: null,
    });

    await runSuite(suite, onEvent);

    expect(onEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'test:start', name: 'Alpha', index: 0, total: 1 }),
    );
  });

  it('emits test:result after each test', async () => {
    const suite = makeSuite({ tests: [makeApiTestCase({ name: 'Beta' })] });
    const onEvent = vi.fn();

    mockRunApiTestWithResponse.mockResolvedValue({
      result: makePassApiResult('Beta'),
      responseBody: null,
    });

    await runSuite(suite, onEvent);

    expect(onEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'test:result',
        result: expect.objectContaining({ name: 'Beta' }),
      }),
    );
  });

  it('emits suite:complete at the end with full summary', async () => {
    const suite = makeSuite({ tests: [makeApiTestCase({ name: 'Gamma' })] });
    const onEvent = vi.fn();

    mockRunApiTestWithResponse.mockResolvedValue({
      result: makePassApiResult('Gamma'),
      responseBody: null,
    });

    await runSuite(suite, onEvent);

    const completeEvent = onEvent.mock.calls.find(
      ([e]) => e.type === 'suite:complete',
    )?.[0];

    expect(completeEvent).toBeDefined();
    expect(completeEvent.summary).toBeDefined();
    expect(completeEvent.summary.suiteName).toBe('My Test Suite');
  });

  it('emits events for each test with correct index and total', async () => {
    const suite = makeSuite({
      tests: [
        makeApiTestCase({ name: 'Test 1' }),
        makeApiTestCase({ name: 'Test 2' }),
        makeApiTestCase({ name: 'Test 3' }),
      ],
    });
    const onEvent = vi.fn();

    mockRunApiTestWithResponse.mockResolvedValue({
      result: makePassApiResult('test'),
      responseBody: null,
    });

    await runSuite(suite, onEvent);

    const startEvents = onEvent.mock.calls.filter(([e]) => e.type === 'test:start');
    expect(startEvents).toHaveLength(3);
    expect(startEvents[0][0].index).toBe(0);
    expect(startEvents[0][0].total).toBe(3);
    expect(startEvents[2][0].index).toBe(2);
  });
});

// -----------------------------------------------------------------------------
// Variable chaining (interpolation + saveAs)
// -----------------------------------------------------------------------------

describe('runSuite() — variable chaining', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('populates baseUrl variable from suite.baseUrl', async () => {
    const loginCase = makeApiTestCase({
      name: 'Login',
      url: '{{baseUrl}}/auth/login',
    });
    const suite = makeSuite({
      baseUrl: 'https://api.example.com',
      tests: [loginCase],
    });
    const onEvent = vi.fn();

    mockRunApiTestWithResponse.mockResolvedValue({
      result: makePassApiResult('Login'),
      responseBody: null,
    });

    await runSuite(suite, onEvent);

    const call = mockRunApiTestWithResponse.mock.calls[0][0];
    expect(call.url).toBe('https://api.example.com/auth/login');
  });

  it('saves response variables and injects them into subsequent tests', async () => {
    const loginCase = makeApiTestCase({
      name: 'Login',
      url: 'https://api.example.com/login',
      saveAs: { authToken: '$.token' },
    });
    const profileCase = makeApiTestCase({
      name: 'Get Profile',
      url: 'https://api.example.com/profile',
      headers: { Authorization: 'Bearer {{authToken}}' },
    });

    const suite = makeSuite({ tests: [loginCase, profileCase] });
    const onEvent = vi.fn();

    mockRunApiTestWithResponse
      .mockResolvedValueOnce({
        result: makePassApiResult('Login'),
        responseBody: { token: 'secret-jwt' },
      })
      .mockResolvedValueOnce({
        result: makePassApiResult('Get Profile'),
        responseBody: null,
      });

    await runSuite(suite, onEvent);

    expect(mockRunApiTestWithResponse).toHaveBeenCalledTimes(2);
    const profileCall = mockRunApiTestWithResponse.mock.calls[1][0];
    expect(profileCall.headers?.Authorization).toBe('Bearer secret-jwt');
  });

  it('catches interpolation errors and records the test as error status', async () => {
    const testCase = makeApiTestCase({
      name: 'Missing Var',
      url: '{{undefinedVar}}/endpoint',
    });
    const suite = makeSuite({ tests: [testCase] });
    const onEvent = vi.fn();

    const summary = await runSuite(suite, onEvent);

    expect(mockRunApiTestWithResponse).not.toHaveBeenCalled();
    expect(summary.results[0].status).toBe('error');
    expect(summary.results[0].error).toMatch(/Unexpected error|interpolation/i);
  });
});

// -----------------------------------------------------------------------------
// Abort / cancel support
// -----------------------------------------------------------------------------

describe('runSuite() — abort signal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('skips remaining tests when abort signal fires after first test', async () => {
    const controller = new AbortController();
    const suite = makeSuite({
      tests: [
        makeApiTestCase({ name: 'Test 1' }),
        makeApiTestCase({ name: 'Test 2' }),
        makeApiTestCase({ name: 'Test 3' }),
      ],
    });
    const onEvent = vi.fn();

    // Abort after first test completes
    mockRunApiTestWithResponse.mockImplementationOnce(async () => {
      controller.abort();
      return { result: makePassApiResult('Test 1'), responseBody: null };
    });

    await runSuite(suite, onEvent, { abortSignal: controller.signal });

    expect(mockRunApiTestWithResponse).toHaveBeenCalledTimes(1);

    const skippedResults = onEvent.mock.calls
      .filter(([e]) => e.type === 'test:result' && e.result.status === 'skipped')
      .map(([e]) => e.result.name);

    expect(skippedResults).toContain('Test 2');
    expect(skippedResults).toContain('Test 3');
  });

  it('marks skipped tests in the summary', async () => {
    const controller = new AbortController();
    controller.abort(); // abort immediately

    const suite = makeSuite({
      tests: [
        makeApiTestCase({ name: 'Skipped 1' }),
        makeApiTestCase({ name: 'Skipped 2' }),
      ],
    });
    const onEvent = vi.fn();

    const summary = await runSuite(suite, onEvent, { abortSignal: controller.signal });

    expect(summary.skipped).toBe(2);
    expect(mockRunApiTestWithResponse).not.toHaveBeenCalled();
  });
});

// -----------------------------------------------------------------------------
// Summary calculation
// -----------------------------------------------------------------------------

describe('runSuite() — summary calculation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('counts passed, failed, and error results correctly', async () => {
    const suite = makeSuite({
      tests: [
        makeApiTestCase({ name: 'Pass' }),
        makeApiTestCase({ name: 'Fail' }),
        makeApiTestCase({ name: 'Error' }),
      ],
    });
    const onEvent = vi.fn();

    mockRunApiTestWithResponse
      .mockResolvedValueOnce({
        result: { name: 'Pass', type: 'api', status: 'pass', duration: 10 },
        responseBody: null,
      })
      .mockResolvedValueOnce({
        result: { name: 'Fail', type: 'api', status: 'fail', duration: 10 },
        responseBody: null,
      })
      .mockResolvedValueOnce({
        result: { name: 'Error', type: 'api', status: 'error', duration: 10 },
        responseBody: null,
      });

    const summary = await runSuite(suite, onEvent);

    expect(summary.total).toBe(3);
    expect(summary.passed).toBe(1);
    expect(summary.failed).toBe(2); // both 'fail' and 'error' count as failed
    expect(summary.skipped).toBe(0);
  });

  it('includes suiteName in the summary', async () => {
    const suite = makeSuite({ name: 'E2E Smoke Tests', tests: [] });
    const onEvent = vi.fn();

    const summary = await runSuite(suite, onEvent);

    expect(summary.suiteName).toBe('E2E Smoke Tests');
  });

  it('includes a duration in the summary', async () => {
    const suite = makeSuite({ tests: [] });
    const onEvent = vi.fn();

    const summary = await runSuite(suite, onEvent);

    expect(typeof summary.duration).toBe('number');
    expect(summary.duration).toBeGreaterThanOrEqual(0);
  });
});

// -----------------------------------------------------------------------------
// Playwright cleanup
// -----------------------------------------------------------------------------

describe('runSuite() — playwright browser cleanup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls closeBrowser after running UI tests', async () => {
    const uiCase = {
      name: 'UI Test',
      type: 'ui' as const,
      url: 'https://example.com',
      steps: [],
    };
    const suite = makeSuite({ tests: [uiCase] });
    const onEvent = vi.fn();

    mockRunUiTestWithPage.mockResolvedValue({
      result: { name: 'UI Test', type: 'ui', status: 'pass', duration: 100 },
      getText: null,
      cleanup: vi.fn().mockResolvedValue(undefined),
    });

    await runSuite(suite, onEvent);

    expect(mockCloseBrowser).toHaveBeenCalledTimes(1);
  });

  it('does not call closeBrowser when only API tests run', async () => {
    const suite = makeSuite({ tests: [makeApiTestCase({ name: 'API only' })] });
    const onEvent = vi.fn();

    mockRunApiTestWithResponse.mockResolvedValue({
      result: makePassApiResult('API only'),
      responseBody: null,
    });

    await runSuite(suite, onEvent);

    expect(mockCloseBrowser).not.toHaveBeenCalled();
  });
});
