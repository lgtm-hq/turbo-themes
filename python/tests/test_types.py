# SPDX-License-Identifier: MIT
"""Tests for type definitions."""

from typing import Any

from assertpy import assert_that

from turbo_themes.models import (
    Appearance,
    TokenNamespace,
    Tokens,
    ThemeValue,
    ByVendorValue,
    Meta,
    TurboThemes,
    turbo_themes_from_dict,
)

# --- Appearance ---


def test_appearance_light_value() -> None:
    """Light appearance should have correct value."""
    assert_that(Appearance.LIGHT.value).is_equal_to("light")


def test_appearance_dark_value() -> None:
    """Dark appearance should have correct value."""
    assert_that(Appearance.DARK.value).is_equal_to("dark")


def test_appearance_from_string() -> None:
    """Can create from string value."""
    assert_that(Appearance("light")).is_equal_to(Appearance.LIGHT)
    assert_that(Appearance("dark")).is_equal_to(Appearance.DARK)


# --- TokenNamespace ---


def test_token_namespace_creates_from_dict() -> None:
    """Can create from dictionary."""
    ns = TokenNamespace({"key": "value"})
    assert_that(ns.key).is_equal_to("value")


def test_token_namespace_nested_dicts_become_namespaces() -> None:
    """Nested dicts should become TokenNamespace."""
    ns = TokenNamespace({"outer": {"inner": "value"}})
    assert_that(ns.outer).is_instance_of(TokenNamespace)
    assert_that(ns.outer.inner).is_equal_to("value")


def test_token_namespace_missing_attr_returns_none() -> None:
    """Missing attributes should return None."""
    ns = TokenNamespace({"key": "value"})
    assert_that(ns.nonexistent).is_none()


def test_token_namespace_repr() -> None:
    """Should have a useful repr."""
    ns = TokenNamespace({"key": "value"})
    assert_that(repr(ns)).contains("TokenNamespace")


def test_token_namespace_to_dict() -> None:
    """Should convert back to dictionary."""
    data = {"key": "value", "nested": {"inner": "data"}}
    ns = TokenNamespace(data)
    assert_that(ns.to_dict()).is_equal_to(data)


# --- Tokens ---


def test_tokens_from_dict() -> None:
    """Can create from dictionary."""
    data = {
        "background": {"base": "#000"},
        "text": {"primary": "#fff"},
    }
    tokens = Tokens.from_dict(data)
    assert_that(tokens.background.base).is_equal_to("#000")
    assert_that(tokens.text.primary).is_equal_to("#fff")


def test_tokens_to_dict() -> None:
    """Should convert back to dictionary."""
    data = {
        "background": {"base": "#000"},
        "text": {"primary": "#fff"},
    }
    tokens = Tokens.from_dict(data)
    assert_that(tokens.to_dict()).is_equal_to(data)


# --- ThemeValue ---


def test_theme_value_from_dict(theme_data: dict[str, Any]) -> None:
    """Can create from dictionary.

    Args:
        theme_data: Sample theme data fixture.
    """
    theme = ThemeValue.from_dict(theme_data)
    assert_that(theme.id).is_equal_to("test-theme")
    assert_that(theme.label).is_equal_to("Test Theme")
    assert_that(theme.vendor).is_equal_to("test")
    assert_that(theme.appearance).is_equal_to(Appearance.DARK)


def test_theme_value_from_dict_with_optional_fields(
    theme_data: dict[str, Any],
) -> None:
    """Should parse optional fields.

    Args:
        theme_data: Sample theme data fixture.
    """
    theme = ThemeValue.from_dict(theme_data)
    assert_that(theme.description).is_equal_to("A test theme")
    assert_that(theme.icon_url).is_equal_to("https://example.com/icon.png")


def test_theme_value_from_dict_without_optional_fields() -> None:
    """Should handle missing optional fields."""
    data = {
        "id": "test",
        "label": "Test",
        "vendor": "test",
        "appearance": "light",
        "tokens": {"background": {"base": "#fff"}},
    }
    theme = ThemeValue.from_dict(data)
    assert_that(theme.description).is_none()
    assert_that(theme.icon_url).is_none()


def test_theme_value_to_dict(theme_data: dict[str, Any]) -> None:
    """Should convert back to dictionary.

    Args:
        theme_data: Sample theme data fixture.
    """
    theme = ThemeValue.from_dict(theme_data)
    result = theme.to_dict()
    assert_that(result["id"]).is_equal_to("test-theme")
    assert_that(result["appearance"]).is_equal_to("dark")


