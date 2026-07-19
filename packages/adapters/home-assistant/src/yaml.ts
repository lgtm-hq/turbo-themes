// SPDX-License-Identifier: MIT
/**
 * Minimal, dependency-free YAML rendering helpers for the Home Assistant emitter.
 *
 * Only the tiny subset needed to emit Home Assistant themes is implemented:
 * double-quoted scalar values and (optionally) plain-scalar mapping keys.
 */

// A name is safe as an unquoted (plain) YAML mapping key when it starts with an
// alphanumeric (any Unicode letter/number) and contains only alphanumerics,
// spaces, and punctuation that carries no meaning in YAML plain scalars.
const SAFE_PLAIN_KEY = /^[\p{L}\p{N}][\p{L}\p{N} ()./-]*$/u;

// Plain scalars that YAML 1.1 loaders (e.g. pyyaml, which Home Assistant uses)
// resolve to booleans or null even in mapping-key position. These must always be
// double-quoted to survive as string keys.
const YAML11_RESERVED = new Set(["true", "false", "yes", "no", "on", "off", "null", "y", "n", "~"]);

// C0 control characters and DEL, which are not representable literally inside a
// YAML double-quoted scalar.
// eslint-disable-next-line no-control-regex
const CONTROL_CHARS = /[\x00-\x1f\x7f]/g;

const CONTROL_SHORTHAND: Record<string, string> = {
  "\t": "\\t",
  "\n": "\\n",
  "\r": "\\r",
  "\0": "\\0",
};

/** Escape a string for use inside a YAML double-quoted scalar. */
export function escapeDoubleQuoted(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(CONTROL_CHARS, (char) => {
      const shorthand = CONTROL_SHORTHAND[char];
      if (shorthand) {
        return shorthand;
      }
      return `\\x${char.charCodeAt(0).toString(16).padStart(2, "0")}`;
    });
}

/** Whether a mapping key can be emitted as an unquoted YAML plain scalar. */
export function isSafePlainKey(name: string): boolean {
  if (YAML11_RESERVED.has(name.toLowerCase())) {
    return false;
  }
  return SAFE_PLAIN_KEY.test(name);
}

/** Render a mapping key, quoting only when it is not a safe plain scalar. */
export function renderKey(name: string): string {
  return isSafePlainKey(name) ? name : `"${escapeDoubleQuoted(name)}"`;
}

/** Render a value as a YAML double-quoted scalar. */
export function renderValue(value: string): string {
  return `"${escapeDoubleQuoted(value)}"`;
}
