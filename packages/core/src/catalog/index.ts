// SPDX-License-Identifier: MIT
/**
 * Consumer theme curation API.
 *
 * `createThemeCatalog()` provides a single, composable surface for selecting a
 * subset of themes. It composes with the existing `flavors` (tokens) and
 * `VENDOR_GROUPS` (metadata) so consumers no longer need to hand-slice arrays.
 *
 * Filter precedence:
 *   all themes -> vendors/appearances -> include -> exclude
 *
 * Invalid IDs supplied to `include`/`exclude` warn in development (never
 * throw), so a typo cannot silently drop or duplicate a theme.
 */

import type { ThemeFlavor } from '../themes/types.js';
import type { ThemeId } from '../themes/theme-ids.js';
import { flavors, themeIds as allThemeIds } from '../tokens/index.js';
import { VENDOR_GROUPS, type VendorGroup } from '../themes/metadata.js';

/** Options controlling which themes a {@link ThemeCatalog} contains. */
export interface ThemeCatalogOptions {
  /**
   * Restrict to these vendors (e.g. `['catppuccin', 'dracula']`). When
   * omitted, all vendors are eligible; an explicit empty array selects none,
   * which is useful for building an include-only catalog.
   */
  vendors?: readonly string[];
  /**
   * Restrict to these appearances. When omitted, both appearances are
   * eligible; an explicit empty array selects none.
   */
  appearances?: readonly ('light' | 'dark')[];
  /** Theme IDs to add after vendor/appearance filtering. */
  include?: readonly string[];
  /** Theme IDs to remove after `include` has been applied. */
  exclude?: readonly string[];
}

/** A curated view over the theme catalog. */
export interface ThemeCatalog {
  /** Selected theme IDs, in canonical catalog order. */
  readonly themeIds: readonly ThemeId[];
  /** Full flavor objects for the selected themes, in canonical order. */
  readonly flavors: readonly ThemeFlavor[];
  /** Vendor groups (for dropdown UIs) restricted to the selected themes. */
  readonly vendorGroups: readonly VendorGroup[];
}

const KNOWN_THEME_IDS: ReadonlySet<string> = new Set(allThemeIds);

/**
 * Emit a dev-time warning for unknown IDs. Mirrors the unconditional
 * `console.warn` validation convention used in `../themes/metadata.ts`; bundlers
 * strip these when minifying for production.
 */
function warnInvalidIds(source: 'include' | 'exclude', ids: readonly string[]): void {
  if (ids.length === 0) return;
  console.warn(
    `[catalog] createThemeCatalog: ignoring unknown ${source} theme ID(s): ${ids.join(', ')}. ` +
      'Valid IDs come from the exported `themeIds`.',
  );
}

/**
 * Build a curated {@link ThemeCatalog} from the full theme set.
 *
 * @param options - Vendor/appearance filters plus explicit include/exclude IDs.
 * @returns A catalog exposing `themeIds`, `flavors`, and `vendorGroups`.
 */
export function createThemeCatalog(options: ThemeCatalogOptions = {}): ThemeCatalog {
  const { vendors, appearances, include = [], exclude = [] } = options;

  const selected = new Set<string>();
  for (const flavor of flavors) {
    if (vendors !== undefined && !vendors.includes(flavor.vendor)) continue;
    if (appearances !== undefined && !appearances.includes(flavor.appearance)) continue;
    selected.add(flavor.id);
  }

  const invalidInclude: string[] = [];
  for (const id of include) {
    if (KNOWN_THEME_IDS.has(id)) {
      selected.add(id);
    } else {
      invalidInclude.push(id);
    }
  }
  warnInvalidIds('include', invalidInclude);

  const invalidExclude: string[] = [];
  for (const id of exclude) {
    if (KNOWN_THEME_IDS.has(id)) {
      selected.delete(id);
    } else {
      invalidExclude.push(id);
    }
  }
  warnInvalidIds('exclude', invalidExclude);

  const selectedFlavors = flavors.filter((flavor) => selected.has(flavor.id));
  const selectedThemeIds = selectedFlavors.map((flavor) => flavor.id as ThemeId);

  const vendorGroups = VENDOR_GROUPS.map((group) => ({
    ...group,
    themeIds: group.themeIds.filter((id) => selected.has(id)),
  })).filter((group) => group.themeIds.length > 0);

  return {
    themeIds: selectedThemeIds,
    flavors: selectedFlavors,
    vendorGroups,
  };
}
