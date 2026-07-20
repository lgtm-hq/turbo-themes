// SPDX-License-Identifier: MIT
/**
 * Tests for the homepage showcase interactions.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  DEFAULT_THEME_ICON,
  PROGRESS_TARGET,
  RESTING_TILT_TARGETS,
  SPOTLIGHT_LIMIT,
  applyTabSelection,
  animateProgress,
  approach,
  computeTiltTargets,
  initShowcase,
  marqueePlayState,
  pointerPercent,
  prefersReducedMotion,
  readShowcaseMeta,
  renderProgress,
  resolveThemeDisplay,
  stepSpotlight,
  syncThemeTriggers,
  type MediaQuerySource,
  type PointerRect,
  type ProgressElements,
  type ShowcaseMeta,
  type SpotlightState,
} from '../assets/js/homepage-showcase';

/**
 * Build a typed media-query source reporting a fixed reduced-motion result.
 *
 * @param matches - Whether the reduced-motion query matches.
 * @returns A MediaQuerySource test double.
 */
function mediaQuerySource(matches: boolean): MediaQuerySource {
  return {
    matchMedia: () => ({ matches }),
  };
}

const rect: PointerRect = { left: 100, top: 200, width: 400, height: 300 };

/**
 * Build a fully-typed MediaQueryList double that always reports a match.
 *
 * @returns A MediaQueryList reporting reduced motion.
 */
function reducedMotionQueryList(): MediaQueryList {
  return {
    matches: true,
    media: '(prefers-reduced-motion: reduce)',
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  };
}

describe('prefersReducedMotion', () => {
  it.each([
    { matches: true, expected: true },
    { matches: false, expected: false },
  ])('returns $expected when the query matches=$matches', ({ matches, expected }) => {
    expect(prefersReducedMotion(mediaQuerySource(matches))).toBe(expected);
  });

  it('queries the reduced-motion media feature', () => {
    const matchMedia = vi.fn(() => ({ matches: false }));
    prefersReducedMotion({ matchMedia });
    expect(matchMedia).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
  });
});

describe('stepSpotlight', () => {
  it('drifts by the step in the current direction', () => {
    const state: SpotlightState = { offset: 10, direction: 1 };
    expect(stepSpotlight(state, 0.5)).toEqual({ offset: 10.5, direction: 1 });
  });

  it('drifts negative when the direction is reversed', () => {
    const state: SpotlightState = { offset: 10, direction: -1 };
    expect(stepSpotlight(state, 0.5)).toEqual({ offset: 9.5, direction: -1 });
  });

  it('flips direction after passing the positive limit', () => {
    const state: SpotlightState = { offset: SPOTLIGHT_LIMIT, direction: 1 };
    const next = stepSpotlight(state, 1);
    expect(next.direction).toBe(-1);
    expect(next.offset).toBeGreaterThan(SPOTLIGHT_LIMIT);
  });

  it('flips direction after passing the negative limit', () => {
    const state: SpotlightState = { offset: -SPOTLIGHT_LIMIT, direction: -1 };
    const next = stepSpotlight(state, 1);
    expect(next.direction).toBe(1);
    expect(next.offset).toBeLessThan(-SPOTLIGHT_LIMIT);
  });

  it('oscillates within the limits over many frames', () => {
    let state: SpotlightState = { offset: 0, direction: 1 };
    for (let i = 0; i < 1000; i += 1) {
      state = stepSpotlight(state, 1, 10);
      expect(Math.abs(state.offset)).toBeLessThanOrEqual(11);
    }
  });
});

describe('computeTiltTargets', () => {
  it('is at rest for a pointer in the center', () => {
    const targets = computeTiltTargets(300, 350, rect);
    expect(targets.rotateX).toBeCloseTo(0);
    expect(targets.rotateY).toBeCloseTo(0);
    expect(targets.glareX).toBeCloseTo(50);
    expect(targets.glareY).toBeCloseTo(50);
  });

  it('tilts fully toward the bottom-right corner', () => {
    const targets = computeTiltTargets(500, 500, rect, 14);
    expect(targets.rotateY).toBeCloseTo(7);
    expect(targets.rotateX).toBeCloseTo(-7);
    expect(targets.glareX).toBeCloseTo(100);
    expect(targets.glareY).toBeCloseTo(100);
  });

  it('tilts the opposite way toward the top-left corner', () => {
    const targets = computeTiltTargets(100, 200, rect, 14);
    expect(targets.rotateY).toBeCloseTo(-7);
    expect(targets.rotateX).toBeCloseTo(7);
    expect(targets.glareX).toBeCloseTo(0);
    expect(targets.glareY).toBeCloseTo(0);
  });

  it('has resting targets centered with no rotation', () => {
    expect(RESTING_TILT_TARGETS).toEqual({ rotateX: 0, rotateY: 0, glareX: 50, glareY: 50 });
  });
});

