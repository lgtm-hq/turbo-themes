#!/usr/bin/env bash
# Sync turbo-themes version files for the reusable release workflow.
set -euo pipefail

: "${NEXT_VERSION:?NEXT_VERSION is required}"

printf '%s\n' "$NEXT_VERSION" >VERSION
node scripts/sync-version.mjs
