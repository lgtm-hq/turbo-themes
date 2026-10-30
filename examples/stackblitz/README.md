# StackBlitz Templates

Optimized, minimal examples designed for fast loading in StackBlitz.

## Available Templates

| Template                        | Description                  | Try It                                                                                                              |
| ------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| [html-vanilla](./html-vanilla/) | Zero-dependency vanilla JS   | [Open in StackBlitz](https://stackblitz.com/github/lgtm-hq/turbo-themes/tree/main/examples/stackblitz/html-vanilla) |
| [react](./react/)               | React 18 + TypeScript + Vite | [Open in StackBlitz](https://stackblitz.com/github/lgtm-hq/turbo-themes/tree/main/examples/stackblitz/react)        |
| [vue](./vue/)                   | Vue 3 + TypeScript + Vite    | [Open in StackBlitz](https://stackblitz.com/github/lgtm-hq/turbo-themes/tree/main/examples/stackblitz/vue)          |
| [tailwind](./tailwind/)         | Tailwind CSS + Vite          | [Open in StackBlitz](https://stackblitz.com/github/lgtm-hq/turbo-themes/tree/main/examples/stackblitz/tailwind)     |
| [bootstrap](./bootstrap/)       | Bootstrap 5 + SCSS + Vite    | [Open in StackBlitz](https://stackblitz.com/github/lgtm-hq/turbo-themes/tree/main/examples/stackblitz/bootstrap)    |

## Purpose

These templates are:

- **Minimal**: Only essential files for quick StackBlitz loading
- **Self-contained**: Use CDN or npm package directly
- **Interactive**: Fully functional theme switching demos

For more complete examples with tests and additional features, see the
[main examples directory](../).

## Differences from Main Examples

| Feature       | StackBlitz Templates | Main Examples         |
| ------------- | -------------------- | --------------------- |
| File count    | Minimal (3-7 files)  | Complete (10+ files)  |
| Tests         | CI build/asset smoke | Full Playwright tests |
| Documentation | Inline comments      | Separate README       |
| Dependencies  | Pinned theme, ranges | Pinned versions       |
| Build config  | Simplified           | Production-ready      |

## Usage

1. Click "Open in StackBlitz" link above
2. Wait for dependencies to install
3. Use the theme selector to switch themes
4. Explore the code to see how it works

## Local Development

The four Vite templates require **Node.js >=22.12.0** (matching the published package)
and Bun. CI uses Node 22 and the repository's pinned Bun version. They are standalone
consumers of the published `@lgtm-hq/turbo-themes` package, not root-workspace examples;
no root install or local package build is needed.

```bash
cd examples/stackblitz/react  # or bootstrap, tailwind, vue
bun install
bun run dev
bun run build
```

CSS is imported through the package's public `css/core`, `css/base` (React/Vue) and
`css/themes-all` exports. Vite emits those styles into the production assets; switching
`data-theme` selects bundled CSS without requesting `/node_modules/` at runtime. The Vue
build retains `vue-tsc` before Vite, using the same 2.2.12 version as the main Vue
example with TypeScript 5.9.3.

The templates intentionally retain their existing standalone, unlocked install contract:
there are no committed template lockfiles, and remaining semver ranges can resolve new
transitive versions. The scoped theme package is pinned; this is not a claim that the
entire transitive graph is frozen. Do not use the root workspace lockfile as a
substitute for these consumers' installs.

`quality-examples.yml` installs and builds all four exact StackBlitz directories from
the checked-out PR source in isolated directories, then checks that built HTML loads
emitted CSS with token values for every offered theme. Run the same focused contract
check locally from the repository root:

```bash
node --test scripts/ci/verify-stackblitz.test.mjs
node scripts/ci/verify-stackblitz-build.mjs examples/stackblitz/react
```

The second command requires a completed template build. This asset smoke check is not a
browser compatibility matrix. Vite 6 and all existing browser build targets remain
unchanged (`esnext` for Bootstrap/React/Vue, Vite's default for Tailwind); the Node
requirement describes tooling, not browser support.
