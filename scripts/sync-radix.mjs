#!/usr/bin/env node
/* SPDX-License-Identifier: MIT */
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  amber,
  amberDark,
  blue,
  blueDark,
  cyan,
  cyanDark,
  green,
  greenDark,
  mauve,
  mauveDark,
  red,
  redDark,
  slate,
  slateDark,
  violet,
  violetDark,
} from "@radix-ui/colors";

import { escapeString, isValidIdentifier, stateTextOverrides } from "./format-utils.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

// Read package version for source metadata
const radixPackageJson = JSON.parse(
  fs.readFileSync(
    path.join(projectRoot, "node_modules", "@radix-ui", "colors", "package.json"),
    "utf8",
  ),
);
const radixVersion = radixPackageJson.version;

/**
 * Normalize a hex color to lowercase #rrggbb.
 * @param {string | undefined} value
 * @param {string} fallback
 * @returns {string}
 */
function hex(value, fallback) {
  if (typeof value !== "string" || value.length === 0) return fallback;
  const normalized = value.startsWith("#") ? value : `#${value}`;
  return normalized.toLowerCase();
}

/**
 * Read a step from a Radix scale. v3 dark scales reuse the light prefix
 * (e.g. slateDark.slate1, not slateDark.slateDark1).
 * @param {Record<string, string>} scale
 * @param {string} prefix
 * @param {number} step
 * @returns {string | undefined}
 */
function step(scale, prefix, stepNum) {
  return scale[`${prefix}${stepNum}`];
}

/**
 * Build ThemeTokens from a Radix neutral scale + accent scales.
 * @param {Record<string, string>} neutral
 * @param {string} neutralPrefix
 * @param {Record<string, string>} brandScale
 * @param {string} brandPrefix
 * @param {Record<string, string>} infoScale
 * @param {string} infoPrefix
 * @param {Record<string, string>} successScale
 * @param {string} successPrefix
 * @param {Record<string, string>} warningScale
 * @param {string} warningPrefix
 * @param {Record<string, string>} dangerScale
 * @param {string} dangerPrefix
 * @param {Record<string, string>} accentScale
 * @param {string} accentPrefix
 * @returns {import('../packages/core/src/themes/types.js').ThemeTokens}
 */
function buildTokens(
  neutral,
  neutralPrefix,
  brandScale,
  brandPrefix,
  infoScale,
  infoPrefix,
  successScale,
  successPrefix,
  warningScale,
  warningPrefix,
  dangerScale,
  dangerPrefix,
  accentScale,
  accentPrefix,
) {
  const bgBase = hex(step(neutral, neutralPrefix, 1), "#111111");
  const bgSurface = hex(step(neutral, neutralPrefix, 2), bgBase);
  const bgOverlay = hex(step(neutral, neutralPrefix, 3), bgSurface);
  const textPrimary = hex(step(neutral, neutralPrefix, 12), "#ffffff");
  const textSecondary = hex(step(neutral, neutralPrefix, 11), textPrimary);
  const brandPrimary = hex(step(brandScale, brandPrefix, 9), textPrimary);
  const linkColor = hex(step(brandScale, brandPrefix, 11), brandPrimary);
  const borderDefault = hex(step(neutral, neutralPrefix, 6), "#e5e7eb");

  const infoColor = hex(step(infoScale, infoPrefix, 9), brandPrimary);
  const successColor = hex(step(successScale, successPrefix, 9), "#30a46c");
  const warningColor = hex(step(warningScale, warningPrefix, 9), "#ffc53d");
  const dangerColor = hex(step(dangerScale, dangerPrefix, 9), "#e5484d");

  // Headings use step 11 (text-friendly) for readable accent hues
  const h1 = hex(step(successScale, successPrefix, 11), successColor);
  const h2 = hex(step(brandScale, brandPrefix, 11), brandPrimary);
  const h3 = hex(step(infoScale, infoPrefix, 11), infoColor);
  const h4 = hex(step(warningScale, warningPrefix, 11), warningColor);
  const h5 = hex(step(accentScale, accentPrefix, 11), linkColor);
  const h6 = hex(step(dangerScale, dangerPrefix, 11), dangerColor);

  const selectionBg = hex(step(neutral, neutralPrefix, 5), bgOverlay);
  const codeBg = hex(step(neutral, neutralPrefix, 3), bgOverlay);
  const tableStripe = hex(step(neutral, neutralPrefix, 2), bgSurface);
  const tableHead = hex(step(neutral, neutralPrefix, 4), bgOverlay);
  const softBorder = hex(step(neutral, neutralPrefix, 7), borderDefault);

  return {
    background: { base: bgBase, surface: bgSurface, overlay: bgOverlay },
    text: { primary: textPrimary, secondary: textSecondary, inverse: bgBase },
    brand: { primary: brandPrimary },
    state: {
      info: infoColor,
      success: successColor,
      warning: warningColor,
      danger: dangerColor,
      ...stateTextOverrides(
        {
          info: infoColor,
          success: successColor,
          warning: warningColor,
          danger: dangerColor,
        },
        bgBase,
        textPrimary,
      ),
    },
    border: { default: borderDefault },
    accent: { link: linkColor },
    typography: {
      fonts: {
        sans: 'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
        mono: 'JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
      },
      webFonts: [
        "https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap",
        "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&display=swap",
      ],
    },
    content: {
      heading: { h1, h2, h3, h4, h5, h6 },
      body: { primary: textPrimary, secondary: textSecondary },
      link: { default: linkColor },
      selection: { fg: textPrimary, bg: selectionBg },
      blockquote: { border: softBorder, fg: textPrimary, bg: bgSurface },
      codeInline: { fg: textPrimary, bg: codeBg },
      codeBlock: { fg: textPrimary, bg: codeBg },
      table: { border: softBorder, stripe: tableStripe, theadBg: tableHead },
    },
  };
}

