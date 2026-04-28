#!/usr/bin/env bash
# Run lintro check inside the py-lintro Docker image and capture output for
# PR comment generation. Sets CHK_EXIT_CODE in GITHUB_ENV for downstream steps.
#
# Required env: LINTRO_IMAGE (e.g. ghcr.io/lgtm-hq/py-lintro:0.61.0@sha256:...)
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=../utils/utils.sh
source "${SCRIPT_DIR}/../utils/utils.sh"

LINTRO_IMAGE="${LINTRO_IMAGE:?LINTRO_IMAGE env var must be set}"

log_info "Running lintro check via ${LINTRO_IMAGE}..."

set +eo pipefail
docker run --rm --user "$(id -u):$(id -g)" -e HOME=/tmp \
  -v "$PWD:/code" -w /code "${LINTRO_IMAGE}" \
  lintro check --output-format grid 2>&1 | tee chk-output.txt
EXIT_CODE=${PIPESTATUS[0]}
set -eo pipefail

if [[ -n "${GITHUB_ENV:-}" ]]; then
  echo "CHK_EXIT_CODE=$EXIT_CODE" >>"$GITHUB_ENV"
fi

log_info "lintro check completed (exit code: $EXIT_CODE)"
