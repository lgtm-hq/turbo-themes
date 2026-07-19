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

import {
  DEFAULT_THEME,
  THEME_APPEARANCES,
  VALID_THEMES,
  createThemeCatalog,
  type ThemeCatalog,
} from '@lgtm-hq/turbo-themes-core';
import type { ThemeAppearance } from './appearance.js';
import { CSS_LINK_ID, STORAGE_KEY, LEGACY_STORAGE_KEYS } from './constants.js';

export interface BlockingScriptOptions {
  /**
   * Valid theme IDs to accept. When omitted, the allowlist is resolved from
   * `catalog`, then `vendors`, and finally VALID_THEMES from core.
   */
  validThemes?: readonly string[];
  /** Vendors whose variants form the allowlist. Ignored when `validThemes` is set. */
  vendors?: readonly string[];
  /**
   * A pre-built catalog (e.g. from `createThemeCatalog`/`themeSets`) whose
   * `themeIds` form the allowlist. Ignored when `validThemes` is set.
   */
  catalog?: ThemeCatalog;
  /** Fallback theme when no preference is stored. Defaults to DEFAULT_THEME from core. */
  defaultTheme?: string;
  /** localStorage key for the active theme. Defaults to STORAGE_KEY from core. */
  storageKey?: string;
  /** Legacy localStorage keys to migrate from. Defaults to LEGACY_STORAGE_KEYS from core. */
  legacyKeys?: readonly string[];
  /** Light/dark mapping per theme ID. Defaults to THEME_APPEARANCES from core. */
  themeAppearances?: Readonly<Record<string, ThemeAppearance>>;
}

/**
 * Resolves the allowlist for the blocking script.
 *
 * Precedence: explicit `validThemes` > `catalog` > `vendors` > VALID_THEMES.
 */
function resolveValidThemes(options: BlockingScriptOptions): readonly string[] {
  if (options.validThemes) return options.validThemes;
  if (options.catalog) return options.catalog.themeIds;
  if (options.vendors) return createThemeCatalog({ vendors: options.vendors }).themeIds;
  return VALID_THEMES;
}

/**
 * Generates a self-contained inline IIFE that prevents FOUC. It:
 * 1. Migrates legacy storage keys to the current `storageKey`
 * 2. Reads and validates the stored theme against the allowlist
 * 3. Sets `data-theme`, `data-appearance`, and the `theme-{id}` class on `<html>`
 * 4. Sets `window.__INITIAL_THEME__` so `initTheme` can short-circuit
 * 5. Updates the existing CSS `<link>` href when the theme is non-default
 *
 * The body uses readable identifiers; the bundler/gzip handles size. The
 * outer try/catch keeps the page from breaking when localStorage throws
 * (e.g. private browsing).
 */
export function generateBlockingScript(options: BlockingScriptOptions = {}): string {
  const {
    defaultTheme = DEFAULT_THEME,
    storageKey = STORAGE_KEY,
    legacyKeys = LEGACY_STORAGE_KEYS,
    themeAppearances = THEME_APPEARANCES,
  } = options;
  const validThemes = resolveValidThemes(options);

  const config = {
    storageKey: JSON.stringify(storageKey),
    defaultTheme: JSON.stringify(defaultTheme),
    validThemes: JSON.stringify(validThemes),
    legacyKeys: JSON.stringify(legacyKeys),
    themeAppearances: JSON.stringify(themeAppearances),
    cssLinkId: JSON.stringify(CSS_LINK_ID),
  };

  return `(function () {
  try {
    var storageKey = ${config.storageKey};
    var defaultTheme = ${config.defaultTheme};
    var validThemes = ${config.validThemes};
    var legacyKeys = ${config.legacyKeys};
    var themeAppearances = ${config.themeAppearances};
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
    root.setAttribute('data-appearance', themeAppearances[theme] || 'dark');
    var classes = root.classList;
    for (var j = classes.length - 1; j >= 0; j--) {
      if (classes[j].indexOf('theme-') === 0) classes.remove(classes[j]);
    }
    classes.add('theme-' + theme);
    window.__INITIAL_THEME__ = theme;

    var rawBase = root.getAttribute('data-baseurl') || '';
    var baseUrl = '';
    if (rawBase && rawBase.indexOf('//') !== 0) {
      try {
        var parsed = new URL(rawBase, location.href);
        if (parsed.origin === location.origin) {
          baseUrl = parsed.pathname.replace(/[/]+$/g, '');
          if (baseUrl === '/') baseUrl = '';
        }
      } catch (urlErr) {
        baseUrl = '';
      }
    }
    var link = document.getElementById(cssLinkId);
    if (link) link.href = baseUrl + '/assets/css/themes/turbo/' + theme + '.css';
  } catch (e) {
    console.warn('Unable to load saved theme:', e);
  }
})();`;
}
