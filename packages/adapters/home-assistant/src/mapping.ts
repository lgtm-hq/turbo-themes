// SPDX-License-Identifier: MIT
/**
 * Token → Home Assistant theme variable mapping.
 *
 * Home Assistant themes are a flat set of CSS custom properties (declared without
 * the leading `--`). This module maps the platform-agnostic Turbo tokens onto the
 * Home Assistant frontend variables, producing concrete hex / `R, G, B` values so
 * the generated artifact is self-contained and deterministic.
 */

import type { ThemeTokens } from '@lgtm-hq/turbo-themes-core/themes/types';
import { hexToRgbTriplet } from './color.js';

/**
 * Fixed card-mod hook value. This is an inert marker unless the optional
 * `card-mod` custom component is installed; it never affects core Home Assistant.
 */
export const CARD_MOD_THEME = 'turbo-themes';

/**
 * Every Home Assistant variable key emitted per theme, in deterministic order.
 *
 * The emitter walks this list to serialize each theme, and
 * {@link mapTokensToHomeAssistant} produces a record whose keys match this list
 * exactly (verified in tests).
 */
export const REQUIRED_KEYS: readonly string[] = [
  // Core palette
  'primary-color',
  'accent-color',
  'dark-primary-color',
  'light-primary-color',
  'primary-background-color',
  'secondary-background-color',
  'card-background-color',
  'dialog-background-color',
  'primary-text-color',
  'secondary-text-color',
  'text-primary-color',
  'disabled-text-color',
  'divider-color',
  'border-color',
  // App header
  'app-header-background-color',
  'app-header-text-color',
  'app-header-selection-bar-color',
  // Sidebar
  'sidebar-background-color',
  'sidebar-text-color',
  'sidebar-icon-color',
  'sidebar-selected-text-color',
  'sidebar-selected-icon-color',
  'sidebar-selected-background-color',
  // Switches
  'switch-checked-color',
  'switch-checked-button-color',
  'switch-unchecked-button-color',
  'switch-unchecked-color',
  // Sliders
  'slider-color',
  'slider-secondary-color',
  // Paper items
  'paper-item-icon-color',
  'paper-item-icon-active-color',
  // Inputs (legacy paper / ha-form)
  'input-fill-color',
  'input-ink-color',
  'input-label-ink-color',
  'input-disabled-fill-color',
  'input-disabled-ink-color',
  'input-idle-line-color',
  'input-hover-line-color',
  // Material selects / text fields (ha-select, ha-textfield / MWC)
  'mdc-select-fill-color',
  'mdc-select-ink-color',
  'mdc-select-label-ink-color',
  'mdc-select-dropdown-icon-color',
  'mdc-select-idle-line-color',
  'mdc-select-hover-line-color',
  'mdc-text-field-fill-color',
  'mdc-text-field-ink-color',
  'mdc-text-field-label-ink-color',
  'mdc-text-field-idle-line-color',
  'mdc-text-field-hover-line-color',
  // Tables
  'table-row-background-color',
  'table-row-alternative-background-color',
  // State colors
  'info-color',
  'success-color',
  'warning-color',
  'error-color',
  'state-icon-color',
  'state-icon-active-color',
  // Lovelace / cards
  'lovelace-background',
  'ha-card-background',
  'ha-card-border-color',
  // rgb-* triplets
  'rgb-primary-color',
  'rgb-accent-color',
  'rgb-card-background-color',
  'rgb-primary-text-color',
  'rgb-secondary-text-color',
  'rgb-text-primary-color',
  'rgb-info-color',
  'rgb-success-color',
  'rgb-warning-color',
  'rgb-error-color',
  // Material Design Components theme
  'mdc-theme-primary',
  'mdc-theme-secondary',
  'mdc-theme-background',
  'mdc-theme-surface',
  'mdc-theme-on-primary',
  'mdc-theme-on-secondary',
  'mdc-theme-on-surface',
  'mdc-theme-on-background',
  'mdc-theme-text-primary-on-background',
  'mdc-theme-error',
  // Code editor (CodeMirror)
  'codemirror-keyword',
  'codemirror-operator',
  'codemirror-variable',
  'codemirror-variable-2',
  'codemirror-builtin',
  'codemirror-atom',
  'codemirror-number',
  'codemirror-def',
  'codemirror-string',
  'codemirror-comment',
  'codemirror-property',
  'codemirror-attribute',
  // Energy dashboard
  'energy-grid-consumption-color',
  'energy-grid-return-color',
  'energy-solar-color',
  'energy-non-fossil-color',
  'energy-battery-out-color',
  'energy-battery-in-color',
  'energy-gas-color',
  'energy-water-color',
  // Alarm panel
  'alarm-color-armed',
  'alarm-color-disarmed',
  'alarm-color-pending',
  'alarm-color-triggered',
  // card-mod inert hook
  'card-mod-theme',
] as const;

/**
 * Map a single theme's tokens onto Home Assistant frontend variables.
 *
 * All color values are concrete hex strings (no CSS `var()` references), and the
 * `rgb-*` family is emitted as bare `"R, G, B"` triplets as Home Assistant expects.
 *
 * @param tokens - The platform-agnostic Turbo theme tokens.
 * @returns A record of Home Assistant variable name → value, ordered to match
 *   {@link REQUIRED_KEYS}.
 */
