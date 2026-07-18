// SPDX-License-Identifier: MIT
/**
 * Maps core theme flavors to UI-specific format
 */

import type { ThemeFlavor as CanonicalThemeFlavor } from '@lgtm-hq/turbo-themes-core';
import type { ThemeFamily } from './types.js';
import {
  DEFAULT_FAMILY,
  VENDOR_FAMILY_MAP,
  VENDOR_ICON_MAP,
  FLAVOR_DESCRIPTIONS,
  type AppearanceIcons,
} from './generated/theme-maps.js';

export type { AppearanceIcons };
export { VENDOR_ICON_MAP };

export interface ThemeColors {
  bg: string;
  surface: string;
  accent: string;
  text: string;
}

export interface ThemeFlavor extends Pick<CanonicalThemeFlavor, 'id' | 'appearance' | 'vendor'> {
  id: string;
  name: string;
  description: string;
  cssFile: string;
  icon?: string | undefined;
  family: ThemeFamily;
  colors: ThemeColors;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Gets the theme family from vendor name
 */
function getFamily(vendor: string): ThemeFamily {
  return VENDOR_FAMILY_MAP[vendor] ?? DEFAULT_FAMILY;
}

/**
 * Gets icon path for a vendor
 */
function getIconForVendor(vendor: string, appearance: 'light' | 'dark'): string | undefined {
  const iconConfig = VENDOR_ICON_MAP[vendor];

  if (!iconConfig) {
    return undefined;
  }

  if (typeof iconConfig === 'string') {
    return iconConfig;
  }

  return iconConfig[appearance];
}

/**
 * Gets description for a flavor
 */
function getDescriptionForFlavor(id: string, label: string): string {
  return FLAVOR_DESCRIPTIONS[id] ?? `${label} theme`;
}

/**
 * Extracts preview colors from theme tokens
 */
function extractPreviewColors(tokens: CanonicalThemeFlavor['tokens']): ThemeColors {
  return {
    bg: tokens.background.base,
    surface: tokens.background.surface,
    accent: tokens.brand.primary,
    text: tokens.text.primary,
  };
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Maps a canonical theme flavor to UI-specific format
 */
export function mapFlavorToUI(flavor: CanonicalThemeFlavor): ThemeFlavor {
  const family = getFamily(flavor.vendor);
  return {
    id: flavor.id,
    name: flavor.label,
    description: getDescriptionForFlavor(flavor.id, flavor.label),
    cssFile: `assets/css/themes/turbo/${flavor.id}.css`,
    icon: getIconForVendor(flavor.vendor, flavor.appearance),
    family,
    vendor: flavor.vendor,
    appearance: flavor.appearance,
    colors: extractPreviewColors(flavor.tokens),
  };
}
