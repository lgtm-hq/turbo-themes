#!/usr/bin/env bash
set -euo pipefail

# Verify the html-vanilla example has the required file and expected HTML structure.

HTML="examples/html-vanilla/index.html"

if [ ! -f "$HTML" ]; then
  echo "❌ Required file not found: $HTML"
  exit 1
fi

if ! grep -q 'id="theme-selector"' "$HTML"; then
  echo "❌ Missing expected element: id=\"theme-selector\" in $HTML"
  exit 1
fi

if ! grep -q 'id="theme-css"' "$HTML"; then
  echo "❌ Missing expected element: id=\"theme-css\" in $HTML"
  exit 1
fi

if ! grep -q 'data-theme=' "$HTML"; then
  echo "❌ Missing expected attribute: data-theme= in $HTML"
  exit 1
fi

echo "✅ HTML vanilla example verified: $HTML"
