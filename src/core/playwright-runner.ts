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

async function executeClick(page: Page, step: UiStep): Promise<void> {
  if (!step.selector) {
    throw new Error('Click step requires a selector');
  }
  await page.waitForSelector(step.selector, { state: 'visible', timeout: DEFAULT_TIMEOUT_MS });
  await page.click(step.selector);
}

async function executeFill(page: Page, step: UiStep): Promise<void> {
  if (!step.selector) {
    throw new Error('Fill step requires a selector');
  }
  if (step.value === undefined) {
    throw new Error('Fill step requires a value');
  }
  await page.waitForSelector(step.selector, { state: 'visible', timeout: DEFAULT_TIMEOUT_MS });
  await page.fill(step.selector, step.value);
}

async function executeWaitFor(page: Page, step: UiStep): Promise<void> {
  if (!step.selector) {
    throw new Error('WaitFor step requires a selector');
  }
  await page.waitForSelector(step.selector, { state: 'visible', timeout: DEFAULT_TIMEOUT_MS });
}

async function executeAssertText(
  page: Page,
  step: UiStep,
): Promise<AssertionResult> {
  if (!step.selector) {
    throw new Error('AssertText step requires a selector');
  }
  if (step.expected === undefined) {
    throw new Error('AssertText step requires an expected value');
  }

  await page.waitForSelector(step.selector, { state: 'visible', timeout: DEFAULT_TIMEOUT_MS });
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

async function executeLogin(page: Page, step: UiStep): Promise<void> {
  const email = step.email ?? '';
  const password = step.password ?? '';

  const emailSelector = 'input[type="email"]';
  const passwordSelector = 'input[type="password"]';
  const submitSelector = 'button[type="submit"]';

  await page.waitForSelector(emailSelector, { state: 'visible', timeout: DEFAULT_TIMEOUT_MS });
  await page.fill(emailSelector, email);

  await page.waitForSelector(passwordSelector, { state: 'visible', timeout: DEFAULT_TIMEOUT_MS });
  await page.fill(passwordSelector, password);

  await page.waitForSelector(submitSelector, { state: 'visible', timeout: DEFAULT_TIMEOUT_MS });
  await page.click(submitSelector);
}

async function executeLogout(page: Page, step: UiStep): Promise<void> {
  if (step.selector) {
    await page.waitForSelector(step.selector, { state: 'visible', timeout: DEFAULT_TIMEOUT_MS });
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
  const assertions: AssertionResult[] = [];

  // Ensure browser is available
  await launchBrowser();

  let context: BrowserContext | null = null;
  let page: Page | null = null;

  try {
    context = await browserInstance!.newContext();
    context.setDefaultTimeout(DEFAULT_TIMEOUT_MS);
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
            await executeClick(page, step);
            break;

          case 'fill':
            await executeFill(page, step);
            break;

          case 'waitFor':
            await executeWaitFor(page, step);
            break;

          case 'assertText': {
            const assertionResult = await executeAssertText(page, step);
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
            await executeLogin(page, step);
            break;

          case 'logout':
            await executeLogout(page, step);
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
    if (context) {
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
