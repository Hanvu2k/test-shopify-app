// =============================================================================
// Unit Tests: ThemePreview - highlighter.ts
// =============================================================================
// Tests are environment-isolated: they build lightweight mock iframe/document
// objects to exercise each branch of highlighter logic without a real browser.
// The iframe element itself never renders — only the mock contentDocument
// (which implements the minimal DOM interface the module requires) is used.
// =============================================================================

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { highlightElement, clearHighlight } from '../components/ThemePreview/highlighter';

// ---------------------------------------------------------------------------
// Constants mirrored from highlighter.ts
// ---------------------------------------------------------------------------

const HIGHLIGHT_CLASS = '__wishlist-tester-highlight__';
const STYLE_ID = '__wishlist-tester-highlight-style__';

// ---------------------------------------------------------------------------
// Test-double helpers
// ---------------------------------------------------------------------------

/**
 * Minimal mock of a DOM element for use inside the fake iframe document.
 */
function makeMockElement(id?: string): Element {
  // Use happy-dom's real document so classList / querySelectorAll work.
  const el = document.createElement('div');
  if (id) el.id = id;
  return el;
}

/**
 * Build a fake HTMLIFrameElement whose contentDocument is the provided
 * (same-origin) mock document. Accessing contentDocument will NOT throw, so
 * the module treats this iframe as accessible.
 */
function makeSameOriginIframe(iframeDoc: Document): HTMLIFrameElement {
  const iframe = document.createElement('iframe') as HTMLIFrameElement;
  Object.defineProperty(iframe, 'contentDocument', {
    get: () => iframeDoc,
    configurable: true,
  });
  Object.defineProperty(iframe, 'contentWindow', {
    get: () => ({ document: iframeDoc }),
    configurable: true,
  });
  return iframe;
}

/**
 * Build a fake HTMLIFrameElement that simulates a cross-origin iframe:
 * accessing contentDocument throws a SecurityError.
 */
function makeCrossOriginIframe(): HTMLIFrameElement {
  const iframe = document.createElement('iframe') as HTMLIFrameElement;
  Object.defineProperty(iframe, 'contentDocument', {
    get: () => {
      throw new DOMException('Blocked a frame with origin from accessing a cross-origin frame.', 'SecurityError');
    },
    configurable: true,
  });
  Object.defineProperty(iframe, 'contentWindow', {
    get: () => {
      throw new DOMException('Blocked a frame with origin from accessing a cross-origin frame.', 'SecurityError');
    },
    configurable: true,
  });
  return iframe;
}

/**
 * Build a minimal Document-like object for the iframe content.
 * Uses the real happy-dom parser to get a proper DOM environment.
 */
function makeFakeIframeDocument(): Document {
  const parser = new DOMParser();
  return parser.parseFromString('<html><head></head><body></body></html>', 'text/html');
}

// ---------------------------------------------------------------------------
// Shared setup
// ---------------------------------------------------------------------------

let iframeDoc: Document;
let iframe: HTMLIFrameElement;

beforeEach(() => {
  iframeDoc = makeFakeIframeDocument();
  iframe = makeSameOriginIframe(iframeDoc);
});

// ===========================================================================
// highlightElement
// ===========================================================================

