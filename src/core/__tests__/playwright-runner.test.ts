// =============================================================================
// Unit Tests: Playwright Runner — stepTimeout configuration (Sprint 4.2)
//
// These tests verify the timeout configuration logic in playwright-runner.ts
// without launching a real browser. We mock the chromium module so the tests
// stay fast and do not require a display / browser binary.
// =============================================================================

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { UiTestCase } from '../types.js';

// -----------------------------------------------------------------------------
// Mock playwright so we never open a real browser
// -----------------------------------------------------------------------------

const mockPageOn = vi.fn();
const mockPageGoto = vi.fn().mockResolvedValue(undefined);
const mockContextSetDefaultTimeout = vi.fn();
const mockContextClose = vi.fn().mockResolvedValue(undefined);
const mockBrowserNewContext = vi.fn();
const mockBrowserIsConnected = vi.fn().mockReturnValue(true);
const mockBrowserClose = vi.fn().mockResolvedValue(undefined);
const mockChromiumLaunch = vi.fn();

vi.mock('playwright', () => ({
  chromium: {
    launch: mockChromiumLaunch,
  },
}));

// -----------------------------------------------------------------------------
// Factory helpers
// -----------------------------------------------------------------------------

function makeUiTestCase(overrides: Partial<UiTestCase> = {}): UiTestCase {
  return {
    name: 'Navigate to homepage',
    type: 'ui',
    url: 'https://example.com',
    steps: [],
    ...overrides,
  };
}

function createMockPage() {
  return {
    on: mockPageOn,
    goto: mockPageGoto,
    waitForSelector: vi.fn().mockResolvedValue(undefined),
    click: vi.fn().mockResolvedValue(undefined),
    fill: vi.fn().mockResolvedValue(undefined),
    locator: vi.fn().mockReturnValue({
      first: vi.fn().mockReturnValue({
        textContent: vi.fn().mockResolvedValue('Example Domain'),
        isVisible: vi.fn().mockResolvedValue(false),
      }),
    }),
    screenshot: vi.fn().mockResolvedValue(undefined),
  };
}

function createMockContext(page: ReturnType<typeof createMockPage>) {
  return {
    setDefaultTimeout: mockContextSetDefaultTimeout,
    newPage: vi.fn().mockResolvedValue(page),
    close: mockContextClose,
  };
}

function createMockBrowser(context: ReturnType<typeof createMockContext>) {
  return {
    newContext: mockBrowserNewContext.mockResolvedValue(context),
    isConnected: mockBrowserIsConnected,
    close: mockBrowserClose,
  };
}

// -----------------------------------------------------------------------------
// Tests
// -----------------------------------------------------------------------------

describe('runUiTest() — stepTimeout configuration', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const page = createMockPage();
    const context = createMockContext(page);
    createMockBrowser(context);
    mockChromiumLaunch.mockResolvedValue({
      newContext: mockBrowserNewContext,
      isConnected: mockBrowserIsConnected,
      close: mockBrowserClose,
    });
  });

  afterEach(async () => {
    // Reset the shared browser instance between tests
    const { closeBrowser } = await import('../playwright-runner.js');
    await closeBrowser();
  });

  it('uses 30000ms default stepTimeout when stepTimeout is not specified', async () => {
    const { runUiTest } = await import('../playwright-runner.js');
    const testCase = makeUiTestCase({ steps: [] });

    await runUiTest(testCase);

    expect(mockContextSetDefaultTimeout).toHaveBeenCalledWith(30_000);
  });

  it('uses custom stepTimeout when specified', async () => {
    const { runUiTest } = await import('../playwright-runner.js');
    const testCase = makeUiTestCase({ steps: [], stepTimeout: 5000 });

    await runUiTest(testCase);

    expect(mockContextSetDefaultTimeout).toHaveBeenCalledWith(5000);
  });

  it('uses custom stepTimeout of 60000ms when specified', async () => {
    const { runUiTest } = await import('../playwright-runner.js');
    const testCase = makeUiTestCase({ steps: [], stepTimeout: 60_000 });

    await runUiTest(testCase);

    expect(mockContextSetDefaultTimeout).toHaveBeenCalledWith(60_000);
  });

  it('returns pass result when all steps complete within stepTimeout', async () => {
    const { runUiTest } = await import('../playwright-runner.js');
    const testCase = makeUiTestCase({ steps: [], stepTimeout: 5000 });

    const result = await runUiTest(testCase);

    expect(result.status).toBe('pass');
    expect(result.name).toBe('Navigate to homepage');
  });

  it('returns error result when browser context creation fails', async () => {
    const { runUiTest } = await import('../playwright-runner.js');
    mockBrowserNewContext.mockRejectedValueOnce(new Error('Browser context failed'));
    const testCase = makeUiTestCase({ steps: [] });

    const result = await runUiTest(testCase);

    expect(result.status).toBe('error');
    expect(result.error).toMatch(/Browser context failed/);
  });
});

