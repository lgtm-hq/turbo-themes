// SPDX-License-Identifier: MIT
/**
 * Theme resolution utilities - centralized theme lookup and validation.
 *
 * Provides cached access to theme data and validation to avoid
 * repeated mapping and set creation across the codebase.
 */

import { flavors, createThemeCatalog, type ThemeCatalog } from '@lgtm-hq/turbo-themes-core';
import { mapFlavorToUI, type ThemeFlavor } from './theme-mapper.js';
import { DEFAULT_THEME } from './constants.js';

/**
 * Options describing which subset of themes a selector should expose.
 *
 * The allowlist is resolved with the following precedence:
 * `catalog` > explicit `themes` > `vendors` (expanded via `createThemeCatalog`)
 * > all themes. When no subset-selecting option is provided the full theme set
 * is used, preserving backwards-compatible behavior.
 */
export interface ThemeSelectorOptions {
  /** Explicit allowlist of theme IDs. Ignored when `catalog` is provided. */
  themes?: readonly string[];
  /** Vendors to include; expanded to all of their variants. */
  vendors?: readonly string[];
  /** A pre-built catalog (e.g. from `createThemeCatalog`/`themeSets`). */
  catalog?: ThemeCatalog;
  /** Fallback theme when the persisted theme is outside the allowlist. */
  defaultTheme?: string;
}

// Cache mapped themes and valid IDs
let mappedThemes: ThemeFlavor[] | null = null;
let validThemeIds: Set<string> | null = null;

/**
 * Resolves the set of allowed theme IDs from selector options.
 *
 * Precedence: `catalog` > `themes` > `vendors` > all themes.
 *
 * @param options - Optional subset-selecting options.
 * @returns A set of allowed theme IDs, or `null` when all themes are allowed.
 */
export function resolveAllowedThemeIds(
  options?: ThemeSelectorOptions
): ReadonlySet<string> | null {
  if (!options) return null;
  const { catalog, themes, vendors } = options;
  if (catalog) return new Set(catalog.themeIds);
  if (themes) return new Set(themes);
  if (vendors) return new Set(createThemeCatalog({ vendors }).themeIds);
  return null;
}

/**
 * Gets the full list of themes mapped to UI format.
 * Results are cached for performance.
 */
function getAllThemes(): ThemeFlavor[] {
  if (!mappedThemes) {
    mappedThemes = flavors.map(mapFlavorToUI);
  }
  return mappedThemes || [];
}

/**
 * Gets a Set of all valid theme IDs (full catalog).
 * Results are cached for performance.
 */
function getAllValidThemeIds(): Set<string> {
  if (!validThemeIds) {
    validThemeIds = new Set(flavors.map((f) => f.id));
  }
  return validThemeIds;
}

/**
 * Gets themes mapped to UI format, optionally filtered to a subset.
 *
 * Results are cached for performance; filtering preserves canonical order.
 *
 * @param options - Optional subset-selecting options.
 * @returns The mapped themes, filtered to the resolved allowlist when present.
 */
export function getThemes(options?: ThemeSelectorOptions): ThemeFlavor[] {
  const all = getAllThemes();
  const allowed = resolveAllowedThemeIds(options);
  if (!allowed) return all;
  return all.filter((theme) => allowed.has(theme.id));
}

/**
 * Gets a Set of valid theme IDs, optionally filtered to a subset.
 *
 * The returned set is always intersected with the full catalog so unknown IDs
 * supplied via `options.themes` cannot leak into the allowlist.
 *
 * @param options - Optional subset-selecting options.
 * @returns The valid theme IDs, filtered to the resolved allowlist when present.
 */
export function getValidThemeIds(options?: ThemeSelectorOptions): Set<string> {
  const all = getAllValidThemeIds();
  const allowed = resolveAllowedThemeIds(options);
  if (!allowed) return all;
  return new Set([...all].filter((id) => allowed.has(id)));
}

/**
 * Resolves a theme by ID, falling back to default if not found.
 *
 * @param themeId - The theme ID to resolve
 * @returns The matching theme, default theme, or first available theme
 */
export function resolveTheme(themeId: string): ThemeFlavor | undefined {
  const themes = getThemes();
  return (
    themes.find((t) => t.id === themeId) ||
    themes.find((t) => t.id === DEFAULT_THEME) ||
    themes[0]
  );
}

/**
 * Validates a theme ID for safety and format correctness.
 *
 * Accepts only alphanumeric characters, hyphens, and underscores.
 * Rejects special characters, unicode, and excessively long IDs.
 *
 * @param id - The value to validate as a theme ID
 * @returns True if the ID is valid, false otherwise
 */
export function isValidThemeId(id: unknown): boolean {
  if (typeof id !== 'string') return false;
  if (id.length === 0) return false;
  if (id.length > 100) return false;
  return /^[a-zA-Z0-9_-]+$/.test(id);
}

/**
 * Sanitizes a theme ID by removing unsafe characters.
 *
 * Removes any characters that could cause DOM/CSS/XSS issues.
 * Used as a fallback when displaying potentially untrusted input.
 *
 * @param id - The theme ID to sanitize
 * @returns The sanitized ID containing only safe characters
 */
export function sanitizeThemeId(id: string): string {
  return id.replace(/[^a-zA-Z0-9_-]/g, '');
}

/**
 * Resets the cached themes. Used for testing.
 * @internal
 */
export function _resetThemeCache(): void {
  mappedThemes = null;
  validThemeIds = null;
}