describe('highlightElement', () => {
  describe('style injection', () => {
    it('injects the highlight stylesheet on first call', () => {
      const targetEl = iframeDoc.createElement('button');
      targetEl.className = 'my-btn';
      iframeDoc.body.appendChild(targetEl);

      highlightElement(iframe, '.my-btn');

      const injectedStyle = iframeDoc.getElementById(STYLE_ID);
      expect(injectedStyle).not.toBeNull();
      expect(injectedStyle?.tagName.toLowerCase()).toBe('style');
    });

    it('does not inject duplicate stylesheets on repeated calls', () => {
      const targetEl = iframeDoc.createElement('button');
      targetEl.className = 'my-btn';
      iframeDoc.body.appendChild(targetEl);

      highlightElement(iframe, '.my-btn');
      highlightElement(iframe, '.my-btn');

      const styles = iframeDoc.querySelectorAll(`#${STYLE_ID}`);
      expect(styles.length).toBe(1);
    });

    it('injected stylesheet contains the highlight class CSS', () => {
      const targetEl = iframeDoc.createElement('span');
      targetEl.id = 'target';
      iframeDoc.body.appendChild(targetEl);

      highlightElement(iframe, '#target');

      const style = iframeDoc.getElementById(STYLE_ID) as HTMLStyleElement;
      expect(style.textContent).toContain(HIGHLIGHT_CLASS);
      expect(style.textContent).toContain('outline');
    });
  });

  describe('applying the highlight class', () => {
    it('adds the highlight class to the matched element', () => {
      const el = iframeDoc.createElement('div');
      el.id = 'product-card';
      iframeDoc.body.appendChild(el);

      highlightElement(iframe, '#product-card');

      expect(el.classList.contains(HIGHLIGHT_CLASS)).toBe(true);
    });

    it('only highlights the first matched element (querySelector semantics)', () => {
      const el1 = iframeDoc.createElement('li');
      el1.className = 'item';
      const el2 = iframeDoc.createElement('li');
      el2.className = 'item';
      iframeDoc.body.appendChild(el1);
      iframeDoc.body.appendChild(el2);

      highlightElement(iframe, '.item');

      expect(el1.classList.contains(HIGHLIGHT_CLASS)).toBe(true);
      expect(el2.classList.contains(HIGHLIGHT_CLASS)).toBe(false);
    });

    it('clears the previous highlight before applying a new one', () => {
      const el1 = iframeDoc.createElement('div');
      el1.id = 'first';
      const el2 = iframeDoc.createElement('div');
      el2.id = 'second';
      iframeDoc.body.appendChild(el1);
      iframeDoc.body.appendChild(el2);

      highlightElement(iframe, '#first');
      expect(el1.classList.contains(HIGHLIGHT_CLASS)).toBe(true);

      highlightElement(iframe, '#second');
      expect(el1.classList.contains(HIGHLIGHT_CLASS)).toBe(false);
      expect(el2.classList.contains(HIGHLIGHT_CLASS)).toBe(true);
    });

    it('clears multiple previously highlighted elements when switching', () => {
      const el1 = iframeDoc.createElement('span');
      el1.className = 'grp';
      const el2 = iframeDoc.createElement('span');
      el2.className = 'grp';
      const el3 = iframeDoc.createElement('div');
      el3.id = 'next';
      iframeDoc.body.appendChild(el1);
      iframeDoc.body.appendChild(el2);
      iframeDoc.body.appendChild(el3);

      // Manually add highlight class to both span elements to simulate prior state
      el1.classList.add(HIGHLIGHT_CLASS);
      el2.classList.add(HIGHLIGHT_CLASS);

      highlightElement(iframe, '#next');

      expect(el1.classList.contains(HIGHLIGHT_CLASS)).toBe(false);
      expect(el2.classList.contains(HIGHLIGHT_CLASS)).toBe(false);
      expect(el3.classList.contains(HIGHLIGHT_CLASS)).toBe(true);
    });

    it('calls scrollIntoView on the highlighted element', () => {
      const el = iframeDoc.createElement('section');
      el.id = 'section-a';
      const scrollSpy = vi.fn();
      el.scrollIntoView = scrollSpy;
      iframeDoc.body.appendChild(el);

      highlightElement(iframe, '#section-a');

      expect(scrollSpy).toHaveBeenCalledOnce();
      expect(scrollSpy).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' });
    });
  });

  describe('no-match behaviour', () => {
    it('does not throw when the selector matches no element', () => {
      expect(() => highlightElement(iframe, '#nonexistent')).not.toThrow();
    });

    it('still injects the stylesheet even when the selector matches nothing', () => {
      highlightElement(iframe, '#nonexistent');
      expect(iframeDoc.getElementById(STYLE_ID)).not.toBeNull();
    });

    it('leaves no highlight class anywhere when selector has no match', () => {
      highlightElement(iframe, '#nonexistent');
      const highlighted = iframeDoc.querySelectorAll(`.${HIGHLIGHT_CLASS}`);
      expect(highlighted.length).toBe(0);
    });
  });

  describe('invalid selector handling', () => {
    it('does not throw when the CSS selector is invalid', () => {
      expect(() => highlightElement(iframe, '###invalid!!!')).not.toThrow();
    });

    it('does not throw for an empty selector string', () => {
      expect(() => highlightElement(iframe, '')).not.toThrow();
    });
  });

  describe('cross-origin iframe', () => {
    it('silently no-ops for a cross-origin iframe', () => {
      const crossOriginIframe = makeCrossOriginIframe();
      expect(() => highlightElement(crossOriginIframe, '.anything')).not.toThrow();
    });

    it('does not modify any document for a cross-origin iframe', () => {
      const crossOriginIframe = makeCrossOriginIframe();
      highlightElement(crossOriginIframe, '.anything');
      // Verify own document is untouched as a proxy for "nothing happened"
      expect(document.getElementById(STYLE_ID)).toBeNull();
    });
  });

  describe('iframe with null contentDocument', () => {
    it('silently no-ops when contentDocument is null', () => {
      const nullDocIframe = document.createElement('iframe') as HTMLIFrameElement;
      Object.defineProperty(nullDocIframe, 'contentDocument', {
        get: () => null,
        configurable: true,
      });
      Object.defineProperty(nullDocIframe, 'contentWindow', {
        get: () => null,
        configurable: true,
      });
      expect(() => highlightElement(nullDocIframe, '.btn')).not.toThrow();
    });
  });
});

