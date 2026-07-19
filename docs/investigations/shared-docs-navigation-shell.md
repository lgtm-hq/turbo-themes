# Investigation: Shared Docs Navigation Shell

| Field      | Value                                                         |
| ---------- | ------------------------------------------------------------- |
| **Issue**  | [#505](https://github.com/lgtm-hq/turbo-themes/issues/505)    |
| **Date**   | 2026-07-18                                                    |
| **Status** | Complete (recommendation ready for review)                    |
| **Scope**  | Inventory + recommendation only — no extraction in this spike |

## Summary

Documentation navigation is duplicated across lgtm Astro sites, but the duplication
splits cleanly into **look** (token-driven CSS) vs **layout / IA** (Astro shell +
product config). turbo-themes should keep the rich app `.sidebar` and optionally add a
narrow flat-link primitive (`.turbo-docs-nav`). Dual-rail grids, section tabs, resize,
and category config stay in consumer sites (or a future docs-kit), not in
`@lgtm-hq/turbo-themes`.

**Recommendation:**

| Decision                                         | Choice                                               |
| ------------------------------------------------ | ---------------------------------------------------- |
| Layout / IA home                                 | **Option B** — reference template + intentional copy |
| Add `.turbo-docs-nav`?                           | **YES** — narrow CSS recipe (separate follow-up)     |
| Multiple sidebar _layout_ variants in turbo npm? | **NO**                                               |

## Phase 1 — Inventory

Compared read-only clones of `lgtm-hq/py-lintro` and `lgtm-hq/Rustume` (`main`, depth-1
under `/tmp/ref-repos/`) against this repo’s `apps/site` and `packages/css`.

### Layout models today

| Site                         | Layout model                                                                 | Sidebar styling                                                                                           |
| ---------------------------- | ---------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| **turbo-themes** `apps/site` | Single persistent sidebar (all categories)                                   | Turbo `.sidebar` (shadcn-style icons, nested menus, collapse) + site overrides on `.sidebar.docs-sidebar` |
| **Rustume** `apps/site`      | Single sidebar; Resources in article; standalone pages use section nav + TOC | Bespoke `.docs-sidebar` / `.sidebar-link` — does **not** use turbo `.sidebar`                             |
| **py-lintro** `apps/site`    | Dual-rail: section tabs → scoped sidebar → article + Resources → right TOC   | Same flat-link CSS family as Rustume, plus collapse/resize, `//` groups, overview link                    |

### Feature matrix

| Feature                                       | py-lintro                            | Rustume                | turbo `.sidebar` / demo docs                       | Owner                                                |
| --------------------------------------------- | ------------------------------------ | ---------------------- | -------------------------------------------------- | ---------------------------------------------------- |
| Flat doc link list (`.sidebar-link`)          | Yes                                  | Yes                    | No (uses `.sidebar-menu-*`)                        | **turbo** (candidate `.turbo-docs-nav`)              |
| Section / group headings                      | Yes (`//` groups + overview)         | Yes (category titles)  | Nested menu buttons + icons                        | **turbo** (group/label recipe) vs **product** labels |
| Collapsible groups                            | Yes (`<details>`)                    | No                     | Yes (menu `data-open`)                             | **docs-kit / consumer** (behavior); turbo can style  |
| All-categories sidebar                        | No (scoped to current section)       | Yes                    | Yes                                                | **docs-kit / consumer** (IA)                         |
| Section tabs (`DocsSectionTabs`)              | Yes                                  | No                     | No                                                 | **docs-kit / consumer**                              |
| Dual-rail grid + drag resize                  | Yes                                  | No                     | Partial (`sidebar-rail` exists but unused by docs) | **docs-kit / consumer**                              |
| Collapse FAB / hide sidebar                   | Yes                                  | No                     | Collapse trigger + mobile drawer                   | **docs-kit / consumer**                              |
| Header `NavDropdown`                          | Yes (byte-identical to Rustume)      | Yes                    | No (different header)                              | **docs-kit / consumer**                              |
| `DocsResources` + `collectDocResources`       | Yes                                  | Yes (near-copy)        | No                                                 | **docs-kit** (#504); not sidebar                     |
| Right TOC (“On this page”)                    | Yes (`DocsOnThisPage`, client-built) | Standalone only        | Yes (`DocsToc`, SSG headings)                      | **docs-kit / consumer**                              |
| Category enums / `docs-nav.ts`                | Yes                                  | Yes (product-specific) | Inline in `DocsSidebar.astro`                      | **product**                                          |
| `sidebar-nav.ts` group map                    | Yes                                  | No                     | No                                                 | **product** (lintro IA)                              |
| Token wiring (`--turbo-*`, `--sidebar-width`) | Yes                                  | Yes                    | Yes (`sidebar.css` tokens)                         | **turbo**                                            |

### File inventory

#### turbo-themes (this repo)

| Path                                                                           | Role                                                       |
| ------------------------------------------------------------------------------ | ---------------------------------------------------------- |
| `packages/css/src/components/sidebar.css`                                      | App-chrome sidebar primitive (exported via components CSS) |
| `apps/site/src/components/docs/DocsSidebar.astro`                              | Consumes `.sidebar` DOM; hard-coded category list          |
| `apps/site/src/layouts/DocsLayout.astro`                                       | Two-column shell + mobile drawer                           |
| `apps/site/src/components/docs/{DocsToc,Breadcrumbs,PrevNext,SearchBar}.astro` | Demo-site helpers                                          |
| `apps/site/assets/css/site.css`                                                | `.sidebar.docs-sidebar` positioning overrides              |
| `apps/site/src/pages/components.astro`                                         | Live `.sidebar` showcase (keep)                            |

#### Rustume (flat baseline)

| Path                                                                                | Role                                |
| ----------------------------------------------------------------------------------- | ----------------------------------- |
| `apps/site/src/layouts/DocsLayout.astro`                                            | Single sidebar + Resources          |
| `apps/site/src/layouts/DocsStandaloneLayout.astro`                                  | Section nav + TOC (no left rail)    |
| `apps/site/src/components/docs/DocsSidebar.astro`                                   | Flat links for all core categories  |
| `apps/site/src/components/docs/{DocsResources,DocsSectionNav,DocsOnThisPage}.astro` | Shared patterns                     |
| `apps/site/src/components/NavDropdown.astro`                                        | Header mega-menu                    |
| `apps/site/src/data/docs-nav.ts`                                                    | Categories, navbar groups           |
| `apps/site/src/styles/global.css`                                                   | `.docs-sidebar`, `.sidebar-link`, … |

#### py-lintro (dual-rail reference)

| Path                                                                 | Role                                     |
| -------------------------------------------------------------------- | ---------------------------------------- |
| `apps/site/src/layouts/DocsLayout.astro`                             | `docs-shell` + tabs + dual-rail          |
| `apps/site/src/components/docs/DocsSectionTabs.astro`                | Section rail                             |
| `apps/site/src/components/docs/DocsSidebar.astro`                    | Scoped nav, groups, resize/collapse      |
| `apps/site/src/components/docs/{DocsOnThisPage,DocsResources}.astro` | TOC + Resources                          |
| `apps/site/src/components/NavDropdown.astro`                         | Identical to Rustume                     |
| `apps/site/src/data/docs-nav.ts`                                     | Categories, tab labels, overviews        |
| `apps/site/src/data/sidebar-nav.ts`                                  | Per-section group order / labels         |
| `apps/site/src/styles/global.css`                                    | Shared flat-link CSS + shell/tabs/resize |

### Shared CSS candidate for `.turbo-docs-nav`

Rustume and py-lintro share the same flat-link recipe (token-driven). Diffs are
layout/chrome only (sticky vs flex column, title weight/color). Core selectors:

```text
.docs-sidebar          → container (border, surface mix, scroll)
.sidebar-section       → category block spacing
.sidebar-section-title → uppercase mono label
.sidebar-link          → block link + left border
.sidebar-link:hover
.sidebar-link.active
```

Both use `--turbo-border-default`, `--turbo-bg-surface`, `--turbo-bg-overlay`,
`--turbo-text-*`, `--transition-fast`, and optional `--site-accent` /
`--site-accent-light` fallbacks. Neither uses turbo `.sidebar` / `.sidebar-menu-*`.

**lintro-only shell CSS** (stay out of turbo): `.docs-shell`, `.docs-section-tabs*`,
`.docs-layout` dual-rail grid, `.docs-nav-col`, `.sidebar-toggle`,
`.sidebar-resize-handle`, `.sidebar-expand-fab`, `.sidebar-nav-group`,
`.sidebar-group-*`, mobile jump `<select>`.

**turbo `.sidebar` CSS** targets a different DOM (icon menu buttons, nested sub-buttons,
collapsed rail width). Doc sites correctly avoided adopting it for flat lists — forcing
that DOM would regress IA, not dedupe CSS.

### Why `.sidebar` is the wrong density for doc sites

1. **DOM contract:** Doc sidebars are lists of `<a>`; `.sidebar` expects
   `.sidebar-menu-button` / `.sidebar-menu-sub-button` trees with icons.
2. **IA:** Dual-rail and section-scoped nav are product layout, not theme variants.
3. **Demo value:** turbo-themes should keep showcasing the rich sidebar on `/components`
   — that is the right home for app chrome.

## Phase 2 — Recommendations

### 1. Layout / IA home — **Option B**

| Option                                  | Meaning                            | Verdict    |
| --------------------------------------- | ---------------------------------- | ---------- |
| **A** `@lgtm-hq/docs-site` (or similar) | Extract Astro package              | Defer      |
| **B** Reference template + copy         | One repo is canonical; others copy | **Choose** |
| **C** Document in #504 only             | No extraction / no reference role  | Too weak   |

**Rationale for B:**

- Layout shells already **diverge** (flat all-categories vs dual-rail scoped). Packaging
  both as one “docs-kit layout” would recreate the “multiple sidebar layout variants”
  mistake inside a second package.
- Shared pieces that _are_ identical today (`NavDropdown.astro`, `DocsResources.astro`)
  are small; intentional copy + this inventory is enough until a third consumer appears
  or #504 lands a real docs-kit for Resources.
- Option C alone leaves Rustume/lintro syncing flat-link CSS forever with no turbo
  primitive and no designated reference.

**Promote B → A when:** a third lgtm Astro docs site needs the same shell, or
Resources/smart-link work (#503/#504) already creates a shared package and can absorb
`NavDropdown` / TOC without pulling dual-rail into turbo-themes.

**Canonical references (for copy):**

- Flat single sidebar: Rustume `DocsLayout` + `DocsSidebar`
- Dual-rail shell: py-lintro `DocsLayout` + `DocsSectionTabs` + scoped `DocsSidebar`
- Header dropdown: either repo’s `NavDropdown.astro` (currently identical)

### 2. Add `.turbo-docs-nav`? — **YES**

Ship a **lightweight flat nav CSS recipe** beside existing `.sidebar`, not a second
layout system:

```text
turbo-components.css
├── .sidebar              ← keep: app-style sidebar (demo, dashboards)
└── .turbo-docs-nav       ← add: flat doc link list
    ├── (root)            ← former .docs-sidebar surface/border/scroll
    ├── __section
    ├── __section-title
    ├── __link
    ├── __link:hover / .active (or [aria-current="page"])
    └── __group           ← optional: style <details> groups only
```

**Minimal class list (BEM under one root):**

| Class                                                    | Maps from consumer CSS                            |
| -------------------------------------------------------- | ------------------------------------------------- |
| `.turbo-docs-nav`                                        | `.docs-sidebar` surface + border + padding/scroll |
| `.turbo-docs-nav__section`                               | `.sidebar-section`                                |
| `.turbo-docs-nav__section-title`                         | `.sidebar-section-title`                          |
| `.turbo-docs-nav__link`                                  | `.sidebar-link`                                   |
| `.turbo-docs-nav__link:hover`                            | `.sidebar-link:hover`                             |
| `.turbo-docs-nav__link[aria-current="page"]` / `.active` | `.sidebar-link.active`                            |
| `.turbo-docs-nav__group` (optional)                      | `.sidebar-nav-group` summary chrome only          |

**Tokens to reuse / expose:** `--sidebar-width` (already in `sidebar.css`),
`--turbo-bg-surface`, `--turbo-bg-overlay`, `--turbo-border-default`,
`--turbo-text-secondary`, `--turbo-text-primary`, brand/accent for active (prefer
`--turbo-brand-primary` with consumer `--site-accent` override).

**Out of scope for the CSS PR:** dual-rail grid, tabs, resize handle, FAB, mobile
`<select>`, `NavDropdown`, Resources pipeline, category config.

**Would this let Rustume/lintro delete bespoke link CSS?** Yes for the shared
link/section rules (~40–50 lines each). They would keep shell/layout CSS (lintro
dual-rail; Rustume sticky height). Migration: wrap sidebar markup in `.turbo-docs-nav`,
rename classes, drop duplicated rules, keep product accent overrides.

### 3. Multiple sidebar layout variants in turbo-themes — **NO**

Confirmed. Do **not** ship “dual-rail variant”, “flat docs variant”, or “terminal layout
variant” as competing layout systems inside `@lgtm-hq/turbo-themes`. Theme package owns
look densities (`.sidebar` vs optional `.turbo-docs-nav`); product IA stays in consumers
/ docs-kit.

### Minimal shared API sketch (if Option A later)

Only needed if promoting to a docs-kit package — not for this spike:

```ts
// Hypothetical @lgtm-hq/docs-site public surface
export interface DocsShellProps {
  /** Product category of the current page */
  category: string;
  /** Current doc id / slug */
  slug: string;
  /** Layout density: flat all-categories vs section-scoped */
  mode: 'flat' | 'section-scoped';
  /** Optional right TOC */
  toc?: boolean;
  resources?: DocResource[];
}

export interface CategoryConfig {
  key: string;
  label: string;
  tabLabel?: string;
  overviewId?: string;
}

export interface NavGroup {
  key: string;
  label: string;
  docs: { id: string; title: string; href: string }[];
}

// Astro components (consumer supplies CategoryConfig[] / NavGroup[])
// <DocsShell>, <DocsSectionTabs>, <DocsSidebar>, <DocsOnThisPage>,
// <DocsResources>, <NavDropdown>
```

Config hooks stay product-owned: `docs-nav.ts` category enums, overview slugs,
`sidebar-nav.ts` group maps, coverage links.

### Migration path

1. **turbo-themes:** land `.turbo-docs-nav` CSS (follow-up issue below); keep demo on
   rich `.sidebar`.
2. **Rustume:** adopt `.turbo-docs-nav` classes; delete duplicated `.sidebar-link*`
   rules; leave single-sidebar layout as-is.
3. **py-lintro:** same CSS adoption for link/section chrome; keep dual-rail / tabs /
   resize in site CSS.
4. **Later:** if a third site appears, extract Astro shell pieces to Option A using
   lintro (dual-rail) + Rustume (flat) as fixtures — not turbo-themes.

## Phase 3 — Follow-up issues (documented; not opened)

GitHub issue creation is not available to this agent token (`permissions` lack `triage`
/ issues write). Open these manually after reviewing this spike.

### Follow-up 1 — `feat(css): add .turbo-docs-nav flat docs nav primitive`

**Should open?** **Yes** — investigation confirms meaningful CSS overlap and a clean
boundary from `.sidebar`.

**Acceptance criteria:**

- [ ] Add `.turbo-docs-nav` (+ section / title / link / active states) to `packages/css`
      components CSS alongside existing `.sidebar`
- [ ] Use existing turbo tokens; document optional `--site-accent` override
- [ ] Optional `__group` styles for `<details>` summaries — no layout grid
- [ ] Unit / visual coverage consistent with other component CSS tests
- [ ] Document in CSS README + link from Astro integration guide (§ below)
- [ ] **Do not** add dual-rail, tabs, resize, or Astro components to the npm package
- [ ] Demo site may show a small flat-nav sample; docs IA need not migrate yet

### Follow-up 2 — docs-kit Astro package (Option A)

**Should open?** **Not yet.** Revisit after #503/#504 and/or a third consumer. If opened
later, acceptance should require fixtures for both `flat` and `section-scoped` modes
without depending on turbo layout CSS beyond `.turbo-docs-nav`.

### Follow-up 3 — extract `NavDropdown` / Resources only

Covered by #504 (Resources / cross-page links) and related smart-link work (#503). Keep
separate from sidebar CSS.

## Cross-links

- Issue: [#505](https://github.com/lgtm-hq/turbo-themes/issues/505)
- Related: #502 (Terminal flavor), #503 (smart-link CSS), #504 (Astro / Resources
  docs-kit notes)
- Astro integration guide: [astro-github-pages.md][astro-guide]
- turbo sidebar CSS: [sidebar.css][sidebar-css]
- py-lintro dual-rail: `apps/site/src/layouts/DocsLayout.astro` (+ `components/docs/*`,
  `data/docs-nav.ts`, `data/sidebar-nav.ts`)
- Rustume flat sidebar: `apps/site/src/layouts/DocsLayout.astro` (+
  `components/docs/DocsSidebar.astro`)

## Explicit answers checklist

| Deliverable                            | Answer                                   |
| -------------------------------------- | ---------------------------------------- |
| Inventory table                        | See Phase 1                              |
| Docs-kit vs reference vs docs-only     | **Option B** (reference + copy); defer A |
| Add `.turbo-docs-nav`?                 | **YES** — minimal BEM list above         |
| Multiple layout variants in turbo npm? | **NO**                                   |
| Minimal API if docs-kit                | Sketch in Phase 2                        |
| Follow-up implementation issue         | Documented (Follow-up 1); open manually  |
| Cross-link from Astro guide to #505    | Added in same change set                 |

[astro-guide]: ../../apps/site/src/content/docs/integrations/astro-github-pages.md
[sidebar-css]: ../../packages/css/src/components/sidebar.css
