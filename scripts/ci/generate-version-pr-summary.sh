#!/usr/bin/env bash
# Generate a GitHub Step Summary for the Release Version PR workflow.
# Expected env vars: BUMP_NEEDED, NEXT_VERSION
set -euo pipefail

{
  echo "## Release Version PR Status"
  if [ "${BUMP_NEEDED}" = "true" ]; then
    echo "Version PR created/updated for v${NEXT_VERSION}"
  else
    echo "No version bump needed"
  fi
} >>"${GITHUB_STEP_SUMMARY}"
