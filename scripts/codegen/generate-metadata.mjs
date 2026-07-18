#!/usr/bin/env node
// SPDX-License-Identifier: MIT
/**
 * Theme metadata map generator.
 *
 * Reads schema/tokens/themes/*.tokens.json and schema/tokens/_vendors.json,
 * then emits committed TypeScript maps consumed by core, theme-selector, and
 * the docs site.
 *
 * Outputs:
 *   - packages/core/src/themes/generated/metadata.ts
 *   - packages/theme-selector/src/generated/theme-maps.ts
 *
 * Run via: bun run generate:metadata (also wired into build:tokens)
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT_DIR = join(__dirname, '..', '..');

const THEMES_DIR = join(ROOT_DIR, 'schema', 'tokens', 'themes');
const VENDORS_FILE = join(ROOT_DIR, 'schema', 'tokens', '_vendors.json');
const CORE_OUTPUT = join(ROOT_DIR, 'packages', 'core', 'src', 'themes', 'generated', 'metadata.ts');
const SELECTOR_OUTPUT = join(
  ROOT_DIR,
  'packages',
  'theme-selector',
  'src',
  'generated',
  'theme-maps.ts',
);

const IMG_PREFIX = 'assets/img/';

/**
 * Serialize a JSON-compatible value as a TypeScript expression.
 * @param {unknown} value
 * @returns {string}
 */
function serializeTsValue(value) {
  return JSON.stringify(value, null, 2);
}

/**
 * @param {string} filename
 * @returns {string}
 */
function withImgPrefix(filename) {
  if (filename.startsWith(IMG_PREFIX)) return filename;
  return `${IMG_PREFIX}${filename}`;
}

/**
 * @param {string | { light: string, dark: string }} icon
 * @param {(name: string) => string} mapFilename
 * @returns {string | { light: string, dark: string }}
 */
function mapVendorIcon(icon, mapFilename) {
  if (typeof icon === 'string') return mapFilename(icon);
  return {
    light: mapFilename(icon.light),
    dark: mapFilename(icon.dark),
  };
}

/**
 * Load and validate theme + vendor metadata from the schema directory.
 * @returns {{ themes: object[], vendors: object[] }}
 */
function loadSources() {
  if (!existsSync(VENDORS_FILE)) {
    throw new Error(`[generate-metadata] Missing ${VENDORS_FILE}`);
  }
  if (!existsSync(THEMES_DIR)) {
    throw new Error(`[generate-metadata] Missing ${THEMES_DIR}`);
  }

  const vendorsData = JSON.parse(readFileSync(VENDORS_FILE, 'utf-8'));
  const vendors = vendorsData.vendors;
  if (!Array.isArray(vendors) || vendors.length === 0) {
    throw new Error('[generate-metadata] _vendors.json must contain a non-empty vendors array');
  }

  const themeFiles = readdirSync(THEMES_DIR)
    .filter((f) => f.endsWith('.tokens.json'))
    .sort();

  const themes = themeFiles.map((file) => {
    const data = JSON.parse(readFileSync(join(THEMES_DIR, file), 'utf-8'));
    if (!data.id || !data.vendor || !data.appearance) {
      throw new Error(`[generate-metadata] Theme file ${file} is missing id/vendor/appearance`);
    }
    if (typeof data.description !== 'string' || data.description.length === 0) {
      throw new Error(`[generate-metadata] Theme "${data.id}" is missing required description`);
    }
    if (typeof data.icon !== 'string' || data.icon.length === 0) {
      throw new Error(`[generate-metadata] Theme "${data.id}" is missing required icon`);
    }
    return data;
  });

  const vendorIds = new Set(vendors.map((v) => v.id));
  const themeVendors = new Set(themes.map((t) => t.vendor));

  for (const vendorId of themeVendors) {
    if (!vendorIds.has(vendorId)) {
      throw new Error(
        `[generate-metadata] Theme vendor "${vendorId}" is missing from _vendors.json`,
      );
    }
  }
  for (const vendor of vendors) {
    if (!themeVendors.has(vendor.id)) {
      throw new Error(
        `[generate-metadata] Vendor "${vendor.id}" in _vendors.json has no theme files`,
      );
    }
  }

  return { themes, vendors };
}

/**
 * @param {object[]} themes
 * @param {object[]} vendors
 * @returns {string}
 */
