// SPDX-License-Identifier: MIT
/**
 * Tests for lazy theme-CSS loading helpers (decision, inject-once,
 * hover prefetch).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CSS_LINK_ID } from '../src/constants.js';
import {
  isThemeCSSLoaded,
  loadThemeCSSOnDemand,
  prefetchThemeCSS,
  PREFETCH_TRIGGER_ATTRIBUTE,
  shouldLoadThemeCSS,
  wireHoverPrefetch,
} from '../src/lazy-css.js';

const THEME_A = 'catppuccin-frappe';
const THEME_B = 'catppuccin-latte';

/** Removes theme links and prefetch links left by a previous test. */
function resetDocumentLinks(): void {
  document
    .querySelectorAll(
      'link[id^="theme-"][id$="-css"], link[id^="theme-"][id$="-prefetch"], ' + `#${CSS_LINK_ID}`,
    )
    .forEach((link) => link.remove());
  document.documentElement.removeAttribute('data-baseurl');
}

/** Appends a stylesheet link owned by the selector for the given theme. */
function appendThemeLink(themeId: string): HTMLLinkElement {
  const link = document.createElement('link');
  link.id = `theme-${themeId}-css`;
  link.rel = 'stylesheet';
  link.href = `/assets/css/themes/turbo/${themeId}.css`;
  document.head.appendChild(link);
  return link;
}

/** Appends the blocking script's FOUC-prevention link. */
function appendBlockingLink(href: string, themeId?: string): HTMLLinkElement {
  const link = document.createElement('link');
  link.id = CSS_LINK_ID;
  link.rel = 'stylesheet';
  link.href = href;
  if (themeId) {
    link.setAttribute('data-theme-id', themeId);
  }
  document.head.appendChild(link);
  return link;
}

/** Returns all prefetch links currently injected for a theme. */
function prefetchLinksFor(themeId: string): HTMLLinkElement[] {
  return Array.from(
    document.querySelectorAll<HTMLLinkElement>(`link[data-theme-prefetch="${themeId}"]`),
  );
}

