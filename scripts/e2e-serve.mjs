#!/usr/bin/env node

/**
 * Cross-platform script to prepare and serve the Astro site for E2E tests.
 * This script runs the build prep and then starts astro preview.
 */

import { execSync, spawn } from 'child_process';
import { existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');
const siteDir = join(rootDir, 'apps', 'site');
const distDir = join(siteDir, 'dist');

/**
 * Check if dist is already built (has index.html).
 */
function isSiteBuilt() {
  return existsSync(join(distDir, 'index.html'));
}

try {
  // Step 1: Run the prep command (skip if already built or SKIP_PREP=1)
  const skipPrep = process.env.SKIP_PREP === '1' || isSiteBuilt();

  if (skipPrep) {
    console.log(
      process.env.SKIP_PREP === '1'
        ? 'Skipping e2e prep (SKIP_PREP=1)...'
        : 'Skipping e2e prep (dist already exists)...'
    );
  } else {
    console.log('Running e2e prep (build + Astro build)...');
    execSync('bun run e2e:prep', {
      cwd: rootDir,
      stdio: 'inherit',
      shell: true,
    });
  }

  // Step 2: Start astro preview
  const host = process.env.HOST ?? '127.0.0.1';
  const port = Number(process.env.PORT ?? 4173);
  if (isNaN(port) || port < 1 || port > 65535) {
    console.error(`Invalid PORT: ${process.env.PORT}. Must be a number between 1 and 65535.`);
    process.exit(1);
  }
  // Log the exact directory being served so a stale-serve can be diagnosed
  // from CI logs instead of inferred from screenshots (#670).
  console.log(`Serving ${distDir} via astro preview on http://${host}:${port}...`);
  const bunxCmd = process.platform === 'win32' ? 'bunx.cmd' : 'bunx';
  const serverArgs = [
    '--no-install',
    'astro',
    'preview',
    '--port',
    String(port),
    '--host',
    host,
  ];
  const serverProcess = spawn(bunxCmd, serverArgs, {
    cwd: siteDir,
    stdio: 'inherit',
  });
  // Handle spawn errors
  serverProcess.on('error', (error) => {
    console.error('Failed to start astro preview:', error.message);
    process.exit(1);
  });

  // Handle server process exit
  serverProcess.on('exit', (code, signal) => {
    if (signal) {
      console.log(`astro preview terminated by signal: ${signal}`);
    } else if (code !== null && code !== 0) {
      console.error(`astro preview exited with code: ${code}`);
      process.exit(code);
    }
  });

  // Shutdown handling: kill server on process termination
  const shutdown = (signal) => {
    console.log(`\nReceived ${signal}, shutting down astro preview...`);
    if (serverProcess && !serverProcess.killed) {
      serverProcess.kill(signal);
    }
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('exit', () => {
    if (serverProcess && !serverProcess.killed) {
      serverProcess.kill();
    }
  });
} catch (error) {
  console.error('Error running e2e serve:', error.message);
  process.exit(1);
}
