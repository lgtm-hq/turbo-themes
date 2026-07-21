#!/usr/bin/env bash
# Linux visual-snapshot regeneration for maintenance-generate-snapshots.yml.
#
# Mirrors bootstrap-e2e-full.sh (same Ruby/apt path and e2e:prep) so generated
# baselines match what quality-e2e.yml's verification job renders. Runs only the
# @visual suite with --update-snapshots.
#
# Usage: bootstrap-e2e-snapshots.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=scripts/ci/ensure-e2e-ruby.sh
source "${SCRIPT_DIR}/ensure-e2e-ruby.sh"
ensure_e2e_ruby

bun run e2e:prep

export UPDATE_SNAPSHOTS=1
exec bun run e2e --update-snapshots --grep @visual
