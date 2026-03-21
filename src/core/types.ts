// =============================================================================
// Wishlist Tester - Core TypeScript Types
// =============================================================================

// -----------------------------------------------------------------------------
// Test Suite
// -----------------------------------------------------------------------------

/** Top-level test suite containing metadata and an ordered array of test cases */
export interface TestSuite {
  name: string;
  baseUrl?: string;
  tests: TestCase[];
}

// -----------------------------------------------------------------------------
// Test Cases
// -----------------------------------------------------------------------------

/** Shared fields for all test case types */
export interface TestCaseBase {
  name: string;
  type: 'api' | 'ui';
  url: string;
  /** Extract values from response/DOM for variable chaining: { varName: jsonpath-or-selector } */
  saveAs?: Record<string, string>;
}

/** API test case -- makes an HTTP request and runs assertions on the response */
export interface ApiTestCase extends TestCaseBase {
  type: 'api';
  method: string; // GET, POST, PUT, DELETE, PATCH, etc.
  body?: unknown;
  headers?: Record<string, string>;
  assertions: Assertion[];
}

/** UI test case -- drives a Playwright browser through a sequence of steps */
export interface UiTestCase extends TestCaseBase {
  type: 'ui';
  steps: UiStep[];
}

/** Discriminated union of all test case types */
export type TestCase = ApiTestCase | UiTestCase;

// -----------------------------------------------------------------------------
// Assertions (API tests)
// -----------------------------------------------------------------------------

/** An assertion to evaluate against an API response */
export interface Assertion {
  /** status = HTTP status code, bodyContains = substring match, jsonpath = JSONPath match */
  type: 'status' | 'bodyContains' | 'jsonpath';
  expected: unknown;
  /** JSONPath expression -- required when type is 'jsonpath' */
  path?: string;
}

// -----------------------------------------------------------------------------
// UI Steps (Playwright tests)
// -----------------------------------------------------------------------------

/** A single browser automation step */
export interface UiStep {
  action: 'click' | 'fill' | 'waitFor' | 'assertText' | 'navigate' | 'login' | 'logout';
  /** CSS or Playwright selector for the target element */
  selector?: string;
  /** Value to type into the element (fill action) */
  value?: string;
  /** Expected text content (assertText action) */
  expected?: string;
  /** Email for login action */
  email?: string;
  /** Password for login action */
  password?: string;
}

// -----------------------------------------------------------------------------
// Test Results
// -----------------------------------------------------------------------------

/** Result of a single test case execution */
export interface TestResult {
  name: string;
  type: 'api' | 'ui';
  status: 'pass' | 'fail' | 'error' | 'skipped';
  /** Execution duration in milliseconds */
  duration: number;
  assertions?: AssertionResult[];
  /** Error message when status is 'error' or 'fail' */
  error?: string;
  /** File path to screenshot captured on UI test failure */
  screenshot?: string;
}

/** Result of a single assertion evaluation */
export interface AssertionResult {
  type: string;
  expected: unknown;
  actual: unknown;
  passed: boolean;
}

// -----------------------------------------------------------------------------
// Run Summary
// -----------------------------------------------------------------------------

/** Aggregate summary for a complete test suite run */
export interface RunSummary {
  suiteName: string;
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  /** Total execution duration in milliseconds */
  duration: number;
  results: TestResult[];
}

// -----------------------------------------------------------------------------
// Event Streaming
// -----------------------------------------------------------------------------

/** Callback signature for receiving test execution events */
export type OnTestEvent = (event: TestEvent) => void;

/** Discriminated union of all events emitted during test execution */
export type TestEvent =
  | { type: 'test:start'; name: string; index: number; total: number }
  | { type: 'test:result'; result: TestResult; index: number; total: number }
  | { type: 'suite:complete'; summary: RunSummary }
  | { type: 'suite:error'; error: string };
