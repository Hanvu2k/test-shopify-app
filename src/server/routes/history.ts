// =============================================================================
// /api/history — Run History Endpoint
// =============================================================================
// Stores the last 50 run summaries in memory and exposes them via GET.
// The addToHistory function is exported so the /api/run route can push
// completed run summaries into the store.
// =============================================================================

import { Router } from 'express';
import type { RunSummary } from '../../core/types.js';

const MAX_HISTORY = 50;

// In-memory history store (most recent first)
const history: RunSummary[] = [];

/**
 * Adds a completed run summary to the in-memory history store.
 * Keeps only the most recent MAX_HISTORY entries.
 */
export function addToHistory(summary: RunSummary): void {
  history.unshift(summary);
  if (history.length > MAX_HISTORY) {
    history.length = MAX_HISTORY;
  }
}

// -----------------------------------------------------------------------------
// Router
// -----------------------------------------------------------------------------

const router = Router();

/**
 * GET /api/history
 * Returns all stored run summaries (most recent first).
 */
router.get('/', (_req, res) => {
  res.json(history);
});

export default router;
