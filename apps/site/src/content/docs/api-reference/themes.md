---
title: Theme Definitions
description: Complete reference for all 30 Turbo Themes color schemes.
category: api-reference
order: 4
prev: api-reference/tokens
next: api-reference/javascript-api
---

# Theme Definitions

Turbo Themes includes 30 color schemes across 10 vendor families. The canonical list is
always available at runtime:

```typescript
import { themeIds } from '@lgtm-hq/turbo-themes';
// → readonly string[] of all 30 theme IDs, sorted by vendor then variant
```

## Theme Overview

| Theme                  | Vendor      | Appearance | ID                       |
| ---------------------- | ----------- | ---------- | ------------------------ |
| Catppuccin Mocha       | Catppuccin  | Dark       | `catppuccin-mocha`       |
| Catppuccin Macchiato   | Catppuccin  | Dark       | `catppuccin-macchiato`   |
| Catppuccin Frappé      | Catppuccin  | Dark       | `catppuccin-frappe`      |
| Catppuccin Latte       | Catppuccin  | Light      | `catppuccin-latte`       |
| Dracula                | Dracula     | Dark       | `dracula`                |
| Everforest Dark Hard   | Everforest  | Dark       | `everforest-dark-hard`   |
| Everforest Dark        | Everforest  | Dark       | `everforest-dark`        |
| Everforest Dark Soft   | Everforest  | Dark       | `everforest-dark-soft`   |
| Everforest Light Hard  | Everforest  | Light      | `everforest-light-hard`  |
| Everforest Light       | Everforest  | Light      | `everforest-light`       |
| Everforest Light Soft  | Everforest  | Light      | `everforest-light-soft`  |
| Gruvbox Dark Hard      | Gruvbox     | Dark       | `gruvbox-dark-hard`      |
| Gruvbox Dark           | Gruvbox     | Dark       | `gruvbox-dark`           |
| Gruvbox Dark Soft      | Gruvbox     | Dark       | `gruvbox-dark-soft`      |
| Gruvbox Light Hard     | Gruvbox     | Light      | `gruvbox-light-hard`     |
| Gruvbox Light          | Gruvbox     | Light      | `gruvbox-light`          |
| Gruvbox Light Soft     | Gruvbox     | Light      | `gruvbox-light-soft`     |
| GitHub Dark            | GitHub      | Dark       | `github-dark`            |
| GitHub Light           | GitHub      | Light      | `github-light`           |
| Bulma Dark             | Bulma       | Dark       | `bulma-dark`             |
| Bulma Light            | Bulma       | Light      | `bulma-light`            |
| Nord                   | Nord        | Dark       | `nord`                   |
| Rosé Pine              | Rosé Pine   | Dark       | `rose-pine`              |
| Rosé Pine Moon         | Rosé Pine   | Dark       | `rose-pine-moon`         |
| Rosé Pine Dawn         | Rosé Pine   | Light      | `rose-pine-dawn`         |
| Solarized Dark         | Solarized   | Dark       | `solarized-dark`         |
| Solarized Light        | Solarized   | Light      | `solarized-light`        |
| Tokyo Night Dark       | Tokyo Night | Dark       | `tokyo-night-dark`       |
| Tokyo Night Storm      | Tokyo Night | Dark       | `tokyo-night-storm`      |
| Tokyo Night Light      | Tokyo Night | Light      | `tokyo-night-light`      |

## Curating a theme subset

Use existing utility exports to build your catalog programmatically:

```typescript
import {
  themeIds,
  flavors,
  getThemesByVendor,
  getThemesByAppearance,
} from '@lgtm-hq/turbo-themes';

// All 30 themes
const all = themeIds;

// Vendor opt-in
const catppuccin = getThemesByVendor('catppuccin').map((f) => f.id);
const github = getThemesByVendor('github').map((f) => f.id);

// Appearance filter
const darkOnly = getThemesByAppearance('dark').map((f) => f.id);
const lightOnly = getThemesByAppearance('light').map((f) => f.id);

// Hardcoded minimal set (copy-paste friendly)
const minimal = [
  'catppuccin-mocha',
  'catppuccin-latte',
  'dracula',
  'github-dark',
  'github-light',
];
```

