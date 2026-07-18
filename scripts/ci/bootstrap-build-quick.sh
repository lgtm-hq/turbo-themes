#!/usr/bin/env bash
# Bootstrap the toolchain on a bare Node.js runner, then run the quick CI
# pipeline. Used as the build-command for the lgtm-ci reusable-build-artifact
# caller in quality-ci-main.yml, which provisions Node.js only — the pipeline
# itself needs bun (package manager) and uv (lintro lint gate, Python tests).
# Usage: bootstrap-build-quick.sh

set -euo pipefail

if ! command -v bun >/dev/null 2>&1; then
  echo "Installing bun..."
  npm install -g bun
fi
echo "bun version: $(bun --version)"

if ! command -v uv >/dev/null 2>&1; then
  echo "Installing uv..."
  curl -LsSf https://astral.sh/uv/install.sh | sh
  export PATH="${HOME}/.local/bin:${PATH}"
fi
echo "uv version: $(uv --version)"

./scripts/local/build.sh --quick
