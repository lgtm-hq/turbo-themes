#!/usr/bin/env bash
# SPDX-License-Identifier: MIT
# Purpose: Regenerate all committed generated artifacts through the
# lockfile-pinned toolchain, then fail if any differ from the committed
# versions (single code path for local writer flow and the CI gate).
#
# Usage: ./scripts/ci/check-generated-drift.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

bun run build
bun run generate:types
bun run build:js:dev
bun run build:js:prod

exec "${SCRIPT_DIR}/verify-generated-tokens.sh"
