// SPDX-License-Identifier: MIT
/**
 * Lightweight theme catalog for picker UIs.
 *
 * Contains only the metadata needed to render theme selectors (id, label,
 * vendor, appearance, preview colors) — not full design tokens. Prefer this
 * export over `flavors` / `tokens.json` when you do not need token values.
 *
 * Filterable fields (`id`, `vendor`, `appearance`) match full {@link ThemeFlavor}
 * entries, so the same vendor/appearance/include/exclude selection patterns
 * used by `createThemeCatalog()` (#495) apply to these slim entries for
 * UI-only consumers. Full token access still requires `flavors` / `getTheme()`.
 */

import catalogJson from './catalog.json' with { type: 'json' };

/** Preview swatch colors for a theme picker entry. */
export interface ThemeCatalogPreview {
  bg: string;
  surface: string;
  accent: string;
  text: string;
}

/**
 * Slim theme metadata (~200 bytes/theme vs full tokens).
 *
 * Shares `id` / `vendor` / `appearance` with {@link ThemeFlavor} so catalogs
 * can be filtered with the same selection rules as the full flavor list.
 */
export interface ThemeCatalogEntry {
  id: string;
  label: string;
  vendor: string;
  appearance: 'light' | 'dark';
  iconUrl?: string;
  preview: ThemeCatalogPreview;
}

const catalogData = catalogJson as ThemeCatalogEntry[];

/** All theme catalog entries in canonical theme order. */
export const catalog: readonly ThemeCatalogEntry[] = catalogData;

/** O(1) catalog entry lookup by theme ID. */
export const catalogById: Readonly<Record<string, ThemeCatalogEntry>> =
  /*#__PURE__*/ Object.fromEntries(catalog.map((entry) => [entry.id, entry]));
