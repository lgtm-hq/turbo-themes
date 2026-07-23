#!/usr/bin/env bun
/**
 * Normalize theme token JSON to strict WCAG 2.x AA contrast.
 *
 * Runs after theme:sync so vendor sync scripts cannot regress AA gates.
 * - Normal text pairs: 4.5:1
 * - Heading (large text) pairs: 3:1
 * Ensures brand.primaryText and state.*Text exist with AA contrast on fills.
 *
 * Ink picking prefers near-theme colors that already clear AA — it does not
 * maximize into #000/#fff when a themed pair (e.g. text.inverse on brand)
 * already meets the floor. Brand CTA ink is gated against both
 * `--gradient-primary` stops (brand.primary + state.info).
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const AA_N = 4.75; // headroom above axe/WCAG 4.5 floor (sampling + AA edge cases)
const AA_L = 3.0;
const DIR = 'schema/tokens/themes';
const EXTREMES = ['#000000', '#ffffff'];

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

function isExtreme(hex) {
  const h = hex.toLowerCase();
  return h === '#000000' || h === '#000' || h === '#ffffff' || h === '#fff';
}

function ensureContrast(fg, bg, min) {
  if (ratio(fg, bg) >= min) return fg;
  let best = fg;
  let bestR = ratio(fg, bg);
  for (const target of EXTREMES) {
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
  for (const target of EXTREMES) {
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

/**
 * Pick ink for one or more fills: keep the first near-theme candidate that
 * already clears `min` on every background; otherwise nudge a themed seed
 * toward black/white until AA; extremes only as last resort.
 * Returns null when no ink clears every background (caller may nudge fills).
 */
function pickInkOn(bgs, preferred, min) {
  const near = preferred.filter(Boolean);
  const themed = near.filter((c) => !isExtreme(c));

  for (const c of themed) {
    if (bgs.every((bg) => ratio(c, bg) >= min)) return c;
  }

  const seed = themed[0] ?? near[0] ?? '#ffffff';
  for (const target of EXTREMES) {
    for (let i = 1; i <= 100; i++) {
      const cand = mixToward(seed, target, i / 100);
      if (bgs.every((bg) => ratio(cand, bg) >= min)) return cand;
    }
  }

  for (const ext of EXTREMES) {
    if (bgs.every((bg) => ratio(ext, bg) >= min)) return ext;
  }
  return null;
}

