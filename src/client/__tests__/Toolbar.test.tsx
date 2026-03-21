/**
 * Tests for Toolbar component.
 *
 * Verifies:
 * - Renders URL input, Run, Abort, Save, Load buttons
 * - Run button disabled when isRunning=true
 * - Abort button disabled when isRunning=false
 * - URL input reflects targetUrl prop and fires onChange
 * - Run button calls onRun
 * - Abort button calls onAbort
 * - Save button opens Save dialog
 * - Load button opens Load dialog
 * - Dialog closes on cancel
 * - Keyboard shortcut Ctrl+Enter triggers run
 */
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Toolbar } from '../components/Toolbar/Toolbar';
import type { ToolbarProps } from '../components/Toolbar/Toolbar';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function defaultProps(overrides: Partial<ToolbarProps> = {}): ToolbarProps {
  return {
    targetUrl: '',
    onTargetUrlChange: vi.fn(),
    onRun: vi.fn(),
    onAbort: vi.fn(),
    isRunning: false,
    onSave: vi.fn(),
    onLoad: vi.fn(),
    suiteFiles: [],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Toolbar', () => {
  // -------------------------------------------------------------------------
  // Rendering
  // -------------------------------------------------------------------------

  it('renders URL input', () => {
    render(<Toolbar {...defaultProps()} />);
    expect(screen.getByRole('textbox', { name: /target url/i })).toBeInTheDocument();
  });

  it('renders Run button', () => {
    render(<Toolbar {...defaultProps()} />);
    expect(screen.getByRole('button', { name: /run test suite/i })).toBeInTheDocument();
  });

  it('renders Abort button', () => {
    render(<Toolbar {...defaultProps()} />);
    expect(screen.getByRole('button', { name: /abort/i })).toBeInTheDocument();
  });

  it('renders Save button', () => {
    render(<Toolbar {...defaultProps()} />);
    expect(screen.getByRole('button', { name: /save test suite/i })).toBeInTheDocument();
  });

  it('renders Load button', () => {
    render(<Toolbar {...defaultProps()} />);
    expect(screen.getByRole('button', { name: /load test suite/i })).toBeInTheDocument();
  });

  it('shows the toolbar with correct aria role', () => {
    render(<Toolbar {...defaultProps()} />);
    expect(screen.getByRole('toolbar', { name: /test run toolbar/i })).toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // URL input
  // -------------------------------------------------------------------------

  it('displays the targetUrl prop value', () => {
    render(<Toolbar {...defaultProps({ targetUrl: 'https://myshop.myshopify.com' })} />);
    const input = screen.getByRole('textbox', { name: /target url/i }) as HTMLInputElement;
    expect(input.value).toBe('https://myshop.myshopify.com');
  });

  it('calls onTargetUrlChange when URL input changes', async () => {
    const user = userEvent.setup();
    const onTargetUrlChange = vi.fn();
    render(<Toolbar {...defaultProps({ onTargetUrlChange })} />);

    const input = screen.getByRole('textbox', { name: /target url/i });
    await user.type(input, 'https://example.com');

    expect(onTargetUrlChange).toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // Button states when idle (not running)
  // -------------------------------------------------------------------------

  it('Run button is enabled when not running', () => {
    render(<Toolbar {...defaultProps({ isRunning: false })} />);
    const runButton = screen.getByRole('button', { name: /run test suite/i });
    expect(runButton).not.toBeDisabled();
  });

  it('Abort button is disabled when not running', () => {
    render(<Toolbar {...defaultProps({ isRunning: false })} />);
    const abortButton = screen.getByRole('button', { name: /abort/i });
    expect(abortButton).toBeDisabled();
  });

  // -------------------------------------------------------------------------
  // Button states when running
  // -------------------------------------------------------------------------

  it('Run button is disabled when running', () => {
    render(<Toolbar {...defaultProps({ isRunning: true })} />);
    const runButton = screen.getByRole('button', { name: /tests are running/i });
    expect(runButton).toBeDisabled();
  });

  it('Abort button is enabled when running', () => {
    render(<Toolbar {...defaultProps({ isRunning: true })} />);
    const abortButton = screen.getByRole('button', { name: /abort/i });
    expect(abortButton).not.toBeDisabled();
  });

  it('shows "Running…" text on Run button when running', () => {
    render(<Toolbar {...defaultProps({ isRunning: true })} />);
    expect(screen.getByText('Running…')).toBeInTheDocument();
  });

  // -------------------------------------------------------------------------
  // Button callbacks
  // -------------------------------------------------------------------------

  it('calls onRun when Run button is clicked', async () => {
    const user = userEvent.setup();
    const onRun = vi.fn();
    render(<Toolbar {...defaultProps({ onRun })} />);

    await user.click(screen.getByRole('button', { name: /run test suite/i }));

    expect(onRun).toHaveBeenCalledTimes(1);
  });

  it('calls onAbort when Abort button is clicked while running', async () => {
    const user = userEvent.setup();
    const onAbort = vi.fn();
    render(<Toolbar {...defaultProps({ isRunning: true, onAbort })} />);

    await user.click(screen.getByRole('button', { name: /abort/i }));

    expect(onAbort).toHaveBeenCalledTimes(1);
  });

  // -------------------------------------------------------------------------
  // Keyboard shortcut
  // -------------------------------------------------------------------------

  it('fires onRun on Ctrl+Enter when not running', () => {
    const onRun = vi.fn();
    render(<Toolbar {...defaultProps({ onRun })} />);

    fireEvent.keyDown(document, { key: 'Enter', ctrlKey: true });

    expect(onRun).toHaveBeenCalledTimes(1);
  });

  it('does NOT fire onRun on Ctrl+Enter when already running', () => {
    const onRun = vi.fn();
    render(<Toolbar {...defaultProps({ isRunning: true, onRun })} />);

    fireEvent.keyDown(document, { key: 'Enter', ctrlKey: true });

    expect(onRun).not.toHaveBeenCalled();
  });

  it('fires onRun on Cmd+Enter (Meta+Enter) when not running', () => {
    const onRun = vi.fn();
    render(<Toolbar {...defaultProps({ onRun })} />);

    fireEvent.keyDown(document, { key: 'Enter', metaKey: true });

    expect(onRun).toHaveBeenCalledTimes(1);
  });

  // -------------------------------------------------------------------------
  // Save dialog
  // -------------------------------------------------------------------------

  it('opens Save dialog when Save button is clicked', async () => {
    const user = userEvent.setup();
    render(<Toolbar {...defaultProps()} />);

    await user.click(screen.getByRole('button', { name: /save test suite/i }));

    expect(screen.getByRole('dialog', { name: /save test suite/i })).toBeInTheDocument();
  });

  it('closes Save dialog when Cancel is clicked', async () => {
    const user = userEvent.setup();
    render(<Toolbar {...defaultProps()} />);

    await user.click(screen.getByRole('button', { name: /save test suite/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /cancel/i }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes Save dialog when Escape is pressed', async () => {
    const user = userEvent.setup();
    render(<Toolbar {...defaultProps()} />);

    await user.click(screen.getByRole('button', { name: /save test suite/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('calls onSave with filename.json when Save form submitted', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<Toolbar {...defaultProps({ onSave })} />);

    await user.click(screen.getByRole('button', { name: /save test suite/i }));

    const filenameInput = screen.getByRole('textbox', { name: /filename/i });
    await user.type(filenameInput, 'my-suite');

    await user.click(screen.getByRole('button', { name: /^save$/i }));

    expect(onSave).toHaveBeenCalledWith('my-suite.json');
  });

  it('appends .json extension only once if already provided', async () => {
    const user = userEvent.setup();
    const onSave = vi.fn();
    render(<Toolbar {...defaultProps({ onSave })} />);

    await user.click(screen.getByRole('button', { name: /save test suite/i }));

    const filenameInput = screen.getByRole('textbox', { name: /filename/i });
    await user.type(filenameInput, 'my-suite.json');

    await user.click(screen.getByRole('button', { name: /^save$/i }));

    expect(onSave).toHaveBeenCalledWith('my-suite.json');
  });

  // -------------------------------------------------------------------------
  // Load dialog
  // -------------------------------------------------------------------------

  it('opens Load dialog when Load button is clicked', async () => {
    const user = userEvent.setup();
    render(<Toolbar {...defaultProps({ suiteFiles: ['suite-a.json'] })} />);

    await user.click(screen.getByRole('button', { name: /load test suite/i }));

    expect(screen.getByRole('dialog', { name: /load test suite/i })).toBeInTheDocument();
  });

  it('shows empty state when no suite files available', async () => {
    const user = userEvent.setup();
    render(<Toolbar {...defaultProps({ suiteFiles: [] })} />);

    await user.click(screen.getByRole('button', { name: /load test suite/i }));

    expect(screen.getByText(/no saved test suites found/i)).toBeInTheDocument();
  });

  it('lists available suite files', async () => {
    const user = userEvent.setup();
    render(
      <Toolbar
        {...defaultProps({
          suiteFiles: ['suite-a.json', 'suite-b.json'],
        })}
      />,
    );

    await user.click(screen.getByRole('button', { name: /load test suite/i }));

    expect(screen.getByText('suite-a.json')).toBeInTheDocument();
    expect(screen.getByText('suite-b.json')).toBeInTheDocument();
  });

  it('calls onLoad with filename when a suite file is selected', async () => {
    const user = userEvent.setup();
    const onLoad = vi.fn();
    render(
      <Toolbar
        {...defaultProps({
          suiteFiles: ['suite-a.json', 'suite-b.json'],
          onLoad,
        })}
      />,
    );

    await user.click(screen.getByRole('button', { name: /load test suite/i }));
    await user.click(screen.getByText('suite-b.json'));

    expect(onLoad).toHaveBeenCalledWith('suite-b.json');
  });

  it('closes Load dialog after selecting a file', async () => {
    const user = userEvent.setup();
    render(
      <Toolbar
        {...defaultProps({
          suiteFiles: ['suite-a.json'],
        })}
      />,
    );

    await user.click(screen.getByRole('button', { name: /load test suite/i }));
    await user.click(screen.getByText('suite-a.json'));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes Load dialog by clicking Cancel', async () => {
    const user = userEvent.setup();
    render(<Toolbar {...defaultProps()} />);

    await user.click(screen.getByRole('button', { name: /load test suite/i }));
    await user.click(screen.getByRole('button', { name: /cancel/i }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes dialog when clicking backdrop overlay', async () => {
    const user = userEvent.setup();
    render(<Toolbar {...defaultProps()} />);

    await user.click(screen.getByRole('button', { name: /load test suite/i }));

    const dialog = screen.getByRole('dialog');
    // The SaveLoadDialog uses onClick with e.target === e.currentTarget check.
    // We simulate this by dispatching the event directly on the backdrop element
    // so currentTarget and target both point to it.
    const backdrop = dialog as HTMLElement;
    fireEvent.click(backdrop);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
