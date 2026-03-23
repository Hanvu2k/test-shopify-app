// =============================================================================
// API Service — Thin client for backend communication
// =============================================================================
// All endpoints are proxied by Vite to http://localhost:3737 via /api prefix.
// =============================================================================

import type { RunSummary } from '../../core/types';
import type { HistoryEntry } from '../components/History/HistoryPanel';

const API_BASE = '/api';

// -----------------------------------------------------------------------------
// Error handling
// -----------------------------------------------------------------------------

class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let message = `HTTP ${response.status}: ${response.statusText}`;
    try {
      const body = await response.json();
      if (body.error) message = body.error;
    } catch {
      // Use default message if body isn't JSON
    }
    throw new ApiError(message, response.status);
  }
  return response.json() as Promise<T>;
}

// -----------------------------------------------------------------------------
// Suite endpoints
// -----------------------------------------------------------------------------

/**
 * Fetches the list of saved test suite filenames from the server.
 */
export async function fetchSuiteList(): Promise<string[]> {
  const response = await fetch(`${API_BASE}/suites`);
  return handleResponse<string[]>(response);
}

/**
 * Loads a specific test suite by filename.
 * Returns the raw JSON string so it can be placed directly into the editor.
 */
export async function loadSuite(name: string): Promise<string> {
  const response = await fetch(`${API_BASE}/suites/${encodeURIComponent(name)}`);
  const parsed = await handleResponse<unknown>(response);
  return JSON.stringify(parsed, null, 2);
}

/**
 * Saves a test suite to the server.
 * Accepts the raw JSON string from the editor, parses it, and sends as JSON.
 */
export async function saveSuite(name: string, content: string): Promise<void> {
  const parsed = JSON.parse(content);
  const response = await fetch(`${API_BASE}/suites/${encodeURIComponent(name)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(parsed),
  });
  await handleResponse<{ ok: boolean; filename: string }>(response);
}

// -----------------------------------------------------------------------------
// History endpoint
// -----------------------------------------------------------------------------

/**
 * Fetches run history from the server and maps to HistoryEntry format.
 */
export async function fetchHistory(): Promise<HistoryEntry[]> {
  const response = await fetch(`${API_BASE}/history`);
  const summaries = await handleResponse<RunSummary[]>(response);

  return summaries.map((summary, index) => ({
    id: `server-${Date.now()}-${index}`,
    timestamp: new Date(),
    suiteName: summary.suiteName,
    total: summary.total,
    passed: summary.passed,
    failed: summary.failed,
    duration: summary.duration,
    results: summary.results,
  }));
}

// -----------------------------------------------------------------------------
// Abort endpoint
// -----------------------------------------------------------------------------

/**
 * Sends an abort signal to stop the currently running test suite.
 */
export async function abortRun(): Promise<void> {
  const response = await fetch(`${API_BASE}/abort`, { method: 'POST' });
  // 404 means no run is active — treat as success since user intent is satisfied
  if (response.status === 404) return;
  await handleResponse<{ ok: boolean }>(response);
}
