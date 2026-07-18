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
  'github-dark',
  'github-light',
  'gruvbox-dark-hard',
  'gruvbox-dark-soft',
  'gruvbox-dark',
  'gruvbox-light-hard',
  'gruvbox-light-soft',
  'gruvbox-light',
  'nord',
  'rose-pine-dawn',
  'rose-pine-moon',
  'rose-pine',
  'solarized-dark',
  'solarized-light',
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
  'gruvbox',
  'github',
  'bulma',
  'nord',
  'solarized',
  'rose-pine',
  'tokyo-night',
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
  "github-dark": "GitHub dark theme optimized for code-heavy views.",
  "github-light": "GitHub-inspired light theme suited for documentation and UI heavy pages.",
  "gruvbox-dark-hard": "Highest contrast dark Gruvbox palette with deep shadows.",
  "gruvbox-dark-soft": "Softer dark Gruvbox palette with reduced contrast.",
  "gruvbox-dark": "Classic Gruvbox dark palette with warm, muted tones.",
  "gruvbox-light-hard": "Bright, crisp Gruvbox light palette with extra contrast.",
  "gruvbox-light-soft": "Soft, low-contrast Gruvbox light palette for long sessions.",
  "gruvbox-light": "Classic Gruvbox light palette with warm paper tones.",
  "nord": "Arctic, north-bluish color palette inspired by the polar night.",
  "rose-pine-dawn": "Light Rosé Pine variant for daytime use.",
  "rose-pine-moon": "Deeper variant of Rosé Pine with enhanced contrast.",
  "rose-pine": "Elegant dark theme with natural pine and soho vibes.",
  "solarized-dark": "Solarized Dark with a balanced, low-contrast palette.",
  "solarized-light": "Solarized Light tuned for bright, daylight-friendly UIs.",
  "tokyo-night-dark": "Deep midnight blues with neon accents.",
  "tokyo-night-light": "Clean daylight palette inspired by Tokyo mornings.",
  "tokyo-night-storm": "Stormy variant with richer contrast and depth."
} as const satisfies Record<
  ThemeId,
  string
>;

/** Per-theme icon filenames relative to assets/img/. */
export const THEME_ICONS = {
  "bulma-dark": "turbo-themes-logo.png",
  "bulma-light": "turbo-themes-logo.png",
  "catppuccin-frappe": "catppuccin-logo-macchiato.png",
  "catppuccin-latte": "catppuccin-logo-latte.png",
  "catppuccin-macchiato": "catppuccin-logo-macchiato.png",
  "catppuccin-mocha": "catppuccin-logo-macchiato.png",
  "dracula": "dracula-logo.png",
  "github-dark": "github-logo-dark.png",
  "github-light": "github-logo-light.png",
  "gruvbox-dark-hard": "gruvbox-dark-hard.png",
  "gruvbox-dark-soft": "gruvbox-dark-soft.png",
  "gruvbox-dark": "gruvbox-dark.png",
  "gruvbox-light-hard": "gruvbox-light-hard.png",
  "gruvbox-light-soft": "gruvbox-light-soft.png",
  "gruvbox-light": "gruvbox-light.png",
  "nord": "nord.png",
  "rose-pine-dawn": "rose-pine-dawn.png",
  "rose-pine-moon": "rose-pine-moon.png",
  "rose-pine": "rose-pine.png",
  "solarized-dark": "solarized-dark.png",
  "solarized-light": "solarized-light.png",
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
  "gruvbox": {
    "light": "gruvbox-light.png",
    "dark": "gruvbox-dark.png"
  },
  "github": {
    "light": "github-logo-light.png",
    "dark": "github-logo-dark.png"
  },
  "bulma": "turbo-themes-logo.png",
  "nord": "nord.png",
  "solarized": {
    "light": "solarized-light.png",
    "dark": "solarized-dark.png"
  },
  "rose-pine": {
    "light": "rose-pine-dawn.png",
    "dark": "rose-pine.png"
  },
  "tokyo-night": "tokyo-night.png"
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
  }
} as const satisfies Record<
  VendorId,
  { name: string; description: string }
>;
