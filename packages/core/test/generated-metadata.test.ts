/**
 * Tests for build-time generated theme metadata maps (#499).
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  THEME_IDS,
  THEME_DESCRIPTIONS,
  THEME_ICONS,
  VENDOR_ORDER,
  VENDOR_ICONS,
  VENDOR_FAMILY_META,
} from '../src/themes/generated/metadata.js';
import { themeIds } from '../src/tokens/index.js';

const REPO_ROOT = join(import.meta.dirname, '..', '..', '..');
const THEMES_DIR = join(REPO_ROOT, 'schema', 'tokens', 'themes');
const ASSETS_IMG = join(REPO_ROOT, 'assets', 'img');

describe('generated metadata', () => {
  it('THEME_IDS matches themeIds from tokens', () => {
    expect([...THEME_IDS]).toEqual([...themeIds]);
  });

  it('covers all 24 theme token files', () => {
    const files = readdirSync(THEMES_DIR).filter((f) => f.endsWith('.tokens.json'));
    expect(THEME_IDS).toHaveLength(24);
    expect(THEME_IDS).toHaveLength(files.length);
  });

  it('every theme has a description and icon', () => {
    for (const id of THEME_IDS) {
      expect(THEME_DESCRIPTIONS[id]?.length, `missing description for ${id}`).toBeGreaterThan(0);
      expect(THEME_ICONS[id]?.length, `missing icon for ${id}`).toBeGreaterThan(0);
    }
  });

  it('every theme icon file exists under assets/img/', () => {
    for (const id of THEME_IDS) {
      const icon = THEME_ICONS[id];
      expect(existsSync(join(ASSETS_IMG, icon)), `missing ${icon} for ${id}`).toBe(true);
    }
  });

  it('VENDOR_ORDER matches _vendors.json and covers every theme vendor', () => {
    const vendorsFile = JSON.parse(
      readFileSync(join(REPO_ROOT, 'schema', 'tokens', '_vendors.json'), 'utf-8'),
    ) as { vendors: { id: string }[] };
    expect([...VENDOR_ORDER]).toEqual(vendorsFile.vendors.map((v) => v.id));

    const themeVendors = new Set(
      readdirSync(THEMES_DIR)
        .filter((f) => f.endsWith('.tokens.json'))
        .map((f) => {
          const data = JSON.parse(readFileSync(join(THEMES_DIR, f), 'utf-8')) as {
            vendor: string;
          };
          return data.vendor;
        }),
    );
    expect(new Set(VENDOR_ORDER)).toEqual(themeVendors);
  });

  it('every vendor has family meta and icons', () => {
    for (const id of VENDOR_ORDER) {
      expect(VENDOR_FAMILY_META[id]?.name).toBeTruthy();
      expect(VENDOR_FAMILY_META[id]?.description).toBeTruthy();
      expect(VENDOR_ICONS[id]).toBeDefined();
    }
  });

  it('generated file is marked as auto-generated', () => {
    const source = readFileSync(
      join(REPO_ROOT, 'packages', 'core', 'src', 'themes', 'generated', 'metadata.ts'),
      'utf-8',
    );
    expect(source).toContain('AUTO-GENERATED FILE');
    expect(source).toContain('generate-metadata.mjs');
  });
});
