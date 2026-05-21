// SPDX-License-Identifier: MIT
import { describe, expect, it } from 'vitest';
import { resolveThemeAppearance } from '../src/appearance.js';

describe('resolveThemeAppearance', () => {
  it('returns light for known light themes', () => {
    expect(resolveThemeAppearance('catppuccin-latte')).toBe('light');
    expect(resolveThemeAppearance('github-light')).toBe('light');
  });

  it('returns dark for known dark themes', () => {
    expect(resolveThemeAppearance('catppuccin-mocha')).toBe('dark');
    expect(resolveThemeAppearance('dracula')).toBe('dark');
  });

  it('falls back to dark for unknown theme IDs', () => {
    expect(resolveThemeAppearance('nonexistent')).toBe('dark');
  });

  it('uses custom appearance map when provided', () => {
    expect(resolveThemeAppearance('custom', { custom: 'light' })).toBe('light');
    expect(resolveThemeAppearance('other', { custom: 'light' })).toBe('dark');
  });
});
