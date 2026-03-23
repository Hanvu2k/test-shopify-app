// =============================================================================
// ThemePreview — Screenshot-based Shopify theme preview
// =============================================================================
// Replaces the iframe-based approach that was blocked by CSP/cookies/JS issues.
// Uses a Playwright-powered backend to take periodic screenshots of the theme,
// polled by the frontend and displayed as an <img> tag. No iframe needed.
// =============================================================================

import { memo, useState, useRef, useEffect, useCallback } from 'react';
import {
  Globe,
  ExternalLink,
  AlertTriangle,
  Loader2,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ThemePreviewProps {
  url: string;
  password?: string;
  highlightSelector?: string | null;
}

type PreviewState = 'idle' | 'starting' | 'active' | 'error';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PREVIEW_API = '/api/preview';
const POLL_INTERVAL_MS = 800;

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

async function startPreview(url: string, password?: string): Promise<{ status: string }> {
  const res = await fetch(`${PREVIEW_API}/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, password }),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(body.error || `Start failed (${res.status})`);
  }
  return res.json();
}

async function stopPreview(): Promise<void> {
  await fetch(`${PREVIEW_API}/stop`, { method: 'POST' }).catch(() => {
    // Best-effort — session may already be stopped
  });
}

async function highlightElement(selector: string | null): Promise<void> {
  await fetch(`${PREVIEW_API}/highlight`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ selector }),
  }).catch(() => {
    // Non-critical — highlight is cosmetic
  });
}

async function fetchScreenshot(): Promise<string | null> {
  const res = await fetch(`${PREVIEW_API}/screenshot`);
  if (!res.ok) return null;
  const blob = await res.blob();
  return URL.createObjectURL(blob);
}

// ---------------------------------------------------------------------------
// ThemePreview — screenshot-based Shopify theme preview
// ---------------------------------------------------------------------------

export const ThemePreview = memo(
  ({ url, password, highlightSelector }: ThemePreviewProps) => {
    const [previewState, setPreviewState] = useState<PreviewState>('idle');
    const [screenshotUrl, setScreenshotUrl] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState('');
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const prevBlobUrlRef = useRef<string | null>(null);
    const hasUrl = url.trim().length > 0;

    // -----------------------------------------------------------------------
    // Cleanup polling interval
    // -----------------------------------------------------------------------
    const stopPolling = useCallback(() => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    }, []);

    // -----------------------------------------------------------------------
    // Revoke old blob URL to prevent memory leaks
    // -----------------------------------------------------------------------
    const updateScreenshot = useCallback((newUrl: string | null) => {
      if (prevBlobUrlRef.current && prevBlobUrlRef.current !== newUrl) {
        URL.revokeObjectURL(prevBlobUrlRef.current);
      }
      prevBlobUrlRef.current = newUrl;
      setScreenshotUrl(newUrl);
    }, []);

    // -----------------------------------------------------------------------
    // Start polling for screenshots
    // -----------------------------------------------------------------------
    const startPolling = useCallback(() => {
      stopPolling();
      pollRef.current = setInterval(async () => {
        const blobUrl = await fetchScreenshot();
        if (blobUrl) {
          updateScreenshot(blobUrl);
        }
      }, POLL_INTERVAL_MS);
    }, [stopPolling, updateScreenshot]);

    // -----------------------------------------------------------------------
    // Start/stop preview session when URL changes
    // -----------------------------------------------------------------------
    useEffect(() => {
      if (!hasUrl) {
        setPreviewState('idle');
        updateScreenshot(null);
        return;
      }

      let cancelled = false;

      async function init() {
        setPreviewState('starting');
        setErrorMessage('');
        updateScreenshot(null);

        try {
          // Stop any previous session
          await stopPreview();

          // Start new session
          await startPreview(url, password);

          if (cancelled) return;

          setPreviewState('active');

          // Fetch first screenshot immediately
          const blobUrl = await fetchScreenshot();
          if (!cancelled && blobUrl) {
            updateScreenshot(blobUrl);
          }

          // Start polling
          if (!cancelled) {
            startPolling();
          }
        } catch (err) {
          if (cancelled) return;
          setPreviewState('error');
          setErrorMessage(err instanceof Error ? err.message : String(err));
        }
      }

      init();

      return () => {
        cancelled = true;
        stopPolling();
        stopPreview();
      };
    }, [url, password, hasUrl, startPolling, stopPolling, updateScreenshot]);

    // -----------------------------------------------------------------------
    // Handle highlight selector changes
    // -----------------------------------------------------------------------
    useEffect(() => {
      if (previewState !== 'active') return;
      highlightElement(highlightSelector ?? null);
    }, [highlightSelector, previewState]);

    // -----------------------------------------------------------------------
    // Cleanup blob URL on unmount
    // -----------------------------------------------------------------------
    useEffect(() => {
      return () => {
        if (prevBlobUrlRef.current) {
          URL.revokeObjectURL(prevBlobUrlRef.current);
        }
      };
    }, []);

    const openInNewTab = useCallback(() => {
      if (hasUrl) {
        window.open(url, '_blank', 'noopener,noreferrer');
      }
    }, [url, hasUrl]);

    // -----------------------------------------------------------------------
    // Render
    // -----------------------------------------------------------------------
    return (
      <div className="flex flex-col h-full bg-surface min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-border flex-shrink-0 bg-surface-raised">
          <div className="flex items-center gap-2 min-w-0">
            <Globe size={14} className="text-brand flex-shrink-0" />
            <span className="text-xs font-semibold text-text-primary truncate">
              Theme Preview
            </span>
            {previewState === 'starting' && (
              <Loader2
                size={12}
                className="text-text-muted animate-spin flex-shrink-0"
              />
            )}
            {previewState === 'error' && (
              <AlertTriangle
                size={12}
                className="text-yellow-500 flex-shrink-0"
              />
            )}
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            {hasUrl && (
              <button
                onClick={openInNewTab}
                aria-label="Open theme preview in new tab"
                title="Open in new tab"
                className="p-1 rounded hover:bg-surface text-text-muted hover:text-text-primary transition-colors"
              >
                <ExternalLink size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 relative min-h-0 overflow-hidden">
          {!hasUrl && <EmptyState />}

          {hasUrl && previewState === 'error' && (
            <ErrorState message={errorMessage} url={url} onOpenInNewTab={openInNewTab} />
          )}

          {hasUrl && previewState === 'starting' && <LoadingState />}

          {hasUrl && previewState === 'active' && (
            <div className="absolute inset-0 flex items-center justify-center bg-white">
              {screenshotUrl ? (
                <img
                  src={screenshotUrl}
                  alt="Shopify theme preview"
                  className="w-full h-full object-contain"
                  draggable={false}
                />
              ) : (
                <LoadingState />
              )}
            </div>
          )}
        </div>
      </div>
    );
  },
);

ThemePreview.displayName = 'ThemePreview';

// ---------------------------------------------------------------------------
// Sub-state components
// ---------------------------------------------------------------------------

function EmptyState() {
  return (
    <div className="flex flex-1 h-full items-center justify-center p-6">
      <div className="text-center border border-border rounded-lg p-6">
        <Globe size={24} className="mx-auto mb-2 text-text-muted opacity-50" />
        <p className="text-xs text-text-muted">
          Enter a Shopify theme preview URL and click Load to preview it here.
        </p>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="absolute inset-0 flex items-center justify-center bg-surface">
      <div className="text-center">
        <Loader2 size={24} className="mx-auto mb-2 text-brand animate-spin" />
        <p className="text-xs text-text-muted">Loading theme preview...</p>
      </div>
    </div>
  );
}

interface ErrorStateProps {
  message: string;
  url: string;
  onOpenInNewTab: () => void;
}

function ErrorState({ message, url, onOpenInNewTab }: ErrorStateProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center p-6 bg-surface">
      <div className="text-center border border-yellow-500/30 bg-yellow-500/10 rounded-lg p-6 max-w-xs">
        <AlertTriangle size={24} className="mx-auto mb-2 text-yellow-500" />
        <p className="text-sm font-medium text-text-primary mb-1">
          Preview failed
        </p>
        <p className="text-xs text-text-muted mb-2">
          {message || 'Could not start the preview session.'}
        </p>
        <p className="text-xs text-text-muted mb-4 font-mono truncate opacity-75">
          {url}
        </p>
        <button
          onClick={onOpenInNewTab}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded bg-brand hover:bg-brand/90 text-white transition-colors"
          aria-label="Open theme in new tab"
        >
          <ExternalLink size={12} />
          Open in New Tab
        </button>
      </div>
    </div>
  );
}