/** @type {Array<{ id: string, label: string, appearance: 'light' | 'dark', neutral: Record<string, string>, neutralPrefix: string, brand: Record<string, string>, brandPrefix: string, info: Record<string, string>, infoPrefix: string, success: Record<string, string>, successPrefix: string, warning: Record<string, string>, warningPrefix: string, danger: Record<string, string>, dangerPrefix: string, accent: Record<string, string>, accentPrefix: string }>} */
const VARIANTS = [
  {
    id: "radix-slate-dark",
    label: "Radix Colors Slate Dark",
    appearance: "dark",
    neutral: slateDark,
    neutralPrefix: "slate",
    brand: blueDark,
    brandPrefix: "blue",
    info: cyanDark,
    infoPrefix: "cyan",
    success: greenDark,
    successPrefix: "green",
    warning: amberDark,
    warningPrefix: "amber",
    danger: redDark,
    dangerPrefix: "red",
    accent: violetDark,
    accentPrefix: "violet",
  },
  {
    id: "radix-slate-light",
    label: "Radix Colors Slate Light",
    appearance: "light",
    neutral: slate,
    neutralPrefix: "slate",
    brand: blue,
    brandPrefix: "blue",
    info: cyan,
    infoPrefix: "cyan",
    success: green,
    successPrefix: "green",
    warning: amber,
    warningPrefix: "amber",
    danger: red,
    dangerPrefix: "red",
    accent: violet,
    accentPrefix: "violet",
  },
  {
    id: "radix-mauve-dark",
    label: "Radix Colors Mauve Dark",
    appearance: "dark",
    neutral: mauveDark,
    neutralPrefix: "mauve",
    brand: blueDark,
    brandPrefix: "blue",
    info: cyanDark,
    infoPrefix: "cyan",
    success: greenDark,
    successPrefix: "green",
    warning: amberDark,
    warningPrefix: "amber",
    danger: redDark,
    dangerPrefix: "red",
    accent: violetDark,
    accentPrefix: "violet",
  },
  {
    id: "radix-mauve-light",
    label: "Radix Colors Mauve Light",
    appearance: "light",
    neutral: mauve,
    neutralPrefix: "mauve",
    brand: blue,
    brandPrefix: "blue",
    info: cyan,
    infoPrefix: "cyan",
    success: green,
    successPrefix: "green",
    warning: amber,
    warningPrefix: "amber",
    danger: red,
    dangerPrefix: "red",
    accent: violet,
    accentPrefix: "violet",
  },
];

function buildPackage() {
  // Deterministic ordering by variant id
  const sorted = [...VARIANTS].sort((a, b) => a.id.localeCompare(b.id));
  const flavors = sorted.map((variant) => ({
    id: variant.id,
    label: variant.label,
    vendor: "radix",
    appearance: variant.appearance,
    iconUrl: `/assets/img/radix-slate-${variant.appearance}.png`,
    tokens: buildTokens(
      variant.neutral,
      variant.neutralPrefix,
      variant.brand,
      variant.brandPrefix,
      variant.info,
      variant.infoPrefix,
      variant.success,
      variant.successPrefix,
      variant.warning,
      variant.warningPrefix,
      variant.danger,
      variant.dangerPrefix,
      variant.accent,
      variant.accentPrefix,
    ),
  }));

  return {
    id: "radix",
    name: "Radix Colors (synced)",
    homepage: "https://www.radix-ui.com/colors",
    license: {
      spdx: "MIT",
      url: "https://github.com/radix-ui/colors/blob/main/LICENSE",
      copyright: "WorkOS",
    },
    source: {
      package: "@radix-ui/colors",
      version: radixVersion,
      repository: "https://github.com/radix-ui/colors",
    },
    flavors,
  };
}

/**
 * Convert a plain color group to W3C Design Token format.
 * @param {Record<string, string>} group
 */
function toColorGroup(group) {
  /** @type {Record<string, { $value: string, $type: string }>} */
  const result = {};
  for (const [key, value] of Object.entries(group)) {
    result[key] = { $value: value, $type: "color" };
  }
  return result;
}

