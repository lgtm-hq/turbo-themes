#!/usr/bin/env bash
# SPDX-License-Identifier: MIT
# Purpose: Terminal failure marker for the release version-PR workflow —
# invoked when both the primary branch push and the transient-rejection
# retry have failed.
#
# Env vars:
#   SKIPPED_MERGE_QUEUE  'true' when the retry deliberately skipped the push
#                        because the release branch is already queued for
#                        merging (#817). That is a benign outcome, not a
#                        failure — every other outcome still fails loudly.

set -euo pipefail

if [ "${SKIPPED_MERGE_QUEUE:-}" = "true" ]; then
  echo "⏭️  Release branch push skipped — the branch is already in the merge queue."
  exit 0
fi

echo "❌ Release branch push failed — primary attempt and transient retry both failed." >&2
exit 1
