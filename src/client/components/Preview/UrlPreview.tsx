import { memo, useState, useCallback, useRef, useEffect } from 'react';
import { Globe, X, ExternalLink, AlertTriangle, Loader2 } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UrlPreviewProps {
  url: string;
  isOpen: boolean;
  onToggle: () => void;
}

type PreviewState = 'idle' | 'loading' | 'loaded' | 'blocked';

// ---------------------------------------------------------------------------
// UrlPreview component
// ---------------------------------------------------------------------------

export const UrlPreview = memo(({ url, isOpen, onToggle }: UrlPreviewProps) => {
  const [previewState, setPreviewState] = useState<PreviewState>('idle');
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const hasUrl = url.trim().length > 0;

  // Reset state when URL changes or panel opens
  useEffect(() => {
    if (!isOpen) return;
    if (!hasUrl) {
      setPreviewState('idle');
      return;
    }
    setPreviewState('loading');
  }, [url, isOpen, hasUrl]);

  const handleIframeLoad = useCallback(() => {
    // The iframe loaded — it may be a blank page due to X-Frame-Options,
    // but we have no reliable way to detect that from JS (cross-origin).
    // We optimistically show it as loaded; the user will see the blocked state
    // visually if the site refuses embedding.
    setPreviewState('loaded');
  }, []);

  const handleIframeError = useCallback(() => {
    setPreviewState('blocked');
  }, []);

  const openInNewTab = useCallback(() => {
    if (hasUrl) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }, [url, hasUrl]);

  if (!isOpen) return null;

  return (
    <div className="flex flex-col h-full border-l border-border bg-surface min-w-0">
      {/* Panel header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border flex-shrink-0 bg-surface-raised">
        <div className="flex items-center gap-2 min-w-0">
          <Globe size={14} className="text-brand flex-shrink-0" />
          <span className="text-xs font-semibold text-text-primary truncate">Preview</span>
          {previewState === 'loading' && (
            <Loader2 size={12} className="text-text-muted animate-spin flex-shrink-0" />
          )}
          {previewState === 'blocked' && (
            <AlertTriangle size={12} className="text-yellow-500 flex-shrink-0" />
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {hasUrl && (
            <button
              onClick={openInNewTab}
              aria-label="Open target URL in new tab"
              title="Open in new tab"
              className="p-1 rounded hover:bg-surface text-text-muted hover:text-text-primary transition-colors"
            >
              <ExternalLink size={14} />
            </button>
          )}
          <button
            onClick={onToggle}
            aria-label="Close preview panel"
            title="Close preview"
            className="p-1 rounded hover:bg-surface text-text-muted hover:text-text-primary transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Panel body */}
      <div className="flex-1 relative min-h-0 overflow-hidden">
        {!hasUrl && <EmptyUrlState />}

        {hasUrl && previewState === 'blocked' && (
          <BlockedState url={url} onOpenInNewTab={openInNewTab} />
        )}

        {hasUrl && (
          <iframe
            ref={iframeRef}
            src={url}
            title="Target store page preview"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            className={[
              'absolute inset-0 w-full h-full border-0 bg-white',
              previewState === 'loaded' ? 'opacity-100' : 'opacity-0 pointer-events-none',
            ].join(' ')}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
        )}

        {hasUrl && previewState === 'loading' && <LoadingState />}
      </div>
    </div>
  );
});

UrlPreview.displayName = 'UrlPreview';

// ---------------------------------------------------------------------------
// Sub-states
// ---------------------------------------------------------------------------

function EmptyUrlState() {
  return (
    <div className="flex flex-1 h-full items-center justify-center p-6">
      <div className="text-center border border-border rounded-lg p-6">
        <Globe size={24} className="mx-auto mb-2 text-text-muted opacity-50" />
        <p className="text-xs text-text-muted">
          Enter a Target URL in the toolbar to preview the page here.
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
        <p className="text-xs text-text-muted">Loading page...</p>
      </div>
    </div>
  );
}

interface BlockedStateProps {
  url: string;
  onOpenInNewTab: () => void;
}

function BlockedState({ url, onOpenInNewTab }: BlockedStateProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center p-6 bg-surface">
      <div className="text-center border border-yellow-500/30 bg-yellow-500/10 rounded-lg p-6 max-w-xs">
        <AlertTriangle size={24} className="mx-auto mb-2 text-yellow-500" />
        <p className="text-sm font-medium text-text-primary mb-1">
          This page cannot be displayed in a preview panel.
        </p>
        <p className="text-xs text-text-muted mb-4">
          The site may have X-Frame-Options restrictions.
        </p>
        <p className="text-xs text-text-muted mb-4 font-mono truncate opacity-75">{url}</p>
        <button
          onClick={onOpenInNewTab}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded bg-brand hover:bg-brand/90 text-white transition-colors"
          aria-label="Open target URL in new tab"
        >
          <ExternalLink size={12} />
          Open in New Tab
        </button>
      </div>
    </div>
  );
}
