/**
 * Build-time guard: Astro scoped `<style>` blocks must reach `dist` (issue #761).
 *
 * The site previously shipped `data-astro-cid-*` attributes with no matching CSS
 * anywhere in `dist/_astro/*.css`, because Vite's PostCSS discovery walked up to
 * the repo-root `postcss.config.js` and applied a PurgeCSS pass whose `content`
 * globs match nothing under `apps/site`. Every Astro-emitted rule was stripped.
 *
 * `src/components/ScopedStyleCanary.astro` contributes one distinctively named
 * scoped rule. This script asserts the built CSS still contains it, scoped with
 * an `astro-cid` attribute selector, so any future regression fails the build
 * instead of silently shipping unstyled pages.
 */

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const siteDir = resolve(__dirname, '..');
const assetsDir = resolve(siteDir, 'dist/_astro');

/** Class name declared by ScopedStyleCanary.astro. */
const CANARY_CLASS = 'turbo-scoped-style-canary';

/**
 * Scoped form Astro emits for the canary rule, e.g.
 * `.turbo-scoped-style-canary[data-astro-cid-hhjecba5]{...}`. Matching the class
 * and its scoping attribute together proves the rule kept its own `astro-cid`,
 * rather than merely sharing a bundle with some other scoped component.
 */
const SCOPED_CANARY = new RegExp(`\\.${CANARY_CLASS}\\[data-astro-cid-`);

/**
 * Collect the contents of every CSS asset emitted by the Astro build.
 *
 * @param {string} dir - Directory holding the built assets.
 * @returns {{ name: string, css: string }[]} Emitted CSS assets.
 */
function readCssAssets(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((name) => name.endsWith('.css'))
    .map((name) => ({ name, css: readFileSync(join(dir, name), 'utf-8') }));
}

/**
 * Fail the build with a diagnostic message.
 *
 * @param {string} reason - Why the guard failed.
 * @returns {never}
 */
function fail(reason) {
  console.error(`Scoped-style guard FAILED: ${reason}`);
  console.error(
    'Astro scoped <style> blocks are not reaching dist. See issue #761 — the ' +
      'usual cause is a CSS post-processing step (e.g. an inherited PurgeCSS ' +
      'PostCSS config) stripping rules that Astro emits.'
  );
  process.exit(1);
}

const assets = readCssAssets(assetsDir);

if (assets.length === 0) {
  fail(`no CSS assets found in ${assetsDir}`);
}

const carrier = assets.find((asset) => asset.css.includes(CANARY_CLASS));

if (!carrier) {
  fail(`canary rule ".${CANARY_CLASS}" is absent from all ${assets.length} CSS asset(s)`);
}

if (!SCOPED_CANARY.test(carrier.css)) {
  fail(`canary rule survived in ${carrier.name} but lost its astro-cid scoping attribute`);
}

console.log(`Scoped-style guard OK: ".${CANARY_CLASS}" found in _astro/${carrier.name}`);
