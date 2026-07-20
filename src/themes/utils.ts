/**
 * Convert a hex color to an rgba() string.
 * Supports #RGB, #RRGGBB, and #RRGGBBAA (alpha byte in the hex is ignored;
 * use the `alpha` argument instead).
 */
export function hexToRgba(hex: string, alpha: number): string {
  if (!/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(hex)) {
    throw new Error(`Invalid hex color: ${hex}`);
  }
  const h = hex.slice(1);
  let r: number, g: number, b: number;
  if (h.length === 3) {
    r = parseInt(h.charAt(0) + h.charAt(0), 16);
    g = parseInt(h.charAt(1) + h.charAt(1), 16);
    b = parseInt(h.charAt(2) + h.charAt(2), 16);
  } else {
    r = parseInt(h.slice(0, 2), 16);
    g = parseInt(h.slice(2, 4), 16);
    b = parseInt(h.slice(4, 6), 16);
  }
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
