// SPDX-License-Identifier: MIT
/**
 * Constants for theme selector component
 */

import { DEFAULT_THEME as CORE_DEFAULT_THEME } from '@lgtm-hq/turbo-themes-core';
import { THEME_FAMILIES as GENERATED_THEME_FAMILIES } from './generated/theme-maps.js';

// Re-export ThemeFamily for convenience
export type { ThemeFamily } from './types.js';
export type { ThemeFamilyMeta } from './generated/theme-maps.js';

export const STORAGE_KEY = 'turbo-theme';
export const LEGACY_STORAGE_KEYS = ['bulma-theme-flavor'];
export const DEFAULT_THEME = CORE_DEFAULT_THEME;

/** ID of the CSS link element used by the blocking script to prevent FOUC. */
export const CSS_LINK_ID = 'turbo-theme-css';

// DOM element IDs and selectors - centralized to avoid magic strings
export const DOM_IDS = {
  THEME_FLAVOR_TRIGGER: 'theme-flavor-trigger',
  THEME_FLAVOR_TRIGGER_ICON: 'theme-flavor-trigger-icon',
  THEME_FLAVOR_TRIGGER_LABEL: 'theme-flavor-trigger-label',
  THEME_FLAVOR_MENU: 'theme-flavor-menu',
  THEME_FLAVOR_SELECT: 'theme-flavor-select',
} as const;

export const DOM_SELECTORS = {
  DROPDOWN_ITEMS: `#${DOM_IDS.THEME_FLAVOR_MENU} .dropdown-item.theme-item`,
  NAVBAR_DROPDOWN: '.navbar-item.has-dropdown',
  NAV_REPORTS: '[data-testid="nav-reports"]',
  NAVBAR_ITEM: '.navbar-item',
  HIGHLIGHT_PRE: '.highlight > pre',
  THEME_CSS_LINKS: 'link[id^="theme-"][id$="-css"]',
} as const;

/** Family display metadata — generated from schema/tokens/_vendors.json. */
export const THEME_FAMILIES = GENERATED_THEME_FAMILIES;
