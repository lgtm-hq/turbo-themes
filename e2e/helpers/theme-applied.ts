/**
 * Fail-closed helpers for waiting until a theme is fully painted.
 *
 * Attribute and href updates can land before computed colors do. Axe then
 * reports phantom contrast failures (previous-theme text on the new
 * background). These helpers wait for tokens and painted colors, and throw
 * on timeout instead of continuing.
 *
 * `inspectThemeApplication` is self-contained so Playwright can serialize
 * it into `page.evaluate` without closing over module locals.
 */

import { expect, type Page } from '@playwright/test';

/** Parsed sRGB color used to compare stylesheet tokens with computed styles. */
export interface RgbColor {
  r: number;
  g: number;
  b: number;
}

/** Result of inspecting whether a theme has fully painted. */
export interface ThemeApplicationStatus {
  /** True when every required attribute, token, and painted color matches. */
  ok: boolean;
  /** Human-readable reasons the theme is not ready yet. */
  missing: string[];
}

/**
 * Parses a CSS color string (hex, rgb/rgba, or color(srgb …)) into sRGB.
 *
 * @param value - Computed or stylesheet color string
 * @returns Channel values in 0..255, or null when the format is unknown
 */
export function parseCssColor(value: string): RgbColor | null {
  const trimmed = value.trim();
  const hex6 = trimmed.match(/^#([0-9a-f]{6})$/i);
  if (hex6) {
    const hex = hex6[1];
    return {
      r: Number.parseInt(hex.slice(0, 2), 16),
      g: Number.parseInt(hex.slice(2, 4), 16),
      b: Number.parseInt(hex.slice(4, 6), 16),
    };
  }
  const hex3 = trimmed.match(/^#([0-9a-f]{3})$/i);
  if (hex3) {
    const hex = hex3[1];
    return {
      r: Number.parseInt(hex[0] + hex[0], 16),
      g: Number.parseInt(hex[1] + hex[1], 16),
      b: Number.parseInt(hex[2] + hex[2], 16),
    };
  }
  const rgb = trimmed.match(
    /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*[\d.]+)?\s*\)$/i,
  );
  if (rgb) {
    return {
      r: Number(rgb[1]),
      g: Number(rgb[2]),
      b: Number(rgb[3]),
    };
  }
  const srgb = trimmed.match(
    /^color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*[\d.]+)?\)$/i,
  );
  if (srgb) {
    return {
      r: Number(srgb[1]) * 255,
      g: Number(srgb[2]) * 255,
      b: Number(srgb[3]) * 255,
    };
  }
  return null;
}

/**
 * Returns true when two CSS colors resolve to the same sRGB channels.
 *
 * @param left - First color string
 * @param right - Second color string
 * @returns True when both parse and match after rounding
 */
export function cssColorsEqual(left: string, right: string): boolean {
  const a = parseCssColor(left);
  const b = parseCssColor(right);
  if (!a || !b) {
    return false;
  }
  return (
    Math.round(a.r) === Math.round(b.r) &&
    Math.round(a.g) === Math.round(b.g) &&
    Math.round(a.b) === Math.round(b.b)
  );
}

/**
 * Inspects whether the page document has painted the requested theme.
 *
 * When `expectedTheme` is omitted, only `--turbo-bg-base` must be non-empty.
 * When it is set, `data-theme`, the theme stylesheet, root tokens, and
 * painted marquee colors (if present) must match that theme.
 *
 * This function must stay free of module closures so Playwright can run it
 * via `page.evaluate`.
 *
 * @param expectedTheme - Theme id to require, if any
 * @returns Status with `ok` and a list of what is still missing
 */