describe('approach', () => {
  it('moves a fraction of the distance toward the target', () => {
    expect(approach(0, 100, 0.12)).toBeCloseTo(12);
  });

  it('stays put when already at the target', () => {
    expect(approach(50, 50, 0.15)).toBe(50);
  });
});

describe('pointerPercent', () => {
  it('maps the top-left corner to 0/0', () => {
    expect(pointerPercent(100, 200, rect)).toEqual({ x: 0, y: 0 });
  });

  it('maps the center to 50/50', () => {
    expect(pointerPercent(300, 350, rect)).toEqual({ x: 50, y: 50 });
  });
});

describe('marqueePlayState', () => {
  it.each([
    { isHovering: true, expected: 'paused' },
    { isHovering: false, expected: 'running' },
  ])('returns $expected when hovering=$isHovering', ({ isHovering, expected }) => {
    expect(marqueePlayState(isHovering)).toBe(expected);
  });
});

describe('applyTabSelection', () => {
  let tabs: HTMLElement[];
  let panels: HTMLElement[];

  beforeEach(() => {
    tabs = ['overview', 'tokens'].map((name) => {
      const tab = document.createElement('button');
      tab.setAttribute('data-preview-tab', name);
      return tab;
    });
    panels = ['overview', 'tokens'].map((name) => {
      const panel = document.createElement('div');
      panel.setAttribute('data-preview-panel', name);
      return panel;
    });
  });

  it('activates the matching tab and panel', () => {
    applyTabSelection(tabs, panels, 'tokens');

    expect(tabs[1]!.classList.contains('active')).toBe(true);
    expect(tabs[1]!.getAttribute('aria-selected')).toBe('true');
    expect(panels[1]!.classList.contains('is-active')).toBe(true);
    expect(panels[1]!.hidden).toBe(false);
  });

  it('deactivates non-matching tabs and hides their panels', () => {
    tabs[0]!.classList.add('active');
    panels[0]!.classList.add('is-active');

    applyTabSelection(tabs, panels, 'tokens');

    expect(tabs[0]!.classList.contains('active')).toBe(false);
    expect(tabs[0]!.getAttribute('aria-selected')).toBe('false');
    expect(panels[0]!.classList.contains('is-active')).toBe(false);
    expect(panels[0]!.hidden).toBe(true);
  });

  it('deactivates everything for an unknown target', () => {
    applyTabSelection(tabs, panels, 'missing');

    for (const tab of tabs) {
      expect(tab.classList.contains('active')).toBe(false);
    }
    for (const panel of panels) {
      expect(panel.hidden).toBe(true);
    }
  });
});

describe('resolveThemeDisplay', () => {
  const meta: ShowcaseMeta = {
    baseUrl: 'https://example.test/base',
    themeFullNames: { 'catppuccin-mocha': 'Catppuccin Mocha' },
    themeIcons: { 'catppuccin-mocha': 'catppuccin-logo-mocha.png' },
  };

  it('prefers the full theme name and mapped icon', () => {
    expect(resolveThemeDisplay('catppuccin-mocha', meta)).toEqual({
      name: 'Catppuccin Mocha',
      iconSrc: 'https://example.test/base/assets/img/catppuccin-logo-mocha.png',
    });
  });

  it('falls back to the theme id and default icon for unknown themes', () => {
    const display = resolveThemeDisplay('mystery-theme', meta);
    expect(display.name).toBe('mystery-theme');
    expect(display.iconSrc).toBe(`https://example.test/base/assets/img/${DEFAULT_THEME_ICON}`);
  });
});

