#!/usr/bin/env bash
# Run osv-scanner via lintro in Docker and generate a security PR comment.
# Adapted from py-lintro's security-comment.sh — uses the published
# py-lintro Docker image which has lintro + osv-scanner pre-installed.
#
# Usage: security-audit.sh
#
# Requires:
#   - py-lintro Docker image (pulled by workflow)
#   - GITHUB_OUTPUT, GITHUB_STEP_SUMMARY (GitHub Actions env)
#
# Exit codes:
#   0 - No vulnerabilities found
#   1 - Vulnerabilities found or scan failure

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=../utils/utils.sh
source "${SCRIPT_DIR}/../utils/utils.sh"

COMMENT_FILE="security-audit-comment.txt"
OSV_RESULTS="osv-results.json"
LINTRO_IMAGE="${LINTRO_IMAGE:-py-lintro:latest}"

log_info "Running osv-scanner via lintro in Docker..."

# Run lintro with osv-scanner only, JSON output, inside the Docker image.
# Mount the repo so osv-scanner can discover lockfiles across all ecosystems.
OSV_EXIT_CODE=0
docker run --rm --user "$(id -u):$(id -g)" -e HOME=/tmp \
  -v "$PWD:/code" -w /code "${LINTRO_IMAGE}" \
  lintro check . --tools osv_scanner \
  --output-format json --output /code/"${OSV_RESULTS}" \
  2>&1 | tee osv-output.txt || OSV_EXIT_CODE=$?

# Always parse OSV_RESULTS immediately after generation to detect vulnerabilities
# regardless of the exit code.  OSV_EXIT_CODE is only a tool-failure indicator.
HAS_VULNS=0
if [[ -f "${OSV_RESULTS}" ]] && python3 -c "
import json, sys
path = sys.argv[1]
try:
    d = json.load(open(path))
    r = next((x for x in d.get('results', []) if x.get('tool') == 'osv_scanner'), None)
    sys.exit(0 if r and r.get('issues_count', 0) > 0 else 1)
except (json.JSONDecodeError, KeyError) as e:
    print(f'Failed to parse {path}: {e}', file=sys.stderr)
    sys.exit(1)
" "${OSV_RESULTS}" 2>&1; then
  HAS_VULNS=1
fi

# Treat a non-zero OSV_EXIT_CODE as a tool error only when no valid vuln data
# was found (lintro exits non-zero when issues are present, which is expected).
AUDIT_FAILED=0
if [[ "${OSV_EXIT_CODE}" -ne 0 ]] && [[ "${HAS_VULNS}" -eq 0 ]]; then
  log_info "osv-scanner exited non-zero but no valid vulnerability data found in ${OSV_RESULTS}"
  AUDIT_FAILED=1
fi

# Format JSON results as markdown PR comment body using the Python formatter
# (matches py-lintro's format-security-comment.py pattern).
format_err=$(mktemp)
FORMAT_FAILED=0
if ! COMMENT_BODY=$(python3 "${SCRIPT_DIR}/format-security-comment.py" "${OSV_RESULTS}" 2>"${format_err}"); then
  log_error "format-security-comment.py failed:"
  cat "${format_err}" >&2
  COMMENT_BODY="Failed to format security audit results. See CI logs for details."
  FORMAT_FAILED=1
fi
rm -f "${format_err}"

if [[ "${AUDIT_FAILED}" -eq 1 ]]; then
  STATUS="⚠️ AUDIT FAILED"
elif [[ "${FORMAT_FAILED}" -eq 1 ]]; then
  STATUS="⚠️ FORMAT FAILED"
elif [[ "${HAS_VULNS}" -eq 1 ]]; then
  STATUS="⚠️ VULNERABILITIES FOUND"
else
  STATUS="✅ PASSED"
fi

CONTENT="<!-- security-audit-report -->

${COMMENT_BODY}"

# Generate the comment file using shared function (matches py-lintro)
generate_pr_comment "Security Audit" "${STATUS}" "${CONTENT}" "${COMMENT_FILE}" "lintro + osv-scanner"

# Cleanup artifacts on success (preserve for debugging on failure)
if [[ "${HAS_VULNS}" -eq 0 ]] && [[ "${AUDIT_FAILED}" -eq 0 ]]; then
  rm -f "${OSV_RESULTS}" osv-output.txt
fi

# Expose result to downstream workflow steps
if [[ -n "${GITHUB_OUTPUT:-}" ]]; then
  echo "has_vulns=${HAS_VULNS}" >>"${GITHUB_OUTPUT}"
  echo "audit_failed=${AUDIT_FAILED}" >>"${GITHUB_OUTPUT}"
fi

if [[ "${AUDIT_FAILED}" -eq 1 ]]; then
  log_error "Security audit failed (tool/scan error)"
  exit 1
elif [[ "${HAS_VULNS}" -eq 1 ]]; then
  log_error "Security audit found vulnerabilities"
  exit 1
else
  log_success "Security audit passed"
  exit 0
fi
