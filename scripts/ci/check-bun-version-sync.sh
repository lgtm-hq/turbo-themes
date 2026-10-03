#!/usr/bin/env bash
# Check that the Dockerfile bun image matches the packageManager pin
# Usage: check-bun-version-sync.sh [repo-root]
#
# The root package.json "packageManager" field (bun@X.Y.Z) is the single
# source of truth for the bun version used in CI. The Dockerfile installs bun
# by copying it from oven/bun:<version>@sha256:<digest>. Renovate groups both
# bumps into one PR; this check fails if they ever drift apart or if any
# Dockerfile oven/bun reference is not pinned by digest.

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

# Print the Dockerfile as logical instructions: comment lines (including
# parser directives) are dropped, CRLF and leading whitespace are tolerated,
# and backslash continuations are joined so a reference split across lines is
# still seen.
logical_lines() {
  awk '
    { sub(/\r$/, "") }
    /^[[:space:]]*#/ { next }
    {
      line = $0
      if (line ~ /\\[[:space:]]*$/) {
        sub(/\\[[:space:]]*$/, "", line)
        buf = buf line " "
        next
      }
      print buf line
      buf = ""
    }
    END { if (buf != "") print buf }
  ' "$1"
}

# Collect every oven/bun reference from active instructions (FROM stages,
# COPY --from=, anything else) so a stray comment or an earlier stage cannot
# mask a mismatched one.
refs=()
while IFS= read -r line; do
  read -r -a tokens <<<"$line" || true
  for token in "${tokens[@]+"${tokens[@]}"}"; do
    token="${token#--from=}"
    token="${token//[\"\',\[\]]/}"
    [[ "$token" == *oven/bun* ]] || continue
    refs+=("${token#docker.io/}")
  done
done < <(logical_lines "$DOCKERFILE")

if [[ ${#refs[@]} -eq 0 ]]; then
  echo "❌ Error: no oven/bun image reference found in $DOCKERFILE"
  exit 1
fi

echo "🔍 Checking bun version sync"
echo "  package.json packageManager: bun@$expected"
echo "  Dockerfile oven/bun references: ${#refs[@]}"

# Expected form: oven/bun:<semver>[-variant]@sha256:<64 hex>
# e.g. oven/bun:1.4.2-debian@sha256:4f6e...
image_re='^oven/bun:([0-9]+\.[0-9]+\.[0-9]+)(-[A-Za-z0-9._-]+)?@sha256:[0-9a-f]{64}$'
errors=0
for image_ref in "${refs[@]}"; do
  echo "  - $image_ref"
  if [[ "$image_ref" != *"@sha256:"* ]]; then
    echo "❌ Dockerfile oven/bun image must be pinned by digest (@sha256:...): $image_ref"
    errors=$((errors + 1))
    continue
  fi
  if [[ ! "$image_ref" =~ $image_re ]]; then
    echo "❌ Unrecognised Dockerfile oven/bun reference: $image_ref"
    echo "   Expected oven/bun:<semver>[-variant]@sha256:<digest>," \
      "e.g. oven/bun:1.4.2-debian@sha256:<64 hex chars>."
    errors=$((errors + 1))
    continue
  fi
  docker_version="${BASH_REMATCH[1]}"
  if [[ "$docker_version" != "$expected" ]]; then
    echo "❌ Bun version mismatch: Dockerfile uses $docker_version, package.json pins $expected"
    echo "   Update the oven/bun tag and digest in Dockerfile to match packageManager."
    errors=$((errors + 1))
  fi
done

if [[ $errors -gt 0 ]]; then
  echo "❌ $errors invalid oven/bun reference(s) in $DOCKERFILE"
  exit 1
fi

echo "✅ All Dockerfile oven/bun references (${#refs[@]}) match packageManager bun@$expected"
