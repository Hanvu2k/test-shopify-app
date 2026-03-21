/**
 * Tests for ResultsPanel component.
 *
 * Verifies:
 * - Empty state rendering when no results
 * - TestResultCard entries rendered per result
 * - SummaryBar rendered when run complete and not running
 * - Progress bar rendered when running with progress
 * - Progress bar hidden when not running
 * - SummaryBar hidden when running
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ResultsPanel } from '../components/Results/ResultsPanel';
import type { TestResult, RunSummary } from '../../core/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeResult(overrides: Partial<TestResult> = {}): TestResult {
  return {
    name: 'default test',
    type: 'api',
    status: 'pass',
    duration: 100,
    ...overrides,
  };
}

function makeSummary(overrides: Partial<RunSummary> = {}): RunSummary {
  return {
    suiteName: 'Suite',
    total: 2,
    passed: 2,
    failed: 0,
    skipped: 0,
    duration: 300,
    results: [],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ResultsPanel', () => {
  // -------------------------------------------------------------------------
  // Empty state
  // -------------------------------------------------------------------------

  it('shows empty state message when results are empty and not running', () => {
    render(<ResultsPanel results={[]} summary={null} isRunning={false} />);
    expect(screen.getByText(/No results yet/i)).toBeInTheDocument();
  });

  it('shows "Run" hint in empty state', () => {
    render(<ResultsPanel results={[]} summary={null} isRunning={false} />);
    expect(screen.getByText(/Run/i)).toBeInTheDocument();
  });

  it('does not show empty state when results exist', () => {
    render(
      <ResultsPanel
        results={[makeResult({ name: 'test A' })]}
        summary={null}
        isRunning={false}
      />,
    );
    expect(screen.queryByText(/No results yet/i)).not.toBeInTheDocument();
  });

  it('does not show empty state when running (even with no results)', () => {
    render(<ResultsPanel results={[]} summary={null} isRunning={true} />);
    expect(screen.queryByText(/No results yet/i)).not.toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // Result cards
  // -------------------------------------------------------------------------

  it('renders one card per result', () => {
    const results = [
      makeResult({ name: 'add to wishlist' }),
      makeResult({ name: 'remove from wishlist', status: 'fail' }),
    ];

    render(<ResultsPanel results={results} summary={null} isRunning={false} />);

    expect(screen.getByText('add to wishlist')).toBeInTheDocument();
    expect(screen.getByText('remove from wishlist')).toBeInTheDocument();
  });

  it('renders pass status for passing test', () => {
    render(
      <ResultsPanel
        results={[makeResult({ name: 'pass test', status: 'pass' })]}
        summary={null}
        isRunning={false}
      />,
    );
    // Status icon PASS is labelled
    expect(screen.getByLabelText('PASS')).toBeInTheDocument();
  });

  it('renders fail status for failing test', () => {
    render(
      <ResultsPanel
        results={[makeResult({ name: 'fail test', status: 'fail' })]}
        summary={null}
        isRunning={false}
      />,
    );
    expect(screen.getByLabelText('FAIL')).toBeInTheDocument();
  });

  it('renders error status for errored test', () => {
    render(
      <ResultsPanel
        results={[makeResult({ name: 'error test', status: 'error' })]}
        summary={null}
        isRunning={false}
      />,
    );
    expect(screen.getByLabelText('ERROR')).toBeInTheDocument();
  });

  it('renders skipped status for skipped test', () => {
    render(
      <ResultsPanel
        results={[makeResult({ name: 'skipped test', status: 'skipped' })]}
        summary={null}
        isRunning={false}
      />,
    );
    expect(screen.getByLabelText('SKIP')).toBeInTheDocument();
  });

  it('renders type badges for api and ui tests', () => {
    const results = [
      makeResult({ name: 'API test', type: 'api' }),
      makeResult({ name: 'UI test', type: 'ui' }),
    ];

    render(<ResultsPanel results={results} summary={null} isRunning={false} />);

    expect(screen.getByLabelText('type: api')).toBeInTheDocument();
    expect(screen.getByLabelText('type: ui')).toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // Progress bar
  // -------------------------------------------------------------------------

  it('renders progress bar when running with progress data', () => {
    render(
      <ResultsPanel
        results={[]}
        summary={null}
        isRunning={true}
        progress={{ current: 2, total: 5 }}
      />,
    );

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toBeInTheDocument();
    expect(progressBar).toHaveAttribute('aria-valuenow', '2');
    expect(progressBar).toHaveAttribute('aria-valuemax', '5');
  });

  it('does NOT render progress bar when not running', () => {
    render(
      <ResultsPanel
        results={[makeResult()]}
        summary={null}
        isRunning={false}
        progress={{ current: 2, total: 5 }}
      />,
    );
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('does NOT render progress bar when running but no progress data provided', () => {
    render(<ResultsPanel results={[]} summary={null} isRunning={true} />);
    expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('shows "Running..." text in progress bar', () => {
    render(
      <ResultsPanel
        results={[]}
        summary={null}
        isRunning={true}
        progress={{ current: 1, total: 3 }}
      />,
    );
    expect(screen.getByText(/Running/i)).toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // SummaryBar visibility
  // -------------------------------------------------------------------------

  it('renders SummaryBar when summary present and not running', () => {
    const summary = makeSummary({ total: 2, passed: 2, failed: 0 });

    render(
      <ResultsPanel
        results={[makeResult()]}
        summary={summary}
        isRunning={false}
      />,
    );

    expect(screen.getByText('All passed')).toBeInTheDocument();
  });

  it('hides SummaryBar when run is still in progress', () => {
    const summary = makeSummary({ total: 2, passed: 2, failed: 0 });

    render(
      <ResultsPanel
        results={[makeResult()]}
        summary={summary}
        isRunning={true}
      />,
    );

    expect(screen.queryByText('All passed')).not.toBeInTheDocument();
  });

  it('hides SummaryBar when summary is null', () => {
    render(
      <ResultsPanel results={[makeResult()]} summary={null} isRunning={false} />,
    );
    expect(screen.queryByText('All passed')).not.toBeInTheDocument();
    expect(screen.queryByText('passed')).not.toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // Expandable details
  // -------------------------------------------------------------------------

  it('expands test result card details on click when test has error', async () => {
    const user = userEvent.setup();
    const result = makeResult({
      name: 'failing test',
      status: 'fail',
      error: 'Expected 200 but got 404',
    });

    render(<ResultsPanel results={[result]} summary={null} isRunning={false} />);

    // Click the result row to expand
    const row = screen.getByRole('button', { name: /failing test/i });
    await user.click(row);

    // Error should be visible in expanded details
    expect(screen.getByText('Expected 200 but got 404')).toBeInTheDocument();
  });

  it('collapses expanded card on second click', async () => {
    const user = userEvent.setup();
    const result = makeResult({
      name: 'toggle test',
      status: 'fail',
      error: 'Some error message',
    });

    render(<ResultsPanel results={[result]} summary={null} isRunning={false} />);

    const row = screen.getByRole('button', { name: /toggle test/i });

    await user.click(row);
    expect(screen.getByText('Some error message')).toBeInTheDocument();

    await user.click(row);
    expect(screen.queryByText('Some error message')).not.toBeInTheDocument();
  });

  it('does not make card expandable if it has no details', () => {
    const result = makeResult({ name: 'simple pass', status: 'pass' });

    render(<ResultsPanel results={[result]} summary={null} isRunning={false} />);

    // A plain passing test with no assertions/error should not have role=button
    expect(screen.queryByRole('button', { name: /simple pass/i })).not.toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // Accessible regions
  // -------------------------------------------------------------------------

  it('has aria-live region for results list', () => {
    render(<ResultsPanel results={[]} summary={null} isRunning={false} />);
    const liveRegion = screen.getByRole('generic', { name: /test results/i });
    expect(liveRegion).toHaveAttribute('aria-live', 'polite');
  });
});
