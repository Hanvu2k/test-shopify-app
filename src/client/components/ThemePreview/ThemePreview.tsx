import { memo, useState, useCallback, useRef, useEffect } from 'react';
import {
  Globe,
  ExternalLink,
  AlertTriangle,
  Loader2,
  Lock,
} from 'lucide-react';
import { highlightElement, clearHighlight } from './highlighter';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ThemePreviewProps {
  url: string;
  password?: string;
  highlightSelector?: string | null;
}

type PreviewState = 'idle' | 'loading' | 'loaded' | 'blocked' | 'password-prompt';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SHOPIFY_PASSWORD_PATH = '/password';
const PROXY_BASE = '/api/proxy';

/**
 * Build a proxied URL that routes through our backend reverse proxy.
 * This strips CSP / X-Frame-Options headers so the iframe can load.
 */
function toProxyUrl(targetUrl: string): string {
  return `${PROXY_BASE}?url=${encodeURIComponent(targetUrl)}`;
}

// ---------------------------------------------------------------------------
// ThemePreview — iframe-based Shopify theme preview with password handling
// ---------------------------------------------------------------------------

export const ThemePreview = memo(
  ({ url, password, highlightSelector }: ThemePreviewProps) => {
    const [previewState, setPreviewState] = useState<PreviewState>('idle');
    const [passwordAttempted, setPasswordAttempted] = useState(false);
    const [proxyUrl, setProxyUrl] = useState('');
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const hasUrl = url.trim().length > 0;

    // -----------------------------------------------------------------------
    // Reset state when URL changes — submit password first if provided
    // -----------------------------------------------------------------------
    useEffect(() => {
      if (!hasUrl) {
        setPreviewState('idle');
        setProxyUrl('');
        return;
      }

      setPreviewState('loading');
      setPasswordAttempted(false);

      // If a password is provided, POST it through the proxy first so the
      // session cookie gets set, then load the main page.
      if (password) {
        const passwordUrl = new URL(url);
        passwordUrl.pathname = SHOPIFY_PASSWORD_PATH;

        fetch(toProxyUrl(passwordUrl.href), {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ password }).toString(),
          credentials: 'include',
        })
          .then(() => {
            setPasswordAttempted(true);
            setProxyUrl(toProxyUrl(url));
          })
          .catch(() => {
            // Password submission failed — still try loading the page
            setProxyUrl(toProxyUrl(url));
          });
      } else {
        setProxyUrl(toProxyUrl(url));
      }
    }, [url, password, hasUrl]);

    // -----------------------------------------------------------------------
    // Highlight selector changes
    // -----------------------------------------------------------------------
    useEffect(() => {
      const iframe = iframeRef.current;
      if (!iframe) return;

      if (highlightSelector) {
        highlightElement(iframe, highlightSelector);
      } else {
        clearHighlight(iframe);
      }
    }, [highlightSelector]);

    // -----------------------------------------------------------------------
    // Handle iframe load — detect password page & auto-submit
    // -----------------------------------------------------------------------
    const handleIframeLoad = useCallback(() => {
      const iframe = iframeRef.current;
      if (!iframe) return;

      // Since we now proxy through localhost, the iframe is same-origin
      // and we can access contentDocument reliably.
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (iframeDoc) {
          // Check if the page content is a Shopify password page
          const hasPasswordForm = iframeDoc.querySelector(
            'form[action*="password"]',
          );
          const bodyText = iframeDoc.body?.textContent ?? '';
          const looksLikePasswordPage =
            hasPasswordForm ||
            bodyText.includes('Enter store using password');

          if (looksLikePasswordPage && !passwordAttempted) {
            if (password) {
              // Auto-submit password through the proxy
              setPasswordAttempted(true);
              attemptPasswordSubmit(iframeDoc, password);
              return;
            }
            // No password provided — prompt user
            setPreviewState('password-prompt');
            return;
          }
        }
      } catch {
        // Unexpected error accessing document — continue to loaded state
      }

      setPreviewState('loaded');

      // Re-apply highlight after page load (now works since same-origin!)
      if (highlightSelector && iframe) {
        // Small delay to let the page render
        requestAnimationFrame(() => {
          highlightElement(iframe, highlightSelector);
        });
      }
    }, [password, passwordAttempted, highlightSelector]);

    const handleIframeError = useCallback(() => {
      setPreviewState('blocked');
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
            {previewState === 'loading' && (
              <Loader2
                size={12}
                className="text-text-muted animate-spin flex-shrink-0"
              />
            )}
            {previewState === 'blocked' && (
              <AlertTriangle
                size={12}
                className="text-yellow-500 flex-shrink-0"
              />
            )}
            {previewState === 'password-prompt' && (
              <Lock size={12} className="text-yellow-500 flex-shrink-0" />
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

          {hasUrl && previewState === 'blocked' && (
            <BlockedState url={url} onOpenInNewTab={openInNewTab} />
          )}

          {hasUrl && previewState === 'password-prompt' && (
            <PasswordPromptState />
          )}

          {hasUrl && proxyUrl && (
            <iframe
              ref={iframeRef}
              src={proxyUrl}
              title="Shopify theme preview"
              onLoad={handleIframeLoad}
              onError={handleIframeError}
              className={[
                'absolute inset-0 w-full h-full border-0 bg-white',
                previewState === 'loaded'
                  ? 'opacity-100'
                  : 'opacity-0 pointer-events-none',
              ].join(' ')}
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
            />
          )}

          {hasUrl && previewState === 'loading' && <LoadingState />}
        </div>
      </div>
    );
  },
);

ThemePreview.displayName = 'ThemePreview';

// ---------------------------------------------------------------------------
// Password auto-submit helper
// ---------------------------------------------------------------------------

function attemptPasswordSubmit(doc: Document, password: string): void {
  try {
    // Look for password input field on Shopify password page
    const passwordInput = doc.querySelector<HTMLInputElement>(
      'input[type="password"], input[name="password"]',
    );

    if (passwordInput) {
      // Set the value using native setter to trigger React/Shopify handlers
      const nativeSetter = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        'value',
      )?.set;
      if (nativeSetter) {
        nativeSetter.call(passwordInput, password);
      } else {
        passwordInput.value = password;
      }

      // Dispatch input event so frameworks pick up the change
      passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
      passwordInput.dispatchEvent(new Event('change', { bubbles: true }));

      // Find and submit the form
      const form = passwordInput.closest('form');
      if (form) {
        // Small delay to let event handlers process
        setTimeout(() => {
          form.submit();
        }, 100);
      }
    }
  } catch {
    // Cross-origin or other issue — ignore, user will see the prompt
  }
}

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
          Cannot embed this page
        </p>
        <p className="text-xs text-text-muted mb-4">
          The site blocks iframe embedding (X-Frame-Options). Open it in a new
          tab instead.
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

function PasswordPromptState() {
  return (
    <div className="absolute inset-0 flex items-center justify-center p-6 bg-surface">
      <div className="text-center border border-yellow-500/30 bg-yellow-500/10 rounded-lg p-6 max-w-xs">
        <Lock size={24} className="mx-auto mb-2 text-yellow-500" />
        <p className="text-sm font-medium text-text-primary mb-1">
          Password required
        </p>
        <p className="text-xs text-text-muted">
          This theme preview requires a password. Enter it in the password field
          above and click Load again.
        </p>
      </div>
    </div>
  );
}
