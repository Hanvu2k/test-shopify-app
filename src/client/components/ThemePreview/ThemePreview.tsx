// =============================================================================
// ThemePreview — Open in New Tab approach
// =============================================================================
// Shopify blocks iframe embedding (CSP frame-ancestors 'none') and Playwright
// requires system dependencies not available on this server.
// Solution: Show URL info + prominent "Open in New Tab" button.
// User arranges browser windows side-by-side for preview + flow builder.
// =============================================================================

import { memo, useState } from 'react';
import { Globe, ExternalLink, Copy, Check } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ThemePreviewProps {
  url: string;
  password?: string;
  highlightSelector?: string | null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const ThemePreview = memo(function ThemePreview({
  url,
  password,
}: ThemePreviewProps) {
  const [copied, setCopied] = useState<'url' | 'password' | null>(null);

  const handleCopy = (text: string, type: 'url' | 'password') => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(type);
      setTimeout(() => setCopied(null), 2000);
    });
  };

  const handleOpen = () => {
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  // ---- Empty state ----
  if (!url) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-text-muted gap-3 p-8">
        <Globe size={48} strokeWidth={1} />
        <p className="text-sm text-center">
          Enter a Shopify theme URL above and click <strong>Load</strong> to get started
        </p>
      </div>
    );
  }

  // ---- URL provided ----
  return (
    <div className="h-full flex flex-col items-center justify-center gap-6 p-8">
      {/* Icon */}
      <div className="w-20 h-20 rounded-2xl bg-blue-500/10 flex items-center justify-center">
        <Globe size={40} className="text-blue-400" strokeWidth={1.5} />
      </div>

      {/* Title */}
      <div className="text-center">
        <h3 className="text-lg font-medium text-text-primary mb-1">Theme Preview</h3>
        <p className="text-sm text-text-muted max-w-md">
          Shopify blocks iframe embedding. Open the theme in a new tab and arrange windows side-by-side.
        </p>
      </div>

      {/* Open Button */}
      <button
        type="button"
        onClick={handleOpen}
        className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-medium transition-colors"
      >
        <ExternalLink size={18} />
        Open Theme in New Tab
      </button>

      {/* URL Info */}
      <div className="w-full max-w-lg space-y-3">
        {/* URL */}
        <div className="flex items-center gap-2 bg-surface-raised rounded-lg px-3 py-2 border border-border">
          <span className="text-xs text-text-muted font-medium shrink-0">URL</span>
          <span className="flex-1 text-sm font-mono text-text-secondary truncate">{url}</span>
          <button
            type="button"
            onClick={() => handleCopy(url, 'url')}
            className="shrink-0 p-1 hover:bg-white/5 rounded transition-colors"
            title="Copy URL"
          >
            {copied === 'url' ? <Check size={14} className="text-green-400" /> : <Copy size={14} className="text-text-muted" />}
          </button>
        </div>

        {/* Password (if provided) */}
        {password && (
          <div className="flex items-center gap-2 bg-surface-raised rounded-lg px-3 py-2 border border-border">
            <span className="text-xs text-text-muted font-medium shrink-0">PW</span>
            <span className="flex-1 text-sm font-mono text-text-secondary">{'•'.repeat(password.length)}</span>
            <button
              type="button"
              onClick={() => handleCopy(password, 'password')}
              className="shrink-0 p-1 hover:bg-white/5 rounded transition-colors"
              title="Copy password"
            >
              {copied === 'password' ? <Check size={14} className="text-green-400" /> : <Copy size={14} className="text-text-muted" />}
            </button>
          </div>
        )}
      </div>

      {/* Tip */}
      <p className="text-xs text-text-muted text-center max-w-sm">
        Tip: Arrange this window and the Shopify tab side-by-side for the best workflow.
        When you run tests, Playwright will open a visible browser window automatically.
      </p>
    </div>
  );
});
