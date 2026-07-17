#!/usr/bin/env bash
set -euo pipefail

# Generate SHA256 checksum for the npm tarball produced by `npm pack`.
# Writes sha256 and tarball outputs to $GITHUB_OUTPUT.

npm pack --dry-run 2>&1 | tee pack-output.txt

# Use tail -1 to capture only the tarball filename, skipping prepare-script output.
TARBALL=$(npm pack 2>/dev/null | tail -1)

if [ ! -f "$TARBALL" ]; then
  echo "❌ Tarball not found: $TARBALL"
  exit 1
fi

SHA256=$(sha256sum "$TARBALL" | cut -d' ' -f1)

echo "sha256=$SHA256" >>"$GITHUB_OUTPUT"
echo "tarball=$TARBALL" >>"$GITHUB_OUTPUT"

echo "📋 Tarball : $TARBALL"
echo "📋 SHA256  : $SHA256"
