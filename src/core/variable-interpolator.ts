// =============================================================================
// Wishlist Tester — Variable Interpolation Engine
// =============================================================================
// Handles {{varName}} template replacement across all string fields in a test
// suite. Supports API response extraction via JSONPath and UI element text
// extraction via selector callbacks.
// =============================================================================

import { JSONPath } from 'jsonpath-plus';

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

const VARIABLE_PATTERN = /\{\{(\w+)\}\}/g;

// -----------------------------------------------------------------------------
// Core interpolation
// -----------------------------------------------------------------------------

/**
 * Replaces all {{varName}} occurrences in a template string with the
 * corresponding value from the variable store.
 *
 * Throws if any referenced variable is not present in the store.
 * Non-string values (objects, arrays) are JSON-serialised inline.
 */
export function interpolate(
  template: string,
  variables: Map<string, unknown>
): string {
  return template.replace(VARIABLE_PATTERN, (_match, varName: string) => {
    if (!variables.has(varName)) {
      throw new Error(
        `Variable interpolation error: "{{${varName}}}" is not defined. ` +
        `Available variables: [${[...variables.keys()].join(', ')}]`
      );
    }

    const value = variables.get(varName);

    if (value === null || value === undefined) {
      return String(value);
    }

    if (typeof value === 'object') {
      return JSON.stringify(value);
    }

    return String(value);
  });
}

// -----------------------------------------------------------------------------
// Recursive object interpolation
// -----------------------------------------------------------------------------

/**
 * Recursively walks an object/array and applies `interpolate` to every string
 * value found. Non-string primitives are returned as-is.
 *
 * Used to interpolate url, body, assertions, steps — any part of a test case.
 */
export function interpolateObject(
  obj: unknown,
  variables: Map<string, unknown>
): unknown {
  if (typeof obj === 'string') {
    return interpolate(obj, variables);
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => interpolateObject(item, variables));
  }

  if (obj !== null && typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      result[key] = interpolateObject(value, variables);
    }
    return result;
  }

  // Primitives (number, boolean, null, undefined) pass through unchanged
  return obj;
}

// -----------------------------------------------------------------------------
// API response extraction (JSONPath)
// -----------------------------------------------------------------------------

/**
 * Extracts values from an API response body using JSONPath expressions and
 * saves them into the variable store.
 *
 * FR4.1: saveAs: { varName: "<jsonpath>" }
 * Example saveAs: { "userId": "$.data.id" }
 *
 * @param saveAs   Map of variable name → JSONPath expression
 * @param data     Parsed response body (object/array)
 * @param variables Shared variable store to write into
 */
export function extractAndSave(
  saveAs: Record<string, string>,
  data: unknown,
  variables: Map<string, unknown>
): void {
  for (const [varName, jsonPath] of Object.entries(saveAs)) {
    const matches: unknown[] = JSONPath({ path: jsonPath, json: data as object });

    if (matches.length === 0) {
      throw new Error(
        `Variable extraction error: JSONPath "${jsonPath}" returned no matches ` +
        `while trying to save variable "${varName}".`
      );
    }

    // When a JSONPath expression targets a single value, use it directly.
    // When multiple matches exist, store them as an array.
    const extracted = matches.length === 1 ? matches[0] : matches;
    variables.set(varName, extracted);
  }
}

// -----------------------------------------------------------------------------
// UI element text extraction (Playwright selector)
// -----------------------------------------------------------------------------

/**
 * Extracts visible text from UI elements using a caller-supplied getText
 * callback (backed by Playwright) and saves results into the variable store.
 *
 * FR4.2: saveAs: { varName: "<selector>" }
 * Example saveAs: { "itemTitle": ".product-title" }
 *
 * @param saveAs   Map of variable name → CSS/Playwright selector
 * @param getText  Async callback that resolves the visible text for a selector
 * @param variables Shared variable store to write into
 */
export async function extractTextAndSave(
  saveAs: Record<string, string>,
  getText: (selector: string) => Promise<string>,
  variables: Map<string, unknown>
): Promise<void> {
  for (const [varName, selector] of Object.entries(saveAs)) {
    const text = await getText(selector);
    variables.set(varName, text);
  }
}
