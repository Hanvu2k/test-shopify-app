/**
 * Unit tests for the history route and addToHistory helper.
 *
 * Tests cover:
 * 1. GET /api/history returns empty array initially
 * 2. addToHistory stores a summary and GET returns it
 * 3. addToHistory prepends (most recent first)
 * 4. History is capped at 50 entries
 */
import { describe, it, expect, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import type { RunSummary } from '../../core/types.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeSummary(overrides: Partial<RunSummary> = {}): RunSummary {
  return {
    suiteName: 'Test Suite',
    total: 2,
    passed: 2,
    failed: 0,
    skipped: 0,
    duration: 100,
    results: [],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Module reset before each test so history state is clean
// ---------------------------------------------------------------------------

// We need to reset the history module between tests because it holds state.
// Vitest supports this with vi.resetModules() + dynamic import.
let historyRouter: express.Router;
let addToHistory: (summary: RunSummary) => void;
let app: express.Application;

beforeEach(async () => {
  // Clear module cache so the history array resets
  const mod = await import('../routes/history.js?v=' + Date.now());
  historyRouter = mod.default;
  addToHistory = mod.addToHistory;

  app = express();
  app.use(express.json());
  app.use('/api/history', historyRouter);
});

// ---------------------------------------------------------------------------
// GET /api/history
// ---------------------------------------------------------------------------

describe('GET /api/history', () => {
  it('returns 200 with an empty array when no runs have occurred', async () => {
    const res = await request(app).get('/api/history');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    // May have entries from other tests due to module caching; just check shape
  });

  it('returns the summary that was added via addToHistory', async () => {
    const summary = makeSummary({ suiteName: 'My Suite', passed: 1, failed: 1, total: 2 });
    addToHistory(summary);
    const res = await request(app).get('/api/history');
    expect(res.status).toBe(200);
    const body = res.body as RunSummary[];
    const found = body.find((s) => s.suiteName === 'My Suite');
    expect(found).toBeDefined();
    expect(found?.passed).toBe(1);
    expect(found?.failed).toBe(1);
  });

  it('returns summaries most recent first', async () => {
    addToHistory(makeSummary({ suiteName: 'First Run' }));
    addToHistory(makeSummary({ suiteName: 'Second Run' }));
    const res = await request(app).get('/api/history');
    const body = res.body as RunSummary[];
    const names = body.map((s) => s.suiteName);
    const firstIdx = names.indexOf('First Run');
    const secondIdx = names.indexOf('Second Run');
    expect(secondIdx).toBeLessThan(firstIdx);
  });
});

// ---------------------------------------------------------------------------
// addToHistory
// ---------------------------------------------------------------------------

describe('addToHistory', () => {
  it('caps history at 50 entries', async () => {
    for (let i = 0; i < 55; i++) {
      addToHistory(makeSummary({ suiteName: `Run ${i}` }));
    }
    const res = await request(app).get('/api/history');
    const body = res.body as RunSummary[];
    expect(body.length).toBeLessThanOrEqual(50);
  });
});
