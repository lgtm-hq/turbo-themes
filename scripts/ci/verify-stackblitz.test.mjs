import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';

const templates = ['bootstrap', 'react', 'tailwind', 'vue'];
const read = (path) => readFileSync(path, 'utf8');

function sourceFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? sourceFiles(path) : [path];
  });
}

for (const template of templates) {
  test(`${template}: published dependency and bundled theme switching`, () => {
    const root = `examples/stackblitz/${template}`;
    const manifest = JSON.parse(read(`${root}/package.json`));
    assert.ok(manifest.dependencies['@lgtm-hq/turbo-themes']);
    assert.equal(manifest.dependencies['turbo-themes'], undefined);
    assert.equal(manifest.engines.node, '>=22.12.0');
    const files = [`${root}/index.html`, ...sourceFiles(`${root}/src`)];
    const source = files.map(read).join('\n');
    assert.doesNotMatch(source, /\/node_modules\//);
    assert.doesNotMatch(source, /theme-css/);
    assert.match(source, /import ['"]@lgtm-hq\/turbo-themes\/css\/core['"]/);
    assert.match(source, /import ['"]@lgtm-hq\/turbo-themes\/css\/themes-all['"]/);
    if (template === 'react' || template === 'vue') {
      assert.match(source, /import ['"]@lgtm-hq\/turbo-themes\/css\/base['"]/);
    }
    assert.match(source, /setAttribute\(['"]data-theme['"]/);
  });
}

test('Vue keeps the workspace-compatible typecheck before Vite', () => {
  const vue = JSON.parse(read('examples/stackblitz/vue/package.json'));
  const workspace = JSON.parse(read('examples/vue/package.json'));
  assert.equal(vue.devDependencies['vue-tsc'], workspace.devDependencies['vue-tsc']);
  assert.match(vue.scripts.build, /^vue-tsc\b.*&& vite build$/);
});
