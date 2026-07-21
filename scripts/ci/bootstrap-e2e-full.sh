#!/usr/bin/env bash
# Full-suite E2E entrypoint for the lgtm-ci Playwright reusable caller in
# quality-e2e.yml. The reusable provisions Node + Bun only, but the full suite's
# @visual Jekyll snapshots need `bundle exec jekyll build` during e2e:prep. The
# pre-migration job provisioned Ruby via ruby/setup-ruby (setup-env,
# skip-ruby=false); the hosted ubuntu-24.04 image exposes no ruby/bundler on
# PATH, so install them here (apt Ruby satisfies the gemspec's >= 3.1).
#
# Trailing arguments are the Playwright filter/reporter flags appended by
# lgtm-ci's run-playwright-tests.sh; forward them to the playwright command.
# Usage: bootstrap-e2e-full.sh [playwright-args...]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=scripts/ci/ensure-e2e-ruby.sh
source "${SCRIPT_DIR}/ensure-e2e-ruby.sh"
ensure_e2e_ruby

# Heavy prep build up front: the playwright.config webServer timeout (120s) is
# too short for a cold e2e:prep, so the webServer then only serves the dist.
bun run e2e:prep

exec bun run e2e:ci "$@"
