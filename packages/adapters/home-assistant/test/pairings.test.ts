import { describe, expect, it } from 'vitest';
import { getTheme } from '@lgtm-hq/turbo-themes-core';
import {
  AUTO_THEME_PAIRINGS,
  assertPairingsValid,
  resolveAutoTheme,
  type AutoThemePairing,
} from '../src/pairings.js';

describe('AUTO_THEME_PAIRINGS', () => {
  it('defines eight vendor pairings', () => {
    expect(AUTO_THEME_PAIRINGS).toHaveLength(8);
  });

  it('references only registry ids with the correct appearance', () => {
    for (const { name, dark, light } of AUTO_THEME_PAIRINGS) {
      expect(getTheme(dark)?.appearance, `${name} dark`).toBe('dark');
      expect(getTheme(light)?.appearance, `${name} light`).toBe('light');
    }
  });
});

describe('assertPairingsValid', () => {
  it('passes for the built-in pairings', () => {
    expect(() => assertPairingsValid()).not.toThrow();
  });

  it('throws when a dark slot id does not exist', () => {
    const bad: AutoThemePairing[] = [{ name: 'Broken', dark: 'no-such-theme', light: 'one-light' }];
    expect(() => assertPairingsValid(bad)).toThrow(/unknown dark theme id "no-such-theme"/);
  });

  it('throws when a light slot id does not exist', () => {
    const bad: AutoThemePairing[] = [{ name: 'Broken', dark: 'one-dark', light: 'no-such-theme' }];
    expect(() => assertPairingsValid(bad)).toThrow(/unknown light theme id "no-such-theme"/);
  });

  it('throws when the dark slot holds a light theme', () => {
    const bad: AutoThemePairing[] = [{ name: 'Flipped', dark: 'one-light', light: 'one-light' }];
    expect(() => assertPairingsValid(bad)).toThrow(/dark slot "one-light" has appearance "light"/);
  });

  it('throws when the light slot holds a dark theme', () => {
    const bad: AutoThemePairing[] = [{ name: 'Flipped', dark: 'one-dark', light: 'one-dark' }];
    expect(() => assertPairingsValid(bad)).toThrow(/light slot "one-dark" has appearance "dark"/);
  });
});

describe('resolveAutoTheme', () => {
  it('returns the resolved dark and light tokens', () => {
    const pairing = AUTO_THEME_PAIRINGS[0];
    expect(pairing).toBeDefined();
    const resolved = resolveAutoTheme(pairing as AutoThemePairing);
    expect(resolved.name).toBe(pairing?.name);
    expect(resolved.darkTokens).toBe(getTheme(pairing?.dark as string)?.tokens);
    expect(resolved.lightTokens).toBe(getTheme(pairing?.light as string)?.tokens);
  });
});
