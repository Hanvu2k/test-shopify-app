// ---------------------------------------------------------------------------
// highlighter.ts — Inject/remove CSS highlights into an iframe's DOM
// ---------------------------------------------------------------------------
// Only works when the iframe is same-origin. Cross-origin iframes are
// silently skipped (no error thrown) because Shopify previews are typically
// cross-origin and we cannot access their contentDocument.
// ---------------------------------------------------------------------------

const HIGHLIGHT_CLASS = '__wishlist-tester-highlight__';
const STYLE_ID = '__wishlist-tester-highlight-style__';

const HIGHLIGHT_CSS = `
.${HIGHLIGHT_CLASS} {
  outline: 2px solid #3b82f6 !important;
  outline-offset: 2px !important;
  background-color: rgba(59, 130, 246, 0.08) !important;
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.15) !important;
  transition: outline 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease !important;
}
`;

/**
 * Try to access the iframe's contentDocument.
 * Returns null for cross-origin iframes (security restriction).
 */
function getIframeDocument(
  iframe: HTMLIFrameElement,
): Document | null {
  try {
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    // Accessing any property on a cross-origin document throws.
    // Reading `doc?.head` forces the access check.
    if (doc?.head) {
      return doc;
    }
    return null;
  } catch {
    // Cross-origin — silently return null
    return null;
  }
}

/**
 * Ensure the highlight stylesheet is injected into the iframe document.
 */
function ensureStyleInjected(doc: Document): void {
  if (doc.getElementById(STYLE_ID)) return;

  const style = doc.createElement('style');
  style.id = STYLE_ID;
  style.textContent = HIGHLIGHT_CSS;
  doc.head.appendChild(style);
}

/**
 * Remove the highlight class from every element that has it.
 */
function removeHighlightClass(doc: Document): void {
  const highlighted = doc.querySelectorAll(`.${HIGHLIGHT_CLASS}`);
  highlighted.forEach((el) => el.classList.remove(HIGHLIGHT_CLASS));
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Highlight element(s) matching `selector` inside the iframe.
 *
 * - Injects a small stylesheet on first use.
 * - Clears any previous highlight before applying the new one.
 * - Silently no-ops for cross-origin iframes.
 */
export function highlightElement(
  iframe: HTMLIFrameElement,
  selector: string,
): void {
  const doc = getIframeDocument(iframe);
  if (!doc) return;

  ensureStyleInjected(doc);
  removeHighlightClass(doc);

  try {
    const target = doc.querySelector(selector);
    if (target) {
      target.classList.add(HIGHLIGHT_CLASS);
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  } catch {
    // Invalid selector — silently skip
  }
}

/**
 * Remove all injected highlight styles and classes from the iframe.
 */
export function clearHighlight(iframe: HTMLIFrameElement): void {
  const doc = getIframeDocument(iframe);
  if (!doc) return;

  removeHighlightClass(doc);

  const style = doc.getElementById(STYLE_ID);
  if (style) {
    style.remove();
  }
}
