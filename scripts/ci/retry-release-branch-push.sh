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
#   NEXT_VERSION        Computed next version, e.g. 1.2.3
#   PR_TITLE            Pull request title
#   PR_BODY_FILE        Path to file containing PR body markdown
#   GH_TOKEN            GitHub App installation token with PR write access
#   GITHUB_REPOSITORY   owner/repo  (injected by Actions runner)
#   GITHUB_OUTPUT       Path to GITHUB_OUTPUT file  (injected by Actions runner)
#
# Outputs (GITHUB_OUTPUT):
#   pull-request-number   Number of the created/updated PR
#   skipped-merge-queue   'true' when the push was skipped because the release
#                         branch is already queued for merging (#817)

set -euo pipefail

RELEASE_BRANCH="${RELEASE_BRANCH:?RELEASE_BRANCH is required}"
NEXT_VERSION="${NEXT_VERSION:?NEXT_VERSION is required}"
PR_TITLE="${PR_TITLE:?PR_TITLE is required}"
PR_BODY_FILE="${PR_BODY_FILE:?PR_BODY_FILE is required}"

# Exit code push-with-retry.sh uses for the merge-queue classification.
readonly MERGE_QUEUE_EXIT_CODE=75

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
# "git push origin" has no auth (#734). Set a tokenized push-only URL on
# origin — pushing to a raw URL would drop origin's remote-tracking refs
# and break bare --force-with-lease in push-with-retry.sh. The push URL is
# removed again afterwards so the token does not outlive this script.
PUSH_URL="https://x-access-token:${GH_TOKEN:?GH_TOKEN is required}@github.com/${GITHUB_REPOSITORY}.git"
git remote set-url --push origin "${PUSH_URL}"
trap 'git remote set-url --delete --push origin ".*" 2>/dev/null || true' EXIT

push_status=0
"${SCRIPT_DIR}/push-with-retry.sh" origin "${RELEASE_BRANCH}" || push_status=$?

if [[ ${push_status} -eq ${MERGE_QUEUE_EXIT_CODE} ]]; then
  # The branch is queued for merging, so the queued PR already carries this
  # version bump and its merge will fire a fresh run. Skipping is only safe if
  # that really is the case — verify before declaring the failure benign, so a
  # mismatch can never silently drop a version bump (#817).
  EXPECTED_BRANCH="release/version-${NEXT_VERSION}"
  if [[ "${RELEASE_BRANCH}" != "${EXPECTED_BRANCH}" ]]; then
    echo "❌ Refusing to skip: pushed branch '${RELEASE_BRANCH}' does not match" >&2
    echo "   the branch expected for v${NEXT_VERSION} ('${EXPECTED_BRANCH}')." >&2
    exit 1
  fi

  QUEUED_HEAD=$(gh pr list \
    --repo "${GITHUB_REPOSITORY}" \
    --head "${RELEASE_BRANCH}" \
    --state open \
    --json headRefName \
    --jq '.[0].headRefName // empty')

  if [[ "${QUEUED_HEAD}" != "${EXPECTED_BRANCH}" ]]; then
    echo "❌ Refusing to skip: no open PR with head '${EXPECTED_BRANCH}' carries" >&2
    echo "   the v${NEXT_VERSION} bump (found: '${QUEUED_HEAD:-none}')." >&2
    exit 1
  fi

  echo "::notice title=Release branch already in merge queue::Skipping push of '${RELEASE_BRANCH}' — the queued PR already carries the v${NEXT_VERSION} bump and its merge will trigger a fresh run."
  echo "skipped-merge-queue=true" >>"${GITHUB_OUTPUT}"
  exit 0
fi

if [[ ${push_status} -ne 0 ]]; then
  exit "${push_status}"
fi

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
