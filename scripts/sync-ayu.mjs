#!/usr/bin/env node
/* SPDX-License-Identifier: MIT */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { dark, light, mirage } from 'ayu';

import {
  contrastRatio,
  escapeString,
  getLuminance,
  isValidIdentifier,
  stateTextOverrides,
} from './format-utils.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

// Read package version for source metadata
const ayuPackageJson = JSON.parse(
  fs.readFileSync(path.join(projectRoot, 'node_modules', 'ayu', 'package.json'), 'utf8'),
);
const ayuVersion = ayuPackageJson.version;

/**
 * Normalize an ayu Color to a solid #RRGGBB hex string.
 * Prefer blended-on-background for translucent colors so CSS tokens stay opaque.
 * @param {{ hex: (type?: 'rgb' | 'rgba' | 'blend') => string } | undefined} color
 * @param {string} [fallback]
 * @returns {string | undefined}
 */
function ayuHex(color, fallback) {
  if (!color || typeof color.hex !== 'function') return fallback;
  // Prefer blend for alpha colors; fall back to rgb (strips alpha) then raw hex
  const blended = color.hex('blend');
  if (typeof blended === 'string' && /^#[0-9a-fA-F]{6}$/.test(blended)) return blended;
  const rgb = color.hex('rgb');
  if (typeof rgb === 'string' && /^#[0-9a-fA-F]{6}$/.test(rgb)) return rgb;
  const raw = color.hex().replace(/^#/, '');
  if (/^[0-9a-fA-F]{6}/.test(raw)) return `#${raw.slice(0, 6)}`;
  return fallback;
}

/**
 * Ensure fg meets WCAG AA large-text contrast (3:1) against bg.
 * Tries candidates first, then darkens/brightens the preferred color.
 * @param {string} preferred
 * @param {string} bg
 * @param {string[]} candidates
 * @param {{ hex: (type?: 'rgb' | 'rgba' | 'blend') => string, darken: (n: number) => any, brighten: (n: number) => any } | undefined} sourceColor
 * @returns {string}
 */
function ensureReadable(preferred, bg, candidates = [], sourceColor = undefined) {
  const WCAG_AA_LARGE = 3.0;
  if (contrastRatio(preferred, bg) >= WCAG_AA_LARGE) return preferred;
  for (const c of candidates) {
    if (c && contrastRatio(c, bg) >= WCAG_AA_LARGE) return c;
  }
  if (sourceColor && typeof sourceColor.darken === 'function') {
    for (let step = 0.25; step <= 3; step += 0.25) {
      const darkened = ayuHex(sourceColor.darken(step));
      if (darkened && contrastRatio(darkened, bg) >= WCAG_AA_LARGE) return darkened;
      const brightened = ayuHex(sourceColor.brighten(step));
      if (brightened && contrastRatio(brightened, bg) >= WCAG_AA_LARGE) return brightened;
    }
  }
  return preferred;
}

function buildTokens(variant) {
  // Issue mapping (adapted to ayu v9 API):
  // - background.base/surface ← ui.bg / ui.panel.bg
  // - text.primary ← editor.fg (ui.fg is muted chrome; editor.fg is body text)
  // - state.danger ← common.error (syntax.error does not exist in ayu v9)
  // - state.warning/success/accent.link ← syntax.keyword/string/func
  const bgBase = ayuHex(variant.ui.bg, '#111111');
  const bgSurface = ayuHex(variant.ui.panel.bg, bgBase);
  // Prefer ui.line for overlay when it elevates above base. Mirage's ui.line is
  // darker than base (same token as border), which would invert elevation — fall
  // back to selection.active (lighter panel/surface tone) in that case.
  const lineCandidate = ayuHex(variant.ui.line, bgSurface);
  const elevatedCandidate = ayuHex(variant.ui.selection?.active, bgSurface);
  const isDarkBase = getLuminance(bgBase) < 0.5;
  const bgOverlay =
    isDarkBase && getLuminance(lineCandidate) < getLuminance(bgBase)
      ? elevatedCandidate
      : lineCandidate;
  const textPrimary = ayuHex(variant.editor.fg, '#ffffff');
  const textSecondary = ensureReadable(
    ayuHex(variant.ui.fg, textPrimary),
    bgBase,
    [ayuHex(variant.syntax.comment), textPrimary],
    variant.ui.fg,
  );
  const brandPrimary = ayuHex(variant.common.accent.tint, textPrimary);
  const stateInfo = ayuHex(variant.syntax.tag, brandPrimary);
  const stateSuccess = ayuHex(variant.syntax.string, '#22c55e');
  const stateWarning = ayuHex(variant.syntax.keyword, '#facc15');
  const stateDanger = ayuHex(variant.common.error, '#ef4444');
  const accentLink = ensureReadable(
    ayuHex(variant.syntax.func, brandPrimary),
    bgBase,
    [ayuHex(variant.syntax.constant), ayuHex(variant.common.accent.on), brandPrimary],
    variant.syntax.func,
  );
  const selectionBg = ayuHex(variant.ui.selection.active, bgSurface);
  const borderDefault = ayuHex(variant.ui.line, '#e5e7eb');

  return {
    background: { base: bgBase, surface: bgSurface, overlay: bgOverlay },
    text: { primary: textPrimary, secondary: textSecondary, inverse: bgBase },
    brand: { primary: brandPrimary },
    state: {
      info: stateInfo,
      success: stateSuccess,
      warning: stateWarning,
      danger: stateDanger,
      ...stateTextOverrides(
        {
          info: stateInfo,
          success: stateSuccess,
          warning: stateWarning,
          danger: stateDanger,
        },
        bgBase,
        textPrimary,
      ),
    },
    border: { default: borderDefault },
    accent: { link: accentLink },
    typography: {
      fonts: {
        sans: 'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
        mono: 'JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
      },
      webFonts: [
        'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap',
        'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&display=swap',
      ],
    },
    content: {
      heading: {
        h1: ayuHex(variant.syntax.func, textPrimary),
        h2: ayuHex(variant.syntax.entity, textPrimary),
        h3: ayuHex(variant.syntax.tag, textPrimary),
        h4: ayuHex(variant.syntax.string, textPrimary),
        h5: ayuHex(variant.syntax.constant, textPrimary),
        h6: ayuHex(variant.syntax.keyword, textPrimary),
      },
      body: { primary: textPrimary, secondary: textSecondary },
      link: { default: accentLink },
      selection: { fg: textPrimary, bg: selectionBg },
      blockquote: {
        border: borderDefault,
        fg: textPrimary,
        bg: bgSurface,
      },
      codeInline: { fg: textPrimary, bg: bgOverlay },
      codeBlock: { fg: textPrimary, bg: bgOverlay },
      table: {
        border: borderDefault,
        stripe: bgSurface,
        theadBg: bgOverlay,
      },
    },
  };
}

const VARIANTS = {
  dark: { scheme: dark, id: 'ayu-dark', label: 'Ayu Dark', appearance: 'dark' },
  light: { scheme: light, id: 'ayu-light', label: 'Ayu Light', appearance: 'light' },
  mirage: { scheme: mirage, id: 'ayu-mirage', label: 'Ayu Mirage', appearance: 'dark' },
};

function buildPackage() {
  const flavors = [];
  // Sort variant keys for deterministic output
  for (const key of Object.keys(VARIANTS).sort()) {
    const meta = VARIANTS[key];
    flavors.push({
      id: meta.id,
      label: meta.label,
      vendor: 'ayu',
      appearance: meta.appearance,
      tokens: buildTokens(meta.scheme),
    });
  }
  return {
    id: 'ayu',
    name: 'Ayu (synced)',
    homepage: 'https://ayutheme.com',
    license: {
      spdx: 'MIT',
      url: 'https://github.com/ayu-theme/ayu-colors/blob/master/license',
      copyright: 'Ayu Theme',
    },
    source: {
      package: 'ayu',
      version: ayuVersion,
      repository: 'https://github.com/ayu-theme/ayu-colors',
    },
    flavors,
  };
}

/** Convert flat token values into W3C Design Token $value/$type shape. */
function toW3cTokens(tokens) {
  const color = (value) => ({ $value: value, $type: 'color' });
  const fontFamily = (value) => ({ $value: value, $type: 'fontFamily' });
  return {
    background: {
      base: color(tokens.background.base),
      surface: color(tokens.background.surface),
      overlay: color(tokens.background.overlay),
    },
    text: {
      primary: color(tokens.text.primary),
      secondary: color(tokens.text.secondary),
      inverse: color(tokens.text.inverse),
    },
    brand: { primary: color(tokens.brand.primary) },
    state: {
      info: color(tokens.state.info),
      success: color(tokens.state.success),
      warning: color(tokens.state.warning),
      danger: color(tokens.state.danger),
      ...(tokens.state.infoText ? { infoText: color(tokens.state.infoText) } : {}),
      ...(tokens.state.successText ? { successText: color(tokens.state.successText) } : {}),
      ...(tokens.state.warningText ? { warningText: color(tokens.state.warningText) } : {}),
      ...(tokens.state.dangerText ? { dangerText: color(tokens.state.dangerText) } : {}),
    },
    border: { default: color(tokens.border.default) },
    accent: { link: color(tokens.accent.link) },
    typography: {
      fonts: {
        sans: fontFamily(tokens.typography.fonts.sans),
        mono: fontFamily(tokens.typography.fonts.mono),
      },
      webFonts: tokens.typography.webFonts,
    },
    content: {
      heading: {
        h1: color(tokens.content.heading.h1),
        h2: color(tokens.content.heading.h2),
        h3: color(tokens.content.heading.h3),
        h4: color(tokens.content.heading.h4),
        h5: color(tokens.content.heading.h5),
        h6: color(tokens.content.heading.h6),
      },
      body: {
        primary: color(tokens.content.body.primary),
        secondary: color(tokens.content.body.secondary),
      },
      link: { default: color(tokens.content.link.default) },
      selection: {
        fg: color(tokens.content.selection.fg),
        bg: color(tokens.content.selection.bg),
      },
      blockquote: {
        border: color(tokens.content.blockquote.border),
        fg: color(tokens.content.blockquote.fg),
        bg: color(tokens.content.blockquote.bg),
      },
      codeInline: {
        fg: color(tokens.content.codeInline.fg),
        bg: color(tokens.content.codeInline.bg),
      },
      codeBlock: {
        fg: color(tokens.content.codeBlock.fg),
        bg: color(tokens.content.codeBlock.bg),
      },
      table: {
        border: color(tokens.content.table.border),
        stripe: color(tokens.content.table.stripe),
        theadBg: color(tokens.content.table.theadBg),
      },
    },
  };
}

function writeW3cThemeFiles(pkg) {
  const themesDir = path.join(projectRoot, 'schema', 'tokens', 'themes');
  fs.mkdirSync(themesDir, { recursive: true });
  for (const flavor of pkg.flavors) {
    const doc = {
      $schema: '../../turbo-themes.schema.json#/$defs/ThemeFile',
      id: flavor.id,
      label: flavor.label,
      vendor: flavor.vendor,
      appearance: flavor.appearance,
      tokens: toW3cTokens(flavor.tokens),
    };
    const outPath = path.join(themesDir, `${flavor.id}.tokens.json`);
    fs.writeFileSync(outPath, `${JSON.stringify(doc, null, 2)}\n`, 'utf8');
    console.log(`Wrote ${outPath}`);
  }
}

const outPath = path.join(projectRoot, 'src', 'themes', 'packs', 'ayu.synced.ts');

// Ensure output directory exists
fs.mkdirSync(path.dirname(outPath), { recursive: true });

const pkg = buildPackage();

// Generate properly formatted TypeScript content
function formatObject(obj, indent = 0) {
  const spaces = '  '.repeat(indent);
  if (Array.isArray(obj)) {
    if (obj.length === 0) return '[]';
    const items = obj.map((item) => `${spaces}  ${formatObject(item, indent + 1)}`).join(',\n');
    return `[\n${items},\n${spaces}]`;
  } else if (obj && typeof obj === 'object') {
    const entries = Object.entries(obj);
    if (entries.length === 0) return '{}';
    const items = entries
      .map(([key, value]) => {
        const formattedValue = formatObject(value, indent + 1);
        // Quote keys that aren't valid identifiers (e.g., contain hyphens)
        const formattedKey = isValidIdentifier(key) ? key : `'${escapeString(key)}'`;
        return `${spaces}  ${formattedKey}: ${formattedValue}`;
      })
      .join(',\n');
    return `{\n${items},\n${spaces}}`;
  } else if (typeof obj === 'string') {
    return `'${escapeString(obj)}'`;
  } else {
    return String(obj);
  }
}

const rawContent = `import type { ThemePackage } from '../types.js';

/**
 * Ayu theme - Bright colors for comfortable all-day coding
 * Auto-synced from ayu
 * @see https://ayutheme.com
 * @license MIT
 *
 * DO NOT EDIT MANUALLY - regenerate with: node scripts/sync-ayu.mjs
 */
export const ayuSynced: ThemePackage = ${formatObject(pkg)} as const;
`;

// Write file first, then format with lintro
fs.writeFileSync(outPath, rawContent, 'utf8');

// Also keep W3C Design Token files aligned with the synced palette
writeW3cThemeFiles(pkg);

// Format with lintro using repository configuration
try {
  execSync(`uv run lintro fmt "${outPath}"`, {
    cwd: projectRoot,
    stdio: 'inherit',
  });
} catch {
  console.warn(`Warning: lintro fmt failed for ${outPath}, file written but may not be formatted`);
}

console.log(`Wrote ${outPath}`);
