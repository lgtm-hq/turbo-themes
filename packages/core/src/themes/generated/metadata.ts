// SPDX-License-Identifier: MIT
// AUTO-GENERATED FILE - DO NOT EDIT DIRECTLY
// Generated from: schema/tokens/themes/*.tokens.json + schema/tokens/_vendors.json
// Generator: scripts/codegen/generate-metadata.mjs
// Run: bun run generate:metadata

/**
 * All theme IDs as a readonly tuple (sorted by token filename).
 * Used to derive the {@link ThemeId} literal union.
 */
export const THEME_IDS = [
  'bulma-dark',
  'bulma-light',
  'catppuccin-frappe',
  'catppuccin-latte',
  'catppuccin-macchiato',
  'catppuccin-mocha',
  'dracula',
  'everforest-dark-hard',
  'everforest-dark-soft',
  'everforest-dark',
  'everforest-light-hard',
  'everforest-light-soft',
  'everforest-light',
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
  'radix-mauve-dark',
  'radix-mauve-light',
  'radix-slate-dark',
  'radix-slate-light',
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

/**
 * Ordered list of vendor IDs controlling display order in dropdowns.
 * Source: schema/tokens/_vendors.json
 */
export const VENDOR_ORDER = [
  'catppuccin',
  'dracula',
  'everforest',
  'gruvbox',
  'github',
  'bulma',
  'nord',
  'radix',
  'solarized',
  'rose-pine',
  'tokyo-night',
  'one-dark',
  'turbo',
] as const;

/** Union of every vendor identifier. */
export type VendorId = (typeof VENDOR_ORDER)[number];

/** Per-theme human-readable descriptions for UI pickers. */
export const THEME_DESCRIPTIONS = {
  "bulma-dark": "Dark Bulma theme tuned for low-light reading.",
  "bulma-light": "Classic Bulma look with a bright, neutral palette.",
  "catppuccin-frappe": "Balanced dark Catppuccin theme for focused work.",
  "catppuccin-latte": "Light, soft Catppuccin palette for daytime use.",
  "catppuccin-macchiato": "Deep, atmospheric Catppuccin variant with rich contrast.",
  "catppuccin-mocha": "Cozy, high-contrast Catppuccin theme for late-night sessions.",
  "dracula": "Iconic Dracula dark theme with vibrant accents.",
  "everforest-dark-hard": "Highest contrast dark Everforest palette with deep forest shadows.",
  "everforest-dark-soft": "Softer dark Everforest palette with reduced contrast.",
  "everforest-dark": "Classic Everforest dark palette with warm, natural greens.",
  "everforest-light-hard": "Bright, crisp Everforest light palette with extra contrast.",
  "everforest-light-soft": "Soft, low-contrast Everforest light palette for long sessions.",
  "everforest-light": "Classic Everforest light palette with warm paper tones.",
  "github-dark": "GitHub dark theme optimized for code-heavy views.",
  "github-light": "GitHub-inspired light theme suited for documentation and UI heavy pages.",
  "gruvbox-dark-hard": "Highest contrast dark Gruvbox palette with deep shadows.",
  "gruvbox-dark-soft": "Softer dark Gruvbox palette with reduced contrast.",
  "gruvbox-dark": "Classic Gruvbox dark palette with warm, muted tones.",
  "gruvbox-light-hard": "Bright, crisp Gruvbox light palette with extra contrast.",
  "gruvbox-light-soft": "Soft, low-contrast Gruvbox light palette for long sessions.",
  "gruvbox-light": "Classic Gruvbox light palette with warm paper tones.",
  "nord": "Arctic, north-bluish color palette inspired by the polar night.",
  "one-dark": "The classic Atom One Dark palette with vivid syntax accents.",
  "one-light": "Companion One Light palette for bright, daytime editing.",
  "radix-mauve-dark": "Neutral purple-gray Radix dark theme for accessible UIs.",
  "radix-mauve-light": "Neutral purple-gray Radix light theme for accessible UIs.",
  "radix-slate-dark": "Neutral blue-gray Radix dark theme for accessible UIs.",
  "radix-slate-light": "Neutral blue-gray Radix light theme for accessible UIs.",
  "rose-pine-dawn": "Light Rosé Pine variant for daytime use.",
  "rose-pine-moon": "Deeper variant of Rosé Pine with enhanced contrast.",
  "rose-pine": "Elegant dark theme with natural pine and soho vibes.",
  "solarized-dark": "Solarized Dark with a balanced, low-contrast palette.",
  "solarized-light": "Solarized Light tuned for bright, daylight-friendly UIs.",
  "terminal": "CRT phosphor green on void with IBM Plex Mono.",
  "tokyo-night-dark": "Deep midnight blues with neon accents.",
  "tokyo-night-light": "Clean daylight palette inspired by Tokyo mornings.",
  "tokyo-night-storm": "Stormy variant with richer contrast and depth."
} as const satisfies Record<
  ThemeId,
  string
>;

/** Per-theme icon filenames relative to assets/img/. */
export const THEME_ICONS = {
  "bulma-dark": "bulma-logo-dark.png",
  "bulma-light": "bulma-logo.png",
  "catppuccin-frappe": "catppuccin-logo-macchiato.png",
  "catppuccin-latte": "catppuccin-logo-latte.png",
  "catppuccin-macchiato": "catppuccin-logo-macchiato.png",
  "catppuccin-mocha": "catppuccin-logo-macchiato.png",
  "dracula": "dracula-logo.png",
  "everforest-dark-hard": "everforest-dark-hard.png",
  "everforest-dark-soft": "everforest-dark-soft.png",
  "everforest-dark": "everforest-dark.png",
  "everforest-light-hard": "everforest-light-hard.png",
  "everforest-light-soft": "everforest-light-soft.png",
  "everforest-light": "everforest-light.png",
  "github-dark": "github-logo-dark.png",
  "github-light": "github-logo-light.png",
  "gruvbox-dark-hard": "gruvbox-dark-hard.png",
  "gruvbox-dark-soft": "gruvbox-dark-soft.png",
  "gruvbox-dark": "gruvbox-dark.png",
  "gruvbox-light-hard": "gruvbox-light-hard.png",
  "gruvbox-light-soft": "gruvbox-light-soft.png",
  "gruvbox-light": "gruvbox-light.png",
  "nord": "nord.png",
  "one-dark": "one-dark.png",
  "one-light": "one-light.png",
  "radix-mauve-dark": "radix-slate-dark.png",
  "radix-mauve-light": "radix-slate-light.png",
  "radix-slate-dark": "radix-slate-dark.png",
  "radix-slate-light": "radix-slate-light.png",
  "rose-pine-dawn": "rose-pine.png",
  "rose-pine-moon": "rose-pine.png",
  "rose-pine": "rose-pine.png",
  "solarized-dark": "solarized-dark.png",
  "solarized-light": "solarized-light.png",
  "terminal": "terminal.png",
  "tokyo-night-dark": "tokyo-night.png",
  "tokyo-night-light": "tokyo-night.png",
  "tokyo-night-storm": "tokyo-night.png"
} as const satisfies Record<ThemeId, string>;

/** Per-vendor default icons (filename or light/dark pair). */
export const VENDOR_ICONS = {
  "catppuccin": {
    "light": "catppuccin-logo-latte.png",
    "dark": "catppuccin-logo-macchiato.png"
  },
  "dracula": "dracula-logo.png",
  "everforest": {
    "light": "everforest-light.png",
    "dark": "everforest-dark.png"
  },
  "gruvbox": {
    "light": "gruvbox-light.png",
    "dark": "gruvbox-dark.png"
  },
  "github": {
    "light": "github-logo-light.png",
    "dark": "github-logo-dark.png"
  },
  "bulma": {
    "light": "bulma-logo.png",
    "dark": "bulma-logo-dark.png"
  },
  "nord": "nord.png",
  "radix": {
    "light": "radix-slate-light.png",
    "dark": "radix-slate-dark.png"
  },
  "solarized": {
    "light": "solarized-light.png",
    "dark": "solarized-dark.png"
  },
  "rose-pine": "rose-pine.png",
  "tokyo-night": "tokyo-night.png",
  "one-dark": {
    "light": "one-light.png",
    "dark": "one-dark.png"
  },
  "turbo": "terminal.png"
} as const;

/** Per-vendor family display metadata. */
export const VENDOR_FAMILY_META = {
  "catppuccin": {
    "name": "Catppuccin",
    "description": "Soothing pastel themes"
  },
  "dracula": {
    "name": "Dracula",
    "description": "Dark vampire aesthetic"
  },
  "everforest": {
    "name": "Everforest",
    "description": "Green-based, nature-inspired palette designed for eye comfort"
  },
  "gruvbox": {
    "name": "Gruvbox",
    "description": "Retro groove palette with warm, earthy tones"
  },
  "github": {
    "name": "GitHub",
    "description": "GitHub-inspired themes"
  },
  "bulma": {
    "name": "Bulma",
    "description": "Classic Bulma themes"
  },
  "nord": {
    "name": "Nord",
    "description": "Arctic, north-bluish color palette"
  },
  "radix": {
    "name": "Radix Colors",
    "description": "Accessibility-focused color system with comprehensive scales"
  },
  "solarized": {
    "name": "Solarized",
    "description": "Precision-balanced light and dark modes"
  },
  "rose-pine": {
    "name": "Rosé Pine",
    "description": "All natural pine, faux fur and a bit of soho vibes"
  },
  "tokyo-night": {
    "name": "Tokyo Night",
    "description": "Neon-infused nightscape with crisp contrast"
  },
  "one-dark": {
    "name": "One",
    "description": "The iconic Atom editor palette in dark and light"
  },
  "turbo": {
    "name": "Terminal",
    "description": "CRT phosphor green on void"
  }
} as const satisfies Record<
  VendorId,
  { name: string; description: string }
>;
