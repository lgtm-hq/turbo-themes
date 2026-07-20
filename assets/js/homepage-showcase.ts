// SPDX-License-Identifier: MIT
/**
 * Homepage showcase interactions.
 *
 * Spotlight drift, comet-card tilt, text mask, scroll reveals, theme marquee
 * pause, and the interactive preview card. Pure state transitions are exported
 * for unit testing; DOM wiring stays thin and is initialized on
 * DOMContentLoaded.
 *
 * Theming goes exclusively through the theme-selector integration API
 * (ADR-0007): marquee clicks call `applyTheme`, hover prefetch comes from
 * the lazy-CSS helpers, and UI state follows `turbo-theme-change` events
 * plus a `data-theme` attribute observer (covering the header dropdown).
 * Theme metadata is server-rendered as data attributes on the marquee
 * cards (`data-theme-preview`/`data-theme-name`/`data-theme-icon`) instead
 * of an injected global.
 */

import {
  applyTheme,
  getCurrentTheme,
  subscribeToThemeChanges,
} from '../../packages/theme-selector/src/integration.js';
import { wireHoverPrefetch } from '../../packages/theme-selector/src/lazy-css.js';

/** Fallback icon used when a theme has no dedicated icon entry. */
export const DEFAULT_THEME_ICON = 'catppuccin-logo-macchiato.png';

/** Maximum spotlight drift, in pixels, before the direction flips. */
export const SPOTLIGHT_LIMIT = 100;

/** Pixels the spotlight drifts per animation frame. */
export const SPOTLIGHT_STEP = 0.15;

/** Maximum comet-card tilt, in degrees, on each axis. */
export const MAX_TILT_DEGREES = 14;

/** Progress percentage the preview card animates to. */
export const PROGRESS_TARGET = 92;

/** Minimal surface needed to evaluate a media query. */
export interface MediaQuerySource {
  matchMedia(query: string): { matches: boolean };
}

/** Theme metadata read from server-rendered data attributes on the page. */
export interface ShowcaseMeta {
  baseUrl: string;
  themeFullNames: Partial<Record<string, string>>;
  themeIcons: Partial<Record<string, string>>;
}

/** Resolved display values for the preview card's theme header. */
export interface ThemeDisplay {
  name: string;
  iconSrc: string;
}

/** Spotlight drift animation state. */
export interface SpotlightState {
  offset: number;
  direction: 1 | -1;
}

/** Target values for the comet-card tilt and glare animation. */
export interface TiltTargets {
  rotateX: number;
  rotateY: number;
  glareX: number;
  glareY: number;
}

/** Pointer-relative bounding box (subset of DOMRect). */
export interface PointerRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

/** Tilt targets when the pointer is not over the comet card. */
export const RESTING_TILT_TARGETS: TiltTargets = {
  rotateX: 0,
  rotateY: 0,
  glareX: 50,
  glareY: 50,
};

/** CSS animation-play-state values used by the marquee rows. */
export type MarqueePlayState = 'paused' | 'running';

/** Attribute naming the theme a showcase element previews/applies. */
export const THEME_TRIGGER_ATTRIBUTE = 'data-theme-preview';

/** Attribute carrying a theme's full display name on a marquee card. */
export const THEME_NAME_ATTRIBUTE = 'data-theme-name';

/** Attribute carrying a theme's icon filename on a marquee card. */
export const THEME_ICON_ATTRIBUTE = 'data-theme-icon';

/**
 * Check whether the user prefers reduced motion.
 *
 * @param source - Object exposing matchMedia (usually window).
 * @returns True when reduced motion is requested.
 */
