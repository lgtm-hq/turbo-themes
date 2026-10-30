import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

// Run after the real template build, with no root workspace dependency resolution.
const root = resolve(process.argv[2]);
const read = (path) => readFileSync(path, 'utf8');
const html = read(join(root, 'dist/index.html'));
assert.doesNotMatch(html, /\/node_modules\//);
const cssPaths = [...html.matchAll(/href="([^"]+\.css)"/g)].map((match) => match[1]);
assert.ok(cssPaths.length > 0, 'built HTML must load emitted CSS');
const css = cssPaths.map((path) => read(join(root, 'dist', path.replace(/^\//, '')))).join('\n');
assert.match(css, /--turbo-bg-base\s*:\s*#[\da-f]+/i);

const source = readdirSync(join(root, 'src'))
  .filter((name) => /\.(?:js|ts|tsx|vue)$/.test(name))
  .map((name) => read(join(root, 'src', name)))
  .join('\n');
const themes = [...source.matchAll(/id:\s*['"]([\w-]+)['"]/g)].map((match) => match[1]);
assert.ok(themes.length > 0, 'the template must offer themes');
for (const theme of themes) {
  assert.match(css, new RegExp(`\\[data-theme=["']?${theme}["']?\\]\\s*\\{[^}]*--turbo-bg-base:`));
}
for (const name of readdirSync(join(root, 'dist/assets'))) {
  if (name.endsWith('.js')) {
    assert.doesNotMatch(read(join(root, 'dist/assets', name)), /\/node_modules\/|theme-css/);
  }
}
console.log(`${root}: emitted CSS includes variables for all ${themes.length} selectable themes`);
