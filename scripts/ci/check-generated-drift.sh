#!/usr/bin/env bash
# SPDX-License-Identifier: MIT
# Purpose: CI drift gate — regenerate all committed generated artifacts
# (same code path the release flow uses), then fail if any differ from
# the committed versions.
#
# Usage: ./scripts/ci/check-generated-drift.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

"${SCRIPT_DIR}/regenerate-release-artifacts.sh"

exec "${SCRIPT_DIR}/verify-generated-tokens.sh"
