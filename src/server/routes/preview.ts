// =============================================================================
// /api/preview — Playwright Screenshot-Based Preview Service
// =============================================================================
// Replaces the iframe proxy approach that failed due to CSP/cookie/JS issues.
// Uses a headless Playwright browser to capture periodic screenshots of the
// Shopify theme preview page, served to the frontend via HTTP polling.
//
// POST /api/preview/start        — Start a preview session
// GET  /api/preview/screenshot    — Get latest screenshot (JPEG binary)
// POST /api/preview/navigate      — Navigate to a different page
// POST /api/preview/highlight     — Highlight an element by CSS selector
// POST /api/preview/stop          — Stop the preview session
// =============================================================================

import { Router } from 'express';
import type { Request, Response } from 'express';
import type { Page } from 'playwright';
import {
  getPreviewPage,
  takePreviewScreenshot,
  closePreview,
} from '../browser-manager.js';

// -----------------------------------------------------------------------------
// Configuration
// -----------------------------------------------------------------------------

const SCREENSHOT_INTERVAL_MS = 1000;
const SCREENSHOT_QUALITY = 70;
const NAVIGATION_TIMEOUT_MS = 30_000;

// Highlight injection CSS — applied via page.evaluate
const HIGHLIGHT_STYLE_ID = '__wishlist-preview-highlight__';
const HIGHLIGHT_CSS = `
  outline: 3px solid #3b82f6 !important;
  outline-offset: 2px !important;
  background-color: rgba(59, 130, 246, 0.08) !important;
  box-shadow: 0 0 0 6px rgba(59, 130, 246, 0.15) !important;
`;

// -----------------------------------------------------------------------------
// State — single preview session at a time
// -----------------------------------------------------------------------------

let page: Page | null = null;
let screenshotInterval: ReturnType<typeof setInterval> | null = null;
let latestScreenshot: Buffer | null = null;
let currentUrl = '';
let sessionActive = false;

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

async function captureScreenshot(): Promise<void> {
  const screenshot = await takePreviewScreenshot(SCREENSHOT_QUALITY);
  if (screenshot) {
    latestScreenshot = screenshot;
  }
}

function startScreenshotLoop(): void {
  stopScreenshotLoop();
  screenshotInterval = setInterval(captureScreenshot, SCREENSHOT_INTERVAL_MS);
}

function stopScreenshotLoop(): void {
  if (screenshotInterval) {
    clearInterval(screenshotInterval);
    screenshotInterval = null;
  }
}

/**
 * Detect and handle Shopify password-protected storefronts.
 * Looks for a password input field, fills it, and submits.
 */
async function handlePasswordPage(password: string): Promise<boolean> {
  if (!page) return false;

  try {
    // Check if there's a password input on the page
    const passwordInput = await page.$('input[type="password"], input[name="password"]');
    if (!passwordInput) return false;

    // Fill and submit
    await passwordInput.fill(password);

    // Try submitting the form
    const submitButton = await page.$(
      'button[type="submit"], input[type="submit"], form[action*="password"] button',
    );
    if (submitButton) {
      await submitButton.click();
    } else {
      // Fallback: press Enter on the input
      await passwordInput.press('Enter');
    }

    // Wait for navigation after password submission
    await page.waitForLoadState('networkidle', { timeout: NAVIGATION_TIMEOUT_MS }).catch(() => {
      // Timeout is acceptable — page may not fully settle
    });

    return true;
  } catch {
    return false;
  }
}

/**
 * Clean up all browser resources and reset state.
 */
async function cleanup(): Promise<void> {
  stopScreenshotLoop();
  sessionActive = false;
  latestScreenshot = null;
  currentUrl = '';
  page = null;

  await closePreview();
}

// -----------------------------------------------------------------------------
// Router
// -----------------------------------------------------------------------------

const router = Router();

