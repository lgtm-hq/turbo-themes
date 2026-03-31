# SPDX-License-Identifier: MIT
"""Tests for token mapping configuration."""

from dataclasses import FrozenInstanceError

import pytest
from assertpy import assert_that

from turbo_themes.mapping_config import (
    CoreMapping,
    OptionalGroupConfig,
    MappingConfig,
    load_mapping_config,
    get_mapping_config,
    resolve_token_path,
    build_token_getter,
    get_core_mappings_as_tuples,
)
from turbo_themes.themes import get_theme

# --- CoreMapping ---


def test_core_mapping_create_without_fallback() -> None:
    """Can create mapping without fallback."""
    mapping = CoreMapping(
        css_var="bg-base",
        token_path="background.base",
    )
    assert_that(mapping.css_var).is_equal_to("bg-base")
    assert_that(mapping.token_path).is_equal_to("background.base")
    assert_that(mapping.fallback).is_none()


def test_core_mapping_create_with_fallback() -> None:
    """Can create mapping with fallback."""
    mapping = CoreMapping(
        css_var="table-cell-bg",
        token_path="content.table.cellBg",
        fallback="background.base",
    )
    assert_that(mapping.fallback).is_equal_to("background.base")


def test_core_mapping_is_frozen() -> None:
    """CoreMapping should be immutable."""
    mapping = CoreMapping(
        css_var="test",
        token_path="test.path",
    )
    with pytest.raises(FrozenInstanceError):
        mapping.css_var = "changed"


# --- OptionalGroupConfig ---


def test_optional_group_config_create_with_properties() -> None:
    """Can create config with properties."""
    config = OptionalGroupConfig(
        prefix="spacing",
        properties=("xs", "sm", "md", "lg", "xl"),
    )
    assert_that(config.prefix).is_equal_to("spacing")
    assert_that(config.properties).is_length(5)


def test_optional_group_config_create_with_mappings() -> None:
    """Can create config with mappings."""
    mapping = CoreMapping(
        css_var="duration-fast",
        token_path="animation.durationFast",
    )
    config = OptionalGroupConfig(
        prefix="animation",
        mappings=(mapping,),
    )
    assert_that(config.mappings).is_length(1)


# --- load_mapping_config ---


def test_load_mapping_config_loads_config() -> None:
    """Should load configuration from JSON file."""
    config = load_mapping_config()
    assert_that(config).is_instance_of(MappingConfig)
    assert_that(config.prefix).is_equal_to("turbo")


def test_load_mapping_config_has_core_mappings() -> None:
    """Config should have core mappings."""
    config = load_mapping_config()
    assert_that(config.core_mappings).is_not_empty()


def test_load_mapping_config_has_optional_groups() -> None:
    """Config should have optional groups."""
    config = load_mapping_config()
    assert_that(config.optional_groups).contains("spacing")
    assert_that(config.optional_groups).contains("elevation")


# --- get_mapping_config ---


def test_get_mapping_config_returns_cached_config() -> None:
    """Should return the same cached config on repeated calls."""
    config1 = get_mapping_config()
    config2 = get_mapping_config()
    assert_that(config1).is_same_as(config2)


def test_get_mapping_config_returns_mapping_config() -> None:
    """Should return a MappingConfig instance."""
    config = get_mapping_config()
    assert_that(config).is_instance_of(MappingConfig)


# --- resolve_token_path ---


def test_resolve_token_path_resolves_simple_path() -> None:
    """Should resolve a simple nested path."""
    theme = get_theme("catppuccin-mocha")
    assert_that(theme).is_not_none()
    assert theme is not None  # type narrowing for mypy
    value = resolve_token_path(theme.tokens, "background.base")
    assert_that(value).is_not_none()
    assert_that(value).is_instance_of(str)


def test_resolve_token_path_resolves_deep_path() -> None:
    """Should resolve a deeply nested path."""
    theme = get_theme("catppuccin-mocha")
    assert_that(theme).is_not_none()
    assert theme is not None  # type narrowing for mypy
    value = resolve_token_path(theme.tokens, "content.heading.h1")
    assert_that(value).is_not_none()


def test_resolve_token_path_returns_none_for_missing_path() -> None:
    """Should return None for non-existent paths."""
    theme = get_theme("catppuccin-mocha")
    assert_that(theme).is_not_none()
    assert theme is not None  # type narrowing for mypy
    value = resolve_token_path(theme.tokens, "nonexistent.path")
    assert_that(value).is_none()


def test_resolve_token_path_returns_none_for_partial_path() -> None:
    """Should return None when path is incomplete."""
    theme = get_theme("catppuccin-mocha")
    assert_that(theme).is_not_none()
    assert theme is not None  # type narrowing for mypy
    value = resolve_token_path(theme.tokens, "background.nonexistent")
    assert_that(value).is_none()


# --- build_token_getter ---


def test_build_token_getter_returns_callable() -> None:
    """Should return a callable."""
    getter = build_token_getter("background.base")
    assert_that(callable(getter)).is_true()


def test_build_token_getter_resolves_value() -> None:
    """Getter should resolve token values."""
    getter = build_token_getter("background.base")
    theme = get_theme("catppuccin-mocha")
    assert_that(theme).is_not_none()
    assert theme is not None  # type narrowing for mypy
    value = getter(theme.tokens)
    assert_that(value).is_not_none()


def test_build_token_getter_returns_none_for_missing() -> None:
    """Getter should return None for missing paths."""
    getter = build_token_getter("nonexistent.path")
    theme = get_theme("catppuccin-mocha")
    assert_that(theme).is_not_none()
    assert theme is not None  # type narrowing for mypy
    value = getter(theme.tokens)
    assert_that(value).is_none()


# --- get_core_mappings_as_tuples ---


def test_get_core_mappings_as_tuples_returns_list_of_tuples() -> None:
    """Should return a list of tuples."""
    mappings = get_core_mappings_as_tuples()
    assert_that(mappings).is_instance_of(list)
    assert_that(mappings).is_not_empty()
    assert_that(mappings[0]).is_instance_of(tuple)


def test_get_core_mappings_as_tuples_have_correct_structure() -> None:
    """Each tuple should have (css_var, getter) structure."""
    mappings = get_core_mappings_as_tuples()
    for css_var, getter in mappings:
        assert_that(css_var).is_instance_of(str)
        assert_that(callable(getter)).is_true()


def test_get_core_mappings_as_tuples_getters_work_with_tokens() -> None:
    """Getters from tuples should work with actual tokens."""
    mappings = get_core_mappings_as_tuples()
    theme = get_theme("catppuccin-mocha")
    assert_that(theme).is_not_none()
    assert theme is not None  # type narrowing for mypy

    # At least some getters should return values
    values = [getter(theme.tokens) for _, getter in mappings]
    non_none_values = [v for v in values if v is not None]
    assert_that(non_none_values).is_not_empty()
