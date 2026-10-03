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
# oven/bun mention.
#
# What this guard covers
# - Image drift: a second oven/bun (or other-namespace /bun:<tag>) pull via
#   FROM, COPY/ADD --from=, or RUN --mount from=, including quote/backslash
#   smuggling and backslash-continued FROM lines.
#
# What a line scan cannot cover
# - Deliberate non-image installs: ADD of release URLs, curl | sh, npm i -g
#   bun, or a bun image under another namespace with no :tag. Do not add
#   those; this script will not catch them.
#
# Rules:
# - Exactly one line matching the allowed form above.
# - The remainder of that line is still scanned: a second oven/bun token, or
#   a --from= / --mount from= operand that is empty or contains $ " ' \ or
#   backtick, fails.
# - Any other non-comment instruction containing oven/bun (case insensitive,
#   quotes/backslashes stripped, any registry prefix) fails.
# - FROM / COPY --from= / ADD --from= / --mount from= operands that are empty
#   or contain $ " ' \ or backtick fail closed. Those operands are also
#   checked for /bun:<tag> (other-namespace bun images). ARG/ENV values that
#   look like image refs (name/name:tag or @sha256) get the same /bun:<tag>
#   check. PATH-style values such as ENV PATH=/opt/bun:$PATH are not image
#   refs and are not scanned for /bun:.
# - Comment lines (optional leading whitespace, then #) are ignored.
#   Inline comments are not stripped.
# - Backslash-continued lines are joined before the checks, the way Docker
#   does: a trailing \ plus optional spaces continues onto the next
#   non-comment line. Comment lines inside a continuation are skipped.
#   Failures report the starting line of the continuation. A file that ends
#   mid-continuation fails.
# - A `# escape=` parser directive fails. This check only understands the
#   default backslash escape.

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

# Docker quote/backslash smuggling: oven/""bun and oven/b\un are oven/bun.
strip_quoting() {
  printf '%s' "$1" | tr -d "\"'\\\\\`"
}

# Whole-line oven/bun after stripping quotes and backslashes.
has_oven_bun_token() {
  local lower
  lower=$(strip_quoting "$1" | tr '[:upper:]' '[:lower:]')
  [[ "$lower" == *'oven/bun'* ]]
}

# Other-namespace bun image with a tag, e.g. ghcr.io/foo/bun:1.3.11.
# oven/bun: is excluded: the allowed COPY --from=oven/bun:<semver>@sha256:...
# line contains /bun: as a substring. PATH=/opt/bun:$PATH is not checked here.
has_bun_tag_token() {
  local lower
  lower=$(strip_quoting "$1" | tr '[:upper:]' '[:lower:]')
  [[ "$lower" == *'/bun:'* && "$lower" != *'oven/bun'* ]]
}

