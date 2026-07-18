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

# Pinned uv release with checksum verification (no curl | sh), consistent
# with the repo's SHA-pinning posture. Bump version + sha256 together.
UV_VERSION="0.11.29"
UV_SHA256="04f8b82f5d47f0512dcd32c67a4a6f16a0ea27c81537c338fd0ad6b23cebe829"
UV_TARBALL="uv-x86_64-unknown-linux-gnu.tar.gz"

if ! command -v uv >/dev/null 2>&1; then
  echo "Installing uv ${UV_VERSION}..."
  tmpdir="$(mktemp -d)"
  curl -LsSf -o "${tmpdir}/${UV_TARBALL}" \
    "https://github.com/astral-sh/uv/releases/download/${UV_VERSION}/${UV_TARBALL}"
  echo "${UV_SHA256}  ${tmpdir}/${UV_TARBALL}" | sha256sum -c -
  tar -xzf "${tmpdir}/${UV_TARBALL}" -C "${tmpdir}"
  mkdir -p "${HOME}/.local/bin"
  install -m 0755 "${tmpdir}/uv-x86_64-unknown-linux-gnu/uv" "${HOME}/.local/bin/uv"
  rm -rf "${tmpdir}"
  export PATH="${HOME}/.local/bin:${PATH}"
fi
echo "uv version: $(uv --version)"

./scripts/local/build.sh --quick
