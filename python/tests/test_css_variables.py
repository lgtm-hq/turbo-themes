# SPDX-License-Identifier: MIT
"""Tests for CSS variable generation utilities."""

from dataclasses import replace

from assertpy import assert_that

from turbo_themes.css_variables import (
    apply_core_mappings,
    apply_optional_spacing,
    apply_optional_elevation,
    apply_optional_animation,
    apply_optional_opacity,
    generate_css_variables,
)
from turbo_themes.themes import get_theme
from turbo_themes.mapping_config import get_mapping_config

# --- apply_core_mappings ---


def test_apply_core_mappings_returns_dict() -> None:
    """Core mappings should return a dictionary."""
    theme = get_theme("catppuccin-mocha")
    assert_that(theme).is_not_none()
    assert theme is not None  # type narrowing for mypy
    result = apply_core_mappings(theme.tokens)
    assert_that(result).is_instance_of(dict)


def test_apply_core_mappings_contains_expected_variables() -> None:
    """Should contain expected CSS variables."""
    theme = get_theme("catppuccin-mocha")
    assert_that(theme).is_not_none()
    assert theme is not None  # type narrowing for mypy
    result = apply_core_mappings(theme.tokens)
    assert_that(result).contains_key("--turbo-bg-base")
    assert_that(result).contains_key("--turbo-text-primary")
    assert_that(result).contains_key("--turbo-brand-primary")


def test_apply_core_mappings_uses_prefix_from_config() -> None:
    """Variables should use the configured prefix."""
    theme = get_theme("catppuccin-mocha")
    assert_that(theme).is_not_none()
    assert theme is not None  # type narrowing for mypy
    result = apply_core_mappings(theme.tokens)
    # All keys should start with --turbo-
    for key in result:
        assert_that(key).starts_with("--turbo-")


def test_apply_core_mappings_with_custom_config() -> None:
    """Should use custom config when provided."""
    theme = get_theme("catppuccin-mocha")
    assert_that(theme).is_not_none()
    assert theme is not None  # type narrowing for mypy
    config = replace(get_mapping_config(), prefix="custom")
    result = apply_core_mappings(theme.tokens, config)
    assert_that(result).is_not_empty()
    for key in result:
        assert_that(key).starts_with("--custom-")


# --- apply_optional_spacing ---


def test_apply_optional_spacing_returns_empty_when_no_spacing() -> None:
    """Should return empty dict when theme has no spacing tokens."""
    theme = get_theme("catppuccin-mocha")
    assert_that(theme).is_not_none()
    assert theme is not None  # type narrowing for mypy
    result = apply_optional_spacing(theme.tokens)
    # catppuccin-mocha doesn't have spacing tokens
    assert_that(result).is_equal_to({})


def test_apply_optional_spacing_returns_spacing_vars_when_available() -> None:
    """Should return spacing variables for themes that have them.

    Note: Currently no themes have spacing tokens, so this test
    verifies the function handles empty spacing gracefully.
    When a theme with spacing is added, update this test.
    """
    theme = get_theme("dracula")
    assert_that(theme).is_not_none()
    assert theme is not None  # type narrowing for mypy
    result = apply_optional_spacing(theme.tokens)
    # Verify function returns dict (empty or populated)
    assert_that(result).is_instance_of(dict)
    # Explicit assertion: if theme has spacing, result should have spacing vars
    if theme.tokens.spacing:
        assert_that(result).is_not_empty()
        assert_that(any("spacing" in key for key in result)).is_true()
    else:
        # Explicit assertion for when theme has no spacing
        assert_that(result).is_equal_to({})


# --- apply_optional_elevation ---


def test_apply_optional_elevation_returns_empty_when_no_elevation() -> None:
    """Should return empty dict when theme has no elevation tokens."""
    theme = get_theme("catppuccin-mocha")
    assert_that(theme).is_not_none()
    assert theme is not None  # type narrowing for mypy
    result = apply_optional_elevation(theme.tokens)
    assert_that(result).is_equal_to({})


