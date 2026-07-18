#!/usr/bin/env bash
# SPDX-License-Identifier: MIT
# Purpose: Regenerate every committed generated artifact through the
# lockfile-pinned toolchain. Single code path shared by the release
# version-PR flow (fresh artifacts in the signed bump commit) and the
# CI drift gate (check-generated-drift.sh).
#
# Intentionally does NOT run `theme:sync`: upstream package freshness is
# handled by the Renovate companion workflow (see
# scripts/ci/theme-sync-determinism-check.sh for the rationale).
#
# Usage: ./scripts/ci/regenerate-release-artifacts.sh

set -euo pipefail

bun run build:tokens
bun run build:packages
bun run build:root
node scripts/copy-adapters.mjs
bun run generate:css
bun run generate:types
bun run build:js:dev
bun run build:js:prod
