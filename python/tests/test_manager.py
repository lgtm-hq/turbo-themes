"""Tests for theme manager."""

import json

import pytest
from assertpy import assert_that

from turbo_themes.manager import (
    ThemeManager,
    get_theme_manager,
    reset_theme_manager,
    set_theme,
    get_current_theme,
    cycle_theme,
)


def test_theme_manager_init() -> None:
    """ThemeManager should default to catppuccin-mocha."""
    manager = ThemeManager()
    assert_that(manager.current_theme_id).is_equal_to("catppuccin-mocha")
    assert_that(manager.current_theme.id).is_equal_to("catppuccin-mocha")


def test_theme_manager_custom_default() -> None:
    """ThemeManager should accept a custom default theme."""
    manager = ThemeManager("github-light")
    assert_that(manager.current_theme_id).is_equal_to("github-light")
    assert_that(manager.current_theme.appearance).is_equal_to("light")


def test_theme_manager_invalid_default() -> None:
    """ThemeManager should raise ValueError for invalid default theme."""
    with pytest.raises(ValueError, match="not found"):
        ThemeManager("nonexistent-theme")


def test_set_theme() -> None:
    """Setting themes should update the current theme."""
    manager = ThemeManager("catppuccin-mocha")

    manager.set_theme("github-light")
    assert_that(manager.current_theme_id).is_equal_to("github-light")
    assert_that(manager.current_theme.appearance).is_equal_to("light")

    manager.set_theme("dracula")
    assert_that(manager.current_theme_id).is_equal_to("dracula")
    assert_that(manager.current_theme.appearance).is_equal_to("dark")


def test_set_invalid_theme() -> None:
    """Setting an invalid theme should raise ValueError."""
    manager = ThemeManager()

    with pytest.raises(ValueError, match="not found"):
        manager.set_theme("nonexistent-theme")


def test_get_theme() -> None:
    """Getting a specific theme should return it or None."""
    manager = ThemeManager()

    theme = manager.get_theme("catppuccin-latte")
    assert_that(theme).is_not_none()
    assert theme is not None  # type narrowing for mypy
    assert_that(theme.id).is_equal_to("catppuccin-latte")
    assert_that(theme.appearance).is_equal_to("light")

    theme = manager.get_theme("nonexistent")
    assert_that(theme).is_none()


def test_get_themes_by_appearance() -> None:
    """Filtering themes by appearance should return matching themes."""
    manager = ThemeManager()

    light_themes = manager.get_themes_by_appearance("light")
    assert_that(light_themes).is_instance_of(dict)
    assert_that(len(light_themes)).is_greater_than(0)
    for theme in light_themes.values():
        assert_that(theme.appearance).is_equal_to("light")

    dark_themes = manager.get_themes_by_appearance("dark")
    assert_that(dark_themes).is_instance_of(dict)
    assert_that(len(dark_themes)).is_greater_than(0)
    for theme in dark_themes.values():
        assert_that(theme.appearance).is_equal_to("dark")


def test_get_themes_by_vendor() -> None:
    """Filtering themes by vendor should return matching themes."""
    manager = ThemeManager()

    catppuccin_themes = manager.get_themes_by_vendor("catppuccin")
    assert_that(catppuccin_themes).is_instance_of(dict)
    assert_that(len(catppuccin_themes)).is_greater_than(0)
    for theme in catppuccin_themes.values():
        assert_that(theme.vendor).is_equal_to("catppuccin")


def test_cycle_theme() -> None:
    """Cycling should advance to the next theme."""
    manager = ThemeManager("catppuccin-mocha")

    # Cycle through all themes
    original = manager.current_theme_id
    manager.cycle_theme()
    assert_that(manager.current_theme_id).is_not_equal_to(original)

    # Cycle through light themes only
    manager.set_theme("github-light")
    original_light = manager.current_theme_id
    manager.cycle_theme("light")
    assert_that(manager.current_theme_id).is_not_equal_to(original_light)
    assert_that(manager.current_theme.appearance).is_equal_to("light")


def test_cycle_theme_empty() -> None:
    """Cycling with no matching themes should raise ValueError."""
    manager = ThemeManager()

    with pytest.raises(ValueError, match="No themes found"):
        manager.cycle_theme("nonexistent-appearance")


