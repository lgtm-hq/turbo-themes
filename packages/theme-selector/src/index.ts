// SPDX-License-Identifier: MIT
/**
 * Theme selector package - main entry point
 */

import { migrateLegacyStorage, getSavedTheme, DEFAULT_THEME } from './storage.js';
import { getBaseUrl, getCurrentThemeFromClasses } from './theme-loader.js';
import {
  applyTheme as applyThemeToDocument,
  getCurrentTheme as getCurrentThemeFromDocument,
} from './apply-theme.js';
import { applyTheme as applyThemeById } from './integration.js';
import { THEME_FAMILIES } from './constants.js';
import { getThemes, getValidThemeIds } from './theme-resolver.js';
import { createDropdownStateManager, type DropdownState } from './dropdown/state.js';
import { wireDropdownEventHandlers } from './dropdown/events.js';
import { populateDropdownMenu, wireNativeSelect, getDropdownElements } from './dropdown/ui.js';
import { initNavbar } from './navbar.js';
import { enhanceAccessibility } from './accessibility.js';
import { ThemeErrors, logThemeError } from './errors.js';

// Extend Window interface to include our custom property
declare global {
  interface Window {
    __INITIAL_THEME__?: string;
    initNavbar: typeof initNavbar;
  }
}

/**
 * Initializes theme system
 */
export async function initTheme(documentObj: Document, windowObj: Window): Promise<void> {
  // Migrate legacy storage keys
  migrateLegacyStorage(windowObj);

  // Check if theme was already applied by blocking script
  const initialTheme = windowObj.__INITIAL_THEME__;
  const savedTheme = getSavedTheme(windowObj, getValidThemeIds());

  // If blocking script already applied theme and it matches saved, synchronize UI and return
  if (initialTheme && initialTheme === savedTheme) {
    if (getCurrentThemeFromClasses(documentObj.documentElement) === savedTheme) {
      // Always call applyTheme so the trigger label/icon stay in sync with the active theme
      await applyThemeToDocument(documentObj, savedTheme);
      return;
    }
  }

  // Otherwise, apply theme normally
  await applyThemeToDocument(documentObj, savedTheme);
}

/**
 * Initializes and wires up the theme flavor selector dropdown.
 * Returns a Promise for API consistency with initTheme.
 */
export async function wireFlavorSelector(
  documentObj: Document,
  windowObj: Window
): Promise<{ cleanup: () => void }> {
  const abortController = new AbortController();

  // Get required DOM elements
  const elements = getDropdownElements(documentObj);
  if (!elements) {
    return { cleanup: () => abortController.abort() };
  }

  const { dropdownMenu, selectEl } = elements;
  const baseUrl = getBaseUrl(documentObj);
  const themes = getThemes();

  // Initialize state
  const state: DropdownState = {
    currentIndex: -1,
    menuItems: [],
  };

  // Get current theme (validated against available themes)
  const currentThemeId =
    getSavedTheme(windowObj, getValidThemeIds()) ||
    getCurrentThemeFromDocument(documentObj, DEFAULT_THEME);

  // Create state manager (needs elements and state)
  const stateManager = createDropdownStateManager(elements, state);

  // Create context for UI creation
  const ctx = {
    documentObj,
    windowObj,
    baseUrl,
    currentThemeId,
    selectEl,
    menuItems: state.menuItems,
    closeDropdown: stateManager.closeDropdown,
    onThemeSelect: async (themeId: string) => {
      await applyThemeById(themeId, documentObj, windowObj);
    },
  };

  // Wire native select if present
  if (selectEl) {
    wireNativeSelect(ctx, selectEl, themes, DEFAULT_THEME);
  }

  // Populate dropdown menu
  populateDropdownMenu(ctx, dropdownMenu, themes, THEME_FAMILIES);

  // Wire event handlers
  wireDropdownEventHandlers(documentObj, elements, state, stateManager, abortController);

  // Initialize state
  stateManager.updateAriaExpanded(false);
  elements.dropdown.classList.remove('is-active');

  return { cleanup: () => abortController.abort() };
}

// Re-export public integration API for driving theming from site pages
export {
  applyTheme,
  getCurrentTheme,
  subscribeToThemeChanges,
  THEME_CHANGE_EVENT,
  type ApplyThemeResult,
  type ThemeChangeDetail,
  type ThemeChangeListener,
  type Unsubscribe,
} from './integration.js';

// Re-export lazy theme-CSS loading helpers for showcase-style pages
export {
  isThemeCSSLoaded,
  loadThemeCSSOnDemand,
  prefetchThemeCSS,
  shouldLoadThemeCSS,
  wireHoverPrefetch,
  PREFETCH_TRIGGER_ATTRIBUTE,
} from './lazy-css.js';

// Re-export navbar, accessibility, and blocking script functions
export { initNavbar, enhanceAccessibility };
export { generateBlockingScript, type BlockingScriptOptions } from './blocking-script.js';

// Re-export types
export type { ThemeMode, ThemeAppearance, ThemeFamily } from './types.js';

// Auto-initialize on DOMContentLoaded
if (typeof document !== 'undefined' && typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', async () => {
    try {
      await initTheme(document, window);

      const { cleanup } = await wireFlavorSelector(document, window);
      enhanceAccessibility(document);

      // Register cleanup on full page unload; skip for bfcache restores
      const pagehideHandler = (event: PageTransitionEvent) => {
        if (event.persisted) return;
        cleanup();
        window.removeEventListener('pagehide', pagehideHandler);
      };
      window.addEventListener('pagehide', pagehideHandler);
    } catch (error) {
      logThemeError(ThemeErrors.INIT_FAILED(error));
    }
  });
}
