// =============================================================================
// Playwright Runner — Browser automation for UI test cases
// =============================================================================

import { chromium, type Browser, type BrowserContext, type Page } from 'playwright';
import { mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { UiTestCase, TestResult, UiStep, AssertionResult } from './types.js';

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_SCREENSHOT_DIR = join(process.cwd(), 'screenshots');

// Common selectors used as fallbacks for logout action
const LOGOUT_FALLBACK_SELECTORS = [
  'a[href*="logout"]',
  'button:has-text("Logout")',
  'button:has-text("Log out")',
  'button:has-text("Sign out")',
  'a:has-text("Logout")',
  'a:has-text("Log out")',
  'a:has-text("Sign out")',
];

// -----------------------------------------------------------------------------
// Browser Lifecycle
// -----------------------------------------------------------------------------

let browserInstance: Browser | null = null;

/** Launch a shared Chromium browser instance (headless: false). */
export async function launchBrowser(): Promise<void> {
  if (browserInstance && browserInstance.isConnected()) {
    return;
  }
  browserInstance = await chromium.launch({ headless: false });
}

/** Close the shared browser instance and release resources. */
export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
  }
}

// -----------------------------------------------------------------------------
// Step Executors
// -----------------------------------------------------------------------------

async function executeNavigate(page: Page, step: UiStep, testCaseUrl: string): Promise<void> {
  const targetUrl = step.value || testCaseUrl;
  await page.goto(targetUrl, { waitUntil: 'domcontentloaded' });
}

async function executeClick(page: Page, step: UiStep, timeoutMs: number): Promise<void> {
  if (!step.selector) {
    throw new Error('Click step requires a selector');
  }
  try {
    await page.waitForSelector(step.selector, { state: 'visible', timeout: timeoutMs });
  } catch {
    throw new Error(`Element not found: "${step.selector}" was not visible within ${timeoutMs}ms`);
  }
  await page.click(step.selector);
}

async function executeFill(page: Page, step: UiStep, timeoutMs: number): Promise<void> {
  if (!step.selector) {
    throw new Error('Fill step requires a selector');
  }
  if (step.value === undefined) {
    throw new Error('Fill step requires a value');
  }
  try {
    await page.waitForSelector(step.selector, { state: 'visible', timeout: timeoutMs });
  } catch {
    throw new Error(`Element not found: "${step.selector}" was not visible within ${timeoutMs}ms`);
  }
  await page.fill(step.selector, step.value);
}

async function executeWaitFor(page: Page, step: UiStep, timeoutMs: number): Promise<void> {
  if (!step.selector) {
    throw new Error('WaitFor step requires a selector');
  }
  try {
    await page.waitForSelector(step.selector, { state: 'visible', timeout: timeoutMs });
  } catch {
    throw new Error(`Element not found: "${step.selector}" was not visible within ${timeoutMs}ms`);
  }
}

async function executeAssertText(
  page: Page,
  step: UiStep,
  timeoutMs: number,
): Promise<AssertionResult> {
  if (!step.selector) {
    throw new Error('AssertText step requires a selector');
  }
  if (step.expected === undefined) {
    throw new Error('AssertText step requires an expected value');
  }

  try {
    await page.waitForSelector(step.selector, { state: 'visible', timeout: timeoutMs });
  } catch {
    throw new Error(`Element not found: "${step.selector}" was not visible within ${timeoutMs}ms`);
  }
  const element = page.locator(step.selector).first();
  const actualText = (await element.textContent()) ?? '';
  const trimmedActual = actualText.trim();
  const passed = trimmedActual === step.expected;

  return {
    type: 'assertText',
    expected: step.expected,
    actual: trimmedActual,
    passed,
  };
}

