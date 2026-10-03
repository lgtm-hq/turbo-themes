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
      const { status, output } = runCheck(dir);
      expect(status).toBe(1);
      expect(output).toContain('Dockerfile oven/bun references: 2\n');
      expect(output).toContain(`- ${BAD}  [FROM]`);
      expect(output).toContain('Dockerfile uses 1.3.11, package.json pins 1.4.2');
      expect(output).toContain('1 invalid oven/bun reference(s)');
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

  describe('resolves stages and fails closed on unvalidatable operands', () => {
    const GOOD = `oven/bun:1.4.2-debian@${DIGEST}`;
    const BAD = `oven/bun:1.3.11-debian@${DIGEST}`;
    const COPY_BUN = '/usr/local/bin/bun /usr/local/bin/bun';

    test('an ARG-built FROM cannot hide behind a separate matching literal ref', () => {
      const dir = fixture(
        'bun@1.4.2',
        [
          'ARG ORG=oven',
          'ARG IMAGE=bun',
          `FROM \${ORG}/\${IMAGE}:1.3.11-debian@${DIGEST} AS bun`,
          'FROM debian:bookworm',
          `COPY --from=${GOOD} ${COPY_BUN}`,
          'COPY --from=bun /usr/local/bin/bun /opt/bun',
        ].join('\n'),
      );
      const { status, output } = runCheck(dir);
      expect(status).toBe(1);
      expect(output).toContain("Cannot validate FROM operand '${ORG}/${IMAGE}:1.3.11-debian@");
      expect(output).toContain('it uses variable expansion');
    });

    test('a COPY --from operand using a variable fails closed', () => {
      const dir = fixture('bun@1.4.2', ['ARG STAGE=bun', `COPY --from=\${STAGE} ${COPY_BUN}`].join('\n'));
      const { status, output } = runCheck(dir);
      expect(status).toBe(1);
      expect(output).toContain("Cannot validate COPY --from operand '${STAGE}'");
    });

    test('a literal oven/bun ref with a variable tag fails closed', () => {
      const dir = fixture('bun@1.4.2', `COPY --from=oven/bun:\${BUN_VERSION} ${COPY_BUN}`);
      const { status, output } = runCheck(dir);
      expect(status).toBe(1);
      expect(output).toContain('it uses variable expansion');
    });

    test('follows a COPY --from stage alias to a mismatched bun FROM', () => {
      const dir = fixture(
        'bun@1.4.2',
        [`FROM ${BAD} AS BunSrc`, 'FROM debian:bookworm', `COPY --from=bunsrc ${COPY_BUN}`].join('\n'),
      );
      const { status, output } = runCheck(dir);
      expect(status).toBe(1);
      expect(output).toContain("via stage 'bunsrc'");
      expect(output).toContain('Dockerfile uses 1.3.11, package.json pins 1.4.2');
    });

    test('a COPY --from stage alias to a matching bun FROM passes', () => {
      const dir = fixture(
        'bun@1.4.2',
        [`FROM ${GOOD} AS bunsrc`, 'FROM debian:bookworm', `COPY --from=bunsrc ${COPY_BUN}`].join('\n'),
      );
      const { status, output } = runCheck(dir);
      expect(output).toContain("via stage 'bunsrc'");
      expect(status).toBe(0);
    });

    test('follows a numeric COPY --from stage index', () => {
      // fixture() adds "FROM debian:bookworm" as stage 0, so the bun FROM is stage 1
      const dir = fixture('bun@1.4.2', [`FROM ${BAD}`, 'FROM debian:bookworm', `COPY --from=1 ${COPY_BUN}`].join('\n'));
      const { status, output } = runCheck(dir);
      expect(status).toBe(1);
      expect(output).toContain("via stage '1'");
    });

    test('checks RUN --mount from= operands', () => {
      const dir = fixture(
        'bun@1.4.2',
        [`COPY --from=${GOOD} ${COPY_BUN}`, `RUN --mount=type=bind,from=${BAD},target=/b true`].join('\n'),
      );
      const { status, output } = runCheck(dir);
      expect(status).toBe(1);
      expect(output).toContain('Dockerfile uses 1.3.11, package.json pins 1.4.2');
    });

    test('follows a RUN --mount from= stage alias to a mismatched bun FROM', () => {
      const dir = fixture(
        'bun@1.4.2',
        [
          `FROM ${BAD} AS bun-cache`,
          'FROM debian:bookworm',
          `COPY --from=${GOOD} ${COPY_BUN}`,
          'RUN --mount=type=bind,from=bun-cache,target=/b true',
        ].join('\n'),
      );
      const { status, output } = runCheck(dir);
      expect(status).toBe(1);
      expect(output).toContain("[RUN --mount from (via stage 'bun-cache')]");
      expect(output).toContain('Dockerfile uses 1.3.11, package.json pins 1.4.2');
    });

    test('checks ADD --from= like COPY --from=', () => {
      const bad = fixture('bun@1.4.2', `ADD --from=${BAD} ${COPY_BUN}`);
      const badRun = runCheck(bad);
      expect(badRun.status).toBe(1);
      expect(badRun.output).toContain('[ADD --from]');
      expect(badRun.output).toContain('Dockerfile uses 1.3.11, package.json pins 1.4.2');
      const unpinned = fixture('bun@1.4.2', `ADD --from=oven/bun:1.4.2-debian ${COPY_BUN}`);
      const unpinnedRun = runCheck(unpinned);
      expect(unpinnedRun.status).toBe(1);
      expect(unpinnedRun.output).toContain('pinned by digest');
      const ok = fixture('bun@1.4.2', `ADD --from=${GOOD} ${COPY_BUN}`);
      expect(runCheck(ok).status).toBe(0);
    });

    test('an ARG-only reference is validated and still requires a bun source', () => {
      const dir = fixture('bun@1.4.2', `ARG BUN_IMAGE=${BAD}`);
      const { status, output } = runCheck(dir);
      expect(status).toBe(1);
      expect(output).toContain(`- ${BAD}  [ARG value]`);
      expect(output).toContain('Dockerfile uses 1.3.11, package.json pins 1.4.2');
      expect(output).toContain('no oven/bun image reference found in a FROM, COPY/ADD --from= or RUN --mount from=');
      expect(output).toContain('2 invalid oven/bun reference(s)');
    });

    test('checks oven/bun values in ARG defaults', () => {
      const ok = fixture('bun@1.4.2', [`ARG BUN_IMAGE=${GOOD}`, `COPY --from=${GOOD} ${COPY_BUN}`].join('\n'));
      expect(runCheck(ok).status).toBe(0);
      const bad = fixture('bun@1.4.2', [`ARG BUN_IMAGE=${BAD}`, `COPY --from=${GOOD} ${COPY_BUN}`].join('\n'));
      expect(runCheck(bad).status).toBe(1);
    });
  });

  describe('skips heredoc bodies', () => {
    const GOOD = `oven/bun:1.4.2-debian@${DIGEST}`;
    const BAD = `oven/bun:1.3.11-debian@${DIGEST}`;
    const COPY_BUN = '/usr/local/bin/bun /usr/local/bin/bun';

    test('a mismatched reference inside a RUN heredoc is not a false positive', () => {
      const dir = fixture(
        'bun@1.4.2',
        ['RUN <<EOF', `echo "FROM ${BAD}"`, `COPY --from=${BAD} x y`, 'EOF', `COPY --from=${GOOD} ${COPY_BUN}`].join(
          '\n',
        ),
      );
      const { status, output } = runCheck(dir);
      expect(output).toContain('Dockerfile oven/bun references: 1\n');
      expect(status).toBe(0);
    });

    test('a matching COPY only inside a heredoc does not satisfy the check', () => {
      const dir = fixture('bun@1.4.2', ['RUN <<EOF', `COPY --from=${GOOD} ${COPY_BUN}`, 'EOF'].join('\n'));
      const { status, output } = runCheck(dir);
      expect(status).toBe(1);
      expect(output).toContain('no oven/bun image reference');
    });

    test('ends <<- and quoted heredocs at their delimiter, then checks later instructions', () => {
      const dir = fixture(
        'bun@1.4.2',
        [
          `RUN <<-"END" cat > /tmp/a`,
          `\tFROM ${GOOD}`,
          '\tEND',
          `COPY <<'DATA' /tmp/b`,
          `${GOOD}`,
          'DATA',
          `COPY --from=${BAD} ${COPY_BUN}`,
        ].join('\n'),
      );
      const { status, output } = runCheck(dir);
      expect(status).toBe(1);
      expect(output).toContain('Dockerfile oven/bun references: 1\n');
      expect(output).toContain('Dockerfile uses 1.3.11, package.json pins 1.4.2');
    });

    test('handles two heredocs on one RUN', () => {
      const dir = fixture(
        'bun@1.4.2',
        ['RUN <<A <<B', `echo ${GOOD}`, 'A', `echo ${GOOD}`, 'B', `COPY --from=${BAD} ${COPY_BUN}`].join('\n'),
      );
      const { status, output } = runCheck(dir);
      expect(status).toBe(1);
      expect(output).toContain('Dockerfile oven/bun references: 1\n');
    });

    test.each([
      ['a single-quoted <<EOF', "RUN echo '<<EOF'"],
      ['a double-quoted <<EOF', 'RUN echo "<<EOF"'],
      ['<<EOF attached to a word', 'RUN cat<<EOF'],
      ['<<EOF inside a longer quoted string', `RUN sh -c 'cat <<EOF'`],
    ])('%s is not a heredoc and cannot hide later instructions', (_label, runLine) => {
      const dir = fixture(
        'bun@1.4.2',
        [`COPY --from=${GOOD} ${COPY_BUN}`, runLine, `COPY --from=${BAD} /usr/local/bin/bun /opt/bun`, 'EOF'].join(
          '\n',
        ),
      );
      const { status, output } = runCheck(dir);
      expect(status).toBe(1);
      expect(output).toContain('Dockerfile oven/bun references: 2\n');
      expect(output).toContain('Dockerfile uses 1.3.11, package.json pins 1.4.2');
    });

    test.each([
      ['3<<EOF', 'RUN 3<<EOF cat', 'EOF'],
      ['2<<-EOF', 'RUN 2<<-EOF cat', '\tEOF'],
    ])('a file-descriptor heredoc (%s) body is skipped', (_label, runLine, endLine) => {
      const dir = fixture(
        'bun@1.4.2',
        [runLine, `\tCOPY --from=${BAD} ${COPY_BUN}`, endLine, `COPY --from=${GOOD} ${COPY_BUN}`].join('\n'),
      );
      const { status, output } = runCheck(dir);
      expect(output).toContain('Dockerfile oven/bun references: 1\n');
      expect(status).toBe(0);
    });

    test('a file-descriptor heredoc body cannot count as the bun source', () => {
      const dir = fixture('bun@1.4.2', ['RUN 3<<EOF cat', `COPY --from=${GOOD} ${COPY_BUN}`, 'EOF'].join('\n'));
      const { status, output } = runCheck(dir);
      expect(status).toBe(1);
      expect(output).toContain('no oven/bun image reference found');
    });

    test('an unterminated heredoc fails closed', () => {
      const dir = fixture(
        'bun@1.4.2',
        [`COPY --from=${GOOD} ${COPY_BUN}`, 'RUN <<EOF', `COPY --from=${BAD} /usr/local/bin/bun /opt/bun`].join('\n'),
      );
      const { status, output } = runCheck(dir);
      expect(status).toBe(1);
      expect(output).toContain("Unterminated heredoc (delimiter 'EOF')");
    });

    test('a <<< herestring is not treated as a heredoc', () => {
      const dir = fixture(
        'bun@1.4.2',
        ['RUN cat <<<"EOF"', `COPY --from=${BAD} ${COPY_BUN}`, 'EOF'].join('\n'),
      );
      const { status, output } = runCheck(dir);
      expect(status).toBe(1);
      expect(output).toContain('Dockerfile uses 1.3.11, package.json pins 1.4.2');
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
