#!/usr/bin/env bash
# Check that the Dockerfile has exactly one bun source in the required form.
# Usage: check-bun-version-sync.sh [repo-root]
#
# The root package.json "packageManager" field (bun@X.Y.Z) is the single
# source of truth for the bun version used in CI. The Dockerfile must install
# bun with exactly one unquoted line of this form:
#
#   COPY --from=oven/bun:<semver>[-<variant>]@sha256:<64 hex>
#
# with <semver> equal to packageManager. Renovate groups both bumps into one
# PR.
#
# This is a contract, not a Dockerfile parser. An earlier check tried to
# understand stages, continuations, BuildKit heredocs and fd-prefixed
# heredocs. After four review rounds an independent review still found
# bypasses: quoted --from, registry prefixes (ghcr.io, mirror.gcr.io),
# RUN --mount from=, and FROM "oven/bun:<tag>" AS bun used via COPY --from=bun.
# The check now requires the one allowed line and fails on any other
# oven/bun or /bun: mention.
#
# Rules:
# - Exactly one line matching the allowed form above.
# - The remainder of that line is still scanned: a second oven/bun or /bun:
#   token, or a --from= / --mount from= operand with $, fails.
# - Any other non-comment line containing oven/bun or /bun: (case
#   insensitive, any registry prefix, quoted or not) fails. That includes
#   FROM, ADD, RUN --mount, ARG and ENV.
# - Comment lines (optional leading whitespace, then #) are ignored.
#   Inline comments are not stripped.
# - FROM / COPY --from= / ADD --from= / --mount from= operands that contain
#   $ fail closed (the image cannot be checked statically).
# - No heredoc, stage, or continuation parsing: each physical line is
#   inspected on its own.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="${1:-$(cd "$SCRIPT_DIR/../.." && pwd)}"

PACKAGE_JSON="$ROOT_DIR/package.json"
DOCKERFILE="$ROOT_DIR/Dockerfile"

ALLOWED_FORM='COPY --from=oven/bun:<semver>[-<variant>]@sha256:<64 hex>'
# Unquoted COPY --from=oven/bun:<semver>[-variant]@sha256:<64 hex><space>
ALLOWED_RE='^COPY --from=oven/bun:([0-9]+\.[0-9]+\.[0-9]+)(-[A-Za-z0-9._-]+)?@sha256:[0-9a-f]{64} '

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

errors=0
sources=0

fail() {
  echo "❌ $1"
  errors=$((errors + 1))
}

allowed_hint() {
  echo "   The only allowed bun source is exactly one unquoted line:"
  echo "   $ALLOWED_FORM"
  echo "   with <semver> equal to package.json packageManager bun@<semver>."
}

is_comment_line() {
  local trimmed="${1#"${1%%[![:space:]]*}"}"
  [[ "$trimmed" == \#* ]]
}

has_bun_image_token() {
  local lower
  lower=$(printf '%s' "$1" | tr '[:upper:]' '[:lower:]')
  [[ "$lower" == *'oven/bun'* || "$lower" == *'/bun:'* ]]
}

# Fail closed when a FROM / --from= / --mount from= operand uses $.
# Token walk of this physical line only: no continuations or stages.
check_variable_operands() {
  local line="$1" lineno="$2"
  local -a tokens opts
  local token rest opt opt_lc image i kw

  read -r -a tokens <<<"$line" || true
  [[ ${#tokens[@]} -gt 0 ]] || return 0

  kw=$(printf '%s' "${tokens[0]}" | tr '[:upper:]' '[:lower:]')
  if [[ "$kw" == from ]]; then
    i=1
    while ((i < ${#tokens[@]})) && [[ "${tokens[$i]}" == --* ]]; do
      i=$((i + 1))
    done
    image="${tokens[$i]:-}"
    if [[ "$image" == *'$'* ]]; then
      fail "Line $lineno: FROM operand uses variable expansion: $image"
      allowed_hint
    fi
  fi

  for token in "${tokens[@]}"; do
    if [[ "$token" == --from=* && "${token#--from=}" == *'$'* ]]; then
      fail "Line $lineno: COPY/ADD --from= operand uses variable expansion: ${token#--from=}"
      allowed_hint
    fi
    if [[ "$token" == --mount=* ]]; then
      rest="${token#--mount=}"
      local IFS=','
      read -r -a opts <<<"$rest" || true
      for opt in "${opts[@]+"${opts[@]}"}"; do
        opt_lc=$(printf '%s' "$opt" | tr '[:upper:]' '[:lower:]')
        if [[ "$opt_lc" == from=* && "$opt" == *'$'* ]]; then
          fail "Line $lineno: --mount from= operand uses variable expansion: ${opt#*=}"
          allowed_hint
        fi
      done
    fi
  done
}

echo "🔍 Checking bun version sync"
echo "  package.json packageManager: bun@$expected"

lineno=0
while IFS= read -r line || [[ -n "$line" ]]; do
  lineno=$((lineno + 1))
  line="${line%$'\r'}"
  [[ -n "$line" ]] || continue
  if is_comment_line "$line"; then
    continue
  fi

  if [[ "$line" =~ $ALLOWED_RE ]]; then
    sources=$((sources + 1))
    docker_version="${BASH_REMATCH[1]}"
    echo "  - line $lineno: oven/bun:$docker_version"
    if [[ "$docker_version" != "$expected" ]]; then
      fail "Bun version mismatch: Dockerfile uses $docker_version, package.json pins $expected"
      echo "   Update the oven/bun tag and digest in Dockerfile to match packageManager."
      allowed_hint
    fi
    rest=$(sed -E 's/^COPY --from=oven\/bun:[0-9]+\.[0-9]+\.[0-9]+(-[A-Za-z0-9._-]+)?@sha256:[0-9a-f]{64}//' <<<"$line")
    if has_bun_image_token "$rest"; then
      fail "Line $lineno: disallowed extra bun image reference on the allowed COPY line: $line"
      allowed_hint
    fi
    check_variable_operands "$line" "$lineno"
    continue
  fi

  if has_bun_image_token "$line"; then
    if [[ "$line" == *'COPY --from=oven/bun:'* && "$line" != *'@sha256:'* ]]; then
      fail "Line $lineno: Dockerfile oven/bun image must be pinned by digest (@sha256:...): $line"
    else
      fail "Line $lineno: disallowed bun image reference: $line"
    fi
    allowed_hint
  fi

  check_variable_operands "$line" "$lineno"
done <"$DOCKERFILE"

echo "  Dockerfile bun sources: $sources"

if ((sources == 0)); then
  fail "Dockerfile must contain exactly one bun source. Found none."
  allowed_hint
elif ((sources > 1)); then
  fail "Dockerfile must contain exactly one bun source. Found $sources."
  allowed_hint
fi

if ((errors > 0)); then
  echo "❌ $errors bun source contract error(s) in $DOCKERFILE"
  exit 1
fi

echo "✅ Dockerfile bun source matches packageManager bun@$expected"
