---
title: Theme Switching
description: Implement dynamic theme switching with localStorage persistence.
category: guides
order: 2
prev: guides/index
next: guides/custom-themes
---

# Theme Switching

Learn how to implement theme switching that persists across page loads.

## Choosing your theme catalog

Turbo Themes ships with 24 themes across 9 vendor families. A "catalog" is simply the
subset of themes you expose to users in your app. The right approach depends on your
build tooling.

### Approach A — hardcoded list (no build step required)

The simplest pattern. Maintain a plain array and update it when you upgrade the package:

```javascript
// Minimal set — copy-paste friendly
const CATALOG = [
  'catppuccin-mocha',
  'catppuccin-latte',
  'dracula',
  'github-dark',
  'github-light',
];
```

### Approach B — filter by vendor or appearance (TS/ESM build)

The `@lgtm-hq/turbo-themes` package exports `getThemesByVendor()` and
`getThemesByAppearance()` so your catalog stays in sync with the package automatically:

```typescript
import {
  themeIds,
  getThemesByVendor,
  getThemesByAppearance,
} from '@lgtm-hq/turbo-themes';

// Opt-in to specific vendors
const catppuccin = getThemesByVendor('catppuccin').map((f) => f.id);
// → ['catppuccin-mocha', 'catppuccin-macchiato', 'catppuccin-frappe', 'catppuccin-latte']

// Dark-only themes
const darkOnly = getThemesByAppearance('dark').map((f) => f.id);

// Light-only themes
const lightOnly = getThemesByAppearance('light').map((f) => f.id);

// All themes
const allThemes = themeIds; // readonly string[], 24 entries
```

> **Planned (#495):** A `themeSets` object (pre-defined subsets like
> `themeSets.minimal`, `themeSets.dark`) and a `createThemeCatalog()` factory (filter by
> vendor _and_ appearance in one call) will ship in `#495` and make these patterns even
> more concise.

## Basic Implementation

### 1. Set Up HTML

Give your theme CSS link an ID so JavaScript can swap it:

```html
<head>
  <!-- Core styles -->
  <link rel="stylesheet" href="/css/turbo-core.css" />
  <link rel="stylesheet" href="/css/turbo-base.css" />

  <!-- Theme (with ID for JavaScript access) -->
  <link id="theme-css" rel="stylesheet" href="/css/themes/turbo/catppuccin-mocha.css" />
</head>
```

### 2. Create Theme Switcher

```javascript
const CATALOG = [
  'catppuccin-mocha',
  'catppuccin-latte',
  'dracula',
  'github-dark',
  'github-light',
];

function setTheme(themeName) {
  if (!CATALOG.includes(themeName)) return;

  document.getElementById('theme-css').href = `/css/themes/turbo/${themeName}.css`;
  document.documentElement.setAttribute('data-theme', themeName);
  localStorage.setItem('turbo-theme', themeName);
}
```

### 3. Load Saved Theme

```javascript
document.addEventListener('DOMContentLoaded', () => {
  const saved = localStorage.getItem('turbo-theme');
  const initial = CATALOG.includes(saved) ? saved : 'catppuccin-mocha';
  setTheme(initial);
});
```

## Preventing FOUC

Flash of Unstyled Content (FOUC) happens when the page renders with the wrong theme
before JavaScript runs. A blocking script in `<head>` applies the saved theme
synchronously before first paint.

### Option 1 — Use `generateBlockingScript()`

The `@lgtm-hq/turbo-theme-selector` package generates a self-contained IIFE from your
catalog. Run it at build time and inline the result:

```typescript
import { generateBlockingScript } from '@lgtm-hq/turbo-theme-selector';
import { themeIds } from '@lgtm-hq/turbo-themes';

// Derive validThemes from your curated catalog (or pass themeIds for all):
const validThemes = [
  'catppuccin-mocha',
  'catppuccin-latte',
  'dracula',
  'github-dark',
  'github-light',
];
const blockingScript = generateBlockingScript({ validThemes });
// → embed blockingScript in a <script> tag in <head>
```

**Astro example:**

