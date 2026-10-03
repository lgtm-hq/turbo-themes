#!/usr/bin/env bash
# Check that the Dockerfile bun image matches the packageManager pin
# Usage: check-bun-version-sync.sh [repo-root]
#
# The root package.json "packageManager" field (bun@X.Y.Z) is the single
# source of truth for the bun version used in CI. The Dockerfile installs bun
# by copying it from oven/bun:<version>@sha256:<digest>. Renovate groups both
# bumps into one PR; this check fails if they ever drift apart or if any
# Dockerfile oven/bun reference is not pinned by digest.
#
# Only active Dockerfile instructions are inspected (comments and RUN/COPY/ADD
# heredoc bodies are skipped). Image operands of FROM, COPY/ADD --from= and
# RUN --mount=...,from= are resolved through stage aliases and indexes, and
# any operand using variable expansion fails closed because it cannot be
# validated statically.

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

# Print the Dockerfile as logical instructions, one per line:
# - CRLF and leading whitespace are tolerated
# - comment lines (including parser directives) are dropped
# - backslash continuations are joined
# - heredoc bodies of RUN/COPY/ADD (<<EOF, <<-EOF, <<"EOF", <<'EOF') are
#   skipped up to their delimiter line; <<< herestrings are not heredocs
logical_lines() {
  awk '
    function queue_heredocs(s,    rest, pre, tok, delim) {
      rest = s
      while (match(rest, hd_re)) {
        pre = (RSTART > 1) ? substr(rest, RSTART - 1, 1) : ""
        tok = substr(rest, RSTART, RLENGTH)
        rest = substr(rest, RSTART + RLENGTH)
        if (pre == "<") continue
        delim = tok
        sub(/^<<-?/, "", delim)
        gsub(q_re, "", delim)
        nq++
        hd_delim[nq] = delim
        hd_dash[nq] = (substr(tok, 3, 1) == "-")
      }
    }
    BEGIN {
      hd_re = "<<-?[\"\047]?[A-Za-z_][A-Za-z0-9_]*[\"\047]?"
      q_re = "[\"\047]"
      nq = 0
      qi = 1
    }
    { sub(/\r$/, "") }
    nq > 0 {
      body = $0
      if (hd_dash[qi]) sub(/^\t+/, "", body)
      if (body == hd_delim[qi]) {
        qi++
        if (qi > nq) { nq = 0; qi = 1 }
      }
      next
    }
    /^[[:space:]]*#/ { next }
    {
      line = $0
      if (line ~ /\\[[:space:]]*$/) {
        sub(/\\[[:space:]]*$/, "", line)
        buf = buf line " "
        next
      }
      full = buf line
      buf = ""
      print full
      if (tolower(full) ~ /^[[:space:]]*(run|copy|add)[[:space:]]/) queue_heredocs(full)
    }
    END { if (buf != "") print buf }
  ' "$1"
}

lower() { tr '[:upper:]' '[:lower:]' <<<"$1"; }

strip_registry() {
  local ref="$1"
  ref="${ref#docker.io/}"
  ref="${ref#index.docker.io/}"
  printf '%s' "$ref"
}

is_bun_ref() { [[ "$1" == oven/bun || "$1" == oven/bun[:@]* ]]; }

# Stage table (bash 3.2 compatible: parallel indexed arrays, no assoc arrays)
stage_names=()
stage_images=()
# Validated references: parallel arrays of origin and reference
ref_ctx=()
ref_val=()
sources=0
errors=0

fail() {
  echo "❌ $1"
  errors=$((errors + 1))
}

