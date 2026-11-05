#!/usr/bin/env bash
# Shared download helper for CI tool installers.
# Usage: source this file, then: download_with_retry <url> <output-file>
#
# GitHub Releases downloads intermittently return HTTP 5xx (for example 504)
# for a few minutes at a time (#1293). curl's own --retry covers short blips;
# the outer loop with exponential backoff (5s, 10s, 20s, 40s) rides out longer
# windows. Overridable via DOWNLOAD_MAX_ATTEMPTS and DOWNLOAD_RETRY_DELAY.
# --connect-timeout/--max-time bound a stalled connection so it is retried
# instead of hanging until the job timeout.

download_with_retry() {
  local url="$1"
  local output="$2"
  local max_attempts="${DOWNLOAD_MAX_ATTEMPTS:-5}"
  local delay="${DOWNLOAD_RETRY_DELAY:-5}"
  local attempt exit_code=1

  if ! [[ "${max_attempts}" =~ ^[1-9][0-9]*$ ]]; then
    echo "  ❌ DOWNLOAD_MAX_ATTEMPTS must be a positive integer, got '${max_attempts}'" >&2
    return 2
  fi

  for attempt in $(seq 1 "${max_attempts}"); do
    exit_code=0
    curl -sSfL --retry 3 --retry-all-errors --retry-delay 2 \
      --connect-timeout 15 --max-time 300 \
      "${url}" -o "${output}" || exit_code=$?
    if [ "${exit_code}" -eq 0 ]; then
      return 0
    fi
    if [ "${attempt}" -lt "${max_attempts}" ]; then
      echo "  ⚠️  Download failed (attempt ${attempt}/${max_attempts}, curl exit ${exit_code}), retrying in ${delay}s..." >&2
      sleep "${delay}"
      delay=$((delay * 2))
    else
      echo "  ❌ Download failed after ${max_attempts} attempts: ${url}" >&2
      return "${exit_code}"
    fi
  done
  return "${exit_code}"
}
