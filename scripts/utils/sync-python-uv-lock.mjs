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
 * @returns {{ updated: string, changed: boolean }}
 */
export function rewriteEditableUvLockVersion(lockText, version) {
  const updated = lockText.replace(
    EDITABLE_TURBO_THEMES_VERSION,
    `$1${version}$2`,
  );
  return {
    updated,
    changed: updated !== lockText,
  };
}

/**
 * Update python/uv.lock after pyproject.toml has been rewritten.
 *
 * @param {object} options Sync options.
 * @param {string} options.pythonDir Absolute path to the python/ package.
 * @param {string} options.version Version already written to pyproject.toml.
 * @param {(msg: string) => void} [options.log]
 * @param {(msg: string) => void} [options.warn]
 * @returns {'updated' | 'unchanged' | 'missing'}
 */
export function syncPythonUvLock({
  pythonDir,
  version,
  log = console.log,
  warn = console.warn,
}) {
  const lockfilePath = path.join(pythonDir, 'uv.lock');
  if (!fs.existsSync(lockfilePath)) {
    warn('⚠️  python/uv.lock not found, skipping lockfile update');
    return 'missing';
  }

  const lockfile = fs.readFileSync(lockfilePath, 'utf8');
  const { updated, changed } = rewriteEditableUvLockVersion(
    lockfile,
    version,
  );
  if (!changed) {
    return 'unchanged';
  }

  fs.writeFileSync(lockfilePath, updated);
  log('updated python/uv.lock');
  return 'updated';
}
