import assert from 'node:assert/strict';
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { Application } from 'typedoc';

test('TypeDoc discovers nested entry points with minimatch 11 and respects excludes', async () => {
  const root = await mkdtemp(join(process.env.TMPDIR || tmpdir(), 'typedoc-minimatch-'));
  try {
    await mkdir(join(root, 'src', 'nested'), { recursive: true });
    await writeFile(join(root, 'typedoc.json'), '{}');
    await writeFile(
      join(root, 'tsconfig.json'),
      JSON.stringify({
        compilerOptions: { target: 'ES2022', module: 'ESNext', types: [] },
        include: ['src/**/*.ts'],
      })
    );
    await writeFile(join(root, 'src', 'nested', 'entry.ts'), 'export const fixture: string = "hello";');
    await writeFile(join(root, 'src', 'nested', 'excluded.ts'), 'export const excluded = true;');

    const app = await Application.bootstrap({
      name: 'Minimatch compatibility fixture',
      options: join(root, 'typedoc.json'),
      tsconfig: join(root, 'tsconfig.json'),
      entryPoints: [join(root, 'src', '**', '*.ts')],
      exclude: ['**/excluded.ts'],
    });
    const project = await app.convert();
    assert.ok(project, 'conversion succeeds');
    assert.ok(project.getChildByName('fixture'), 'nested entry point is discovered');
    assert.equal(project.getChildByName('excluded'), undefined, 'excluded entry point is not converted');
    assert.equal(app.logger.hasErrors(), false, 'conversion reports no errors');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