// POST /api/preview/start — Start preview session
router.post('/start', async (req: Request, res: Response) => {
  const { url, password } = req.body as { url?: string; password?: string };

  if (!url || typeof url !== 'string') {
    res.status(400).json({ error: 'Missing required "url" field' });
    return;
  }

  try {
    // Clean up any existing session
    await cleanup();

    // Get shared preview page from browser-manager
    page = await getPreviewPage();

    // Navigate to the target URL
    await page.goto(url, {
      waitUntil: 'networkidle',
      timeout: NAVIGATION_TIMEOUT_MS,
    });

    currentUrl = url;

    // Handle password page if password provided
    if (password) {
      await handlePasswordPage(password);
    }

    // Take initial screenshot before starting the loop
    await captureScreenshot();

    // Start periodic screenshots
    sessionActive = true;
    startScreenshotLoop();

    res.json({ status: 'started', url: currentUrl });
  } catch (err) {
    await cleanup();
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: 'Failed to start preview session', detail: message });
  }
});

// GET /api/preview/screenshot — Get latest screenshot
router.get('/screenshot', (_req: Request, res: Response) => {
  if (!sessionActive || !latestScreenshot) {
    res.status(404).json({ error: 'No active preview session' });
    return;
  }

  res.setHeader('Content-Type', 'image/jpeg');
  res.setHeader('Cache-Control', 'no-store');
  res.send(latestScreenshot);
});

// POST /api/preview/navigate — Navigate to a different page
router.post('/navigate', async (req: Request, res: Response) => {
  const { url } = req.body as { url?: string };

  if (!url || typeof url !== 'string') {
    res.status(400).json({ error: 'Missing required "url" field' });
    return;
  }

  if (!sessionActive || !page || page.isClosed()) {
    res.status(404).json({ error: 'No active preview session' });
    return;
  }

  try {
    await page.goto(url, {
      waitUntil: 'networkidle',
      timeout: NAVIGATION_TIMEOUT_MS,
    });
    currentUrl = url;

    // Take immediate screenshot after navigation
    await captureScreenshot();

    res.json({ status: 'navigated', url: currentUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: 'Navigation failed', detail: message });
  }
});

// POST /api/preview/highlight — Highlight an element on the page
router.post('/highlight', async (req: Request, res: Response) => {
  const { selector } = req.body as { selector?: string | null };

  if (!sessionActive || !page || page.isClosed()) {
    res.status(404).json({ error: 'No active preview session' });
    return;
  }

  try {
    // Clear any existing highlights
    await page.evaluate((styleId: string) => {
      // Remove injected style tag
      const existingStyle = document.getElementById(styleId);
      if (existingStyle) existingStyle.remove();

      // Remove highlight attribute from all elements
      document.querySelectorAll('[data-wt-highlighted]').forEach((el) => {
        (el as HTMLElement).removeAttribute('style');
        el.removeAttribute('data-wt-highlighted');
      });
    }, HIGHLIGHT_STYLE_ID);

    // Apply new highlight if selector is provided
    if (selector) {
      await page.evaluate(
        ({ sel, css, styleId }: { sel: string; css: string; styleId: string }) => {
          const target = document.querySelector(sel);
          if (target) {
            // Store original style so we could restore later
            const el = target as HTMLElement;
            el.setAttribute('data-wt-highlighted', 'true');
            el.style.cssText += css;
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }

          // Also inject a style tag for the outline animation
          const style = document.createElement('style');
          style.id = styleId;
          style.textContent = `[data-wt-highlighted] { ${css} }`;
          document.head.appendChild(style);
        },
        { sel: selector, css: HIGHLIGHT_CSS, styleId: HIGHLIGHT_STYLE_ID },
      );
    }

    // Take immediate screenshot to reflect highlight change
    await captureScreenshot();

    res.json({ status: 'highlighted', selector: selector ?? null });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: 'Highlight failed', detail: message });
  }
});

// POST /api/preview/stop — Stop preview session
router.post('/stop', async (_req: Request, res: Response) => {
  if (!sessionActive) {
    res.json({ status: 'already_stopped' });
    return;
  }

  await cleanup();
  res.json({ status: 'stopped' });
});

export default router;
