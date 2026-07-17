// SPDX-License-Identifier: MIT
/**
 * Drift-prevention test: every icon referenced by VENDOR_ICON_MAP and the
 * buildThemeIconSrc fallback must exist on disk AND be matched by the
 * `files` glob in the root package.json.
 *
 * Prevents the npm tarball from shipping without the icons it references.
 */
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';
import { VENDOR_ICON_MAP, type AppearanceIcons } from '../src/theme-mapper.js';

const require = createRequire(import.meta.url);

// Repo root is 3 levels up from packages/theme-selector/test/
const REPO_ROOT = join(import.meta.dirname, '..', '..', '..');

/** Fallback icon used by buildThemeIconSrc when no themeIcons entry exists */
const FALLBACK_ICON = 'catppuccin-logo-macchiato.png';

/** Globs from package.json `files` that should cover assets/img/ */
const IMG_GLOBS = ['assets/img/*.png', 'assets/img/*.webp'];

function isAppearanceIcons(v: string | AppearanceIcons): v is AppearanceIcons {
  return typeof v === 'object' && v !== null && 'light' in v && 'dark' in v;
}

/** Collect every relative path referenced in VENDOR_ICON_MAP */
function collectIconPaths(): string[] {
  const paths = new Set<string>();
  paths.add(`assets/img/${FALLBACK_ICON}`);
  for (const config of Object.values(VENDOR_ICON_MAP)) {
    if (typeof config === 'string') {
      paths.add(config);
    } else if (isAppearanceIcons(config)) {
      paths.add(config.light);
      paths.add(config.dark);
    }
  }
  return [...paths];
}

/** Check whether a relative asset path is covered by the files globs */
function coveredByFilesGlob(relativePath: string): boolean {
  // Simple glob match: `assets/img/*.ext` covers any file directly in assets/img/
  return IMG_GLOBS.some(glob => {
    const prefix = glob.slice(0, glob.lastIndexOf('/') + 1); // "assets/img/"
    const suffix = glob.slice(glob.lastIndexOf('*') + 1); // ".png" or ".webp"
    return relativePath.startsWith(prefix) && relativePath.endsWith(suffix);
  });
}

describe('icon npm packaging', () => {
  const iconPaths = collectIconPaths();

  it('VENDOR_ICON_MAP references at least the core icon set', () => {
    expect(iconPaths.length).toBeGreaterThanOrEqual(10);
  });

  it.each(iconPaths)('icon file exists on disk: %s', (iconPath) => {
    const absPath = join(REPO_ROOT, iconPath);
    expect(existsSync(absPath), `Expected ${iconPath} to exist at ${absPath}`).toBe(true);
  });

  it.each(iconPaths)('icon path is covered by package.json files glob: %s', (iconPath) => {
    expect(coveredByFilesGlob(iconPath), `Expected ${iconPath} to match one of ${IMG_GLOBS.join(', ')}`).toBe(true);
  });

  it('package.json files field contains assets/img/*.png', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pkg = require(join(REPO_ROOT, 'package.json')) as { files: string[] };
    expect(pkg.files).toContain('assets/img/*.png');
  });

  it('package.json files field contains assets/img/*.webp', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pkg = require(join(REPO_ROOT, 'package.json')) as { files: string[] };
    expect(pkg.files).toContain('assets/img/*.webp');
  });
});
