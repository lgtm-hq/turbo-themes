#!/usr/bin/env node
// SPDX-License-Identifier: MIT
/**
 * Generate lightweight theme catalog metadata.
 *
 * Reads the flat tokens.json produced by prepare-style-dictionary and writes a
 * slim catalog (id/label/vendor/appearance/preview colors only) for theme
 * picker UIs — without embedding full design tokens.
 *
 * Outputs:
 *   - packages/core/src/catalog/catalog.json  (committed source, imported by runtime)
 *   - dist/catalog.json                      (package export @lgtm-hq/turbo-themes/catalog.json)
 *
 * Run via: bun run build:tokens (after prepare-style-dictionary)
 */

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, "..", "..");

const tokensPath = join(projectRoot, "dist", "tokens", "style-dictionary", "tokens.json");
const coreCatalogPath = join(projectRoot, "packages", "core", "src", "catalog", "catalog.json");
const distCatalogPath = join(projectRoot, "dist", "catalog.json");

/**
 * Extract the four preview colors used by theme pickers.
 * Mirrors packages/theme-selector extractPreviewColors (build-time, not runtime).
 *
 * @param {object} tokens - Flat theme tokens
 * @param {string} themeId - Theme id for error context
 * @returns {{ bg: string, surface: string, accent: string, text: string }}
 */
function extractPreviewColors(tokens, themeId) {
  const required = [
    ["background", "base"],
    ["background", "surface"],
    ["brand", "primary"],
    ["text", "primary"],
  ];
  for (const [group, key] of required) {
    if (!tokens?.[group]?.[key]) {
      throw new Error(
        `[generate-catalog] Theme "${themeId}" is missing token path "${group}.${key}"`,
      );
    }
  }
  return {
    bg: tokens.background.base,
    surface: tokens.background.surface,
    accent: tokens.brand.primary,
    text: tokens.text.primary,
  };
}

/**
 * @param {object} theme - Flat theme entry from tokens.json
 * @returns {object} ThemeCatalogEntry
 */
function toCatalogEntry(theme) {
  const entry = {
    id: theme.id,
    label: theme.label,
    vendor: theme.vendor,
    appearance: theme.appearance,
    preview: extractPreviewColors(theme.tokens, theme.id),
  };
  if (theme.iconUrl) {
    entry.iconUrl = theme.iconUrl;
  }
  return entry;
}

function main() {
  if (!existsSync(tokensPath)) {
    console.error(`[generate-catalog] Missing ${tokensPath}. Run prepare-style-dictionary first.`);
    process.exit(1);
  }

  const tokensData = JSON.parse(readFileSync(tokensPath, "utf-8"));
  const themes = tokensData.themes ?? {};
  const themeIds = tokensData.meta?.themeIds ?? Object.keys(themes);

  const catalog = themeIds.map((id) => {
    const theme = themes[id];
    if (!theme) {
      throw new Error(`[generate-catalog] Theme "${id}" listed in meta but missing from themes`);
    }
    return toCatalogEntry(theme);
  });

  // Compact published export stays under the <5KB bundle budget; committed source
  // is prettier-formatted so `lintro chk` / prettier CI stay green.
  const compactPayload = JSON.stringify(catalog);
  const prettyPayload = `${JSON.stringify(catalog, null, 2)}\n`;
  const hash = createHash("sha256").update(compactPayload).digest("hex").slice(0, 12);

  const outputs = [
    { path: coreCatalogPath, payload: prettyPayload },
    { path: distCatalogPath, payload: compactPayload },
  ];

  for (const { path: outputPath, payload } of outputs) {
    mkdirSync(dirname(outputPath), { recursive: true });
    writeFileSync(outputPath, payload);
    console.log(
      `[generate-catalog] Wrote ${outputPath} (${catalog.length} themes, ${payload.length} bytes, sha=${hash})`,
    );
  }
}

main();