export function mapTokensToHomeAssistant(tokens: ThemeTokens): Record<string, string> {
  const { background, text, brand, accent, state, border } = tokens;

  return {
    // Core palette
    'primary-color': brand.primary,
    'accent-color': accent.link,
    'dark-primary-color': brand.primary,
    'light-primary-color': brand.primary,
    'primary-background-color': background.base,
    'secondary-background-color': background.overlay,
    'card-background-color': background.surface,
    'dialog-background-color': background.surface,
    'primary-text-color': text.primary,
    'secondary-text-color': text.secondary,
    'text-primary-color': text.inverse,
    'disabled-text-color': text.secondary,
    'divider-color': border.default,
    'border-color': border.default,
    // App header
    'app-header-background-color': background.surface,
    'app-header-text-color': text.primary,
    'app-header-selection-bar-color': brand.primary,
    // Sidebar
    'sidebar-background-color': background.base,
    'sidebar-text-color': text.primary,
    'sidebar-icon-color': text.secondary,
    'sidebar-selected-text-color': brand.primary,
    'sidebar-selected-icon-color': brand.primary,
    'sidebar-selected-background-color': background.surface,
    // Switches
    'switch-checked-color': brand.primary,
    'switch-checked-button-color': brand.primary,
    'switch-unchecked-button-color': text.secondary,
    'switch-unchecked-color': border.default,
    // Sliders
    'slider-color': brand.primary,
    'slider-secondary-color': border.default,
    // Paper items
    'paper-item-icon-color': text.secondary,
    'paper-item-icon-active-color': brand.primary,
    // Inputs (legacy paper / ha-form)
    'input-fill-color': background.surface,
    'input-ink-color': text.primary,
    'input-label-ink-color': text.secondary,
    'input-disabled-fill-color': background.overlay,
    'input-disabled-ink-color': text.secondary,
    'input-idle-line-color': border.default,
    'input-hover-line-color': brand.primary,
    // Material selects / text fields (ha-select, ha-textfield / MWC)
    'mdc-select-fill-color': background.surface,
    'mdc-select-ink-color': text.primary,
    'mdc-select-label-ink-color': text.secondary,
    'mdc-select-dropdown-icon-color': text.secondary,
    'mdc-select-idle-line-color': border.default,
    'mdc-select-hover-line-color': brand.primary,
    'mdc-text-field-fill-color': background.surface,
    'mdc-text-field-ink-color': text.primary,
    'mdc-text-field-label-ink-color': text.secondary,
    'mdc-text-field-idle-line-color': border.default,
    'mdc-text-field-hover-line-color': brand.primary,
    // Tables
    'table-row-background-color': background.surface,
    'table-row-alternative-background-color': background.overlay,
    // State colors
    'info-color': state.info,
    'success-color': state.success,
    'warning-color': state.warning,
    'error-color': state.danger,
    'state-icon-color': text.secondary,
    'state-icon-active-color': brand.primary,
    // Lovelace / cards
    'lovelace-background': background.base,
    'ha-card-background': background.surface,
    'ha-card-border-color': border.default,
    // rgb-* triplets
    'rgb-primary-color': hexToRgbTriplet(brand.primary),
    'rgb-accent-color': hexToRgbTriplet(accent.link),
    'rgb-card-background-color': hexToRgbTriplet(background.surface),
    'rgb-primary-text-color': hexToRgbTriplet(text.primary),
    'rgb-secondary-text-color': hexToRgbTriplet(text.secondary),
    'rgb-text-primary-color': hexToRgbTriplet(text.inverse),
    'rgb-info-color': hexToRgbTriplet(state.info),
    'rgb-success-color': hexToRgbTriplet(state.success),
    'rgb-warning-color': hexToRgbTriplet(state.warning),
    'rgb-error-color': hexToRgbTriplet(state.danger),
    // Material Design Components theme
    'mdc-theme-primary': brand.primary,
    'mdc-theme-secondary': accent.link,
    'mdc-theme-background': background.base,
    'mdc-theme-surface': background.surface,
    'mdc-theme-on-primary': text.inverse,
    'mdc-theme-on-secondary': text.inverse,
    'mdc-theme-on-surface': text.primary,
    'mdc-theme-on-background': text.primary,
    'mdc-theme-text-primary-on-background': text.primary,
    'mdc-theme-error': state.danger,
    // Code editor (CodeMirror)
    'codemirror-keyword': brand.primary,
    'codemirror-operator': accent.link,
    'codemirror-variable': text.primary,
    'codemirror-variable-2': text.secondary,
    'codemirror-builtin': state.danger,
    'codemirror-atom': state.danger,
    'codemirror-number': state.warning,
    'codemirror-def': text.primary,
    'codemirror-string': state.success,
    'codemirror-comment': text.secondary,
    'codemirror-property': accent.link,
    'codemirror-attribute': state.warning,
    // Energy dashboard
    'energy-grid-consumption-color': brand.primary,
    'energy-grid-return-color': accent.link,
    'energy-solar-color': state.warning,
    'energy-non-fossil-color': state.success,
    'energy-battery-out-color': state.info,
    'energy-battery-in-color': brand.primary,
    'energy-gas-color': state.danger,
    'energy-water-color': state.info,
    // Alarm panel
    'alarm-color-armed': state.danger,
    'alarm-color-disarmed': state.success,
    'alarm-color-pending': state.warning,
    'alarm-color-triggered': state.danger,
    // card-mod inert hook
    'card-mod-theme': CARD_MOD_THEME,
  };
}