```astro
---
import { generateBlockingScript } from '@lgtm-hq/turbo-theme-selector';
const blockingScript = generateBlockingScript();
---
<head>
  <Fragment set:html={`<script>${blockingScript}</script>`} />
</head>
```

### Option 2 — Inline script (no build step)

For plain HTML files, write the script directly using your hardcoded catalog:

```html
<script>
  (function () {
    try {
      var DEFAULT_THEME = 'catppuccin-mocha';
      var VALID_THEMES = [
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
      ];

      var saved = localStorage.getItem('turbo-theme');
      var theme = saved && VALID_THEMES.indexOf(saved) !== -1 ? saved : DEFAULT_THEME;

      document.documentElement.setAttribute('data-theme', theme);
      var link = document.getElementById('theme-css');
      if (link) link.href = '/css/themes/turbo/' + theme + '.css';
    } catch (e) {
      console.warn('Unable to load saved theme:', e);
    }
  })();
</script>
```

Keep `VALID_THEMES` in sync with your `<select>` options. Trim the list to only the
themes your app supports.

## Theme Selector UI

### Dropdown with vendor grouping

```html
<select id="theme-select" onchange="setTheme(this.value)">
  <optgroup label="Catppuccin">
    <option value="catppuccin-mocha">Catppuccin Mocha</option>
    <option value="catppuccin-latte">Catppuccin Latte</option>
  </optgroup>
  <optgroup label="GitHub">
    <option value="github-dark">GitHub Dark</option>
    <option value="github-light">GitHub Light</option>
  </optgroup>
  <optgroup label="Dracula">
    <option value="dracula">Dracula</option>
  </optgroup>
</select>

<script>
  document.addEventListener('DOMContentLoaded', function () {
    var saved = localStorage.getItem('turbo-theme') || 'catppuccin-mocha';
    document.getElementById('theme-select').value = saved;
  });
</script>
```

When you have a build step, generate the `<option>` elements from your catalog:

```typescript
import {
  themeIds,
  flavors,
  getThemesByVendor,
  VENDOR_GROUPS,
} from '@lgtm-hq/turbo-themes';

const flavorMap = new Map(flavors.map((f) => [f.id, f]));

function populateSelector(select: HTMLSelectElement, catalog: readonly string[]): void {
  select.innerHTML = '';
  const groups = new Map<string, HTMLOptGroupElement>();

  for (const id of catalog) {
    const flavor = flavorMap.get(id);
    if (!flavor) continue;

    let group = groups.get(flavor.vendor);
    if (!group) {
      group = document.createElement('optgroup');
      group.label = flavor.vendor;
      select.appendChild(group);
      groups.set(flavor.vendor, group);
    }

    const opt = document.createElement('option');
    opt.value = id;
    opt.textContent = flavor.label;
    group.appendChild(opt);
  }
}
```

### Light/Dark Toggle

```javascript
const DARK_THEMES = [
  'catppuccin-mocha',
  'catppuccin-macchiato',
  'catppuccin-frappe',
  'dracula',
  'github-dark',
];
const LIGHT_THEMES = ['catppuccin-latte', 'github-light'];

// Or derive from getThemesByAppearance():
// import { getThemesByAppearance } from '@lgtm-hq/turbo-themes';
// const DARK_THEMES = getThemesByAppearance('dark').map(f => f.id);

function toggleTheme() {
  const current = localStorage.getItem('turbo-theme') || 'catppuccin-mocha';
  const isDark = DARK_THEMES.includes(current);
  setTheme(isDark ? 'catppuccin-latte' : 'catppuccin-mocha');
}
```

## System Preference Detection

```javascript
function getDefaultTheme() {
  const saved = localStorage.getItem('turbo-theme');
  if (saved && CATALOG.includes(saved)) return saved;

  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'catppuccin-mocha'
    : 'catppuccin-latte';
}

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
  if (!localStorage.getItem('turbo-theme')) {
    setTheme(e.matches ? 'catppuccin-mocha' : 'catppuccin-latte');
  }
});
```

## Next Steps

- Learn to [create custom themes](/docs/guides/custom-themes/)
- Ensure [accessibility](/docs/guides/accessibility/) in your themed UI
- Check the [JavaScript API reference](/docs/api-reference/javascript-api/)
