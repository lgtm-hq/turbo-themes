// SPDX-License-Identifier: MIT
/**
 * Generates a self-contained inline JavaScript string that prevents FOUC
 * (Flash of Unstyled Content) by applying the saved theme before first paint.
 *
 * The returned string is a complete IIFE suitable for injection into a
 * `<script>` tag in the document `<head>`. It has no module dependencies.
 *
 * @example
 * // Astro frontmatter
 * import { generateBlockingScript } from '@lgtm-hq/turbo-theme-selector';
 * const blockingScript = generateBlockingScript();
 *
 * // Astro template
 * <Fragment set:html={`<script>${blockingScript}</script>`} />
 */

import { DEFAULT_THEME, VALID_THEMES } from '@lgtm-hq/turbo-themes-core';
import { CSS_LINK_ID, STORAGE_KEY, LEGACY_STORAGE_KEYS } from './constants.js';

export interface BlockingScriptOptions {
  /** Valid theme IDs to accept. Defaults to VALID_THEMES from core. */
  validThemes?: readonly string[];
  /** Fallback theme when no preference is stored. Defaults to DEFAULT_THEME from core. */
  defaultTheme?: string;
  /** localStorage key for the active theme. Defaults to STORAGE_KEY from core. */
  storageKey?: string;
  /** Legacy localStorage keys to migrate from. Defaults to LEGACY_STORAGE_KEYS from core. */
  legacyKeys?: readonly string[];
}

/**
 * Generates a self-contained inline IIFE that prevents FOUC. It:
 * 1. Migrates legacy storage keys to the current `storageKey`
 * 2. Reads and validates the stored theme against the allowlist
 * 3. Sets `data-theme` and the `theme-{id}` class on `<html>`
 * 4. Sets `window.__INITIAL_THEME__` so `initTheme` can short-circuit
 * 5. Updates the existing CSS `<link>` href when the theme is non-default
 *
 * The body uses readable identifiers; the bundler/gzip handles size. The
 * outer try/catch keeps the page from breaking when localStorage throws
 * (e.g. private browsing).
 */
export function generateBlockingScript(options: BlockingScriptOptions = {}): string {
  const {
    validThemes = VALID_THEMES,
    defaultTheme = DEFAULT_THEME,
    storageKey = STORAGE_KEY,
    legacyKeys = LEGACY_STORAGE_KEYS,
  } = options;

  const config = {
    storageKey: JSON.stringify(storageKey),
    defaultTheme: JSON.stringify(defaultTheme),
    validThemes: JSON.stringify(validThemes),
    legacyKeys: JSON.stringify(legacyKeys),
    cssLinkId: JSON.stringify(CSS_LINK_ID),
  };

  return `(function () {
  try {
    var storageKey = ${config.storageKey};
    var defaultTheme = ${config.defaultTheme};
    var validThemes = ${config.validThemes};
    var legacyKeys = ${config.legacyKeys};
    var cssLinkId = ${config.cssLinkId};

    for (var i = 0; i < legacyKeys.length; i++) {
      var legacyValue = localStorage.getItem(legacyKeys[i]);
      if (legacyValue && !localStorage.getItem(storageKey)) {
        localStorage.setItem(storageKey, legacyValue);
        localStorage.removeItem(legacyKeys[i]);
      }
    }

    var theme = localStorage.getItem(storageKey) || defaultTheme;
    if (validThemes.indexOf(theme) === -1) theme = defaultTheme;

    var root = document.documentElement;
    root.setAttribute('data-theme', theme);
    var classes = root.classList;
    for (var j = classes.length - 1; j >= 0; j--) {
      if (classes[j].indexOf('theme-') === 0) classes.remove(classes[j]);
    }
    classes.add('theme-' + theme);
    window.__INITIAL_THEME__ = theme;

    if (theme !== defaultTheme) {
      var baseUrl = root.getAttribute('data-baseurl') || '';
      var link = document.getElementById(cssLinkId);
      if (link) link.href = baseUrl + '/assets/css/themes/turbo/' + theme + '.css';
    }
  } catch (e) {
    console.warn('Unable to load saved theme:', e);
  }
})();`;
}
