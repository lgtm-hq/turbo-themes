import { describe, expect, it } from 'vitest';
import { hexToRgb, hexToRgbTriplet } from '../src/color.js';

describe('hexToRgb', () => {
  it.each([
    { hex: '#000000', rgb: [0, 0, 0] },
    { hex: '#ffffff', rgb: [255, 255, 255] },
    { hex: '#89b4fa', rgb: [137, 180, 250] },
    { hex: '#1E1E2E', rgb: [30, 30, 46] },
  ])('parses 6-digit $hex', ({ hex, rgb }) => {
    expect(hexToRgb(hex)).toEqual(rgb);
  });

  it.each([
    { hex: '#000', rgb: [0, 0, 0] },
    { hex: '#fff', rgb: [255, 255, 255] },
    { hex: '#0af', rgb: [0, 170, 255] },
  ])('expands 3-digit $hex', ({ hex, rgb }) => {
    expect(hexToRgb(hex)).toEqual(rgb);
  });

  it.each(['#12345', '123456', '#gggggg', '#12', 'rgb(0,0,0)', ''])(
    'throws on invalid input %s',
    (bad) => {
      expect(() => hexToRgb(bad)).toThrow(/Invalid hex color/);
    },
  );

  it('throws a TypeError for non-string input', () => {
    expect(() => hexToRgb(null as unknown as string)).toThrow(TypeError);
  });
});

describe('hexToRgbTriplet', () => {
  it('renders a bare comma-separated triplet without an rgb() wrapper', () => {
    expect(hexToRgbTriplet('#89b4fa')).toBe('137, 180, 250');
    expect(hexToRgbTriplet('#000')).toBe('0, 0, 0');
  });

  it('does not wrap the value', () => {
    expect(hexToRgbTriplet('#ffffff')).not.toContain('rgb');
  });
});
