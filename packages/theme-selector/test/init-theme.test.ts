/**
 * Tests for initTheme function.
 * Tests theme initialization, localStorage integration, and CSS loading.
 */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { initTheme } from '../src/index';
import {
  setupDocumentMocks,
  mockThemeLoading,
  setupThemeLinkAutoLoad,
} from '../../../test/helpers/mocks.js';

/** Typed mock for the trigger-icon element used in applyTheme tests. */
interface MockTriggerIconEl {
  firstChild: ChildNode | null;
  removeChild: ReturnType<typeof vi.fn>;
  appendChild: ReturnType<typeof vi.fn>;
}

describe('initTheme', () => {
  let mocks: ReturnType<typeof setupDocumentMocks>;

  beforeEach(() => {
    vi.clearAllMocks();
    mocks = setupDocumentMocks();
  });

  it('applies theme class to documentElement', async () => {
    document.documentElement.className = '';
    mockThemeLoading();
    await initTheme(document, window);
    expect(document.documentElement.classList.add).toHaveBeenCalledWith('theme-catppuccin-mocha');
  });

  it('uses saved theme from localStorage', async () => {
    mocks.mockLocalStorage.getItem.mockReturnValue('catppuccin-frappe');
    mockThemeLoading();
    await initTheme(document, window);
    expect(mocks.mockLocalStorage.getItem).toHaveBeenCalledWith('turbo-theme');
  });

  it('uses default theme when localStorage is empty', async () => {
    mocks.mockLocalStorage.getItem.mockReturnValue(null);
    mockThemeLoading();
    await initTheme(document, window);
    expect(document.documentElement.classList.add).toHaveBeenCalledWith('theme-catppuccin-mocha');
  });

  it('falls back to default theme when saved theme is unknown', async () => {
    mocks.mockLocalStorage.getItem.mockReturnValue('unknown-theme');
    mockThemeLoading();
    await initTheme(document, window);
    expect(document.documentElement.classList.add).toHaveBeenCalledWith('theme-catppuccin-mocha');
  });

  it('handles baseUrl attribute on html element', async () => {
    Object.defineProperty(document.documentElement, 'getAttribute', {
      value: vi.fn((attr: string) => {
        if (attr === 'data-base-url') return '/my-base/';
        if (attr === 'data-theme') return 'catppuccin-mocha';
        return null;
      }),
      writable: true,
    });

    mockThemeLoading();
    await initTheme(document, window);
    expect(document.documentElement.classList.add).toHaveBeenCalledWith('theme-catppuccin-mocha');
  });

  it('handles invalid baseUrl gracefully (catch path)', async () => {
    Object.defineProperty(document.documentElement, 'getAttribute', {
      value: vi.fn((attr: string) => {
        if (attr === 'data-base-url') return ':::invalid:::';
        if (attr === 'data-theme') return 'catppuccin-mocha';
        return null;
      }),
      writable: true,
    });

    mockThemeLoading();
    await expect(initTheme(document, window)).resolves.not.toThrow();
  });

  it('handles theme application with invalid baseUrl', async () => {
    Object.defineProperty(document.documentElement, 'getAttribute', {
      value: vi.fn((attr: string) => {
        if (attr === 'data-base-url') return ':::invalid:::';
        if (attr === 'data-theme') return 'catppuccin-mocha';
        return null;
      }),
      writable: true,
    });

    mockThemeLoading();
    await expect(initTheme(document, window)).resolves.not.toThrow();
  });

  it('handles missing flavor link gracefully (no throw, no href set)', async () => {
    Object.defineProperty(document, 'getElementById', {
      value: vi.fn((id) => {
        if (id === 'theme-flavor-css') return null;
        if (id === 'theme-flavor-trigger-icon') return null;
        return null;
      }),
      writable: true,
    });

    mockThemeLoading();
    await expect(initTheme(document, window)).resolves.not.toThrow();
  });

  it('falls back to text icon when theme has no icon', async () => {
    const triggerIconEl: MockTriggerIconEl = {
      firstChild: null,
      removeChild: vi.fn(),
      appendChild: vi.fn(),
    };
    Object.defineProperty(document, 'getElementById', {
      value: vi.fn((id) => {
        if (id === 'theme-flavor-trigger-icon') return triggerIconEl;
        if (id === 'theme-flavor-css') return mocks.mockLink;
        return null;
      }),
      writable: true,
    });

    mocks.mockLocalStorage.getItem.mockReturnValue('catppuccin-latte');
    setupThemeLinkAutoLoad();
    await initTheme(document, window);

    expect(document.documentElement.classList.add).toHaveBeenCalledWith('theme-catppuccin-latte');
  });

  it('skips trigger icon update when trigger element is missing', async () => {
    Object.defineProperty(document, 'getElementById', {
      value: vi.fn((id) => {
        if (id === 'theme-flavor-trigger-icon') return null;
        if (id === 'theme-flavor-css') return mocks.mockLink;
        return null;
      }),
      writable: true,
    });

    mockThemeLoading();
    await expect(initTheme(document, window)).resolves.not.toThrow();
  });

  it('handles URL constructor error (cssFile) without throwing', async () => {
    const OriginalURL = URL;
    vi.stubGlobal(
      'URL',
      vi.fn((input: string, base?: string) => {
        if (typeof input === 'string' && input.includes('assets/css/themes')) {
          throw new Error('bad url');
        }
        return new OriginalURL(input, base);
      })
    );

    Object.defineProperty(document, 'getElementById', {
      value: vi.fn((id) => {
        if (id === 'theme-flavor-css') return mocks.mockLink;
        if (id === 'theme-flavor-trigger-icon') return null;
        return null;
      }),
      writable: true,
    });

    mockThemeLoading();
    await expect(initTheme(document, window)).resolves.not.toThrow();

    vi.unstubAllGlobals();
  });

  it('handles icon URL constructor error in applyTheme', async () => {
    const triggerIconEl: MockTriggerIconEl = {
      firstChild: null,
      removeChild: vi.fn(),
      appendChild: vi.fn(),
    };
    Object.defineProperty(document, 'getElementById', {
      value: vi.fn((id) => {
        if (id === 'theme-flavor-trigger-icon') return triggerIconEl;
        if (id === 'theme-flavor-css') return mocks.mockLink;
        return null;
      }),
      writable: true,
    });

    const OriginalURL = URL;
    vi.stubGlobal(
      'URL',
      vi.fn((input: string, base?: string) => {
        if (typeof input === 'string' && input.includes('assets/img')) {
          throw new Error('bad url');
        }
        return new OriginalURL(input, base);
      })
    );

    mocks.mockLocalStorage.getItem.mockReturnValue('catppuccin-frappe');
    await expect(initTheme(document, window)).resolves.not.toThrow();

    vi.unstubAllGlobals();
  });

  it('uses text fallback for themes without icons', async () => {
    mocks.mockLocalStorage.getItem.mockReturnValue('catppuccin-latte');
    setupThemeLinkAutoLoad();
    await initTheme(document, window);

    expect(document.documentElement.classList.add).toHaveBeenCalledWith('theme-catppuccin-latte');
  });

  describe('subset options', () => {
    it('falls back to defaultTheme when persisted theme is outside the allowlist', async () => {
      // 'dracula' is a valid theme but not part of the catppuccin subset.
      mocks.mockLocalStorage.getItem.mockReturnValue('dracula');
      mockThemeLoading();
      await initTheme(document, window, {
        vendors: ['catppuccin'],
        defaultTheme: 'catppuccin-latte',
      });
      expect(document.documentElement.classList.add).toHaveBeenCalledWith('theme-catppuccin-latte');
    });

    it('keeps a persisted theme that is inside the allowlist', async () => {
      mocks.mockLocalStorage.getItem.mockReturnValue('catppuccin-frappe');
      mockThemeLoading();
      await initTheme(document, window, {
        vendors: ['catppuccin'],
        defaultTheme: 'catppuccin-latte',
      });
      expect(document.documentElement.classList.add).toHaveBeenCalledWith(
        'theme-catppuccin-frappe'
      );
    });
  });
});
