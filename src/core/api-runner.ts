// =============================================================================
// API Runner - Executes HTTP requests and evaluates assertions
// =============================================================================

import { JSONPath } from 'jsonpath-plus';
import type { ApiTestCase, TestResult, AssertionResult, Assertion } from './types.js';

const DEFAULT_CONTENT_TYPE = 'application/json';

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

function buildRequestInit(testCase: ApiTestCase): RequestInit {
  const headers: Record<string, string> = {
    'Content-Type': DEFAULT_CONTENT_TYPE,
    ...testCase.headers,
  };

  const init: RequestInit = {
    method: testCase.method,
    headers,
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

/**
 * Runs a single API test case: makes the HTTP request, evaluates all assertions,
 * and returns a TestResult with pass/fail status and per-assertion details.
 */
export async function runApiTest(testCase: ApiTestCase): Promise<TestResult> {
  const startTime = performance.now();

  try {
    const requestInit = buildRequestInit(testCase);
    const response = await fetch(testCase.url, requestInit);
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
    const duration = Math.round(performance.now() - startTime);
    const errorMessage =
      networkError instanceof Error ? networkError.message : String(networkError);

    return {
      name: testCase.name,
      type: 'api',
      status: 'error',
      duration,
      error: errorMessage,
    };
  }
}
