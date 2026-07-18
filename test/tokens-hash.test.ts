/**
 * Regression test for #534: $generated must equal
 * SHA-256(JSON.stringify(file content excluding $generated)).
 *
 * The hash is computed over the normalized JSON representation produced by
 * JSON.stringify, not over raw file bytes.  Whitespace and newline changes
 * do not affect it; structural field changes and value changes do.
 *
 * If this test fails after a version bump it means sync-version.mjs did not
 * recompute $generated, or a token file was edited by hand without updating
 * the hash.
 */
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(import.meta.dirname, '..');

function findTokenFiles(dir: string, results: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (entry === 'node_modules' || entry === 'dist' || entry === '.git') continue;
    try {
      const stat = statSync(full);
      if (stat.isDirectory()) {
        findTokenFiles(full, results);
      } else if (entry === 'tokens.json') {
        const data = JSON.parse(readFileSync(full, 'utf8')) as Record<string, unknown>;
        if ('$generated' in data) results.push(relative(ROOT, full));
      }
    } catch {
      // skip broken symlinks, unreadable paths, and invalid JSON
    }
  }
  return results;
}

const TOKEN_FILES = findTokenFiles(ROOT);

describe('tokens.json $generated hash consistency', () => {
  it('at least one tokens.json with $generated is found', () => {
    expect(TOKEN_FILES.length).toBeGreaterThan(0);
  });
  for (const relPath of TOKEN_FILES) {
    it(`${relPath} — $generated matches sha256(JSON.stringify(content excl. $generated))`, () => {
      const raw = readFileSync(resolve(ROOT, relPath), 'utf8');
      const data = JSON.parse(raw) as Record<string, unknown>;

      const stored = data['$generated'];
      expect(typeof stored).toBe('string');
      expect((stored as string).length).toBe(64);

      const { $generated: _, ...hashable } = data;
      const computed = createHash('sha256')
        .update(JSON.stringify(hashable))
        .digest('hex');

      expect(computed).toBe(stored);
    });
  }
});
