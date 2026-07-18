#!/usr/bin/env node
// SPDX-License-Identifier: MIT
/**
 * ThemeId Type Generator
 *
 * Emits a string-literal union of all theme IDs so consumers get type-safe
 * theme identifiers. The order mirrors `themeIds` in
 * `packages/core/src/tokens/index.ts` (insertion order of `tokens.themes`).
 *
 * Output: packages/core/src/themes/theme-ids.ts
 */

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..', '..');

const TOKENS_JSON = join(ROOT_DIR, 'packages', 'core', 'src', 'themes', 'tokens.json');
const OUTPUT_FILE = join(ROOT_DIR, 'packages', 'core', 'src', 'themes', 'theme-ids.ts');

const BANNER = `// SPDX-License-Identifier: MIT
// AUTO-GENERATED FILE - DO NOT EDIT DIRECTLY
// Generated from: packages/core/src/themes/tokens.json
// Generator: scripts/codegen/generate-theme-ids.mjs
// Run: bun run generate:types:ts
`;

/**
 * Build the theme-ids.ts source from the canonical token data.
 * @param {string[]} themeIds - Ordered theme identifiers.
 * @returns {string}
 */
function generateSource(themeIds) {
  const entries = themeIds.map((id) => `  '${id}',`).join('\n');
  return `${BANNER}
/**
 * All theme IDs as a readonly tuple, mirroring the order of \`themeIds\` in
 * \`../tokens/index.ts\`. Used to derive the {@link ThemeId} literal union.
 */
export const THEME_IDS = [
${entries}
] as const;

/** Union of every valid theme identifier. */
export type ThemeId = (typeof THEME_IDS)[number];
`;
}

async function main() {
  console.log('📝 Generating ThemeId union...');
  console.log(`   Input: ${TOKENS_JSON}`);
  console.log(`   Output: ${OUTPUT_FILE}`);

  const tokens = JSON.parse(readFileSync(TOKENS_JSON, 'utf-8'));
  const themeIds = Object.values(tokens.themes).map((theme) => theme.id);

  if (themeIds.length === 0) {
    throw new Error('No themes found in tokens.json; refusing to emit an empty ThemeId union.');
  }

  const source = generateSource(themeIds);

  mkdirSync(dirname(OUTPUT_FILE), { recursive: true });
  writeFileSync(OUTPUT_FILE, source, 'utf-8');

  console.log(`   ✅ Generated ${OUTPUT_FILE} (${themeIds.length} theme IDs)`);
}

main().catch((error) => {
  console.error('Error generating ThemeId union:', error);
  process.exit(1);
});
