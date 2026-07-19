#!/usr/bin/env bash
# Verify the theme generation pipeline is deterministic.
#
# The workflow runs `bun run build` before this script, which executes the
# full token build pipeline (prepare-style-dictionary -> style-dictionary ->
# copy to platform tokens.json). Rebuilding from committed inputs MUST
# produce no diff; any drift here is a real non-determinism bug in the
# generators.
#
# Note: `bun run build` includes `theme:sync`, so the *.synced.ts files are
# part of the determinism surface: regenerating from the lockfile-pinned
# upstream packages must reproduce the committed files byte-for-byte (issue
# #651 was formatting drift here). Upstream package freshness is a separate
# concern handled by the Renovate companion workflow
# (.github/workflows/maintenance-renovate-theme-sync.yml), which regenerates
# the *.synced.ts files when Renovate bumps the source packages.
#
# Usage: theme-sync-determinism-check.sh

set -euo pipefail

if ! STATUS_OUTPUT=$(git status --porcelain); then
  echo "git status failed" >&2
  exit 1
fi

if [[ -n "$STATUS_OUTPUT" ]]; then
  echo 'Non-deterministic theme generation detected:'
  git status --porcelain
  git --no-pager diff | cat
  exit 1
fi
