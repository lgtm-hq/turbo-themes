import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { describe, expect, it } from 'vitest';

// Each install root owns its lockfile; workspace overrides cannot protect tools/docs.
const installRoots = ['.', 'tools/docs'];

function lockedVersions(root: string, name: string): string[] {
  const lock = readFileSync(resolve(root, 'bun.lock'), 'utf8');
  return [...lock.matchAll(/\["([^"@]+)@([^"]+)"/g)]
    .filter((match) => match[1] === name)
    .map((match) => {
      expect(match[2], 'security locks must use stable exact versions').toMatch(/^\d+\.\d+\.\d+$/);
      return match[2];
    });
}

describe('security-sensitive glob dependencies', () => {
  it.each(installRoots)('%s contains no minimatch affected by GHSA-g3hv-75wg-m249', (root) => {
    const versions = lockedVersions(root, 'minimatch');
    expect(versions.length).toBeGreaterThan(0);
    for (const version of versions) {
      const [major, minor, patch] = version.split('.').map(Number);
      expect(major > 11 || (major === 11 && (minor > 0 || patch >= 1)), version).toBe(true);
    }
  });

  it('contains no glob affected by GHSA-3g3m-2fjr-6pw4', () => {
    const versions = lockedVersions('.', 'glob');
    expect(versions.length).toBeGreaterThan(0);
    for (const version of versions) {
      const [major, minor, patch] = version.split('.').map(Number);
      expect(major < 9 || major > 14 || (major === 14 && (minor > 0 || patch >= 2)), version).toBe(true);
    }
  });

  it.each(['require', 'import'] as const)(
    'bounds preprocessing inside the actual %s bundle of modern glob',
    async (condition) => {
      const require = createRequire(import.meta.url);
      const sdRequire = createRequire(require.resolve('style-dictionary'));
      const bundledRequire = createRequire(sdRequire.resolve('@bundled-es-modules/glob'));
      const manifestPath = bundledRequire.resolve('glob/package.json');
      const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
      const entry = manifest.exports['.'][condition].default;
      const { Glob } =
        condition === 'require'
          ? bundledRequire('glob')
          : await import(pathToFileURL(resolve(dirname(manifestPath), entry)).href);
      // Both default exports embed minimatch; a clean external lock is insufficient.
      const glob = new Glob('**/../a/b/**/../c/d/**/../e/f/x', { braceExpandMax: 4 });
      expect(glob.patterns.length).toBeLessThanOrEqual(4);
    }
  );

  it('preserves legacy glob matching and rimraf cleanup with patched minimatch', async () => {
    // Follow the actual LHCI -> chrome-launcher -> rimraf graph, not a system glob.
    const require = createRequire(import.meta.url);
    const lhciRequire = createRequire(require.resolve('@lhci/cli/package.json'));
    const launcherRequire = createRequire(lhciRequire.resolve('chrome-launcher'));
    const rimrafRequire = createRequire(launcherRequire.resolve('rimraf'));
    const glob = rimrafRequire('glob');
    const globRequire = createRequire(rimrafRequire.resolve('glob'));
    expect(rimrafRequire('glob/package.json').version).toBe('7.2.3');
    expect(globRequire('minimatch/package.json').version).toBe('11.0.4');

    const root = mkdtempSync(join(process.env.TMPDIR || tmpdir(), 'legacy-glob-'));
    try {
      mkdirSync(join(root, 'nested'));
      mkdirSync(join(root, 'skip'));
      for (const name of ['nested/visible.json', 'nested/keep.ts', 'nested/.hidden.json', 'skip/no.json']) {
        writeFileSync(join(root, name), '{}');
      }
      const options = { cwd: root, ignore: ['skip/**'] };
      const expected = ['nested/keep.ts', 'nested/visible.json'];
      expect(glob.sync('**/*.{json,ts}', options)).toEqual(expected);
      const files = await new Promise((accept, reject) => {
        glob('**/*.{json,ts}', options, (error: Error | null, matches: string[]) => {
          if (error) reject(error);
          else accept(matches);
        });
      });
      expect(files).toEqual(expected);
      launcherRequire('rimraf').sync(join(root, '**/visible.json'));
      expect(glob.sync('**/visible.json', { cwd: root })).toEqual([]);
      expect(glob.sync('**/.hidden.json', { cwd: root })).toEqual(['nested/.hidden.json']);
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });
});
