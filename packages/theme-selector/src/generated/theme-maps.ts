// SPDX-License-Identifier: MIT
// AUTO-GENERATED FILE - DO NOT EDIT DIRECTLY
// Generated from: schema/tokens/themes/*.tokens.json + schema/tokens/_vendors.json
// Generator: scripts/codegen/generate-metadata.mjs
// Run: bun run generate:metadata

/** Theme family identifiers (one per vendor). */
export type ThemeFamily =
  | 'catppuccin'
  | 'dracula'
  | 'everforest'
  | 'gruvbox'
  | 'github'
  | 'bulma'
  | 'nord'
  | 'radix'
  | 'solarized'
  | 'rose-pine'
  | 'tokyo-night'
  | 'one-dark'
  | 'turbo';

export interface ThemeFamilyMeta {
  name: string;
  description: string;
}

/** Family display metadata keyed by ThemeFamily. */
export const THEME_FAMILIES: Record<ThemeFamily, ThemeFamilyMeta> = {
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
};

/**
 * Fallback family when a vendor is missing from {@link VENDOR_FAMILY_MAP}.
 * First entry in schema/tokens/_vendors.json (display order).
 */
export const DEFAULT_FAMILY: ThemeFamily = 'catppuccin';

/** Vendor to family mapping. */
export const VENDOR_FAMILY_MAP: Record<string, ThemeFamily> = {
  "catppuccin": "catppuccin",
  "dracula": "dracula",
  "everforest": "everforest",
  "gruvbox": "gruvbox",
  "github": "github",
  "bulma": "bulma",
  "nord": "nord",
  "radix": "radix",
  "solarized": "solarized",
  "rose-pine": "rose-pine",
  "tokyo-night": "tokyo-night",
  "one-dark": "one-dark",
  "turbo": "turbo"
};

/** Icon configuration - string for single icon, object for appearance-specific. */
export interface AppearanceIcons {
  light: string;
  dark: string;
}

/** Vendor icon paths relative to the published package root (assets/img/...). */
export const VENDOR_ICON_MAP: Record<string, string | AppearanceIcons> = {
  "catppuccin": {
    "light": "assets/img/catppuccin-logo-latte.png",
    "dark": "assets/img/catppuccin-logo-macchiato.png"
  },
  "dracula": "assets/img/dracula-logo.png",
  "everforest": {
    "light": "assets/img/everforest-light.png",
    "dark": "assets/img/everforest-dark.png"
  },
  "gruvbox": {
    "light": "assets/img/gruvbox-light.png",
    "dark": "assets/img/gruvbox-dark.png"
  },
  "github": {
    "light": "assets/img/github-logo-light.png",
    "dark": "assets/img/github-logo-dark.png"
  },
  "bulma": "assets/img/turbo-themes-logo.png",
  "nord": "assets/img/nord.png",
  "radix": {
    "light": "assets/img/radix-slate-light.png",
    "dark": "assets/img/radix-slate-dark.png"
  },
  "solarized": {
    "light": "assets/img/solarized-light.png",
    "dark": "assets/img/solarized-dark.png"
  },
  "rose-pine": {
    "light": "assets/img/rose-pine-dawn.png",
    "dark": "assets/img/rose-pine.png"
  },
  "tokyo-night": "assets/img/tokyo-night.png",
  "one-dark": {
    "light": "assets/img/one-light.png",
    "dark": "assets/img/one-dark.png"
  },
  "turbo": "assets/img/terminal.png"
};

/** Predefined flavor descriptions keyed by theme id. */
export const FLAVOR_DESCRIPTIONS: Record<string, string> = {
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
};
