#!/usr/bin/env bash
# Log and exit successfully when the version PR workflow should skip after a release commit.
set -euo pipefail

echo "Skipping version PR - last commit was a release (prevents infinite loop)"
