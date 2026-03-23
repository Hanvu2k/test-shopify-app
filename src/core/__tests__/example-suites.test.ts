// =============================================================================
// Validation Tests: Example Test Suite JSON Files (Sprint 4.1)
//
// Verifies that each example test suite file in test-suites/ can be parsed
// as valid JSON and conforms to the TestSuite schema defined in types.ts.
// =============================================================================

import { describe, it, expect, beforeAll } from 'vitest';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { TestSuite, ApiTestCase, UiTestCase } from '../types.js';

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

const SUITES_DIR = join(import.meta.dirname, '../../test-suites');

async function loadSuiteJson(filename: string): Promise<unknown> {
  const filePath = join(SUITES_DIR, filename);
  const raw = await readFile(filePath, 'utf-8');
  return JSON.parse(raw);
}

function assertIsTestSuite(value: unknown): asserts value is TestSuite {
  expect(value).toBeDefined();
  expect(typeof (value as TestSuite).name).toBe('string');
  expect((value as TestSuite).name.length).toBeGreaterThan(0);
  expect(Array.isArray((value as TestSuite).tests)).toBe(true);
}

function assertApiTestCase(tc: ApiTestCase): void {
  expect(tc.type).toBe('api');
  expect(typeof tc.name).toBe('string');
  expect(typeof tc.url).toBe('string');
  expect(typeof tc.method).toBe('string');
  expect(Array.isArray(tc.assertions)).toBe(true);
}

function assertUiTestCase(tc: UiTestCase): void {
  expect(tc.type).toBe('ui');
  expect(typeof tc.name).toBe('string');
  expect(typeof tc.url).toBe('string');
  expect(Array.isArray(tc.steps)).toBe(true);
}

// -----------------------------------------------------------------------------
// example-api-test.json
// -----------------------------------------------------------------------------

describe('example-api-test.json', () => {
  let suite: unknown;

  beforeAll(async () => {
    suite = await loadSuiteJson('example-api-test.json');
  });

  it('parses as valid JSON without throwing', () => {
    expect(suite).toBeDefined();
  });

  it('has a non-empty name field', () => {
    assertIsTestSuite(suite);
    expect((suite as TestSuite).name).toBe('API Test Example');
  });

  it('has a tests array with at least one test case', () => {
    assertIsTestSuite(suite);
    expect((suite as TestSuite).tests.length).toBeGreaterThan(0);
  });

  it('has a baseUrl field for variable interpolation', () => {
    assertIsTestSuite(suite);
    expect(typeof (suite as TestSuite).baseUrl).toBe('string');
  });

  it('first test case is a valid API test with assertions', () => {
    assertIsTestSuite(suite);
    const firstTest = (suite as TestSuite).tests[0] as ApiTestCase;
    assertApiTestCase(firstTest);
    expect(firstTest.assertions.length).toBeGreaterThan(0);
  });

  it('first test case uses baseUrl variable interpolation', () => {
    assertIsTestSuite(suite);
    const firstTest = (suite as TestSuite).tests[0];
    expect(firstTest.url).toContain('{{baseUrl}}');
  });

  it('first test case has a saveAs field for variable chaining', () => {
    assertIsTestSuite(suite);
    const firstTest = (suite as TestSuite).tests[0];
    expect(firstTest.saveAs).toBeDefined();
    expect(typeof firstTest.saveAs).toBe('object');
  });

  it('second test case uses a saved variable in its body', () => {
    assertIsTestSuite(suite);
    const secondTest = (suite as TestSuite).tests[1] as ApiTestCase;
    assertApiTestCase(secondTest);
    // Body should reference a saved variable
    const bodyStr = JSON.stringify(secondTest.body);
    expect(bodyStr).toMatch(/\{\{.*\}\}/);
  });

  it('all test cases have valid type field (api or ui)', () => {
    assertIsTestSuite(suite);
    for (const tc of (suite as TestSuite).tests) {
      expect(['api', 'ui']).toContain(tc.type);
    }
  });

  it('all API test cases have a method field', () => {
    assertIsTestSuite(suite);
    for (const tc of (suite as TestSuite).tests) {
      if (tc.type === 'api') {
        const apiTc = tc as ApiTestCase;
        expect(typeof apiTc.method).toBe('string');
        expect(apiTc.method.length).toBeGreaterThan(0);
      }
    }
  });

  it('all assertions have a type and expected field', () => {
    assertIsTestSuite(suite);
    for (const tc of (suite as TestSuite).tests) {
      if (tc.type === 'api') {
        const apiTc = tc as ApiTestCase;
        for (const assertion of apiTc.assertions) {
          expect(['status', 'bodyContains', 'jsonpath']).toContain(assertion.type);
          expect(assertion.expected).toBeDefined();
        }
      }
    }
  });
});

// -----------------------------------------------------------------------------
// example-ui-test.json
// -----------------------------------------------------------------------------

