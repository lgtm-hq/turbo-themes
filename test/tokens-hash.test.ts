/**
 * Regression test for #534: $generated hash must always equal
 * SHA-256(file content excluding the $generated field itself).
 *
 * If this test fails after a version bump it means sync-version.mjs did not
 * recompute $generated, or a token file was edited by hand without updating
 * the hash.
 */
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(import.meta.dirname, '..');

const TOKEN_FILES = [
  'packages/core/src/themes/tokens.json',
  'python/src/turbo_themes/tokens.json',
  'swift/Sources/TurboThemes/Resources/tokens.json',
] as const;

describe('tokens.json $generated hash consistency', () => {
  for (const relPath of TOKEN_FILES) {
    it(`${relPath} — $generated matches sha256(content excl. $generated)`, () => {
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
