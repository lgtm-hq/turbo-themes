#!/usr/bin/env bash
# Recovery script: push the release branch (with retry) and create/update the PR.
# Called when peter-evans/create-pull-request fails due to a transient push rejection.
#
# Expects the local release branch to already exist (created by create-pull-request
# before its push step failed). Retries the push via push-with-retry.sh, then
# creates or updates the PR via the GitHub CLI.
#
# Required env vars (set by workflow step):
#   RELEASE_BRANCH      e.g. release/version-1.2.3
#   PR_TITLE            Pull request title
#   PR_BODY_FILE        Path to file containing PR body markdown
#   GH_TOKEN            GitHub App installation token with PR write access
#   GITHUB_REPOSITORY   owner/repo  (injected by Actions runner)
#   GITHUB_OUTPUT       Path to GITHUB_OUTPUT file  (injected by Actions runner)

set -euo pipefail

RELEASE_BRANCH="${RELEASE_BRANCH:?RELEASE_BRANCH is required}"
PR_TITLE="${PR_TITLE:?PR_TITLE is required}"
PR_BODY_FILE="${PR_BODY_FILE:?PR_BODY_FILE is required}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
chmod +x "${SCRIPT_DIR}/push-with-retry.sh"

# Verify the local branch was created before the push failed.
if ! git rev-parse --verify "refs/heads/${RELEASE_BRANCH}" &>/dev/null; then
  echo "❌ Local branch '${RELEASE_BRANCH}' not found."
  echo "   create-pull-request may have failed before creating the branch."
  exit 1
fi

echo "🔁 Retrying push of '${RELEASE_BRANCH}' after transient rejection..."
# The workflow checks out with persist-credentials disabled, so a bare
# "git push origin" has no auth (#734). Push to an explicit tokenized URL
# instead of rewriting the remote, so the token never lands in git config.
PUSH_URL="https://x-access-token:${GH_TOKEN:?GH_TOKEN is required}@github.com/${GITHUB_REPOSITORY}.git"
"${SCRIPT_DIR}/push-with-retry.sh" "${PUSH_URL}" "${RELEASE_BRANCH}"

# Create or update the PR.
echo "🔍 Checking for an existing open PR for '${RELEASE_BRANCH}'..."
EXISTING_PR=$(gh pr list \
  --repo "${GITHUB_REPOSITORY}" \
  --head "${RELEASE_BRANCH}" \
  --state open \
  --json number \
  --jq '.[0].number // empty')

if [[ -n "${EXISTING_PR}" ]]; then
  echo "📝 Updating existing PR #${EXISTING_PR}..."
  gh pr edit "${EXISTING_PR}" \
    --repo "${GITHUB_REPOSITORY}" \
    --title "${PR_TITLE}" \
    --body-file "${PR_BODY_FILE}" \
    --add-label "release-bump"
  PR_NUMBER="${EXISTING_PR}"
else
  echo "🆕 Creating new PR for '${RELEASE_BRANCH}'..."
  PR_URL=$(gh pr create \
    --repo "${GITHUB_REPOSITORY}" \
    --base main \
    --head "${RELEASE_BRANCH}" \
    --title "${PR_TITLE}" \
    --body-file "${PR_BODY_FILE}" \
    --label "release-bump")
  PR_NUMBER="${PR_URL##*/}"
fi

echo "✅ PR #${PR_NUMBER} ready"
echo "pull-request-number=${PR_NUMBER}" >>"${GITHUB_OUTPUT}"
