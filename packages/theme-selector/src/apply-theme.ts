// SPDX-License-Identifier: MIT
/**
 * Theme application logic
 */

import { DOM_IDS, DOM_SELECTORS, THEME_FAMILIES } from './constants.js';
import { getBaseUrl, applyThemeClass, loadThemeCSS, resolveAssetPath, getCurrentThemeFromClasses } from './theme-loader.js';
import { setItemActiveState } from './dropdown/helpers.js';
import { ThemeErrors, logThemeError } from './errors.js';
import { resolveTheme } from './theme-resolver.js';

/**
 * Applies a theme to the document.
 *
 * @returns true when the theme's CSS is confirmed loaded, false when the
 *   theme could not be resolved or its stylesheet failed to load (the
 *   root attributes/class are still applied in the latter case)
 */
export async function applyTheme(doc: Document, themeId: string): Promise<boolean> {
  const theme = resolveTheme(themeId);
  if (!theme) {
    logThemeError(ThemeErrors.NO_THEMES_AVAILABLE());
    return false;
  }
  const baseUrl = getBaseUrl(doc);

  // Add loading state to trigger button
  const trigger = doc.getElementById(DOM_IDS.THEME_FLAVOR_TRIGGER) as HTMLButtonElement | null;
  if (trigger) {
    trigger.classList.add('is-loading');
  }

  try {
    // Apply theme class immediately (before CSS loading)
    applyThemeClass(doc, theme.id);

    // Load theme CSS
    const cssLoaded = await loadThemeCSS(doc, theme, baseUrl);

    // Update trigger button icon
    const triggerIcon = doc.getElementById(
      DOM_IDS.THEME_FLAVOR_TRIGGER_ICON
    ) as HTMLImageElement | null;

    if (triggerIcon && theme.icon) {
      try {
        triggerIcon.src = resolveAssetPath(theme.icon, baseUrl);
        const familyMeta = THEME_FAMILIES[theme.family];
        const familyName = familyMeta?.name ?? theme.family;
        triggerIcon.alt = `${familyName} ${theme.name}`;
        triggerIcon.title = `${familyName} ${theme.name}`;
      } catch {
        logThemeError(ThemeErrors.INVALID_ICON_PATH(theme.id));
      }
    }

    // Update trigger button label
    const triggerLabel = doc.getElementById(
      DOM_IDS.THEME_FLAVOR_TRIGGER_LABEL
    ) as HTMLElement | null;
    if (triggerLabel) {
      triggerLabel.textContent = theme.name;
    }

    // Update active state in dropdown
    doc.querySelectorAll(DOM_SELECTORS.DROPDOWN_ITEMS).forEach((item) => {
      setItemActiveState(item, item.getAttribute('data-theme-id') === theme.id);
    });

    return cssLoaded;
  } finally {
    if (trigger) {
      trigger.classList.remove('is-loading');
    }
  }
}

/**
 * Gets the current theme from classes or returns default
 */
export function getCurrentTheme(doc: Document, defaultTheme: string): string {
  return getCurrentThemeFromClasses(doc.documentElement) || defaultTheme;
}
