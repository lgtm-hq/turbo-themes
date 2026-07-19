// SPDX-License-Identifier: MIT
/**
 * Home Assistant theme adapter for Turbo Themes.
 *
 * Emits a single Home Assistant `themes.yaml`-compatible YAML string that maps
 * Turbo theme tokens onto Home Assistant frontend theme variables. Every value is
 * a concrete hex color or `R, G, B` triplet, so the artifact is self-contained.
 *
 * @packageDocumentation
 */

export { hexToRgb, hexToRgbTriplet } from './color.js';
export { CARD_MOD_THEME, mapTokensToHomeAssistant, REQUIRED_KEYS } from './mapping.js';
export {
  AUTO_THEME_PAIRINGS,
  assertPairingsValid,
  resolveAutoTheme,
  type AutoThemePairing,
  type ResolvedAutoTheme,
} from './pairings.js';
export { generateHomeAssistantThemes } from './emitter.js';
