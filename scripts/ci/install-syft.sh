#!/usr/bin/env bash
# Install Syft (SBOM generator)
# Usage: install-syft.sh

set -euo pipefail

SYFT_VERSION="1.42.3"
# Pinned to v1.42.3 commit SHA for supply chain safety
SYFT_COMMIT="860126c650c2d05b63b83a3895e41268162315a3"

mkdir -p .bin
curl -sSfL "https://raw.githubusercontent.com/anchore/syft/${SYFT_COMMIT}/install.sh" | sh -s -- -b ./.bin "v${SYFT_VERSION}"
echo "$(pwd)/.bin" >>"$GITHUB_PATH"
