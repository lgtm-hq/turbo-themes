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

if ! command -v ruby >/dev/null 2>&1; then
  echo "Installing Ruby via apt..."
  sudo apt-get update -y
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends ruby-full
fi
echo "ruby: $(ruby --version)"

if ! command -v bundle >/dev/null 2>&1; then
  echo "Installing bundler..."
  sudo gem install bundler --no-document
fi
echo "bundler: $(bundle --version)"

# Vendor the bundle locally so `bundle exec jekyll build` (prepare-examples.mjs)
# resolves gems without writing to system paths.
bundle config set --local path vendor/bundle
bundle install

# Heavy prep build up front: the playwright.config webServer timeout (120s) is
# too short for a cold e2e:prep, so the webServer then only serves the dist.
bun run e2e:prep

exec bun run e2e:ci "$@"
