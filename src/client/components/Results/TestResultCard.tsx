import { memo, useState } from 'react';
import { TestResult, AssertionResult } from '../../../core/types';

interface TestResultCardProps {
  result: TestResult;
}

function formatDuration(ms: number): string {
  if (ms >= 1000) {
    return `${(ms / 1000).toFixed(1)}s`;
  }
  return `${ms}ms`;
}

function statusIcon(status: TestResult['status']): { symbol: string; label: string } {
  switch (status) {
    case 'pass':
      return { symbol: '✓', label: 'PASS' };
    case 'fail':
      return { symbol: '✗', label: 'FAIL' };
    case 'error':
      return { symbol: '!', label: 'ERROR' };
    case 'skipped':
      return { symbol: '–', label: 'SKIP' };
  }
}

function statusColorClass(status: TestResult['status']): string {
  switch (status) {
    case 'pass':
      return 'text-[#22c55e]';
    case 'fail':
      return 'text-[#ef4444]';
    case 'error':
      return 'text-[#f97316]';
    case 'skipped':
      return 'text-[#6b7280]';
  }
}

function statusBgClass(status: TestResult['status']): string {
  switch (status) {
    case 'pass':
      return 'bg-[#22c55e]/10 text-[#22c55e]';
    case 'fail':
      return 'bg-[#ef4444]/10 text-[#ef4444]';
    case 'error':
      return 'bg-[#f97316]/10 text-[#f97316]';
    case 'skipped':
      return 'bg-[#6b7280]/10 text-[#6b7280]';
  }
}

function typeBadgeClass(type: 'api' | 'ui'): string {
  return type === 'api'
    ? 'bg-blue-500/15 text-blue-400'
    : 'bg-purple-500/15 text-purple-400';
}

function AssertionRow({ assertion }: { assertion: AssertionResult }) {
  const passColor = assertion.passed ? 'text-[#22c55e]' : 'text-[#ef4444]';
  const icon = assertion.passed ? '✓' : '✗';

  return (
    <div className={`flex flex-col gap-0.5 pl-2 border-l-2 ${assertion.passed ? 'border-[#22c55e]/40' : 'border-[#ef4444]/40'}`}>
      <div className="flex items-center gap-2">
        <span className={`font-semibold ${passColor}`} aria-hidden="true">{icon}</span>
        <span className="text-text-secondary uppercase tracking-wide" style={{ fontSize: '10px' }}>{assertion.type}</span>
        <span className={`ml-auto text-xs font-semibold ${passColor}`}>
          <span className="sr-only">{assertion.passed ? 'passed' : 'failed'}</span>
          {assertion.passed ? 'PASS' : 'FAIL'}
        </span>
      </div>
      <div className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5 pl-4 text-xs font-mono">
        <span className="text-text-muted">expected</span>
        <span className="text-text-primary break-all">
          {JSON.stringify(assertion.expected)}
        </span>
        <span className="text-text-muted">actual</span>
        <span className={`break-all ${assertion.passed ? 'text-text-primary' : 'text-[#ef4444]'}`}>
          {assertion.actual === undefined || assertion.actual === null
            ? '(not found)'
            : JSON.stringify(assertion.actual)}
        </span>
      </div>
    </div>
  );
}

function ExpandedDetails({ result }: { result: TestResult }) {
  return (
    <div
      className="mx-3 mb-2 rounded border border-border bg-surface-inset overflow-hidden"
      role="region"
      aria-label={`Details for ${result.name}`}
    >
      <div className="px-3 py-2 space-y-3 font-mono text-xs">
        {/* Assertions (API tests) */}
        {result.assertions && result.assertions.length > 0 && (
          <div className="space-y-2">
            <p className="text-text-secondary font-semibold uppercase tracking-wide" style={{ fontSize: '10px' }}>
              Assertions
            </p>
            <div className="space-y-2">
              {result.assertions.map((assertion, i) => (
                <AssertionRow key={i} assertion={assertion} />
              ))}
            </div>
          </div>
        )}

        {/* Error message */}
        {result.error && (
          <div className="space-y-1">
            <p className="text-text-secondary font-semibold uppercase tracking-wide" style={{ fontSize: '10px' }}>
              Error
            </p>
            <pre className="text-[#f97316] whitespace-pre-wrap break-all leading-relaxed bg-surface-overlay rounded px-2 py-1.5">
              {result.error}
            </pre>
          </div>
        )}

        {/* Screenshot (UI test failures) */}
        {result.screenshot && (
          <div className="space-y-2">
            <p className="text-text-secondary font-semibold uppercase tracking-wide" style={{ fontSize: '10px' }}>
              Screenshot
            </p>
            <div className="rounded overflow-hidden border border-border">
              <img
                src={`/screenshots/${result.screenshot.replace(/^screenshots\//, '')}`}
                alt={`Screenshot at time of test failure for: ${result.name}`}
                className="w-full object-contain max-h-64 bg-surface-overlay"
                loading="lazy"
              />
            </div>
            <a
              href={`/screenshots/${result.screenshot.replace(/^screenshots\//, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-brand hover:text-brand-hover transition-colors"
            >
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
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              Open full screenshot
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export const TestResultCard = memo(function TestResultCard({ result }: TestResultCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasDetails =
    (result.assertions && result.assertions.length > 0) ||
    result.error ||
    result.screenshot;

  const canExpand = hasDetails;
  const { symbol, label } = statusIcon(result.status);
  const colorClass = statusColorClass(result.status);
  const statusBg = statusBgClass(result.status);

  const handleToggle = () => {
    if (canExpand) {
      setIsExpanded((prev) => !prev);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (canExpand && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      setIsExpanded((prev) => !prev);
    }
  };

  return (
    <div className="border-b border-border/50 last:border-b-0">
      {/* Row */}
      <div
        role={canExpand ? 'button' : undefined}
        tabIndex={canExpand ? 0 : undefined}
        aria-expanded={canExpand ? isExpanded : undefined}
        aria-controls={canExpand ? `details-${result.name}` : undefined}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        className={`
          flex items-center gap-2 px-3 py-2 text-xs font-mono
          ${canExpand ? 'cursor-pointer hover:bg-surface-overlay transition-colors duration-100' : ''}
        `}
      >
        {/* Status icon */}
        <span
          className={`flex-none w-4 text-center font-bold ${colorClass}`}
          aria-label={label}
          title={label}
        >
          {symbol}
        </span>

        {/* Test name */}
        <span className="flex-1 truncate text-text-primary" title={result.name}>
          {result.name}
        </span>

        {/* Type badge */}
        <span
          className={`flex-none px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase ${typeBadgeClass(result.type)}`}
          aria-label={`type: ${result.type}`}
        >
          {result.type}
        </span>

        {/* Status badge */}
        <span
          className={`flex-none px-1.5 py-0.5 rounded text-[10px] font-semibold ${statusBg}`}
          aria-hidden="true"
        >
          {label}
        </span>

        {/* Duration */}
        <span className="flex-none w-14 text-right text-text-muted">
          {result.duration > 0 ? formatDuration(result.duration) : '--'}
        </span>

        {/* Expand chevron (only for expandable rows) */}
        {canExpand && (
          <span
            className={`flex-none text-text-muted transition-transform duration-150 ${isExpanded ? 'rotate-90' : ''}`}
            aria-hidden="true"
          >
            ▶
          </span>
        )}
      </div>

      {/* Expandable details */}
      {canExpand && isExpanded && (
        <div id={`details-${result.name}`}>
          <ExpandedDetails result={result} />
        </div>
      )}
    </div>
  );
});
