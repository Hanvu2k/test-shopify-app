// =============================================================================
// Unit Tests: Variable Interpolator
// =============================================================================

import { describe, it, expect, vi } from 'vitest';
import {
  interpolate,
  interpolateObject,
  extractAndSave,
  extractTextAndSave,
} from '../variable-interpolator.js';

// -----------------------------------------------------------------------------
// interpolate()
// -----------------------------------------------------------------------------

describe('interpolate()', () => {
  it('replaces a single {{varName}} placeholder', () => {
    const vars = new Map<string, unknown>([['token', 'abc123']]);
    expect(interpolate('Bearer {{token}}', vars)).toBe('Bearer abc123');
  });

  it('replaces multiple different placeholders in one string', () => {
    const vars = new Map<string, unknown>([
      ['first', 'John'],
      ['last', 'Doe'],
    ]);
    expect(interpolate('{{first}} {{last}}', vars)).toBe('John Doe');
  });

  it('replaces the same placeholder appearing more than once', () => {
    const vars = new Map<string, unknown>([['id', '42']]);
    expect(interpolate('/items/{{id}}/reviews/{{id}}', vars)).toBe('/items/42/reviews/42');
  });

  it('returns the template unchanged when there are no placeholders', () => {
    const vars = new Map<string, unknown>([['id', '1']]);
    expect(interpolate('https://api.example.com/health', vars)).toBe(
      'https://api.example.com/health',
    );
  });

  it('serialises an object value as JSON inline', () => {
    const body = { key: 'value' };
    const vars = new Map<string, unknown>([['payload', body]]);
    expect(interpolate('{{payload}}', vars)).toBe(JSON.stringify(body));
  });

  it('serialises an array value as JSON inline', () => {
    const arr = [1, 2, 3];
    const vars = new Map<string, unknown>([['ids', arr]]);
    expect(interpolate('ids={{ids}}', vars)).toBe('ids=[1,2,3]');
  });

  it('converts a numeric value to string', () => {
    const vars = new Map<string, unknown>([['count', 7]]);
    expect(interpolate('count={{count}}', vars)).toBe('count=7');
  });

  it('converts a boolean value to string', () => {
    const vars = new Map<string, unknown>([['flag', true]]);
    expect(interpolate('flag={{flag}}', vars)).toBe('flag=true');
  });

  it('converts null to the string "null"', () => {
    const vars = new Map<string, unknown>([['val', null]]);
    expect(interpolate('val={{val}}', vars)).toBe('val=null');
  });

  it('converts undefined to the string "undefined"', () => {
    const vars = new Map<string, unknown>([['val', undefined]]);
    expect(interpolate('val={{val}}', vars)).toBe('val=undefined');
  });

  it('throws an error when a referenced variable is not in the store', () => {
    const vars = new Map<string, unknown>([['other', '123']]);
    expect(() => interpolate('Hello {{missing}}', vars)).toThrow(
      /Variable interpolation error.*"{{missing}}" is not defined/,
    );
  });

  it('error message lists available variables when one is missing', () => {
    const vars = new Map<string, unknown>([['userId', '1'], ['token', 'abc']]);
    expect(() => interpolate('{{unknown}}', vars)).toThrow(/userId.*token|token.*userId/);
  });

  it('handles an empty variable store gracefully when no placeholders exist', () => {
    const vars = new Map<string, unknown>();
    expect(interpolate('static text', vars)).toBe('static text');
  });
});

// -----------------------------------------------------------------------------
// interpolateObject()
// -----------------------------------------------------------------------------