export function prefersReducedMotion(source: MediaQuerySource): boolean {
  return source.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Advance the spotlight drift by one frame, bouncing at the limits.
 *
 * @param state - Current offset and direction.
 * @param step - Pixels to drift this frame.
 * @param limit - Absolute offset at which the direction flips.
 * @returns The next spotlight state.
 */
export function stepSpotlight(
  state: SpotlightState,
  step: number = SPOTLIGHT_STEP,
  limit: number = SPOTLIGHT_LIMIT,
): SpotlightState {
  const offset = state.offset + state.direction * step;
  let direction = state.direction;
  if (offset > limit) direction = -1;
  if (offset < -limit) direction = 1;
  return { offset, direction };
}

/**
 * Compute tilt and glare targets for a pointer position over the card.
 *
 * @param clientX - Pointer x coordinate in viewport space.
 * @param clientY - Pointer y coordinate in viewport space.
 * @param rect - Card bounding box.
 * @param maxTilt - Maximum tilt in degrees on each axis.
 * @returns Rotation and glare targets.
 */
export function computeTiltTargets(
  clientX: number,
  clientY: number,
  rect: PointerRect,
  maxTilt: number = MAX_TILT_DEGREES,
): TiltTargets {
  const xPct = (clientX - rect.left) / rect.width - 0.5;
  const yPct = (clientY - rect.top) / rect.height - 0.5;
  return {
    rotateX: -yPct * maxTilt,
    rotateY: xPct * maxTilt,
    glareX: ((clientX - rect.left) / rect.width) * 100,
    glareY: ((clientY - rect.top) / rect.height) * 100,
  };
}

/**
 * Move a value a fraction of the way toward a target (ease-out step).
 *
 * @param current - Current value.
 * @param target - Target value.
 * @param rate - Fraction of the remaining distance to cover (0..1).
 * @returns The eased value.
 */
export function approach(current: number, target: number, rate: number): number {
  return current + (target - current) * rate;
}

/**
 * Convert a pointer position into percentages within a bounding box.
 *
 * @param clientX - Pointer x coordinate in viewport space.
 * @param clientY - Pointer y coordinate in viewport space.
 * @param rect - Element bounding box.
 * @returns X/Y position as percentages (0..100).
 */
export function pointerPercent(
  clientX: number,
  clientY: number,
  rect: PointerRect,
): { x: number; y: number } {
  return {
    x: ((clientX - rect.left) / rect.width) * 100,
    y: ((clientY - rect.top) / rect.height) * 100,
  };
}

/**
 * Decide the marquee row's animation-play-state for a hover state.
 *
 * @param isHovering - Whether the pointer is over the row.
 * @returns 'paused' while hovering, 'running' otherwise.
 */
export function marqueePlayState(isHovering: boolean): MarqueePlayState {
  return isHovering ? 'paused' : 'running';
}

/**
 * Activate the tab and panel matching a target and deactivate the rest.
 *
 * @param tabs - Preview tab buttons (data-preview-tab).
 * @param panels - Preview panels (data-preview-panel).
 * @param target - The data-preview-tab value to activate.
 */
export function applyTabSelection(
  tabs: readonly HTMLElement[],
  panels: readonly HTMLElement[],
  target: string,
): void {
  for (const tab of tabs) {
    const isActive = tab.getAttribute('data-preview-tab') === target;
    tab.classList.toggle('active', isActive);
    tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
    tab.tabIndex = isActive ? 0 : -1;
  }
  for (const panel of panels) {
    const isActive = panel.getAttribute('data-preview-panel') === target;
    panel.classList.toggle('is-active', isActive);
    panel.hidden = !isActive;
  }
}

/**
 * Resolve the tab index a tablist keydown should move focus to.
 *
 * Implements the horizontal ARIA tablist keyboard pattern (APG): Left/Right
 * arrows move with wrap-around, Home/End jump to the edges. Activation is
 * manual — Enter/Space fire the tab's native button click, so only focus
 * movement is handled here.
 *
 * @param key - The KeyboardEvent.key value.
 * @param currentIndex - Index of the tab that received the event.
 * @param count - Total number of tabs.
 * @returns The index to focus, or null when the key is not handled.
 */
export function nextTabFocusIndex(
  key: string,
  currentIndex: number,
  count: number,
): number | null {
  if (count <= 0) return null;
  switch (key) {
    case 'ArrowRight':
      return (currentIndex + 1) % count;
    case 'ArrowLeft':
      return (currentIndex - 1 + count) % count;
    case 'Home':
      return 0;
    case 'End':
      return count - 1;
    default:
      return null;
  }
}

/**
 * Move roving-tabindex focus to a tab without changing the selection.
 *
 * Per the ARIA tablist pattern, only the focused tab stays in the tab
 * order; selection follows activation (Enter/Space/click), not focus.
 *
 * @param tabs - Preview tab buttons in document order.
 * @param index - Index of the tab to focus.
 */
export function focusTab(tabs: readonly HTMLElement[], index: number): void {
  const target = tabs[index];
  if (!target) return;
  for (const [i, tab] of tabs.entries()) {
    tab.tabIndex = i === index ? 0 : -1;
  }
  target.focus();
}

/**
 * Read showcase theme metadata from server-rendered data attributes.
 *
 * The page renders one marquee card per theme carrying
 * `data-theme-preview`, `data-theme-name`, and `data-theme-icon`; the
 * base URL comes from the root element's `data-baseurl` attribute.
 *
 * @param documentObj - Document to read the metadata from.
 * @returns Metadata for preview-card and marquee updates.
 */
export function readShowcaseMeta(documentObj: Document): ShowcaseMeta {
  const meta: ShowcaseMeta = {
    baseUrl: documentObj.documentElement.getAttribute('data-baseurl') ?? '',
    themeFullNames: {},
    themeIcons: {},
  };
  for (const el of documentObj.querySelectorAll(`[${THEME_TRIGGER_ATTRIBUTE}]`)) {
    const themeId = el.getAttribute(THEME_TRIGGER_ATTRIBUTE);
    if (!themeId) continue;
    const fullName = el.getAttribute(THEME_NAME_ATTRIBUTE);
    const icon = el.getAttribute(THEME_ICON_ATTRIBUTE);
    if (fullName) meta.themeFullNames[themeId] = fullName;
    if (icon) meta.themeIcons[themeId] = icon;
  }
  return meta;
}

/**
 * Mark the trigger matching a theme active and deactivate the rest.
 *
 * @param triggers - Elements carrying the data-theme-preview attribute.
 * @param themeId - The active theme's identifier.
 */
export function syncThemeTriggers(triggers: readonly Element[], themeId: string): void {
  for (const trigger of triggers) {
    const isActive = trigger.getAttribute(THEME_TRIGGER_ATTRIBUTE) === themeId;
    trigger.classList.toggle('active', isActive);
    trigger.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  }
}

/**
 * Resolve the display name and icon URL for a theme from page metadata.
 *
 * @param theme - Theme identifier (e.g. 'catppuccin-mocha').
 * @param meta - Theme metadata read from the page.
 * @returns Display name and fully-qualified icon source.
 */
export function resolveThemeDisplay(theme: string, meta: ShowcaseMeta): ThemeDisplay {
  const name = meta.themeFullNames[theme] ?? theme;
  const icon = meta.themeIcons[theme] ?? DEFAULT_THEME_ICON;
  return {
    name,
    iconSrc: `${meta.baseUrl}/assets/img/${icon}`,
  };
}

/** Elements that render the preview card's progress bar. */
export interface ProgressElements {
  fill: HTMLElement;
  value: HTMLElement;
  bar: HTMLElement | null;
}

/**
 * Render the progress bar at a given percentage.
 *
 * @param elements - Progress bar elements.
 * @param percent - Percentage to render (0..100).
 */
export function renderProgress(elements: ProgressElements, percent: number): void {
  elements.fill.style.width = `${percent}%`;
  elements.value.textContent = `${percent}%`;
  elements.bar?.setAttribute('aria-valuenow', String(percent));
}

/**
 * Animate the progress bar from zero to its target.
 *
 * With reduced motion the target renders immediately; otherwise the target
 * render is deferred via the scheduler so the CSS transition can play.
 *
 * @param elements - Progress bar elements.
 * @param options - Target percentage, reduced-motion flag, and scheduler.
 */
export function animateProgress(
  elements: ProgressElements,
  options: {
    target: number;
    reducedMotion: boolean;
    schedule?: (callback: () => void) => void;
  },
): void {
  const { target, reducedMotion } = options;
  renderProgress(elements, 0);
  if (reducedMotion) {
    renderProgress(elements, target);
    return;
  }
  const schedule =
    options.schedule ??
    ((callback: () => void): void => {
      requestAnimationFrame(() => {
        requestAnimationFrame(callback);
      });
    });
  schedule(() => {
    renderProgress(elements, target);
  });
}

/** Tears down showcase listeners and cancels animation loops. */
export type ShowcaseCleanup = () => void;

/** No-op cleanup used when a feature has nothing to tear down. */
const NOOP_CLEANUP: ShowcaseCleanup = () => undefined;

/** Active showcase cleanup; replaced on each `initShowcase` call. */
let activeShowcaseCleanup: ShowcaseCleanup | null = null;

/**
 * Start the spotlight drift animation.
 *
 * @param reducedMotion - Whether the user prefers reduced motion.
 * @returns Cleanup that cancels the RAF loop.
 */
function initSpotlight(reducedMotion: boolean): ShowcaseCleanup {
  const root = document.getElementById('showcase-spotlight');
  if (!root || reducedMotion) return NOOP_CLEANUP;

  const left = root.querySelector<HTMLElement>('.showcase-spotlight-left');
  const right = root.querySelector<HTMLElement>('.showcase-spotlight-right');
  if (!left || !right) return NOOP_CLEANUP;

  let state: SpotlightState = { offset: 0, direction: 1 };
  let cancelled = false;
  let rafId = 0;

  const tick = (): void => {
    if (cancelled) return;
    state = stepSpotlight(state);
    left.style.transform = `translateX(${state.offset}px)`;
    right.style.transform = `translateX(${-state.offset}px)`;
    rafId = requestAnimationFrame(tick);
  };

  rafId = requestAnimationFrame(tick);
  return () => {
    cancelled = true;
    cancelAnimationFrame(rafId);
  };
}

/**
 * Wire the comet-card tilt and glare animation.
 *
 * @param reducedMotion - Whether the user prefers reduced motion.
 * @returns Cleanup that cancels the RAF loop and removes pointer listeners.
 */
function initCometCard(reducedMotion: boolean): ShowcaseCleanup {
  const card = document.getElementById('showcase-comet-card');
  const glare = document.getElementById('showcase-comet-glare');
  if (!card || reducedMotion) return NOOP_CLEANUP;

  let current: TiltTargets = { ...RESTING_TILT_TARGETS };
  let targets: TiltTargets = { ...RESTING_TILT_TARGETS };
  let cancelled = false;
  let rafId = 0;

  const onMouseMove = (event: MouseEvent): void => {
    targets = computeTiltTargets(event.clientX, event.clientY, card.getBoundingClientRect());
  };

  const onMouseLeave = (): void => {
    targets = { ...RESTING_TILT_TARGETS };
  };

  card.addEventListener('mousemove', onMouseMove);
  card.addEventListener('mouseleave', onMouseLeave);

  const animate = (): void => {
    if (cancelled) return;
    current = {
      rotateX: approach(current.rotateX, targets.rotateX, 0.12),
      rotateY: approach(current.rotateY, targets.rotateY, 0.12),
      glareX: approach(current.glareX, targets.glareX, 0.15),
      glareY: approach(current.glareY, targets.glareY, 0.15),
    };
    card.style.transform =
      `perspective(900px) rotateX(${current.rotateX}deg) ` +
      `rotateY(${current.rotateY}deg) scale3d(1.02,1.02,1.02)`;
    if (glare) {
      glare.style.background =
        `radial-gradient(circle at ${current.glareX}% ${current.glareY}%, ` +
        'color-mix(in srgb, var(--turbo-text-primary) 35%, transparent) 0%, transparent 65%)';
    }
    rafId = requestAnimationFrame(animate);
  };

  rafId = requestAnimationFrame(animate);
  return () => {
    cancelled = true;
    cancelAnimationFrame(rafId);
    card.removeEventListener('mousemove', onMouseMove);
    card.removeEventListener('mouseleave', onMouseLeave);
  };
}

/**
 * Wire the hover-following text mask.
 *
 * @param reducedMotion - Whether the user prefers reduced motion.
 * @returns Cleanup that removes the hover listeners.
 */
function initTextMask(reducedMotion: boolean): ShowcaseCleanup {
  const wrap = document.getElementById('showcase-text-mask');
  if (!wrap || reducedMotion) return NOOP_CLEANUP;

  const onMouseMove = (event: MouseEvent): void => {
    const { x, y } = pointerPercent(event.clientX, event.clientY, wrap.getBoundingClientRect());
    wrap.style.setProperty('--mx', `${x}%`);
    wrap.style.setProperty('--my', `${y}%`);
    wrap.classList.add('is-hovering');
  };
  const onMouseLeave = (): void => {
    wrap.classList.remove('is-hovering');
    wrap.style.setProperty('--mx', '50%');
    wrap.style.setProperty('--my', '50%');
  };

  wrap.addEventListener('mousemove', onMouseMove);
  wrap.addEventListener('mouseleave', onMouseLeave);
  return () => {
    wrap.removeEventListener('mousemove', onMouseMove);
    wrap.removeEventListener('mouseleave', onMouseLeave);
  };
}

/**
 * Reveal elements on scroll, or immediately with reduced motion.
 *
 * @param reducedMotion - Whether the user prefers reduced motion.
 * @returns Cleanup that disconnects the reveal observer.
 */
function initScrollReveal(reducedMotion: boolean): ShowcaseCleanup {
  if (!('IntersectionObserver' in window)) return NOOP_CLEANUP;
  const items = document.querySelectorAll<HTMLElement>('[data-showcase-reveal]');
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.15, rootMargin: '0px 0px -40px 0px' },
  );
  for (const el of items) {
    if (reducedMotion) {
      el.classList.add('is-visible');
    } else {
      observer.observe(el);
    }
  }
  return () => observer.disconnect();
}

