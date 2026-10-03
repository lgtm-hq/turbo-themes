# Composite Actions

This directory contains reusable composite actions for the turbo-themes project.

## 📋 Available Actions

### `setup-env`

Set up Bun, Node.js, Ruby, and Python (uv) with dependency caching.

**Purpose:** Reduce duplication across workflows by providing a standardized environment
setup.

**Inputs:**

- `bun-version` (optional): Bun version override. Leave empty (default) to use the
  `packageManager` pin in the root `package.json`
- `node-version` (optional): Node.js version to use (default: `22`)
- `ruby-version` (optional): Ruby version to use (default: `3.4.7`)
- `skip-ruby` (optional): Skip Ruby setup (default: `false`)

**Usage:**

```yaml
- name: Setup environment
  uses: ./.github/actions/setup-env
  with:
    node-version: '22'
    ruby-version: '3.4.7'
```

**What it does:**

1. Sets up Bun at the version pinned in `package.json` (`packageManager`)
2. Sets up Node.js and, unless `skip-ruby` is set, Ruby (with bundler cache)
3. Installs uv and Python, then the CI dependencies
4. Installs Node.js dependencies with `bun install --frozen-lockfile` (with retry)

### `setup-bun`

Install Bun and project dependencies only.

**Inputs:**

- `bun-version` (optional): Bun version override. Leave empty (default) to use the
  `packageManager` pin in the root `package.json`
- `frozen-lockfile` (optional): Fail if `bun.lock` needs an update (default: `true`)

### Bun version pin

Bun is pinned once, in the root `package.json`:

```json
"packageManager": "bun@1.4.2"
```

Both composite actions and every workflow that calls `oven-sh/setup-bun` directly read
it via `bun-version-file: package.json`. Renovate also reads the `packageManager` field
as the bun constraint when it regenerates `bun.lock`, so CI and lockfile maintenance
always use the same bun.

The `Dockerfile` must contain exactly one bun source, an unquoted

`COPY --from=oven/bun:<semver>[-<variant>]@sha256:<64 hex>`

line whose `<semver>` matches `packageManager`. Renovate bumps that image in
the same grouped `bun` PR. `scripts/ci/check-bun-version-sync.sh` enforces
the contract with a line scan, not a Dockerfile parser. Any other `oven/bun`
mention (quoted, backslash-split, registry-prefixed, `FROM`, `ADD`,
`RUN --mount`, `ARG`, `ENV`) fails. So does a `FROM` / `COPY --from` /
`ADD --from` / `--mount from=` operand that is empty or uses `$`, quotes, or
backslashes. Backslash continuations are joined first; `# escape=` is
rejected. `PATH=/opt/bun:$PATH` and other non-image `/bun:` paths are not
treated as image refs. The scan catches image drift. It does not catch
deliberate non-image installs (`ADD` of a release URL, `curl | sh`,
`npm i -g bun`, or a bun image under another namespace with no tag).

Do not hard-code `bun-version` in workflows; pass the `bun-version` input only for
deliberate, temporary experiments.

---

### `post-pr-comment`

Post or update a comment on a pull request.

**Purpose:** Provide consistent PR commenting with merge-update support to avoid comment
spam.

**Inputs:**

- `github-token` (required): GitHub token for authentication
- `marker` (required): Unique identifier for the comment (e.g., `coverage-report`)
- `comment-body` (required): The comment content (supports markdown)
- `update-mode` (optional): `replace` or `append` (default: `replace`)

**Usage:**

```yaml
- name: Post coverage comment
  uses: ./.github/actions/post-pr-comment
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    marker: 'coverage-report'
    comment-body: |
      ## Coverage Report
      - Lines: 85%
      - Branches: 78%
    update-mode: replace
```

**What it does:**

1. Searches for existing comment with the specified marker
2. Updates existing comment or creates new one
3. Prevents duplicate comments with the same marker

---

## 🎯 Benefits

### Reduces Duplication

Instead of repeating 10+ lines of setup code in every workflow, use a single action
call.

**Before:**

```yaml
- uses: actions/setup-node@49933ea5288caeca8642d1e84afbd3f7d6820020 # v4
  with:
    node-version: '22'
    cache: npm
- uses: ruby/setup-ruby@d5126b9b3579e429dd52e51e68624dda2e05be25 # v1.267.0
  with:
    ruby-version: '3.3'
    bundler-cache: true
- run: npm ci
```

**After:**

```yaml
- uses: ./.github/actions/setup-env
```

### Consistency

All workflows use identical environment setup, reducing configuration drift.

### Maintainability

Update environment setup once, and all workflows benefit automatically.

## 📚 Creating New Composite Actions

### Directory Structure

```
.github/actions/
└── action-name/
    └── action.yml
```

### Template

```yaml
---
name: Action Name
description: Brief description of what this action does

inputs:
  input-name:
    description: 'Description of the input'
    required: true
    default: 'optional-default-value'

outputs:
  output-name:
    description: 'Description of the output'
    value: ${{ steps.step-id.outputs.value }}

runs:
  using: composite
  steps:
    - name: Step description
      shell: bash
      run: |
        echo "Action logic here"
```

### Best Practices

1. **Clear Naming:** Use descriptive action and input names
2. **Documentation:** Include comprehensive description and usage examples
3. **Defaults:** Provide sensible defaults for optional inputs
4. **Error Handling:** Handle edge cases gracefully
5. **Shell Specification:** Always specify `shell: bash` for run steps
6. **Testing:** Test actions in a workflow before widespread use

## 🔗 Related Documentation

- [GitHub Actions Composite Actions Docs](https://docs.github.com/en/actions/creating-actions/creating-a-composite-action)
- [Workflows README](../workflows/README.md)
- [Scripts README](../../scripts/README.md)

## 📞 Support

For questions about composite actions:

1. Review this README
2. Check the action's `action.yml` file for inline documentation
3. Create an issue for clarification

---

**Last Updated:** 2025-10-05  
**Maintained by:** @TurboCoder13
