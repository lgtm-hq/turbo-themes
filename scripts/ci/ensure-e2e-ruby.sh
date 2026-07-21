#!/usr/bin/env bash
# Shared Ruby + Bundler provisioning for full-suite Playwright E2E paths.
#
# quality-e2e.yml's bootstrap-e2e-full.sh and maintenance-generate-snapshots.yml
# must install Ruby the same way so @visual Jekyll builds (and the surrounding
# apt packages) match between baseline generation and verification.
#
# Usage: source this file, then call ensure_e2e_ruby

set -euo pipefail

ensure_e2e_ruby() {
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
}
