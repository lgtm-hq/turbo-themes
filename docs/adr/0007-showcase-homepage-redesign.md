# 0007. Replace Noir Editorial Home Page with Showcase Redesign

Date: 2026-07-20

## Status

Accepted

## Context

The site home page was redesigned to the "Noir Editorial" look in #609, which merged
roughly three weeks before this decision. After shipping, the maintainer rejected the
Noir Editorial design. A replacement — the "showcase" redesign, properized from the
maintainer's prototype — exists as a WIP baseline on the `feat/homepage-redesign-v2`
branch (commit `e87b582`): lint-clean, builds, full test suite green.

Without a written record, the homepage churning twice in one quarter looks mysterious,
and the constraints agreed for the replacement live only in conversation history. The
design decisions were grilled and recorded on 2026-07-20 (see the epic #689 summary),
and this ADR captures them so they are citable in review on every M1 pull request.

### Requirements

- Explain why Noir Editorial (#609) is being replaced so soon after shipping
- Record the binding constraints the showcase redesign must satisfy
- Keep every required CI check green throughout the migration (Lintro quality, build,
  e2e + smoke + a11y, examples, SBOM, CodeQL, security audit, action pinning, semantic
  title)

### Alternatives Considered

1. **Keep Noir Editorial**: Rejected by the maintainer; iterating on a rejected design
   would not converge on the desired direction
2. **Incrementally restyle Noir toward the showcase look**: Prolongs churn and forces
   every intermediate state through visual-regression rebaselines; a single atomic swap
   is cheaper and clearer
3. **Ship the prototype as-is**: The prototype was not production-quality; it required
   properizing (extracted CSS, TypeScript with tests, a11y and performance gates) before
   replacing the live page

## Decision

Replace the Noir Editorial home page entirely with the showcase redesign, using the WIP
baseline on `feat/homepage-redesign-v2` (commit `e87b582`) as the design source of
truth, delivered via the epic #689 (milestone M1, atomic swap in #683).

The following constraints are binding on all showcase homepage work:

- **Lighthouse CI budgets hold**: The showcase page must pass the existing Lighthouse CI
  performance budgets — the redesign is not an excuse to regress them
- **Axe-gated accessibility**: The page must pass the axe-based a11y checks in CI;
  accessibility violations block merge
- **Lazy theme-CSS loading**: Theme stylesheets are loaded lazily on demand. The page
  must not eagerly emit ~25 per-theme `<link rel="stylesheet">` tags, which would blow
  the Lighthouse budgets
- **theme-selector is the sole theming engine**: All theme switching goes through the
  `theme-selector` package; the showcase page must not introduce a parallel or ad-hoc
  theming mechanism
- **data-testid contract continuity**: Existing `data-testid` hooks used by the e2e
  suite are preserved so tests keep passing across the swap; visual snapshots are
  rebaselined as part of the migration

Key implementation details from the grilled decision record: full Noir replacement (no
hybrid); page CSS extracted to `home.css`; the showcase script written in TypeScript
with tests.

## Consequences

### Positive

- Homepage design churn is explained and documented, not mysterious
- Constraints are citable in review on every M1 pull request
- Performance (Lighthouse budgets) and accessibility (axe) gates are locked in before
  the swap, preventing regressions from landing with the redesign
- A single theming engine (`theme-selector`) avoids divergent theme-switching logic

### Negative

- Two homepage redesigns in one quarter cost duplicated design and review effort
- Visual-regression snapshots must be rebaselined for the new page
- The Noir Editorial work from #609 is discarded rather than iterated on

### Neutral

- The swap is atomic (#683), gated behind the preparatory issues in M1; the live page
  keeps the Noir design until then
- Site-wide rollout and polish follow in M2 of the epic #689
- This ADR should be updated if the showcase baseline diverges materially from `e87b582`
  before the swap lands

## References

- GitHub PR: #609 (Noir Editorial home page — superseded design)
- GitHub Epic: #689 (showcase homepage redesign v2), including the grilled decision
  record summary (2026-07-20)
- GitHub Issue: #678 (this ADR)
- WIP baseline: branch `feat/homepage-redesign-v2`, commit `e87b582`
- [ADR-0005: CSS-Only Theme Switching to Eliminate FOUC](0005-css-only-theme-switching.md)
