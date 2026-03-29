"""Shared pytest fixtures for turbo-themes tests."""

from typing import Any

import pytest
from pytest import FixtureRequest

from turbo_themes.manager import ThemeManager
from turbo_themes.themes import THEMES


@pytest.fixture
def manager() -> ThemeManager:
    """Create a ThemeManager for testing.

    Returns:
        A ThemeManager instance initialized with catppuccin-mocha theme.
    """
    return ThemeManager("catppuccin-mocha")


@pytest.fixture(params=list(THEMES.keys()))
def theme_id(request: FixtureRequest) -> str:
    """Parametrized fixture for all theme IDs.

    Args:
        request: Pytest request object providing access to the current parameter.

    Returns:
        A theme ID from the THEMES registry.
    """
    return str(request.param)


@pytest.fixture
def theme_data() -> dict[str, Any]:
    """Sample theme data for ThemeValue tests.

    Returns:
        Dict containing test theme data.
    """
    return {
        "id": "test-theme",
        "label": "Test Theme",
        "vendor": "test",
        "appearance": "dark",
        "tokens": {
            "background": {"base": "#000"},
            "text": {"primary": "#fff"},
        },
        "$description": "A test theme",
        "iconUrl": "https://example.com/icon.png",
    }


@pytest.fixture
def full_turbo_themes_data() -> dict[str, Any]:
    """Full TurboThemes data structure for testing.

    Returns:
        Dict containing complete TurboThemes test data.
    """
    return {
        "$schema": "https://example.com/schema.json",
        "$version": "1.0.0",
        "$description": "Test themes",
        "$generated": (
            "abc1234567890def1234567890abcdef1234567890abcdef1234567890abcdef12"
        ),
        "themes": {
            "test-theme": {
                "id": "test-theme",
                "label": "Test Theme",
                "vendor": "test",
                "appearance": "dark",
                "tokens": {"background": {"base": "#000"}},
            }
        },
        "byVendor": {
            "test": {
                "name": "Test Vendor",
                "homepage": "https://example.com",
                "themes": ["test-theme"],
            }
        },
        "meta": {
            "themeIds": ["test-theme"],
            "totalThemes": 1,
        },
    }
