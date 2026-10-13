/**
 * Tests for wireFlavorSelector initialization.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { themeSets, flavors } from '@lgtm-hq/turbo-themes-core';
import {
  wireFlavorSelector,
  setupDocumentMocks,
  createMockAbortController,
  setupKeyboardNavTest,
} from './test-setup.js';

describe('wireFlavorSelector - initialization', () => {
  let mocks: ReturnType<typeof setupDocumentMocks>;

  beforeEach(() => {
    vi.clearAllMocks();
    mocks = setupDocumentMocks();
  });

  it('returns early when elements are missing', async () => {
    const { mockAbortController, MockAbortController } = createMockAbortController();
    const originalAbortController = global.AbortController;
    (global as any).AbortController = MockAbortController;

    try {
      Object.defineProperty(document, 'getElementById', {
        value: vi.fn((id) => {
          if (id === 'theme-flavor-items' || id === 'theme-flavor-trigger') {
            return null;
          }
          return null;
        }),
        writable: true,
      });

      const result = await wireFlavorSelector(document, window);
      expect(document.getElementById).toHaveBeenCalledWith('theme-flavor-menu');
      expect(document.getElementById).toHaveBeenCalledWith('theme-flavor-trigger');

      expect(result).toBeDefined();
      expect(result.cleanup).toBeDefined();
      expect(typeof result.cleanup).toBe('function');

      result.cleanup();
      expect(mockAbortController.abort).toHaveBeenCalled();
    } finally {
      (global as any).AbortController = originalAbortController;
    }
  });

  it('creates dropdown items for themes', () => {
    wireFlavorSelector(document, window);

    expect(document.createElement).toHaveBeenCalledWith('button');
    expect(document.createElement).toHaveBeenCalledWith('div');
    expect(document.createElement).toHaveBeenCalledWith('span');
  });

  describe('subset options', () => {
    it('renders only the themes in themeSets.minimal', async () => {
      const ctx = setupKeyboardNavTest(mocks);
      await wireFlavorSelector(document, window, { catalog: themeSets.minimal });

      const rendered = ctx.createdButtons
        .map((b) => b.getAttribute('data-theme-id') as string)
        .sort();
      expect(rendered).toEqual([...themeSets.minimal.themeIds].sort());
    });

    it('renders all themes when no options are given', async () => {
      const ctx = setupKeyboardNavTest(mocks);
      await wireFlavorSelector(document, window);

      expect(ctx.createdButtons).toHaveLength(flavors.length);
    });

    it('renders only the requested vendor variants', async () => {
      const ctx = setupKeyboardNavTest(mocks);
      await wireFlavorSelector(document, window, { vendors: ['catppuccin'] });

      const rendered = ctx.createdButtons.map((b) => b.getAttribute('data-theme-id') as string);
      expect(rendered.length).toBeGreaterThan(1);
      expect(rendered.every((id) => id.startsWith('catppuccin'))).toBe(true);
    });
  });

  it('sets up event listeners for theme selector', () => {
    wireFlavorSelector(document, window);

    expect(mocks.mockElement.addEventListener).toHaveBeenCalledWith(
      'click',
      expect.any(Function),
      expect.any(Object)
    );
    expect(mocks.mockElement.addEventListener).toHaveBeenCalledWith(
      'keydown',
      expect.any(Function),
      expect.any(Object)
    );

    expect(
      (document.addEventListener as any).mock.calls.some((call: any[]) => call[0] === 'click')
    ).toBe(true);
    expect(
      (document.addEventListener as any).mock.calls.some((call: any[]) => call[0] === 'keydown')
    ).toBe(true);
  });
});
