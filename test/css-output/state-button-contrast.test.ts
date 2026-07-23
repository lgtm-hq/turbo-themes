import { describe, expect, it } from 'vitest';

import { flavors } from '../../packages/core/src/tokens/index';
import { getContrastRatio } from './test-utils';

// Strict WCAG AA normal-text gate for state button labels (4.5:1).
const WCAG_AA_NORMAL = 4.5;
const stateKeys = ['info', 'success', 'warning', 'danger'] as const;

describe('State button text contrast', () => {
	for (const flavor of flavors) {
		describe(flavor.id, () => {
			for (const key of stateKeys) {
				const stateBg = flavor.tokens.state[key];
				const stateTextKey = `${key}Text` as keyof typeof flavor.tokens.state;
				const textColor =
					(flavor.tokens.state[stateTextKey] as string | undefined) ??
					flavor.tokens.text.inverse;

				it(`${key} button meets WCAG AA normal text (4.5:1)`, () => {
					const ratio = getContrastRatio(textColor, stateBg);
					expect(
						ratio,
						`${flavor.id} ${key}: contrast ${ratio.toFixed(2)}:1 < ${WCAG_AA_NORMAL}:1 (fg ${textColor} on ${stateBg})`,
					).toBeGreaterThanOrEqual(WCAG_AA_NORMAL);
				});
			}
		});
	}
});
