import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execSync, execFileSync } from 'child_process';
import { mkdtempSync, rmSync, copyFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { join, dirname } from 'path';
import { tmpdir } from 'os';

const fixturesDir = join(dirname(fileURLToPath(import.meta.url)), '../fixtures/external-consumption');

describe('External package consumption', () => {
  let testDir: string | undefined;
  let tarballPath: string | undefined;

  beforeAll(() => {
    // Create tarball
    execSync('bun pm pack', { stdio: 'pipe' });
    const files = execSync('ls -1 lgtm-hq-turbo-themes-*.tgz', { encoding: 'utf-8' });
    tarballPath = join(process.cwd(), files.trim().split('\n')[0]);

    // Create temp directory
    testDir = mkdtempSync(join(tmpdir(), 'turbo-themes-test-'));

    // Initialize package and install tarball
    execSync('bun init -y', { cwd: testDir, stdio: 'pipe' });
    // Use execFileSync with array args to avoid shell injection with path
    execFileSync('bun', ['add', tarballPath], { cwd: testDir, stdio: 'pipe' });
  }, 120_000);

  afterAll(() => {
    // Cleanup temp directory
    if (testDir) {
      rmSync(testDir, { recursive: true, force: true });
    }
    // Cleanup tarball using fs instead of shell glob
    if (tarballPath) {
      rmSync(tarballPath, { force: true });
    }
  }, 30_000);

  it('can import main entry point without resolution errors', () => {
    const testFile = join(testDir!, 'test-main.mjs');
    copyFileSync(join(fixturesDir, 'test-main.mjs'), testFile);

    const output = execFileSync('node', [testFile], { encoding: 'utf-8' });
    const result = JSON.parse(output.trim());
    expect(result.flavors).toBeGreaterThan(0);
    expect(result.themeIds).toBeGreaterThan(0);
  });

  it('can import /selector subpath without resolution errors', () => {
    const testFile = join(testDir!, 'test-selector.mjs');
    copyFileSync(join(fixturesDir, 'test-selector.mjs'), testFile);

    const output = execFileSync('node', [testFile], { encoding: 'utf-8' });
    const result = JSON.parse(output.trim());
    expect(result.hasInitTheme).toBe(true);
    expect(result.hasWireFlavorSelector).toBe(true);
  });

  it('can import /tokens subpath without resolution errors', () => {
    const testFile = join(testDir!, 'test-tokens.mjs');
    copyFileSync(join(fixturesDir, 'test-tokens.mjs'), testFile);

    const output = execFileSync('node', [testFile], { encoding: 'utf-8' });
    const result = JSON.parse(output.trim());
    expect(result.flavors).toBeGreaterThan(0);
    expect(result.themeIds).toBeGreaterThan(0);
  });

  it('can import /catalog subpath and catalog.json without resolution errors', () => {
    const testFile = join(testDir!, 'test-catalog.mjs');
    copyFileSync(join(fixturesDir, 'test-catalog.mjs'), testFile);

    const output = execFileSync('node', [testFile], { encoding: 'utf-8' });
    const result = JSON.parse(output.trim());
    expect(result.catalog).toBeGreaterThan(0);
    expect(result.catalogById).toBe(result.catalog);
    expect(result.catalogJson).toBe(result.catalog);
    expect(result.hasPreview).toBe(true);
    expect(result.catalogJsonHasPreview).toBe(true);
  });
});
