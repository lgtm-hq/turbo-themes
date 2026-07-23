/**
 * Color Contrast Accessibility Tests
 *
 * Strict WCAG 2.1 AA gates for all themes:
 * - Normal text / UI copy: 4.5:1
 * - Large text (headings): 3:1
 */

import { describe, expect, it } from 'vitest';
import { flavors } from '../../packages/core/src/tokens/index';
import { getContrastRatio } from './test-utils';

// WCAG 2.1 AA requires 4.5:1 for normal text, 3:1 for large text
const WCAG_AA_NORMAL = 4.5;
const WCAG_AA_LARGE = 3.0;

// Prepare flavor data for parametrized tests
const flavorTestData = flavors.map((f) => [f.id, f] as const);
const headingLevels = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const;

describe('CSS Output - Color Contrast Accessibility', () => {
  describe('primary text contrast (required)', () => {
    it.each(flavorTestData)('%s primary text meets WCAG AA', (_id, flavor) => {
      const bg = flavor.tokens.background.base;
      const fg = flavor.tokens.text.primary;
      const ratio = getContrastRatio(fg, bg);

      expect(
        ratio,
        `${flavor.id}: primary text contrast ${ratio.toFixed(2)}:1 < ${WCAG_AA_NORMAL}:1`
      ).toBeGreaterThanOrEqual(WCAG_AA_NORMAL);
    });
  });

  describe('primary text on surface (required)', () => {
    it.each(flavorTestData)(
      '%s primary meets WCAG AA on surface',
      (_id, flavor) => {
        const fg = flavor.tokens.text.primary;
        const bg = flavor.tokens.background.surface;
        const ratio = getContrastRatio(fg, bg);
        expect(
          ratio,
          `${flavor.id}: primary on surface ${ratio.toFixed(2)}:1 < ${WCAG_AA_NORMAL}:1`
        ).toBeGreaterThanOrEqual(WCAG_AA_NORMAL);
      }
    );
  });

  describe('secondary text contrast (required)', () => {
    it.each(flavorTestData)(
      '%s secondary text meets WCAG AA normal text',
      (_id, flavor) => {
        const bg = flavor.tokens.background.base;
        const fg = flavor.tokens.text.secondary;
        const ratio = getContrastRatio(fg, bg);

        expect(
          ratio,
          `${flavor.id}: secondary text contrast ${ratio.toFixed(2)}:1 < ${WCAG_AA_NORMAL}:1`
        ).toBeGreaterThanOrEqual(WCAG_AA_NORMAL);
      }
    );
  });

  describe('body secondary contrast (required)', () => {
    it.each(flavorTestData)(
      '%s body secondary meets WCAG AA normal text',
      (_id, flavor) => {
        const bg = flavor.tokens.background.base;
        const fg = flavor.tokens.content.body.secondary;
        const ratio = getContrastRatio(fg, bg);

        expect(
          ratio,
          `${flavor.id}: body secondary contrast ${ratio.toFixed(2)}:1 < ${WCAG_AA_NORMAL}:1`
        ).toBeGreaterThanOrEqual(WCAG_AA_NORMAL);
      }
    );
  });

  describe('secondary text on surface (required)', () => {
    it.each(flavorTestData)(
      '%s secondary meets WCAG AA on surface',
      (_id, flavor) => {
        const fg = flavor.tokens.text.secondary;
        const bg = flavor.tokens.background.surface;
        const ratio = getContrastRatio(fg, bg);
        expect(
          ratio,
          `${flavor.id}: secondary on surface ${ratio.toFixed(2)}:1 < ${WCAG_AA_NORMAL}:1`
        ).toBeGreaterThanOrEqual(WCAG_AA_NORMAL);
      }
    );
  });

  describe('links on surface (required)', () => {
    it.each(flavorTestData)(
      '%s accent link meets WCAG AA on surface',
      (_id, flavor) => {
        const fg = flavor.tokens.accent.link;
        const bg = flavor.tokens.background.surface;
        const ratio = getContrastRatio(fg, bg);
        expect(
          ratio,
          `${flavor.id}: link on surface ${ratio.toFixed(2)}:1 < ${WCAG_AA_NORMAL}:1`
        ).toBeGreaterThanOrEqual(WCAG_AA_NORMAL);
      }
    );
  });

  describe('link contrast (required)', () => {
    it.each(flavorTestData)(
      '%s accent link meets WCAG AA normal text',
      (_id, flavor) => {
        const bg = flavor.tokens.background.base;
        const fg = flavor.tokens.accent.link;
        const ratio = getContrastRatio(fg, bg);

        expect(
          ratio,
          `${flavor.id}: link contrast ${ratio.toFixed(2)}:1 < ${WCAG_AA_NORMAL}:1`
        ).toBeGreaterThanOrEqual(WCAG_AA_NORMAL);
      }
    );
  });

  describe('content link contrast (required)', () => {
    it.each(flavorTestData)(
      '%s content link meets WCAG AA normal text',
      (_id, flavor) => {
        const bg = flavor.tokens.background.base;
        const fg = flavor.tokens.content.link.default;
        const ratio = getContrastRatio(fg, bg);

        expect(
          ratio,
          `${flavor.id}: content link contrast ${ratio.toFixed(2)}:1 < ${WCAG_AA_NORMAL}:1`
        ).toBeGreaterThanOrEqual(WCAG_AA_NORMAL);
      }
    );
  });

  describe('heading contrast (large text AA)', () => {
    for (const level of headingLevels) {
      it.each(flavorTestData)(
        `%s ${level} heading meets WCAG AA large text`,
        (_id, flavor) => {
          const bg = flavor.tokens.background.base;
          const fg = flavor.tokens.content.heading[level];
          const ratio = getContrastRatio(fg, bg);

          expect(
            ratio,
            `${flavor.id}: ${level} contrast ${ratio.toFixed(2)}:1 < ${WCAG_AA_LARGE}:1`
          ).toBeGreaterThanOrEqual(WCAG_AA_LARGE);
        }
      );
    }
  });

  describe('code block contrast (required)', () => {
    it.each(flavorTestData)(
      '%s code block text meets WCAG AA',
      (_id, flavor) => {
        const bg = flavor.tokens.content.codeBlock.bg;
        const fg = flavor.tokens.content.codeBlock.fg;
        const ratio = getContrastRatio(fg, bg);

        expect(
          ratio,
          `${flavor.id}: code block contrast ${ratio.toFixed(2)}:1 < ${WCAG_AA_NORMAL}:1`
        ).toBeGreaterThanOrEqual(WCAG_AA_NORMAL);
      }
    );
  });

  describe('inline code contrast (required)', () => {
    it.each(flavorTestData)(
      '%s inline code meets WCAG AA normal text',
      (_id, flavor) => {
        const bg = flavor.tokens.content.codeInline.bg;
        const fg = flavor.tokens.content.codeInline.fg;
        const ratio = getContrastRatio(fg, bg);

        expect(
          ratio,
          `${flavor.id}: inline code contrast ${ratio.toFixed(2)}:1 < ${WCAG_AA_NORMAL}:1`
        ).toBeGreaterThanOrEqual(WCAG_AA_NORMAL);
      }
    );
  });

  describe('selection contrast (required)', () => {
    it.each(flavorTestData)(
      '%s selection meets WCAG AA normal text',
      (_id, flavor) => {
        const bg = flavor.tokens.content.selection.bg;
        const fg = flavor.tokens.content.selection.fg;
        const ratio = getContrastRatio(fg, bg);

        expect(
          ratio,
          `${flavor.id}: selection contrast ${ratio.toFixed(2)}:1 < ${WCAG_AA_NORMAL}:1`
        ).toBeGreaterThanOrEqual(WCAG_AA_NORMAL);
      }
    );
  });

  describe('blockquote contrast (required)', () => {
    it.each(flavorTestData)(
      '%s blockquote meets WCAG AA normal text',
      (_id, flavor) => {
        const bg = flavor.tokens.content.blockquote.bg;
        const fg = flavor.tokens.content.blockquote.fg;
        const ratio = getContrastRatio(fg, bg);

        expect(
          ratio,
          `${flavor.id}: blockquote contrast ${ratio.toFixed(2)}:1 < ${WCAG_AA_NORMAL}:1`
        ).toBeGreaterThanOrEqual(WCAG_AA_NORMAL);
      }
    );
  });

  describe('state colors are unique', () => {
    it.each(flavorTestData)('%s has distinct state colors', (_id, flavor) => {
      const { info, success, warning, danger } = flavor.tokens.state;
      const colors = [info, success, warning, danger];

      // Each state color should be unique
      const unique = new Set(colors);
      expect(unique.size).toBe(4);
    });
  });
});