describe('readShowcaseMeta', () => {
  afterEach(() => {
    document.body.innerHTML = '';
    document.documentElement.removeAttribute('data-baseurl');
  });

  it('collects names and icons from marked elements plus the base URL', () => {
    document.documentElement.setAttribute('data-baseurl', '/base');
    document.body.innerHTML = `
      <button
        data-theme-preview="catppuccin-mocha"
        data-theme-name="Catppuccin Mocha"
        data-theme-icon="catppuccin-logo-mocha.png"
      ></button>
      <button data-theme-preview="nord" data-theme-name="Nord"></button>
    `;

    expect(readShowcaseMeta(document)).toEqual({
      baseUrl: '/base',
      themeFullNames: { 'catppuccin-mocha': 'Catppuccin Mocha', nord: 'Nord' },
      themeIcons: { 'catppuccin-mocha': 'catppuccin-logo-mocha.png' },
    });
  });

  it('returns empty metadata for a page without marked elements', () => {
    expect(readShowcaseMeta(document)).toEqual({
      baseUrl: '',
      themeFullNames: {},
      themeIcons: {},
    });
  });
});

describe('syncThemeTriggers', () => {
  it('activates the matching trigger and deactivates the rest', () => {
    const triggers = ['nord', 'dracula'].map((id) => {
      const el = document.createElement('button');
      el.setAttribute('data-theme-preview', id);
      el.setAttribute('aria-pressed', 'false');
      return el;
    });
    triggers[1]!.classList.add('active');
    triggers[1]!.setAttribute('aria-pressed', 'true');

    syncThemeTriggers(triggers, 'nord');

    expect(triggers[0]!.classList.contains('active')).toBe(true);
    expect(triggers[0]!.getAttribute('aria-pressed')).toBe('true');
    expect(triggers[1]!.classList.contains('active')).toBe(false);
    expect(triggers[1]!.getAttribute('aria-pressed')).toBe('false');
  });
});

describe('renderProgress', () => {
  /**
   * Build progress-bar elements for testing.
   *
   * @param withBar - Whether to include the aria progress bar element.
   * @returns Progress elements backed by detached DOM nodes.
   */
  function progressElements(withBar: boolean): ProgressElements {
    return {
      fill: document.createElement('div'),
      value: document.createElement('span'),
      bar: withBar ? document.createElement('div') : null,
    };
  }

  it('renders width, label, and aria value', () => {
    const elements = progressElements(true);
    renderProgress(elements, 42);

    expect(elements.fill.style.width).toBe('42%');
    expect(elements.value.textContent).toBe('42%');
    expect(elements.bar?.getAttribute('aria-valuenow')).toBe('42');
  });

  it('tolerates a missing aria bar element', () => {
    const elements = progressElements(false);
    expect(() => {
      renderProgress(elements, 10);
    }).not.toThrow();
    expect(elements.fill.style.width).toBe('10%');
  });

  describe('animateProgress', () => {
    it('renders the target immediately with reduced motion', () => {
      const elements = progressElements(true);
      const schedule = vi.fn();

      animateProgress(elements, { target: 92, reducedMotion: true, schedule });

      expect(elements.fill.style.width).toBe('92%');
      expect(elements.value.textContent).toBe('92%');
      expect(elements.bar?.getAttribute('aria-valuenow')).toBe('92');
      expect(schedule).not.toHaveBeenCalled();
    });

    it('resets to zero and defers the target render without reduced motion', () => {
      const elements = progressElements(true);
      let deferred: (() => void) | undefined;

      animateProgress(elements, {
        target: 92,
        reducedMotion: false,
        schedule: (callback) => {
          deferred = callback;
        },
      });

      expect(elements.fill.style.width).toBe('0%');
      expect(elements.value.textContent).toBe('0%');

      deferred?.();

      expect(elements.fill.style.width).toBe('92%');
      expect(elements.value.textContent).toBe('92%');
    });
  });
});

