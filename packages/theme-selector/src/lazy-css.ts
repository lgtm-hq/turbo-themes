// SPDX-License-Identifier: MIT
/**
 * Lazy theme-CSS loading helpers for showcase-style pages.
 *
 * Instead of eagerly linking every theme's stylesheet, a page loads only
 * the default/active theme CSS up front and fetches the rest on demand.
 * These helpers provide the load decision, an inject-once on-demand
 * loader built on the package's `loadThemeCSS` pipeline, and a
 * hover-triggered prefetch that hides switch latency for elements
 * marked with the `data-theme-preview` attribute (e.g. marquee cards).
 */

import { CSS_LINK_ID } from './constants.js';
import { ThemeErrors, logThemeError } from './errors.js';
import type { Unsubscribe } from './integration.js';
import { getBaseUrl, loadThemeCSS, resolveAssetPath } from './theme-loader.js';
import { getValidThemeIds, isValidThemeId, resolveTheme } from './theme-resolver.js';

/** Attribute whose value names the theme to prefetch on hover/focus. */
export const PREFETCH_TRIGGER_ATTRIBUTE = 'data-theme-preview';

/**
 * Builds the element ID of a theme's stylesheet link.
 *
 * @param themeId - Theme whose stylesheet link ID to build
 * @returns The stylesheet link element ID
 */
function themeCSSLinkId(themeId: string): string {
  return `theme-${themeId}-css`;
}

/**
 * Builds the element ID of a theme's prefetch link.
 *
 * @param themeId - Theme whose prefetch link ID to build
 * @returns The prefetch link element ID
 */
function themePrefetchLinkId(themeId: string): string {
  return `theme-${themeId}-prefetch`;
}

/**
 * Checks whether a theme ID is well-formed and registered.
 *
 * @param themeId - Theme ID to check
 * @returns True when the ID names a known theme
 */
function isKnownThemeId(themeId: string): boolean {
  return isValidThemeId(themeId) && getValidThemeIds().has(themeId);
}

/**
 * Checks whether a theme's stylesheet is already present in the document.
 *
 * Recognises both links owned by the selector (`theme-<id>-css`) and the
 * blocking script's FOUC-prevention link when it points at the theme.
 *
 * @param documentObj - Document to inspect
 * @param themeId - Theme whose stylesheet to look for
 * @returns True when the theme's CSS is already linked
 */
export function isThemeCSSLoaded(documentObj: Document, themeId: string): boolean {
  if (documentObj.getElementById(themeCSSLinkId(themeId))) {
    return true;
  }
  const blockingLink = documentObj.getElementById(CSS_LINK_ID) as HTMLLinkElement | null;
  if (!blockingLink) {
    return false;
  }
  if (blockingLink.getAttribute('data-theme-id') === themeId) {
    return true;
  }
  const href = blockingLink.getAttribute('href') ?? '';
  return href.endsWith(`/${themeId}.css`);
}

/**
 * Decides whether a theme's CSS needs an on-demand load.
 *
 * @param documentObj - Document to inspect
 * @param themeId - Theme the page is about to switch to
 * @returns True when the theme is known and its CSS is not yet linked
 */
export function shouldLoadThemeCSS(documentObj: Document, themeId: string): boolean {
  return isKnownThemeId(themeId) && !isThemeCSSLoaded(documentObj, themeId);
}

/**
 * Loads a theme's CSS on demand through the selector's loader.
 *
 * Injects the stylesheet link at most once: repeat calls for a theme
 * whose CSS is already linked are no-ops that resolve to true. Unknown
 * or malformed theme IDs are rejected without touching the document.
 *
 * @param documentObj - Document to load the stylesheet into
 * @param themeId - Theme whose CSS to load
 * @returns True when the CSS is available (loaded now or previously)
 */
export async function loadThemeCSSOnDemand(
  documentObj: Document,
  themeId: string,
): Promise<boolean> {
  if (!isKnownThemeId(themeId)) {
    logThemeError(ThemeErrors.INVALID_THEME_ID(themeId));
    return false;
  }
  if (isThemeCSSLoaded(documentObj, themeId)) {
    return true;
  }
  const theme = resolveTheme(themeId);
  if (!theme) {
    return false;
  }
  await loadThemeCSS(documentObj, theme, getBaseUrl(documentObj));
  // loadThemeCSS swallows load errors and removes the failed <link>, so
  // re-check the DOM to report whether the stylesheet actually survived.
  return isThemeCSSLoaded(documentObj, themeId);
}

/**
 * Prefetches a theme's CSS so a later switch hits the browser cache.
 *
 * Injects a `<link rel="prefetch" as="style">` at most once per theme.
 * Skips themes whose stylesheet is already linked, themes already
 * prefetched, and unknown theme IDs.
 *
 * @param documentObj - Document to inject the prefetch link into
 * @param themeId - Theme whose CSS to prefetch
 * @returns True when a prefetch link was injected by this call
 */
export function prefetchThemeCSS(documentObj: Document, themeId: string): boolean {
  if (!isKnownThemeId(themeId)) {
    return false;
  }
  if (isThemeCSSLoaded(documentObj, themeId)) {
    return false;
  }
  if (documentObj.getElementById(themePrefetchLinkId(themeId))) {
    return false;
  }
  const theme = resolveTheme(themeId);
  if (!theme) {
    return false;
  }

  let href: string;
  try {
    href = resolveAssetPath(theme.cssFile, getBaseUrl(documentObj));
  } catch {
    logThemeError(ThemeErrors.INVALID_CSS_PATH(themeId));
    return false;
  }

  const link = documentObj.createElement('link');
  link.id = themePrefetchLinkId(themeId);
  link.rel = 'prefetch';
  link.setAttribute('as', 'style');
  link.href = href;
  link.setAttribute('data-theme-prefetch', themeId);
  documentObj.head.appendChild(link);
  return true;
}

/**
 * Wires hover/focus-triggered CSS prefetch for marked elements.
 *
 * Listens for `mouseover` and `focusin` on the document and prefetches
 * the theme named by the nearest ancestor carrying the
 * `data-theme-preview` attribute. Delegation means marquee items added
 * after wiring are covered without re-wiring.
 *
 * @param documentObj - Document to listen on (defaults to global)
 * @returns Function that removes the listeners when called
 */
export function wireHoverPrefetch(documentObj: Document = document): Unsubscribe {
  const handler = (event: Event): void => {
    const target = event.target;
    if (!(target instanceof Element)) {
      return;
    }
    const trigger = target.closest(`[${PREFETCH_TRIGGER_ATTRIBUTE}]`);
    if (!trigger) {
      return;
    }
    const themeId = trigger.getAttribute(PREFETCH_TRIGGER_ATTRIBUTE);
    if (!themeId) {
      return;
    }
    prefetchThemeCSS(documentObj, themeId);
  };

  documentObj.addEventListener('mouseover', handler);
  documentObj.addEventListener('focusin', handler);
  return () => {
    documentObj.removeEventListener('mouseover', handler);
    documentObj.removeEventListener('focusin', handler);
  };
}
