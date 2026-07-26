import { spawnSync } from 'node:child_process';
import { chmodSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, test } from 'vitest';

const CI_DIR = join(__dirname, '../scripts/ci');
const PUSH_WITH_RETRY = join(CI_DIR, 'push-with-retry.sh');
const RETRY_RELEASE_PUSH = join(CI_DIR, 'retry-release-branch-push.sh');
const FAIL_RELEASE_PUSH = join(CI_DIR, 'fail-release-push.sh');
const VERSION_PR_SUMMARY = join(CI_DIR, 'generate-version-pr-summary.sh');

const MERGE_QUEUE_EXIT_CODE = 75;

const MERGE_QUEUE_REJECTION = [
  'remote: error: GH006: Protected branch update failed for refs/heads/release/version-1.2.3.',
  'remote: - A pull request for this branch has been added to a merge queue. Branches that',
  'remote:   are queued for merging cannot be updated. To modify this branch, dequeue the',
  'remote:   associated pull request.',
  ' ! [remote rejected] release/version-1.2.3 -> release/version-1.2.3 (protected branch hook declined)',
].join('\n');

const GENERIC_REJECTION = [
  'remote: error: GH006: Protected branch update failed for refs/heads/release/version-1.2.3.',
  'remote: - Changes must be made through a pull request.',
  ' ! [remote rejected] release/version-1.2.3 -> release/version-1.2.3 (protected branch hook declined)',
].join('\n');

let sandbox: string;

/** Absolute path to the shim directory prepended to PATH for a test run. */
function binDir(): string {
  return join(sandbox, 'bin');
}

/** Install an executable shim on the sandboxed PATH. */
function writeShim(name: string, body: string): void {
  const path = join(binDir(), name);
  writeFileSync(path, `#!/usr/bin/env bash\n${body}\n`);
  chmodSync(path, 0o755);
}

/**
 * Install a `git` shim whose `push` subcommand fails with the given output and
 * records one line per attempt in $ATTEMPT_LOG. All other subcommands succeed.
 */
function writeGitShim(rejection: string): void {
  writeShim(
    'git',
    [
      'if [[ "$1" == "push" || "$2" == "push" ]]; then',
      '  echo "attempt" >>"${ATTEMPT_LOG}"',
      `  cat <<'REJECTION' >&2`,
      rejection,
      'REJECTION',
      '  exit 1',
      'fi',
      'exit 0',
    ].join('\n'),
  );
}

/** Install a `gh` shim whose `pr list --json headRefName` returns $FAKE_PR_HEAD. */
function writeGhShim(): void {
  writeShim('gh', 'printf \'%s\\n\' "${FAKE_PR_HEAD:-}"');
}

interface RunResult {
  status: number;
  stdout: string;
  stderr: string;
}

function run(script: string, env: Record<string, string> = {}): RunResult {
  const result = spawnSync('bash', [script], {
    encoding: 'utf8',
    cwd: sandbox,
    env: {
      ...process.env,
      PATH: `${binDir()}:${process.env.PATH}`,
      ATTEMPT_LOG: join(sandbox, 'attempts.log'),
      GITHUB_OUTPUT: join(sandbox, 'github_output'),
      GITHUB_STEP_SUMMARY: join(sandbox, 'step_summary'),
      ...env,
    },
  });
  return {
    status: result.status ?? -1,
    stdout: result.stdout ?? '',
    stderr: result.stderr ?? '',
  };
}

function readSandboxFile(name: string): string {
  try {
    return readFileSync(join(sandbox, name), 'utf8');
  } catch {
    return '';
  }
}

function attemptCount(): number {
  return readSandboxFile('attempts.log').split('\n').filter(Boolean).length;
}

beforeEach(() => {
  sandbox = mkdtempSync(join(tmpdir(), 'merge-queue-'));
  spawnSync('mkdir', ['-p', binDir()]);
  writeFileSync(join(sandbox, 'github_output'), '');
  writeFileSync(join(sandbox, 'step_summary'), '');
  writeFileSync(join(sandbox, 'pr-body.md'), 'body');
  writeGhShim();
});

