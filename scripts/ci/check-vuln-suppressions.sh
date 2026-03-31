#!/usr/bin/env bash
# Detect stale or expired vulnerability suppressions in .osv-scanner.toml
# and open a cleanup PR removing them.
#
# Adapted from py-lintro's check-vuln-suppressions.sh. Uses the py-lintro
# Docker image for osv-scanner probing and lintro-based classification.
#
# Usage: check-vuln-suppressions.sh
#
# Environment:
#   GH_TOKEN      - GitHub token for PR creation (required)
#   LINTRO_IMAGE  - py-lintro Docker image (default: py-lintro:latest)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
cd "${REPO_ROOT}"

# shellcheck source=../utils/utils.sh
source "${SCRIPT_DIR}/../utils/utils.sh"

if [[ -z "${GH_TOKEN:-}" ]]; then
  log_error "GH_TOKEN is required for PR creation but is not set"
  exit 1
fi

OSV_TOML=".osv-scanner.toml"
LINTRO_IMAGE="${LINTRO_IMAGE:-py-lintro:latest}"

if [[ ! -f "${OSV_TOML}" ]]; then
  log_success "No ${OSV_TOML} found. Nothing to check."
  exit 0
fi

if ! grep -qE '(IgnoredVulns|PackageOverrides)' "${OSV_TOML}" 2>/dev/null; then
  log_success "No suppressions in ${OSV_TOML}. Nothing to check."
  exit 0
fi

AWK_TMPFILE=$(mktemp)
PROBE_TMPFILE=$(mktemp)
cleanup() {
  [[ -n "${AWK_TMPFILE:-}" ]] && rm -f "${AWK_TMPFILE}"
  [[ -n "${PROBE_TMPFILE:-}" ]] && rm -f "${PROBE_TMPFILE}" "${PROBE_TMPFILE}.diag"
}
trap cleanup EXIT

# Probe osv-scanner without suppressions (--config /dev/null bypasses .osv-scanner.toml)
# to see which vulnerabilities still exist in the current lockfiles.
log_info "Probing osv-scanner without suppressions..."
PROBE_DIAG=""
PROBE_OUTPUT=$(
  docker run --rm --user "$(id -u):$(id -g)" -e HOME=/tmp \
    -v "$PWD:/code" -w /code "${LINTRO_IMAGE}" \
    osv-scanner scan --format json --config /dev/null --recursive . \
    2>"${PROBE_TMPFILE}.diag" || true
)
PROBE_DIAG=$(cat "${PROBE_TMPFILE}.diag" 2>/dev/null || true)
rm -f "${PROBE_TMPFILE}.diag"
if [[ -n "${PROBE_DIAG}" ]]; then
  log_info "osv-scanner diagnostics: ${PROBE_DIAG}"
fi

# Validate PROBE_OUTPUT is non-empty and well-formed JSON before classifying.
if [[ -z "${PROBE_OUTPUT}" ]]; then
  log_error "osv-scanner produced no stdout output"
  [[ -n "${PROBE_DIAG}" ]] && log_error "stderr: ${PROBE_DIAG}"
  exit 1
fi
if command_exists jq; then
  if ! printf '%s' "${PROBE_OUTPUT}" | jq empty 2>/dev/null; then
    log_error "osv-scanner produced invalid JSON"
    [[ -n "${PROBE_DIAG}" ]] && log_error "stderr: ${PROBE_DIAG}"
    exit 1
  fi
else
  if ! printf '%s' "${PROBE_OUTPUT}" | python3 -c 'import json,sys; json.load(sys.stdin)' 2>/dev/null; then
    log_error "osv-scanner produced invalid JSON"
    [[ -n "${PROBE_DIAG}" ]] && log_error "stderr: ${PROBE_DIAG}"
    exit 1
  fi
fi

