import { spawnSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, describe, expect, test } from 'vitest';

const scriptPath = join(__dirname, '../scripts/ci/check-bun-version-sync.sh');
const DIGEST = `sha256:${'a'.repeat(64)}`;
const GOOD = `oven/bun:1.4.2-debian@${DIGEST}`;
const BAD = `oven/bun:1.3.11-debian@${DIGEST}`;
const COPY_BUN = '/usr/local/bin/bun /usr/local/bin/bun';
const GOOD_COPY = `COPY --from=${GOOD} ${COPY_BUN}`;
const ALLOWED_FORM = 'COPY --from=oven/bun:<semver>[-<variant>]@sha256:<64 hex>';

function runCheck(root?: string): { status: number | null; output: string } {
  const result = spawnSync('bash', root ? [scriptPath, root] : [scriptPath], {
    encoding: 'utf8',
    timeout: 15_000,
  });
  return { status: result.status, output: `${result.stdout}${result.stderr}` };
}

describe('check-bun-version-sync.sh', () => {
  const tempDirs: string[] = [];

  function fixture(packageManager: string | null, dockerfile: string): string {
    const dir = mkdtempSync(join(tmpdir(), 'bun-sync-'));
    tempDirs.push(dir);
    const pkg: Record<string, string> = { name: 'fixture' };
    if (packageManager) pkg.packageManager = packageManager;
    writeFileSync(join(dir, 'package.json'), `${JSON.stringify(pkg, null, 2)}\n`);
    writeFileSync(join(dir, 'Dockerfile'), dockerfile.endsWith('\n') ? dockerfile : `${dockerfile}\n`);
    return dir;
  }

  afterEach(() => {
    for (const dir of tempDirs.splice(0)) rmSync(dir, { recursive: true, force: true });
  });

  test('passes for the repository Dockerfile and package.json', () => {
    const { status, output } = runCheck();
    expect(output).toContain('matches packageManager bun@');
    expect(status).toBe(0);
  });

  test('passes when the Dockerfile has exactly one allowed bun source', () => {
    const dir = fixture('bun@1.4.2', ['FROM debian:bookworm', GOOD_COPY].join('\n'));
    const { status, output } = runCheck(dir);
    expect(output).toContain('packageManager: bun@1.4.2\n');
    expect(output).toContain('Dockerfile bun sources: 1\n');
    expect(output).toContain('matches packageManager bun@1.4.2');
    expect(status).toBe(0);
  });

  test('fails when the Dockerfile version drifts from packageManager', () => {
    const dir = fixture('bun@1.4.2', `COPY --from=${BAD} ${COPY_BUN}`);
    const { status, output } = runCheck(dir);
    expect(status).toBe(1);
    expect(output).toContain('Dockerfile uses 1.3.11, package.json pins 1.4.2');
    expect(output).toContain(ALLOWED_FORM);
  });

  test('fails when the oven/bun image is not pinned by digest', () => {
    const dir = fixture('bun@1.4.2', `COPY --from=oven/bun:1.4.2-debian ${COPY_BUN}`);
    const { status, output } = runCheck(dir);
    expect(status).toBe(1);
    expect(output).toContain('pinned by digest');
    expect(output).toContain(ALLOWED_FORM);
  });

  test('fails when the Dockerfile has no bun source', () => {
    const dir = fixture('bun@1.4.2', 'FROM debian:bookworm\nRUN echo no bun here');
    const { status, output } = runCheck(dir);
    expect(status).toBe(1);
    expect(output).toContain('exactly one bun source. Found none');
    expect(output).toContain(ALLOWED_FORM);
  });

  test('fails when the Dockerfile has two allowed bun sources', () => {
    const dir = fixture('bun@1.4.2', [GOOD_COPY, `COPY --from=oven/bun:1.4.2@${DIGEST} /opt/bun /opt/bun`].join('\n'));
    const { status, output } = runCheck(dir);
    expect(status).toBe(1);
    expect(output).toContain('exactly one bun source. Found 2');
    expect(output).toContain(ALLOWED_FORM);
  });

  test.each([
    ['double-quoted --from', `COPY --from="${BAD}" ${COPY_BUN}`],
    ['single-quoted --from', `COPY --from='${BAD}' ${COPY_BUN}`],
    ['ghcr.io registry prefix', `COPY --from=ghcr.io/${BAD} ${COPY_BUN}`],
    ['mirror.gcr.io registry prefix', `COPY --from=mirror.gcr.io/${BAD} ${COPY_BUN}`],
    ['quoted RUN --mount from=', `RUN --mount=type=bind,from="${BAD}",target=/b true`],
    ['quoted FROM plus COPY --from=stage', `FROM "${BAD}" AS bun\nCOPY --from=bun ${COPY_BUN}`],
  ])('fails when a valid source is paired with %s', (_label, decoy) => {
    const dir = fixture('bun@1.4.2', [GOOD_COPY, decoy].join('\n'));
    const { status, output } = runCheck(dir);
    expect(status).toBe(1);
    expect(output).toContain('disallowed bun image reference');
    expect(output).toContain(ALLOWED_FORM);
  });

  test.each([
    ['FROM image', `FROM \${ORG}/\${IMAGE}:1.3.11-debian@${DIGEST} AS bun`],
    ['COPY --from', `COPY --from=\${STAGE} ${COPY_BUN}`],
    ['ADD --from', `ADD --from=\${STAGE} ${COPY_BUN}`],
    ['RUN --mount from=', 'RUN --mount=type=bind,from=$SRC,target=/b true'],
  ])('fails when a %s operand uses variable expansion', (_label, decoy) => {
    const dir = fixture('bun@1.4.2', [GOOD_COPY, decoy].join('\n'));
    const { status, output } = runCheck(dir);
    expect(status).toBe(1);
    expect(output).toContain('variable expansion');
    expect(output).toContain(ALLOWED_FORM);
  });

  test('ignores comment lines that mention oven/bun', () => {
    const dir = fixture(
      'bun@1.4.2',
      [`# old: COPY --from=${BAD} ${COPY_BUN}`, `   # also oven/bun:1.3.11`, GOOD_COPY].join('\n'),
    );
    const { status, output } = runCheck(dir);
    expect(output).toContain('Dockerfile bun sources: 1\n');
    expect(output).toContain('matches packageManager bun@1.4.2');
    expect(status).toBe(0);
  });
});
