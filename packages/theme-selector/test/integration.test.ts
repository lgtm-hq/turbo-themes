// SPDX-License-Identifier: MIT
/**
 * Tests for the public integration API (apply, query, subscribe).
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  applyTheme,
  getCurrentTheme,
  subscribeToThemeChanges,
  THEME_CHANGE_EVENT,
  type ThemeChangeDetail,
} from '../src/integration.js';
import { DEFAULT_THEME, STORAGE_KEY } from '../src/constants.js';

/** Creates a typed in-memory Storage implementation for persistence checks. */
function createMemoryStorage(): Storage {
  const store = new Map<string, string>();
  return {
    get length(): number {
      return store.size;
    },
    clear: (): void => {
      store.clear();
    },
    getItem: (key: string): string | null => store.get(key) ?? null,
    key: (index: number): string | null => Array.from(store.keys())[index] ?? null,
    removeItem: (key: string): void => {
      store.delete(key);
    },
    setItem: (key: string, value: string): void => {
      store.set(key, value);
    },
  };
}

/** Removes theme state left on the document by a previous test. */
function resetDocumentThemeState(): void {
  const root = document.documentElement;
  root.removeAttribute('data-theme');
  root.removeAttribute('data-appearance');
  const themeClasses = Array.from(root.classList).filter((name) => name.startsWith('theme-'));
  if (themeClasses.length > 0) {
    root.classList.remove(...themeClasses);
  }
  document
    .querySelectorAll('link[id^="theme-"][id$="-css"]')
    .forEach((link) => link.remove());
}

