import { useState, useEffect, useCallback } from 'react';
import { themeIds, flavors, getThemesByVendor, getThemesByAppearance } from '@lgtm-hq/turbo-themes';

const STORAGE_KEY = 'turbo-theme';
const DEFAULT_THEME = 'catppuccin-mocha';

/**
 * Curated theme catalog for this app.
 *
 * Consumer curation patterns (using existing APIs):
 *
 * a) Hardcoded minimal set (copy-paste friendly):
 *      const CATALOG: readonly string[] = [
 *        'catppuccin-mocha', 'catppuccin-latte', 'dracula', 'github-dark', 'github-light',
 *      ];
 *
 * b) Filter by vendor using getThemesByVendor():
 *      const CATALOG = getThemesByVendor('catppuccin').map((f) => f.id);
 *
 * c) Filter by appearance using getThemesByAppearance():
 *      const CATALOG = getThemesByAppearance('dark').map((f) => f.id);
 *
 * d) All themes (default):
 *      const CATALOG: readonly string[] = themeIds;
 *
 * Note: a `themeSets` helper and `createThemeCatalog()` factory are planned
 * in #495 and will make these patterns more ergonomic.
 */
const CATALOG: readonly string[] = themeIds;

export type ThemeId = (typeof themeIds)[number];

export interface ThemeOption {
  id: ThemeId;
  label: string;
}

const flavorMap = new Map(flavors.map((f) => [f.id, f]));

/** Theme options derived from the curated catalog. */
export const THEME_OPTIONS: ThemeOption[] = CATALOG.map((id) => ({
  id: id as ThemeId,
  label: flavorMap.get(id)?.label ?? id,
}));

function getInitialTheme(): ThemeId {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && (CATALOG as readonly string[]).includes(saved)) {
      return saved as ThemeId;
    }
  } catch {
    // localStorage not available
  }
  return DEFAULT_THEME;
}

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeId>(getInitialTheme);

  const setTheme = useCallback((newTheme: ThemeId) => {
    if (!(CATALOG as readonly string[]).includes(newTheme)) {
      console.warn('Invalid theme ID:', newTheme);
      return;
    }

    setThemeState(newTheme);

    // Update DOM
    document.documentElement.setAttribute('data-theme', newTheme);

    // Update CSS link
    const themeLink = document.getElementById('theme-css') as HTMLLinkElement | null;
    if (themeLink) {
      themeLink.href = `./turbo-themes/themes/${newTheme}.css`;
    }

    // Persist to localStorage
    try {
      localStorage.setItem(STORAGE_KEY, newTheme);
    } catch {
      console.warn('Could not persist theme selection');
    }
  }, []);

  // Sync with DOM on mount
  useEffect(() => {
    if (!(CATALOG as readonly string[]).includes(theme)) return;

    document.documentElement.setAttribute('data-theme', theme);
    const themeLink = document.getElementById('theme-css') as HTMLLinkElement | null;
    if (themeLink) {
      themeLink.href = `./turbo-themes/themes/${theme}.css`;
    }
  }, [theme]);

  return {
    theme,
    setTheme,
    themes: THEME_OPTIONS,
  };
}

// Re-export helpers for consumers building their own catalog
export { getThemesByVendor, getThemesByAppearance };
