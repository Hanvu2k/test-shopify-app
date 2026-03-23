// =============================================================================
// /api/suites — Test Suite CRUD Endpoints
// =============================================================================
// Manages test suite JSON files stored in the test-suites/ directory.
//   GET  /api/suites       — List all saved suite filenames
//   GET  /api/suites/:name — Read a specific suite file
//   POST /api/suites/:name — Save/overwrite a suite file
// =============================================================================

import { Router } from 'express';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const SUITES_DIR = path.resolve(process.cwd(), 'test-suites');

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

/**
 * Validates a suite filename to prevent path traversal attacks.
 * Rejects names containing '/', '..', or backslash.
 * Returns the sanitized name with .json extension appended if missing.
 */
function validateFilename(name: string): string | null {
  if (!name || name.includes('/') || name.includes('\\') || name.includes('..')) {
    return null;
  }

  // Strip any leading dots to prevent hidden files
  const sanitized = name.replace(/^\.+/, '');
  if (!sanitized) return null;

  // Ensure .json extension
  return sanitized.endsWith('.json') ? sanitized : `${sanitized}.json`;
}

/**
 * Ensures the test-suites/ directory exists, creating it if necessary.
 */
async function ensureSuitesDir(): Promise<void> {
  await fs.mkdir(SUITES_DIR, { recursive: true });
}

// -----------------------------------------------------------------------------
// Router
// -----------------------------------------------------------------------------

const router = Router();

/**
 * GET /api/suites
 * Lists all .json files in the test-suites/ directory.
 */
router.get('/', async (_req, res) => {
  try {
    await ensureSuitesDir();
    const files = await fs.readdir(SUITES_DIR);
    const jsonFiles = files.filter((f) => f.endsWith('.json'));
    res.json(jsonFiles);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: `Failed to list suites: ${message}` });
  }
});

/**
 * GET /api/suites/:name
 * Reads and returns the content of a specific test suite JSON file.
 */
router.get('/:name', async (req, res) => {
  const filename = validateFilename(req.params.name);
  if (!filename) {
    res.status(400).json({ error: 'Invalid filename. Must not contain /, \\, or ..' });
    return;
  }

  try {
    await ensureSuitesDir();
    const filePath = path.join(SUITES_DIR, filename);
    const content = await fs.readFile(filePath, 'utf-8');
    const parsed = JSON.parse(content);
    res.json(parsed);
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      res.status(404).json({ error: `Suite "${filename}" not found` });
      return;
    }
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: `Failed to read suite: ${message}` });
  }
});

/**
 * POST /api/suites/:name
 * Saves the request body as a JSON file in the test-suites/ directory.
 */
router.post('/:name', async (req, res) => {
  const filename = validateFilename(req.params.name);
  if (!filename) {
    res.status(400).json({ error: 'Invalid filename. Must not contain /, \\, or ..' });
    return;
  }

  if (!req.body || typeof req.body !== 'object') {
    res.status(400).json({ error: 'Request body must be a valid JSON object' });
    return;
  }

  try {
    await ensureSuitesDir();
    const filePath = path.join(SUITES_DIR, filename);
    await fs.writeFile(filePath, JSON.stringify(req.body, null, 2), 'utf-8');
    res.json({ ok: true, filename });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: `Failed to save suite: ${message}` });
  }
});

export default router;