describe('example-ui-test.json', () => {
  let suite: unknown;

  beforeAll(async () => {
    suite = await loadSuiteJson('example-ui-test.json');
  });

  it('parses as valid JSON without throwing', () => {
    expect(suite).toBeDefined();
  });

  it('has a non-empty name field', () => {
    assertIsTestSuite(suite);
    expect((suite as TestSuite).name).toBe('UI Test Example');
  });

  it('has a tests array with at least one test case', () => {
    assertIsTestSuite(suite);
    expect((suite as TestSuite).tests.length).toBeGreaterThan(0);
  });

  it('first test case is a valid UI test with steps', () => {
    assertIsTestSuite(suite);
    const firstTest = (suite as TestSuite).tests[0] as UiTestCase;
    assertUiTestCase(firstTest);
    expect(firstTest.steps.length).toBeGreaterThan(0);
  });

  it('all UI steps have an action field', () => {
    assertIsTestSuite(suite);
    for (const tc of (suite as TestSuite).tests) {
      if (tc.type === 'ui') {
        const uiTc = tc as UiTestCase;
        for (const step of uiTc.steps) {
          expect(typeof step.action).toBe('string');
          expect(['click', 'fill', 'waitFor', 'assertText', 'navigate', 'login', 'logout']).toContain(
            step.action,
          );
        }
      }
    }
  });

  it('assertText steps have an expected field', () => {
    assertIsTestSuite(suite);
    for (const tc of (suite as TestSuite).tests) {
      if (tc.type === 'ui') {
        const uiTc = tc as UiTestCase;
        for (const step of uiTc.steps) {
          if (step.action === 'assertText') {
            expect(step.expected).toBeDefined();
          }
        }
      }
    }
  });

  it('click, fill, waitFor, and assertText steps have a selector field', () => {
    assertIsTestSuite(suite);
    for (const tc of (suite as TestSuite).tests) {
      if (tc.type === 'ui') {
        const uiTc = tc as UiTestCase;
        for (const step of uiTc.steps) {
          if (['click', 'fill', 'waitFor', 'assertText'].includes(step.action)) {
            expect(typeof step.selector).toBe('string');
            expect(step.selector!.length).toBeGreaterThan(0);
          }
        }
      }
    }
  });

  it('all test cases have valid type field', () => {
    assertIsTestSuite(suite);
    for (const tc of (suite as TestSuite).tests) {
      expect(['api', 'ui']).toContain(tc.type);
    }
  });
});

// -----------------------------------------------------------------------------
// example-mixed-test.json
// -----------------------------------------------------------------------------

describe('example-mixed-test.json', () => {
  let suite: unknown;

  beforeAll(async () => {
    suite = await loadSuiteJson('example-mixed-test.json');
  });

  it('parses as valid JSON without throwing', () => {
    expect(suite).toBeDefined();
  });

  it('has a non-empty name field', () => {
    assertIsTestSuite(suite);
    expect((suite as TestSuite).name).toBe('Mixed Test with Variable Chaining');
  });

  it('has a baseUrl field', () => {
    assertIsTestSuite(suite);
    expect(typeof (suite as TestSuite).baseUrl).toBe('string');
  });

  it('has a tests array with at least two test cases', () => {
    assertIsTestSuite(suite);
    expect((suite as TestSuite).tests.length).toBeGreaterThanOrEqual(2);
  });

  it('contains at least one API test case', () => {
    assertIsTestSuite(suite);
    const apiTests = (suite as TestSuite).tests.filter((t) => t.type === 'api');
    expect(apiTests.length).toBeGreaterThan(0);
  });

  it('contains at least one UI test case', () => {
    assertIsTestSuite(suite);
    const uiTests = (suite as TestSuite).tests.filter((t) => t.type === 'ui');
    expect(uiTests.length).toBeGreaterThan(0);
  });

  it('API test case has saveAs for variable chaining', () => {
    assertIsTestSuite(suite);
    const apiTests = (suite as TestSuite).tests.filter((t) => t.type === 'api');
    const apiWithSave = apiTests.filter((t) => t.saveAs !== undefined);
    expect(apiWithSave.length).toBeGreaterThan(0);
  });

  it('API test case saveAs values are valid JSONPath expressions', () => {
    assertIsTestSuite(suite);
    for (const tc of (suite as TestSuite).tests) {
      if (tc.type === 'api' && tc.saveAs) {
        for (const [_varName, path] of Object.entries(tc.saveAs)) {
          // JSONPath expressions start with $
          expect(path).toMatch(/^\$/);
        }
      }
    }
  });

  it('all API test cases are structurally valid', () => {
    assertIsTestSuite(suite);
    for (const tc of (suite as TestSuite).tests) {
      if (tc.type === 'api') {
        assertApiTestCase(tc as ApiTestCase);
      }
    }
  });

  it('all UI test cases are structurally valid', () => {
    assertIsTestSuite(suite);
    for (const tc of (suite as TestSuite).tests) {
      if (tc.type === 'ui') {
        assertUiTestCase(tc as UiTestCase);
      }
    }
  });

  it('demonstrates all features: API + UI + variable chaining', () => {
    assertIsTestSuite(suite);
    const typedSuite = suite as TestSuite;
    const hasApi = typedSuite.tests.some((t) => t.type === 'api');
    const hasUi = typedSuite.tests.some((t) => t.type === 'ui');
    const hasVariableChain = typedSuite.tests.some((t) => t.saveAs !== undefined);

    expect(hasApi).toBe(true);
    expect(hasUi).toBe(true);
    expect(hasVariableChain).toBe(true);
  });
});
