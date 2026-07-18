#!/usr/bin/env bash
# SPDX-License-Identifier: MIT
# Purpose: Regenerate version-stamped committed artifacts after a version
# bump so the release PR carries them fresh (tokens are updated by
# compute-next-version.mjs; the IIFE selector bundles embed the tokens
# payload and must be rebuilt).
#
# Usage: ./scripts/ci/regenerate-release-artifacts.sh

set -euo pipefail

bun run build
bun run build:js:dev
bun run build:js:prod
