/**
 * Tests for generateChangelogEntry() bucketing logic in scripts/ci/version-bump.mjs.
 *
 * Regression coverage for:
 * - GitHub issue #546: docs/style/refactor/perf/test/chore under Changed (not Fixed)
 * - GitHub issue #581: scope-aware filtering (ci/build) + human-readable descriptions
 */
import { describe, expect, it } from 'vitest';

// version-bump.mjs is a plain Node ESM script; Vitest runs in Node so the
// import is straightforward. The module only calls main() when import.meta.url
// matches process.argv[1], so importing it here has no side-effects.
const {
  generateChangelogEntry,
  determineBumpType,
  formatChangelogDescription,
  isChangelogIgnoredScope,
} = await import('../scripts/ci/version-bump.mjs');

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
        expect(entry).toContain('- Resolve null pointer');
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
        expect(entry).toContain(`- Update ${type} thing`);
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
        '- Add AGENTS.md with Cursor Cloud dev environment instructions (#542)',
      );
    });
  });

  describe('feat types → ### ✨ Added', () => {
    it.each(['feat', 'feature'] as const)('"%s" commit appears under Added', (type) => {
      const commits = [fakeCommit(type, 'add dark mode toggle')];
      const entry = generateChangelogEntry(commits, '1.1.0', 'minor');
      expect(entry).toContain('### ✨ Added');
      expect(entry).toContain('- Add dark mode toggle');
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
          fakeCommit('fix', 'real fix'), // included so the entry is non-empty (ignored types produce no output)
        ];
        const entry = generateChangelogEntry(commits, '1.0.1', 'patch');
        expect(entry).not.toContain('update workflow');
        expect(entry).not.toContain('Update workflow');
      },
    );
  });

  describe('issue #581: changelog-ignored scopes (ci/build) omitted from consumer sections', () => {
    it.each(['ci', 'build'] as const)(
      'fix(%s) does not appear under Fixed',
      (scope) => {
        const commits = [
          fakeCommit('fix', 'address greptile findings', scope),
          fakeCommit('fix', 'resolve token lookup', 'core'),
        ];
        const entry = generateChangelogEntry(commits, '1.0.1', 'patch');

        expect(entry).toContain('### 🐛 Fixed');
        expect(entry).toContain('- Resolve token lookup');
        expect(entry).not.toContain('address greptile findings');
        expect(entry).not.toContain('Address greptile findings');
      },
    );

    it.each(['ci', 'build'] as const)(
      'feat(%s) does not appear under Added',
      (scope) => {
        const commits = [
          fakeCommit('feat', 'wire release workflow', scope),
          fakeCommit('feat', 'add theme export'),
        ];
        const entry = generateChangelogEntry(commits, '1.1.0', 'minor');

        expect(entry).toContain('### ✨ Added');
        expect(entry).toContain('- Add theme export');
        expect(entry).not.toContain('wire release workflow');
        expect(entry).not.toContain('Wire release workflow');
      },
    );

    it.each(['ci', 'build'] as const)(
      'chore(%s) does not appear under Changed',
      (scope) => {
        const commits = [
          fakeCommit('chore', 'tweak pipeline cache', scope),
          fakeCommit('docs', 'update README'),
        ];
        const entry = generateChangelogEntry(commits, '1.0.1', 'patch');

        expect(entry).toContain('### 🔧 Changed');
        expect(entry).toContain('- Update README');
        expect(entry).not.toContain('tweak pipeline cache');
        expect(entry).not.toContain('Tweak pipeline cache');
      },
    );

    it('scope matching is case-insensitive', () => {
      const commits = [
        fakeCommit('fix', 'uppercase scope noise', 'CI'),
        fakeCommit('fix', 'real consumer fix'),
      ];
      const entry = generateChangelogEntry(commits, '1.0.1', 'patch');
      expect(entry).toContain('- Real consumer fix');
      expect(entry).not.toContain('uppercase scope noise');
      expect(entry).not.toContain('Uppercase scope noise');
    });

    it('non-ignored scopes still appear in the correct section', () => {
      const commits = [fakeCommit('fix', 'resolve token lookup', 'core')];
      const entry = generateChangelogEntry(commits, '1.0.1', 'patch');
      expect(entry).toContain('### 🐛 Fixed');
      expect(entry).toContain('- Resolve token lookup');
    });
  });

  describe('issue #581: human-readable changelog descriptions', () => {
    it('capitalizes the first character of each entry', () => {
      const commits = [fakeCommit('fix', 'bucket docs under Changed (#570)')];
      const entry = generateChangelogEntry(commits, '1.0.1', 'patch');
      expect(entry).toContain('- Bucket docs under Changed (#570)');
      expect(entry).not.toContain('- bucket docs under Changed (#570)');
    });

    it('preserves trailing PR refs from the commit message', () => {
      const commits = [fakeCommit('feat', 'add dark mode toggle (#580)')];
      const entry = generateChangelogEntry(commits, '1.1.0', 'minor');
      expect(entry).toContain('- Add dark mode toggle (#580)');
    });

    it('leaves already-capitalized descriptions unchanged aside from first char', () => {
      expect(formatChangelogDescription('Resolve null pointer')).toBe('Resolve null pointer');
      expect(formatChangelogDescription('add theme')).toBe('Add theme');
      expect(formatChangelogDescription('')).toBe('');
    });
  });

  describe('mixed release with multiple types', () => {
    it('routes each type to the correct section', () => {
      const commits = [
        fakeCommit('feat', 'add theme export'),
        fakeCommit('fix', 'fix token import'),
        fakeCommit('docs', 'update README'),
        fakeCommit('chore', 'bump deps'),
        fakeCommit('refactor', 'simplify renderer'),
        fakeCommit('ci', 'add lint job'), // ignored type
        fakeCommit('fix', 'address greptile P2 findings', 'ci'), // ignored scope
      ];
      const entry = generateChangelogEntry(commits, '1.1.1', 'minor');

      expect(entry).toContain('### ✨ Added');
      expect(entry).toContain('- Add theme export');

      expect(entry).toContain('### 🐛 Fixed');
      expect(entry).toContain('- Fix token import');

      expect(entry).toContain('### 🔧 Changed');
      expect(entry).toContain('- Update README');
      expect(entry).toContain('- Bump deps');
      expect(entry).toContain('- Simplify renderer');

      expect(entry).not.toContain('add lint job');
      expect(entry).not.toContain('address greptile P2 findings');
      expect(entry).not.toContain('Address greptile P2 findings');
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

describe('isChangelogIgnoredScope', () => {
  it.each(['ci', 'build', 'CI', 'Build'] as const)('"%s" is ignored', (scope) => {
    expect(isChangelogIgnoredScope(scope)).toBe(true);
  });

  it.each(['core', 'site', 'deps'] as const)('"%s" is not ignored', (scope) => {
    expect(isChangelogIgnoredScope(scope)).toBe(false);
  });

  it('null/undefined scopes are not ignored', () => {
    expect(isChangelogIgnoredScope(null)).toBe(false);
    expect(isChangelogIgnoredScope(undefined)).toBe(false);
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

  describe('issue #581: scoped ci/build commits still trigger release bumps', () => {
    it('fix(ci) still triggers a patch bump', () => {
      const commits = [fakeCommit('fix', 'address greptile findings', 'ci')];
      expect(determineBumpType(commits)).toBe('patch');
    });

    it('feat(build) still triggers a minor bump', () => {
      const commits = [fakeCommit('feat', 'add build cache', 'build')];
      expect(determineBumpType(commits)).toBe('minor');
    });

    it('type ci (not scope) still does not trigger a bump', () => {
      const commits = [fakeCommit('ci', 'update workflow')];
      expect(determineBumpType(commits)).toBeNull();
    });
  });
});
