/**
 * Tests for SummaryBar component.
 *
 * Verifies:
 * - Renders counts (passed, failed, skipped, total)
 * - Duration formatting (ms vs seconds)
 * - Overall status text (All passed / N failed / Complete)
 * - Skipped count hidden when zero
 */
import { render, screen } from '@testing-library/react';
import { SummaryBar } from '../components/Results/SummaryBar';
import type { RunSummary } from '../../core/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeSummary(overrides: Partial<RunSummary> = {}): RunSummary {
  return {
    suiteName: 'Test Suite',
    total: 5,
    passed: 4,
    failed: 1,
    skipped: 0,
    duration: 320,
    results: [],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('SummaryBar', () => {
  // -------------------------------------------------------------------------
  // Counts display
  // -------------------------------------------------------------------------

  it('renders passed count', () => {
    render(<SummaryBar summary={makeSummary({ passed: 7, total: 10 })} />);
    expect(screen.getByText('7')).toBeInTheDocument();
    expect(screen.getByText('passed')).toBeInTheDocument();
  });

  it('renders failed count', () => {
    render(<SummaryBar summary={makeSummary({ failed: 3, total: 10 })} />);
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('failed')).toBeInTheDocument();
  });

  it('renders total count', () => {
    render(<SummaryBar summary={makeSummary({ total: 12 })} />);
    expect(screen.getByText('12 total')).toBeInTheDocument();
  });

  it('does NOT render skipped count when skipped is 0', () => {
    render(<SummaryBar summary={makeSummary({ skipped: 0 })} />);
    expect(screen.queryByText('skipped')).not.toBeInTheDocument();
  });

  it('renders skipped count when skipped > 0', () => {
    render(<SummaryBar summary={makeSummary({ skipped: 2 })} />);
    expect(screen.getByText('skipped')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // Overall status text
  // -------------------------------------------------------------------------

  it('shows "All passed" when failed is 0 and total > 0', () => {
    render(<SummaryBar summary={makeSummary({ total: 5, passed: 5, failed: 0 })} />);
    expect(screen.getByText('All passed')).toBeInTheDocument();
  });

  it('shows "<N> failed" when there are failures', () => {
    render(<SummaryBar summary={makeSummary({ total: 5, passed: 2, failed: 3 })} />);
    expect(screen.getByText('3 failed')).toBeInTheDocument();
  });

  it('shows "Complete" when total is 0', () => {
    render(<SummaryBar summary={makeSummary({ total: 0, passed: 0, failed: 0 })} />);
    expect(screen.getByText('Complete')).toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // Duration formatting
  // -------------------------------------------------------------------------

  it('formats duration under 1000ms as Nms', () => {
    render(<SummaryBar summary={makeSummary({ duration: 320 })} />);
    expect(screen.getByText('320ms')).toBeInTheDocument();
  });

  it('formats duration >= 1000ms as N.Xs', () => {
    render(<SummaryBar summary={makeSummary({ duration: 2400 })} />);
    expect(screen.getByText('2.4s')).toBeInTheDocument();
  });

  it('formats exactly 1000ms as 1.0s', () => {
    render(<SummaryBar summary={makeSummary({ duration: 1000 })} />);
    expect(screen.getByText('1.0s')).toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // Accessibility
  // -------------------------------------------------------------------------

  it('provides accessible label for run result', () => {
    render(<SummaryBar summary={makeSummary({ total: 3, passed: 3, failed: 0 })} />);
    const statusEl = screen.getByLabelText(/run result/i);
    expect(statusEl).toBeInTheDocument();
  });

  it('provides accessible label for failed run result', () => {
    render(<SummaryBar summary={makeSummary({ total: 3, passed: 1, failed: 2 })} />);
    const statusEl = screen.getByLabelText(/run result/i);
    expect(statusEl).toHaveAttribute('aria-label', 'Run result: 2 failed');
  });
});
