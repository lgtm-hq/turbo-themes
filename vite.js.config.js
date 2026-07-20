// SPDX-License-Identifier: MIT
import { defineConfig } from 'vite';
import { resolve } from 'path';

/**
 * Vite configuration for building the browser JavaScript bundles.
 *
 * Builds IIFE bundles for browser usage, with both development and production modes:
 * - Development: Non-minified with source maps (<target>.js)
 * - Production: Minified without source maps (<target>.min.js)
 *
 * The bundle is selected via the JS_BUILD_TARGET environment variable
 * (default: theme-selector). IIFE builds only support a single entry, so
 * each target is built in its own invocation.
 *
 * @example
 * bun run build:js:dev   # Development builds
 * bun run build:js:prod  # Production builds
 */
const targets = {
  'theme-selector': {
    entry: 'assets/js/theme-selector.ts',
    name: 'TurboThemeSelector',
  },
  'homepage-showcase': {
    entry: 'assets/js/homepage-showcase.ts',
    name: 'TurboHomepageShowcase',
  },
};

export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';
  const targetKey = process.env.JS_BUILD_TARGET ?? 'theme-selector';
  const target = targets[targetKey];
  if (!target) {
    throw new Error(
      `Unknown JS_BUILD_TARGET "${targetKey}". Valid targets: ${Object.keys(targets).join(', ')}`
    );
  }

  return {
    build: {
      lib: {
        entry: resolve(import.meta.dirname, target.entry),
        name: target.name,
        formats: ['iife'],
        fileName: () => (isProduction ? `${targetKey}.min.js` : `${targetKey}.js`),
      },
      outDir: 'assets/js',
      emptyOutDir: false,
      minify: isProduction ? 'esbuild' : false,
      sourcemap: !isProduction,
      target: 'es2020',
    },
    resolve: {
      alias: {
        '@lgtm-hq/turbo-themes-core': resolve(
          import.meta.dirname,
          'packages/core/dist/index.js'
        ),
        '@lgtm-hq/turbo-theme-selector': resolve(
          import.meta.dirname,
          'packages/theme-selector/dist/index.js'
        ),
      },
    },
  };
});
