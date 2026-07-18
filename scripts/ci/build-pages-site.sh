#!/usr/bin/env bash
# Build the Astro docs site for GitHub Pages deployment.
# Usage: bash scripts/ci/build-pages-site.sh
#
# Produces apps/site/dist with ASTRO_BASE=/turbo-themes/.
# Report bundling is handled separately by lgtm-ci Model B.

set -euo pipefail

cd "$(git rev-parse --show-toplevel 2>/dev/null || echo ".")"

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