// ===========================================================================
// clearHighlight
// ===========================================================================

describe('clearHighlight', () => {
  it('removes the highlight class from a highlighted element', () => {
    const el = iframeDoc.createElement('div');
    el.id = 'target';
    el.classList.add(HIGHLIGHT_CLASS);
    iframeDoc.body.appendChild(el);

    clearHighlight(iframe);

    expect(el.classList.contains(HIGHLIGHT_CLASS)).toBe(false);
  });

  it('removes the highlight class from all previously highlighted elements', () => {
    const elements = ['a', 'b', 'c'].map((id) => {
      const el = iframeDoc.createElement('div');
      el.id = id;
      el.classList.add(HIGHLIGHT_CLASS);
      iframeDoc.body.appendChild(el);
      return el;
    });

    clearHighlight(iframe);

    elements.forEach((el) => {
      expect(el.classList.contains(HIGHLIGHT_CLASS)).toBe(false);
    });
  });

  it('removes the injected stylesheet', () => {
    const style = iframeDoc.createElement('style');
    style.id = STYLE_ID;
    iframeDoc.head.appendChild(style);

    clearHighlight(iframe);

    expect(iframeDoc.getElementById(STYLE_ID)).toBeNull();
  });

  it('does not throw when no highlight exists yet', () => {
    expect(() => clearHighlight(iframe)).not.toThrow();
  });

  it('does not throw when there is no injected stylesheet', () => {
    const el = iframeDoc.createElement('div');
    el.classList.add(HIGHLIGHT_CLASS);
    iframeDoc.body.appendChild(el);

    expect(() => clearHighlight(iframe)).not.toThrow();
    expect(el.classList.contains(HIGHLIGHT_CLASS)).toBe(false);
  });

  it('silently no-ops for a cross-origin iframe', () => {
    const crossOriginIframe = makeCrossOriginIframe();
    expect(() => clearHighlight(crossOriginIframe)).not.toThrow();
  });

  it('silently no-ops when contentDocument is null', () => {
    const nullDocIframe = document.createElement('iframe') as HTMLIFrameElement;
    Object.defineProperty(nullDocIframe, 'contentDocument', {
      get: () => null,
      configurable: true,
    });
    Object.defineProperty(nullDocIframe, 'contentWindow', {
      get: () => null,
      configurable: true,
    });
    expect(() => clearHighlight(nullDocIframe)).not.toThrow();
  });
});

// ===========================================================================
// highlightElement → clearHighlight round-trip
// ===========================================================================

describe('highlightElement → clearHighlight round-trip', () => {
  it('highlight then clear leaves no visible trace in the iframe document', () => {
    const el = iframeDoc.createElement('article');
    el.id = 'card';
    iframeDoc.body.appendChild(el);

    highlightElement(iframe, '#card');
    expect(el.classList.contains(HIGHLIGHT_CLASS)).toBe(true);
    expect(iframeDoc.getElementById(STYLE_ID)).not.toBeNull();

    clearHighlight(iframe);
    expect(el.classList.contains(HIGHLIGHT_CLASS)).toBe(false);
    expect(iframeDoc.getElementById(STYLE_ID)).toBeNull();
  });

  it('can highlight again after a full clear', () => {
    const el = iframeDoc.createElement('nav');
    el.id = 'nav';
    iframeDoc.body.appendChild(el);

    highlightElement(iframe, '#nav');
    clearHighlight(iframe);
    highlightElement(iframe, '#nav');

    expect(el.classList.contains(HIGHLIGHT_CLASS)).toBe(true);
    expect(iframeDoc.getElementById(STYLE_ID)).not.toBeNull();
  });

  it('multiple highlight calls followed by a single clear leaves no highlight', () => {
    const elA = iframeDoc.createElement('div');
    elA.id = 'a';
    const elB = iframeDoc.createElement('div');
    elB.id = 'b';
    iframeDoc.body.appendChild(elA);
    iframeDoc.body.appendChild(elB);

    highlightElement(iframe, '#a');
    highlightElement(iframe, '#b');
    clearHighlight(iframe);

    expect(elA.classList.contains(HIGHLIGHT_CLASS)).toBe(false);
    expect(elB.classList.contains(HIGHLIGHT_CLASS)).toBe(false);
    expect(iframeDoc.getElementById(STYLE_ID)).toBeNull();
  });
});
