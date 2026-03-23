// =============================================================================
// Shared Browser Manager — Singleton Playwright browser for preview + tests
// =============================================================================
// Manages a single Playwright browser instance shared between:
// - Preview service (screenshot polling via the preview page)
// - Test runner (UI test execution via separate contexts)
//
// This eliminates the extra browser window that appeared when the test runner
// launched its own headless:false browser alongside the preview browser.
// =============================================================================

import { chromium } from 'playwright';
import type { Browser, Page, BrowserContext } from 'playwright';

// -----------------------------------------------------------------------------
// Configuration
// -----------------------------------------------------------------------------

const PREVIEW_VIEWPORT = { width: 1440, height: 900 };
const PREVIEW_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

// -----------------------------------------------------------------------------
// State
// -----------------------------------------------------------------------------

let browser: Browser | null = null;
let previewContext: BrowserContext | null = null;
let previewPage: Page | null = null;

// -----------------------------------------------------------------------------
// Browser Lifecycle
// -----------------------------------------------------------------------------

/**
 * Returns the shared browser instance, launching it if necessary.
 * Always headless — the preview service and test runner both share it.
 */
export async function getBrowser(): Promise<Browser> {
  if (!browser || !browser.isConnected()) {
    browser = await chromium.launch({ headless: true });
  }
  return browser;
}

/**
 * Returns the dedicated preview page, creating the context and page if needed.
 * The preview page persists across navigations — the screenshot loop reads from it.
 */
export async function getPreviewPage(): Promise<Page> {
  if (previewPage && !previewPage.isClosed()) {
    return previewPage;
  }

  const b = await getBrowser();

  previewContext = await b.newContext({
    viewport: PREVIEW_VIEWPORT,
    userAgent: PREVIEW_USER_AGENT,
  });

  previewPage = await previewContext.newPage();

  // Suppress unhandled page JS errors
  previewPage.on('pageerror', () => {});

  return previewPage;
}

/**
 * Takes a screenshot of the current preview page.
 * Returns null if no preview page is active.
 */
export async function takePreviewScreenshot(quality: number): Promise<Buffer | null> {
  if (!previewPage || previewPage.isClosed()) {
    return null;
  }

  try {
    return await previewPage.screenshot({
      type: 'jpeg',
      quality,
      fullPage: false,
    });
  } catch {
    // Page may have navigated or crashed — skip this frame
    return null;
  }
}

/**
 * Returns the preview page for test execution.
 * Tests run directly on the preview page so they share cookies/session
 * and actions are visible in the preview screenshots.
 * Returns null if no preview session is active.
 */
export async function getTestPage(): Promise<Page | null> {
  if (previewPage && !previewPage.isClosed()) {
    return previewPage;
  }
  return null;
}

/**
 * Closes the preview page and its context, but keeps the browser alive.
 * Called when the user stops the preview session.
 */
export async function closePreview(): Promise<void> {
  if (previewPage && !previewPage.isClosed()) {
    await previewPage.close().catch(() => {});
  }
  previewPage = null;

  if (previewContext) {
    await previewContext.close().catch(() => {});
  }
  previewContext = null;
}

/**
 * Shuts down the entire browser instance and all contexts.
 * Called during graceful server shutdown.
 */
export async function closeBrowser(): Promise<void> {
  previewPage = null;
  previewContext = null;

  if (browser) {
    await browser.close().catch(() => {});
    browser = null;
  }
}
