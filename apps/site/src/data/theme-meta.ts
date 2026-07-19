/**
 * Shared theme display metadata consumed by BaseLayout and index page inline scripts.
 *
 * Derived from the canonical core metadata — automatically stays in sync
 * when themes are added or removed.
 */

import {
  VENDOR_GROUPS,
  THEME_SHORT_LABELS,
  THEME_APPEARANCES as coreAppearances,
  THEME_ICONS,
  VALID_THEMES,
} from '@lgtm-hq/turbo-themes-core/metadata';

/** Theme group for dropdown rendering. */
export interface ThemeGroup {
  id: string;
  displayName: string;
  flavors: string[];
}

/** Ordered theme groups for dropdown rendering. */
export const themeGroups: ThemeGroup[] = VENDOR_GROUPS.map((g) => ({
  id: g.id,
  displayName: g.displayName,
  flavors: [...g.themeIds],
}));

/** All valid theme IDs derived from the groups. */
export const validThemeIds: string[] = [...VALID_THEMES];

/** Human-readable short label shown in the theme dropdown trigger. */
export const themeNames: Record<string, string> = { ...THEME_SHORT_LABELS };

/** Appearance (light/dark) for each theme. */
export const themeAppearances: Record<string, 'light' | 'dark'> = { ...coreAppearances };

/**
 * Icon filename (relative to /assets/img/) for the theme dropdown trigger.
 * Generated from schema/tokens/themes/*.tokens.json `icon` fields.
 */
export const themeIcons: Record<string, string> = { ...THEME_ICONS };
Object.freeze(themeIcons);
