/**
 * Integration test: POST /api/suites/:name → save → GET /api/suites → verify
 *
 * Uses a real temporary directory (no mocking) to exercise the full
 * file-system path through the suites router.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import express from 'express';
import request from 'supertest';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import os from 'node:os';

// ---------------------------------------------------------------------------
// We need to point the suites router to a temp directory.
// The router resolves SUITES_DIR from process.cwd() at module load time,
// so we override process.cwd() before importing.
// ---------------------------------------------------------------------------

let tempDir: string;
let savedCwd: () => string;

let app: express.Application;

beforeAll(async () => {
  // Create a temp directory to act as the project root
  tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'wishlist-tester-suites-'));

  // Override process.cwd to point to the temp dir
  savedCwd = process.cwd.bind(process);
  process.cwd = () => tempDir;

  // Import router AFTER overriding cwd
  const { default: suitesRouter } = await import('../routes/suites.js?integration=' + Date.now());

  app = express();
  app.use(express.json());
  app.use('/api/suites', suitesRouter);
});

afterAll(async () => {
  // Restore cwd
  process.cwd = savedCwd;
  // Clean up temp directory
  await fs.rm(tempDir, { recursive: true, force: true });
});

// ---------------------------------------------------------------------------
// Integration: save then retrieve
// ---------------------------------------------------------------------------

describe('Suites save-and-retrieve integration', () => {
  const suiteName = 'integration-test';
  const suitePayload = {
    name: 'Integration Test Suite',
    baseUrl: 'https://example.com',
    tests: [
      {
        name: 'Health check',
        type: 'api',
        url: '/health',
        method: 'GET',
        assertions: [{ type: 'status', expected: 200 }],
      },
    ],
  };

  it('POST /api/suites/:name saves the suite file', async () => {
    const res = await request(app)
      .post(`/api/suites/${suiteName}`)
      .send(suitePayload)
      .set('Content-Type', 'application/json');

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.filename).toBe(`${suiteName}.json`);
  });

  it('GET /api/suites lists the saved suite', async () => {
    const res = await request(app).get('/api/suites');
    expect(res.status).toBe(200);
    expect(res.body).toContain(`${suiteName}.json`);
  });

  it('GET /api/suites/:name retrieves the exact suite that was saved', async () => {
    const res = await request(app).get(`/api/suites/${suiteName}.json`);
    expect(res.status).toBe(200);
    expect(res.body).toEqual(suitePayload);
  });

  it('overwriting a suite with POST replaces the previous content', async () => {
    const updatedPayload = { ...suitePayload, name: 'Updated Suite', tests: [] };

    const saveRes = await request(app)
      .post(`/api/suites/${suiteName}`)
      .send(updatedPayload)
      .set('Content-Type', 'application/json');
    expect(saveRes.status).toBe(200);

    const getRes = await request(app).get(`/api/suites/${suiteName}.json`);
    expect(getRes.status).toBe(200);
    expect(getRes.body.name).toBe('Updated Suite');
    expect(getRes.body.tests).toEqual([]);
  });
});