# --- ByVendorValue ---


def test_by_vendor_value_from_dict() -> None:
    """Can create from dictionary."""
    data = {
        "name": "Test Vendor",
        "homepage": "https://example.com",
        "themes": ["theme-1", "theme-2"],
    }
    vendor = ByVendorValue.from_dict(data)
    assert_that(vendor.name).is_equal_to("Test Vendor")
    assert_that(vendor.homepage).is_equal_to("https://example.com")
    assert_that(vendor.themes).is_equal_to(["theme-1", "theme-2"])


# --- Meta ---


def test_meta_from_dict() -> None:
    """Can create from dictionary."""
    data = {
        "themeIds": ["theme-1", "theme-2"],
        "vendors": ["vendor-1"],
        "totalThemes": 2,
        "lightThemes": 1,
        "darkThemes": 1,
    }
    meta = Meta.from_dict(data)
    assert_that(meta.theme_ids).is_equal_to(["theme-1", "theme-2"])
    assert_that(meta.total_themes).is_equal_to(2)


def test_meta_from_dict_with_defaults() -> None:
    """Should use defaults for missing fields."""
    meta = Meta.from_dict({})
    assert_that(meta.theme_ids).is_equal_to([])
    assert_that(meta.total_themes).is_equal_to(0)


# --- TurboThemes ---


def test_turbo_themes_from_dict(
    full_turbo_themes_data: dict[str, Any],
) -> None:
    """Can create from dictionary.

    Args:
        full_turbo_themes_data: Full TurboThemes data fixture.
    """
    themes = TurboThemes.from_dict(full_turbo_themes_data)
    assert_that(themes.themes).contains("test-theme")
    assert_that(themes.schema).is_equal_to("https://example.com/schema.json")


def test_turbo_themes_parses_themes(
    full_turbo_themes_data: dict[str, Any],
) -> None:
    """Should parse theme values.

    Args:
        full_turbo_themes_data: Full TurboThemes data fixture.
    """
    themes = TurboThemes.from_dict(full_turbo_themes_data)
    theme = themes.themes["test-theme"]
    assert_that(theme).is_instance_of(ThemeValue)
    assert_that(theme.id).is_equal_to("test-theme")


def test_turbo_themes_parses_by_vendor(
    full_turbo_themes_data: dict[str, Any],
) -> None:
    """Should parse vendor information.

    Args:
        full_turbo_themes_data: Full TurboThemes data fixture.
    """
    themes = TurboThemes.from_dict(full_turbo_themes_data)
    assert_that(themes.by_vendor).is_not_none()
    assert_that(themes.by_vendor).contains("test")


def test_turbo_themes_parses_meta(
    full_turbo_themes_data: dict[str, Any],
) -> None:
    """Should parse metadata.

    Args:
        full_turbo_themes_data: Full TurboThemes data fixture.
    """
    themes = TurboThemes.from_dict(full_turbo_themes_data)
    assert_that(themes.meta).is_not_none()
    assert themes.meta is not None  # type narrowing for mypy
    assert_that(themes.meta.total_themes).is_equal_to(1)


def test_turbo_themes_parses_generated_field(
    full_turbo_themes_data: dict[str, Any],
) -> None:
    """Should parse generated content hash (SHA-256 of JSON content).

    Args:
        full_turbo_themes_data: Full TurboThemes data fixture.
    """
    themes = TurboThemes.from_dict(full_turbo_themes_data)
    assert_that(themes.generated).is_not_none()
    assert_that(themes.generated).is_instance_of(str)


def test_turbo_themes_handles_missing_optional_fields() -> None:
    """Should handle missing optional fields."""
    data = {
        "themes": {
            "test": {
                "id": "test",
                "label": "Test",
                "vendor": "test",
                "appearance": "dark",
                "tokens": {},
            }
        }
    }
    themes = TurboThemes.from_dict(data)
    assert_that(themes.by_vendor).is_none()
    assert_that(themes.meta).is_none()


# --- turbo_themes_from_dict ---


def test_turbo_themes_from_dict_creates_turbo_themes() -> None:
    """Should create TurboThemes instance."""
    data = {
        "themes": {
            "test": {
                "id": "test",
                "label": "Test",
                "vendor": "test",
                "appearance": "light",
                "tokens": {},
            }
        }
    }
    result = turbo_themes_from_dict(data)
    assert_that(result).is_instance_of(TurboThemes)
