#!/usr/bin/env bash
# Build the Astro docs site for GitHub Pages deployment.
# Usage: bash scripts/ci/build-pages-site.sh
#
# Produces apps/site/dist with ASTRO_BASE=/turbo-themes/.
# Report bundling is handled separately by lgtm-ci Model B.

set -euo pipefail

repo_root="$(git rev-parse --show-toplevel)" || {
  echo "error: not inside a git repository (git rev-parse --show-toplevel failed)" >&2
  exit 1
}
cd "${repo_root}"

echo "Building TypeScript packages..."
bun run build

echo "Building JavaScript packages..."
bun run build:js

echo "Building CSS themes..."
bun run build:themes

echo "Generating API reference..."
bun run docs:api

echo "Building Astro site for GitHub Pages..."
ASTRO_BASE=/turbo-themes/ ASTRO_TELEMETRY_DISABLED=1 bun run build:ci:site

echo "Pages site build complete (apps/site/dist)"