# Classify suppressions using lintro's Python parser (inside Docker).
# Write probe output to a temp file and bind-mount it to avoid shell
# escaping issues with large JSON payloads piped through stdin.
log_info "Classifying suppressions..."
printf '%s' "${PROBE_OUTPUT}" >"${PROBE_TMPFILE}"
CLASSIFICATION_JSON=$(
  docker run --rm \
    -v "$PWD:/code" -w /code \
    -v "${PROBE_TMPFILE}:/tmp/probe-output.json:ro" \
    "${LINTRO_IMAGE}" \
    sh -c 'python3 /code/scripts/ci/classify-suppressions.py < /tmp/probe-output.json'
)

# Validate that CLASSIFICATION_JSON is well-formed before extracting arrays.
# A parse failure here (empty output, Python traceback, etc.) must fail the
# script rather than silently produce an empty REMOVE_IDS list.
if [[ -z "${CLASSIFICATION_JSON}" ]]; then
  log_error "classify-suppressions.py produced no output"
  exit 1
fi
if command_exists jq; then
  if ! printf '%s' "${CLASSIFICATION_JSON}" | jq empty 2>/dev/null; then
    log_error "classify-suppressions.py produced invalid JSON: ${CLASSIFICATION_JSON}"
    exit 1
  fi
else
  if ! printf '%s' "${CLASSIFICATION_JSON}" | python3 -c 'import json,sys; json.load(sys.stdin)' 2>/dev/null; then
    log_error "classify-suppressions.py produced invalid JSON: ${CLASSIFICATION_JSON}"
    exit 1
  fi
fi

# Extract IDs from JSON classification
# Helper: extract an array of strings from a JSON object by key.
# Uses jq when available, falls back to Python.
_extract_json_array() {
  local json="$1"
  local key="$2"
  if command_exists jq; then
    printf '%s' "${json}" | jq -r --arg k "${key}" '.[$k] // [] | .[]'
  else
    printf '%s' "${json}" | python3 -c "import json,sys; [print(i) for i in json.load(sys.stdin).get(sys.argv[1],[])]" "${key}"
  fi
}

STALE_IDS=()
EXPIRED_IDS=()
ACTIVE_IDS=()
while IFS= read -r id; do [[ -n "${id}" ]] && STALE_IDS+=("${id}"); done < <(_extract_json_array "${CLASSIFICATION_JSON}" "stale")
while IFS= read -r id; do [[ -n "${id}" ]] && EXPIRED_IDS+=("${id}"); done < <(_extract_json_array "${CLASSIFICATION_JSON}" "expired")
while IFS= read -r id; do [[ -n "${id}" ]] && ACTIVE_IDS+=("${id}"); done < <(_extract_json_array "${CLASSIFICATION_JSON}" "active")

# Combine IDs to remove
REMOVE_IDS=("${STALE_IDS[@]+"${STALE_IDS[@]}"}" "${EXPIRED_IDS[@]+"${EXPIRED_IDS[@]}"}")

# Report
for id in "${ACTIVE_IDS[@]+"${ACTIVE_IDS[@]}"}"; do
  log_success "Active: ${id}"
done
for id in "${STALE_IDS[@]+"${STALE_IDS[@]}"}"; do
  log_warn "Stale: ${id}"
done
for id in "${EXPIRED_IDS[@]+"${EXPIRED_IDS[@]}"}"; do
  log_warn "Expired: ${id}"
done

