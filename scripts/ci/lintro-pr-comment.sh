#!/usr/bin/env bash
# Generate a PR comment from lintro check output (chk-output.txt).
# Reads CHK_EXIT_CODE from the environment to determine pass/fail status.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=../utils/utils.sh
source "${SCRIPT_DIR}/../utils/utils.sh"

if [[ "${GITHUB_EVENT_NAME:-}" != "pull_request" ]]; then
    log_info "Not a pull_request event, skipping comment generation"
    exit 0
fi

# Extract execution summary section from chk-output.txt
if [[ -f chk-output.txt ]]; then
    start_line=$(grep -n "EXECUTION SUMMARY" chk-output.txt | head -n1 | cut -d: -f1 || true)
    if [[ -n "${start_line:-}" ]]; then
        tail -n +"$start_line" chk-output.txt > chk-summary.txt || true
    else
        tail -n 50 chk-output.txt > chk-summary.txt || true
    fi
fi

if [[ -f chk-summary.txt ]]; then
    OUTPUT=$(cat chk-summary.txt)
else
    OUTPUT="❌ Analysis failed — check the CI logs for details"
fi

# GitHub PR comment max is 65536 chars; cap well below to leave room for
# wrapper markdown, status header, and footer.
MAX_BYTES="${LINTRO_COMMENT_MAX_BYTES:-60000}"
if (( ${#OUTPUT} > MAX_BYTES )); then
    OUTPUT="${OUTPUT:0:MAX_BYTES}

…[truncated — see CI logs for full output]"
fi

# Escape backticks to prevent breaking out of the fenced code block.
OUTPUT="${OUTPUT//\`\`\`/\`\`\` }"

if [[ "${CHK_EXIT_CODE:-1}" != "0" ]]; then
    STATUS="⚠️ ISSUES FOUND"
else
    STATUS="✅ PASSED"
fi

CONTENT="**Workflow:** 🔍 Performed code quality checks with \`lintro check\`

### 📋 Results:
\`\`\`
$OUTPUT
\`\`\`"

generate_pr_comment "Lintro Code Quality Analysis" "$STATUS" "$CONTENT" "lintro-comment.md" "lintro"
