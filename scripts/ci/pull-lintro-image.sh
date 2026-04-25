#!/usr/bin/env bash
# Pull the py-lintro Docker image and tag it for local use.
# The LINTRO_IMAGE env var is set by the workflow (e.g. ghcr.io/lgtm-hq/py-lintro:0.60.2).
#
# Usage: pull-lintro-image.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=../utils/utils.sh
source "${SCRIPT_DIR}/../utils/utils.sh"

LINTRO_IMAGE="${LINTRO_IMAGE:?LINTRO_IMAGE env var must be set}"

require_command docker

log_info "Pulling ${LINTRO_IMAGE}..."
docker pull "${LINTRO_IMAGE}"

# Tag as py-lintro:latest for scripts that reference the local name
docker tag "${LINTRO_IMAGE}" py-lintro:latest
log_success "Tagged ${LINTRO_IMAGE} as py-lintro:latest"