describe('initShowcase', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <button class="showcase-preview-tab active" data-preview-tab="overview" aria-selected="true"></button>
      <button class="showcase-preview-tab" data-preview-tab="tokens" aria-selected="false"></button>
      <div class="showcase-preview-panel is-active" data-preview-panel="overview"></div>
      <div class="showcase-preview-panel" data-preview-panel="tokens" hidden></div>
      <div id="showcase-progress-bar" role="progressbar">
        <div id="showcase-progress-fill"></div>
      </div>
      <span id="showcase-progress-value"></span>
      <span id="showcase-preview-theme-name"></span>
      <img id="showcase-preview-theme-icon" alt="" />
      <div class="showcase-marquee-row">
        <button
          class="showcase-marquee-card"
          data-theme-preview="catppuccin-mocha"
          data-theme-name="Catppuccin Mocha"
          data-theme-icon="catppuccin-logo-mocha.png"
          aria-pressed="false"
        ></button>
        <button
          class="showcase-marquee-card"
          data-theme-preview="nord-dark"
          data-theme-name="Nord Dark"
          data-theme-icon="nord-logo.png"
          aria-pressed="false"
        ></button>
      </div>
    `;
    // Reduced motion keeps animation loops out of the test environment.
    vi.spyOn(window, 'matchMedia').mockReturnValue(reducedMotionQueryList());
    document.documentElement.setAttribute('data-baseurl', 'https://example.test');
    document.documentElement.setAttribute('data-theme', 'catppuccin-mocha');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    document.documentElement.removeAttribute('data-baseurl');
    document.body.innerHTML = '';
  });

  it('renders the progress target immediately under reduced motion', () => {
    initShowcase();

    const fill = document.getElementById('showcase-progress-fill')!;
    expect(fill.style.width).toBe(`${PROGRESS_TARGET}%`);
    expect(
      document.getElementById('showcase-progress-bar')!.getAttribute('aria-valuenow'),
    ).toBe(String(PROGRESS_TARGET));
  });

  it('switches tabs and panels on click', () => {
    initShowcase();

    const tokensTab = document.querySelector<HTMLElement>('[data-preview-tab="tokens"]')!;
    tokensTab.click();

    expect(tokensTab.classList.contains('active')).toBe(true);
    expect(tokensTab.getAttribute('aria-selected')).toBe('true');
    const overviewPanel = document.querySelector<HTMLElement>('[data-preview-panel="overview"]')!;
    const tokensPanel = document.querySelector<HTMLElement>('[data-preview-panel="tokens"]')!;
    expect(overviewPanel.hidden).toBe(true);
    expect(tokensPanel.hidden).toBe(false);
    expect(tokensPanel.classList.contains('is-active')).toBe(true);
  });

  it('renders the current theme from server-rendered metadata on init', () => {
    initShowcase();

    expect(document.getElementById('showcase-preview-theme-name')!.textContent).toBe(
      'Catppuccin Mocha',
    );
    const icon = document.getElementById('showcase-preview-theme-icon') as HTMLImageElement;
    expect(icon.src).toBe('https://example.test/assets/img/catppuccin-logo-mocha.png');
  });

  it('marks the active marquee card for the current theme on init', () => {
    initShowcase();

    const active = document.querySelector('[data-theme-preview="catppuccin-mocha"]')!;
    const inactive = document.querySelector('[data-theme-preview="nord-dark"]')!;
    expect(active.classList.contains('active')).toBe(true);
    expect(active.getAttribute('aria-pressed')).toBe('true');
    expect(inactive.classList.contains('active')).toBe(false);
    expect(inactive.getAttribute('aria-pressed')).toBe('false');
  });

  it('updates the preview when a turbo-theme-change event arrives', () => {
    initShowcase();

    document.dispatchEvent(
      new CustomEvent('turbo-theme-change', {
        detail: { themeId: 'nord-dark', appearance: 'dark' },
      }),
    );

    expect(document.getElementById('showcase-preview-theme-name')!.textContent).toBe('Nord Dark');
    const card = document.querySelector('[data-theme-preview="nord-dark"]')!;
    expect(card.getAttribute('aria-pressed')).toBe('true');
  });

  it('warns when a marquee click cannot fully apply the theme', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    initShowcase();

    const badCard = document.createElement('button');
    badCard.setAttribute('data-theme-preview', 'not-a-real-theme');
    document.body.appendChild(badCard);
    badCard.click();

    await vi.waitFor(() => {
      expect(warn).toHaveBeenCalledWith(expect.stringContaining('not-a-real-theme'));
    });
  });

  it('follows data-theme attribute changes made outside the integration API', async () => {
    initShowcase();

    document.documentElement.setAttribute('data-theme', 'nord-dark');
    await vi.waitFor(() => {
      expect(document.getElementById('showcase-preview-theme-name')!.textContent).toBe(
        'Nord Dark',
      );
    });
  });

  it('pauses and resumes the marquee row on hover', () => {
    initShowcase();

    const row = document.querySelector<HTMLElement>('.showcase-marquee-row')!;
    row.dispatchEvent(new MouseEvent('mouseenter'));
    expect(row.style.animationPlayState).toBe('paused');

    row.dispatchEvent(new MouseEvent('mouseleave'));
    expect(row.style.animationPlayState).toBe('running');
  });
});
