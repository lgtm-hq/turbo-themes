# 0006. Generate theme metadata maps from token schema at build time

Date: 2026-07-18

## Status

Accepted

## Context

Theme metadata (vendor order, family labels, icon paths, flavor descriptions) was
hand-maintained across `packages/core`, `packages/theme-selector`, and `apps/site`.
Adding a theme required updating four or more files, and docs drifted from the real
theme list.

Issue #278 investigated unified metadata architecture. The chosen direction (Option C —
Hybrid) keeps Style Dictionary for tokens/CSS and adds a dedicated codegen script for
metadata maps. Schema JSON files remain the single source of truth; a separate
`themes.config.ts` is intentionally not introduced.

## Decision

1. Extend `schema/tokens/themes/*.tokens.json` with optional `description` and `icon`
   fields, and add `schema/tokens/_vendors.json` for curated vendor order, family
   metadata, and default icons.
2. Add `scripts/codegen/generate-metadata.mjs` that emits:
   - `packages/core/src/themes/generated/metadata.ts` (`ThemeId`, `VENDOR_ORDER`,
     per-theme descriptions/icons, vendor family meta)
   - `packages/theme-selector/src/generated/theme-maps.ts` (`THEME_FAMILIES`,
     `VENDOR_ICON_MAP`, `FLAVOR_DESCRIPTIONS`, …)
3. Wire generation into `bun run build:tokens` and extend
   `scripts/ci/verify-generated-tokens.sh` (invoked from CI) so stale generated files
   fail the build.
4. Consumers import generated maps instead of maintaining parallel registries.

## Consequences

### Positive

- Adding a theme is primarily “add one `.tokens.json` (+ vendor entry if new)”
- Selector and site icon/description maps stay aligned with the schema
- CI catches forgotten regenerations via the existing freshness-check pattern

### Negative

- Generated TypeScript files are committed and must be regenerated after schema edits
  (`bun run generate:metadata` or `bun run build:tokens`)
- Vendor display order remains curated in `_vendors.json` (not derived from filesystem
  sort order)

## References

- Implements: #499
- Investigation / ADR source: #278
- Related: #365 (npm-shipped icons), #497 (catalog export), #495 (`ThemeId` API)
