---
title: CDN Installation
description: Use Turbo Themes directly from a CDN with no build step required.
category: installation
order: 3
prev: installation/npm
next: installation/jekyll
---

# CDN Installation

Use Turbo Themes directly from a CDN - no installation or build step required.

## Quick Start

Add these links to your HTML `<head>`:

```html
<!-- Core tokens and base styles -->
<link rel="stylesheet" href="https://unpkg.com/@lgtm-hq/turbo-themes/packages/css/dist/turbo-core.css" />
<link rel="stylesheet" href="https://unpkg.com/@lgtm-hq/turbo-themes/packages/css/dist/turbo-base.css" />

<!-- Choose a theme -->
<link
  rel="stylesheet"
  href="https://unpkg.com/@lgtm-hq/turbo-themes/packages/css/dist/themes/catppuccin-mocha.css"
/>

<!-- Optional: Syntax highlighting -->
<link rel="stylesheet" href="https://unpkg.com/@lgtm-hq/turbo-themes/packages/css/dist/turbo-syntax.css" />
```

## CDN Providers

### unpkg (Recommended)

```html
<link
  rel="stylesheet"
  href="https://unpkg.com/@lgtm-hq/turbo-themes@latest/packages/css/dist/turbo-core.css"
/>
```

### jsDelivr

```html
<link
  rel="stylesheet"
  href="https://cdn.jsdelivr.net/npm/@lgtm-hq/turbo-themes@latest/packages/css/dist/turbo-core.css"
/>
```

## Pinning Versions

For production, pin to a specific version to avoid unexpected changes:

```html
<!-- Pin to specific version -->
<link rel="stylesheet" href="https://unpkg.com/@lgtm-hq/turbo-themes@1.0.0/packages/css/dist/turbo-core.css" />
```

## Available Files

### Core Files

| File                | URL                                   | Size |
| ------------------- | ------------------------------------- | ---- |
| Core tokens         | `/packages/css/dist/turbo-core.css`   | ~2KB |
| Base styles         | `/packages/css/dist/turbo-base.css`   | ~1KB |
| Syntax highlighting | `/packages/css/dist/turbo-syntax.css` | ~1KB |

### Theme Files

| Theme                | URL                                                  |
| -------------------- | ---------------------------------------------------- |
| Catppuccin Mocha     | `/packages/css/dist/themes/catppuccin-mocha.css`     |
| Catppuccin Macchiato | `/packages/css/dist/themes/catppuccin-macchiato.css` |
| Catppuccin Frappé    | `/packages/css/dist/themes/catppuccin-frappe.css`    |
| Catppuccin Latte     | `/packages/css/dist/themes/catppuccin-latte.css`     |
| Dracula              | `/packages/css/dist/themes/dracula.css`              |
| GitHub Dark          | `/packages/css/dist/themes/github-dark.css`          |
| GitHub Light         | `/packages/css/dist/themes/github-light.css`         |
| Bulma Dark           | `/packages/css/dist/themes/bulma-dark.css`           |
| Bulma Light          | `/packages/css/dist/themes/bulma-light.css`          |

### Adapters

| Adapter | URL                                               |
| ------- | ------------------------------------------------- |
| Bulma   | `/packages/adapters/bulma/dist/bulma-adapter.css` |

## Complete Example

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>My Turbo Themed Site</title>

    <!-- Turbo Themes -->
    <link rel="stylesheet" href="https://unpkg.com/@lgtm-hq/turbo-themes/packages/css/dist/turbo-core.css" />
    <link rel="stylesheet" href="https://unpkg.com/@lgtm-hq/turbo-themes/packages/css/dist/turbo-base.css" />
    <link
      id="theme-css"
      rel="stylesheet"
      href="https://unpkg.com/@lgtm-hq/turbo-themes/packages/css/dist/themes/catppuccin-mocha.css"
    />

    <style>
      body {
        background: var(--turbo-bg-base);
        color: var(--turbo-text-primary);
        font-family: system-ui, sans-serif;
        padding: 2rem;
      }

      .card {
        background: var(--turbo-bg-surface);
        border: 1px solid var(--turbo-border-default);
        border-radius: 0.5rem;
        padding: 1.5rem;
        max-width: 400px;
      }

      .btn {
        background: var(--turbo-brand-primary);
        color: var(--turbo-text-inverse);
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 0.25rem;
        cursor: pointer;
      }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>Hello Turbo Themes!</h1>
      <p>This page uses design tokens from the CDN.</p>
      <button class="btn" onclick="toggleTheme()">Toggle Theme</button>
    </div>

    <script>
      const themes = ['catppuccin-mocha', 'catppuccin-latte', 'dracula'];
      let currentIndex = 0;

      function toggleTheme() {
        currentIndex = (currentIndex + 1) % themes.length;
        const theme = themes[currentIndex];
        document.getElementById('theme-css').href =
          `https://unpkg.com/@lgtm-hq/turbo-themes/packages/css/dist/themes/${theme}.css`;
      }
    </script>
  </body>
</html>
```

## Performance Tips

1. **Preconnect** to the CDN for faster loading:

   ```html
   <link rel="preconnect" href="https://unpkg.com" />
   ```

2. **Preload** the theme CSS:

   ```html
   <link
     rel="preload"
     as="style"
     href="https://unpkg.com/@lgtm-hq/turbo-themes/packages/css/dist/themes/catppuccin-mocha.css"
   />
   ```

3. **Cache** - CDN files are cached, but consider self-hosting for best performance in
   production.

## Next Steps

- Explore [npm installation](/docs/installation/npm/) for production projects
- Learn about [theme switching](/docs/guides/theme-switching/)
- Check the [API Reference](/docs/api-reference/)
