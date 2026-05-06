#!/usr/bin/env bash
# Verify the theme generation pipeline is deterministic.
#
# The workflow runs `bun run build` before this script, which executes the
# full token build pipeline (prepare-style-dictionary -> style-dictionary ->
# copy to platform tokens.json). Rebuilding from committed inputs MUST
# produce no diff; any drift here is a real non-determinism bug in the
# generators.
#
# Note: this script intentionally does NOT run `theme:sync`. Upstream
# package freshness is a separate concern and is handled by the Renovate
# companion workflow (.github/workflows/maintenance-renovate-theme-sync.yml),
# which regenerates the *.synced.ts files when Renovate bumps the source
# packages. Mixing the two checks made this job fail on every upstream
# release regardless of PR content.
#
# Usage: theme-sync-determinism-check.sh

set -euo pipefail

STATUS_OUTPUT=$(git status --porcelain || true)

if [[ -n "$STATUS_OUTPUT" ]]; then
  echo 'Non-deterministic theme generation detected:'
  git status --porcelain
  git --no-pager diff | cat
  exit 1
fi
