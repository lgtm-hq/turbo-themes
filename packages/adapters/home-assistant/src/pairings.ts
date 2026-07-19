// SPDX-License-Identifier: MIT
/**
 * Auto-theme vendor pairings for the Home Assistant adapter.
 *
 * Home Assistant supports "auto" themes that switch between a dark and light
 * variant based on the user's system color scheme, via a `modes:` block. Each
 * pairing couples a Turbo dark flavor with its light counterpart.
 */

import type { ThemeTokens } from '@lgtm-hq/turbo-themes-core/themes/types';
import { getTheme } from '@lgtm-hq/turbo-themes-core';

/** A dark/light pairing that becomes a single Home Assistant auto theme. */
export interface AutoThemePairing {
  /** Human-readable Home Assistant theme name, e.g. `"Catppuccin (Auto)"`. */
  readonly name: string;
  /** Registry id of the dark flavor (also used for the flat top-level keys). */
  readonly dark: string;
  /** Registry id of the light flavor. */
  readonly light: string;
}

/** A pairing whose dark/light flavors have been resolved to concrete tokens. */
export interface ResolvedAutoTheme {
  readonly name: string;
  readonly darkTokens: ThemeTokens;
  readonly lightTokens: ThemeTokens;
}

/** Dark/light flavor pairings, one per vendor family, emitted as auto themes. */
export const AUTO_THEME_PAIRINGS: readonly AutoThemePairing[] = [
  { name: 'Bulma (Auto)', dark: 'bulma-dark', light: 'bulma-light' },
  { name: 'Catppuccin (Auto)', dark: 'catppuccin-mocha', light: 'catppuccin-latte' },
  { name: 'GitHub (Auto)', dark: 'github-dark', light: 'github-light' },
  { name: 'Gruvbox (Auto)', dark: 'gruvbox-dark', light: 'gruvbox-light' },
  { name: 'One (Auto)', dark: 'one-dark', light: 'one-light' },
  { name: 'Rosé Pine (Auto)', dark: 'rose-pine', light: 'rose-pine-dawn' },
  { name: 'Solarized (Auto)', dark: 'solarized-dark', light: 'solarized-light' },
  { name: 'Tokyo Night (Auto)', dark: 'tokyo-night-dark', light: 'tokyo-night-light' },
] as const;

/**
 * Resolve a pairing to its concrete dark/light tokens, validating as it goes.
 *
 * @param pairing - The pairing to resolve.
 * @returns The pairing name plus the resolved dark and light token sets.
 * @throws If either id is missing from the registry, or an id's appearance does
 *   not match the slot it occupies (dark slot must be dark, light slot light).
 */
export function resolveAutoTheme(pairing: AutoThemePairing): ResolvedAutoTheme {
  const { name, dark, light } = pairing;

  const darkTheme = getTheme(dark);
  if (!darkTheme) {
    throw new Error(`Auto theme "${name}" references unknown dark theme id "${dark}"`);
  }
  if (darkTheme.appearance !== 'dark') {
    throw new Error(
      `Auto theme "${name}" dark slot "${dark}" has appearance "${darkTheme.appearance}", expected "dark"`,
    );
  }

  const lightTheme = getTheme(light);
  if (!lightTheme) {
    throw new Error(`Auto theme "${name}" references unknown light theme id "${light}"`);
  }
  if (lightTheme.appearance !== 'light') {
    throw new Error(
      `Auto theme "${name}" light slot "${light}" has appearance "${lightTheme.appearance}", expected "light"`,
    );
  }

  return { name, darkTokens: darkTheme.tokens, lightTokens: lightTheme.tokens };
}

/**
 * Validate every pairing, throwing on the first problem.
 *
 * @param pairings - Pairings to validate (defaults to {@link AUTO_THEME_PAIRINGS}).
 * @throws If any pairing is invalid; see {@link resolveAutoTheme}.
 */
export function assertPairingsValid(
  pairings: readonly AutoThemePairing[] = AUTO_THEME_PAIRINGS,
): void {
  for (const pairing of pairings) {
    resolveAutoTheme(pairing);
  }
}