function generateCoreMetadata(themes, vendors) {
  const themeIds = themes.map((t) => t.id);
  const vendorOrder = vendors.map((v) => v.id);

  const descriptions = Object.fromEntries(themes.map((t) => [t.id, t.description]));
  const icons = Object.fromEntries(themes.map((t) => [t.id, t.icon]));
  const vendorIcons = Object.fromEntries(
    vendors.map((v) => [v.id, mapVendorIcon(v.icon, (name) => name)]),
  );
  const vendorFamilies = Object.fromEntries(
    vendors.map((v) => [v.id, { name: v.name, description: v.description }]),
  );

  return `// SPDX-License-Identifier: MIT
// AUTO-GENERATED FILE - DO NOT EDIT DIRECTLY
// Generated from: schema/tokens/themes/*.tokens.json + schema/tokens/_vendors.json
// Generator: scripts/codegen/generate-metadata.mjs
// Run: bun run generate:metadata

/**
 * All theme IDs as a readonly tuple (sorted by token filename).
 * Used to derive the {@link ThemeId} literal union.
 */
export const THEME_IDS = [
${themeIds.map((id) => `  '${id}',`).join('\n')}
] as const;

/** Union of every valid theme identifier. */
export type ThemeId = (typeof THEME_IDS)[number];

/**
 * Ordered list of vendor IDs controlling display order in dropdowns.
 * Source: schema/tokens/_vendors.json
 */
export const VENDOR_ORDER = [
${vendorOrder.map((id) => `  '${id}',`).join('\n')}
] as const;

/** Union of every vendor identifier. */
export type VendorId = (typeof VENDOR_ORDER)[number];

/** Per-theme human-readable descriptions for UI pickers. */
export const THEME_DESCRIPTIONS = ${serializeTsValue(descriptions)} as const satisfies Record<
  ThemeId,
  string
>;

/** Per-theme icon filenames relative to assets/img/. */
export const THEME_ICONS = ${serializeTsValue(icons)} as const satisfies Record<ThemeId, string>;

/** Per-vendor default icons (filename or light/dark pair). */
export const VENDOR_ICONS = ${serializeTsValue(vendorIcons)} as const;

/** Per-vendor family display metadata. */
export const VENDOR_FAMILY_META = ${serializeTsValue(vendorFamilies)} as const satisfies Record<
  VendorId,
  { name: string; description: string }
>;
`;
}

/**
 * @param {object[]} themes
 * @param {object[]} vendors
 * @returns {string}
 */
function generateSelectorMaps(themes, vendors) {
  const vendorOrder = vendors.map((v) => v.id);
  const familyUnion = vendorOrder.map((id) => `'${id}'`).join('\n  | ');

  const themeFamilies = Object.fromEntries(
    vendors.map((v) => [v.id, { name: v.name, description: v.description }]),
  );
  const vendorFamilyMap = Object.fromEntries(vendors.map((v) => [v.id, v.id]));
  const vendorIconMap = Object.fromEntries(
    vendors.map((v) => [v.id, mapVendorIcon(v.icon, withImgPrefix)]),
  );
  const flavorDescriptions = Object.fromEntries(themes.map((t) => [t.id, t.description]));

  return `// SPDX-License-Identifier: MIT
// AUTO-GENERATED FILE - DO NOT EDIT DIRECTLY
// Generated from: schema/tokens/themes/*.tokens.json + schema/tokens/_vendors.json
// Generator: scripts/codegen/generate-metadata.mjs
// Run: bun run generate:metadata

/** Theme family identifiers (one per vendor). */
export type ThemeFamily =
  | ${familyUnion};

export interface ThemeFamilyMeta {
  name: string;
  description: string;
}

/** Family display metadata keyed by ThemeFamily. */
export const THEME_FAMILIES: Record<ThemeFamily, ThemeFamilyMeta> = ${serializeTsValue(
    themeFamilies,
  )};

/** Vendor to family mapping. */
export const VENDOR_FAMILY_MAP: Record<string, ThemeFamily> = ${serializeTsValue(vendorFamilyMap)};

/** Icon configuration - string for single icon, object for appearance-specific. */
export interface AppearanceIcons {
  light: string;
  dark: string;
}

/** Vendor icon paths relative to the published package root (assets/img/...). */
export const VENDOR_ICON_MAP: Record<string, string | AppearanceIcons> = ${serializeTsValue(
    vendorIconMap,
  )};

/** Predefined flavor descriptions keyed by theme id. */
export const FLAVOR_DESCRIPTIONS: Record<string, string> = ${serializeTsValue(flavorDescriptions)};
`;
}

function main() {
  console.log('📝 Generating theme metadata maps...');
  const { themes, vendors } = loadSources();

  const coreSource = generateCoreMetadata(themes, vendors);
  const selectorSource = generateSelectorMaps(themes, vendors);

  mkdirSync(dirname(CORE_OUTPUT), { recursive: true });
  mkdirSync(dirname(SELECTOR_OUTPUT), { recursive: true });
  writeFileSync(CORE_OUTPUT, coreSource);
  writeFileSync(SELECTOR_OUTPUT, selectorSource);

  console.log(`   ✅ ${CORE_OUTPUT} (${themes.length} themes, ${vendors.length} vendors)`);
  console.log(`   ✅ ${SELECTOR_OUTPUT}`);
}

main();
