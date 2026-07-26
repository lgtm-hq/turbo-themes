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
#
# Exit codes:
#   0   Push succeeded
#   75  Push rejected because the branch is enrolled in a merge queue (#817).
#       This is NOT transient on the retry timescale — the ref only unblocks when
#       the queued PR merges or is dequeued — so the retry loop stops immediately
#       and lets the caller decide whether the rejection is benign. Every other
#       rejection, including a generic GH006 protected-branch/non-fast-forward
#       one, keeps retrying.
#   1   Push failed after MAX_RETRIES attempts (or bad configuration)

set -euo pipefail

# Distinct exit code for the merge-queue classification. Callers that know the
# push is redundant in that situation (e.g. retry-release-branch-push.sh) may
# treat it as benign; callers that do not will still see a non-zero exit.
readonly MERGE_QUEUE_EXIT_CODE=75

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
redact_credentials() {
  sed -E 's#(https?://)[^@/[:space:]]+@#\1#g'
}

REMOTE_DISPLAY="$(redact_credentials <<<"${REMOTE}")"

# A merge-queue rejection is GH006 *plus* the merge-queue wording; a plain GH006
# (protected branch, non-fast-forward, ...) must NOT match so it keeps retrying.
is_merge_queue_rejection() {
  local output="$1"
  grep -q 'GH006' <<<"${output}" || return 1
  grep -Eqi 'queued for merging|added to a merge queue' <<<"${output}"
}

echo "🚀 Pushing ${REFSPEC} to ${REMOTE_DISPLAY} (max ${MAX_RETRIES} attempts)..."

while true; do
  # Capture the push output so the rejection reason can be classified, then
  # replay it (credentials redacted) so the logs stay as informative as before.
  if push_output="$(git push --force-with-lease "${REMOTE}" "${REFSPEC}" 2>&1)"; then
    redact_credentials <<<"${push_output}"
    echo "✅ Push succeeded on attempt ${attempt}"
    exit 0
  fi
  redact_credentials <<<"${push_output}" >&2

  if is_merge_queue_rejection "${push_output}"; then
    echo "🔀 Push rejected: '${REFSPEC}' is enrolled in a merge queue and cannot be updated."
    echo "   Retrying cannot help — the ref unblocks only when the queued PR merges or is dequeued."
    exit "${MERGE_QUEUE_EXIT_CODE}"
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