describe('interpolateObject()', () => {
  it('interpolates a top-level string value', () => {
    const vars = new Map<string, unknown>([['baseUrl', 'https://api.example.com']]);
    expect(interpolateObject('{{baseUrl}}/items', vars)).toBe('https://api.example.com/items');
  });

  it('recursively interpolates strings inside an object', () => {
    const vars = new Map<string, unknown>([['id', '99']]);
    const obj = { url: '/items/{{id}}', label: 'Item {{id}}' };
    expect(interpolateObject(obj, vars)).toEqual({ url: '/items/99', label: 'Item 99' });
  });

  it('recursively interpolates strings inside an array', () => {
    const vars = new Map<string, unknown>([['env', 'staging']]);
    const arr = ['{{env}}-host', 'plain-string'];
    expect(interpolateObject(arr, vars)).toEqual(['staging-host', 'plain-string']);
  });

  it('handles nested objects and arrays together', () => {
    const vars = new Map<string, unknown>([['token', 'xyz']]);
    const input = {
      headers: { Authorization: 'Bearer {{token}}' },
      tags: ['{{token}}', 'static'],
    };
    expect(interpolateObject(input, vars)).toEqual({
      headers: { Authorization: 'Bearer xyz' },
      tags: ['xyz', 'static'],
    });
  });

  it('passes numeric primitives through unchanged', () => {
    const vars = new Map<string, unknown>();
    expect(interpolateObject(42, vars)).toBe(42);
  });

  it('passes boolean primitives through unchanged', () => {
    const vars = new Map<string, unknown>();
    expect(interpolateObject(false, vars)).toBe(false);
  });

  it('passes null through unchanged', () => {
    const vars = new Map<string, unknown>();
    expect(interpolateObject(null, vars)).toBeNull();
  });

  it('passes undefined through unchanged', () => {
    const vars = new Map<string, unknown>();
    expect(interpolateObject(undefined, vars)).toBeUndefined();
  });

  it('throws when a nested string references an undefined variable', () => {
    const vars = new Map<string, unknown>();
    expect(() => interpolateObject({ url: '{{missing}}' }, vars)).toThrow(
      /Variable interpolation error/,
    );
  });
});

// -----------------------------------------------------------------------------
// extractAndSave()
// -----------------------------------------------------------------------------

describe('extractAndSave()', () => {
  it('extracts a simple JSONPath value and saves it', () => {
    const vars = new Map<string, unknown>();
    const data = { data: { id: 42 } };
    extractAndSave({ userId: '$.data.id' }, data, vars);
    expect(vars.get('userId')).toBe(42);
  });

  it('extracts multiple variables from one response', () => {
    const vars = new Map<string, unknown>();
    const data = { user: { id: 1, name: 'Alice' } };
    extractAndSave({ userId: '$.user.id', userName: '$.user.name' }, data, vars);
    expect(vars.get('userId')).toBe(1);
    expect(vars.get('userName')).toBe('Alice');
  });

  it('stores an array when JSONPath matches multiple values', () => {
    const vars = new Map<string, unknown>();
    const data = { items: [{ id: 1 }, { id: 2 }] };
    extractAndSave({ ids: '$.items[*].id' }, data, vars);
    expect(vars.get('ids')).toEqual([1, 2]);
  });

  it('stores a single value (not array) when JSONPath matches exactly one result', () => {
    const vars = new Map<string, unknown>();
    const data = { token: 'bearer-token-123' };
    extractAndSave({ authToken: '$.token' }, data, vars);
    expect(vars.get('authToken')).toBe('bearer-token-123');
  });

  it('throws a descriptive error when JSONPath returns no matches', () => {
    const vars = new Map<string, unknown>();
    const data = { other: 'value' };
    expect(() => extractAndSave({ missing: '$.nonexistent' }, data, vars)).toThrow(
      /Variable extraction error.*\$\.nonexistent.*missing/,
    );
  });

  it('overwrites an existing variable with a new extracted value', () => {
    const vars = new Map<string, unknown>([['userId', 'old']]);
    const data = { id: 'new' };
    extractAndSave({ userId: '$.id' }, data, vars);
    expect(vars.get('userId')).toBe('new');
  });
});

// -----------------------------------------------------------------------------
// extractTextAndSave()
// -----------------------------------------------------------------------------

describe('extractTextAndSave()', () => {
  it('calls getText with each selector and saves the returned text', async () => {
    const vars = new Map<string, unknown>();
    const getText = vi.fn().mockImplementation((selector: string) => {
      if (selector === '.title') return Promise.resolve('My Product');
      if (selector === '.price') return Promise.resolve('$9.99');
      return Promise.resolve('');
    });

    await extractTextAndSave({ itemTitle: '.title', itemPrice: '.price' }, getText, vars);

    expect(vars.get('itemTitle')).toBe('My Product');
    expect(vars.get('itemPrice')).toBe('$9.99');
    expect(getText).toHaveBeenCalledWith('.title');
    expect(getText).toHaveBeenCalledWith('.price');
  });

  it('saves an empty string when getText returns an empty string', async () => {
    const vars = new Map<string, unknown>();
    const getText = vi.fn().mockResolvedValue('');

    await extractTextAndSave({ emptyField: '.missing' }, getText, vars);

    expect(vars.get('emptyField')).toBe('');
  });

  it('does nothing when saveAs map is empty', async () => {
    const vars = new Map<string, unknown>();
    const getText = vi.fn();

    await extractTextAndSave({}, getText, vars);

    expect(getText).not.toHaveBeenCalled();
    expect(vars.size).toBe(0);
  });
});
