import { describe, it, expect } from 'vitest';
import { statSync, existsSync } from 'fs';

// Size budgets in bytes (generous to allow growth, but catch major issues)
const SIZE_BUDGETS: Record<string, number> = {
  'packages/theme-selector/dist/index.js': 98_304, // 96KB (embedded theme JSON grows
  // with each theme pack — 27 themes as of One Dark + Terminal; Vite 8/Rolldown also
  // adds ~7KB of quote-escaping overhead vs Vite 7; gzipped size is unchanged)
  'packages/adapters/tailwind/dist/preset.js': 30_000, // 30KB
  'packages/adapters/tailwind/dist/colors.js': 20_000, // 20KB
  'packages/css/dist/index.js': 35_000, // 35KB (increased: component CSS vars now emitted for all themes)
  'packages/adapters/bulma/dist/index.js': 20_000, // 20KB
  // Slim picker metadata for 24 themes (~200 bytes/theme); keep under 5KB.
  'dist/catalog.json': 5_120,
};

// CSS output size budgets
const CSS_SIZE_BUDGETS: Record<string, number> = {
  'packages/css/dist/turbo-themes-all.css': 112_640, // 110KB (all theme [data-theme] selectors)
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