afterEach(() => {
  rmSync(sandbox, { recursive: true, force: true });
});

describe('push-with-retry.sh', () => {
  function push(rejection: string, env: Record<string, string> = {}): RunResult {
    writeGitShim(rejection);
    const result = spawnSync('bash', [PUSH_WITH_RETRY, 'origin', 'release/version-1.2.3'], {
      encoding: 'utf8',
      cwd: sandbox,
      env: {
        ...process.env,
        PATH: `${binDir()}:${process.env.PATH}`,
        ATTEMPT_LOG: join(sandbox, 'attempts.log'),
        MAX_RETRIES: '3',
        INITIAL_DELAY: '0',
        ...env,
      },
    });
    return {
      status: result.status ?? -1,
      stdout: result.stdout ?? '',
      stderr: result.stderr ?? '',
    };
  }

  test('merge-queue rejection exits 75 on the first attempt without retrying', () => {
    const result = push(MERGE_QUEUE_REJECTION);

    expect(result.status).toBe(MERGE_QUEUE_EXIT_CODE);
    expect(attemptCount()).toBe(1);
    expect(result.stdout).toContain('enrolled in a merge queue');
  });

  test('generic GH006 rejection still exhausts the retry budget', () => {
    const result = push(GENERIC_REJECTION);

    expect(result.status).toBe(1);
    expect(attemptCount()).toBe(3);
    expect(result.stdout).toContain('Push failed after 3 attempts');
    expect(result.stdout).not.toContain('merge queue');
  });

  test('redacts credentials embedded in the remote URL from replayed output', () => {
    // Assembled from parts so the fake token is not a literal credentialed URI.
    const fakeSecret = ['ghs', 'notarealtoken'].join('_');
    const tokenizedRemote = `https://x-access-token:${fakeSecret}@github.com/o/r.git`;
    writeGitShim(`remote: rejected by ${tokenizedRemote}`);

    const result = spawnSync('bash', [PUSH_WITH_RETRY, tokenizedRemote, 'main'], {
      encoding: 'utf8',
      cwd: sandbox,
      env: {
        ...process.env,
        PATH: `${binDir()}:${process.env.PATH}`,
        ATTEMPT_LOG: join(sandbox, 'attempts.log'),
        MAX_RETRIES: '1',
        INITIAL_DELAY: '0',
      },
    });

    expect(result.status).toBe(1);
    expect(`${result.stdout}${result.stderr}`).not.toContain(fakeSecret);
    expect(`${result.stdout}${result.stderr}`).toContain('https://github.com/o/r.git');
  });
});

