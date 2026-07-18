#!/usr/bin/env bash
# SPDX-License-Identifier: MIT
# Purpose: Request review from and assign the repository CODEOWNER on a PR.
#
# Usage: PR_NUMBER=<n> GH_TOKEN=<token> ./scripts/ci/request-codeowner-review.sh
#
# Reads the first catch-all owner from .github/CODEOWNERS. No-op when the
# file has no owner entry.

set -euo pipefail

if [ -z "${PR_NUMBER:-}" ]; then
  echo "❌ PR_NUMBER is required" >&2
  exit 1
fi

reviewer=$(grep -m1 '^[*][[:space:]]' .github/CODEOWNERS 2>/dev/null | awk '{print $2}' | tr -d '@' || true)
if [ -n "$reviewer" ]; then
  gh pr edit "$PR_NUMBER" --add-reviewer "$reviewer" --add-assignee "$reviewer"
fi
