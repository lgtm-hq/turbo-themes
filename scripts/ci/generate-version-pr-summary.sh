#!/usr/bin/env bash
# Generate a GitHub Step Summary for the Release Version PR workflow.
# Expected env vars: BUMP_NEEDED, NEXT_VERSION, JOB_STATUS, PUSH_RETRY_TRIGGERED
set -euo pipefail

{
  echo "## Release Version PR Status"
  if [ "${BUMP_NEEDED:-}" = "true" ]; then
    if [ "${JOB_STATUS:-}" = "failure" ]; then
      echo "❌ **Push failed** — release branch for v${NEXT_VERSION} could not be pushed."
      echo ""
      echo "Both the primary push attempt and the transient-error retry failed."
      echo "Check the workflow logs and re-run the workflow once the underlying issue is resolved."
    elif [ "${PUSH_RETRY_TRIGGERED:-}" = "true" ]; then
      echo "⚠️ Version PR created/updated for v${NEXT_VERSION} (recovered via push retry)"
    else
      echo "✅ Version PR created/updated for v${NEXT_VERSION}"
    fi
  else
    echo "✅ No version bump needed"
  fi
} >>"${GITHUB_STEP_SUMMARY}"
