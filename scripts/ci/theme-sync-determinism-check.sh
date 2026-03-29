#!/usr/bin/env bash
# Run theme sync determinism check
# Usage: theme-sync-determinism-check.sh

set -euo pipefail

# Detect package manager (prefer bun, fall back to npm)
if command -v bun >/dev/null 2>&1; then
  PKG_RUN="bun run"
elif command -v npm >/dev/null 2>&1; then
  PKG_RUN="npm run"
else
  echo "❌ No package manager found!"
  exit 1
fi

$PKG_RUN theme:sync

# Check for changes — $generated is now a deterministic SHA-256 content hash of the generated JSON,
# so any diff here represents a real non-deterministic change.
STATUS_OUTPUT=$(git status --porcelain || true)

if [[ -n "$STATUS_OUTPUT" ]]; then
  echo 'Non-deterministic theme sync detected:'
  git status --porcelain
  git --no-pager diff | cat
  exit 1
fi
