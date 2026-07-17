#!/usr/bin/env bash
# SPDX-License-Identifier: MIT
# Purpose: Terminal failure marker for the release version-PR workflow —
# invoked when both the primary branch push and the transient-rejection
# retry have failed.

set -euo pipefail

echo "❌ Release branch push failed — primary attempt and transient retry both failed." >&2
exit 1
