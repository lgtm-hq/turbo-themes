---
title: JavaScript API
description: JavaScript and TypeScript API reference for Turbo Themes.
category: api-reference
order: 5
prev: api-reference/themes
next: guides/index
---

# JavaScript API

Reference for the Turbo Themes JavaScript and TypeScript exports.

## Installation

```bash
npm install @lgtm-hq/turbo-themes
```

## Core exports (`@lgtm-hq/turbo-themes`)

### `themeIds`

A readonly array of all 24 theme IDs sorted by vendor then variant. Use this as the
single source of truth so your catalog stays in sync when the package is upgraded.

```typescript
import { themeIds } from '@lgtm-hq/turbo-themes';

console.log(themeIds.length); // 24
console.log(themeIds[0]); // 'bulma-dark'
```

### `flavors`

A readonly array of `ThemeFlavor` objects with full metadata for every theme.

```typescript
import { flavors } from '@lgtm-hq/turbo-themes';

const mocha = flavors.find((f) => f.id === 'catppuccin-mocha');
// { id: 'catppuccin-mocha', label: 'Catppuccin Mocha', vendor: 'catppuccin',
//   appearance: 'dark', … }
```

### `getThemesByVendor(vendor)`

Returns all `ThemeFlavor` entries for a given vendor.

```typescript
import { getThemesByVendor } from '@lgtm-hq/turbo-themes';

const catppuccin = getThemesByVendor('catppuccin');
// → 4 flavors: mocha, macchiato, frappe, latte

const ids = catppuccin.map((f) => f.id);
// → ['catppuccin-mocha', 'catppuccin-macchiato', 'catppuccin-frappe', 'catppuccin-latte']
```

### `getThemesByAppearance(appearance)`

Returns all `ThemeFlavor` entries matching `'dark'` or `'light'`.

```typescript
import { getThemesByAppearance } from '@lgtm-hq/turbo-themes';

const dark = getThemesByAppearance('dark'); // 15 themes
const light = getThemesByAppearance('light'); //  9 themes
```

### `DEFAULT_THEME`

The default theme ID (`'catppuccin-mocha'`).

```typescript
import { DEFAULT_THEME } from '@lgtm-hq/turbo-themes';
```

### `VENDOR_GROUPS`

An ordered array of vendor groupings, each with an `id`, `label`, and `themes` array.
Useful for building grouped `<select>` elements.

```typescript
import { VENDOR_GROUPS } from '@lgtm-hq/turbo-themes';

for (const group of VENDOR_GROUPS) {
  console.log(
    group.id,
    group.themes.map((t) => t.id)
  );
}
```

### Token data

```typescript
import tokens from '@lgtm-hq/turbo-themes/tokens.json';
// or the typed version:
import { packages } from '@lgtm-hq/turbo-themes';

const mocha = tokens.themes['catppuccin-mocha'];
mocha.appearance; // 'dark'
mocha.vendor; // 'catppuccin'
mocha.tokens; // CSS custom-property values
```

## Curating a theme catalog

A "catalog" is the subset of themes your app exposes to users. The right pattern depends
on whether you have a build step.

### Hardcoded list (no build step)

The simplest approach. Keep a plain array and update it when you upgrade:

```javascript
const CATALOG = [
  'catppuccin-mocha',
  'catppuccin-latte',
  'dracula',
  'github-dark',
  'github-light',
];
```

### Vendor opt-in (TS/ESM build)

```typescript
import { getThemesByVendor } from '@lgtm-hq/turbo-themes';

const CATALOG = [
  ...getThemesByVendor('catppuccin').map((f) => f.id),
  ...getThemesByVendor('github').map((f) => f.id),
];
```

### Appearance filter

```typescript
import { getThemesByAppearance } from '@lgtm-hq/turbo-themes';

const DARK_CATALOG = getThemesByAppearance('dark').map((f) => f.id);
const LIGHT_CATALOG = getThemesByAppearance('light').map((f) => f.id);
```

### All themes

```typescript
import { themeIds } from '@lgtm-hq/turbo-themes';

const CATALOG = themeIds; // all 24
```

> **Planned (#495):** `themeSets` (named pre-defined subsets like `themeSets.minimal`
> and `themeSets.dark`) and `createThemeCatalog()` (filter by vendor _and_ appearance in
> one call) will ship in `#495`.

