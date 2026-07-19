---
title: Astro + GitHub Pages
description:
  Deploy a turbo-themes-powered Astro doc site to GitHub Pages with Shiki syntax
  highlighting, a theme switcher, and Pagefind search.
category: integrations
order: 7
prev: integrations/swiftui
next: api-reference/index
keywords:
  - astro
  - github pages
  - shiki
  - syntax highlighting
  - theme switching
  - pagefind
---

# Astro + GitHub Pages Integration

This guide documents the **recommended integration path** used by consumer doc sites
such as [py-lintro](https://github.com/lgtm-hq/py-lintro) and
[Rustume](https://github.com/lgtm-hq/Rustume). It covers every piece of wiring that new
sites need so you don't have to rediscover it: CSS load order, Shiki `css-variables`
binding, a persistent theme switcher, GitHub Pages subpath handling, and optional
Pagefind search.

> **Upcoming:** The Terminal flavor (#502) will ship a first-party Terminal theme and
> replace the native-theme workaround described in §5 below. Until it lands, use the
> pattern shown here.

---

## 1. Dependencies and Asset Copy

### Install packages

```bash
bun add @lgtm-hq/turbo-themes astro @astrojs/sitemap pagefind
```

### Copy CSS at build time

Consumer sites copy CSS from the installed package into `public/` so Astro can serve
them as static assets. Create `scripts/copy-assets.mjs`:

```js
// scripts/copy-assets.mjs
import { cp } from 'node:fs/promises';
import { resolve } from 'node:path';

const src = resolve('node_modules/@lgtm-hq/turbo-themes/packages/css/dist');
const dest = resolve('public/assets/css');

await cp(src, dest, { recursive: true });
console.log('turbo-themes CSS copied to public/assets/css/');
```

Wire it into your `package.json` build chain:

```json
{
  "scripts": {
    "prebuild": "node scripts/copy-assets.mjs",
    "build": "astro build"
  }
}
```

After the copy you will have:

```
public/assets/css/
├── turbo-core.css
├── turbo-base.css
├── turbo-syntax.css
├── turbo-components.css
└── themes/
    ├── catppuccin-mocha.css
    ├── catppuccin-latte.css
    ├── dracula.css
    └── …
```

---

## 2. BaseLayout CSS Load Order

Load the CSS bundles in this exact order inside your `<head>`. `{base}` is the GitHub
Pages subpath (see §5):

```html
<!-- 1. Token definitions (required) -->
<link rel="stylesheet" href="{base}/assets/css/turbo-core.css" />

<!-- 2. Base semantic styles (typography, forms, etc.) -->
<link rel="stylesheet" href="{base}/assets/css/turbo-base.css" />

<!-- 3. Shiki ↔ turbo-syntax bridge (required for code blocks) -->
<link rel="stylesheet" href="{base}/assets/css/turbo-syntax.css" />

<!-- 4. Optional component styles -->
<link rel="stylesheet" href="{base}/assets/css/turbo-components.css" />

<!-- 5. Active theme file (swapped on flavor change) -->
<link
  id="turbo-theme-css"
  rel="stylesheet"
  href="{base}/assets/css/themes/catppuccin-mocha.css"
/>
```

> The **order matters**: `turbo-syntax.css` must come after `turbo-core.css` because it
> reads `--turbo-syntax-*` variables defined by the core file.

---

## 3. Astro Markdown Config and Shiki Binding

Set `shikiConfig.theme` to `"css-variables"` so Shiki emits `--astro-code-*` custom
properties instead of hard-coded colors. `turbo-syntax.css` already maps those
properties onto `--turbo-syntax-*` tokens:

```
--astro-code-color-text        → --turbo-syntax-fg
--astro-code-color-background  → --turbo-syntax-bg
--astro-code-token-keyword     → --turbo-syntax-keyword
--astro-code-token-string      → --turbo-syntax-string
… (full mapping in packages/css/src/syntax.ts)
```

In `astro.config.mjs`:

```js
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import rehypeUnwrapHeadingLinks from './src/plugins/rehypeUnwrapHeadingLinks.mjs';
import { rehypeDocLinks } from './src/plugins/rehypeDocLinks.mjs';

const base = process.env.ASTRO_BASE ?? '';

export default defineConfig({
  site: 'https://<org>.github.io',
  base, // e.g. '/my-repo' for GitHub Pages
  integrations: [sitemap()],
  markdown: {
    shikiConfig: {
      theme: 'css-variables', // required for turbo-syntax binding
      wrap: true,
    },
    rehypePlugins: [
      rehypeUnwrapHeadingLinks,
      [rehypeDocLinks, { base }], // rewrites internal links to include base
    ],
  },
});
```

### rehypeDocLinks helper

A minimal plugin that prefixes internal hrefs with the deployment base path:

```js
// src/plugins/rehypeDocLinks.mjs
import { visit } from 'unist-util-visit';

export function rehypeDocLinks({ base = '' } = {}) {
  return (tree) => {
    visit(tree, 'element', (node) => {
      if (node.tagName !== 'a') return;
      const href = node.properties?.href ?? '';
      if (href.startsWith('/') && !href.startsWith(base)) {
        node.properties.href = base + href;
      }
    });
  };
}
```

---

## 4. Theme Switcher Pattern

### HTML attributes

Set `data-theme` and `data-appearance` on `<html>` before content renders to avoid a
flash of unstyled content:

```html
<html data-theme="catppuccin-mocha" data-appearance="dark"></html>
```

### Inline blocking script

Place this **before** any stylesheets to restore the last-used theme instantly:

```html
<script>
  (function () {
    var THEMES = [
      'catppuccin-mocha',
      'catppuccin-macchiato',
      'catppuccin-frappe',
      'catppuccin-latte',
      'dracula',
      'github-dark',
      'github-light',
      'bulma-dark',
      'bulma-light',
    ];
    var DARK = new Set([
      'catppuccin-mocha',
      'catppuccin-macchiato',
      'catppuccin-frappe',
      'dracula',
      'github-dark',
      'bulma-dark',
    ]);
    var saved = localStorage.getItem('turbo-theme');
    var theme = saved && THEMES.includes(saved) ? saved : 'catppuccin-mocha';
    var html = document.documentElement;
    html.setAttribute('data-theme', theme);
    html.setAttribute('data-appearance', DARK.has(theme) ? 'dark' : 'light');
  })();
</script>
```

### Theme switcher function

```js
const DARK_THEMES = new Set([
  'catppuccin-mocha',
  'catppuccin-macchiato',
  'catppuccin-frappe',
  'dracula',
  'github-dark',
  'bulma-dark',
]);

/**
 * Apply a theme and persist the choice.
 * Dispatches 'turbo-theme-applied' so other components can react.
 */
function setTheme(themeId, base = '') {
  const link = document.getElementById('turbo-theme-css');
  if (link) {
    link.href = `${base}/assets/css/themes/${themeId}.css`;
  }

  const html = document.documentElement;
  html.setAttribute('data-theme', themeId);
  html.setAttribute('data-appearance', DARK_THEMES.has(themeId) ? 'dark' : 'light');

  localStorage.setItem('turbo-theme', themeId);

  html.dispatchEvent(new CustomEvent('turbo-theme-applied', { detail: { themeId } }));
}
```

Consumers can listen for `turbo-theme-applied` to update UI state:

```js
document.documentElement.addEventListener('turbo-theme-applied', (e) => {
  const { themeId } = e.detail;
  document.querySelectorAll('[data-theme-option]').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.themeOption === themeId);
  });
});
```

---

## 5. GitHub Pages: `base` / `site` Config

GitHub Pages serves repositories at `https://<org>.github.io/<repo>/`. Set `base` in
`astro.config.mjs` via an environment variable so local dev still works at `/`:

```bash
# .env.production (or set in GitHub Actions)
ASTRO_BASE=/my-repo
```

```js
// astro.config.mjs
const base = process.env.ASTRO_BASE ?? '';

export default defineConfig({
  site: 'https://lgtm-hq.github.io',
  base,   // Astro prefixes all asset URLs and internal links automatically
  …
});
```

Pass `base` to the CSS `<link>` hrefs and to the theme switcher's `setTheme(id, base)`
call so hotlinked CSS paths are correct on the deployed subdomain.

### Image and link prefixing

Astro handles `<Image />` and `<a href="…">` automatically when `base` is set. For raw
`<img src="…">` tags in Markdown, use the `{base}` variable injected by your layout
component:

```astro
---
const { base } = Astro.props;
---
<img src={`${base}/images/logo.svg`} alt="Logo" />
```

---

## 6. Pagefind Search

[Pagefind](https://pagefind.app/) indexes your built site and provides a zero-JS runtime
search UI.

### Setup

Add to your build script:

```json
{
  "scripts": {
    "build": "astro build && pagefind --site dist"
  }
}
```

### Exclude chrome from search index

Add `data-pagefind-ignore` to navigation, sidebars, and footers so the search index
contains only content:

```html
<nav data-pagefind-ignore>…</nav>
<aside data-pagefind-ignore>…</aside>
<footer data-pagefind-ignore>…</footer>
```

### Pagefind UI component

```astro
---
// src/components/Search.astro
---
<div id="search"></div>

<link href="/pagefind/pagefind-ui.css" rel="stylesheet" />
<script src="/pagefind/pagefind-ui.js"></script>
<script>
  window.addEventListener('DOMContentLoaded', () => {
    new PagefindUI({ element: '#search', showSubResults: true });
  });
</script>
```

---

## 7. CI Workflows

### Site quality check

```yaml
# .github/workflows/site-quality.yml
name: site-quality
on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install
      - run: bun run build
        env:
          ASTRO_BASE: /my-repo
```

### Deploy to GitHub Pages

```yaml
# .github/workflows/deploy-pages.yml
name: deploy-pages
on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install
      - run: bun run build
        env:
          ASTRO_BASE: /my-repo
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist/
      - id: deployment
        uses: actions/deploy-pages@v4
```

---

## 8. Pre-launch Checklist

- [ ] `site` and `base` set in `astro.config.mjs` (use `ASTRO_BASE` env var)
- [ ] CSS copied to `public/assets/css/` before `astro build`
- [ ] CSS load order: core → base → syntax → components → theme file
- [ ] `shikiConfig: { theme: "css-variables" }` in `markdown` config
- [ ] Blocking theme-restore script before stylesheets
- [ ] `#turbo-theme-css` link element targeted by the switcher
- [ ] `turbo-theme-applied` event dispatched on theme change
- [ ] `data-pagefind-ignore` on nav / sidebar / footer
- [ ] `site-quality` CI passes on every PR
- [ ] `deploy-pages` workflow enabled for the `main` branch

---

## Reference Implementations

These production sites use this stack and are kept up to date:

| Site                                                                               | Theme                     | Notes                    |
| ---------------------------------------------------------------------------------- | ------------------------- | ------------------------ |
| [py-lintro `apps/site/`](https://github.com/lgtm-hq/py-lintro/tree/main/apps/site) | Terminal (default flavor) | Resources footer pattern |
| [Rustume `apps/site/`](https://github.com/lgtm-hq/Rustume/tree/main/apps/site)     | Craft (native theme)      | Minimal scaffold         |

---

## Next Steps

- [CSS Variables Reference](/docs/api-reference/css-variables/) — full token listing
- [Theme Switching Guide](/docs/guides/theme-switching/) — more switcher patterns
- [npm/Bun Installation](/docs/installation/npm/) — installing turbo-themes packages
- [CSS Package README](https://github.com/lgtm-hq/turbo-themes/blob/main/packages/css/README.md)
  — programmatic CSS generation
- [Shared docs navigation shell](https://github.com/lgtm-hq/turbo-themes/blob/main/docs/investigations/shared-docs-navigation-shell.md)
  — inventory and recommendation for flat `.turbo-docs-nav` vs docs-kit layout (#505);
  pairs with Resources / docs-kit notes (#504)
