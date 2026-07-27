import fs from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { flavors } from '../../packages/core/src/tokens/index';
import { getContrastRatio, projectRoot } from './test-utils';

// The shipped core stylesheet, as authored by packages/css `generateCoreCss`.
//
// Deliberately NOT `assets/css/turbo-core.css`: that path has two producers —
// style-dictionary (`build:tokens`, token vars only) and this file copied over
// it by `copy-adapters.mjs`. `scripts/local/build.sh` runs the copy in step 4
// and then re-runs style-dictionary in step 4.5, so the design-system tokens
// are clobbered and a check there passes locally but fails in CI.
const packagedCoreCss = path.join(projectRoot, 'packages', 'css', 'dist', 'turbo-core.css');

// Strict WCAG AA normal-text gate for primary CTA labels (4.5:1).
// `--gradient-primary` blends brand.primary → state.info; ink must clear both stops.
const WCAG_AA_NORMAL = 4.5;

// Interior samples taken along the ramp; mirrors scripts/normalize-wcag-aa-tokens.mjs.
const GRADIENT_SAMPLES = 20;

/** Parse a `#rgb`/`#rrggbb` colour into 0-255 channels. */
function hexToRgb(hex: string): [number, number, number] {
	const raw = hex.replace('#', '');
	// Mirrors the guard in scripts/normalize-wcag-aa-tokens.mjs: an 8-digit
	// alpha hex or a non-hex value would parse to NaN channels and make every
	// downstream assertion vacuously pass instead of failing loudly.
	if (!/^([0-9a-f]{3}|[0-9a-f]{6})$/i.test(raw)) {
		throw new Error(`unsupported color value: ${hex}`);
	}
	const full =
		raw.length === 3
			? raw
					.split('')
					.map((c) => c + c)
					.join('')
			: raw;
	return [0, 2, 4].map((i) => Number.parseInt(full.slice(i, i + 2), 16)) as [number, number, number];
}

/**
 * Blend two colours in sRGB, matching how browsers interpolate a
 * `linear-gradient()` between two opaque stops.
 *
 * @param from - Gradient start colour
 * @param to - Gradient end colour
 * @param position - Fraction along the ramp, 0..1
 * @returns The blended colour as `#rrggbb`
 */
function mixHex(from: string, to: string, position: number): string {
	const a = hexToRgb(from);
	const b = hexToRgb(to);
	return `#${a
		.map((channel, i) =>
			Math.round(channel + (b[i] - channel) * position)
				.toString(16)
				.padStart(2, '0'),
		)
		.join('')}`;
}

/**
 * Regression gate for #752. `--turbo-text-on-brand` is the ink for any surface
 * painted with `--gradient-primary`. It resolves per theme to the audited
 * `brand.primaryText` token, which `scripts/normalize-wcag-aa-tokens.mjs`
 * gates against BOTH gradient stops — so this suite asserts the same pair for
 * every theme, in both polarities, rather than only the brand-primary stop.
 */
describe('Text-on-brand (gradient CTA) contrast', () => {
	it('ships --turbo-text-on-brand in the packaged core CSS', () => {
		const core = fs.readFileSync(packagedCoreCss, 'utf8');
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
		// Keep in step with the flavor count documented in
		// test/integration/bundle-size.test.ts.
		expect(flavors.length).toBeGreaterThanOrEqual(43);
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

			it('primary CTA ink meets WCAG AA everywhere along the gradient', () => {
				// The endpoints are not sufficient. When the ink's luminance falls
				// between the two stops', an interior point of the ramp matches it and
				// contrast collapses there — gruvbox-light-soft cleared 4.75:1 and
				// 4.79:1 at the ends while dipping to 4.46:1 at 60% along.
				let worst = Number.POSITIVE_INFINITY;
				let worstAt = 0;
				for (let i = 0; i <= GRADIENT_SAMPLES; i++) {
					const position = i / GRADIENT_SAMPLES;
					const ratio = getContrastRatio(textColor as string, mixHex(brand, info, position));
					if (ratio < worst) {
						worst = ratio;
						worstAt = position;
					}
				}
				expect(
					worst,
					`${flavor.id}: worst gradient contrast ${worst.toFixed(2)}:1 < ${WCAG_AA_NORMAL}:1 at ${(worstAt * 100).toFixed(0)}% along ${brand} → ${info} (fg ${textColor})`,
				).toBeGreaterThanOrEqual(WCAG_AA_NORMAL);
			});
		});
	}
});