async function executeLogin(page: Page, step: UiStep, timeoutMs: number): Promise<void> {
  const email = step.email ?? '';
  const password = step.password ?? '';

  const emailSelector = 'input[type="email"]';
  const passwordSelector = 'input[type="password"]';
  const submitSelector = 'button[type="submit"]';

  try {
    await page.waitForSelector(emailSelector, { state: 'visible', timeout: timeoutMs });
  } catch {
    throw new Error(`Login failed: email field "${emailSelector}" not found within ${timeoutMs}ms`);
  }
  await page.fill(emailSelector, email);

  try {
    await page.waitForSelector(passwordSelector, { state: 'visible', timeout: timeoutMs });
  } catch {
    throw new Error(`Login failed: password field "${passwordSelector}" not found within ${timeoutMs}ms`);
  }
  await page.fill(passwordSelector, password);

  try {
    await page.waitForSelector(submitSelector, { state: 'visible', timeout: timeoutMs });
  } catch {
    throw new Error(`Login failed: submit button "${submitSelector}" not found within ${timeoutMs}ms`);
  }
  await page.click(submitSelector);
}

async function executeLogout(page: Page, step: UiStep, timeoutMs: number): Promise<void> {
  if (step.selector) {
    try {
      await page.waitForSelector(step.selector, { state: 'visible', timeout: timeoutMs });
    } catch {
      throw new Error(`Logout failed: element "${step.selector}" not found within ${timeoutMs}ms`);
    }
    await page.click(step.selector);
    return;
  }

  // Try common logout selectors as fallback
  for (const selector of LOGOUT_FALLBACK_SELECTORS) {
    try {
      const element = page.locator(selector).first();
      if (await element.isVisible({ timeout: 2000 })) {
        await element.click();
        return;
      }
    } catch {
      // Selector not found, try next
    }
  }

  throw new Error('Logout step failed: no logout element found with provided or fallback selectors');
}

// -----------------------------------------------------------------------------
// Screenshot Helper
// -----------------------------------------------------------------------------

function ensureScreenshotDir(dir: string): void {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}

function buildScreenshotPath(testName: string, dir: string): string {
  const sanitizedName = testName.replace(/[^a-zA-Z0-9_-]/g, '_');
  const timestamp = Date.now();
  return join(dir, `${sanitizedName}-${timestamp}.png`);
}

// -----------------------------------------------------------------------------
// Main Runner
// -----------------------------------------------------------------------------

export interface RunUiTestOptions {
  screenshotDir?: string;
  /** When provided, tests run inside this context instead of launching a new browser. */
  browserContext?: BrowserContext;
  /** When provided, tests run directly on this page (shares cookies/session). */
  existingPage?: Page;
}

/** Combined result containing both the TestResult and a getText callback for saveAs extraction. */
export interface UiTestResultWithPage {
  result: TestResult;
  /** Async callback to extract visible text from a selector on the page. Null if page is unavailable. */
  getText: ((selector: string) => Promise<string>) | null;
}

/**
 * Execute a UI test case and return both the TestResult and a getText callback
 * bound to the page. The suite-runner uses getText for saveAs variable extraction.
 *
 * IMPORTANT: The caller MUST call cleanup() when done with getText to close the
 * browser context. If getText is not needed, cleanup is called automatically.
 */