is_uncheckable_image() {
  local image="$1"
  [[ -z "$image" || "$image" == *[\$\"\'\\\`]* ]]
}

# org/name:tag or anything @sha256, and not a filesystem path.
looks_like_image_ref() {
  local value="$1"
  [[ -n "$value" ]] || return 1
  [[ "$value" == /* || "$value" == .* ]] && return 1
  [[ "$value" == *@sha256:* || "$value" == */*:* ]]
}

fail_uncheckable() {
  local lineno="$1" kind="$2" image="$3"
  if [[ -z "$image" ]]; then
    fail "Line $lineno: $kind operand is empty"
  else
    fail "Line $lineno: $kind operand uses quotes, escapes, or variable expansion: $image"
  fi
  allowed_hint
}

# Fail closed when a FROM / --from= / --mount from= operand cannot be pinned
# statically, or names a /bun:<tag> image. ARG/ENV values that look like
# image refs get the /bun:<tag> check so PATH=/opt/bun:$PATH is left alone.
check_variable_operands() {
  local line="$1" lineno="$2"
  local -a tokens opts
  local token rest opt opt_lc image value i kw

  read -r -a tokens <<<"$line" || true
  [[ ${#tokens[@]} -gt 0 ]] || return 0

  kw=$(printf '%s' "${tokens[0]}" | tr '[:upper:]' '[:lower:]')
  if [[ "$kw" == from ]]; then
    i=1
    while ((i < ${#tokens[@]})) && [[ "${tokens[$i]}" == --* ]]; do
      i=$((i + 1))
    done
    image="${tokens[$i]:-}"
    if is_uncheckable_image "$image"; then
      fail_uncheckable "$lineno" "FROM" "$image"
    elif has_bun_tag_token "$image"; then
      fail "Line $lineno: disallowed bun image reference: $line"
      allowed_hint
    fi
  fi

  if [[ "$kw" == arg || "$kw" == env ]]; then
    for token in "${tokens[@]:1}"; do
      [[ "$token" == *=* ]] || continue
      value="${token#*=}"
      if looks_like_image_ref "$value" && has_bun_tag_token "$value"; then
        fail "Line $lineno: disallowed bun image reference: $line"
        allowed_hint
      fi
    done
  fi

  for token in "${tokens[@]}"; do
    if [[ "$token" == --from=* ]]; then
      image="${token#--from=}"
      if is_uncheckable_image "$image"; then
        fail_uncheckable "$lineno" "COPY/ADD --from=" "$image"
      elif has_bun_tag_token "$image"; then
        fail "Line $lineno: disallowed bun image reference: $line"
        allowed_hint
      fi
    fi
    if [[ "$token" == --mount=* ]]; then
      rest="${token#--mount=}"
      local IFS=','
      read -r -a opts <<<"$rest" || true
      for opt in "${opts[@]+"${opts[@]}"}"; do
        opt_lc=$(printf '%s' "$opt" | tr '[:upper:]' '[:lower:]')
        if [[ "$opt_lc" == from=* ]]; then
          image="${opt#*=}"
          if is_uncheckable_image "$image"; then
            fail_uncheckable "$lineno" "--mount from=" "$image"
          elif has_bun_tag_token "$image"; then
            fail "Line $lineno: disallowed bun image reference: $line"
            allowed_hint
          fi
        fi
      done
    fi
  done
}

echo "🔍 Checking bun version sync"
echo "  package.json packageManager: bun@$expected"

lineno=0
pending=""
start=0
while IFS= read -r line || [[ -n "$line" ]]; do
  lineno=$((lineno + 1))
  line="${line%$'\r'}"

  if [[ "$line" =~ ^[[:space:]]*#[[:space:]]*[Ee][Ss][Cc][Aa][Pp][Ee][[:space:]]*= ]]; then
    fail "Line $lineno: parser directive 'escape' is not allowed"
    continue
  fi
  # Docker drops comment-only lines inside a backslash continuation.
  if is_comment_line "$line"; then
    continue
  fi
  if [[ -z "$pending" ]]; then
    [[ -n "${line//[[:space:]]/}" ]] || continue
    start=$lineno
  fi
  if [[ "$line" =~ ^(.*)(\\[[:space:]]*)$ ]]; then
    pending+="${BASH_REMATCH[1]}"
    continue
  fi
  line="$pending$line"
  pending=""

  if [[ "$line" =~ $ALLOWED_RE ]]; then
    sources=$((sources + 1))
    docker_version="${BASH_REMATCH[1]}"
    echo "  - line $start: oven/bun:$docker_version"
    if [[ "$docker_version" != "$expected" ]]; then
      fail "Bun version mismatch: Dockerfile uses $docker_version, package.json pins $expected"
      echo "   Update the oven/bun tag and digest in Dockerfile to match packageManager."
      allowed_hint
    fi
    rest=$(sed -E 's/^COPY --from=oven\/bun:[0-9]+\.[0-9]+\.[0-9]+(-[A-Za-z0-9._-]+)?@sha256:[0-9a-f]{64}//' <<<"$line")
    if has_oven_bun_token "$rest"; then
      fail "Line $start: disallowed extra bun image reference on the allowed COPY line: $line"
      allowed_hint
    fi
    check_variable_operands "$line" "$start"
    continue
  fi

  if has_oven_bun_token "$line"; then
    if [[ "$line" == *'COPY --from=oven/bun:'* && "$line" != *'@sha256:'* ]]; then
      fail "Line $start: Dockerfile oven/bun image must be pinned by digest (@sha256:...): $line"
    else
      fail "Line $start: disallowed bun image reference: $line"
    fi
    allowed_hint
  fi

  check_variable_operands "$line" "$start"
done <"$DOCKERFILE"
if [[ -n "$pending" ]]; then
  fail "Dockerfile ends inside a line continuation"
fi

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
