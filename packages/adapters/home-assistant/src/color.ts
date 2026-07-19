// SPDX-License-Identifier: MIT
/**
 * Color helpers for the Home Assistant adapter.
 *
 * Home Assistant expects some frontend variables (the `rgb-*` family) to be a
 * bare `"R, G, B"` triplet rather than a `rgb()`/hex value, because it composes
 * them into `rgba(var(--rgb-primary-color), 0.5)` style expressions internally.
 */

const SHORT_HEX = /^#([0-9a-fA-F])([0-9a-fA-F])([0-9a-fA-F])$/;
const LONG_HEX = /^#([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/;

/**
 * Parse a `#rgb` or `#rrggbb` hex string into its red/green/blue components.
 *
 * @param hex - Hex color string, with a leading `#`.
 * @returns The `[r, g, b]` channel values (0-255).
 * @throws If the input is not a valid 3- or 6-digit hex color.
 */
export function hexToRgb(hex: string): [number, number, number] {
  if (typeof hex !== 'string') {
    throw new TypeError(`Invalid hex color: expected string, received ${typeof hex}`);
  }

  const shortMatch = SHORT_HEX.exec(hex);
  if (shortMatch) {
    const [, r, g, b] = shortMatch;
    return [
      Number.parseInt(`${r}${r}`, 16),
      Number.parseInt(`${g}${g}`, 16),
      Number.parseInt(`${b}${b}`, 16),
    ];
  }

  const longMatch = LONG_HEX.exec(hex);
  if (longMatch) {
    const [, r, g, b] = longMatch;
    return [Number.parseInt(r, 16), Number.parseInt(g, 16), Number.parseInt(b, 16)];
  }

  throw new Error(`Invalid hex color: "${hex}"`);
}

/**
 * Convert a hex color to a bare `"R, G, B"` triplet string (no `rgb()` wrapper).
 *
 * @param hex - Hex color string, with a leading `#`.
 * @returns The comma-separated triplet, e.g. `"137, 180, 250"`.
 * @throws If the input is not a valid 3- or 6-digit hex color.
 */
export function hexToRgbTriplet(hex: string): string {
  const [r, g, b] = hexToRgb(hex);
  return `${r}, ${g}, ${b}`;
}