describe('integration API', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>;
  let storage: Storage;

  beforeEach(() => {
    vi.clearAllMocks();
    resetDocumentThemeState();
    storage = createMemoryStorage();
    Object.defineProperty(window, 'localStorage', {
      value: storage,
      writable: true,
      configurable: true,
    });
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    resetDocumentThemeState();
    storage.clear();
    warnSpy.mockRestore();
  });

  describe('applyTheme', () => {
    it('applies a valid theme and reports full success', async () => {
      const result = await applyTheme('catppuccin-latte', document, window);

      expect(result).toEqual({ applied: true, cssLoaded: true, persisted: true });
      expect(document.documentElement.classList.contains('theme-catppuccin-latte')).toBe(true);
    });

    it('sets data-theme and data-appearance root attributes', async () => {
      await applyTheme('catppuccin-latte', document, window);

      expect(document.documentElement.getAttribute('data-theme')).toBe('catppuccin-latte');
      expect(document.documentElement.getAttribute('data-appearance')).toBe('light');
    });

    it('persists the applied theme to localStorage', async () => {
      await applyTheme('catppuccin-mocha', document, window);

      expect(storage.getItem(STORAGE_KEY)).toBe('catppuccin-mocha');
    });

    it('dispatches a theme-change event with theme ID and appearance', async () => {
      const listener = vi.fn();
      document.addEventListener(THEME_CHANGE_EVENT, listener);

      await applyTheme('catppuccin-mocha', document, window);

      expect(listener).toHaveBeenCalledTimes(1);
      const event = listener.mock.calls[0]?.[0] as CustomEvent<ThemeChangeDetail>;
      expect(event.detail).toEqual({ themeId: 'catppuccin-mocha', appearance: 'dark' });

      document.removeEventListener(THEME_CHANGE_EVENT, listener);
    });

    it('rejects an unknown theme ID and reports nothing applied', async () => {
      const result = await applyTheme('not-a-real-theme', document, window);

      expect(result).toEqual({ applied: false, cssLoaded: false, persisted: false });
      expect(document.documentElement.getAttribute('data-theme')).toBeNull();
      expect(storage.getItem(STORAGE_KEY)).toBeNull();
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('Invalid theme ID'),
        expect.objectContaining({ themeId: 'not-a-real-theme' })
      );
    });

    it.each([
      { themeId: '', description: 'empty string' },
      { themeId: 'bad theme!', description: 'special characters' },
      { themeId: '<script>alert(1)</script>', description: 'markup injection' },
      { themeId: 'a'.repeat(101), description: 'excessively long ID' },
    ])('rejects malformed theme ID ($description)', async ({ themeId }) => {
      const result = await applyTheme(themeId, document, window);

      expect(result).toEqual({ applied: false, cssLoaded: false, persisted: false });
      expect(document.documentElement.getAttribute('data-theme')).toBeNull();
    });

    it('does not dispatch a theme-change event for invalid theme IDs', async () => {
      const listener = vi.fn();
      document.addEventListener(THEME_CHANGE_EVENT, listener);

      await applyTheme('not-a-real-theme', document, window);

      expect(listener).not.toHaveBeenCalled();
      document.removeEventListener(THEME_CHANGE_EVENT, listener);
    });

    it('defaults to the global document and window', async () => {
      const result = await applyTheme('catppuccin-latte');

      expect(result).toEqual({ applied: true, cssLoaded: true, persisted: true });
      expect(document.documentElement.getAttribute('data-theme')).toBe('catppuccin-latte');
      expect(storage.getItem(STORAGE_KEY)).toBe('catppuccin-latte');
    });

    describe('partial-failure reporting', () => {
      /** Creates a Storage whose writes always fail (quota/private browsing). */
      function createFailingStorage(): Storage {
        const readable = createMemoryStorage();
        return {
          get length(): number {
            return readable.length;
          },
          clear: readable.clear,
          getItem: readable.getItem,
          key: readable.key,
          removeItem: readable.removeItem,
          setItem: (): void => {
            throw new Error('QuotaExceededError');
          },
        };
      }

      it('reports persisted false when localStorage writes fail', async () => {
        Object.defineProperty(window, 'localStorage', {
          value: createFailingStorage(),
          writable: true,
          configurable: true,
        });

        const result = await applyTheme('catppuccin-latte', document, window);

        expect(result).toEqual({ applied: true, cssLoaded: true, persisted: false });
        expect(warnSpy).toHaveBeenCalledWith(
          expect.stringContaining('localStorage setItem failed'),
          expect.anything(),
        );
      });

      it('still applies the theme and dispatches the event when persistence fails', async () => {
        Object.defineProperty(window, 'localStorage', {
          value: createFailingStorage(),
          writable: true,
          configurable: true,
        });
        const listener = vi.fn();
        document.addEventListener(THEME_CHANGE_EVENT, listener);

        await applyTheme('catppuccin-mocha', document, window);

        expect(document.documentElement.getAttribute('data-theme')).toBe('catppuccin-mocha');
        expect(listener).toHaveBeenCalledTimes(1);
        document.removeEventListener(THEME_CHANGE_EVENT, listener);
      });

      it('reports cssLoaded false when the stylesheet fails to load', async () => {
        const resultPromise = applyTheme('catppuccin-latte', document, window);
        const link = document.getElementById(
          'theme-catppuccin-latte-css',
        ) as HTMLLinkElement | null;
        expect(link).not.toBeNull();
        link?.onerror?.(new Event('error'));

        const result = await resultPromise;

        expect(result).toEqual({ applied: true, cssLoaded: false, persisted: true });
      });

      it('does not dispatch the theme-change event when the stylesheet fails to load', async () => {
        const listener = vi.fn();
        document.addEventListener(THEME_CHANGE_EVENT, listener);

        const resultPromise = applyTheme('catppuccin-latte', document, window);
        const link = document.getElementById(
          'theme-catppuccin-latte-css',
        ) as HTMLLinkElement | null;
        link?.onerror?.(new Event('error'));
        await resultPromise;

        expect(listener).not.toHaveBeenCalled();
        document.removeEventListener(THEME_CHANGE_EVENT, listener);
      });
    });
  });

  describe('getCurrentTheme', () => {
    it('returns the theme from the data-theme attribute', () => {
      document.documentElement.setAttribute('data-theme', 'catppuccin-frappe');

      expect(getCurrentTheme(document)).toBe('catppuccin-frappe');
    });

    it('falls back to the theme-* class when data-theme is absent', () => {
      document.documentElement.classList.add('theme-catppuccin-latte');

      expect(getCurrentTheme(document)).toBe('catppuccin-latte');
    });

    it('returns the default theme when no theme state is present', () => {
      expect(getCurrentTheme(document)).toBe(DEFAULT_THEME);
    });

    it('reflects the theme set by applyTheme', async () => {
      await applyTheme('catppuccin-macchiato', document, window);

      expect(getCurrentTheme(document)).toBe('catppuccin-macchiato');
    });

    it('defaults to the global document', () => {
      document.documentElement.setAttribute('data-theme', 'catppuccin-mocha');

      expect(getCurrentTheme()).toBe('catppuccin-mocha');
    });
  });

  describe('subscribeToThemeChanges', () => {
    it('notifies subscribers when a theme is applied', async () => {
      const listener = vi.fn();
      const unsubscribe = subscribeToThemeChanges(listener, document);

      await applyTheme('catppuccin-latte', document, window);

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith({
        themeId: 'catppuccin-latte',
        appearance: 'light',
      });
      unsubscribe();
    });

    it('notifies multiple subscribers of the same change', async () => {
      const first = vi.fn();
      const second = vi.fn();
      const unsubscribeFirst = subscribeToThemeChanges(first, document);
      const unsubscribeSecond = subscribeToThemeChanges(second, document);

      await applyTheme('catppuccin-mocha', document, window);

      expect(first).toHaveBeenCalledTimes(1);
      expect(second).toHaveBeenCalledTimes(1);
      unsubscribeFirst();
      unsubscribeSecond();
    });

    it('stops notifying after unsubscribe', async () => {
      const listener = vi.fn();
      const unsubscribe = subscribeToThemeChanges(listener, document);

      await applyTheme('catppuccin-latte', document, window);
      unsubscribe();
      await applyTheme('catppuccin-mocha', document, window);

      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('does not notify for invalid theme applications', async () => {
      const listener = vi.fn();
      const unsubscribe = subscribeToThemeChanges(listener, document);

      await applyTheme('not-a-real-theme', document, window);

      expect(listener).not.toHaveBeenCalled();
      unsubscribe();
    });

    it('ignores events without a detail payload', () => {
      const listener = vi.fn();
      const unsubscribe = subscribeToThemeChanges(listener, document);

      document.dispatchEvent(new Event(THEME_CHANGE_EVENT));

      expect(listener).not.toHaveBeenCalled();
      unsubscribe();
    });

    it('defaults to the global document', async () => {
      const listener = vi.fn();
      const unsubscribe = subscribeToThemeChanges(listener);

      await applyTheme('catppuccin-latte', document, window);

      expect(listener).toHaveBeenCalledTimes(1);
      unsubscribe();
    });
  });

  describe('THEME_CHANGE_EVENT', () => {
    it('uses the documented event name', () => {
      expect(THEME_CHANGE_EVENT).toBe('turbo-theme-change');
    });
  });
});
