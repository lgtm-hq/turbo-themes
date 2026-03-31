#!/usr/bin/env bash
# Install Syft (SBOM generator)
# Usage: install-syft.sh

set -euo pipefail

SYFT_VERSION="1.42.3"
# Pinned to v1.42.3 commit SHA for supply chain safety
SYFT_COMMIT="57bb9828d86b1087a70d7439ade7d86acaa7c05d"

mkdir -p .bin
curl -sSfL "https://raw.githubusercontent.com/anchore/syft/${SYFT_COMMIT}/install.sh" | sh -s -- -b ./.bin "v${SYFT_VERSION}"
echo "$(pwd)/.bin" >>"$GITHUB_PATH"