def test_apply_theme_css_variables() -> None:
    """CSS variable generation should produce expected variables."""
    manager = ThemeManager("catppuccin-mocha")

    variables = manager.apply_theme_to_css_variables()
    assert_that(variables).is_instance_of(dict)
    assert_that(len(variables)).is_greater_than(0)

    # Check some expected variables
    assert_that(variables).contains_key("--turbo-bg-base")
    assert_that(variables).contains_key("--turbo-text-primary")
    assert_that(variables).contains_key("--turbo-brand-primary")
    assert_that(variables).contains_key("--turbo-state-success")

    # Check values are strings
    for key, value in variables.items():
        assert_that(value).is_instance_of(str)
        assert_that(key).starts_with("--turbo-")


def test_export_theme_json() -> None:
    """JSON export should produce valid theme data."""
    manager = ThemeManager("catppuccin-mocha")

    # Export single theme
    json_str = manager.export_theme_json("catppuccin-latte")
    data = json.loads(json_str)
    assert_that(data).contains("catppuccin-latte")
    assert_that(data["catppuccin-latte"]["id"]).is_equal_to("catppuccin-latte")

    # Export all themes
    json_str = manager.export_theme_json()
    data = json.loads(json_str)
    assert_that(len(data)).is_greater_than(1)
    assert_that(data).contains("catppuccin-mocha")


def test_export_invalid_theme() -> None:
    """Exporting an invalid theme should raise ValueError."""
    manager = ThemeManager()

    with pytest.raises(ValueError, match="not found"):
        manager.export_theme_json("nonexistent")


def test_global_functions() -> None:
    """Global convenience functions should manage theme state."""
    # Reset to default
    set_theme("catppuccin-mocha")
    assert_that(get_current_theme().id).is_equal_to("catppuccin-mocha")

    # Change theme
    set_theme("github-light")
    assert_that(get_current_theme().id).is_equal_to("github-light")

    # Cycle theme
    original = get_current_theme().id
    new_theme = cycle_theme()
    assert_that(new_theme).is_not_equal_to(original)
    assert_that(get_current_theme().id).is_equal_to(new_theme)


def test_get_theme_manager() -> None:
    """Getting the global theme manager should return a ThemeManager."""
    reset_theme_manager()  # Ensure clean state
    manager = get_theme_manager()
    assert_that(manager).is_instance_of(ThemeManager)
    assert_that(manager.current_theme_id).is_equal_to("catppuccin-mocha")


def test_get_theme_manager_preserves_state() -> None:
    """The global theme manager should preserve theme state between calls."""
    reset_theme_manager()  # Start clean
    set_theme("github-light")
    # get_theme_manager should preserve the changed state
    manager = get_theme_manager()
    assert_that(manager.current_theme_id).is_equal_to("github-light")
    reset_theme_manager()  # Clean up


def test_reset_theme_manager() -> None:
    """Resetting the theme manager should restore default state."""
    set_theme("dracula")
    reset_theme_manager()
    manager = get_theme_manager()
    assert_that(manager.current_theme_id).is_equal_to("catppuccin-mocha")


def test_current_theme_property() -> None:
    """The current_theme property should return ThemeInfo."""
    manager = ThemeManager()
    theme = manager.current_theme
    assert_that(theme.id).is_equal_to("catppuccin-mocha")


def test_theme_info_tokens_access() -> None:
    """Accessing tokens through ThemeInfo should return non-empty values."""
    manager = ThemeManager()
    theme = manager.current_theme
    assert_that(theme.tokens.background.base).is_not_empty()
    assert_that(theme.tokens.text.primary).is_not_empty()


def test_themes_by_vendor_empty() -> None:
    """Filtering by non-existent vendor should return empty dict."""
    manager = ThemeManager()
    themes = manager.get_themes_by_vendor("nonexistent-vendor")
    assert_that(themes).is_empty()


def test_themes_by_appearance_empty() -> None:
    """Filtering by non-existent appearance should return empty dict."""
    manager = ThemeManager()
    themes = manager.get_themes_by_appearance("nonexistent-appearance")
    assert_that(themes).is_empty()
