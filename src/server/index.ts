// =============================================================================
// Express Server Entry Point
// =============================================================================
// Configures and starts the Express server on port 3737 with:
//   - JSON body parsing
//   - CORS for the Vite dev server (port 5273)
//   - All API route handlers mounted under /api
//   - Graceful shutdown on SIGTERM/SIGINT
// =============================================================================

import express from 'express';
import cors from 'cors';
import runRouter from './routes/run.js';
import suitesRouter from './routes/suites.js';
import historyRouter from './routes/history.js';
import previewRouter from './routes/preview.js';
import { closeBrowser } from './browser-manager.js';

const PORT = 3737;

const app = express();

// -----------------------------------------------------------------------------
// Middleware
// -----------------------------------------------------------------------------

app.use(cors({ origin: 'http://localhost:5273', credentials: true }));
app.use(express.json({ limit: '1mb' }));

// -----------------------------------------------------------------------------
// Routes
// -----------------------------------------------------------------------------

app.use('/api', runRouter);           // POST /api/run, POST /api/abort
app.use('/api/suites', suitesRouter); // GET/POST /api/suites, GET/POST /api/suites/:name
app.use('/api/history', historyRouter); // GET /api/history
app.use('/api/preview', previewRouter); // POST /api/preview/start, GET /api/preview/screenshot, etc.

// -----------------------------------------------------------------------------
// Health check
// -----------------------------------------------------------------------------

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// -----------------------------------------------------------------------------
// Start server
// -----------------------------------------------------------------------------

const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// Graceful shutdown
function shutdown() {
  console.log('\nShutting down gracefully...');
  closeBrowser()
    .catch(() => {})
    .finally(() => {
      server.close(() => {
        process.exit(0);
      });
    });
  // Force exit after 5 seconds
  setTimeout(() => process.exit(1), 5000);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

export default app;
