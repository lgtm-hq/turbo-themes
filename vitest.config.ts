import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  resolve: {
    alias: {
      // More specific paths must come before less specific ones
      '@lgtm-hq/turbo-themes-core/css/mappings': resolve(__dirname, 'packages/core/src/themes/css/mappings.ts'),
      '@lgtm-hq/turbo-themes-core/themes/types': resolve(__dirname, 'packages/core/src/themes/types.ts'),
      '@lgtm-hq/turbo-themes-core/tokens': resolve(__dirname, 'packages/core/src/tokens/index.ts'),
      '@lgtm-hq/turbo-themes-core': resolve(__dirname, 'packages/core/src/index.ts'),
    },
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
  },
  test: {
    environment: 'happy-dom',
    environmentOptions: {
      happyDOM: {
        settings: {
          disableCSSFileLoading: true,
          handleDisabledFileLoadingAsSuccess: true,
        },
      },
    },
    setupFiles: ['./test/setup.ts'],
    include: ['test/**/*.test.ts', 'test/**/*.test.tsx', 'test/**/*.spec.ts', 'packages/*/test/**/*.test.ts', 'packages/adapters/*/test/**/*.test.ts'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/_site/**', 'apps/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov', 'json-summary'],
      reportsDirectory: './coverage',
      all: true,
      include: ['src/**/*.ts', 'packages/*/src/**/*.ts', 'packages/adapters/*/src/**/*.ts'],
      // Exclusion audit: last reviewed 2026-07-17.
      // Re-review quarterly, or whenever a new entry is added.
      exclude: [
        'node_modules/**',
        'dist/**',
        '_site/**',
        '**/*.config.ts',
        '**/*.config.js',
        '**/*.d.ts',
        '**/*.js',
        '**/*.map',
        'scripts/**',
        '.github/**',
        'coverage/**',
        'test/**',
        'e2e/**',
        // Generated theme data files — produced by scripts/sync-*.mjs, not hand-authored logic
        'src/themes/packs/**/*.synced.ts',
        // Type-only files — only TypeScript interface/type declarations, no runtime logic
        'packages/core/src/themes/types.ts',
        'packages/core/src/themes/css/types.ts',
        'packages/theme-selector/src/types.ts',
        'src/themes/types.ts',
        // Re-export-only files — all logic lives in the modules they re-export from
        'packages/core/src/index.ts',                      // re-exports tokens, registry, types, metadata
        'packages/core/src/themes/registry.ts',            // single re-export: flavors from tokens/index
        'packages/core/src/themes/css/global-overrides.ts', // re-exports from ./overrides/index
        // Root src/ shim files — re-export from packages/*/dist at runtime, no own logic
        'src/index.ts',          // re-exports packages/core/dist and packages/theme-selector/dist
        'src/tokens/index.ts',   // re-exports packages/core/dist/tokens/index
        // Legacy pre-modularisation duplicate — identical logic covered in packages/core/src/themes/css/
        // (tested via packages/core/test/css/); not imported by any non-test file
        'src/themes/css.ts',
      ],
      thresholds: {
        lines: 85,
        functions: 85,
        branches: 85,
        statements: 85,
      },
    },
  },
});
