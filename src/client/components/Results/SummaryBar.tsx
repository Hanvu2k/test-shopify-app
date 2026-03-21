import { RunSummary } from '../../../../core/types';

interface SummaryBarProps {
  summary: RunSummary;
}

function formatDuration(ms: number): string {
  if (ms >= 1000) {
    return `${(ms / 1000).toFixed(1)}s`;
  }
  return `${ms}ms`;
}

export function SummaryBar({ summary }: SummaryBarProps) {
  const { total, passed, failed, skipped, duration } = summary;
  const allPassed = failed === 0 && total > 0;
  const hasFailed = failed > 0;

  return (
    <div className="flex items-center gap-3 px-3 py-2 bg-surface-raised border-t border-border text-xs font-mono select-none">
      {/* Overall status indicator */}
      <span
        className={`font-semibold ${allPassed ? 'text-status-pass' : hasFailed ? 'text-status-fail' : 'text-text-secondary'}`}
        aria-label={`Run result: ${allPassed ? 'all passed' : `${failed} failed`}`}
      >
        {allPassed ? 'All passed' : hasFailed ? `${failed} failed` : 'Complete'}
      </span>

      <span className="text-border">|</span>

      {/* Passed count */}
      <span className="flex items-center gap-1">
        <span
          className="inline-block w-2 h-2 rounded-full bg-status-pass"
          aria-hidden="true"
        />
        <span className="text-status-pass font-semibold">{passed}</span>
        <span className="text-text-muted">passed</span>
      </span>

      {/* Failed count */}
      <span className="flex items-center gap-1">
        <span
          className="inline-block w-2 h-2 rounded-full bg-status-fail"
          aria-hidden="true"
        />
        <span className={`font-semibold ${failed > 0 ? 'text-status-fail' : 'text-text-muted'}`}>{failed}</span>
        <span className="text-text-muted">failed</span>
      </span>

      {/* Skipped count (only shown when > 0) */}
      {skipped > 0 && (
        <span className="flex items-center gap-1">
          <span
            className="inline-block w-2 h-2 rounded-full bg-status-idle"
            aria-hidden="true"
          />
          <span className="text-text-muted font-semibold">{skipped}</span>
          <span className="text-text-muted">skipped</span>
        </span>
      )}

      {/* Total */}
      <span className="flex items-center gap-1 text-text-muted">
        <span>{total} total</span>
      </span>

      <span className="text-border">|</span>

      {/* Duration */}
      <span className="flex items-center gap-1 text-text-secondary">
        <svg
          width="11"
          height="11"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
        <span>{formatDuration(duration)}</span>
      </span>
    </div>
  );
}