/**
 * Pause marquee rows on hover and resume on leave.
 *
 * @returns Cleanup that removes the hover listeners from every row.
 */
function initMarqueePause(): ShowcaseCleanup {
  const teardowns: ShowcaseCleanup[] = [];
  for (const row of document.querySelectorAll<HTMLElement>('.showcase-marquee-row')) {
    const onEnter = (): void => {
      row.style.animationPlayState = marqueePlayState(true);
    };
    const onLeave = (): void => {
      row.style.animationPlayState = marqueePlayState(false);
    };
    row.addEventListener('mouseenter', onEnter);
    row.addEventListener('mouseleave', onLeave);
    teardowns.push(() => {
      row.removeEventListener('mouseenter', onEnter);
      row.removeEventListener('mouseleave', onLeave);
    });
  }
  return () => {
    for (const teardown of teardowns) {
      teardown();
    }
  };
}

/**
 * Wire the interactive preview card: tabs, progress bar, buttons, and
 * theme-change updates.
 *
 * @param reducedMotion - Whether the user prefers reduced motion.
 * @param meta - Theme metadata read from the page.
 * @returns Handler that re-renders the card for a newly active theme.
 */
function initPreviewCard(reducedMotion: boolean, meta: ShowcaseMeta): (themeId: string) => void {
  const tabs = Array.from(document.querySelectorAll<HTMLElement>('.showcase-preview-tab'));
  const panels = Array.from(document.querySelectorAll<HTMLElement>('.showcase-preview-panel'));
  const toast = document.getElementById('showcase-preview-toast');
  let toastTimer: ReturnType<typeof setTimeout> | undefined;

  const progressFill = document.getElementById('showcase-progress-fill');
  const progressValue = document.getElementById('showcase-progress-value');
  const progressBar = document.getElementById('showcase-progress-bar');
  const progressElements: ProgressElements | null =
    progressFill && progressValue
      ? { fill: progressFill, value: progressValue, bar: progressBar }
      : null;

  const showToast = (message: string): void => {
    if (!toast) return;
    toast.textContent = message;
    toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toast.hidden = true;
    }, 1600);
  };

  const runProgress = (): void => {
    if (!progressElements) return;
    animateProgress(progressElements, { target: PROGRESS_TARGET, reducedMotion });
  };

  for (const [index, tab] of tabs.entries()) {
    tab.addEventListener('click', () => {
      const target = tab.getAttribute('data-preview-tab');
      if (!target) return;
      applyTabSelection(tabs, panels, target);
      if (target === 'overview') runProgress();
    });
    tab.addEventListener('keydown', (event: KeyboardEvent) => {
      const focusIndex = nextTabFocusIndex(event.key, index, tabs.length);
      if (focusIndex === null) return;
      event.preventDefault();
      focusTab(tabs, focusIndex);
    });
  }

  const codeBtn = document.getElementById('showcase-preview-code');
  if (codeBtn) {
    codeBtn.addEventListener('click', () => {
      const snippet = 'background: var(--turbo-bg-surface);\ncolor: var(--turbo-text-primary);';
      if (typeof navigator.clipboard?.writeText === 'function') {
        void navigator.clipboard
          .writeText(snippet)
          .then(() => {
            showToast('Copied CSS snippet');
          })
          .catch(() => {
            showToast(snippet);
          });
      } else {
        showToast(snippet);
      }
    });
  }

  const primaryBtn = document.getElementById('showcase-preview-primary');
  if (primaryBtn) {
    primaryBtn.addEventListener('click', () => {
      primaryBtn.classList.add('is-pressed');
      showToast('Primary action');
      setTimeout(() => {
        primaryBtn.classList.remove('is-pressed');
      }, 300);
    });
  }

  const outlineBtn = document.getElementById('showcase-preview-outline');
  if (outlineBtn) {
    outlineBtn.addEventListener('click', () => {
      outlineBtn.classList.toggle('is-active');
      showToast(outlineBtn.classList.contains('is-active') ? 'Outline active' : 'Outline default');
    });
  }

  const renderTheme = (theme: string): void => {
    const display = resolveThemeDisplay(theme, meta);
    const nameEl = document.getElementById('showcase-preview-theme-name');
    const iconEl = document.getElementById('showcase-preview-theme-icon');
    if (nameEl) nameEl.textContent = display.name;
    if (iconEl instanceof HTMLImageElement) iconEl.src = display.iconSrc;

    const overviewPanel = document.querySelector('[data-preview-panel="overview"]');
    if (overviewPanel?.classList.contains('is-active')) {
      runProgress();
    }
  };

  runProgress();
  return renderTheme;
}

