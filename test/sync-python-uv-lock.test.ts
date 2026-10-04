/**
 * Regression for #1079: a version bump must update the editable
 * turbo-themes entry in python/uv.lock and leave every other lock
 * entry untouched (Greptile on release PR #1022).
 */
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';

const {
  rewriteEditableUvLockVersion,
  syncPythonUvLock,
} = await import('../scripts/utils/sync-python-uv-lock.mjs');

const REAL_LOCK = readFileSync(
  join(import.meta.dirname, '..', 'python', 'uv.lock'),
  'utf8',
);

const FIXTURE = `version = 1
revision = 3

[[package]]
name = "assertpy"
version = "1.1"
source = { registry = "https://pypi.org/simple" }

[[package]]
name = "turbo-themes"
version = "0.44.11"
source = { editable = "." }
dependencies = [
    { name = "python-dateutil" },
]

[[package]]
name = "python-dateutil"
version = "2.9.0.post0"
source = { registry = "https://pypi.org/simple" }
`;

function otherPackageVersions(lockText: string): string[] {
  return [...lockText.matchAll(/^name = "((?!turbo-themes).+)"\nversion = "([^"]+)"/gm)].map(
    (match) => `${match[1]}@${match[2]}`,
  );
}

function editableTurboThemesVersion(lockText: string): string | undefined {
  const match = lockText.match(
    /name = "turbo-themes"\nversion = "([^"]+)"\nsource = \{ editable = "\." \}/,
  );
  return match?.[1];
}

function withoutEditableVersion(text: string): string {
  return text.replace(
    /name = "turbo-themes"\nversion = "[^"]+"\nsource = \{ editable = "\." \}/,
    'name = "turbo-themes"\nversion = "<redacted>"\nsource = { editable = "." }',
  );
}

function otherThan(current: string): string {
  return current === '0.0.0-test' ? '0.0.1-test' : '0.0.0-test';
}

describe('rewriteEditableUvLockVersion', () => {
  it('updates the editable turbo-themes version and leaves other entries untouched', () => {
    const { updated, changed, matched } = rewriteEditableUvLockVersion(
      FIXTURE,
      '0.44.12',
    );

    expect(matched).toBe(true);
    expect(changed).toBe(true);
    expect(editableTurboThemesVersion(updated)).toBe('0.44.12');
    expect(otherPackageVersions(updated)).toEqual(otherPackageVersions(FIXTURE));
    expect(updated).toContain('name = "assertpy"\nversion = "1.1"');
    expect(updated).toContain('name = "python-dateutil"\nversion = "2.9.0.post0"');
  });

  it('updates only the editable turbo-themes entry in the committed lockfile', () => {
    const current = editableTurboThemesVersion(REAL_LOCK);
    expect(current).toBeDefined();
    const target = otherThan(current as string);
    const { updated, changed, matched } = rewriteEditableUvLockVersion(
      REAL_LOCK,
      target,
    );

    expect(matched).toBe(true);
    expect(changed).toBe(true);
    expect(editableTurboThemesVersion(updated)).toBe(target);
    expect(otherPackageVersions(updated)).toEqual(otherPackageVersions(REAL_LOCK));
    expect(withoutEditableVersion(updated)).toBe(withoutEditableVersion(REAL_LOCK));
  });

  it('reports no change when the version is already current', () => {
    const { updated, changed, matched } = rewriteEditableUvLockVersion(
      FIXTURE,
      '0.44.11',
    );

    expect(matched).toBe(true);
    expect(changed).toBe(false);
    expect(updated).toBe(FIXTURE);
  });

  it('reports unmatched when the editable entry is missing', () => {
    const { updated, changed, matched } = rewriteEditableUvLockVersion(
      'name = "assertpy"\nversion = "1.1"\n',
      '0.44.12',
    );

    expect(matched).toBe(false);
    expect(changed).toBe(false);
    expect(updated).toBe('name = "assertpy"\nversion = "1.1"\n');
  });
});

describe('syncPythonUvLock', () => {
  let sandbox: string;

  afterEach(() => {
    if (sandbox) {
      rmSync(sandbox, { recursive: true, force: true });
    }
  });

  function writeLock(contents: string): string {
    sandbox = mkdtempSync(join(tmpdir(), 'uv-lock-sync-'));
    writeFileSync(join(sandbox, 'uv.lock'), contents);
    return sandbox;
  }

  it('writes a version bump into uv.lock without touching other entries', () => {
    const pythonDir = writeLock(FIXTURE);
    const logs: string[] = [];

    const result = syncPythonUvLock({
      pythonDir,
      version: '0.44.12',
      log: (msg: string) => {
        logs.push(msg);
      },
    });

    const next = readFileSync(join(pythonDir, 'uv.lock'), 'utf8');
    expect(result).toBe('updated');
    expect(logs).toContain('updated python/uv.lock');
    expect(editableTurboThemesVersion(next)).toBe('0.44.12');
    expect(otherPackageVersions(next)).toEqual(otherPackageVersions(FIXTURE));
    expect(withoutEditableVersion(next)).toBe(withoutEditableVersion(FIXTURE));
  });

  it('is a no-op when the lock already matches', () => {
    const pythonDir = writeLock(FIXTURE);

    const result = syncPythonUvLock({
      pythonDir,
      version: '0.44.11',
      log: () => undefined,
    });

    expect(result).toBe('unchanged');
    expect(readFileSync(join(pythonDir, 'uv.lock'), 'utf8')).toBe(FIXTURE);
  });

  it('throws when the lockfile is missing', () => {
    sandbox = mkdtempSync(join(tmpdir(), 'uv-lock-sync-'));
    mkdirSync(join(sandbox, 'empty'), { recursive: true });

    expect(() =>
      syncPythonUvLock({
        pythonDir: join(sandbox, 'empty'),
        version: '0.44.12',
        log: () => undefined,
      }),
    ).toThrow(/python\/uv.lock not found/);
  });

  it('throws when the editable entry is missing', () => {
    const pythonDir = writeLock('name = "assertpy"\nversion = "1.1"\n');

    expect(() =>
      syncPythonUvLock({
        pythonDir,
        version: '0.44.12',
        log: () => undefined,
      }),
    ).toThrow(/no editable turbo-themes package entry/);
  });
});