describe('retry-release-branch-push.sh', () => {
  const baseEnv = {
    RELEASE_BRANCH: 'release/version-1.2.3',
    NEXT_VERSION: '1.2.3',
    PR_TITLE: 'chore(release): version 1.2.3',
    GH_TOKEN: 'token',
    GITHUB_REPOSITORY: 'lgtm-hq/turbo-themes',
    MAX_RETRIES: '3',
    INITIAL_DELAY: '0',
  };

  test('skips with skipped-merge-queue=true when the queued PR carries the version', () => {
    writeGitShim(MERGE_QUEUE_REJECTION);

    const result = run(RETRY_RELEASE_PUSH, {
      ...baseEnv,
      PR_BODY_FILE: join(sandbox, 'pr-body.md'),
      FAKE_PR_HEAD: 'release/version-1.2.3',
    });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('::notice title=Release branch already in merge queue::');
    expect(readSandboxFile('github_output')).toContain('skipped-merge-queue=true');
    expect(readSandboxFile('github_output')).not.toContain('pull-request-number=');
  });

  test('fails loudly when the queued PR is for a different version', () => {
    writeGitShim(MERGE_QUEUE_REJECTION);

    const result = run(RETRY_RELEASE_PUSH, {
      ...baseEnv,
      PR_BODY_FILE: join(sandbox, 'pr-body.md'),
      FAKE_PR_HEAD: 'release/version-9.9.9',
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Refusing to skip');
    expect(readSandboxFile('github_output')).not.toContain('skipped-merge-queue');
  });

  test('fails loudly when no open PR carries the version bump', () => {
    writeGitShim(MERGE_QUEUE_REJECTION);

    const result = run(RETRY_RELEASE_PUSH, {
      ...baseEnv,
      PR_BODY_FILE: join(sandbox, 'pr-body.md'),
      FAKE_PR_HEAD: '',
    });

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Refusing to skip');
  });

  test('propagates a generic push failure instead of skipping', () => {
    writeGitShim(GENERIC_REJECTION);

    const result = run(RETRY_RELEASE_PUSH, {
      ...baseEnv,
      PR_BODY_FILE: join(sandbox, 'pr-body.md'),
      FAKE_PR_HEAD: 'release/version-1.2.3',
    });

    expect(result.status).toBe(1);
    expect(attemptCount()).toBe(3);
    expect(readSandboxFile('github_output')).not.toContain('skipped-merge-queue');
  });

  test('requires NEXT_VERSION', () => {
    writeGitShim(MERGE_QUEUE_REJECTION);

    const result = spawnSync('bash', [RETRY_RELEASE_PUSH], {
      encoding: 'utf8',
      cwd: sandbox,
      env: {
        ...process.env,
        PATH: `${binDir()}:${process.env.PATH}`,
        RELEASE_BRANCH: 'release/version-1.2.3',
        PR_TITLE: 'title',
        PR_BODY_FILE: join(sandbox, 'pr-body.md'),
        GH_TOKEN: 'token',
        GITHUB_REPOSITORY: 'lgtm-hq/turbo-themes',
        NEXT_VERSION: '',
      },
    });

    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain('NEXT_VERSION is required');
  });
});

describe('fail-release-push.sh', () => {
  test('fails loudly by default', () => {
    const result = run(FAIL_RELEASE_PUSH);

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Release branch push failed');
  });

  test('exits 0 when the push was skipped for the merge queue', () => {
    const result = run(FAIL_RELEASE_PUSH, { SKIPPED_MERGE_QUEUE: 'true' });

    expect(result.status).toBe(0);
    expect(result.stdout).toContain('already in the merge queue');
  });
});

describe('generate-version-pr-summary.sh', () => {
  test('reports the merge-queue skip distinctly from having nothing to do', () => {
    const result = run(VERSION_PR_SUMMARY, {
      BUMP_NEEDED: 'true',
      NEXT_VERSION: '1.2.3',
      SKIPPED_MERGE_QUEUE: 'true',
      PUSH_RETRY_TRIGGERED: 'true',
      PUSH_FAILED: 'false',
    });

    expect(result.status).toBe(0);
    const summary = readSandboxFile('step_summary');
    expect(summary).toContain('**Skipped**');
    expect(summary).toContain('already in the merge queue');
    expect(summary).not.toContain('No version bump needed');
    expect(summary).not.toContain('recovered via push retry');
  });

  test('still reports a hard push failure', () => {
    const result = run(VERSION_PR_SUMMARY, {
      BUMP_NEEDED: 'true',
      NEXT_VERSION: '1.2.3',
      PUSH_FAILED: 'true',
    });

    expect(result.status).toBe(0);
    expect(readSandboxFile('step_summary')).toContain('**Push failed**');
  });

  test('reports no bump needed unchanged', () => {
    const result = run(VERSION_PR_SUMMARY, { BUMP_NEEDED: 'false' });

    expect(result.status).toBe(0);
    expect(readSandboxFile('step_summary')).toContain('No version bump needed');
  });
});
