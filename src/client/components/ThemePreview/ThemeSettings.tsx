import { memo, useState, useCallback, useRef } from 'react';
import { Eye, EyeOff, Play } from 'lucide-react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ThemeSettingsProps {
  url: string;
  onUrlChange: (url: string) => void;
  password: string;
  onPasswordChange: (password: string) => void;
  onLoad: () => void;
}

// ---------------------------------------------------------------------------
// ThemeSettings — compact single-row form for URL + password
// ---------------------------------------------------------------------------

export const ThemeSettings = memo(
  ({ url, onUrlChange, password, onPasswordChange, onLoad }: ThemeSettingsProps) => {
    const [showPassword, setShowPassword] = useState(false);
    const urlInputRef = useRef<HTMLInputElement>(null);

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          onLoad();
        }
      },
      [onLoad],
    );

    const togglePasswordVisibility = useCallback(() => {
      setShowPassword((prev) => !prev);
    }, []);

    return (
      <div className="flex items-center gap-2 px-3 py-2 border-b border-border bg-surface-raised flex-shrink-0">
        {/* URL input */}
        <input
          ref={urlInputRef}
          type="url"
          value={url}
          onChange={(e) => onUrlChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="https://your-store.myshopify.com"
          aria-label="Theme preview URL"
          className="flex-1 min-w-0 px-2.5 py-1.5 text-xs font-mono bg-surface border border-border rounded text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-brand"
        />

        {/* Password input with toggle */}
        <div className="relative flex-shrink-0 w-36">
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Password (optional)"
            aria-label="Theme password"
            className="w-full px-2.5 py-1.5 pr-8 text-xs font-mono bg-surface border border-border rounded text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-brand"
          />
          <button
            type="button"
            onClick={togglePasswordVisibility}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-text-muted hover:text-text-primary transition-colors"
          >
            {showPassword ? <EyeOff size={12} /> : <Eye size={12} />}
          </button>
        </div>

        {/* Load button */}
        <button
          onClick={onLoad}
          aria-label="Load theme preview"
          title="Load preview"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded bg-brand hover:bg-brand/90 text-white transition-colors flex-shrink-0"
        >
          <Play size={12} />
          Load
        </button>
      </div>
    );
  },
);

ThemeSettings.displayName = 'ThemeSettings';