def test_apply_optional_elevation_returns_elevation_vars_when_available() -> None:
    """Should return elevation variables for themes that have them.

    Note: Currently no themes have elevation tokens, so this test
    verifies the function handles empty elevation gracefully.
    """
    theme = get_theme("dracula")
    assert_that(theme).is_not_none()
    assert theme is not None  # type narrowing for mypy
    result = apply_optional_elevation(theme.tokens)
    assert_that(result).is_instance_of(dict)
    if theme.tokens.elevation:
        assert_that(result).is_not_empty()
    else:
        assert_that(result).is_equal_to({})


# --- apply_optional_animation ---


def test_apply_optional_animation_returns_empty_when_no_animation() -> None:
    """Should return empty dict when theme has no animation tokens."""
    theme = get_theme("catppuccin-mocha")
    assert_that(theme).is_not_none()
    assert theme is not None  # type narrowing for mypy
    result = apply_optional_animation(theme.tokens)
    assert_that(result).is_equal_to({})


def test_apply_optional_animation_returns_animation_vars_when_available() -> None:
    """Should return animation variables for themes that have them.

    Note: Currently no themes have animation tokens, so this test
    verifies the function handles empty animation gracefully.
    """
    theme = get_theme("dracula")
    assert_that(theme).is_not_none()
    assert theme is not None  # type narrowing for mypy
    result = apply_optional_animation(theme.tokens)
    assert_that(result).is_instance_of(dict)
    if theme.tokens.animation:
        assert_that(result).is_not_empty()
    else:
        assert_that(result).is_equal_to({})


# --- apply_optional_opacity ---


def test_apply_optional_opacity_returns_empty_when_no_opacity() -> None:
    """Should return empty dict when theme has no opacity tokens."""
    theme = get_theme("catppuccin-mocha")
    assert_that(theme).is_not_none()
    assert theme is not None  # type narrowing for mypy
    result = apply_optional_opacity(theme.tokens)
    assert_that(result).is_equal_to({})


def test_apply_optional_opacity_returns_opacity_vars_when_available() -> None:
    """Should return opacity variables for themes that have them.

    Note: Currently no themes have opacity tokens, so this test
    verifies the function handles empty opacity gracefully.
    """
    theme = get_theme("dracula")
    assert_that(theme).is_not_none()
    assert theme is not None  # type narrowing for mypy
    result = apply_optional_opacity(theme.tokens)
    assert_that(result).is_instance_of(dict)
    if theme.tokens.opacity:
        assert_that(result).is_not_empty()
    else:
        assert_that(result).is_equal_to({})


# --- generate_css_variables ---


def test_generate_css_variables_returns_dict() -> None:
    """Should return a dictionary of CSS variables."""
    theme = get_theme("catppuccin-mocha")
    assert_that(theme).is_not_none()
    assert theme is not None  # type narrowing for mypy
    result = generate_css_variables(theme.tokens)
    assert_that(result).is_instance_of(dict)


def test_generate_css_variables_includes_core_mappings() -> None:
    """Should include core CSS variables."""
    theme = get_theme("catppuccin-mocha")
    assert_that(theme).is_not_none()
    assert theme is not None  # type narrowing for mypy
    result = generate_css_variables(theme.tokens)
    assert_that(result).contains_key("--turbo-bg-base")
    assert_that(result).contains_key("--turbo-text-primary")


def test_generate_css_variables_includes_optional_when_available() -> None:
    """Should include optional variables when theme has them.

    This test verifies that optional token groups are included in
    the generated CSS variables when present in the theme.
    """
    theme = get_theme("dracula")
    assert_that(theme).is_not_none()
    assert theme is not None  # type narrowing for mypy
    result = generate_css_variables(theme.tokens)
    # Should at least have core variables
    assert_that(result).is_not_empty()
    # Explicit assertions for optional token inclusion
    if theme.tokens.spacing:
        assert_that(any("spacing" in key for key in result)).is_true()
    if theme.tokens.elevation:
        assert_that(any("elevation" in key for key in result)).is_true()
    if theme.tokens.animation:
        assert_that(any("animation" in key for key in result)).is_true()
    if theme.tokens.opacity:
        assert_that(any("opacity" in key for key in result)).is_true()


def test_generate_css_variables_all_themes_without_error() -> None:
    """All themes should generate CSS variables without errors."""
    from turbo_themes.themes import get_all_themes

    for theme_id, theme in get_all_themes().items():
        result = generate_css_variables(theme.tokens)
        assert_that(result).is_instance_of(dict)
        assert_that(result).is_not_empty()