## FOUC prevention

### `generateBlockingScript()` — `@lgtm-hq/turbo-theme-selector`

The `@lgtm-hq/turbo-theme-selector` package exports a `generateBlockingScript()` helper
that builds a self-contained IIFE from your catalog. Inline the result in `<head>` at
build time so the saved theme is applied before first paint.

```typescript
import { generateBlockingScript } from '@lgtm-hq/turbo-theme-selector';

// Pass your curated catalog via validThemes:
const script = generateBlockingScript({
  validThemes: [
    'catppuccin-mocha',
    'catppuccin-latte',
    'dracula',
    'github-dark',
    'github-light',
  ],
  defaultTheme: 'catppuccin-mocha',
});
// → embed the returned string inside a <script> tag in <head>
```

**Astro:**

```astro
---
import { generateBlockingScript } from '@lgtm-hq/turbo-theme-selector';
const blockingScript = generateBlockingScript();
---
<head>
  <Fragment set:html={`<script>${blockingScript}</script>`} />
</head>
```

### Inline FOUC script (plain HTML, no build step)

For static pages, write the script directly. Keep `VALID_THEMES` in sync with your
`<select>` options:

```html
<script>
  (function () {
    try {
      var DEFAULT_THEME = 'catppuccin-mocha';
      var VALID_THEMES = [
        'ayu-dark',
        'ayu-light',
        'ayu-mirage',
        'bulma-dark',
        'bulma-light',
        'catppuccin-frappe',
        'catppuccin-latte',
        'catppuccin-macchiato',
        'catppuccin-mocha',
        'dracula',
        'everforest-dark-hard',
        'everforest-dark',
        'everforest-dark-soft',
        'everforest-light-hard',
        'everforest-light',
        'everforest-light-soft',
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
        'kanagawa-wave',
        'kanagawa-dragon',
        'kanagawa-lotus',
      ];

      var saved = localStorage.getItem('turbo-theme');
      var theme = saved && VALID_THEMES.indexOf(saved) !== -1 ? saved : DEFAULT_THEME;

      document.documentElement.setAttribute('data-theme', theme);
      var link = document.getElementById('turbo-theme-css');
      if (link) link.href = '/css/themes/turbo/' + theme + '.css';
    } catch (e) {
      console.warn('Unable to load saved theme:', e);
    }
  })();
</script>
```

## Theme switching implementation

### Vanilla JavaScript

```typescript
import { themeIds, DEFAULT_THEME, getThemesByAppearance } from '@lgtm-hq/turbo-themes';

const STORAGE_KEY = 'turbo-theme';

// Build your catalog — hardcode or filter:
const CATALOG: readonly string[] = themeIds; // or a curated subset

function getStoredTheme(): string {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored && CATALOG.includes(stored) ? stored : DEFAULT_THEME;
}

function setTheme(themeId: string): void {
  if (!CATALOG.includes(themeId)) return;

  const link = document.getElementById('turbo-theme-css') as HTMLLinkElement | null;
  if (link) link.href = `/css/themes/turbo/${themeId}.css`;

  document.documentElement.setAttribute('data-theme', themeId);
  localStorage.setItem(STORAGE_KEY, themeId);
}

document.addEventListener('DOMContentLoaded', () => {
  setTheme(getStoredTheme());
});
```

### With React

```tsx
import { useState, useEffect } from 'react';
import { themeIds, flavors, DEFAULT_THEME } from '@lgtm-hq/turbo-themes';

const CATALOG: readonly string[] = themeIds;
const STORAGE_KEY = 'turbo-theme';
const flavorMap = new Map(flavors.map((f) => [f.id, f]));

export function useTheme() {
  const [theme, setThemeState] = useState<string>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored && CATALOG.includes(stored) ? stored : DEFAULT_THEME;
  });

  const setTheme = (newTheme: string) => {
    if (!CATALOG.includes(newTheme)) return;
    setThemeState(newTheme);
    localStorage.setItem(STORAGE_KEY, newTheme);
    const link = document.getElementById('turbo-theme-css') as HTMLLinkElement | null;
    if (link) link.href = `/css/themes/turbo/${newTheme}.css`;
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    const link = document.getElementById('turbo-theme-css') as HTMLLinkElement | null;
    if (link) link.href = `/css/themes/turbo/${theme}.css`;
  }, [theme]);

  return {
    theme,
    setTheme,
    themes: CATALOG.map((id) => ({ id, label: flavorMap.get(id)?.label ?? id })),
  };
}
```

