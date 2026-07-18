// SPDX-License-Identifier: MIT
/**
 * Core package exports
 * 
 * Re-exports tokens and themes for use by other packages
 */

export * from './tokens/index.js';
export * from './themes/registry.js';
export * from './themes/types.js';
export * from './themes/metadata.js';
export type { ThemeId } from './themes/theme-ids.js';
export { THEME_IDS } from './themes/theme-ids.js';
export * from './catalog/index.js';
export * from './catalog/sets.js';