/** Extreme (or near-theme) with the best worst-case contrast across fills. */
function bestEffortInk(bgs, preferred) {
  const candidates = [
    ...preferred.filter((c) => c && !isExtreme(c)),
    ...EXTREMES,
  ];
  let best = candidates[0] ?? '#000000';
  let bestScore = -1;
  for (const c of candidates.filter(Boolean)) {
    const score = Math.min(...bgs.map((bg) => ratio(c, bg)));
    if (score > bestScore) {
      bestScore = score;
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

  // Overlay can be a mid-tone accent surface that cannot host the same ink as
  // base/surface; gate text/link/heading AA against base + surface only.
  const bgs = [base, t.background?.surface?.$value].filter(Boolean);

  const ensureOnAllBgs = (fg, min) => {
    const ok = (cand) => bgs.every((bg) => ratio(cand, bg) >= min);
    if (ok(fg)) return fg;
    // Search mixes toward black and white; keep the first candidate that
    // clears every background (avoids sequential tug-of-war across layers).
    let best = fg;
    let bestScore = Math.min(...bgs.map((bg) => ratio(fg, bg)));
    for (const target of EXTREMES) {
      for (let i = 1; i <= 100; i++) {
        const cand = mixToward(fg, target, i / 100);
        const score = Math.min(...bgs.map((bg) => ratio(cand, bg)));
        if (score > bestScore) {
          bestScore = score;
          best = cand;
        }
        if (ok(cand)) return cand;
      }
    }
    return best;
  };

  if (t.text?.primary?.$value) {
    const old = t.text.primary.$value;
    const neu = ensureOnAllBgs(old, AA_N);
    bump('text.primary', old, neu);
    t.text.primary.$value = neu;
  }
  if (t.content?.body?.primary?.$value) {
    const old = t.content.body.primary.$value;
    const neu = ensureOnAllBgs(old, AA_N);
    bump('body.primary', old, neu);
    t.content.body.primary.$value = neu;
  }
  if (t.text?.secondary?.$value) {
    const old = t.text.secondary.$value;
    const neu = ensureOnAllBgs(old, AA_N);
    bump('text.secondary', old, neu);
    t.text.secondary.$value = neu;
  }
  if (t.text?.muted?.$value) {
    const old = t.text.muted.$value;
    const neu = ensureOnAllBgs(old, AA_N);
    bump('text.muted', old, neu);
    t.text.muted.$value = neu;
  }
  if (t.content?.body?.secondary?.$value) {
    const old = t.content.body.secondary.$value;
    const neu = ensureOnAllBgs(old, AA_N);
    bump('body.secondary', old, neu);
    t.content.body.secondary.$value = neu;
  }
  if (t.accent?.link?.$value) {
    const old = t.accent.link.$value;
    const neu = ensureOnAllBgs(old, AA_N);
    bump('accent.link', old, neu);
    t.accent.link.$value = neu;
  }
  if (t.content?.link?.default?.$value) {
    const old = t.content.link.default.$value;
    const neu = ensureOnAllBgs(old, AA_N);
    bump('content.link', old, neu);
    t.content.link.default.$value = neu;
  }
  // Headings can sit on surface panels in demos too
  if (t.content?.heading) {
    for (const h of ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']) {
      if (!t.content.heading[h]?.$value) continue;
      const old = t.content.heading[h].$value;
      const neu = ensureOnAllBgs(old, AA_L);
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
    // CTA gradient stops: brand.primary → state.info (see packages/css generator)
    let brand = t.brand.primary.$value;
    let info = t.state?.info?.$value;
    const existing = t.brand.primaryText?.$value;
    const preferred = [
      existing && !isExtreme(existing) ? existing : null,
      t.text?.inverse?.$value,
      t.background?.base?.$value,
    ];
    const gradientStops = [brand, info].filter(Boolean);
    let fg = pickInkOn(gradientStops, preferred, AA_N);

    if (!fg) {
      // No single ink clears both stops — keep themed ink on brand, then
      // nudge fills just enough so the gradient end is AA too.
      fg = pickInkOn([brand], preferred, AA_N) ?? bestEffortInk([brand], preferred);
      if (ratio(fg, brand) < AA_N) {
        const next = ensureContrastBg(fg, brand, AA_N);
        if (next.toLowerCase() !== brand.toLowerCase()) {
          brand = next;
          t.brand.primary.$value = brand;
          changed = true;
          fixCount++;
        }
      }
      if (info && ratio(fg, info) < AA_N) {
        const next = ensureContrastBg(fg, info, AA_N);
        if (next.toLowerCase() !== info.toLowerCase()) {
          info = next;
          t.state.info.$value = info;
          changed = true;
          fixCount++;
        }
      }
    }

    const old = existing ?? '';
    setColor(t.brand, 'primaryText', fg);
    if (old.toLowerCase() !== fg.toLowerCase()) {
      changed = true;
      fixCount++;
    }
  }

  if (t.state) {
    for (const key of ['info', 'success', 'warning', 'danger']) {
      if (!t.state[key]?.$value) continue;
      let bg = t.state[key].$value;
      const textKey = `${key}Text`;
      const existing = t.state[textKey]?.$value;
      const preferred = [
        existing && !isExtreme(existing) ? existing : null,
        t.text?.inverse?.$value,
        t.text?.primary?.$value,
        t.background?.base?.$value,
      ];
      let fg = pickInkOn([bg], preferred, AA_N) ?? bestEffortInk([bg], preferred);
      if (ratio(fg, bg) < AA_N) {
        // Fill itself cannot host readable ink — nudge the fill until AA clears.
        const next = ensureContrastBg(fg, bg, AA_N);
        if (next.toLowerCase() !== bg.toLowerCase()) {
          bg = next;
          t.state[key].$value = bg;
          changed = true;
          fixCount++;
        }
        if (ratio(fg, bg) < AA_N) {
          fg = bestEffortInk([bg], EXTREMES);
          const nudged = ensureContrastBg(fg, bg, AA_N);
          if (nudged.toLowerCase() !== bg.toLowerCase()) {
            bg = nudged;
            t.state[key].$value = bg;
            changed = true;
            fixCount++;
          }
        }
      }
      const old = existing ?? '';
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
