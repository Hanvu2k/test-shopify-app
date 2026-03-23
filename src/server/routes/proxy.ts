// =============================================================================
// /api/proxy — Reverse Proxy for Shopify Theme Preview
// =============================================================================
// Fetches Shopify pages server-side, strips CSP and X-Frame-Options headers
// that block iframe embedding, injects a <base> tag for relative URL resolution,
// and serves the content through localhost so the iframe works.
//
// GET  /api/proxy?url=https://store.myshopify.com/path
// POST /api/proxy?url=https://store.myshopify.com/password  (password form)
// =============================================================================

import express, { Router } from 'express';
import type { Request, Response } from 'express';

// -----------------------------------------------------------------------------
// Configuration
// -----------------------------------------------------------------------------

const PROXY_TIMEOUT_MS = 15_000;
const MAX_RESPONSE_BYTES = 10 * 1024 * 1024; // 10 MB

/** Domains allowed for proxying (SSRF prevention). */
const ALLOWED_DOMAIN_PATTERNS = [
  /\.myshopify\.com$/,
  /\.shopify\.com$/,
];

/** Response headers to strip — these block iframe embedding. */
const STRIPPED_HEADERS = new Set([
  'content-security-policy',
  'content-security-policy-report-only',
  'x-frame-options',
]);

/** Headers we never forward back to the client. */
const HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'keep-alive',
  'transfer-encoding',
  'te',
  'trailer',
  'upgrade',
]);

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

function isAllowedUrl(rawUrl: string): URL | null {
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return null;
    }
    const allowed = ALLOWED_DOMAIN_PATTERNS.some((pattern) =>
      pattern.test(parsed.hostname),
    );
    return allowed ? parsed : null;
  } catch {
    return null;
  }
}

function isHtmlResponse(contentType: string | null): boolean {
  if (!contentType) return false;
  return contentType.includes('text/html');
}

/**
 * Extract the origin (scheme + host) from a URL for <base> tag injection.
 */
function getOrigin(url: URL): string {
  return url.origin;
}

/**
 * Inject a <base href="..."> tag into the <head> of the HTML so that
 * relative URLs (CSS, JS, images) resolve to the Shopify origin.
 *
 * Also strips any existing <base> tags to avoid conflicts.
 */
function injectBaseTag(html: string, origin: string): string {
  // Remove existing <base> tags
  let result = html.replace(/<base\s+[^>]*>/gi, '');

  // Inject our <base> tag right after <head> (or <head ...>)
  const headMatch = result.match(/<head(\s[^>]*)?>/)
  if (headMatch) {
    const insertPos = headMatch.index! + headMatch[0].length;
    result =
      result.slice(0, insertPos) +
      `\n<base href="${origin}/">` +
      result.slice(insertPos);
  }

  return result;
}

// -----------------------------------------------------------------------------
// Router
// -----------------------------------------------------------------------------

const router = Router();

// Support URL-encoded form bodies for password POST
router.use(express.urlencoded({ extended: false }));

// GET and POST share the same handler
router.all('/', async (req: Request, res: Response) => {
  const rawUrl = req.query.url as string | undefined;

  // -------------------------------------------------------------------------
  // Validate URL
  // -------------------------------------------------------------------------
  if (!rawUrl) {
    res.status(400).json({ error: 'Missing required "url" query parameter' });
    return;
  }

  const targetUrl = isAllowedUrl(rawUrl);
  if (!targetUrl) {
    res.status(403).json({
      error:
        'URL not allowed. Only *.myshopify.com and *.shopify.com domains are permitted.',
    });
    return;
  }

  // -------------------------------------------------------------------------
  // Build upstream request options
  // -------------------------------------------------------------------------
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PROXY_TIMEOUT_MS);

  const fetchOptions: RequestInit = {
    method: req.method === 'POST' ? 'POST' : 'GET',
    signal: controller.signal,
    redirect: 'follow',
    headers: {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
    },
  };

  // Forward cookies from the client (needed for Shopify password auth)
  if (req.headers.cookie) {
    (fetchOptions.headers as Record<string, string>)['Cookie'] =
      req.headers.cookie;
  }

  // Forward POST body (password form submission)
  if (req.method === 'POST' && req.body) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(req.body)) {
      params.append(key, String(value));
    }
    (fetchOptions.headers as Record<string, string>)['Content-Type'] =
      'application/x-www-form-urlencoded';
    fetchOptions.body = params.toString();
  }

  // -------------------------------------------------------------------------
  // Fetch upstream
  // -------------------------------------------------------------------------
  let upstream: globalThis.Response;
  try {
    upstream = await fetch(targetUrl.href, fetchOptions);
  } catch (err: unknown) {
    clearTimeout(timeout);

    if (err instanceof Error && err.name === 'AbortError') {
      res.status(504).json({ error: 'Upstream request timed out (15s)' });
      return;
    }
    res.status(502).json({
      error: 'Failed to fetch upstream URL',
      detail: err instanceof Error ? err.message : String(err),
    });
    return;
  } finally {
    clearTimeout(timeout);
  }

  // -------------------------------------------------------------------------
  // Forward response headers (stripping security headers)
  // -------------------------------------------------------------------------
  const contentType = upstream.headers.get('content-type');

  // Forward Set-Cookie headers (needed for Shopify password auth)
  const setCookies = upstream.headers.getSetCookie?.() ?? [];
  for (const cookie of setCookies) {
    res.append('Set-Cookie', cookie);
  }

  // Forward safe response headers
  upstream.headers.forEach((value, key) => {
    const lowerKey = key.toLowerCase();
    if (STRIPPED_HEADERS.has(lowerKey)) return;
    if (HOP_BY_HOP_HEADERS.has(lowerKey)) return;
    if (lowerKey === 'set-cookie') return; // Already handled above
    res.setHeader(key, value);
  });

  res.status(upstream.status);

  // -------------------------------------------------------------------------
  // Process body
  // -------------------------------------------------------------------------
  if (!upstream.body) {
    res.end();
    return;
  }

  if (isHtmlResponse(contentType)) {
    // For HTML: read full body, inject <base> tag, send
    const contentLength = upstream.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > MAX_RESPONSE_BYTES) {
      res.status(413).json({ error: 'Response too large (>10MB)' });
      return;
    }

    let html: string;
    try {
      html = await upstream.text();
    } catch {
      res.status(502).json({ error: 'Failed to read upstream response body' });
      return;
    }

    if (html.length > MAX_RESPONSE_BYTES) {
      res.status(413).json({ error: 'Response too large (>10MB)' });
      return;
    }

    // Determine origin from the final URL (after redirects)
    const finalOrigin = getOrigin(targetUrl);
    html = injectBaseTag(html, finalOrigin);

    // Remove content-length since we modified the body
    res.removeHeader('content-length');
    res.setHeader('content-type', contentType || 'text/html');
    res.send(html);
  } else {
    // For non-HTML (CSS, JS, images, fonts): stream through directly
    try {
      const reader = upstream.body.getReader();
      let totalBytes = 0;

      const pump = async (): Promise<void> => {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            res.end();
            return;
          }

          totalBytes += value.byteLength;
          if (totalBytes > MAX_RESPONSE_BYTES) {
            reader.cancel();
            res.destroy();
            return;
          }

          if (!res.write(value)) {
            // Backpressure: wait for drain
            await new Promise<void>((resolve) => res.once('drain', resolve));
          }
        }
      };

      await pump();
    } catch {
      // Client disconnected or stream error — nothing to do
      if (!res.writableEnded) {
        res.end();
      }
    }
  }
});

export default router;