/**
 * Invoke a callback on every theme change, whatever the channel.
 *
 * Covers changes driven through the integration API (marquee clicks)
 * via `turbo-theme-change` events, and changes applied outside it (the
 * header dropdown) via a `data-theme` attribute observer. Consecutive
 * duplicate notifications are collapsed.
 *
 * @param onTheme - Callback invoked with each newly active theme ID.
 * @returns Cleanup that removes the event listener and disconnects the observer.
 */
function wireThemeObserver(onTheme: (themeId: string) => void): ShowcaseCleanup {
  let lastTheme: string | null = null;

  const notify = (themeId: string | null): void => {
    if (!themeId || themeId === lastTheme) return;
    lastTheme = themeId;
    onTheme(themeId);
  };

  const unsubscribe = subscribeToThemeChanges((detail) => {
    notify(detail.themeId);
  }, document);

  const observer = new MutationObserver(() => {
    notify(document.documentElement.getAttribute('data-theme'));
  });
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  });

  return () => {
    unsubscribe();
    observer.disconnect();
  };
}

/**
 * Wire the marquee theme cards to the theme-selector integration API.
 *
 * Clicks on `[data-theme-preview]` elements apply the named theme through
 * `applyTheme` (which lazily loads its CSS); hovering or focusing a card
 * prefetches the theme's stylesheet via the lazy-CSS helpers.
 *
 * Partial applications are surfaced: when the stylesheet fails to load
 * the selector keeps the previous theme's CSS in effect and suppresses
 * the theme-change event, so the page logs the failure instead of
 * pretending the switch happened.
 *
 * @returns Cleanup that removes click and prefetch listeners.
 */
