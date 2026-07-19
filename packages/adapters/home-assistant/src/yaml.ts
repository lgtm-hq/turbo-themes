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

/** Escape a string for use inside a YAML double-quoted scalar. */
export function escapeDoubleQuoted(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

/** Whether a mapping key can be emitted as an unquoted YAML plain scalar. */
export function isSafePlainKey(name: string): boolean {
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