# Resolve an image operand (FROM image, --from= value, mount from=) to an
# image reference, following stage aliases and numeric stage indexes.
# Prints the resolved image; returns 1 if it uses variable expansion.
resolve_operand() {
  local operand="$1" i lname
  if [[ "$operand" == *'$'* ]]; then
    return 1
  fi
  if [[ "$operand" =~ ^[0-9]+$ ]] && ((operand < ${#stage_images[@]})); then
    printf '%s' "${stage_images[$operand]}"
    return 0
  fi
  lname=$(lower "$operand")
  for ((i = ${#stage_names[@]} - 1; i >= 0; i--)); do
    if [[ -n "${stage_names[$i]}" && "${stage_names[$i]}" == "$lname" ]]; then
      printf '%s' "${stage_images[$i]}"
      return 0
    fi
  done
  strip_registry "$operand"
}

# Record an image operand used as a bun source (FROM / --from / mount from).
check_source() {
  local where="$1" operand="$2" resolved
  if ! resolved=$(resolve_operand "$operand"); then
    fail "Cannot validate $where operand '$operand': it uses variable expansion."
    echo "   Use a literal oven/bun:<semver>[-variant]@sha256:<digest> (or a stage alias) instead."
    return 0
  fi
  if is_bun_ref "$resolved"; then
    if [[ "$resolved" != "$(strip_registry "$operand")" ]]; then
      where="$where (via stage '$operand')"
    fi
    ref_ctx+=("$where")
    ref_val+=("$resolved")
    sources=$((sources + 1))
  fi
}

while IFS= read -r line; do
  tokens=()
  read -r -a tokens <<<"$line" || true
  [[ ${#tokens[@]} -gt 0 ]] || continue
  keyword=$(lower "${tokens[0]}")
  i=1

  case "$keyword" in
  from)
    while ((i < ${#tokens[@]})) && [[ "${tokens[$i]}" == --* ]]; do
      i=$((i + 1))
    done
    image="${tokens[$i]:-}"
    alias_name=""
    if ((i + 2 < ${#tokens[@]})) && [[ "$(lower "${tokens[$((i + 1))]}")" == "as" ]]; then
      alias_name=$(lower "${tokens[$((i + 2))]}")
    fi
    resolved="<unresolved>"
    if [[ -n "$image" ]]; then
      if resolved_tmp=$(resolve_operand "$image"); then
        resolved="$resolved_tmp"
      fi
      check_source "FROM" "$image"
    fi
    stage_names+=("$alias_name")
    stage_images+=("$resolved")
    ;;
  copy | add)
    while ((i < ${#tokens[@]})) && [[ "${tokens[$i]}" == --* ]]; do
      if [[ "${tokens[$i]}" == --from=* ]]; then
        operand="${tokens[$i]#--from=}"
        check_source "${tokens[0]} --from" "$operand"
      fi
      i=$((i + 1))
    done
    ;;
  run)
    while ((i < ${#tokens[@]})) && [[ "${tokens[$i]}" == --* ]]; do
      if [[ "${tokens[$i]}" == --mount=* ]]; then
        mount_opts=()
        IFS=',' read -r -a mount_opts <<<"${tokens[$i]#--mount=}" || true
        for opt in "${mount_opts[@]+"${mount_opts[@]}"}"; do
          if [[ "$opt" == from=* ]]; then
            check_source "RUN --mount from" "${opt#from=}"
          fi
        done
      fi
      i=$((i + 1))
    done
    ;;
  esac

  # Catch-all: any other oven/bun mention in an active instruction (ARG/ENV
  # values, RUN commands, ...) must also be a valid, matching reference.
  if [[ "$keyword" != from && "$keyword" != copy && "$keyword" != add ]]; then
    for (( ; i < ${#tokens[@]}; i++)); do
      token="${tokens[$i]}"
      [[ "$token" == *oven/bun* ]] || continue
      if [[ "$token" =~ ^[A-Za-z_][A-Za-z0-9_]*= ]]; then
        token="${token#*=}"
      fi
      token="${token//[\"\',\[\]]/}"
      ref_ctx+=("${tokens[0]} value")
      ref_val+=("$(strip_registry "$token")")
    done
  fi
done < <(logical_lines "$DOCKERFILE")

echo "🔍 Checking bun version sync"
echo "  package.json packageManager: bun@$expected"
echo "  Dockerfile oven/bun references: ${#ref_val[@]}"

if ((sources == 0 && errors == 0)); then
  echo "❌ Error: no oven/bun image reference found in $DOCKERFILE"
  echo "   Expected FROM or COPY --from=oven/bun:<semver>[-variant]@sha256:<digest>."
  exit 1
fi

# Expected form: oven/bun:<semver>[-variant]@sha256:<64 hex>
# e.g. oven/bun:1.4.2-debian@sha256:4f6e...
image_re='^oven/bun:([0-9]+\.[0-9]+\.[0-9]+)(-[A-Za-z0-9._-]+)?@sha256:[0-9a-f]{64}$'
for ((n = 0; n < ${#ref_val[@]}; n++)); do
  image_ref="${ref_val[$n]}"
  echo "  - $image_ref  [${ref_ctx[$n]}]"
  if [[ "$image_ref" == *'$'* ]]; then
    fail "Cannot validate ${ref_ctx[$n]}: variable expansion in '$image_ref'."
    continue
  fi
  if [[ "$image_ref" != *"@sha256:"* ]]; then
    fail "Dockerfile oven/bun image must be pinned by digest (@sha256:...): $image_ref"
    continue
  fi
  if [[ ! "$image_ref" =~ $image_re ]]; then
    fail "Unrecognised Dockerfile oven/bun reference: $image_ref"
    echo "   Expected oven/bun:<semver>[-variant]@sha256:<digest>," \
      "e.g. oven/bun:1.4.2-debian@sha256:<64 hex chars>."
    continue
  fi
  docker_version="${BASH_REMATCH[1]}"
  if [[ "$docker_version" != "$expected" ]]; then
    fail "Bun version mismatch: Dockerfile uses $docker_version, package.json pins $expected"
    echo "   Update the oven/bun tag and digest in Dockerfile to match packageManager."
  fi
done

if ((errors > 0)); then
  echo "❌ $errors invalid oven/bun reference(s) in $DOCKERFILE"
  exit 1
fi

echo "✅ All Dockerfile oven/bun references (${#ref_val[@]}) match packageManager bun@$expected"
