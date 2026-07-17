import { themeIds, flavors, getThemesByAppearance } from '@lgtm-hq/turbo-themes';

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
 * b) Filter by vendor using getThemesByVendor() (import it if needed):
 *      import { getThemesByVendor } from '@lgtm-hq/turbo-themes';
 *      const CATALOG = getThemesByVendor('catppuccin').map((f) => f.id);
 *
 * c) Filter by appearance:
 *      const CATALOG = getThemesByAppearance('dark').map((f) => f.id);
 *
 * d) All themes (default):
 *      const CATALOG: readonly string[] = themeIds;
 *
 * Note: a `themeSets` helper and `createThemeCatalog()` factory are planned
 * in #495 and will make these patterns more ergonomic.
 */
const CATALOG: readonly string[] = themeIds;

type ThemeId = string;

const flavorMap = new Map(flavors.map((f) => [f.id, f]));

const LIGHT_THEMES: ReadonlySet<string> = new Set(
  getThemesByAppearance('light').map((f) => f.id)
);

function isValidTheme(theme: string): theme is ThemeId {
  return (CATALOG as readonly string[]).includes(theme);
}

function applyTheme(themeId: ThemeId): void {
  document.documentElement.setAttribute('data-theme', themeId);

  const bsTheme = LIGHT_THEMES.has(themeId) ? 'light' : 'dark';
  document.documentElement.setAttribute('data-bs-theme', bsTheme);

  const themeLink = document.getElementById('theme-css') as HTMLLinkElement | null;
  if (themeLink) {
    themeLink.href = `./turbo-themes/themes/${themeId}.css`;
  }

  const currentThemeEl = document.getElementById('current-theme');
  if (currentThemeEl) {
    currentThemeEl.textContent = flavorMap.get(themeId)?.label ?? themeId;
  }

  try {
    localStorage.setItem(STORAGE_KEY, themeId);
  } catch {
    console.warn('Could not persist theme selection');
  }
}

function getInitialTheme(): ThemeId {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && isValidTheme(saved)) {
      return saved;
    }
  } catch {
    // localStorage not available
  }
  return DEFAULT_THEME;
}

function populateSelector(selector: HTMLSelectElement): void {
  selector.innerHTML = '';

  const vendorGroups = new Map<string, HTMLOptGroupElement>();

  for (const id of CATALOG) {
    const flavor = flavorMap.get(id);
    if (!flavor) continue;

    let group = vendorGroups.get(flavor.vendor);
    if (!group) {
      group = document.createElement('optgroup');
      group.label = flavor.vendor.charAt(0).toUpperCase() + flavor.vendor.slice(1);
      selector.appendChild(group);
      vendorGroups.set(flavor.vendor, group);
    }

    const option = document.createElement('option');
    option.value = id;
    option.textContent = flavor.label;
    group.appendChild(option);
  }
}

function init(): void {
  const selector = document.getElementById('theme-selector') as HTMLSelectElement | null;

  if (!selector) {
    console.warn('Theme selector not found');
    return;
  }

  populateSelector(selector);

  const initialTheme = getInitialTheme();
  selector.value = initialTheme;
  applyTheme(initialTheme);

  selector.addEventListener('change', (e) => {
    const target = e.target as HTMLSelectElement;
    const newTheme = target.value;

    if (isValidTheme(newTheme)) {
      applyTheme(newTheme);
    } else {
      console.warn('Invalid theme selected:', newTheme);
    }
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
