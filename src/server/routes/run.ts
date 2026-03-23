// =============================================================================
// /api/run + /api/abort — Test Execution Endpoints
// =============================================================================
// POST /api/run  — Accepts a test suite JSON body, executes it via the core
//                  suite-runner, and streams each event back to the client as
//                  Server-Sent Events (SSE).
// POST /api/abort — Aborts the currently running suite via AbortController.
// =============================================================================

import { Router } from 'express';
import type { TestSuite, TestEvent } from '../../core/types.js';
import { runSuite } from '../../core/suite-runner.js';
import { setSSEHeaders, sendEvent, closeSSE } from '../middleware/sse.js';
import { addToHistory } from './history.js';

// Track the currently active run's AbortController (one run at a time)
let activeController: AbortController | null = null;

const router = Router();

// -----------------------------------------------------------------------------
// POST /api/run — Start test suite execution with SSE streaming
// -----------------------------------------------------------------------------

router.post('/run', (req, res) => {
  const suite: TestSuite | undefined = req.body?.suite;

  if (!suite) {
    res.status(400).json({ error: 'Request body must contain a "suite" object' });
    return;
  }

  // Reject if a run is already in progress
  if (activeController) {
    res.status(409).json({ error: 'A test suite is already running. Abort it first.' });
    return;
  }

  // Set up SSE streaming
  setSSEHeaders(res);

  // Create abort controller for this run
  const controller = new AbortController();
  activeController = controller;

  // Handle client disconnect — abort the running suite
  req.on('close', () => {
    if (activeController === controller) {
      controller.abort();
      activeController = null;
    }
  });

  // Map TestEvent to SSE events and stream to client
  const onEvent = (event: TestEvent): void => {
    sendEvent(res, event.type, event);
  };

  // Execute the suite
  runSuite(suite, onEvent, { abortSignal: controller.signal })
    .then((summary) => {
      // Store in history
      addToHistory(summary);

      // Close the SSE stream
      closeSSE(res);
    })
    .catch((err: unknown) => {
      const message = err instanceof Error ? err.message : String(err);
      sendEvent(res, 'suite:error', { type: 'suite:error', error: message });
      closeSSE(res);
    })
    .finally(() => {
      if (activeController === controller) {
        activeController = null;
      }
    });
});

// -----------------------------------------------------------------------------
// POST /api/abort — Abort the currently running test suite
// -----------------------------------------------------------------------------

router.post('/abort', (_req, res) => {
  if (!activeController) {
    res.status(404).json({ error: 'No test suite is currently running' });
    return;
  }

  activeController.abort();
  activeController = null;
  res.json({ ok: true, message: 'Abort signal sent' });
});

export default router;
