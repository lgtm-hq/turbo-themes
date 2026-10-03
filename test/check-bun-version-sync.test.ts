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
    expect(output).toContain('matches packageManager');
    expect(status).toBe(0);
  });

  test('passes when versions match and the image is digest-pinned', () => {
    const dir = fixture(
      'bun@1.4.2',
      `COPY --from=oven/bun:1.4.2-debian@${DIGEST} /usr/local/bin/bun /usr/local/bin/bun`,
    );
    expect(runCheck(dir).status).toBe(0);
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
