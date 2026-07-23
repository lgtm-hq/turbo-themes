// SPDX-License-Identifier: MIT
/**
 * Storage utilities for theme persistence
 */

import { STORAGE_KEY, LEGACY_STORAGE_KEYS, DEFAULT_THEME } from './constants.js';
import { ThemeErrors, logThemeError } from './errors.js';

// Re-export DEFAULT_THEME for convenience
export { DEFAULT_THEME } from './constants.js';

/**
 * Safely get an item from localStorage.
 * Returns null if storage is unavailable (e.g., private browsing mode).
 */
function safeGetItem(windowObj: Window, key: string): string | null {
  try {
    return windowObj.localStorage.getItem(key);
  } catch (error) {
    logThemeError(ThemeErrors.STORAGE_UNAVAILABLE('getItem', error));
    return null;
  }
}

/**
 * Safely set an item in localStorage.
 * Returns false if storage is unavailable.
 */
function safeSetItem(windowObj: Window, key: string, value: string): boolean {
  try {
    windowObj.localStorage.setItem(key, value);
    return true;
  } catch (error) {
    logThemeError(ThemeErrors.STORAGE_UNAVAILABLE('setItem', error));
    return false;
  }
}

/**
 * Safely remove an item from localStorage.
 * Silently fails if storage is unavailable.
 */
function safeRemoveItem(windowObj: Window, key: string): void {
  try {
    windowObj.localStorage.removeItem(key);
  } catch (error) {
    logThemeError(ThemeErrors.STORAGE_UNAVAILABLE('removeItem', error));
  }
}

/**
 * Validates a theme ID against a set of valid IDs.
 * Returns the theme ID if valid, otherwise returns the fallback theme.
 *
 * @param themeId - The candidate theme ID (may be null when unset).
 * @param validIds - The set of allowed theme IDs.
 * @param fallback - Theme returned when `themeId` is missing or disallowed.
 */
export function validateThemeId(
  themeId: string | null,
  validIds: Set<string>,
  fallback: string = DEFAULT_THEME
): string {
  if (themeId && validIds.has(themeId)) {
    return themeId;
  }
  return fallback;
}

/**
 * Migrates legacy storage keys to the current format.
 * Safely handles unavailable localStorage (e.g., private browsing).
 */
export function migrateLegacyStorage(windowObj: Window): void {
  for (const legacyKey of LEGACY_STORAGE_KEYS) {
    const legacy = safeGetItem(windowObj, legacyKey);
    if (legacy && !safeGetItem(windowObj, STORAGE_KEY)) {
      safeSetItem(windowObj, STORAGE_KEY, legacy);
      safeRemoveItem(windowObj, legacyKey);
    }
  }
}

/**
 * Gets the saved theme from localStorage, or returns the fallback.
 * Optionally validates against a set of valid theme IDs.
 * Safely handles unavailable localStorage (e.g., private browsing).
 *
 * @param windowObj - Window object with localStorage.
 * @param validIds - Optional set of valid theme IDs for validation.
 * @param fallback - Theme used when nothing valid is stored.
 */
export function getSavedTheme(
  windowObj: Window,
  validIds?: Set<string>,
  fallback: string = DEFAULT_THEME
): string {
  const stored = safeGetItem(windowObj, STORAGE_KEY);
  if (validIds) {
    return validateThemeId(stored, validIds, fallback);
  }
  return stored || fallback;
}

/**
 * Saves a theme to localStorage.
 * Optionally validates the theme ID against a set of valid IDs before saving.
 * Safely handles unavailable localStorage (e.g., private browsing).
 *
 * @param windowObj - Window object with localStorage
 * @param themeId - Theme ID to save
 * @param validIds - Optional set of valid theme IDs for validation
 * @returns true if saved successfully, false otherwise
 */
export function saveTheme(windowObj: Window, themeId: string, validIds?: Set<string>): boolean {
  if (validIds && !validIds.has(themeId)) {
    logThemeError(ThemeErrors.INVALID_THEME_ID(themeId));
    return false;
  }
  return safeSetItem(windowObj, STORAGE_KEY, themeId);
}
