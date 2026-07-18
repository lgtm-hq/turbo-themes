// SPDX-License-Identifier: MIT
// AUTO-GENERATED FILE - DO NOT EDIT DIRECTLY
// Generated from: packages/core/src/themes/tokens.json
// Generator: scripts/codegen/generate-theme-ids.mjs
// Run: bun run generate:types:ts

/**
 * All theme IDs as a readonly tuple, mirroring the order of `themeIds` in
 * `../tokens/index.ts`. Used to derive the {@link ThemeId} literal union.
 */
export const THEME_IDS = [
  'bulma-dark',
  'bulma-light',
  'catppuccin-frappe',
  'catppuccin-latte',
  'catppuccin-macchiato',
  'catppuccin-mocha',
  'dracula',
  'github-dark',
  'github-light',
  'gruvbox-dark-hard',
  'gruvbox-dark-soft',
  'gruvbox-dark',
  'gruvbox-light-hard',
  'gruvbox-light-soft',
  'gruvbox-light',
  'nord',
  'one-dark',
  'one-light',
  'rose-pine-dawn',
  'rose-pine-moon',
  'rose-pine',
  'solarized-dark',
  'solarized-light',
  'terminal',
  'tokyo-night-dark',
  'tokyo-night-light',
  'tokyo-night-storm',
] as const;

/** Union of every valid theme identifier. */
export type ThemeId = (typeof THEME_IDS)[number];
