/**
 * Tests for generateChangelogEntry() bucketing logic in scripts/ci/version-bump.mjs.
 *
 * Regression coverage for GitHub issue #546: docs/style/refactor/perf/test/chore
 * commits were incorrectly bucketed under "🐛 Fixed" instead of "🔧 Changed".
 */
import { describe, expect, it } from 'vitest';

// version-bump.mjs is a plain Node ESM script; Vitest runs in Node so the
// import is straightforward. The module only calls main() when import.meta.url
// matches process.argv[1], so importing it here has no side-effects.
const { generateChangelogEntry, determineBumpType } = await import(
  '../scripts/ci/version-bump.mjs'
);

/**
 * Simulate a git-log --oneline line the way getCommitsSinceLastTag() produces it.
 */
function fakeCommit(type: string, description: string, scope?: string): string {
  const scopePart = scope ? `(${scope})` : '';
  return `abc1234 ${type}${scopePart}: ${description}`;
}

describe('generateChangelogEntry – changelog section bucketing', () => {
  describe('true fix types → ### 🐛 Fixed', () => {
    it.each(['fix', 'bugfix', 'patch'] as const)(
      '"%s" commit appears under Fixed',
      (type) => {
        const commits = [fakeCommit(type, 'resolve null pointer')];
        const entry = generateChangelogEntry(commits, '1.0.1', 'patch');
        expect(entry).toContain('### 🐛 Fixed');
        expect(entry).toContain('- resolve null pointer');
        expect(entry).not.toContain('### 🔧 Changed');
      },
    );
  });

  describe('non-fix patch types → ### 🔧 Changed (not ### 🐛 Fixed)', () => {
    it.each(['docs', 'style', 'refactor', 'perf', 'test', 'chore'] as const)(
      '"%s" commit appears under Changed, not Fixed',
      (type) => {
        const commits = [fakeCommit(type, `update ${type} thing`)];
        const entry = generateChangelogEntry(commits, '1.0.1', 'patch');
        expect(entry).toContain('### 🔧 Changed');
        expect(entry).toContain(`- update ${type} thing`);
        expect(entry).not.toContain('### 🐛 Fixed');
      },
    );
  });

  describe('issue #546 regression: docs-only release', () => {
    it('docs commit is NOT listed under Fixed (reproduces 0.22.1 misclassification)', () => {
      const commits = [
        fakeCommit('docs', 'add AGENTS.md with Cursor Cloud dev environment instructions (#542)'),
      ];
      const entry = generateChangelogEntry(commits, '0.22.1', 'patch');

      expect(entry).not.toContain('### 🐛 Fixed');
      expect(entry).toContain('### 🔧 Changed');
      expect(entry).toContain(
        '- add AGENTS.md with Cursor Cloud dev environment instructions (#542)',
      );
    });
  });

  describe('feat types → ### ✨ Added', () => {
    it.each(['feat', 'feature'] as const)('"%s" commit appears under Added', (type) => {
      const commits = [fakeCommit(type, 'add dark mode toggle')];
      const entry = generateChangelogEntry(commits, '1.1.0', 'minor');
      expect(entry).toContain('### ✨ Added');
      expect(entry).toContain('- add dark mode toggle');
      expect(entry).not.toContain('### 🐛 Fixed');
      expect(entry).not.toContain('### 🔧 Changed');
    });
  });

  describe('ignored types are omitted entirely', () => {
    it.each(['ci', 'build', 'release'] as const)(
      '"%s" commits do not appear in changelog',
      (type) => {
        const commits = [
          fakeCommit(type, 'update workflow'),
          fakeCommit('fix', 'real fix'), // ensure bumpType is non-null
        ];
        const entry = generateChangelogEntry(commits, '1.0.1', 'patch');
        expect(entry).not.toContain('update workflow');
      },
    );
  });

  describe('mixed release with multiple types', () => {
    it('routes each type to the correct section', () => {
      const commits = [
        fakeCommit('feat', 'add theme export'),
        fakeCommit('fix', 'fix token import'),
        fakeCommit('docs', 'update README'),
        fakeCommit('chore', 'bump deps'),
        fakeCommit('refactor', 'simplify renderer'),
        fakeCommit('ci', 'add lint job'), // should be ignored
      ];
      const entry = generateChangelogEntry(commits, '1.1.1', 'minor');

      expect(entry).toContain('### ✨ Added');
      expect(entry).toContain('- add theme export');

      expect(entry).toContain('### 🐛 Fixed');
      expect(entry).toContain('- fix token import');

      expect(entry).toContain('### 🔧 Changed');
      expect(entry).toContain('- update README');
      expect(entry).toContain('- bump deps');
      expect(entry).toContain('- simplify renderer');

      expect(entry).not.toContain('add lint job');
    });
  });

  describe('scoped commits', () => {
    it('docs(site) commit goes to Changed, not Fixed', () => {
      const commits = [fakeCommit('docs', 'add API reference', 'site')];
      const entry = generateChangelogEntry(commits, '1.0.1', 'patch');
      expect(entry).toContain('### 🔧 Changed');
      expect(entry).not.toContain('### 🐛 Fixed');
    });

    it('fix(core) commit goes to Fixed', () => {
      const commits = [fakeCommit('fix', 'resolve token lookup', 'core')];
      const entry = generateChangelogEntry(commits, '1.0.1', 'patch');
      expect(entry).toContain('### 🐛 Fixed');
      expect(entry).not.toContain('### 🔧 Changed');
    });
  });
});

describe('determineBumpType – patchTypes still trigger patch bump', () => {
  it.each(['docs', 'style', 'refactor', 'perf', 'test', 'chore'] as const)(
    '"%s" commit triggers a patch bump',
    (type) => {
      const commits = [fakeCommit(type, 'some change')];
      const bumpType = determineBumpType(commits);
      expect(bumpType).toBe('patch');
    },
  );

  it.each(['fix', 'bugfix', 'patch'] as const)(
    '"%s" commit triggers a patch bump',
    (type) => {
      const commits = [fakeCommit(type, 'some fix')];
      const bumpType = determineBumpType(commits);
      expect(bumpType).toBe('patch');
    },
  );
});
