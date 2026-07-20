import { describe, it, expect } from 'vitest';
import { statSync, existsSync } from 'fs';

// Size budgets in bytes (generous to allow growth, but catch major issues)
const SIZE_BUDGETS: Record<string, number> = {
  'packages/theme-selector/dist/index.js': 131_072, // 128KB (embedded theme JSON grows
  // with each theme pack — 37 themes as of the Everforest pack; Vite 8/Rolldown
  // also adds ~7KB of quote-escaping overhead vs Vite 7; gzipped size is
  // unchanged. Raised from 120KB after the showcase integration API and
  // lazy-CSS helpers landed (~120.1KB actual).
  'packages/adapters/tailwind/dist/preset.js': 30_000, // 30KB
  'packages/adapters/tailwind/dist/colors.js': 20_000, // 20KB
  'packages/css/dist/index.js': 35_000, // 35KB (increased: component CSS vars now emitted for all themes)
  'packages/adapters/bulma/dist/index.js': 20_000, // 20KB
  // HA adapter inlines all theme token data (27 flavors, emitted twice for the
  // 8 auto themes' dark/light modes) into a self-contained YAML generator; the
  // bundle sits near ~80KB, so 112KB leaves headroom as theme packs grow.
  'packages/adapters/home-assistant/dist/index.js': 114_688, // 112KB
  // Slim picker metadata (~172 bytes/theme; 31 themes ≈ 5.3KB as of the Radix
  // pack); 7KB leaves headroom for the remaining theme packs.
  'dist/catalog.json': 7_168,
};

// CSS output size budgets
const CSS_SIZE_BUDGETS: Record<string, number> = {
  'packages/css/dist/turbo-themes-all.css': 131_072, // 128KB (all theme [data-theme] selectors; ~121KB actual at 37 themes as of Everforest)
};

describe('Bundle size budgets', () => {
  for (const [file, budget] of Object.entries(SIZE_BUDGETS)) {
    it(`${file} should exist and be under ${Math.round(budget / 1024)}KB`, () => {
      expect(existsSync(file), `Bundle file ${file} should exist after build`).toBe(true);

      const stats = statSync(file);
      expect(stats.size).toBeLessThan(budget);
    });
  }
});

describe('CSS size budgets', () => {
  for (const [file, budget] of Object.entries(CSS_SIZE_BUDGETS)) {
    it(`${file} should exist and be under ${Math.round(budget / 1024)}KB`, () => {
      expect(existsSync(file), `CSS file ${file} should exist after build`).toBe(true);

      const stats = statSync(file);
      expect(stats.size).toBeLessThan(budget);
    });
  }
});
