// =============================================================================
// Suite Runner — Orchestrates test suite execution
// =============================================================================
// Ties together the api-runner, playwright-runner, and variable-interpolator
// to execute a full test suite sequentially with variable chaining, abort
// support, and per-test event streaming.
// =============================================================================

import type { BrowserContext } from 'playwright';
import type {
  TestSuite,
  TestCase,
  ApiTestCase,
  UiTestCase,
  TestResult,
  RunSummary,
  OnTestEvent,
} from './types.js';
import { interpolateObject, extractAndSave, extractTextAndSave } from './variable-interpolator.js';
import { runApiTestWithResponse } from './api-runner.js';
import { runUiTestWithPage, closeBrowser } from './playwright-runner.js';

// -----------------------------------------------------------------------------
// Validation
// -----------------------------------------------------------------------------

/** Validation errors for a test suite. Returns null if valid. */
function validateSuite(suite: unknown): string | null {
  if (suite === null || typeof suite !== 'object') {
    return 'Test suite must be a non-null object';
  }

  const s = suite as Record<string, unknown>;

  if (typeof s.name !== 'string' || s.name.trim().length === 0) {
    return 'Test suite requires a non-empty "name" string';
  }

  if (!Array.isArray(s.tests)) {
    return 'Test suite requires a "tests" array';
  }

  for (let i = 0; i < s.tests.length; i++) {
    const testCase = s.tests[i] as Record<string, unknown>;
    const prefix = `tests[${i}]`;

    if (typeof testCase.name !== 'string' || testCase.name.trim().length === 0) {
      return `${prefix}: requires a non-empty "name" string`;
    }

    if (testCase.type !== 'api' && testCase.type !== 'ui') {
      return `${prefix}: "type" must be "api" or "ui", got "${String(testCase.type)}"`;
    }

    if (typeof testCase.url !== 'string' || testCase.url.trim().length === 0) {
      return `${prefix}: requires a non-empty "url" string`;
    }

    if (testCase.type === 'api') {
      if (typeof testCase.method !== 'string' || testCase.method.trim().length === 0) {
        return `${prefix}: API test requires a non-empty "method" string`;
      }
      if (!Array.isArray(testCase.assertions)) {
        return `${prefix}: API test requires an "assertions" array`;
      }
    }

    if (testCase.type === 'ui') {
      if (!Array.isArray(testCase.steps)) {
        return `${prefix}: UI test requires a "steps" array`;
      }
    }
  }

  return null;
}

// -----------------------------------------------------------------------------
// Suite Runner Options
// -----------------------------------------------------------------------------

export interface SuiteRunnerOptions {
  /** AbortSignal to cancel the suite mid-execution. */
  abortSignal?: AbortSignal;
  /** When provided, UI tests run inside this browser context instead of launching a new browser.
   *  Used by the web server to share the preview browser with the test runner. */
  browserContext?: BrowserContext;
}

// -----------------------------------------------------------------------------
// Suite Runner
// -----------------------------------------------------------------------------

/**
 * Executes a complete test suite: validates the JSON, runs each test case
 * sequentially (routing to api-runner or playwright-runner), manages the
 * shared variable store for chaining, and emits events for each test.
 *
 * @param suite   The parsed test suite object
 * @param onEvent Callback to receive test execution events (for SSE streaming)
 * @param options Optional configuration (abort signal)
 * @returns       Aggregate run summary with per-test results
 */
export async function runSuite(
  suite: TestSuite,
  onEvent: OnTestEvent,
  options?: SuiteRunnerOptions,
): Promise<RunSummary> {
  const suiteStartTime = performance.now();

  // ---- Validate ----
  const validationError = validateSuite(suite);
  if (validationError) {
    onEvent({ type: 'suite:error', error: validationError });
    return buildEmptySummary(suite.name ?? 'unknown', suiteStartTime);
  }

  // ---- Initialize shared variable store ----
  const variables = new Map<string, unknown>();
  if (suite.baseUrl) {
    variables.set('baseUrl', suite.baseUrl);
  }

  const results: TestResult[] = [];
  let usedPlaywright = false;

  // ---- Execute tests sequentially ----
  for (let i = 0; i < suite.tests.length; i++) {
    const testCase = suite.tests[i];

    // Check abort before each test
    if (options?.abortSignal?.aborted) {
      const skippedResults = skipRemainingTests(suite.tests, i);
      results.push(...skippedResults);
      emitSkippedEvents(skippedResults, i, suite.tests.length, onEvent);
      break;
    }

    // Emit test:start
    onEvent({
      type: 'test:start',
      name: testCase.name,
      index: i,
      total: suite.tests.length,
    });

    let result: TestResult;

    try {
      // Interpolate all string fields with current variable store
      const interpolated = interpolateObject(testCase, variables) as TestCase;

      if (interpolated.type === 'api') {
        result = await executeApiTest(interpolated, variables);
      } else {
        usedPlaywright = true;
        result = await executeUiTest(interpolated, variables, options?.browserContext);
      }
    } catch (unexpectedError) {
      // Catch-all: never let one test crash the entire suite
      const errorMessage =
        unexpectedError instanceof Error
          ? unexpectedError.message
          : String(unexpectedError);

      result = {
        name: testCase.name,
        type: testCase.type,
        status: 'error',
        duration: 0,
        error: `Unexpected error: ${errorMessage}`,
      };
    }

    results.push(result);

    // Emit test:result
    onEvent({
      type: 'test:result',
      result,
      index: i,
      total: suite.tests.length,
    });
  }

  // ---- Cleanup ----
  // Only close the standalone browser when we launched it (no external context)
  if (usedPlaywright && !options?.browserContext) {
    await closeBrowser();
  }

  // ---- Build summary ----
  const summary = buildSummary(suite.name, results, suiteStartTime);

  onEvent({ type: 'suite:complete', summary });

  return summary;
}

