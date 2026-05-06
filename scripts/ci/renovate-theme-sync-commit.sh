#!/usr/bin/env bash
# Commit and push regenerated *.synced.ts files back onto a Renovate PR
# branch. Called by .github/workflows/maintenance-renovate-theme-sync.yml
# after `bun run theme:sync`.
#
# Idempotent: exits cleanly if theme:sync produced no diff.
#
# Usage: renovate-theme-sync-commit.sh
#
# Environment:
#   APP_SLUG    - GitHub App slug used as the bot identity in commit author
#   COMMIT_REF  - Renovate branch name being updated (used in commit message)

set -euo pipefail

: "${APP_SLUG:?APP_SLUG is required}"
: "${COMMIT_REF:?COMMIT_REF is required}"

if git diff --quiet -- 'src/themes/packs/*.synced.ts'; then
  echo "No theme sync changes — nothing to commit."
  exit 0
fi

git config user.name "${APP_SLUG}[bot]"
git config user.email "${APP_SLUG}[bot]@users.noreply.github.com"
git add -- 'src/themes/packs/*.synced.ts'
git commit -m "chore(deps): regenerate synced themes for ${COMMIT_REF}"
git push
