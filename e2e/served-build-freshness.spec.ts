import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';

/**
 * Guard against Playwright rendering a stale site build (#670).
 *
 * `maintenance-generate-snapshots.yml` uploads whatever `--update-snapshots`
 * writes as the committed Linux baselines. If the `webServer` ever serves a
 * `apps/site/dist` that predates `bun run e2e:prep` (for example because the
 * prep build silently no-op'd), the run still reports "all passed" and a stale
 * render is published as the new baseline.
 *
 * This test fails the whole run in that case: the theme options the served page
 * renders must match the theme IDs in the tokens.json produced by the build.
 */

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

/**
 * Candidate locations for the built token manifest, most authoritative first.
 *
 * `dist/tokens/style-dictionary/tokens.json` is the direct output of
 * `bun run build:tokens`; the `packages/core` copy is written from it by
 * `build:tokens:copy` and is drift-checked in CI.
 */
const TOKENS_PATHS = [
  join(repoRoot, 'dist', 'tokens', 'style-dictionary', 'tokens.json'),
  join(repoRoot, 'packages', 'core', 'src', 'themes', 'tokens.json'),
];

/**
 * Read the theme IDs recorded in the built tokens manifest.
 *
 * @returns Sorted theme IDs from the first tokens.json found on disk.
 * @throws If no tokens.json exists or it declares no themes.
 */
function builtThemeIds(): string[] {
  const tokensPath = TOKENS_PATHS.find((candidate) => existsSync(candidate));
  if (!tokensPath) {
    throw new Error(
      `No built tokens.json found (looked in: ${TOKENS_PATHS.join(', ')}). ` +
        'Run `bun run e2e:prep` before the E2E suite.'
    );
  }

  const tokens = JSON.parse(readFileSync(tokensPath, 'utf8')) as {
    meta?: { themeIds?: string[] };
  };
  const themeIds = tokens.meta?.themeIds ?? [];
  if (themeIds.length === 0) {
    throw new Error(`${tokensPath} declares no themes in meta.themeIds`);
  }

  return [...themeIds].sort();
}

test.describe('Served build freshness @visual @smoke', () => {
  test('served page exposes every theme in the built tokens.json', async ({ page }) => {
    const expected = builtThemeIds();

    await page.goto('/');

    const options = page.locator('#theme-menu [role="option"][data-theme]');
    await expect(
      options,
      'Theme dropdown option count differs from the built tokens.json — the ' +
        'server is likely serving a stale apps/site/dist (see #670)'
    ).toHaveCount(expected.length);

    const served = await options.evaluateAll((nodes) =>
      nodes.map((node) => node.getAttribute('data-theme') ?? '')
    );

    expect(
      [...new Set(served)].sort(),
      'Served theme IDs differ from the built tokens.json — the server is ' +
        'likely serving a stale apps/site/dist (see #670)'
    ).toEqual(expected);
  });
});
