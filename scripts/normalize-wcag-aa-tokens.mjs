#!/usr/bin/env bun
/**
 * Normalize theme token JSON to strict WCAG 2.x AA contrast.
 *
 * Runs after theme:sync so vendor sync scripts cannot regress AA gates.
 * - Normal text pairs: 4.5:1
 * - Heading (large text) pairs: 3:1
 * Ensures brand.primaryText and state.*Text exist with AA contrast on fills.
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const AA_N = 4.5;
const AA_L = 3.0;
const DIR = 'schema/tokens/themes';

function hexToRgb(hex) {
  const c = hex.replace('#', '');
  const n = c.length === 3 ? c.split('').map((x) => x + x).join('') : c;
  return [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16));
}

function rgbToHex([r, g, b]) {
  return (
    '#' +
    [r, g, b]
      .map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0'))
      .join('')
  );
}

function luminance(hex) {
  const rgb = hexToRgb(hex).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2];
}

function ratio(a, b) {
  const L1 = luminance(a);
  const L2 = luminance(b);
  const [hi, lo] = L1 > L2 ? [L1, L2] : [L2, L1];
  return (hi + 0.05) / (lo + 0.05);
}

function mixToward(hex, target, t) {
  const a = hexToRgb(hex);
  const b = hexToRgb(target);
  return rgbToHex(a.map((v, i) => v + (b[i] - v) * t));
}

function ensureContrast(fg, bg, min) {
  if (ratio(fg, bg) >= min) return fg;
  let best = fg;
  let bestR = ratio(fg, bg);
  for (const target of ['#000000', '#ffffff']) {
    for (let i = 1; i <= 100; i++) {
      const cand = mixToward(fg, target, i / 100);
      const r = ratio(cand, bg);
      if (r > bestR) {
        bestR = r;
        best = cand;
      }
      if (r >= min) return cand;
    }
  }
  return best;
}

function ensureContrastBg(fg, bg, min) {
  if (ratio(fg, bg) >= min) return bg;
  let best = bg;
  let bestR = ratio(fg, bg);
  for (const target of ['#000000', '#ffffff']) {
    for (let i = 1; i <= 100; i++) {
      const cand = mixToward(bg, target, i / 100);
      const r = ratio(fg, cand);
      if (r > bestR) {
        bestR = r;
        best = cand;
      }
      if (r >= min) return cand;
    }
  }
  return best;
}

function bestOn(bg, candidates) {
  let best = candidates[0];
  let bestR = -1;
  for (const c of candidates.filter(Boolean)) {
    const r = ratio(c, bg);
    if (r > bestR) {
      bestR = r;
      best = c;
    }
  }
  return best;
}

function setColor(obj, key, value) {
  if (!obj[key]) obj[key] = { $value: value, $type: 'color' };
  else obj[key].$value = value;
}

let filesChanged = 0;
let fixCount = 0;

for (const file of readdirSync(DIR).filter((f) => f.endsWith('.tokens.json'))) {
  const path = join(DIR, file);
  const json = JSON.parse(readFileSync(path, 'utf8'));
  const t = json.tokens;
  if (!t?.background?.base?.$value) continue;
  const base = t.background.base.$value;
  let changed = false;

  const bump = (label, oldVal, neu) => {
    if (oldVal.toLowerCase() !== neu.toLowerCase()) {
      changed = true;
      fixCount++;
    }
  };

  if (t.text?.secondary?.$value) {
    const old = t.text.secondary.$value;
    const neu = ensureContrast(old, base, AA_N);
    bump('text.secondary', old, neu);
    t.text.secondary.$value = neu;
  }
  if (t.text?.muted?.$value) {
    const old = t.text.muted.$value;
    const neu = ensureContrast(old, base, AA_N);
    bump('text.muted', old, neu);
    t.text.muted.$value = neu;
  }
  if (t.content?.body?.secondary?.$value) {
    const old = t.content.body.secondary.$value;
    const neu = ensureContrast(old, base, AA_N);
    bump('body.secondary', old, neu);
    t.content.body.secondary.$value = neu;
  }
  if (t.accent?.link?.$value) {
    const old = t.accent.link.$value;
    const neu = ensureContrast(old, base, AA_N);
    bump('accent.link', old, neu);
    t.accent.link.$value = neu;
  }
  if (t.content?.link?.default?.$value) {
    const old = t.content.link.default.$value;
    const neu = ensureContrast(old, base, AA_N);
    bump('content.link', old, neu);
    t.content.link.default.$value = neu;
  }
  if (t.content?.heading) {
    for (const h of ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']) {
      if (!t.content.heading[h]?.$value) continue;
      const old = t.content.heading[h].$value;
      const neu = ensureContrast(old, base, AA_L);
      bump(`heading.${h}`, old, neu);
      t.content.heading[h].$value = neu;
    }
  }
  if (t.content?.codeInline?.fg?.$value && t.content?.codeInline?.bg?.$value) {
    const fg = t.content.codeInline.fg.$value;
    const bg = t.content.codeInline.bg.$value;
    const neu = ensureContrast(fg, bg, AA_N);
    bump('codeInline', fg, neu);
    t.content.codeInline.fg.$value = neu;
  }
  if (t.content?.codeBlock?.fg?.$value && t.content?.codeBlock?.bg?.$value) {
    const fg = t.content.codeBlock.fg.$value;
    const bg = t.content.codeBlock.bg.$value;
    const neu = ensureContrast(fg, bg, AA_N);
    bump('codeBlock', fg, neu);
    t.content.codeBlock.fg.$value = neu;
  }
  if (t.content?.selection?.fg?.$value && t.content?.selection?.bg?.$value) {
    const fg = t.content.selection.fg.$value;
    const bg = t.content.selection.bg.$value;
    const neuBg = ensureContrastBg(fg, bg, AA_N);
    bump('selection.bg', bg, neuBg);
    t.content.selection.bg.$value = neuBg;
  }
  if (t.content?.blockquote?.fg?.$value && t.content?.blockquote?.bg?.$value) {
    const fg = t.content.blockquote.fg.$value;
    const bg = t.content.blockquote.bg.$value;
    const neu = ensureContrast(fg, bg, AA_N);
    bump('blockquote', fg, neu);
    t.content.blockquote.fg.$value = neu;
  }

  if (t.brand?.primary?.$value) {
    const brand = t.brand.primary.$value;
    const candidates = [
      t.brand.primaryText?.$value,
      t.text?.inverse?.$value,
      t.background?.base?.$value,
      '#000000',
      '#ffffff',
    ];
    const best = bestOn(brand, candidates);
    const old = t.brand.primaryText?.$value ?? '';
    setColor(t.brand, 'primaryText', best);
    if (old.toLowerCase() !== best.toLowerCase()) {
      changed = true;
      fixCount++;
    }
  }

  if (t.state) {
    for (const key of ['info', 'success', 'warning', 'danger']) {
      if (!t.state[key]?.$value) continue;
      let bg = t.state[key].$value;
      const textKey = `${key}Text`;
      const candidates = [
        t.state[textKey]?.$value,
        t.text?.inverse?.$value,
        t.text?.primary?.$value,
        '#000000',
        '#ffffff',
      ];
      let fg = bestOn(bg, candidates);
      if (ratio(fg, bg) < AA_N) {
        const preferBlack = ratio('#000000', bg) >= ratio('#ffffff', bg);
        fg = preferBlack ? '#000000' : '#ffffff';
        const toward = preferBlack ? '#ffffff' : '#000000';
        for (let i = 1; i <= 100; i++) {
          const cand = mixToward(bg, toward, i / 100);
          if (ratio(fg, cand) >= AA_N) {
            bg = cand;
            break;
          }
        }
        if (bg.toLowerCase() !== t.state[key].$value.toLowerCase()) {
          t.state[key].$value = bg;
          changed = true;
          fixCount++;
        }
      }
      const old = t.state[textKey]?.$value ?? '';
      setColor(t.state, textKey, fg);
      if (old.toLowerCase() !== fg.toLowerCase()) {
        changed = true;
        fixCount++;
      }
    }
  }

  if (changed) {
    writeFileSync(path, JSON.stringify(json, null, 2) + '\n');
    filesChanged++;
  }
}

console.log(`[normalize-wcag-aa] updated ${filesChanged} theme files (${fixCount} value fixes)`);
