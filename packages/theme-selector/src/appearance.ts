// SPDX-License-Identifier: MIT
/**
 * Theme appearance (light/dark) resolution for DOM attributes.
 */

import { THEME_APPEARANCES } from '@lgtm-hq/turbo-themes-core';

export type ThemeAppearance = 'light' | 'dark';

/**
 * Resolves light/dark appearance for a theme ID.
 *
 * Falls back to `'dark'` when the theme is unknown (e.g. custom themes without
 * an explicit mapping).
 */
export function resolveThemeAppearance(
  themeId: string,
  appearances: Readonly<Record<string, ThemeAppearance>> = THEME_APPEARANCES,
): ThemeAppearance {
  return appearances[themeId] ?? 'dark';
}