export function inspectThemeApplication(expectedTheme?: string): ThemeApplicationStatus {
  const tokenProps = ['--turbo-bg-base', '--turbo-text-primary', '--turbo-brand-primary'];
  const parseColor = (value: string): { r: number; g: number; b: number } | null => {
    const trimmed = value.trim();
    const hex6 = trimmed.match(/^#([0-9a-f]{6})$/i);
    if (hex6) {
      const hex = hex6[1];
      return {
        r: Number.parseInt(hex.slice(0, 2), 16),
        g: Number.parseInt(hex.slice(2, 4), 16),
        b: Number.parseInt(hex.slice(4, 6), 16),
      };
    }
    const hex3 = trimmed.match(/^#([0-9a-f]{3})$/i);
    if (hex3) {
      const hex = hex3[1];
      return {
        r: Number.parseInt(hex[0] + hex[0], 16),
        g: Number.parseInt(hex[1] + hex[1], 16),
        b: Number.parseInt(hex[2] + hex[2], 16),
      };
    }
    const rgb = trimmed.match(
      /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*[\d.]+)?\s*\)$/i,
    );
    if (rgb) {
      return { r: Number(rgb[1]), g: Number(rgb[2]), b: Number(rgb[3]) };
    }
    const srgb = trimmed.match(
      /^color\(srgb\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*[\d.]+)?\)$/i,
    );
    if (srgb) {
      return {
        r: Number(srgb[1]) * 255,
        g: Number(srgb[2]) * 255,
        b: Number(srgb[3]) * 255,
      };
    }
    return null;
  };
  const colorsEqual = (left: string, right: string): boolean => {
    const a = parseColor(left);
    const b = parseColor(right);
    if (!a || !b) {
      return false;
    }
    return (
      Math.round(a.r) === Math.round(b.r) &&
      Math.round(a.g) === Math.round(b.g) &&
      Math.round(a.b) === Math.round(b.b)
    );
  };

  const missing: string[] = [];
  const rootStyle = getComputedStyle(document.documentElement);
  const bgBase = rootStyle.getPropertyValue('--turbo-bg-base').trim();
  if (!bgBase) {
    missing.push('--turbo-bg-base is empty on :root');
  }
  if (!expectedTheme) {
    return { ok: missing.length === 0, missing };
  }

  const actualTheme = document.documentElement.getAttribute('data-theme') ?? '';
  if (actualTheme !== expectedTheme) {
    missing.push(`data-theme is "${actualTheme || '(unset)'}", expected "${expectedTheme}"`);
  }

  const link = document.querySelector('#turbo-theme-css') as HTMLLinkElement | null;
  const href = link?.href ?? '';
  if (!href.includes(`/${expectedTheme}.css`)) {
    missing.push(`#turbo-theme-css href is "${href || '(missing)'}", expected "/${expectedTheme}.css"`);
  }
  const sheet = link?.sheet ?? null;
  if (!sheet) {
    missing.push('#turbo-theme-css sheet is not loaded');
    return { ok: false, missing };
  }

  const tokens: Record<string, string> = {};
  try {
    for (const rule of Array.from(sheet.cssRules)) {
      const style = (rule as CSSStyleRule).style;
      if (!style || typeof style.getPropertyValue !== 'function') {
        continue;
      }
      for (const prop of tokenProps) {
        const value = style.getPropertyValue(prop).trim();
        if (value) {
          tokens[prop] = value;
        }
      }
    }
  } catch {
    missing.push('#turbo-theme-css sheet rules are inaccessible');
    return { ok: false, missing };
  }

  for (const prop of tokenProps) {
    const expected = tokens[prop];
    if (!expected) {
      missing.push(`${prop} missing from theme stylesheet`);
      continue;
    }
    const actual = rootStyle.getPropertyValue(prop).trim();
    if (actual !== expected && !colorsEqual(actual, expected)) {
      missing.push(`:root ${prop} is "${actual}", expected "${expected}"`);
    }
  }

  const expectedBg = tokens['--turbo-bg-base'];
  const expectedText = tokens['--turbo-text-primary'];
  // Homepage body ink is the noir layer, not --turbo-text-primary. Axe
  // flakes on marquee names, so wait for those painted colors when present.
  const marquee = document.querySelector('.showcase-marquee-name');
  if (marquee && expectedText) {
    const marqueeColor = getComputedStyle(marquee).color;
    if (!colorsEqual(marqueeColor, expectedText)) {
      missing.push(`.showcase-marquee-name color is "${marqueeColor}", expected "${expectedText}"`);
    }
  }
  const swatch = document.querySelector('.showcase-marquee-swatch');
  if (swatch && expectedBg) {
    const swatchBg = getComputedStyle(swatch).backgroundColor;
    if (!colorsEqual(swatchBg, expectedBg)) {
      missing.push(`.showcase-marquee-swatch background is "${swatchBg}", expected "${expectedBg}"`);
    }
  }

  return { ok: missing.length === 0, missing };
}

/**
 * Waits until the theme is fully painted, then throws if it is not.
 *
 * @param page - Playwright page
 * @param themeId - Theme id to wait for (optional)
 * @param timeoutMs - Maximum time to wait (default 5000)
 * @throws Error when the theme is still incomplete after the timeout
 */
export async function waitForThemeApplied(
  page: Page,
  themeId?: string,
  timeoutMs = 5000,
): Promise<void> {
  try {
    await expect
      .poll(
        async () => {
          const status = await page.evaluate(inspectThemeApplication, themeId);
          return status.ok;
        },
        { timeout: timeoutMs },
      )
      .toBe(true);
  } catch (err: unknown) {
    let detail = '';
    try {
      const status = await page.evaluate(inspectThemeApplication, themeId);
      if (status.missing.length > 0) {
        detail = ` Still missing: ${status.missing.join('; ')}.`;
      }
    } catch {
      // Page may already be closed; keep the timeout message.
    }
    const themeLabel = themeId ? ` for theme "${themeId}"` : '';
    throw new Error(`Theme application timed out after ${timeoutMs}ms${themeLabel}.${detail}`, {
      cause: err,
    });
  }
}
