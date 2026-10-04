import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  cssColorsEqual,
  inspectThemeApplication,
  parseCssColor,
} from '../e2e/helpers/theme-applied';

interface ThemeDomOptions {
  themeId: string;
  hrefThemeId?: string;
  sheetTokens?: Record<string, string>;
  rootTokens?: Record<string, string>;
  marqueeColor?: string | null;
  swatchBackground?: string | null;
  sheetLoaded?: boolean;
}

/**
 * Installs a theme link, tokens, and computed-style spies on the happy-dom document.
 *
 * @param options - Theme id, tokens, computed colors, and optional marquee
 */
function installThemeDom(options: ThemeDomOptions): void {
  const hrefThemeId = options.hrefThemeId ?? options.themeId;
  const sheetTokens = options.sheetTokens ?? {
    '--turbo-bg-base': '#f5f5f5',
    '--turbo-text-primary': '#363636',
    '--turbo-brand-primary': '#00d1b2',
  };
  const rootTokens = options.rootTokens ?? sheetTokens;
  const includeMarquee = options.marqueeColor !== null;
  const includeSwatch = options.swatchBackground !== null;
  const marqueeColor = options.marqueeColor ?? 'rgb(54, 54, 54)';
  const swatchBackground = options.swatchBackground ?? 'rgb(245, 245, 245)';

  document.documentElement.setAttribute('data-theme', options.themeId);
  document.body.replaceChildren();

  const existing = document.getElementById('turbo-theme-css');
  existing?.remove();

  const link = document.createElement('link');
  link.id = 'turbo-theme-css';
  link.rel = 'stylesheet';
  link.setAttribute('href', `https://example.test/assets/css/themes/turbo/${hrefThemeId}.css`);
  const styleRule = {
    style: {
      getPropertyValue: (prop: string): string => sheetTokens[prop] ?? '',
    },
  };
  Object.defineProperty(link, 'href', {
    configurable: true,
    get: () => `https://example.test/assets/css/themes/turbo/${hrefThemeId}.css`,
  });
  Object.defineProperty(link, 'sheet', {
    configurable: true,
    get: () => (options.sheetLoaded === false ? null : { cssRules: [styleRule] }),
  });
  document.head.appendChild(link);

  let marquee: HTMLElement | null = null;
  let swatch: HTMLElement | null = null;
  if (includeSwatch) {
    swatch = document.createElement('div');
    swatch.className = 'showcase-marquee-swatch';
    document.body.appendChild(swatch);
  }
  if (includeMarquee) {
    marquee = document.createElement('span');
    marquee.className = 'showcase-marquee-name';
    document.body.appendChild(marquee);
  }

  vi.spyOn(window, 'getComputedStyle').mockImplementation((el: Element) => {
    const isRoot = el === document.documentElement;
    const isMarquee = marquee !== null && el === marquee;
    const isSwatch = swatch !== null && el === swatch;
    return {
      getPropertyValue: (prop: string): string => (isRoot ? (rootTokens[prop] ?? '') : ''),
      backgroundColor: isSwatch ? swatchBackground : '',
      color: isMarquee ? marqueeColor : '',
    } as CSSStyleDeclaration;
  });
}

afterEach(() => {
  vi.restoreAllMocks();
  document.getElementById('turbo-theme-css')?.remove();
  document.body.replaceChildren();
  document.documentElement.removeAttribute('data-theme');
});

describe('parseCssColor', () => {
  it('parses hex, rgb, and color(srgb) into matching channels', () => {
    expect(parseCssColor('#cdd6f4')).toEqual({ r: 205, g: 214, b: 244 });
    expect(parseCssColor('#f55')).toEqual({ r: 255, g: 85, b: 85 });
    expect(parseCssColor('rgb(245, 245, 245)')).toEqual({ r: 245, g: 245, b: 245 });
    expect(parseCssColor('color(srgb 1 0 0)')).toEqual({ r: 255, g: 0, b: 0 });
    expect(parseCssColor('oklch(0.5 0.1 20)')).toBeNull();
  });
});

describe('cssColorsEqual', () => {
  it('treats hex tokens and computed rgb as the same color', () => {
    expect(cssColorsEqual('#f5f5f5', 'rgb(245, 245, 245)')).toBe(true);
    expect(cssColorsEqual('#cdd6f4', 'rgb(245, 245, 245)')).toBe(false);
  });
});

describe('inspectThemeApplication', () => {
  it('returns ok when tokens and painted colors match the target theme', () => {
    installThemeDom({ themeId: 'bulma-light' });
    const status = inspectThemeApplication('bulma-light');
    expect(status.ok).toBe(true);
    expect(status.missing).toEqual([]);
  });

  it('rejects when the stylesheet has not finished loading', () => {
    installThemeDom({ themeId: 'bulma-light', sheetLoaded: false });
    const status = inspectThemeApplication('bulma-light');
    expect(status.ok).toBe(false);
    expect(status.missing.some((reason) => reason.includes('sheet is not loaded'))).toBe(true);
  });

  it('rejects a mid-swap where the swatch still has the previous background', () => {
    installThemeDom({
      themeId: 'bulma-light',
      swatchBackground: 'rgb(30, 30, 46)',
    });
    const status = inspectThemeApplication('bulma-light');
    expect(status.ok).toBe(false);
    expect(status.missing.some((reason) => reason.includes('.showcase-marquee-swatch'))).toBe(
      true,
    );
  });

  it('rejects a mid-swap where marquee text is still the previous theme', () => {
    installThemeDom({
      themeId: 'bulma-light',
      marqueeColor: 'rgb(205, 214, 244)',
    });
    const status = inspectThemeApplication('bulma-light');
    expect(status.ok).toBe(false);
    expect(status.missing.some((reason) => reason.includes('.showcase-marquee-name'))).toBe(
      true,
    );
  });

  it('rejects when data-theme and stylesheet disagree', () => {
    installThemeDom({
      themeId: 'bulma-light',
      hrefThemeId: 'catppuccin-mocha',
    });
    const status = inspectThemeApplication('bulma-light');
    expect(status.ok).toBe(false);
    expect(status.missing.some((reason) => reason.includes('#turbo-theme-css href'))).toBe(true);
  });

  it('skips the marquee check on pages that have no marquee', () => {
    installThemeDom({
      themeId: 'catppuccin-mocha',
      sheetTokens: {
        '--turbo-bg-base': '#1e1e2e',
        '--turbo-text-primary': '#cdd6f4',
        '--turbo-brand-primary': '#cba6f7',
      },
        marqueeColor: null,
        swatchBackground: null,
    });
    const status = inspectThemeApplication('catppuccin-mocha');
    expect(status.ok).toBe(true);
  });

  it('only requires --turbo-bg-base when no theme id is given', () => {
    installThemeDom({
      themeId: 'bulma-light',
      rootTokens: { '--turbo-bg-base': '' },
    });
    expect(inspectThemeApplication().ok).toBe(false);

    vi.restoreAllMocks();
    installThemeDom({ themeId: 'bulma-light' });
    expect(inspectThemeApplication().ok).toBe(true);
  });
});
