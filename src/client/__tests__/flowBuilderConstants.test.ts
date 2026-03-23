// =============================================================================
// Unit Tests: FlowBuilder - constants.ts
// =============================================================================

import { describe, it, expect } from 'vitest';
import { BLOCK_TYPES, BLOCK_TYPE_MAP } from '../components/FlowBuilder/constants';
import type { BlockType } from '../components/FlowBuilder/types';

// All 7 expected block types
const ALL_BLOCK_TYPES: BlockType[] = [
  'click',
  'fill',
  'waitFor',
  'assertText',
  'navigate',
  'login',
  'logout',
];

// =============================================================================
// BLOCK_TYPES array
// =============================================================================

describe('BLOCK_TYPES array', () => {
  it('defines exactly 7 block types', () => {
    expect(BLOCK_TYPES).toHaveLength(7);
  });

  it('contains all 7 expected block types', () => {
    const definedTypes = BLOCK_TYPES.map((b) => b.type);
    for (const expectedType of ALL_BLOCK_TYPES) {
      expect(definedTypes).toContain(expectedType);
    }
  });

  it('each block type definition has a non-empty label', () => {
    for (const block of BLOCK_TYPES) {
      expect(block.label).toBeTruthy();
      expect(typeof block.label).toBe('string');
    }
  });

  it('each block type definition has a non-empty icon', () => {
    for (const block of BLOCK_TYPES) {
      expect(block.icon).toBeTruthy();
      expect(typeof block.icon).toBe('string');
    }
  });

  it('each block type definition has a non-empty color', () => {
    for (const block of BLOCK_TYPES) {
      expect(block.color).toBeTruthy();
      expect(typeof block.color).toBe('string');
    }
  });

  it('each block type definition has a fields array', () => {
    for (const block of BLOCK_TYPES) {
      expect(Array.isArray(block.fields)).toBe(true);
    }
  });

  it('each block type definition has at least one field', () => {
    for (const block of BLOCK_TYPES) {
      expect(block.fields.length).toBeGreaterThan(0);
    }
  });

  it('each field has required properties: key, label, type, placeholder, required', () => {
    for (const block of BLOCK_TYPES) {
      for (const field of block.fields) {
        expect(field).toHaveProperty('key');
        expect(field).toHaveProperty('label');
        expect(field).toHaveProperty('type');
        expect(field).toHaveProperty('placeholder');
        expect(field).toHaveProperty('required');
      }
    }
  });

  it('each field type is either "text" or "password"', () => {
    for (const block of BLOCK_TYPES) {
      for (const field of block.fields) {
        expect(['text', 'password']).toContain(field.type);
      }
    }
  });
});

// =============================================================================
// Individual block type definitions
// =============================================================================

describe('click block definition', () => {
  const block = BLOCK_TYPES.find((b) => b.type === 'click')!;

  it('is defined', () => {
    expect(block).toBeDefined();
  });

  it('has label "Click"', () => {
    expect(block.label).toBe('Click');
  });

  it('has a selector field', () => {
    const selectorField = block.fields.find((f) => f.key === 'selector');
    expect(selectorField).toBeDefined();
  });

  it('selector field is required', () => {
    const selectorField = block.fields.find((f) => f.key === 'selector');
    expect(selectorField?.required).toBe(true);
  });
});

describe('fill block definition', () => {
  const block = BLOCK_TYPES.find((b) => b.type === 'fill')!;

  it('is defined', () => {
    expect(block).toBeDefined();
  });

  it('has 2 fields: selector and value', () => {
    expect(block.fields).toHaveLength(2);
    const keys = block.fields.map((f) => f.key);
    expect(keys).toContain('selector');
    expect(keys).toContain('value');
  });

  it('both fields are required', () => {
    for (const field of block.fields) {
      expect(field.required).toBe(true);
    }
  });
});

describe('waitFor block definition', () => {
  const block = BLOCK_TYPES.find((b) => b.type === 'waitFor')!;

  it('is defined', () => {
    expect(block).toBeDefined();
  });

  it('has a selector field', () => {
    const selectorField = block.fields.find((f) => f.key === 'selector');
    expect(selectorField).toBeDefined();
  });
});

describe('assertText block definition', () => {
  const block = BLOCK_TYPES.find((b) => b.type === 'assertText')!;

  it('is defined', () => {
    expect(block).toBeDefined();
  });

  it('has 2 fields: selector and expected', () => {
    expect(block.fields).toHaveLength(2);
    const keys = block.fields.map((f) => f.key);
    expect(keys).toContain('selector');
    expect(keys).toContain('expected');
  });
});

describe('navigate block definition', () => {
  const block = BLOCK_TYPES.find((b) => b.type === 'navigate')!;

  it('is defined', () => {
    expect(block).toBeDefined();
  });

  it('has a url field', () => {
    const urlField = block.fields.find((f) => f.key === 'url');
    expect(urlField).toBeDefined();
    expect(urlField?.required).toBe(true);
  });
});

describe('login block definition', () => {
  const block = BLOCK_TYPES.find((b) => b.type === 'login')!;

  it('is defined', () => {
    expect(block).toBeDefined();
  });

  it('has 2 fields: email and password', () => {
    expect(block.fields).toHaveLength(2);
    const keys = block.fields.map((f) => f.key);
    expect(keys).toContain('email');
    expect(keys).toContain('password');
  });

  it('password field type is "password"', () => {
    const passwordField = block.fields.find((f) => f.key === 'password');
    expect(passwordField?.type).toBe('password');
  });
});

describe('logout block definition', () => {
  const block = BLOCK_TYPES.find((b) => b.type === 'logout')!;

  it('is defined', () => {
    expect(block).toBeDefined();
  });

  it('has a selector field', () => {
    const selectorField = block.fields.find((f) => f.key === 'selector');
    expect(selectorField).toBeDefined();
  });

  it('selector field is not required (optional logout button)', () => {
    const selectorField = block.fields.find((f) => f.key === 'selector');
    expect(selectorField?.required).toBe(false);
  });
});

// =============================================================================
// BLOCK_TYPE_MAP
// =============================================================================

describe('BLOCK_TYPE_MAP', () => {
  it('has entries for all 7 block types', () => {
    for (const type of ALL_BLOCK_TYPES) {
      expect(BLOCK_TYPE_MAP.has(type)).toBe(true);
    }
  });

  it('returns the correct definition for each block type', () => {
    for (const type of ALL_BLOCK_TYPES) {
      const definition = BLOCK_TYPE_MAP.get(type);
      expect(definition).toBeDefined();
      expect(definition?.type).toBe(type);
    }
  });

  it('has exactly 7 entries', () => {
    expect(BLOCK_TYPE_MAP.size).toBe(7);
  });

  it('map definitions match BLOCK_TYPES array definitions', () => {
    for (const block of BLOCK_TYPES) {
      const mapped = BLOCK_TYPE_MAP.get(block.type);
      expect(mapped).toBe(block);
    }
  });
});