> **Planned (#495):** `themeSets` (pre-defined named subsets) and `createThemeCatalog()`
> (vendor + appearance filter in one call) will ship as part of issue #495.

## Catppuccin Themes

[Catppuccin](https://catppuccin.com/) is a soothing pastel theme with warm, harmonious
colors.

### Catppuccin Mocha (Dark)

The darkest Catppuccin variant with a cozy, warm feel.

| Token              | Value     |
| ------------------ | --------- |
| Background Base    | `#1e1e2e` |
| Background Surface | `#313244` |
| Background Overlay | `#45475a` |
| Text Primary       | `#cdd6f4` |
| Text Secondary     | `#a6adc8` |
| Brand Primary      | `#89b4fa` |
| State Success      | `#a6e3a1` |
| State Warning      | `#f9e2af` |
| State Danger       | `#f38ba8` |
| State Info         | `#89dceb` |

### Catppuccin Macchiato (Dark)

A balanced dark theme, not too dark, not too light.

| Token              | Value     |
| ------------------ | --------- |
| Background Base    | `#24273a` |
| Background Surface | `#363a4f` |
| Background Overlay | `#494d64` |
| Text Primary       | `#cad3f5` |
| Text Secondary     | `#a5adcb` |
| Brand Primary      | `#8aadf4` |
| State Success      | `#a6da95` |
| State Warning      | `#eed49f` |
| State Danger       | `#ed8796` |
| State Info         | `#91d7e3` |

### Catppuccin Frappé (Dark)

A softer dark theme with lighter tones.

| Token              | Value     |
| ------------------ | --------- |
| Background Base    | `#303446` |
| Background Surface | `#414559` |
| Background Overlay | `#51576d` |
| Text Primary       | `#c6d0f5` |
| Text Secondary     | `#a5adce` |
| Brand Primary      | `#8caaee` |
| State Success      | `#a6d189` |
| State Warning      | `#e5c890` |
| State Danger       | `#e78284` |
| State Info         | `#99d1db` |

### Catppuccin Latte (Light)

A warm, creamy light theme.

| Token              | Value     |
| ------------------ | --------- |
| Background Base    | `#eff1f5` |
| Background Surface | `#e6e9ef` |
| Background Overlay | `#dce0e8` |
| Text Primary       | `#4c4f69` |
| Text Secondary     | `#6c6f85` |
| Brand Primary      | `#1e66f5` |
| State Success      | `#40a02b` |
| State Warning      | `#df8e1d` |
| State Danger       | `#d20f39` |
| State Info         | `#04a5e5` |

## Dracula Theme

[Dracula](https://draculatheme.com/) is a classic dark theme with vibrant accent colors.

### Dracula (Dark)

| Token              | Value     |
| ------------------ | --------- |
| Background Base    | `#282a36` |
| Background Surface | `#44475a` |
| Background Overlay | `#6272a4` |
| Text Primary       | `#f8f8f2` |
| Text Secondary     | `#6272a4` |
| Brand Primary      | `#bd93f9` |
| State Success      | `#50fa7b` |
| State Warning      | `#ffb86c` |
| State Danger       | `#ff5555` |
| State Info         | `#8be9fd` |

## Everforest Themes

[Everforest](https://github.com/sainnhe/everforest) is a green-based, nature-inspired
color scheme designed to be warm and soft on the eyes.

### Everforest Dark (Medium)

The default dark Everforest variant with balanced contrast.

| Token              | Value     |
| ------------------ | --------- |
| Background Base    | `#2D353B` |
| Background Surface | `#343F44` |
| Background Overlay | `#3D484D` |
| Text Primary       | `#D3C6AA` |
| Brand Primary      | `#A7C080` |

### Everforest Light (Medium)

The default light Everforest variant with warm paper tones.

| Token              | Value     |
| ------------------ | --------- |
| Background Base    | `#FDF6E3` |
| Background Surface | `#F4F0D9` |
| Background Overlay | `#E6E2CC` |
| Text Primary       | `#5C6A72` |
| Brand Primary      | `#6B7C01` |

## Gruvbox Themes

[Gruvbox](https://github.com/morhetz/gruvbox) is a retro groove color scheme with warm
earthy tones.

### Gruvbox Dark Hard / Dark / Dark Soft

Three contrast levels of the dark variant.

| Token              | Hard      | Default   | Soft      |
| ------------------ | --------- | --------- | --------- |
| Background Base    | `#1d2021` | `#282828` | `#32302f` |
| Background Surface | `#282828` | `#3c3836` | `#45403d` |
| Text Primary       | `#ebdbb2` | `#ebdbb2` | `#ebdbb2` |
| Brand Primary      | `#83a598` | `#83a598` | `#83a598` |

### Gruvbox Light Hard / Light / Light Soft

Three contrast levels of the light variant.

| Token              | Hard      | Default   | Soft      |
| ------------------ | --------- | --------- | --------- |
| Background Base    | `#f9f5d7` | `#fbf1c7` | `#f2e5bc` |
| Background Surface | `#ebdbb2` | `#ebdbb2` | `#ebdbb2` |
| Text Primary       | `#3c3836` | `#3c3836` | `#3c3836` |
| Brand Primary      | `#427b58` | `#427b58` | `#427b58` |

## GitHub Themes

Inspired by GitHub's official color schemes.

### GitHub Dark

| Token              | Value     |
| ------------------ | --------- |
| Background Base    | `#0d1117` |
| Background Surface | `#161b22` |
| Background Overlay | `#21262d` |
| Text Primary       | `#c9d1d9` |
| Text Secondary     | `#8b949e` |
| Brand Primary      | `#58a6ff` |
| State Success      | `#3fb950` |
| State Warning      | `#d29922` |
| State Danger       | `#f85149` |
| State Info         | `#58a6ff` |

### GitHub Light

| Token              | Value     |
| ------------------ | --------- |
| Background Base    | `#ffffff` |
| Background Surface | `#f6f8fa` |
| Background Overlay | `#eaeef2` |
| Text Primary       | `#24292f` |
| Text Secondary     | `#57606a` |
| Brand Primary      | `#0969da` |
| State Success      | `#1a7f37` |
| State Warning      | `#9a6700` |
| State Danger       | `#cf222e` |
| State Info         | `#0969da` |

## Bulma Themes

Based on the [Bulma CSS framework](https://bulma.io/) default colors.

### Bulma Dark

| Token              | Value     |
| ------------------ | --------- |
| Background Base    | `#1a1a1a` |
| Background Surface | `#2b2b2b` |
| Background Overlay | `#363636` |
| Text Primary       | `#f5f5f5` |
| Text Secondary     | `#b5b5b5` |
| Brand Primary      | `#00d1b2` |
| State Success      | `#48c78e` |
| State Warning      | `#ffe08a` |
| State Danger       | `#f14668` |
| State Info         | `#3e8ed0` |

### Bulma Light

| Token              | Value     |
| ------------------ | --------- |
| Background Base    | `#ffffff` |
| Background Surface | `#f5f5f5` |
| Background Overlay | `#ededed` |
| Text Primary       | `#363636` |
| Text Secondary     | `#7a7a7a` |
| Brand Primary      | `#00d1b2` |
| State Success      | `#48c78e` |
| State Warning      | `#ffe08a` |
| State Danger       | `#f14668` |
| State Info         | `#3e8ed0` |

## Nord Theme

[Nord](https://www.nordtheme.com/) is an arctic, north-bluish color palette with a clean
aesthetic.

### Nord (Dark)

| Token              | Value     |
| ------------------ | --------- |
| Background Base    | `#2e3440` |
| Background Surface | `#3b4252` |
| Background Overlay | `#434c5e` |
| Text Primary       | `#eceff4` |
| Text Secondary     | `#d8dee9` |
| Brand Primary      | `#88c0d0` |
| State Success      | `#a3be8c` |
| State Warning      | `#ebcb8b` |
| State Danger       | `#bf616a` |
| State Info         | `#81a1c1` |

## Rosé Pine Themes

[Rosé Pine](https://rosepinetheme.com/) is a natural, minimal theme with warm, muted
tones.

### Rosé Pine (Dark)

| Token              | Value     |
| ------------------ | --------- |
| Background Base    | `#191724` |
| Background Surface | `#1f1d2e` |
| Background Overlay | `#26233a` |
| Text Primary       | `#e0def4` |
| Brand Primary      | `#31748f` |
| State Success      | `#9ccfd8` |
| State Danger       | `#eb6f92` |

### Rosé Pine Moon (Dark)

| Token              | Value     |
| ------------------ | --------- |
| Background Base    | `#232136` |
| Background Surface | `#2a273f` |
| Background Overlay | `#393552` |
| Text Primary       | `#e0def4` |
| Brand Primary      | `#3e8fb0` |

### Rosé Pine Dawn (Light)

| Token              | Value     |
| ------------------ | --------- |
| Background Base    | `#faf4ed` |
| Background Surface | `#fffaf3` |
| Background Overlay | `#f2e9e1` |
| Text Primary       | `#575279` |
| Brand Primary      | `#286983` |

## Solarized Themes

[Solarized](https://ethanschoonover.com/solarized/) is a precision color scheme with 16
carefully chosen colors.

### Solarized Dark

| Token              | Value     |
| ------------------ | --------- |
| Background Base    | `#002b36` |
| Background Surface | `#073642` |
| Background Overlay | `#586e75` |
| Text Primary       | `#839496` |
| Brand Primary      | `#268bd2` |
| State Success      | `#859900` |
| State Danger       | `#dc322f` |

### Solarized Light

| Token              | Value     |
| ------------------ | --------- |
| Background Base    | `#fdf6e3` |
| Background Surface | `#eee8d5` |
| Background Overlay | `#93a1a1` |
| Text Primary       | `#657b83` |
| Brand Primary      | `#268bd2` |

## Tokyo Night Themes

[Tokyo Night](https://github.com/enkia/tokyo-night-vscode-theme) is a clean, dark theme
celebrating the vibrant lights of downtown Tokyo at night.

### Tokyo Night Dark

| Token              | Value     |
| ------------------ | --------- |
| Background Base    | `#1a1b26` |
| Background Surface | `#24283b` |
| Background Overlay | `#292e42` |
| Text Primary       | `#c0caf5` |
| Brand Primary      | `#7aa2f7` |
| State Success      | `#9ece6a` |
| State Danger       | `#f7768e` |

### Tokyo Night Storm

A slightly lighter dark variant.

| Token              | Value     |
| ------------------ | --------- |
| Background Base    | `#24283b` |
| Background Surface | `#1f2335` |
| Background Overlay | `#292e42` |
| Text Primary       | `#c0caf5` |
| Brand Primary      | `#7aa2f7` |

### Tokyo Night Light

| Token              | Value     |
| ------------------ | --------- |
| Background Base    | `#d5d6db` |
| Background Surface | `#cbccd1` |
| Background Overlay | `#b9bac2` |
| Text Primary       | `#343b58` |
| Brand Primary      | `#34548a` |

## Choosing a Theme

### Starter recommendations

- **Dark, warm:** Catppuccin Mocha, Gruvbox Dark, Rosé Pine
- **Dark, vibrant:** Dracula, Tokyo Night Dark
- **Dark, minimal:** GitHub Dark, Nord
- **Light:** Catppuccin Latte, GitHub Light, Rosé Pine Dawn, Solarized Light

### By appearance

```typescript
import { getThemesByAppearance } from '@lgtm-hq/turbo-themes';

const darkThemes = getThemesByAppearance('dark').map((f) => f.id); // 15 themes
const lightThemes = getThemesByAppearance('light').map((f) => f.id); // 9 themes
```

## Loading Themes

### Single Theme

```html
<link rel="stylesheet" href="/css/themes/turbo/catppuccin-mocha.css" />
```

### Theme Switching

```javascript
function setTheme(themeId) {
  const link = document.getElementById('theme-css');
  link.href = `/css/themes/turbo/${themeId}.css`;
  document.documentElement.setAttribute('data-theme', themeId);
  localStorage.setItem('turbo-theme', themeId);
}
```

## Next Steps

- Learn about the [JavaScript API](/docs/api-reference/javascript-api/)
- Explore [theme switching](/docs/guides/theme-switching/)
- Create your own [custom theme](/docs/guides/custom-themes/)
