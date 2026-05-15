#!/usr/bin/env bash
# Enable auto-merge (squash) on a release version pull request.
set -euo pipefail

: "${PR_NUMBER:?PR_NUMBER is required}"
: "${GH_TOKEN:?GH_TOKEN is required}"

gh pr merge "${PR_NUMBER}" --auto --squash
