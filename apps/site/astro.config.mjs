// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

// Base path configuration:
// - Local development and E2E tests: / (default)
// - Production (GitHub Pages): /turbo-themes/
// Set ASTRO_BASE=/turbo-themes/ for production builds (CI deploy workflow sets this)
const base = process.env.ASTRO_BASE || '/';

// https://astro.build/config
export default defineConfig({
  site: 'https://lgtm-hq.github.io',
  base,
  output: 'static',
  // Keep Astro 6 HTML-aware whitespace compression so inline spacing (and
  // visual snapshots) stay stable under Astro 7's default compressHTML: 'jsx'.
  compressHTML: true,
  integrations: [sitemap()],
  markdown: {
    shikiConfig: {
      theme: 'css-variables',
      wrap: true,
    },
  },
  build: {
    format: 'directory',
  },
  vite: {
    css: {
      // Astro's Vite root is `apps/site`, but Vite's PostCSS discovery walks up
      // and picks up the repo-root `postcss.config.js`. That config is a
      // PurgeCSS pipeline written for the old Jekyll site: its `content` globs
      // resolve to paths that do not exist here, so PurgeCSS sees zero markup
      // and strips every rule Vite emits — including Astro scoped `<style>`
      // blocks, which is why `data-astro-cid-*` attributes shipped with no
      // matching CSS (#761). Opt out of the inherited config explicitly; Vite
      // still minifies CSS during the build.
      postcss: { plugins: [] },
    },
    build: {
      target: 'esnext',
      // Ensure assets are properly handled
      assetsInlineLimit: 0,
    },
  },
});
