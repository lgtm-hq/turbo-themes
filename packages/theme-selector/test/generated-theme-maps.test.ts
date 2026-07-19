/**
 * Tests for build-time generated selector theme maps (#499).
 */
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  THEME_FAMILIES,
  VENDOR_FAMILY_MAP,
  VENDOR_ICON_MAP,
  FLAVOR_DESCRIPTIONS,
  type AppearanceIcons,
} from '../src/generated/theme-maps.js';
import { THEME_IDS, VENDOR_ORDER } from '../../core/src/themes/generated/metadata.js';

const REPO_ROOT = join(import.meta.dirname, '..', '..', '..');

function isAppearanceIcons(v: string | AppearanceIcons): v is AppearanceIcons {
  return typeof v === 'object' && v !== null && 'light' in v && 'dark' in v;
}

describe('generated theme maps', () => {
  it('THEME_FAMILIES covers every vendor in VENDOR_ORDER', () => {
    expect(Object.keys(THEME_FAMILIES).sort()).toEqual([...VENDOR_ORDER].sort());
  });

  it('VENDOR_FAMILY_MAP maps each vendor to itself', () => {
    for (const id of VENDOR_ORDER) {
      expect(VENDOR_FAMILY_MAP[id]).toBe(id);
    }
  });

  it('FLAVOR_DESCRIPTIONS covers all theme IDs', () => {
    expect(Object.keys(FLAVOR_DESCRIPTIONS).sort()).toEqual([...THEME_IDS].sort());
    for (const id of THEME_IDS) {
      expect(FLAVOR_DESCRIPTIONS[id]?.length).toBeGreaterThan(0);
    }
  });

  it('VENDOR_ICON_MAP paths use assets/img/ and exist on disk', () => {
    for (const id of VENDOR_ORDER) {
      const config = VENDOR_ICON_MAP[id];
      expect(config, `missing icon config for ${id}`).toBeDefined();
      const paths = isAppearanceIcons(config!) ? [config.light, config.dark] : [config!];
      for (const path of paths) {
        expect(path.startsWith('assets/img/')).toBe(true);
        expect(existsSync(join(REPO_ROOT, path)), `missing ${path}`).toBe(true);
      }
    }
  });

  it('generated file is marked as auto-generated', () => {
    const source = readFileSync(
      join(REPO_ROOT, 'packages', 'theme-selector', 'src', 'generated', 'theme-maps.ts'),
      'utf-8',
    );
    expect(source).toContain('AUTO-GENERATED FILE');
    expect(source).toContain('generate-metadata.mjs');
  });
});