/**
 * Write W3C token JSON for a flavor (keeps schema tokens in sync with the pack).
 * @param {{ id: string, label: string, vendor: string, appearance: string, iconUrl?: string, tokens: Record<string, unknown> }} flavor
 */
// Per-theme picker descriptions required by the ThemeFile schema (consumed by
// generate-metadata.mjs).
const THEME_DESCRIPTIONS = {
  "radix-slate-dark": "Neutral blue-gray Radix dark theme for accessible UIs.",
  "radix-slate-light": "Neutral blue-gray Radix light theme for accessible UIs.",
  "radix-mauve-dark": "Neutral purple-gray Radix dark theme for accessible UIs.",
  "radix-mauve-light": "Neutral purple-gray Radix light theme for accessible UIs.",
};

function writeTokenJson(flavor) {
  const tokens = /** @type {Record<string, any>} */ (flavor.tokens);
  const description = THEME_DESCRIPTIONS[flavor.id];
  if (!description) {
    throw new Error(`[sync-radix] Missing THEME_DESCRIPTIONS entry for "${flavor.id}"`);
  }
  const out = {
    $schema: "../../turbo-themes.schema.json#/$defs/ThemeFile",
    id: flavor.id,
    label: flavor.label,
    vendor: flavor.vendor,
    appearance: flavor.appearance,
    description,
    icon: `radix-slate-${flavor.appearance}.png`,
    tokens: {
      background: toColorGroup(tokens.background),
      text: toColorGroup(tokens.text),
      brand: toColorGroup(tokens.brand),
      state: toColorGroup(tokens.state),
      border: toColorGroup(tokens.border),
      accent: toColorGroup(tokens.accent),
      typography: {
        fonts: {
          sans: { $value: tokens.typography.fonts.sans, $type: "fontFamily" },
          mono: { $value: tokens.typography.fonts.mono, $type: "fontFamily" },
        },
        webFonts: tokens.typography.webFonts,
      },
      content: {
        heading: toColorGroup(tokens.content.heading),
        body: toColorGroup(tokens.content.body),
        link: toColorGroup(tokens.content.link),
        selection: toColorGroup(tokens.content.selection),
        blockquote: toColorGroup(tokens.content.blockquote),
        codeInline: toColorGroup(tokens.content.codeInline),
        codeBlock: toColorGroup(tokens.content.codeBlock),
        table: toColorGroup(tokens.content.table),
      },
    },
  };

  const outDir = path.join(projectRoot, "schema", "tokens", "themes");
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `${flavor.id}.tokens.json`);
  fs.writeFileSync(outPath, `${JSON.stringify(out, null, 2)}\n`, "utf8");
  return outPath;
}

// Generate properly formatted TypeScript content
function formatObject(obj, indent = 0) {
  const spaces = "  ".repeat(indent);
  if (Array.isArray(obj)) {
    if (obj.length === 0) return "[]";
    const items = obj.map((item) => `${spaces}  ${formatObject(item, indent + 1)}`).join(",\n");
    return `[\n${items},\n${spaces}]`;
  } else if (obj && typeof obj === "object") {
    const entries = Object.entries(obj);
    if (entries.length === 0) return "{}";
    const items = entries
      .map(([key, value]) => {
        const formattedValue = formatObject(value, indent + 1);
        const formattedKey = isValidIdentifier(key) ? key : `'${escapeString(key)}'`;
        return `${spaces}  ${formattedKey}: ${formattedValue}`;
      })
      .join(",\n");
    return `{\n${items},\n${spaces}}`;
  } else if (typeof obj === "string") {
    return `'${escapeString(obj)}'`;
  } else {
    return String(obj);
  }
}

const outPath = path.join(projectRoot, "src", "themes", "packs", "radix.synced.ts");
fs.mkdirSync(path.dirname(outPath), { recursive: true });

const pkg = buildPackage();

const rawContent = `import type { ThemePackage } from '../types.js';

/**
 * Radix Colors theme - accessibility-focused color system by WorkOS
 * Auto-synced from @radix-ui/colors
 * @see https://www.radix-ui.com/colors
 * @license MIT
 *
 * DO NOT EDIT MANUALLY - regenerate with: node scripts/sync-radix.mjs
 */
export const radixSynced: ThemePackage = ${formatObject(pkg)} as const;
`;

// Write file first, then format with the repo-pinned oxfmt devDependency.
// Must be an environment-independent formatter that fails loudly: silently
// skipping formatting commits differently-quoted output and breaks the
// theme-sync determinism check (issue #651).
fs.writeFileSync(outPath, rawContent, "utf8");
execSync(`bunx oxfmt --ignore-path=.gitignore "${outPath}"`, {
  cwd: projectRoot,
  stdio: "inherit",
});

console.log(`Wrote ${outPath}`);

for (const flavor of pkg.flavors) {
  const tokenPath = writeTokenJson(flavor);
  console.log(`Wrote ${tokenPath}`);
}

console.log(
  `Synced ${pkg.flavors.length} Radix Colors themes from @radix-ui/colors@${radixVersion}`,
);