// -----------------------------------------------------------------------------
// Test Executors (private)
// -----------------------------------------------------------------------------

/**
 * Runs an API test and handles saveAs variable extraction from the response.
 */
async function executeApiTest(
  testCase: ApiTestCase,
  variables: Map<string, unknown>,
): Promise<TestResult> {
  const { result, responseBody } = await runApiTestWithResponse(testCase);

  // Extract and save variables from response body when test passes or fails
  // (saveAs should still work even if assertions fail — the response was received)
  if (testCase.saveAs && responseBody !== null) {
    try {
      extractAndSave(testCase.saveAs, responseBody, variables);
    } catch (extractionError) {
      // If extraction fails, attach the error but don't override the test result
      const msg =
        extractionError instanceof Error
          ? extractionError.message
          : String(extractionError);
      result.error = result.error
        ? `${result.error}; saveAs extraction failed: ${msg}`
        : `saveAs extraction failed: ${msg}`;
    }
  }

  return result;
}

/**
 * Runs a UI test and handles saveAs variable extraction from the page DOM.
 */
async function executeUiTest(
  testCase: UiTestCase,
  variables: Map<string, unknown>,
  browserContext?: BrowserContext,
): Promise<TestResult> {
  const { result, getText, cleanup } = await runUiTestWithPage(testCase, { browserContext });

  // Extract and save variables from page DOM when test passes
  if (testCase.saveAs && getText) {
    try {
      await extractTextAndSave(testCase.saveAs, getText, variables);
    } catch (extractionError) {
      const msg =
        extractionError instanceof Error
          ? extractionError.message
          : String(extractionError);
      result.error = result.error
        ? `${result.error}; saveAs extraction failed: ${msg}`
        : `saveAs extraction failed: ${msg}`;
    }
  }

  // Always cleanup the browser context
  await cleanup();

  return result;
}

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

/** Creates skipped TestResults for all remaining tests from index onward. */
function skipRemainingTests(tests: TestCase[], fromIndex: number): TestResult[] {
  return tests.slice(fromIndex).map((test) => ({
    name: test.name,
    type: test.type,
    status: 'skipped' as const,
    duration: 0,
  }));
}

/** Emits test:start + test:result (skipped) events for skipped tests. */
function emitSkippedEvents(
  skippedResults: TestResult[],
  startIndex: number,
  total: number,
  onEvent: OnTestEvent,
): void {
  for (let j = 0; j < skippedResults.length; j++) {
    const index = startIndex + j;
    onEvent({ type: 'test:start', name: skippedResults[j].name, index, total });
    onEvent({ type: 'test:result', result: skippedResults[j], index, total });
  }
}

/** Builds the aggregate RunSummary from collected test results. */
function buildSummary(
  suiteName: string,
  results: TestResult[],
  startTime: number,
): RunSummary {
  return {
    suiteName,
    total: results.length,
    passed: results.filter((r) => r.status === 'pass').length,
    failed: results.filter((r) => r.status === 'fail' || r.status === 'error').length,
    skipped: results.filter((r) => r.status === 'skipped').length,
    duration: Math.round(performance.now() - startTime),
    results,
  };
}

/** Returns an empty summary for early exits (validation failure). */
function buildEmptySummary(suiteName: string, startTime: number): RunSummary {
  return {
    suiteName,
    total: 0,
    passed: 0,
    failed: 0,
    skipped: 0,
    duration: Math.round(performance.now() - startTime),
    results: [],
  };
}