### With Vue

```vue
<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { themeIds, flavors, DEFAULT_THEME } from '@lgtm-hq/turbo-themes';

const CATALOG: readonly string[] = themeIds;
const STORAGE_KEY = 'turbo-theme';
const flavorMap = new Map(flavors.map((f) => [f.id, f]));

const theme = ref<string>(DEFAULT_THEME);

function setTheme(newTheme: string) {
  if (!CATALOG.includes(newTheme)) return;
  theme.value = newTheme;
}

watch(theme, (id) => {
  document.documentElement.setAttribute('data-theme', id);
  const link = document.getElementById('turbo-theme-css') as HTMLLinkElement | null;
  if (link) link.href = `/css/themes/turbo/${id}.css`;
  localStorage.setItem(STORAGE_KEY, id);
});

onMounted(() => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored && CATALOG.includes(stored)) theme.value = stored;
});
</script>

<template>
  <select :value="theme" @change="setTheme(($event.target as HTMLSelectElement).value)">
    <option v-for="id in CATALOG" :key="id" :value="id">
      {{ flavorMap.get(id)?.label ?? id }}
    </option>
  </select>
</template>
```

### With Svelte

```svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { themeIds, DEFAULT_THEME } from '@lgtm-hq/turbo-themes';

  let currentTheme: string = DEFAULT_THEME;

  function setTheme(theme: string) {
    currentTheme = theme;
    localStorage.setItem('turbo-theme', theme);

    const link = document.getElementById('turbo-theme-css') as HTMLLinkElement;
    if (link) {
      link.href = `/css/themes/turbo/${theme}.css`;
    }
  }

  onMount(() => {
    const stored = localStorage.getItem('turbo-theme');
    if (stored && themeIds.includes(stored)) {
      setTheme(stored);
    }
  });
</script>

<select bind:value={currentTheme} on:change={() => setTheme(currentTheme)}>
  {#each themeIds as theme}
    <option value={theme}>{theme}</option>
  {/each}
</select>
```

## Theme Selector Icons

The `@lgtm-hq/turbo-themes` npm package ships theme icon images under `assets/img/` so
the selector is fully self-contained — no manual asset downloading required.

### Icons shipped with the package

```
node_modules/@lgtm-hq/turbo-themes/assets/img/
  turbo-themes-logo.png
  catppuccin-logo-latte.png
  catppuccin-logo-macchiato.png
  dracula-logo.png
  gruvbox-light.png / gruvbox-dark.png
  github-logo-light.png / github-logo-dark.png
  nord.png
  rose-pine.png
  solarized-light.png / solarized-dark.png
  tokyo-night.png
  … (plus .webp variants for every PNG)
```

### Serving icons in your app

### Option 1 — Copy to your public directory (recommended for static sites)

```bash
# package.json postinstall, or build script:
mkdir -p public/assets
cp -r node_modules/@lgtm-hq/turbo-themes/assets/img public/assets/
```

The selector reads the base URL from the `data-baseurl` attribute on `<html>`. With
icons copied to `public/assets/img`, the default empty-string base URL works
automatically:

```typescript
import { wireFlavorSelector } from '@lgtm-hq/turbo-themes/selector';

await wireFlavorSelector(document, window);
```

### Option 2 — Bundler (Vite / webpack)

Copy the icons during the build using a postinstall script or a copy plugin (e.g.
`vite-plugin-static-copy`), then serve them from a known path:

```bash
# Same postinstall script as Option 1, runs before the bundler build:
mkdir -p public/assets
cp -r node_modules/@lgtm-hq/turbo-themes/assets/img public/assets/
```

### Option 3 — CDN / URL override

Set `data-baseurl` on the `<html>` element to point asset resolution at any same-origin
path prefix serving the icons (protocol-relative and cross-origin URLs are rejected):

```html
<html data-baseurl="/my-app">
  <!-- icons resolve to: /my-app/assets/img/<icon> -->
</html>
```

## Next Steps

- Explore [theme switching guide](/docs/guides/theme-switching/)
- Learn about [custom themes](/docs/guides/custom-themes/)
- Check [framework integrations](/docs/integrations/)
