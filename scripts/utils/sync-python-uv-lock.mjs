// SPDX-License-Identifier: MIT
/**
 * Keep python/uv.lock aligned with the editable turbo-themes version.
 *
 * The release path already rewrites python/pyproject.toml. Without a matching
 * lock update, `uv sync --locked` rejects the tree.
 *
 * `uv lock --upgrade-package turbo-themes` is not used here. Even `--offline`
 * re-resolves the workspace and can rewrite `revision` plus unrelated pins
 * when the local uv is newer or older than the lock author. That would land
 * lock churn on every release PR. Ruby already falls back to a surgical
 * Gemfile.lock edit in this same script because the release job has no
 * Bundler; Python uses the same guarantee: rewrite only the editable
 * package's own version line.
 */

import fs from 'node:fs';
import path from 'node:path';

/**
 * Match only the editable workspace package, not any other lock entry.
 */
const EDITABLE_TURBO_THEMES_VERSION =
  /(name = "turbo-themes"\nversion = ")[^"]+("\nsource = \{ editable = "\." \})/;

/**
 * Rewrite only the editable turbo-themes version in a uv.lock document.
 *
 * @param {string} lockText Raw uv.lock contents.
 * @param {string} version Semantic version to write.
 * @returns {{ updated: string, matched: boolean, changed: boolean }}
 */
export function rewriteEditableUvLockVersion(lockText, version) {
  const matched = EDITABLE_TURBO_THEMES_VERSION.test(lockText);
  if (!matched) {
    return {
      updated: lockText,
      matched: false,
      changed: false,
    };
  }

  const updated = lockText.replace(
    EDITABLE_TURBO_THEMES_VERSION,
    `$1${version}$2`,
  );
  return {
    updated,
    matched: true,
    changed: updated !== lockText,
  };
}

/**
 * Update python/uv.lock after pyproject.toml has been rewritten.
 *
 * Throws when the lockfile is missing or has no editable turbo-themes
 * entry, so a release bump cannot leave a stale or unreadable lock.
 *
 * @param {object} options Sync options.
 * @param {string} options.pythonDir Absolute path to the python/ package.
 * @param {string} options.version Version already written to pyproject.toml.
 * @param {(msg: string) => void} [options.log]
 * @returns {'updated' | 'unchanged'}
 */
export function syncPythonUvLock({
  pythonDir,
  version,
  log = console.log,
}) {
  const lockfilePath = path.join(pythonDir, 'uv.lock');
  if (!fs.existsSync(lockfilePath)) {
    throw new Error(`python/uv.lock not found at ${lockfilePath}`);
  }

  const lockfile = fs.readFileSync(lockfilePath, 'utf8');
  const { updated, matched, changed } = rewriteEditableUvLockVersion(
    lockfile,
    version,
  );
  if (!matched) {
    throw new Error(
      'python/uv.lock has no editable turbo-themes package entry',
    );
  }
  if (!changed) {
    return 'unchanged';
  }

  fs.writeFileSync(lockfilePath, updated);
  log('updated python/uv.lock');
  return 'updated';
}
