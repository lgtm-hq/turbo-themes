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

reviewer=$(awk '/^[*][[:space:]]/ { sub(/^@/, "", $2); print $2; exit }' .github/CODEOWNERS)
if [ -z "$reviewer" ]; then
  exit 0
fi

pr_endpoint="repos/{owner}/{repo}/pulls/$PR_NUMBER"
read_state() {
  gh api "$pr_endpoint" --method GET | jq -e '
    if (.requested_reviewers | type) == "array" and (.assignees | type) == "array"
    then . else error("Cannot verify CODEOWNER postconditions: invalid PR state") end'
}
has_login() {
  jq -e --arg field "$1" --arg login "$reviewer" \
    '.[$field] | any(.[]; (.login | ascii_downcase) == ($login | ascii_downcase))' <<<"$state" >/dev/null
}

state=$(read_state)
mutation_failed=false
# Narrow REST operations avoid gh pr edit's combined GraphQL mutation. Never
# resend a satisfied request (for example an automatic CODEOWNERS request).
if ! has_login requested_reviewers; then
  if ! gh api "$pr_endpoint/requested_reviewers" --method POST -f "reviewers[]=$reviewer" >/dev/null; then
    echo "::warning::Reviewer request failed; checking exact postconditions" >&2
    mutation_failed=true
  fi
fi
if ! has_login assignees; then
  if ! gh api "repos/{owner}/{repo}/issues/$PR_NUMBER/assignees" --method POST -f "assignees[]=$reviewer" >/dev/null; then
    echo "::warning::Assignment failed; checking exact postconditions" >&2
    mutation_failed=true
  fi
fi

# An API failure may follow a successful side effect. Only a fresh independent
# read proving BOTH required fields can reconcile it; unreadable/missing state
# fails the step. This requests review, never substitutes for approval.
state=$(read_state)
if ! has_login requested_reviewers || ! has_login assignees; then
  echo "::error::CODEOWNER postconditions unmet: $reviewer must be requested reviewer and assignee on PR $PR_NUMBER" >&2
  exit 1
fi
if [ "$mutation_failed" = true ]; then
  echo "::warning::Mutation error reconciled: exact reviewer and assignee postconditions verified" >&2
fi
