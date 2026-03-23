// =============================================================================
// API Runner - Executes HTTP requests and evaluates assertions
// =============================================================================

import { JSONPath } from 'jsonpath-plus';
import type { ApiTestCase, TestResult, AssertionResult, Assertion } from './types.js';

const DEFAULT_CONTENT_TYPE = 'application/json';
const DEFAULT_TIMEOUT_MS = 30_000;

// -----------------------------------------------------------------------------
// Types
// -----------------------------------------------------------------------------

interface ParsedResponse {
  status: number;
  bodyText: string;
  bodyJson: unknown;
}

// -----------------------------------------------------------------------------
// Assertion Evaluators
// -----------------------------------------------------------------------------

function evaluateStatusAssertion(
  assertion: Assertion,
  response: ParsedResponse,
): AssertionResult {
  const actual = response.status;
  return {
    type: assertion.type,
    expected: assertion.expected,
    actual,
    passed: actual === assertion.expected,
  };
}

function evaluateBodyContainsAssertion(
  assertion: Assertion,
  response: ParsedResponse,
): AssertionResult {
  const searchString = String(assertion.expected);
  const actual = response.bodyText.includes(searchString);
  return {
    type: assertion.type,
    expected: assertion.expected,
    actual: actual ? assertion.expected : `not found in body`,
    passed: actual,
  };
}

function evaluateJsonPathAssertion(
  assertion: Assertion,
  response: ParsedResponse,
): AssertionResult {
  if (!assertion.path) {
    return {
      type: assertion.type,
      expected: assertion.expected,
      actual: 'missing path field for jsonpath assertion',
      passed: false,
    };
  }

  if (response.bodyJson === null) {
    return {
      type: assertion.type,
      expected: assertion.expected,
      actual: 'response body is not valid JSON',
      passed: false,
    };
  }

  const results = JSONPath({ path: assertion.path, json: response.bodyJson as object });
  // JSONPath returns an array of matches; use first match for comparison
  const actual = results.length > 0 ? results[0] : undefined;
  const passed = actual === assertion.expected;

  return {
    type: assertion.type,
    expected: assertion.expected,
    actual,
    passed,
  };
}

function evaluateAssertion(assertion: Assertion, response: ParsedResponse): AssertionResult {
  switch (assertion.type) {
    case 'status':
      return evaluateStatusAssertion(assertion, response);
    case 'bodyContains':
      return evaluateBodyContainsAssertion(assertion, response);
    case 'jsonpath':
      return evaluateJsonPathAssertion(assertion, response);
    default: {
      const exhaustiveCheck: never = assertion.type;
      return {
        type: exhaustiveCheck,
        expected: assertion.expected,
        actual: `unknown assertion type: ${exhaustiveCheck}`,
        passed: false,
      };
    }
  }
}

// -----------------------------------------------------------------------------
// Request Builder
// -----------------------------------------------------------------------------

function buildRequestInit(testCase: ApiTestCase, signal: AbortSignal): RequestInit {
  const headers: Record<string, string> = {
    'Content-Type': DEFAULT_CONTENT_TYPE,
    ...testCase.headers,
  };

  const init: RequestInit = {
    method: testCase.method,
    headers,
    signal,
  };

  if (testCase.body !== undefined) {
    init.body = JSON.stringify(testCase.body);
  }

  return init;
}

// -----------------------------------------------------------------------------
// Response Parser
// -----------------------------------------------------------------------------

async function parseResponse(response: Response): Promise<ParsedResponse> {
  const bodyText = await response.text();

  let bodyJson: unknown = null;
  try {
    bodyJson = JSON.parse(bodyText);
  } catch {
    // Non-JSON response — bodyJson stays null
  }

  return {
    status: response.status,
    bodyText,
    bodyJson,
  };
}

// -----------------------------------------------------------------------------
// Public API
// -----------------------------------------------------------------------------

/** Combined result containing both the TestResult and the raw parsed response body. */
export interface ApiTestResultWithResponse {
  result: TestResult;
  /** Parsed JSON body (or null if non-JSON). Used by suite-runner for saveAs extraction. */
  responseBody: unknown;
}

/**
 * Runs a single API test case and returns both the TestResult and the raw
 * parsed response body. The suite-runner uses the response body for saveAs
 * variable extraction via the variable-interpolator.
 */
export async function runApiTestWithResponse(
  testCase: ApiTestCase,
): Promise<ApiTestResultWithResponse> {
  const startTime = performance.now();
  const timeoutMs = testCase.timeout ?? DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const requestInit = buildRequestInit(testCase, controller.signal);
    const response = await fetch(testCase.url, requestInit);
    clearTimeout(timeoutId);
    const parsedResponse = await parseResponse(response);

    const assertionResults = testCase.assertions.map((assertion) =>
      evaluateAssertion(assertion, parsedResponse),
    );

    const allPassed = assertionResults.every((r) => r.passed);
    const duration = Math.round(performance.now() - startTime);

    return {
      result: {
        name: testCase.name,
        type: 'api',
        status: allPassed ? 'pass' : 'fail',
        duration,
        assertions: assertionResults,
      },
      responseBody: parsedResponse.bodyJson,
    };
  } catch (networkError) {
    clearTimeout(timeoutId);
    const duration = Math.round(performance.now() - startTime);
    const isTimeout =
      networkError instanceof Error && networkError.name === 'AbortError';
    const errorMessage = isTimeout
      ? `Request timed out after ${timeoutMs}ms`
      : networkError instanceof Error
        ? networkError.message
        : String(networkError);

    return {
      result: {
        name: testCase.name,
        type: 'api',
        status: 'error',
        duration,
        error: errorMessage,
      },
      responseBody: null,
    };
  }
}

/**
 * Runs a single API test case: makes the HTTP request, evaluates all assertions,
 * and returns a TestResult with pass/fail status and per-assertion details.
 */
export async function runApiTest(testCase: ApiTestCase): Promise<TestResult> {
  const startTime = performance.now();
  const timeoutMs = testCase.timeout ?? DEFAULT_TIMEOUT_MS;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const requestInit = buildRequestInit(testCase, controller.signal);
    const response = await fetch(testCase.url, requestInit);
    clearTimeout(timeoutId);
    const parsedResponse = await parseResponse(response);

    const assertionResults = testCase.assertions.map((assertion) =>
      evaluateAssertion(assertion, parsedResponse),
    );

    const allPassed = assertionResults.every((result) => result.passed);
    const duration = Math.round(performance.now() - startTime);

    return {
      name: testCase.name,
      type: 'api',
      status: allPassed ? 'pass' : 'fail',
      duration,
      assertions: assertionResults,
    };
  } catch (networkError) {
    clearTimeout(timeoutId);
    const duration = Math.round(performance.now() - startTime);
    const isTimeout =
      networkError instanceof Error && networkError.name === 'AbortError';
    const errorMessage = isTimeout
      ? `Request timed out after ${timeoutMs}ms`
      : networkError instanceof Error
        ? networkError.message
        : String(networkError);

    return {
      name: testCase.name,
      type: 'api',
      status: 'error',
      duration,
      error: errorMessage,
    };
  }
}
