import { describe, expect, it } from "vitest";
import { escapeDoubleQuoted, isSafePlainKey, renderKey, renderValue } from "../src/yaml.js";

describe("escapeDoubleQuoted", () => {
  it("escapes backslashes and double quotes", () => {
    expect(escapeDoubleQuoted('a\\b"c')).toBe('a\\\\b\\"c');
  });

  it("leaves plain values untouched", () => {
    expect(escapeDoubleQuoted("#1e1e2e")).toBe("#1e1e2e");
    expect(escapeDoubleQuoted("137, 180, 250")).toBe("137, 180, 250");
  });

  it("escapes control characters as YAML escape sequences", () => {
    expect(escapeDoubleQuoted("a\tb")).toBe("a\\tb");
    expect(escapeDoubleQuoted("a\nb")).toBe("a\\nb");
    expect(escapeDoubleQuoted("a\rb")).toBe("a\\rb");
    expect(escapeDoubleQuoted("a\0b")).toBe("a\\0b");
    expect(escapeDoubleQuoted("a\x07b")).toBe("a\\x07b");
    expect(escapeDoubleQuoted("a\x7fb")).toBe("a\\x7fb");
  });
});

describe("isSafePlainKey", () => {
  it.each(["primary-color", "Bulma Dark", "Catppuccin Frappé", "Bulma (Auto)", "Rosé Pine"])(
    "treats %s as a safe plain key",
    (name) => {
      expect(isSafePlainKey(name)).toBe(true);
    },
  );

  it.each(["", " leading-space", "has: colon", "has#hash", "{flow}"])(
    "treats %s as unsafe",
    (name) => {
      expect(isSafePlainKey(name)).toBe(false);
    },
  );

  it.each(["on", "Off", "YES", "no", "true", "False", "null", "y", "N"])(
    "treats YAML 1.1 reserved word %s as unsafe",
    (name) => {
      expect(isSafePlainKey(name)).toBe(false);
    },
  );
});

describe("renderKey", () => {
  it("emits safe keys unquoted", () => {
    expect(renderKey("primary-color")).toBe("primary-color");
    expect(renderKey("Bulma (Auto)")).toBe("Bulma (Auto)");
  });

  it("quotes and escapes unsafe keys", () => {
    expect(renderKey("has: colon")).toBe('"has: colon"');
    expect(renderKey('a"b')).toBe('"a\\"b"');
  });
});

describe("renderValue", () => {
  it("always double-quotes values", () => {
    expect(renderValue("#1e1e2e")).toBe('"#1e1e2e"');
    expect(renderValue("137, 180, 250")).toBe('"137, 180, 250"');
  });
});