export async function runUiTestWithPage(
  testCase: UiTestCase,
  options?: RunUiTestOptions,
): Promise<UiTestResultWithPage & { cleanup: () => Promise<void> }> {
  const startTime = Date.now();
  const screenshotDir = options?.screenshotDir ?? DEFAULT_SCREENSHOT_DIR;
  const stepTimeoutMs = testCase.stepTimeout ?? DEFAULT_TIMEOUT_MS;
  const assertions: AssertionResult[] = [];
  const externalContext = options?.browserContext ?? null;
  const existingPage = options?.existingPage ?? null;

  // Only launch the standalone browser when no external context/page is provided (CLI mode)
  if (!externalContext && !existingPage) {
    await launchBrowser();
  }

  let context: BrowserContext | null = null;
  let page: Page | null = null;
  const ownsContext = !externalContext && !existingPage;

  try {
    if (existingPage) {
      // Reuse the preview page directly — shares cookies, session, and shows in preview
      page = existingPage;
      context = null; // we don't own any context
    } else {
      context = externalContext ?? await browserInstance!.newContext();
      context.setDefaultTimeout(stepTimeoutMs);
      page = await context.newPage();
    }

    page.on('pageerror', () => {});

    await page.goto(testCase.url, { waitUntil: 'domcontentloaded' });

    for (const step of testCase.steps) {
      try {
        switch (step.action) {
          case 'navigate':
            await executeNavigate(page, step, testCase.url);
            break;
          case 'click':
            await executeClick(page, step, stepTimeoutMs);
            break;
          case 'fill':
            await executeFill(page, step, stepTimeoutMs);
            break;
          case 'waitFor':
            await executeWaitFor(page, step, stepTimeoutMs);
            break;
          case 'assertText': {
            const assertionResult = await executeAssertText(page, step, stepTimeoutMs);
            assertions.push(assertionResult);
            if (!assertionResult.passed) {
              const screenshotPath = await captureFailureScreenshot(page, testCase.name, screenshotDir);
              const result: TestResult = {
                name: testCase.name,
                type: 'ui',
                status: 'fail',
                duration: Date.now() - startTime,
                assertions,
                error: `Assertion failed: expected "${assertionResult.expected}" but got "${assertionResult.actual}"`,
                screenshot: screenshotPath,
              };
              // Close context on failure — only if we own it
              if (ownsContext && context) await context.close().catch(() => {});
              return { result, getText: null, cleanup: async () => {} };
            }
            break;
          }
          case 'login':
            await executeLogin(page, step, stepTimeoutMs);
            break;
          case 'logout':
            await executeLogout(page, step, stepTimeoutMs);
            break;
          default:
            throw new Error(`Unknown step action: ${(step as UiStep).action}`);
        }
      } catch (stepError) {
        const errorMessage = stepError instanceof Error ? stepError.message : String(stepError);
        const screenshotPath = await captureFailureScreenshot(page, testCase.name, screenshotDir);
        const result: TestResult = {
          name: testCase.name,
          type: 'ui',
          status: 'error',
          duration: Date.now() - startTime,
          assertions: assertions.length > 0 ? assertions : undefined,
          error: `Step "${step.action}" failed: ${errorMessage}`,
          screenshot: screenshotPath,
        };
        if (ownsContext && context) await context.close().catch(() => {});
        return { result, getText: null, cleanup: async () => {} };
      }
    }

    // All steps passed — keep page alive for saveAs getText
    const boundPage = page;
    const boundContext = context;
    const shouldCloseContext = ownsContext;
    const getText = async (selector: string): Promise<string> => {
      await boundPage.waitForSelector(selector, { state: 'visible', timeout: stepTimeoutMs });
      const element = boundPage.locator(selector).first();
      const text = (await element.textContent()) ?? '';
      return text.trim();
    };
    const cleanup = async () => {
      if (shouldCloseContext && boundContext) {
        await boundContext.close().catch(() => {});
      }
    };

    return {
      result: {
        name: testCase.name,
        type: 'ui',
        status: 'pass',
        duration: Date.now() - startTime,
        assertions: assertions.length > 0 ? assertions : undefined,
      },
      getText,
      cleanup,
    };
  } catch (outerError) {
    const errorMessage = outerError instanceof Error ? outerError.message : String(outerError);
    const screenshotPath = page
      ? await captureFailureScreenshot(page, testCase.name, screenshotDir)
      : undefined;
    if (ownsContext && context) {
      await context.close().catch(() => {});
    }
    return {
      result: {
        name: testCase.name,
        type: 'ui',
        status: 'error',
        duration: Date.now() - startTime,
        error: `Test execution error: ${errorMessage}`,
        screenshot: screenshotPath,
      },
      getText: null,
      cleanup: async () => {},
    };
  }
}

/**
 * Execute a UI test case by driving a Playwright browser through its steps.
 *
 * Launches the shared browser if it is not already running.
 * Captures a screenshot on any failure and includes the path in the result.
 */
