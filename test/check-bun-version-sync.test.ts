import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, test } from 'vitest';

const scriptPath = join(__dirname, '../scripts/ci/check-bun-version-sync.sh');
const DIGEST = `sha256:${'a'.repeat(64)}`;

function runCheck(root?: string): { status: number | null; output: string } {
  const result = spawnSync('bash', root ? [scriptPath, root] : [scriptPath], {
    encoding: 'utf8',
  });
  return { status: result.status, output: `${result.stdout}${result.stderr}` };
}

describe('check-bun-version-sync.sh', () => {
  const tempDirs: string[] = [];

  function fixture(packageManager: string | null, dockerfileLine: string): string {
    const dir = mkdtempSync(join(tmpdir(), 'bun-sync-'));
    tempDirs.push(dir);
    const pkg: Record<string, string> = { name: 'fixture' };
    if (packageManager) pkg.packageManager = packageManager;
    writeFileSync(join(dir, 'package.json'), `${JSON.stringify(pkg, null, 2)}\n`);
    writeFileSync(join(dir, 'Dockerfile'), `FROM debian:bookworm\n${dockerfileLine}\n`);
    return dir;
  }

  afterEach(() => {
    for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true });
  });

  test('passes for the repository Dockerfile and package.json', () => {
    const { status, output } = runCheck();
    expect(output).toContain('match packageManager bun@');
    expect(status).toBe(0);
  });

  test('passes when versions match and the image is digest-pinned', () => {
    const dir = fixture(
      'bun@1.4.2',
      `COPY --from=oven/bun:1.4.2-debian@${DIGEST} /usr/local/bin/bun /usr/local/bin/bun`,
    );
    expect(runCheck(dir).status).toBe(0);
  });

  test('ignores a corepack-style hash suffix on packageManager', () => {
    const dir = fixture(
      `bun@1.4.2+sha512.${'b'.repeat(16)}`,
      `COPY --from=oven/bun:1.4.2-debian@${DIGEST} /usr/local/bin/bun /usr/local/bin/bun`,
    );
    const { status, output } = runCheck(dir);
    expect(output).toContain('packageManager: bun@1.4.2\n');
    expect(status).toBe(0);
  });

  test('fails when the Dockerfile version drifts from packageManager', () => {
    const dir = fixture(
      'bun@1.4.2',
      `COPY --from=oven/bun:1.3.11-debian@${DIGEST} /usr/local/bin/bun /usr/local/bin/bun`,
    );
    const { status, output } = runCheck(dir);
    expect(status).toBe(1);
    expect(output).toContain('Dockerfile uses 1.3.11, package.json pins 1.4.2');
  });

  test('fails when the oven/bun image is not pinned by digest', () => {
    const dir = fixture(
      'bun@1.4.2',
      'COPY --from=oven/bun:1.4.2-debian /usr/local/bin/bun /usr/local/bin/bun',
    );
    const { status, output } = runCheck(dir);
    expect(status).toBe(1);
    expect(output).toContain('pinned by digest');
  });

  test.each([
    ['a non-semver tag', `oven/bun:latest@${DIGEST}`],
    ['a major.minor-only tag', `oven/bun:1.4-debian@${DIGEST}`],
    ['a truncated digest', 'oven/bun:1.4.2-debian@sha256:abc123'],
  ])('fails with a clear error for %s', (_label, imageRef) => {
    const dir = fixture('bun@1.4.2', `COPY --from=${imageRef} /usr/local/bin/bun /usr/local/bin/bun`);
    const { status, output } = runCheck(dir);
    expect(status).toBe(1);
    expect(output).toContain(`Unrecognised Dockerfile oven/bun reference: ${imageRef}`);
    expect(output).toContain('Expected oven/bun:<semver>[-variant]@sha256:<digest>');
    expect(output).not.toContain('Bun version mismatch');
  });

  describe('parses only active Dockerfile instructions and checks every reference', () => {
    const GOOD = `oven/bun:1.4.2-debian@${DIGEST}`;
    const BAD = `oven/bun:1.3.11-debian@${DIGEST}`;

    test('a matching reference in a comment does not mask a mismatched COPY', () => {
      const dir = fixture(
        'bun@1.4.2',
        [`# Pinned: COPY --from=${GOOD}`, `COPY --from=${BAD} /usr/local/bin/bun /usr/local/bin/bun`].join(
          '\n',
        ),
      );
      const { status, output } = runCheck(dir);
      expect(status).toBe(1);
      expect(output).toContain('Dockerfile uses 1.3.11, package.json pins 1.4.2');
      expect(output).toContain('Dockerfile oven/bun references: 1\n');
    });

    test('an indented comment is ignored', () => {
      const dir = fixture(
        'bun@1.4.2',
        [`   # old: ${BAD}`, `COPY --from=${GOOD} /usr/local/bin/bun /usr/local/bin/bun`].join('\n'),
      );
      const { status, output } = runCheck(dir);
      expect(status).toBe(0);
      expect(output).toContain('Dockerfile oven/bun references: 1\n');
    });

    test('fails when one of several references is mismatched', () => {
      const dir = fixture(
        'bun@1.4.2',
        [
          `COPY --from=${GOOD} /usr/local/bin/bun /usr/local/bin/bun`,
          `COPY --from=${BAD} /usr/local/bin/bun /opt/bun`,
        ].join('\n'),
      );
      const { status, output } = runCheck(dir);
      expect(status).toBe(1);
      expect(output).toContain('Dockerfile oven/bun references: 2\n');
      expect(output).toContain('1 invalid oven/bun reference(s)');
    });

    test('checks FROM stages as well as COPY --from', () => {
      const dir = fixture(
        'bun@1.4.2',
        [
          `FROM ${GOOD} AS bun`,
          'FROM debian:bookworm',
          `COPY --from=${BAD} /usr/local/bin/bun /usr/local/bin/bun`,
        ].join('\n'),
      );
      const { status, output } = runCheck(dir);
      expect(status).toBe(1);
      expect(output).toContain('Dockerfile oven/bun references: 2\n');
      expect(output).toContain('Dockerfile uses 1.3.11, package.json pins 1.4.2');
    });

    test('a mismatched FROM stage fails even when COPY matches', () => {
      const dir = fixture(
        'bun@1.4.2',
        [`FROM ${BAD} AS bun`, 'FROM debian:bookworm', `COPY --from=${GOOD} /usr/local/bin/bun /usr/local/bin/bun`].join(
          '\n',
        ),
      );
      expect(runCheck(dir).status).toBe(1);
    });

    test('follows backslash line continuations', () => {
      const dir = fixture(
        'bun@1.4.2',
        ['COPY \\', `  --from=${BAD} \\`, '  /usr/local/bin/bun /usr/local/bin/bun'].join('\n'),
      );
      const { status, output } = runCheck(dir);
      expect(status).toBe(1);
      expect(output).toContain('Dockerfile uses 1.3.11, package.json pins 1.4.2');
    });

    test('tolerates CRLF line endings and a docker.io/ prefix', () => {
      const dir = fixture(
        'bun@1.4.2',
        [`COPY --from=docker.io/${GOOD} /usr/local/bin/bun /usr/local/bin/bun`, 'RUN true'].join('\r\n'),
      );
      expect(runCheck(dir).status).toBe(0);
    });

    test('rejects a tagless oven/bun stage', () => {
      const dir = fixture(
        'bun@1.4.2',
        ['FROM oven/bun AS bun', `COPY --from=${GOOD} /usr/local/bin/bun /usr/local/bin/bun`].join('\n'),
      );
      const { status, output } = runCheck(dir);
      expect(status).toBe(1);
      expect(output).toContain('pinned by digest');
    });
  });

  test.each([
    ['package.json', 'Dockerfile'],
    ['Dockerfile', 'package.json'],
  ])('fails when %s is missing entirely', (missing, present) => {
    const dir = mkdtempSync(join(tmpdir(), 'bun-sync-'));
    tempDirs.push(dir);
    const contents: Record<string, string> = {
      'package.json': '{ "packageManager": "bun@1.4.2" }\n',
      Dockerfile: `COPY --from=oven/bun:1.4.2-debian@${DIGEST} /usr/local/bin/bun /usr/local/bin/bun\n`,
    };
    writeFileSync(join(dir, present), contents[present]);
    const { status, output } = runCheck(dir);
    expect(status).toBe(1);
    expect(output).toContain(`${join(dir, missing)} not found`);
  });

  test('fails when package.json has no bun packageManager', () => {
    const dir = fixture(
      null,
      `COPY --from=oven/bun:1.4.2-debian@${DIGEST} /usr/local/bin/bun /usr/local/bin/bun`,
    );
    const { status, output } = runCheck(dir);
    expect(status).toBe(1);
    expect(output).toContain('no "packageManager"');
  });

  test('fails when the Dockerfile has no oven/bun image', () => {
    const dir = fixture('bun@1.4.2', 'RUN echo no bun here');
    const { status, output } = runCheck(dir);
    expect(status).toBe(1);
    expect(output).toContain('no oven/bun image reference');
  });
});
