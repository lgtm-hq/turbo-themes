import fs from 'node:fs';

import { describe, expect, it } from 'vitest';

import { flavors } from '../../packages/core/src/tokens/index';
import { getContrastRatio, turboCoreFile } from './test-utils';

// Strict WCAG AA normal-text gate for primary CTA labels (4.5:1).
// `--gradient-primary` blends brand.primary → state.info; ink must clear both stops.
const WCAG_AA_NORMAL = 4.5;

/**
 * Regression gate for #752. `--turbo-text-on-brand` is the ink for any surface
 * painted with `--gradient-primary`. It resolves per theme to the audited
 * `brand.primaryText` token, which `scripts/normalize-wcag-aa-tokens.mjs`
 * gates against BOTH gradient stops — so this suite asserts the same pair for
 * every theme, in both polarities, rather than only the brand-primary stop.
 */
describe('Text-on-brand (gradient CTA) contrast', () => {
	it('exposes --turbo-text-on-brand in the generated core CSS', () => {
		const core = fs.readFileSync(turboCoreFile, 'utf8');
		expect(core).toContain('--turbo-text-on-brand:');
		// It must alias the audited per-theme token, not a hard-coded colour,
		// or it would stop tracking theme swaps.
		expect(core).toMatch(/--turbo-text-on-brand:\s*var\(--turbo-brand-primary-text/);
	});

	it('covers both light and dark polarity', () => {
		const appearances = new Set(flavors.map((f) => f.appearance));
		expect(appearances.has('light')).toBe(true);
		expect(appearances.has('dark')).toBe(true);
		// Guard against the matrix silently collapsing to a handful of themes.
		expect(flavors.length).toBeGreaterThanOrEqual(37);
	});

	for (const flavor of flavors) {
		describe(`${flavor.id} (${flavor.appearance})`, () => {
			const brand = flavor.tokens.brand.primary;
			const info = flavor.tokens.state.info;
			const textColor = flavor.tokens.brand.primaryText;

			it('defines an audited brand.primaryText token', () => {
				// A missing token would silently fall back to `text.inverse`, which is
				// only audited against the solid brand fill — the #752 failure mode.
				expect(textColor, `${flavor.id}: brand.primaryText is not defined`).toBeTruthy();
			});

			it('primary CTA ink meets WCAG AA on gradient start stop (brand.primary)', () => {
				const ratio = getContrastRatio(textColor as string, brand);
				expect(
					ratio,
					`${flavor.id}: brand contrast ${ratio.toFixed(2)}:1 < ${WCAG_AA_NORMAL}:1 (fg ${textColor} on ${brand})`,
				).toBeGreaterThanOrEqual(WCAG_AA_NORMAL);
			});

			it('primary CTA ink meets WCAG AA on gradient end stop (state.info)', () => {
				const ratio = getContrastRatio(textColor as string, info);
				expect(
					ratio,
					`${flavor.id}: info-stop contrast ${ratio.toFixed(2)}:1 < ${WCAG_AA_NORMAL}:1 (fg ${textColor} on ${info})`,
				).toBeGreaterThanOrEqual(WCAG_AA_NORMAL);
			});
		});
	}
});