describe('lazy-css', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    resetDocumentLinks();
    Object.defineProperty(window, 'location', {
      value: { origin: 'https://example.com', pathname: '/' },
      writable: true,
      configurable: true,
    });
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    resetDocumentLinks();
    warnSpy.mockRestore();
  });

  describe('isThemeCSSLoaded', () => {
    it('returns false when no link for the theme exists', () => {
      expect(isThemeCSSLoaded(document, THEME_A)).toBe(false);
    });

    it('returns true when a selector-owned theme link exists', () => {
      appendThemeLink(THEME_A);
      expect(isThemeCSSLoaded(document, THEME_A)).toBe(true);
    });

    it('returns true when the blocking link is tagged with the theme ID', () => {
      appendBlockingLink('/assets/css/themes/turbo/whatever.css', THEME_A);
      expect(isThemeCSSLoaded(document, THEME_A)).toBe(true);
    });

    it('returns true when the blocking link href points at the theme', () => {
      appendBlockingLink(`/assets/css/themes/turbo/${THEME_A}.css`);
      expect(isThemeCSSLoaded(document, THEME_A)).toBe(true);
    });

    it('does not match a theme whose ID is a suffix of the loaded theme', () => {
      appendBlockingLink('/assets/css/themes/turbo/catppuccin-mocha.css');
      expect(isThemeCSSLoaded(document, 'mocha')).toBe(false);
    });

    it('returns false when the blocking link points at another theme', () => {
      appendBlockingLink(`/assets/css/themes/turbo/${THEME_B}.css`);
      expect(isThemeCSSLoaded(document, THEME_A)).toBe(false);
    });
  });

  describe('shouldLoadThemeCSS', () => {
    it('returns true for a known theme with no linked CSS', () => {
      expect(shouldLoadThemeCSS(document, THEME_A)).toBe(true);
    });

    it('returns false when the theme CSS is already linked', () => {
      appendThemeLink(THEME_A);
      expect(shouldLoadThemeCSS(document, THEME_A)).toBe(false);
    });

    it('returns false when the eagerly loaded default covers the theme', () => {
      appendBlockingLink(`/assets/css/themes/turbo/${THEME_A}.css`);
      expect(shouldLoadThemeCSS(document, THEME_A)).toBe(false);
    });

    it.each([
      { label: 'unknown theme', themeId: 'not-a-theme' },
      { label: 'malformed theme ID', themeId: '../../etc/passwd' },
      { label: 'empty theme ID', themeId: '' },
    ])('returns false for $label', ({ themeId }) => {
      expect(shouldLoadThemeCSS(document, themeId)).toBe(false);
    });
  });

  describe('loadThemeCSSOnDemand', () => {
    it('injects the stylesheet link for a theme that is not loaded', async () => {
      const loadPromise = loadThemeCSSOnDemand(document, THEME_A);
      const link = document.getElementById(`theme-${THEME_A}-css`) as HTMLLinkElement | null;
      expect(link).not.toBeNull();
      expect(link?.getAttribute('href')).toBe(`/assets/css/themes/turbo/${THEME_A}.css`);
      link?.onload?.(new Event('load'));
      await expect(loadPromise).resolves.toBe(true);
    });

    it('does not inject a duplicate link on repeat switches', async () => {
      const firstLoad = loadThemeCSSOnDemand(document, THEME_A);
      const link = document.getElementById(`theme-${THEME_A}-css`) as HTMLLinkElement | null;
      link?.onload?.(new Event('load'));
      await firstLoad;

      await expect(loadThemeCSSOnDemand(document, THEME_A)).resolves.toBe(true);
      const links = document.querySelectorAll(`link[id="theme-${THEME_A}-css"]`);
      expect(links).toHaveLength(1);
    });

    it('resolves true without touching the DOM when CSS is already linked', async () => {
      appendThemeLink(THEME_A);
      const headChildrenBefore = document.head.children.length;
      await expect(loadThemeCSSOnDemand(document, THEME_A)).resolves.toBe(true);
      expect(document.head.children.length).toBe(headChildrenBefore);
    });

    it('rejects unknown theme IDs without injecting anything', async () => {
      await expect(loadThemeCSSOnDemand(document, 'not-a-theme')).resolves.toBe(false);
      expect(document.querySelectorAll('link[id^="theme-"]')).toHaveLength(0);
      expect(warnSpy).toHaveBeenCalled();
    });

    it('respects the data-baseurl attribute when resolving the CSS path', async () => {
      document.documentElement.setAttribute('data-baseurl', '/my-site');
      const loadPromise = loadThemeCSSOnDemand(document, THEME_A);
      const link = document.getElementById(`theme-${THEME_A}-css`) as HTMLLinkElement | null;
      expect(link?.getAttribute('href')).toBe(`/my-site/assets/css/themes/turbo/${THEME_A}.css`);
      link?.onload?.(new Event('load'));
      await loadPromise;
    });

    it('resolves false when the stylesheet fails to load', async () => {
      const loadPromise = loadThemeCSSOnDemand(document, THEME_A);
      const link = document.getElementById(`theme-${THEME_A}-css`) as HTMLLinkElement | null;
      expect(link).not.toBeNull();
      link?.onerror?.(new Event('error'));
      await expect(loadPromise).resolves.toBe(false);
      expect(document.getElementById(`theme-${THEME_A}-css`)).toBeNull();
    });
  });

  describe('prefetchThemeCSS', () => {
    it('injects a prefetch link for a known, unloaded theme', () => {
      expect(prefetchThemeCSS(document, THEME_A)).toBe(true);
      const links = prefetchLinksFor(THEME_A);
      expect(links).toHaveLength(1);
      expect(links[0]?.rel).toBe('prefetch');
      expect(links[0]?.getAttribute('as')).toBe('style');
      expect(links[0]?.getAttribute('href')).toBe(`/assets/css/themes/turbo/${THEME_A}.css`);
    });

    it('injects at most one prefetch link per theme', () => {
      expect(prefetchThemeCSS(document, THEME_A)).toBe(true);
      expect(prefetchThemeCSS(document, THEME_A)).toBe(false);
      expect(prefetchThemeCSS(document, THEME_A)).toBe(false);
      expect(prefetchLinksFor(THEME_A)).toHaveLength(1);
    });

    it('skips themes whose stylesheet is already linked', () => {
      appendThemeLink(THEME_A);
      expect(prefetchThemeCSS(document, THEME_A)).toBe(false);
      expect(prefetchLinksFor(THEME_A)).toHaveLength(0);
    });

    it('skips the eagerly loaded default theme', () => {
      appendBlockingLink('/assets/css/themes/turbo/catppuccin-mocha.css');
      expect(prefetchThemeCSS(document, 'catppuccin-mocha')).toBe(false);
      expect(prefetchLinksFor('catppuccin-mocha')).toHaveLength(0);
    });

    it('rejects unknown theme IDs', () => {
      expect(prefetchThemeCSS(document, 'not-a-theme')).toBe(false);
      expect(document.querySelectorAll('link[data-theme-prefetch]')).toHaveLength(0);
    });

    it('prefetches distinct themes independently', () => {
      expect(prefetchThemeCSS(document, THEME_A)).toBe(true);
      expect(prefetchThemeCSS(document, THEME_B)).toBe(true);
      expect(prefetchLinksFor(THEME_A)).toHaveLength(1);
      expect(prefetchLinksFor(THEME_B)).toHaveLength(1);
    });

    it('respects the data-baseurl attribute when resolving the CSS path', () => {
      document.documentElement.setAttribute('data-baseurl', '/my-site');
      expect(prefetchThemeCSS(document, THEME_A)).toBe(true);
      expect(prefetchLinksFor(THEME_A)[0]?.getAttribute('href')).toBe(
        `/my-site/assets/css/themes/turbo/${THEME_A}.css`,
      );
    });
  });

  describe('wireHoverPrefetch', () => {
    let card: HTMLButtonElement;
    let cleanup: (() => void) | null = null;

    beforeEach(() => {
      card = document.createElement('button');
      card.setAttribute(PREFETCH_TRIGGER_ATTRIBUTE, THEME_A);
      document.body.appendChild(card);
    });

    afterEach(() => {
      cleanup?.();
      cleanup = null;
      card.remove();
    });

    it('prefetches on mouseover of a marked element', () => {
      cleanup = wireHoverPrefetch(document);
      card.dispatchEvent(new Event('mouseover', { bubbles: true }));
      expect(prefetchLinksFor(THEME_A)).toHaveLength(1);
    });

    it('prefetches on focusin for keyboard navigation', () => {
      cleanup = wireHoverPrefetch(document);
      card.dispatchEvent(new Event('focusin', { bubbles: true }));
      expect(prefetchLinksFor(THEME_A)).toHaveLength(1);
    });

    it('resolves the trigger from a descendant of the marked element', () => {
      const icon = document.createElement('span');
      card.appendChild(icon);
      cleanup = wireHoverPrefetch(document);
      icon.dispatchEvent(new Event('mouseover', { bubbles: true }));
      expect(prefetchLinksFor(THEME_A)).toHaveLength(1);
    });

    it('does not inject duplicates on repeated hovers', () => {
      cleanup = wireHoverPrefetch(document);
      card.dispatchEvent(new Event('mouseover', { bubbles: true }));
      card.dispatchEvent(new Event('mouseover', { bubbles: true }));
      card.dispatchEvent(new Event('focusin', { bubbles: true }));
      expect(prefetchLinksFor(THEME_A)).toHaveLength(1);
    });

    it('ignores elements without the trigger attribute', () => {
      const plain = document.createElement('div');
      document.body.appendChild(plain);
      cleanup = wireHoverPrefetch(document);
      plain.dispatchEvent(new Event('mouseover', { bubbles: true }));
      expect(document.querySelectorAll('link[data-theme-prefetch]')).toHaveLength(0);
      plain.remove();
    });

    it('ignores marked elements with an empty theme ID', () => {
      card.setAttribute(PREFETCH_TRIGGER_ATTRIBUTE, '');
      cleanup = wireHoverPrefetch(document);
      card.dispatchEvent(new Event('mouseover', { bubbles: true }));
      expect(document.querySelectorAll('link[data-theme-prefetch]')).toHaveLength(0);
    });

    it('stops prefetching after cleanup', () => {
      cleanup = wireHoverPrefetch(document);
      cleanup();
      cleanup = null;
      card.dispatchEvent(new Event('mouseover', { bubbles: true }));
      expect(prefetchLinksFor(THEME_A)).toHaveLength(0);
    });
  });
});
