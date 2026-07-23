import { describe, expect, it } from 'vitest';

import { flavors } from '../../packages/core/src/tokens/index';
import { getContrastRatio } from './test-utils';

// Strict WCAG AA normal-text gate for primary CTA labels (4.5:1).
// `--gradient-primary` blends brand.primary → state.info; ink must clear both stops.
const WCAG_AA_NORMAL = 4.5;

describe('Brand button text contrast', () => {
	for (const flavor of flavors) {
		describe(flavor.id, () => {
			const brand = flavor.tokens.brand.primary;
			const info = flavor.tokens.state.info;
			const textColor =
				flavor.tokens.brand.primaryText ?? flavor.tokens.text.inverse;

			it('primary CTA ink meets WCAG AA on brand fill', () => {
				const ratio = getContrastRatio(textColor, brand);
				expect(
					ratio,
					`${flavor.id}: brand contrast ${ratio.toFixed(2)}:1 < ${WCAG_AA_NORMAL}:1 (fg ${textColor} on ${brand})`,
				).toBeGreaterThanOrEqual(WCAG_AA_NORMAL);
			});

			it('primary CTA ink meets WCAG AA on gradient end stop (state.info)', () => {
				const ratio = getContrastRatio(textColor, info);
				expect(
					ratio,
					`${flavor.id}: info-stop contrast ${ratio.toFixed(2)}:1 < ${WCAG_AA_NORMAL}:1 (fg ${textColor} on ${info})`,
				).toBeGreaterThanOrEqual(WCAG_AA_NORMAL);
			});
		});
	}
});
