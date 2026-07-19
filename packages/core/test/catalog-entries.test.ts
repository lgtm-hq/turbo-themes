import { describe, expect, it } from 'vitest';
import { catalog, catalogById } from '../src/catalog/index.js';
import { flavors, themeIds } from '../src/tokens/index.js';

/** Mirror of theme-selector extractPreviewColors for cross-check. */
function extractPreviewColors(tokens: (typeof flavors)[number]['tokens']) {
  return {
    bg: tokens.background.base,
    surface: tokens.background.surface,
    accent: tokens.brand.primary,
    text: tokens.text.primary,
  };
}

describe('catalog', () => {
  it('has an entry for every theme in tokens.json', () => {
    expect(catalog.map((entry) => entry.id)).toEqual([...themeIds]);
    expect(catalog).toHaveLength(flavors.length);
  });

  it('entries expose picker metadata without full tokens', () => {
    catalog.forEach((entry) => {
      expect(entry).toEqual(
        expect.objectContaining({
          id: expect.any(String),
          label: expect.any(String),
          vendor: expect.any(String),
          appearance: expect.stringMatching(/^(light|dark)$/),
          preview: {
            bg: expect.any(String),
            surface: expect.any(String),
            accent: expect.any(String),
            text: expect.any(String),
          },
        }),
      );
      expect(entry).not.toHaveProperty('tokens');
    });
  });

  it('preview colors match extractPreviewColors for sample themes', () => {
    const sampleIds = ['catppuccin-mocha', 'github-light', 'dracula', 'nord'];
    for (const id of sampleIds) {
      const flavor = flavors.find((f) => f.id === id);
      const entry = catalogById[id];
      expect(flavor).toBeDefined();
      expect(entry).toBeDefined();
      expect(entry!.preview).toEqual(extractPreviewColors(flavor!.tokens));
      expect(entry!.label).toBe(flavor!.label);
      expect(entry!.vendor).toBe(flavor!.vendor);
      expect(entry!.appearance).toBe(flavor!.appearance);
    }
  });

  it('catalogById indexes every entry', () => {
    expect(Object.keys(catalogById)).toHaveLength(catalog.length);
    catalog.forEach((entry) => {
      expect(catalogById[entry.id]).toBe(entry);
    });
  });

  it('shares filterable fields with ThemeFlavor for createThemeCatalog compatibility', () => {
    // Slim entries carry the same id/vendor/appearance keys that createThemeCatalog
    // (#495) filters on, so UI-only consumers can apply the same selection rules.
    const filterable = ['id', 'vendor', 'appearance'] as const;
    catalog.forEach((entry, index) => {
      const flavor = flavors[index]!;
      for (const key of filterable) {
        expect(entry[key]).toBe(flavor[key]);
      }
    });
  });
});
