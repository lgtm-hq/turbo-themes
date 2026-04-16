#!/usr/bin/env bash
# Run lintro check and capture output for PR comment generation.
# Sets CHK_EXIT_CODE in GITHUB_ENV for downstream steps.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=../utils/utils.sh
source "${SCRIPT_DIR}/../utils/utils.sh"

log_info "Running lintro check..."

set +eo pipefail
uv run lintro check 2>&1 | tee chk-output.txt
EXIT_CODE=${PIPESTATUS[0]}
set -eo pipefail

if [[ -n "${GITHUB_ENV:-}" ]]; then
    echo "CHK_EXIT_CODE=$EXIT_CODE" >> "$GITHUB_ENV"
fi

log_info "lintro check completed (exit code: $EXIT_CODE)"