describe('runUiTest() — element-not-found produces clear error', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const page = createMockPage();
    // Make waitForSelector throw (element not visible within timeout)
    page.waitForSelector = vi.fn().mockRejectedValue(new Error('Timeout'));
    const context = createMockContext(page);
    mockBrowserNewContext.mockResolvedValue(context);
    mockChromiumLaunch.mockResolvedValue({
      newContext: mockBrowserNewContext,
      isConnected: mockBrowserIsConnected,
      close: mockBrowserClose,
    });
  });

  afterEach(async () => {
    const { closeBrowser } = await import('../playwright-runner.js');
    await closeBrowser();
  });

  it('returns error status with descriptive message when click target is not found', async () => {
    const { runUiTest } = await import('../playwright-runner.js');
    const testCase = makeUiTestCase({
      steps: [{ action: 'click', selector: '#add-to-wishlist' }],
      stepTimeout: 1000,
    });

    const result = await runUiTest(testCase);

    expect(result.status).toBe('error');
    expect(result.error).toMatch(/Element not found/);
    expect(result.error).toContain('#add-to-wishlist');
  });

  it('returns error status with descriptive message when waitFor target is not found', async () => {
    const { runUiTest } = await import('../playwright-runner.js');
    const testCase = makeUiTestCase({
      steps: [{ action: 'waitFor', selector: '.wishlist-badge' }],
      stepTimeout: 1000,
    });

    const result = await runUiTest(testCase);

    expect(result.status).toBe('error');
    expect(result.error).toMatch(/Element not found/);
    expect(result.error).toContain('.wishlist-badge');
  });

  it('error message includes the stepTimeout value when element is not found', async () => {
    const { runUiTest } = await import('../playwright-runner.js');
    const testCase = makeUiTestCase({
      steps: [{ action: 'click', selector: '#missing-button' }],
      stepTimeout: 2500,
    });

    const result = await runUiTest(testCase);

    expect(result.error).toContain('2500ms');
  });
});

describe('runUiTestWithPage() — stepTimeout configuration', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const page = createMockPage();
    const context = createMockContext(page);
    mockBrowserNewContext.mockResolvedValue(context);
    mockChromiumLaunch.mockResolvedValue({
      newContext: mockBrowserNewContext,
      isConnected: mockBrowserIsConnected,
      close: mockBrowserClose,
    });
  });

  afterEach(async () => {
    const { closeBrowser } = await import('../playwright-runner.js');
    await closeBrowser();
  });

  it('sets context default timeout to stepTimeout value', async () => {
    const { runUiTestWithPage } = await import('../playwright-runner.js');
    const testCase = makeUiTestCase({ steps: [], stepTimeout: 8000 });

    const { result, cleanup } = await runUiTestWithPage(testCase);
    await cleanup();

    expect(result.status).toBe('pass');
    expect(mockContextSetDefaultTimeout).toHaveBeenCalledWith(8000);
  });

  it('returns getText callback on successful run', async () => {
    const { runUiTestWithPage } = await import('../playwright-runner.js');
    const testCase = makeUiTestCase({ steps: [] });

    const { result, getText, cleanup } = await runUiTestWithPage(testCase);
    await cleanup();

    expect(result.status).toBe('pass');
    expect(getText).toBeTypeOf('function');
  });

  it('returns null getText when a step fails', async () => {
    const { runUiTestWithPage } = await import('../playwright-runner.js');

    // Override context so waitForSelector throws
    const failPage = createMockPage();
    failPage.waitForSelector = vi.fn().mockRejectedValue(new Error('Timeout'));
    const failContext = createMockContext(failPage);
    mockBrowserNewContext.mockResolvedValue(failContext);

    const testCase = makeUiTestCase({
      steps: [{ action: 'click', selector: '#nonexistent' }],
    });

    const { result, getText, cleanup } = await runUiTestWithPage(testCase);
    await cleanup();

    expect(result.status).toBe('error');
    expect(getText).toBeNull();
  });
});