export async function runUiTest(
  testCase: UiTestCase,
  options?: RunUiTestOptions,
): Promise<TestResult> {
  const startTime = Date.now();
  const screenshotDir = options?.screenshotDir ?? DEFAULT_SCREENSHOT_DIR;
  const stepTimeoutMs = testCase.stepTimeout ?? DEFAULT_TIMEOUT_MS;
  const assertions: AssertionResult[] = [];
  const externalContext = options?.browserContext ?? null;

  // Only launch standalone browser when no external context is provided (CLI mode)
  if (!externalContext) {
    await launchBrowser();
  }

  let context: BrowserContext | null = null;
  let page: Page | null = null;
  const ownsContext = !externalContext;

  try {
    context = externalContext ?? await browserInstance!.newContext();
    context.setDefaultTimeout(stepTimeoutMs);
    page = await context.newPage();

    // Suppress unhandled page errors so they don't crash the process
    page.on('pageerror', () => {
      // Intentionally ignored — page JS errors should not abort the test runner
    });

    // Navigate to the test case URL
    await page.goto(testCase.url, { waitUntil: 'domcontentloaded' });

    // Execute each step sequentially
    for (const step of testCase.steps) {
      try {
        switch (step.action) {
          case 'navigate':
            await executeNavigate(page, step, testCase.url);
            break;

          case 'click':
            await executeClick(page, step, stepTimeoutMs);
            break;

          case 'fill':
            await executeFill(page, step, stepTimeoutMs);
            break;

          case 'waitFor':
            await executeWaitFor(page, step, stepTimeoutMs);
            break;

          case 'assertText': {
            const assertionResult = await executeAssertText(page, step, stepTimeoutMs);
            assertions.push(assertionResult);
            if (!assertionResult.passed) {
              const screenshotPath = await captureFailureScreenshot(
                page,
                testCase.name,
                screenshotDir,
              );
              return {
                name: testCase.name,
                type: 'ui',
                status: 'fail',
                duration: Date.now() - startTime,
                assertions,
                error: `Assertion failed: expected "${assertionResult.expected}" but got "${assertionResult.actual}"`,
                screenshot: screenshotPath,
              };
            }
            break;
          }

          case 'login':
            await executeLogin(page, step, stepTimeoutMs);
            break;

          case 'logout':
            await executeLogout(page, step, stepTimeoutMs);
            break;

          default:
            throw new Error(`Unknown step action: ${(step as UiStep).action}`);
        }
      } catch (stepError) {
        const errorMessage =
          stepError instanceof Error ? stepError.message : String(stepError);
        const screenshotPath = await captureFailureScreenshot(
          page,
          testCase.name,
          screenshotDir,
        );
        return {
          name: testCase.name,
          type: 'ui',
          status: 'error',
          duration: Date.now() - startTime,
          assertions: assertions.length > 0 ? assertions : undefined,
          error: `Step "${step.action}" failed: ${errorMessage}`,
          screenshot: screenshotPath,
        };
      }
    }

    // All steps passed
    return {
      name: testCase.name,
      type: 'ui',
      status: 'pass',
      duration: Date.now() - startTime,
      assertions: assertions.length > 0 ? assertions : undefined,
    };
  } catch (outerError) {
    const errorMessage =
      outerError instanceof Error ? outerError.message : String(outerError);
    const screenshotPath = page
      ? await captureFailureScreenshot(page, testCase.name, screenshotDir)
      : undefined;
    return {
      name: testCase.name,
      type: 'ui',
      status: 'error',
      duration: Date.now() - startTime,
      error: `Test execution error: ${errorMessage}`,
      screenshot: screenshotPath,
    };
  } finally {
    if (ownsContext && context) {
      await context.close().catch(() => {
        // Best-effort cleanup
      });
    }
  }
}

// -----------------------------------------------------------------------------
// Screenshot Capture (private)
// -----------------------------------------------------------------------------

async function captureFailureScreenshot(
  page: Page,
  testName: string,
  screenshotDir: string,
): Promise<string | undefined> {
  try {
    ensureScreenshotDir(screenshotDir);
    const screenshotPath = buildScreenshotPath(testName, screenshotDir);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    return screenshotPath;
  } catch {
    // Screenshot capture failed — non-fatal, return undefined
    return undefined;
  }
}
