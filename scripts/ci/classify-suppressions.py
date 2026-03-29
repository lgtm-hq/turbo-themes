#!/usr/bin/env python3
"""Classify vulnerability suppressions as active, stale, or expired.

Adapted from py-lintro's classify-suppressions.py. Reads osv-scanner
probe output from stdin and .osv-scanner.toml from the current directory.
Outputs a JSON object with stale, expired, and active ID arrays.

Must be run inside the py-lintro Docker image (requires lintro.parsers).

Usage:
    osv-scanner scan --format json --config /dev/null --recursive . \
        | python3 scripts/ci/classify-suppressions.py

Exit codes:
    0 - Success (JSON printed to stdout)
    1 - Error
"""

from __future__ import annotations

import json
import sys
import traceback
from pathlib import Path


def main() -> None:
    """Entry point.

    If ``.osv-scanner.toml`` does not exist in the current directory, outputs
    ``{"stale": [], "expired": [], "active": []}`` and returns cleanly instead
    of raising an error.
    """
    from lintro.parsers.osv_scanner import parse_osv_scanner_output
    from lintro.parsers.osv_scanner.suppression_parser import (
        classify_suppressions,
        parse_suppressions,
    )

    toml_path = Path(".osv-scanner.toml")
    if not toml_path.exists():
        # No suppression config found; emit an empty classification and exit.
        print(json.dumps({"stale": [], "expired": [], "active": []}))
        return
    entries = parse_suppressions(toml_path)

    probe_output = sys.stdin.read()
    probe_issues = parse_osv_scanner_output(probe_output)
    probe_ids = {i.vuln_id for i in probe_issues}

    classified = classify_suppressions(entries, probe_ids)

    result = {
        "stale": [c.entry.id for c in classified if c.status.value == "stale"],
        "expired": [c.entry.id for c in classified if c.status.value == "expired"],
        "active": [c.entry.id for c in classified if c.status.value == "active"],
    }
    print(json.dumps(result))


if __name__ == "__main__":
    try:
        main()
    except Exception:
        traceback.print_exc(file=sys.stderr)
        sys.exit(1)
