// SPDX-License-Identifier: MIT
/**
 * Named theme presets built on top of {@link createThemeCatalog}.
 *
 * These provide opinionated defaults so consumers don't rebuild the same
 * "minimal" or "dark-only" lists in every app. Per-vendor sets are derived
 * from the `packages` keys, so new vendor variants appear automatically on
 * upgrade for opted-in vendors.
 */

import { packages } from '../tokens/index.js';
import type { ThemeId } from '../themes/theme-ids.js';
import { createThemeCatalog, type ThemeCatalog } from './create.js';

/**
 * The curated "minimal" starter set: one light + one dark theme from the two
 * most common vendors.
 */
const MINIMAL_THEME_IDS: readonly ThemeId[] = [
  'catppuccin-mocha',
  'catppuccin-latte',
  'github-light',
  'github-dark',
];

/**
 * Named theme presets. Known keys (`minimal`, `dark`, `light`) are always
 * present; additional keys are one per vendor (e.g. `catppuccin`, `dracula`).
 */
export type ThemeSets = {
  readonly minimal: ThemeCatalog;
  readonly dark: ThemeCatalog;
  readonly light: ThemeCatalog;
} & { readonly [vendor: string]: ThemeCatalog };

const perVendorSets: Record<string, ThemeCatalog> = Object.fromEntries(
  Object.keys(packages).map((vendor) => [vendor, createThemeCatalog({ vendors: [vendor] })]),
);

export const themeSets: ThemeSets = {
  ...perVendorSets,
  minimal: createThemeCatalog({ vendors: [], include: MINIMAL_THEME_IDS }),
  dark: createThemeCatalog({ appearances: ['dark'] }),
  light: createThemeCatalog({ appearances: ['light'] }),
};
