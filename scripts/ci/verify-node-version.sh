#!/usr/bin/env bash
# Verify Node.js version matches the requested version
# Usage: verify-node-version.sh [EXPECTED_VERSION]

set -euo pipefail

EXPECTED_VERSION="${1:-22}"

echo "Requested Node.js version: $EXPECTED_VERSION"
echo "Actual Node.js version: $(node --version)"
echo "NPM version: $(npm --version)"

# Accept a major (22), major.minor (22.23) or exact (22.23.4) request:
# the actual version must equal it or extend it at a dot boundary.
ACTUAL_VERSION="$(node --version)"
ACTUAL_VERSION="${ACTUAL_VERSION#v}"
if [[ "$ACTUAL_VERSION" != "$EXPECTED_VERSION" && "$ACTUAL_VERSION" != "$EXPECTED_VERSION".* ]]; then
  echo "Error: Node.js version mismatch. Expected v$EXPECTED_VERSION(.x), got v$ACTUAL_VERSION"
  exit 1
fi

echo "✅ Node.js version verified successfully"
