import { describe, expect, it } from 'vitest';
import { escapeDoubleQuoted, isSafePlainKey, renderKey, renderValue } from '../src/yaml.js';

describe('escapeDoubleQuoted', () => {
  it('escapes backslashes and double quotes', () => {
    expect(escapeDoubleQuoted('a\\b"c')).toBe('a\\\\b\\"c');
  });

  it('leaves plain values untouched', () => {
    expect(escapeDoubleQuoted('#1e1e2e')).toBe('#1e1e2e');
    expect(escapeDoubleQuoted('137, 180, 250')).toBe('137, 180, 250');
  });
});

describe('isSafePlainKey', () => {
  it.each(['primary-color', 'Bulma Dark', 'Catppuccin Frappé', 'Bulma (Auto)', 'Rosé Pine'])(
    'treats %s as a safe plain key',
    (name) => {
      expect(isSafePlainKey(name)).toBe(true);
    },
  );

  it.each(['', ' leading-space', 'has: colon', 'has#hash', '{flow}'])(
    'treats %s as unsafe',
    (name) => {
      expect(isSafePlainKey(name)).toBe(false);
    },
  );
});

describe('renderKey', () => {
  it('emits safe keys unquoted', () => {
    expect(renderKey('primary-color')).toBe('primary-color');
    expect(renderKey('Bulma (Auto)')).toBe('Bulma (Auto)');
  });

  it('quotes and escapes unsafe keys', () => {
    expect(renderKey('has: colon')).toBe('"has: colon"');
    expect(renderKey('a"b')).toBe('"a\\"b"');
  });
});

describe('renderValue', () => {
  it('always double-quotes values', () => {
    expect(renderValue('#1e1e2e')).toBe('"#1e1e2e"');
    expect(renderValue('137, 180, 250')).toBe('"137, 180, 250"');
  });
});