# If everything is active, nothing to do
if [[ ${#REMOVE_IDS[@]} -eq 0 ]]; then
  log_success "All suppressions are active. Nothing to do."
  exit 0
fi

# Check if a cleanup PR already exists
PR_LIST_OUTPUT=""
PR_LIST_EXIT=0
PR_LIST_OUTPUT=$(
  gh pr list --state open \
    --search "chore(security): remove stale vulnerability" \
    --json number --jq 'length' 2>&1
) || PR_LIST_EXIT=$?
if [[ "${PR_LIST_EXIT}" -ne 0 ]]; then
  log_error "gh pr list failed: ${PR_LIST_OUTPUT}"
  exit 1
fi
if ! [[ "${PR_LIST_OUTPUT}" =~ ^[0-9]+$ ]]; then
  log_error "gh pr list returned non-numeric output: ${PR_LIST_OUTPUT}"
  exit 1
fi
if [[ "${PR_LIST_OUTPUT}" -gt 0 ]]; then
  log_info "Cleanup PR already open (${PR_LIST_OUTPUT} found). Skipping."
  exit 0
fi

# --- Remove stale/expired entries from .osv-scanner.toml ---

IDS_LIST=$(
  IFS="|"
  echo "${REMOVE_IDS[*]}"
)
for id in "${REMOVE_IDS[@]}"; do
  log_info "Removing ${id} from ${OSV_TOML}..."
done
awk -v ids="${IDS_LIST}" '
  BEGIN { n = split(ids, arr, "|"); for (i = 1; i <= n; i++) remove[arr[i]] = 1 }
  /^\[\[(IgnoredVulns|PackageOverrides)\]\]/ {
    if (in_block && !found) { printf "%s", block }
    block = $0 "\n"; in_block = 1; found = 0; next
  }
  in_block {
    if (/^\[/) {
      if (!found) { printf "%s", block }
      in_block = 0; found = 0; block = ""
      print; next
    }
    block = block $0 "\n"
    if (index($0, "id") > 0) {
      for (rid in remove) {
        if (index($0, "\"" rid "\"") > 0) { found = 1; break }
      }
    }
    next
  }
  { print }
  END { if (in_block && !found) { printf "%s", block } }
' "${OSV_TOML}" >"${AWK_TMPFILE}" && mv "${AWK_TMPFILE}" "${OSV_TOML}"

# Clean up empty TOML file (only comments/whitespace left)
if [[ -f "${OSV_TOML}" ]] && ! grep -qE '^\[' "${OSV_TOML}"; then
  log_info "No entries left in ${OSV_TOML}, removing file"
  rm -f "${OSV_TOML}"
fi

# Create PR if changes were made
if ! git diff --quiet; then
  REMOVED_LIST=""
  for id in "${REMOVE_IDS[@]}"; do
    REMOVED_LIST="${REMOVED_LIST}- \`${id}\`
"
  done

  BRANCH="chore/remove-stale-vulns-$(date +%Y%m%d%H%M%S)"
  git config user.name "github-actions[bot]"
  git config user.email "github-actions[bot]@users.noreply.github.com"
  git checkout -b "${BRANCH}"
  git add -- "${OSV_TOML}" 2>/dev/null || git rm --cached -- "${OSV_TOML}" 2>/dev/null || true
  git commit -m "$(
    cat <<EOF
chore(security): remove stale vulnerability suppressions

The following suppressions are no longer needed:
${REMOVED_LIST}
Detected by the weekly vuln-suppression-check workflow.
EOF
  )"

  git push -u origin "${BRANCH}"

  if [[ -n "${GITHUB_REPOSITORY:-}" ]]; then
    WF_URL="${GITHUB_SERVER_URL:-https://github.com}/${GITHUB_REPOSITORY}/actions/workflows/vuln-suppression-check.yml"
  else
    WF_URL="(workflow URL unavailable — GITHUB_REPOSITORY not set)"
  fi

  gh pr create \
    --title "chore(security): remove stale vulnerability suppressions" \
    --body "$(
      cat <<EOF
## Summary
- Remove stale/expired vulnerability suppressions that are no longer needed

### Removed
${REMOVED_LIST}
## Test plan
- [ ] CI security audit passes without these suppressions
- [ ] osv-scanner scan passes without these suppressions

---
*Auto-created by [vuln-suppression-check](${WF_URL}).*
EOF
    )"

  log_success "Cleanup PR created on branch ${BRANCH}"
else
  log_info "No file changes needed."
fi
