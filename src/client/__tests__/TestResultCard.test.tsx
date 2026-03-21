/**
 * Tests for TestResultCard component.
 *
 * Covers:
 * - Renders test name, type badge, status badge, duration
 * - Expand/collapse on click for cards with details
 * - Keyboard expand/collapse (Enter and Space)
 * - Assertion rows in expanded view
 * - Error message in expanded view
 * - Screenshot in expanded view
 * - Non-expandable card (no details)
 */
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TestResultCard } from '../components/Results/TestResultCard';
import type { TestResult } from '../../core/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeResult(overrides: Partial<TestResult> = {}): TestResult {
  return {
    name: 'check wishlist count',
    type: 'api',
    status: 'pass',
    duration: 123,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('TestResultCard', () => {
  // -------------------------------------------------------------------------
  // Basic rendering
  // -------------------------------------------------------------------------

  it('renders the test name', () => {
    render(<TestResultCard result={makeResult({ name: 'add to wishlist API' })} />);
    expect(screen.getByText('add to wishlist API')).toBeInTheDocument();
  });

  it('renders the type badge for api test', () => {
    render(<TestResultCard result={makeResult({ type: 'api' })} />);
    expect(screen.getByLabelText('type: api')).toBeInTheDocument();
  });

  it('renders the type badge for ui test', () => {
    render(<TestResultCard result={makeResult({ type: 'ui' })} />);
    expect(screen.getByLabelText('type: ui')).toBeInTheDocument();
  });

  it('renders duration in ms when under 1000ms', () => {
    render(<TestResultCard result={makeResult({ duration: 450 })} />);
    expect(screen.getByText('450ms')).toBeInTheDocument();
  });

  it('renders duration in seconds when >= 1000ms', () => {
    render(<TestResultCard result={makeResult({ duration: 2300 })} />);
    expect(screen.getByText('2.3s')).toBeInTheDocument();
  });

  it('renders "--" for zero duration', () => {
    render(<TestResultCard result={makeResult({ duration: 0 })} />);
    expect(screen.getByText('--')).toBeInTheDocument();
  });

  it('renders pass status icon with PASS label', () => {
    render(<TestResultCard result={makeResult({ status: 'pass' })} />);
    expect(screen.getByLabelText('PASS')).toBeInTheDocument();
  });

  it('renders fail status icon with FAIL label', () => {
    render(
      <TestResultCard result={makeResult({ status: 'fail', error: 'assertion failed' })} />,
    );
    expect(screen.getByLabelText('FAIL')).toBeInTheDocument();
  });

  it('renders error status icon with ERROR label', () => {
    render(
      <TestResultCard result={makeResult({ status: 'error', error: 'timeout' })} />,
    );
    expect(screen.getByLabelText('ERROR')).toBeInTheDocument();
  });

  it('renders skipped status icon with SKIP label', () => {
    render(<TestResultCard result={makeResult({ status: 'skipped' })} />);
    expect(screen.getByLabelText('SKIP')).toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // Non-expandable card (no assertions, no error, no screenshot)
  // -------------------------------------------------------------------------

  it('does not render expand button when card has no details', () => {
    render(<TestResultCard result={makeResult({ status: 'pass' })} />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // Expandable card — error message
  // -------------------------------------------------------------------------

  it('renders expand button when card has an error', () => {
    render(<TestResultCard result={makeResult({ status: 'fail', error: 'HTTP 404' })} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('shows error details after expanding', async () => {
    const user = userEvent.setup();
    render(
      <TestResultCard
        result={makeResult({ status: 'fail', error: 'Expected 200 but got 404' })}
      />,
    );

    await user.click(screen.getByRole('button'));
    expect(screen.getByText('Expected 200 but got 404')).toBeInTheDocument();
  });

  it('hides error details after collapsing', async () => {
    const user = userEvent.setup();
    render(
      <TestResultCard result={makeResult({ status: 'fail', error: 'Server Error' })} />,
    );

    await user.click(screen.getByRole('button'));
    expect(screen.getByText('Server Error')).toBeInTheDocument();

    await user.click(screen.getByRole('button'));
    expect(screen.queryByText('Server Error')).not.toBeInTheDocument();
  });

  it('toggles expand/collapse with Enter key', () => {
    render(
      <TestResultCard result={makeResult({ status: 'error', error: 'timeout error' })} />,
    );

    const row = screen.getByRole('button');

    fireEvent.keyDown(row, { key: 'Enter' });
    expect(screen.getByText('timeout error')).toBeInTheDocument();

    fireEvent.keyDown(row, { key: 'Enter' });
    expect(screen.queryByText('timeout error')).not.toBeInTheDocument();
  });

  it('toggles expand/collapse with Space key', () => {
    render(
      <TestResultCard result={makeResult({ status: 'error', error: 'space error' })} />,
    );

    const row = screen.getByRole('button');

    fireEvent.keyDown(row, { key: ' ' });
    expect(screen.getByText('space error')).toBeInTheDocument();

    fireEvent.keyDown(row, { key: ' ' });
    expect(screen.queryByText('space error')).not.toBeInTheDocument();
  });

  it('does not expand on other key presses', () => {
    render(
      <TestResultCard result={makeResult({ status: 'error', error: 'key error' })} />,
    );

    const row = screen.getByRole('button');

    fireEvent.keyDown(row, { key: 'Tab' });
    expect(screen.queryByText('key error')).not.toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // Expandable card — assertions
  // -------------------------------------------------------------------------

  it('shows assertion rows in expanded view', async () => {
    const user = userEvent.setup();
    const result = makeResult({
      status: 'fail',
      assertions: [
        { type: 'status', expected: 200, actual: 404, passed: false },
        { type: 'jsonpath', expected: 'active', actual: 'inactive', passed: false },
      ],
    });

    render(<TestResultCard result={result} />);
    await user.click(screen.getByRole('button'));

    // Both assertion types should appear
    expect(screen.getByText('status')).toBeInTheDocument();
    expect(screen.getByText('jsonpath')).toBeInTheDocument();
  });

  it('shows passed assertion with PASS indicator', async () => {
    const user = userEvent.setup();
    const result = makeResult({
      status: 'pass',
      assertions: [
        { type: 'status', expected: 200, actual: 200, passed: true },
      ],
    });

    render(<TestResultCard result={result} />);
    await user.click(screen.getByRole('button'));

    // Assertion-level PASS (inside ExpandedDetails) - use getAllBy since status badge also says PASS
    const passTexts = screen.getAllByText('PASS');
    expect(passTexts.length).toBeGreaterThan(0);
  });

  it('shows expected vs actual values in assertion row', async () => {
    const user = userEvent.setup();
    const result = makeResult({
      status: 'fail',
      assertions: [
        { type: 'status', expected: 200, actual: 500, passed: false },
      ],
    });

    render(<TestResultCard result={result} />);
    await user.click(screen.getByRole('button'));

    // JSON.stringify wraps the values
    expect(screen.getByText('200')).toBeInTheDocument();
    expect(screen.getByText('500')).toBeInTheDocument();
  });

  it('shows "(not found)" when assertion actual is null', async () => {
    const user = userEvent.setup();
    const result = makeResult({
      status: 'fail',
      assertions: [
        { type: 'jsonpath', expected: 'value', actual: null, passed: false },
      ],
    });

    render(<TestResultCard result={result} />);
    await user.click(screen.getByRole('button'));

    expect(screen.getByText('(not found)')).toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // Expandable card — screenshot
  // -------------------------------------------------------------------------

  it('renders screenshot img in expanded view', async () => {
    const user = userEvent.setup();
    const result = makeResult({
      status: 'fail',
      screenshot: 'screenshots/run-123/test-fail.png',
    });

    render(<TestResultCard result={result} />);
    await user.click(screen.getByRole('button'));

    const img = screen.getByRole('img') as HTMLImageElement;
    expect(img).toBeInTheDocument();
    expect(img.src).toContain('/screenshots/run-123/test-fail.png');
  });

  it('renders "Open full screenshot" link', async () => {
    const user = userEvent.setup();
    const result = makeResult({
      status: 'fail',
      screenshot: 'screenshots/fail.png',
    });

    render(<TestResultCard result={result} />);
    await user.click(screen.getByRole('button'));

    const link = screen.getByRole('link', { name: /open full screenshot/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('strips leading "screenshots/" prefix when building src URL', async () => {
    const user = userEvent.setup();
    const result = makeResult({
      status: 'fail',
      screenshot: 'screenshots/run-42/image.png',
    });

    render(<TestResultCard result={result} />);
    await user.click(screen.getByRole('button'));

    const img = screen.getByRole('img') as HTMLImageElement;
    // Should not have double "screenshots/screenshots/"
    expect(img.src).not.toContain('screenshots/screenshots/');
    expect(img.src).toContain('/screenshots/run-42/image.png');
  });

  // -------------------------------------------------------------------------
  // Accessibility
  // -------------------------------------------------------------------------

  it('sets aria-expanded=false initially on expandable card', () => {
    render(<TestResultCard result={makeResult({ status: 'fail', error: 'err' })} />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'false');
  });

  it('sets aria-expanded=true after expanding', async () => {
    const user = userEvent.setup();
    render(<TestResultCard result={makeResult({ status: 'fail', error: 'err' })} />);

    await user.click(screen.getByRole('button'));
    expect(screen.getByRole('button')).toHaveAttribute('aria-expanded', 'true');
  });

  it('expanded details region has aria-label', async () => {
    const user = userEvent.setup();
    render(
      <TestResultCard
        result={makeResult({ name: 'my test', status: 'fail', error: 'err' })}
      />,
    );

    await user.click(screen.getByRole('button'));
    expect(screen.getByRole('region', { name: /details for my test/i })).toBeInTheDocument();
  });
});
