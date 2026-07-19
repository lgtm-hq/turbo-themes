import { describe, expect, it } from 'vitest';
import { flavors } from '@lgtm-hq/turbo-themes-core';
import { hexToRgbTriplet } from '../src/color.js';
import { CARD_MOD_THEME, mapTokensToHomeAssistant, REQUIRED_KEYS } from '../src/mapping.js';

const sample = flavors.find((f) => f.id === 'catppuccin-mocha');
if (!sample) {
  throw new Error('Expected catppuccin-mocha to exist in the registry');
}
const mapping = mapTokensToHomeAssistant(sample.tokens);

describe('REQUIRED_KEYS', () => {
  it('lists at least 80 keys', () => {
    expect(REQUIRED_KEYS.length).toBeGreaterThanOrEqual(80);
  });

  it('has no duplicate keys', () => {
    expect(new Set(REQUIRED_KEYS).size).toBe(REQUIRED_KEYS.length);
  });
});

describe('mapTokensToHomeAssistant', () => {
  it('emits exactly the REQUIRED_KEYS in the same order for every theme', () => {
    for (const flavor of flavors) {
      expect(Object.keys(mapTokensToHomeAssistant(flavor.tokens))).toEqual([...REQUIRED_KEYS]);
    }
  });

  it('produces only non-empty string values', () => {
    for (const flavor of flavors) {
      for (const [key, value] of Object.entries(mapTokensToHomeAssistant(flavor.tokens))) {
        expect(typeof value, key).toBe('string');
        expect(value.length, key).toBeGreaterThan(0);
      }
    }
  });

  it('never emits CSS var() references', () => {
    for (const flavor of flavors) {
      for (const value of Object.values(mapTokensToHomeAssistant(flavor.tokens))) {
        expect(value).not.toContain('var(');
      }
    }
  });

  it('maps core palette variables from tokens', () => {
    expect(mapping['primary-color']).toBe(sample.tokens.brand.primary);
    expect(mapping['accent-color']).toBe(sample.tokens.accent.link);
    expect(mapping['primary-background-color']).toBe(sample.tokens.background.base);
    expect(mapping['card-background-color']).toBe(sample.tokens.background.surface);
    expect(mapping['primary-text-color']).toBe(sample.tokens.text.primary);
    expect(mapping['text-primary-color']).toBe(sample.tokens.text.inverse);
    expect(mapping['error-color']).toBe(sample.tokens.state.danger);
  });

  it('derives rgb-* triplets from the matching hex source', () => {
    expect(mapping['rgb-primary-color']).toBe(hexToRgbTriplet(sample.tokens.brand.primary));
    expect(mapping['rgb-accent-color']).toBe(hexToRgbTriplet(sample.tokens.accent.link));
    expect(mapping['rgb-card-background-color']).toBe(
      hexToRgbTriplet(sample.tokens.background.surface),
    );
    expect(mapping['rgb-primary-text-color']).toBe(hexToRgbTriplet(sample.tokens.text.primary));
    expect(mapping['rgb-text-primary-color']).toBe(hexToRgbTriplet(sample.tokens.text.inverse));
    expect(mapping['rgb-error-color']).toBe(hexToRgbTriplet(sample.tokens.state.danger));
  });

  it('emits every rgb-* value as a bare "R, G, B" triplet', () => {
    for (const [key, value] of Object.entries(mapping)) {
      if (key.startsWith('rgb-')) {
        expect(value, key).toMatch(/^\d{1,3}, \d{1,3}, \d{1,3}$/);
      }
    }
  });

  it('sets the inert card-mod hook to a fixed constant', () => {
    expect(mapping['card-mod-theme']).toBe(CARD_MOD_THEME);
    expect(CARD_MOD_THEME).toBe('turbo-themes');
  });
});
