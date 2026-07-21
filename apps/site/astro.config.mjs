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
    build: {
      target: 'esnext',
      // Ensure assets are properly handled
      assetsInlineLimit: 0,
    },
  },
});
