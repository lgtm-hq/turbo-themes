#!/usr/bin/env bash
# Bootstrap the toolchain on a bare Node.js runner, then run the quick CI
# pipeline. Used as the build-command for the lgtm-ci reusable-build-artifact
# caller in quality-ci-main.yml, which provisions Node.js only — the pipeline
# itself needs bun (package manager) and uv (lintro lint gate, Python tests).
# Usage: bootstrap-build-quick.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"

# Bun version comes from "packageManager" in the root package.json, the single
# pin shared with setup-env/setup-bun and the Dockerfile (see #1060).
BUN_PIN=$(sed -n 's/.*"packageManager": *"bun@\([^"+]*\)[^"]*".*/\1/p' "${ROOT_DIR}/package.json" | head -1)
if [[ -z "${BUN_PIN}" ]]; then
  echo "❌ No \"packageManager\": \"bun@<version>\" in ${ROOT_DIR}/package.json"
  exit 1
fi

if ! command -v bun >/dev/null 2>&1 || [[ "$(bun --version)" != "${BUN_PIN}" ]]; then
  echo "Installing bun ${BUN_PIN}..."
  npm install -g "bun@${BUN_PIN}"
  hash -r
fi

BUN_ACTUAL="$(bun --version)"
echo "bun version: ${BUN_ACTUAL}"
if [[ "${BUN_ACTUAL}" != "${BUN_PIN}" ]]; then
  echo "❌ bun ${BUN_ACTUAL} on PATH does not match packageManager pin ${BUN_PIN}"
  exit 1
fi

# Dockerfile oven/bun image must match the same pin.
"${SCRIPT_DIR}/check-bun-version-sync.sh" "${ROOT_DIR}"

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
