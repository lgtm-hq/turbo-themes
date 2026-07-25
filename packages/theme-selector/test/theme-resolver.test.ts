// SPDX-License-Identifier: MIT
/**
 * Tests for theme-resolver subset filtering.
 *
 * Validates that getThemes/getValidThemeIds honor ThemeSelectorOptions and
 * that the allowlist precedence (catalog > themes > vendors > all) holds.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { createThemeCatalog, themeSets, flavors } from '@lgtm-hq/turbo-themes-core';
import {
  getThemes,
  getValidThemeIds,
  resolveAllowedThemeIds,
  _resetThemeCache,
} from '../src/theme-resolver.js';

describe('theme-resolver subset filtering', () => {
  afterEach(() => {
    _resetThemeCache();
  });

  describe('no options (backwards compatible)', () => {
    it('getThemes returns all themes', () => {
      expect(getThemes()).toHaveLength(flavors.length);
    });

    it('getValidThemeIds returns all IDs', () => {
      expect(getValidThemeIds().size).toBe(flavors.length);
    });

    it('resolveAllowedThemeIds returns null', () => {
      expect(resolveAllowedThemeIds()).toBeNull();
      expect(resolveAllowedThemeIds({})).toBeNull();
    });
  });

  describe('vendors option', () => {
    it("vendors: ['catppuccin'] includes all catppuccin variants", () => {
      const expected = flavors.filter((f) => f.vendor === 'catppuccin').map((f) => f.id);
      const themes = getThemes({ vendors: ['catppuccin'] });
      expect(themes.map((t) => t.id)).toEqual(expected);
      expect(expected.length).toBeGreaterThan(1);
    });

    it('getValidThemeIds is restricted to the vendor', () => {
      const ids = getValidThemeIds({ vendors: ['catppuccin'] });
      expect([...ids].every((id) => id.startsWith('catppuccin'))).toBe(true);
    });
  });

  describe('explicit themes option', () => {
    it('filters to the listed IDs in canonical order', () => {
      const themes = getThemes({ themes: ['github-dark', 'dracula'] });
      expect(themes.map((t) => t.id)).toEqual(['dracula', 'github-dark']);
    });

    it('drops unknown IDs from the valid set', () => {
      const ids = getValidThemeIds({ themes: ['dracula', 'not-a-real-theme'] });
      expect([...ids]).toEqual(['dracula']);
    });
  });

  describe('catalog option', () => {
    it('themeSets.minimal exposes only its four themes', () => {
      const themes = getThemes({ catalog: themeSets.minimal });
      expect(themes.map((t) => t.id).sort()).toEqual([...themeSets.minimal.themeIds].sort());
      expect(themes).toHaveLength(4);
    });

    it('catalog wins over themes and vendors', () => {
      const catalog = createThemeCatalog({ vendors: ['nord'] });
      const themes = getThemes({
        catalog,
        themes: ['dracula'],
        vendors: ['catppuccin'],
      });
      expect(themes.map((t) => t.id)).toEqual([...catalog.themeIds]);
    });
  });

  it('themes wins over vendors', () => {
    const themes = getThemes({ themes: ['dracula'], vendors: ['catppuccin'] });
    expect(themes.map((t) => t.id)).toEqual(['dracula']);
  });
});
