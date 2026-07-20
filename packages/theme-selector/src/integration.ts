// SPDX-License-Identifier: MIT
/**
 * Public integration API for driving theming from outside the package.
 *
 * Site pages (e.g. the homepage showcase) use these functions to apply a
 * theme, query the active theme, and subscribe to theme changes without
 * reaching into selector internals. The theme-selector package remains
 * the owner of persistence, the `data-theme`/`data-appearance` root
 * attributes, and dropdown state.
 */

import { resolveThemeAppearance, type ThemeAppearance } from './appearance.js';
import {
  applyTheme as applyThemeToDocument,
  getCurrentTheme as getCurrentThemeFromDocument,
} from './apply-theme.js';
import { DEFAULT_THEME } from './constants.js';
import { ThemeErrors, logThemeError } from './errors.js';
import { saveTheme } from './storage.js';
import { getValidThemeIds, isValidThemeId } from './theme-resolver.js';

/** Name of the CustomEvent dispatched on the document after a theme change. */
export const THEME_CHANGE_EVENT = 'turbo-theme-change';

/** Payload carried by theme-change notifications. */
export interface ThemeChangeDetail {
  /** ID of the theme that was applied (e.g. `catppuccin-mocha`). */
  themeId: string;
  /** Light/dark appearance of the applied theme. */
  appearance: ThemeAppearance;
}

/** Listener invoked with the payload of each theme change. */
export type ThemeChangeListener = (detail: ThemeChangeDetail) => void;

/**
 * Outcome of an applyTheme call, reporting each stage independently so
 * consumers can distinguish full success from partial application.
 */
export interface ApplyThemeResult {
  /**
   * True when the theme ID was valid and the `data-theme` /
   * `data-appearance` root attributes and theme class were applied.
   */
  applied: boolean;
  /**
   * True when the theme's stylesheet is confirmed loaded (fetched now or
   * already linked). False means the DOM attributes may have changed
   * while the previous theme's CSS is still in effect.
   */
  cssLoaded: boolean;
  /**
   * True when the selection was persisted to localStorage. False when
   * storage is unavailable (e.g. private browsing) or over quota.
   */
  persisted: boolean;
}

/** Removes a listener previously registered via subscribeToThemeChanges. */
export type Unsubscribe = () => void;

/**
 * Dispatches the theme-change CustomEvent on the document.
 *
 * @param documentObj - Document to dispatch the event on
 * @param themeId - ID of the theme that was applied
 */
function emitThemeChange(documentObj: Document, themeId: string): void {
  const detail: ThemeChangeDetail = {
    themeId,
    appearance: resolveThemeAppearance(themeId),
  };
  documentObj.dispatchEvent(new CustomEvent<ThemeChangeDetail>(THEME_CHANGE_EVENT, { detail }));
}

/**
 * Applies a theme by ID through the theme-selector pipeline.
 *
 * Persists the selection, updates the `data-theme`/`data-appearance`
 * attributes and theme CSS, syncs dropdown state, and notifies
 * subscribers via the theme-change event.
 *
 * Each stage is reported independently in the returned
 * {@link ApplyThemeResult} so consumers can distinguish full success
 * from partial application:
 *
 * - Unknown or malformed theme IDs are rejected: nothing is applied, no
 *   event is dispatched, and all result fields are false.
 * - `persisted` is false when localStorage is unavailable or over
 *   quota; the theme is still applied visually.
 * - `cssLoaded` is false when the stylesheet fetch fails; the root
 *   attributes have changed but the previous theme's CSS remains in
 *   effect, so the theme-change event is NOT dispatched.
 *
 * The theme-change event fires only when the theme is visually applied
 * (`applied && cssLoaded`); persistence failure alone does not suppress
 * it.
 *
 * @param themeId - ID of the theme to apply (e.g. `catppuccin-mocha`)
 * @param documentObj - Document to apply the theme to (defaults to global)
 * @param windowObj - Window used for persistence (defaults to global)
 * @returns Per-stage outcome of the application
 */
export async function applyTheme(
  themeId: string,
  documentObj: Document = document,
  windowObj: Window = window,
): Promise<ApplyThemeResult> {
  const validIds = getValidThemeIds();
  if (!isValidThemeId(themeId) || !validIds.has(themeId)) {
    logThemeError(ThemeErrors.INVALID_THEME_ID(themeId));
    return { applied: false, cssLoaded: false, persisted: false };
  }

  const persisted = saveTheme(windowObj, themeId, validIds);
  const cssLoaded = await applyThemeToDocument(documentObj, themeId);
  if (cssLoaded) {
    emitThemeChange(documentObj, themeId);
  }
  return { applied: true, cssLoaded, persisted };
}

/**
 * Gets the ID of the currently active theme.
 *
 * Prefers the `data-theme` root attribute (set by both the blocking
 * script and the theme-selector), falls back to the `theme-*` class,
 * and finally to the default theme.
 *
 * @param documentObj - Document to inspect (defaults to global)
 * @returns The active theme ID
 */
export function getCurrentTheme(documentObj: Document = document): string {
  const fromAttribute = documentObj.documentElement.getAttribute('data-theme');
  if (fromAttribute) {
    return fromAttribute;
  }
  return getCurrentThemeFromDocument(documentObj, DEFAULT_THEME);
}

/**
 * Subscribes to theme-change notifications.
 *
 * The listener fires after each successful theme application — whether
 * triggered through applyTheme or the dropdown UI — with the applied
 * theme ID and its light/dark appearance.
 *
 * @param listener - Callback invoked with each theme-change payload
 * @param documentObj - Document to listen on (defaults to global)
 * @returns Function that removes the listener when called
 */
export function subscribeToThemeChanges(
  listener: ThemeChangeListener,
  documentObj: Document = document,
): Unsubscribe {
  const handler = (event: Event): void => {
    const detail = (event as CustomEvent<ThemeChangeDetail>).detail;
    if (detail) {
      listener(detail);
    }
  };
  documentObj.addEventListener(THEME_CHANGE_EVENT, handler);
  return () => documentObj.removeEventListener(THEME_CHANGE_EVENT, handler);
}