function initThemeControls(): ShowcaseCleanup {
  const onClick = (event: Event): void => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const trigger = target.closest(`[${THEME_TRIGGER_ATTRIBUTE}]`);
    const themeId = trigger?.getAttribute(THEME_TRIGGER_ATTRIBUTE);
    if (!themeId) return;
    void applyTheme(themeId).then((result) => {
      if (!result.applied || !result.cssLoaded) {
        console.warn(
          `Theme "${themeId}" was not fully applied: ` +
            'its stylesheet failed to load, keeping the previous theme CSS.',
        );
      }
    });
  };

  document.addEventListener('click', onClick);
  const unwirePrefetch = wireHoverPrefetch(document);
  return () => {
    document.removeEventListener('click', onClick);
    unwirePrefetch();
  };
}

/**
 * Initialize every showcase interaction on the current document.
 *
 * Re-entrant: a second call tears down the previous initialization first
 * so RAF loops and document-level listeners never accumulate.
 *
 * @returns Cleanup that cancels animations and removes listeners.
 */
export function initShowcase(): ShowcaseCleanup {
  activeShowcaseCleanup?.();

  const reducedMotion = prefersReducedMotion(window);
  const meta = readShowcaseMeta(document);
  const cleanups: ShowcaseCleanup[] = [
    initSpotlight(reducedMotion),
    initCometCard(reducedMotion),
    initThemeControls(),
    initTextMask(reducedMotion),
    initScrollReveal(reducedMotion),
    initMarqueePause(),
  ];
  const renderTheme = initPreviewCard(reducedMotion, meta);

  const syncTheme = (themeId: string): void => {
    syncThemeTriggers(
      Array.from(document.querySelectorAll(`[${THEME_TRIGGER_ATTRIBUTE}]`)),
      themeId,
    );
    renderTheme(themeId);
  };
  cleanups.push(wireThemeObserver(syncTheme));
  syncTheme(getCurrentTheme(document));

  const cleanup: ShowcaseCleanup = () => {
    for (const teardown of cleanups) {
      teardown();
    }
    if (activeShowcaseCleanup === cleanup) {
      activeShowcaseCleanup = null;
    }
  };
  activeShowcaseCleanup = cleanup;
  return cleanup;
}

// Auto-initialize on DOMContentLoaded
if (typeof document !== 'undefined' && typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    initShowcase();
  });
}
