#!/usr/bin/env bash
# Retry git push with exponential backoff to handle transient GitHub remote rejections
# (e.g. "remote: fatal error in commit_refs", "! [remote rejected]").
#
# Usage: push-with-retry.sh <remote> <refspec>
#
# Configuration (env vars):
#   MAX_RETRIES         Maximum push attempts (default: 3)
#   INITIAL_DELAY       Seconds before first retry (default: 5)
#   BACKOFF_MULTIPLIER  Delay multiplier for each retry (default: 2)

set -euo pipefail

REMOTE="${1:?usage: push-with-retry.sh <remote> <refspec>}"
REFSPEC="${2:?usage: push-with-retry.sh <remote> <refspec>}"

MAX_RETRIES="${MAX_RETRIES:-3}"
INITIAL_DELAY="${INITIAL_DELAY:-5}"
# BACKOFF_MULTIPLIER must be a positive integer; bash $((...)) truncates floats silently.
BACKOFF_MULTIPLIER="${BACKOFF_MULTIPLIER:-2}"
if ! [[ "${BACKOFF_MULTIPLIER}" =~ ^[0-9]+$ ]]; then
  echo "❌ BACKOFF_MULTIPLIER must be a non-negative integer, got: '${BACKOFF_MULTIPLIER}'"
  exit 1
fi

attempt=1
delay="${INITIAL_DELAY}"

# Never print embedded credentials when the remote is a tokenized URL.
REMOTE_DISPLAY="$(sed -E 's#(https?://)[^@/]+@#\1#' <<<"${REMOTE}")"

echo "🚀 Pushing ${REFSPEC} to ${REMOTE_DISPLAY} (max ${MAX_RETRIES} attempts)..."

while true; do
  if git push --force-with-lease "${REMOTE}" "${REFSPEC}"; then
    echo "✅ Push succeeded on attempt ${attempt}"
    exit 0
  fi

  if [[ ${attempt} -ge ${MAX_RETRIES} ]]; then
    echo "❌ Push failed after ${MAX_RETRIES} attempts"
    exit 1
  fi

  echo "⚠️  Attempt ${attempt}/${MAX_RETRIES} failed. Retrying in ${delay}s..."
  sleep "${delay}"

  attempt=$((attempt + 1))
  delay=$((delay * BACKOFF_MULTIPLIER))
done
