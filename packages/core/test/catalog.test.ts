import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createThemeCatalog } from '../src/catalog/index.js';
import { themeSets } from '../src/catalog/sets.js';
import { flavors, packages, themeIds } from '../src/tokens/index.js';
import { THEME_IDS } from '../src/themes/theme-ids.js';

describe('createThemeCatalog', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    warnSpy.mockRestore();
  });

  it('returns the full catalog when no options are given', () => {
    const catalog = createThemeCatalog();
    expect(catalog.themeIds).toEqual(themeIds);
    expect(catalog.flavors).toHaveLength(flavors.length);
    expect(catalog.vendorGroups.length).toBeGreaterThan(0);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('preserves canonical order regardless of option order', () => {
    const catalog = createThemeCatalog({
      include: ['github-dark', 'catppuccin-mocha'],
      vendors: [],
    });
    expect(catalog.themeIds).toEqual(['catppuccin-mocha', 'github-dark']);
  });

  describe('vendor filtering', () => {
    it('keeps only themes from the requested vendors', () => {
      const catalog = createThemeCatalog({ vendors: ['catppuccin', 'dracula'] });
      const vendorsSeen = new Set(catalog.flavors.map((f) => f.vendor));
      expect(vendorsSeen).toEqual(new Set(['catppuccin', 'dracula']));
    });

    it('opting into a vendor includes all of its variants', () => {
      const catalog = createThemeCatalog({ vendors: ['catppuccin'] });
      const expected = flavors.filter((f) => f.vendor === 'catppuccin').map((f) => f.id);
      expect(catalog.themeIds).toEqual(expected);
      expect(expected.length).toBeGreaterThan(1);
    });

    it('treats an empty vendors array as selecting no themes', () => {
      const catalog = createThemeCatalog({ vendors: [] });
      expect(catalog.themeIds).toEqual([]);
      expect(catalog.vendorGroups).toEqual([]);
    });
  });

  describe('appearance filtering', () => {
    it.each(['light', 'dark'] as const)('filters to %s themes', (appearance) => {
      const catalog = createThemeCatalog({ appearances: [appearance] });
      expect(catalog.flavors.length).toBeGreaterThan(0);
      catalog.flavors.forEach((f) => expect(f.appearance).toBe(appearance));
    });

    it('combines vendor and appearance filters (intersection)', () => {
      const catalog = createThemeCatalog({ vendors: ['gruvbox'], appearances: ['light'] });
      catalog.flavors.forEach((f) => {
        expect(f.vendor).toBe('gruvbox');
        expect(f.appearance).toBe('light');
      });
      expect(catalog.themeIds).toContain('gruvbox-light');
      expect(catalog.themeIds).not.toContain('gruvbox-dark');
    });
  });

  describe('include', () => {
    it('adds explicit themes on top of the vendor-filtered set', () => {
      const catalog = createThemeCatalog({ vendors: ['dracula'], include: ['nord'] });
      expect(catalog.themeIds).toContain('dracula');
      expect(catalog.themeIds).toContain('nord');
    });

    it('does not duplicate a theme already present', () => {
      const catalog = createThemeCatalog({ vendors: ['nord'], include: ['nord'] });
      expect(catalog.themeIds).toEqual(['nord']);
    });

    it('warns but continues when given an invalid ID', () => {
      const catalog = createThemeCatalog({ vendors: [], include: ['nord', 'not-a-theme'] });
      expect(catalog.themeIds).toEqual(['nord']);
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy.mock.calls[0]?.[0]).toContain('not-a-theme');
    });
  });

  describe('exclude', () => {
    it('removes a theme from the vendor-filtered set', () => {
      const catalog = createThemeCatalog({
        vendors: ['gruvbox'],
        exclude: ['gruvbox-dark-hard'],
      });
      expect(catalog.themeIds).not.toContain('gruvbox-dark-hard');
      expect(catalog.themeIds).toContain('gruvbox-dark');
    });

    it('applies after include so exclude wins', () => {
      const catalog = createThemeCatalog({
        vendors: [],
        include: ['nord'],
        exclude: ['nord'],
      });
      expect(catalog.themeIds).toEqual([]);
    });

    it('warns but continues when given an invalid ID', () => {
      const catalog = createThemeCatalog({ exclude: ['not-a-theme'] });
      expect(catalog.themeIds).toEqual(themeIds);
      expect(warnSpy).toHaveBeenCalledTimes(1);
      expect(warnSpy.mock.calls[0]?.[0]).toContain('not-a-theme');
    });
  });

  describe('vendorGroups', () => {
    it('restricts groups to the selected themes and drops empty groups', () => {
      const catalog = createThemeCatalog({ vendors: ['catppuccin'] });
      expect(catalog.vendorGroups).toHaveLength(1);
      const group = catalog.vendorGroups[0]!;
      expect(group.id).toBe('catppuccin');
      expect(group.themeIds.every((id) => id.startsWith('catppuccin'))).toBe(true);
    });
  });

  it('does not warn when include/exclude are empty', () => {
    createThemeCatalog({ vendors: ['nord'] });
    expect(warnSpy).not.toHaveBeenCalled();
  });
});

describe('themeSets', () => {
  it('minimal contains exactly the curated four IDs', () => {
    expect(themeSets.minimal.themeIds).toEqual([
      'catppuccin-latte',
      'catppuccin-mocha',
      'github-dark',
      'github-light',
    ]);
  });

  it('dark and light partition the catalog by appearance', () => {
    themeSets.dark.flavors.forEach((f) => expect(f.appearance).toBe('dark'));
    themeSets.light.flavors.forEach((f) => expect(f.appearance).toBe('light'));
    expect(themeSets.dark.themeIds.length + themeSets.light.themeIds.length).toBe(flavors.length);
  });

  it('exposes a set per vendor that includes all vendor variants', () => {
    for (const vendor of Object.keys(packages)) {
      const set = themeSets[vendor];
      expect(set).toBeDefined();
      const expected = flavors.filter((f) => f.vendor === vendor).map((f) => f.id);
      expect(set?.themeIds).toEqual(expected);
    }
  });
});

describe('THEME_IDS', () => {
  it('matches the runtime themeIds list', () => {
    expect([...THEME_IDS]).toEqual(themeIds);
  });
});
