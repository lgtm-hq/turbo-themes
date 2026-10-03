#!/usr/bin/env bash
# Check that the Dockerfile bun image matches the packageManager pin
# Usage: check-bun-version-sync.sh [repo-root]
#
# The root package.json "packageManager" field (bun@X.Y.Z) is the single
# source of truth for the bun version used in CI. The Dockerfile installs bun
# by copying it from oven/bun:<version>@sha256:<digest>. Renovate groups both
# bumps into one PR; this check fails if they ever drift apart or if the
# Dockerfile image is not pinned by digest.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="${1:-$(cd "$SCRIPT_DIR/../.." && pwd)}"

PACKAGE_JSON="$ROOT_DIR/package.json"
DOCKERFILE="$ROOT_DIR/Dockerfile"

for file in "$PACKAGE_JSON" "$DOCKERFILE"; do
  if [[ ! -f "$file" ]]; then
    echo "❌ Error: $file not found"
    exit 1
  fi
done

expected=$(sed -n 's/.*"packageManager": *"bun@\([^"+]*\)[^"]*".*/\1/p' "$PACKAGE_JSON" | head -1)
if [[ -z "$expected" ]]; then
  echo "❌ Error: no \"packageManager\": \"bun@<version>\" in $PACKAGE_JSON"
  exit 1
fi

image_ref=$(grep -oE 'oven/bun:[^[:space:]]+' "$DOCKERFILE" | head -1 || true)
if [[ -z "$image_ref" ]]; then
  echo "❌ Error: no oven/bun image reference found in $DOCKERFILE"
  exit 1
fi

# oven/bun:1.4.2-debian@sha256:... -> 1.4.2
docker_version=$(sed -E 's#^oven/bun:([0-9]+\.[0-9]+\.[0-9]+).*#\1#' <<<"$image_ref")

echo "🔍 Checking bun version sync"
echo "  package.json packageManager: bun@$expected"
echo "  Dockerfile image:            $image_ref"

if [[ "$image_ref" != *"@sha256:"* ]]; then
  echo "❌ Dockerfile oven/bun image must be pinned by digest (@sha256:...)"
  exit 1
fi

if [[ "$docker_version" != "$expected" ]]; then
  echo "❌ Bun version mismatch: Dockerfile uses $docker_version, package.json pins $expected"
  echo "   Update the oven/bun tag and digest in Dockerfile to match packageManager."
  exit 1
fi

echo "✅ Dockerfile bun ($docker_version) matches packageManager"
