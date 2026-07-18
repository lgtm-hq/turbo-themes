// SPDX-License-Identifier: MIT
/**
 * Public types for theme selector
 */

export type ThemeMode = 'theme';
export type ThemeAppearance = 'light' | 'dark';

/** Theme family identifiers — generated from schema/tokens/_vendors.json. */
export type { ThemeFamily } from './generated/theme-maps.js';
