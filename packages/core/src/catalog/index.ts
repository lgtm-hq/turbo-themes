// SPDX-License-Identifier: MIT
/**
 * `@lgtm-hq/turbo-themes/catalog` — theme curation and picker metadata.
 *
 * Barrel for the `./catalog` subpath: the `createThemeCatalog` curation API
 * (#495/#563, in `create.ts`) and the slim precomputed picker metadata
 * (#497, in `entries.ts`). The root package barrel re-exports only
 * `create.js` so the embedded catalog data stays out of bundles that don't
 * import the `./catalog` subpath.
 */

export * from './create.js';
export {
  catalog,
  catalogById,
  type ThemeCatalogEntry,
  type ThemeCatalogPreview,
} from './entries.js';
