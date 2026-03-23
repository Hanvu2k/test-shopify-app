/**
 * Unit tests for the /api/suites route with mocked fs module.
 *
 * Tests cover:
 * 1. GET / — lists JSON files, filters non-JSON, handles fs errors
 * 2. GET /:name — reads file, returns 404 on missing, validates filename
 * 3. POST /:name — saves file, validates filename and body, handles fs errors
 * 4. validateFilename — path traversal protection
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import express from 'express';
import request from 'supertest';

// ---------------------------------------------------------------------------
// Use vi.hoisted so mock variables are initialized before vi.mock hoisting
// ---------------------------------------------------------------------------

const { mockMkdir, mockReaddir, mockReadFile, mockWriteFile } = vi.hoisted(() => ({
  mockMkdir: vi.fn<[], Promise<void>>(),
  mockReaddir: vi.fn<[], Promise<string[]>>(),
  mockReadFile: vi.fn<[], Promise<string>>(),
  mockWriteFile: vi.fn<[], Promise<void>>(),
}));

vi.mock('node:fs', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:fs')>();
  return {
    ...actual,
    promises: {
      mkdir: mockMkdir,
      readdir: mockReaddir,
      readFile: mockReadFile,
      writeFile: mockWriteFile,
    },
  };
});

// Import AFTER mocking
import suitesRouter from '../routes/suites.js';

// ---------------------------------------------------------------------------
// App factory
// ---------------------------------------------------------------------------

function buildApp(): express.Application {
  const app = express();
  app.use(express.json());
  app.use('/api/suites', suitesRouter);
  return app;
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

let app: express.Application;

beforeEach(() => {
  vi.clearAllMocks();
  mockMkdir.mockResolvedValue(undefined);
  app = buildApp();
});

afterEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// GET /api/suites
// ---------------------------------------------------------------------------

describe('GET /api/suites', () => {
  it('returns 200 with a list of .json filenames', async () => {
    mockReaddir.mockResolvedValue(['my-suite.json', 'another.json', 'notes.txt'] as never);
    const res = await request(app).get('/api/suites');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(['my-suite.json', 'another.json']);
  });

  it('filters out non-.json files', async () => {
    mockReaddir.mockResolvedValue(['suite.json', 'README.md', '.DS_Store'] as never);
    const res = await request(app).get('/api/suites');
    expect(res.body).toEqual(['suite.json']);
  });

  it('returns an empty array when no .json files exist', async () => {
    mockReaddir.mockResolvedValue([] as never);
    const res = await request(app).get('/api/suites');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('returns 500 when readdir throws', async () => {
    mockReaddir.mockRejectedValue(new Error('disk error') as never);
    const res = await request(app).get('/api/suites');
    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/disk error/);
  });
});

// ---------------------------------------------------------------------------
// GET /api/suites/:name
// ---------------------------------------------------------------------------

describe('GET /api/suites/:name', () => {
  it('returns 200 with the parsed JSON content of the suite file', async () => {
    const suite = { name: 'My Suite', tests: [] };
    mockReadFile.mockResolvedValue(JSON.stringify(suite) as never);
    const res = await request(app).get('/api/suites/my-suite.json');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(suite);
  });

  it('appends .json extension if name lacks it', async () => {
    const suite = { name: 'Bare Name Suite', tests: [] };
    mockReadFile.mockResolvedValue(JSON.stringify(suite) as never);
    const res = await request(app).get('/api/suites/my-suite');
    expect(res.status).toBe(200);
    expect(res.body).toEqual(suite);
  });

  it('returns 404 when the file does not exist', async () => {
    const err = Object.assign(new Error('ENOENT'), { code: 'ENOENT' });
    mockReadFile.mockRejectedValue(err as never);
    const res = await request(app).get('/api/suites/missing.json');
    expect(res.status).toBe(404);
    expect(res.body.error).toMatch(/not found/i);
  });

  it('returns 400 for a filename containing path traversal (../)', async () => {
    const res = await request(app).get('/api/suites/..%2Fetc%2Fpasswd');
    expect(res.status).toBe(400);
  });

  it('returns 400 for a filename containing a backslash', async () => {
    const res = await request(app).get('/api/suites/foo%5Cbar');
    expect(res.status).toBe(400);
  });

  it('returns 500 when readFile throws a non-ENOENT error', async () => {
    mockReadFile.mockRejectedValue(new Error('permission denied') as never);
    const res = await request(app).get('/api/suites/locked.json');
    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/permission denied/);
  });
});

// ---------------------------------------------------------------------------
// POST /api/suites/:name
// ---------------------------------------------------------------------------

describe('POST /api/suites/:name', () => {
  it('saves the suite and returns 200 with ok: true', async () => {
    mockWriteFile.mockResolvedValue(undefined);
    const suite = { name: 'New Suite', tests: [] };
    const res = await request(app)
      .post('/api/suites/new-suite.json')
      .send(suite)
      .set('Content-Type', 'application/json');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    expect(res.body.filename).toBe('new-suite.json');
  });

  it('calls writeFile with pretty-printed JSON', async () => {
    mockWriteFile.mockResolvedValue(undefined);
    const suite = { name: 'Suite', tests: [] };
    await request(app)
      .post('/api/suites/suite.json')
      .send(suite)
      .set('Content-Type', 'application/json');
    const writtenContent = (mockWriteFile.mock.calls[0] as [unknown, string])[1];
    expect(writtenContent).toBe(JSON.stringify(suite, null, 2));
  });

  it('appends .json extension when name lacks it', async () => {
    mockWriteFile.mockResolvedValue(undefined);
    const res = await request(app)
      .post('/api/suites/auto-ext')
      .send({ name: 'Auto', tests: [] })
      .set('Content-Type', 'application/json');
    expect(res.status).toBe(200);
    expect(res.body.filename).toBe('auto-ext.json');
  });

  it('returns 400 for invalid filename with path traversal', async () => {
    const res = await request(app)
      .post('/api/suites/..%2Fevil')
      .send({ name: 'Evil', tests: [] })
      .set('Content-Type', 'application/json');
    expect(res.status).toBe(400);
  });

  it('returns 400 when body is a JSON null value', async () => {
    // Express parses `null` body as null, which fails the `!req.body` check
    const res = await request(app)
      .post('/api/suites/null-body.json')
      .set('Content-Type', 'application/json')
      .send('null');
    // Either Express body parser rejects it (400) or our route does (400)
    expect(res.status).toBe(400);
  });

  it('returns 500 when writeFile throws', async () => {
    mockWriteFile.mockRejectedValue(new Error('no space') as never);
    const res = await request(app)
      .post('/api/suites/fail.json')
      .send({ name: 'Fail', tests: [] })
      .set('Content-Type', 'application/json');
    expect(res.status).toBe(500);
    expect(res.body.error).toMatch(/no space/);
  });
});
