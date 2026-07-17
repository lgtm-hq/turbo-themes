# Content Security Policy (CSP) Guide

This guide covers recommended Content Security Policy headers for deployments that serve
turbo-themes — whether you are hosting the Astro demo/docs site or embedding
turbo-themes stylesheets in your own application.

## Table of Contents

- [Baseline CSP](#baseline-csp)
- [Google Fonts](#google-fonts)
- [Inline Script Handling](#inline-script-handling)
  - [What inline scripts turbo-themes uses](#what-inline-scripts-turbo-themes-uses)
  - [Nonce-based CSP (recommended)](#nonce-based-csp-recommended)
  - [Hash-based CSP (static builds)](#hash-based-csp-static-builds)
  - [unsafe-inline (last resort)](#unsafe-inline-last-resort)
- [CDN Usage](#cdn-usage)
- [Platform-specific Examples](#platform-specific-examples)
  - [Nginx](#nginx)
  - [Apache](#apache)
  - [Vercel](#vercel)
  - [Netlify](#netlify)
  - [GitHub Pages](#github-pages)

---

## Baseline CSP

The following policy covers a turbo-themes deployment that loads Google Fonts, serves
its own CSS, and runs the FOUC-prevention inline script with a per-request nonce:

```
Content-Security-Policy:
  default-src 'self';
  style-src 'self' https://fonts.googleapis.com;
  font-src 'self' https://fonts.gstatic.com;
  script-src 'self' 'nonce-{random}';
  img-src 'self' data:;
  connect-src 'self';
  base-uri 'self';
  object-src 'none';
```

Replace `{random}` with a cryptographically-random, base64-encoded value that is unique
per HTTP response (see [Nonce-based CSP](#nonce-based-csp-recommended)).

If you self-host fonts (no Google Fonts), drop both `fonts.googleapis.com` and
`fonts.gstatic.com` from the policy entirely.

---

## Google Fonts

`apps/site/src/layouts/BaseLayout.astro` preconnects to and loads fonts from two Google
Fonts domains:

| Directive   | Domain                         | Purpose                          |
| ----------- | ------------------------------ | -------------------------------- |
| `style-src` | `https://fonts.googleapis.com` | Font CSS (Inter, JetBrains Mono) |
| `font-src`  | `https://fonts.gstatic.com`    | Actual font binary files         |

Both domains are required when using Google Fonts. Omitting either will block font
loading and cause a visible fallback.

Turbo-themes token files also expose a `webFonts` array pointing at
`fonts.googleapis.com`, so downstream consumers who use those tokens in their own
Astro/React/Vue apps also need these two entries.

**Self-hosted alternative:** Download the font files and serve them from your own
origin. With self-hosted fonts you can remove both external domains and add the font
file path to `font-src 'self'`.

---

## Inline Script Handling

### What inline scripts turbo-themes uses

| File                                         | Tag                                                           | `define:vars`? | Purpose                                                                      |
| -------------------------------------------- | ------------------------------------------------------------- | -------------- | ---------------------------------------------------------------------------- |
| `apps/site/src/layouts/BaseLayout.astro:85`  | `<script is:inline define:vars={{ validThemeIds }}>`          | Yes            | FOUC prevention — reads localStorage, applies saved theme before first paint |
| `apps/site/src/layouts/BaseLayout.astro:140` | `<script is:inline define:vars={{ themeNames, themeIcons }}>` | Yes            | Theme dropdown — wires click handlers, active state, and nav highlight       |
| `apps/site/src/layouts/DocsLayout.astro:92`  | `<script is:inline>`                                          | No             | Sidebar toggle — opens/closes the mobile docs navigation                     |

The two scripts that use Astro's `define:vars` are rendered with injected JavaScript
variable declarations at the top of the script block (e.g.
`const validThemeIds=[...];`). These values come from the theme metadata at build time,
which means the rendered script content changes whenever themes are added or renamed.
This matters for hash-based CSP.

The FOUC-prevention script in particular **must run synchronously and before first
paint** — it is intentionally a blocking `<script>` in `<head>`. Any CSP that blocks it
will cause a flash of unstyled/wrong-theme content.

### Nonce-based CSP (recommended)

A per-request nonce works with all three inline scripts, including the `define:vars`
ones, because the nonce travels in the HTTP header and in the `nonce` attribute on each
`<script>` element — the script content itself does not need to be known in advance.

**Steps for an Astro SSR deployment:**

1. Declare the `cspNonce` type so TypeScript knows about `Astro.locals.cspNonce`:

   ```typescript
   // src/env.d.ts  (or any file included in tsconfig)
   declare namespace App {
     interface Locals {
       cspNonce: string;
     }
   }
   ```

2. Generate a cryptographically-random nonce in server middleware:

   ```typescript
   // src/middleware.ts
   import { defineMiddleware } from 'astro:middleware';
   import crypto from 'node:crypto';

   export const onRequest = defineMiddleware((context, next) => {
     const nonce = crypto.randomBytes(16).toString('base64');
     context.locals.cspNonce = nonce;

     return next().then((response) => {
       response.headers.set(
         'Content-Security-Policy',
         [
           "default-src 'self'",
           "style-src 'self' https://fonts.googleapis.com",
           "font-src 'self' https://fonts.gstatic.com",
           `script-src 'self' 'nonce-${nonce}'`,
           "img-src 'self' data:",
           "connect-src 'self'",
           "base-uri 'self'",
           "object-src 'none'",
         ].join('; ')
       );
       return response;
     });
   });
   ```

3. Add a `nonce` attribute to every `<script is:inline>` block in your layouts so
   the browser can match the header value against the script tag:

   ```astro
   ---
   // src/layouts/BaseLayout.astro
   const nonce = Astro.locals.cspNonce;
   ---
   <!-- FOUC-prevention script — must run before first paint -->
   <script is:inline nonce={nonce} define:vars={{ validThemeIds }}>
     /* ... FOUC script body ... */
   </script>
   <!-- Theme dropdown script -->
   <script is:inline nonce={nonce} define:vars={{ themeNames, themeIcons }}>
     /* ... dropdown script body ... */
   </script>
   ```

   Apply the same `nonce={Astro.locals.cspNonce}` pattern to every `<script is:inline>`
   in `DocsLayout.astro` and any other layout that emits inline scripts.

**For static site generation (SSG):** Nonces require a server to generate a new random
value per request; they cannot be embedded in pre-built HTML files. Use hash-based CSP
instead (see below), or set headers at the edge with a platform that supports dynamic
header injection (Vercel/Netlify edge functions).

### Hash-based CSP (static builds)

Hash-based CSP (`'sha256-...'`) lets you allow a specific script without
`'unsafe-inline'` by listing the exact SHA-256 of its content in the policy. This works
well for scripts whose rendered content does not change between page loads.

**Caveats for turbo-themes:**

- The two `define:vars` scripts (`validThemeIds`, `themeNames`, `themeIcons`) produce
  different rendered content each time themes are added or renamed. Their hash must be
  recomputed after every build that changes theme metadata.
- The DocsLayout sidebar toggle (`<script is:inline>` without `define:vars`) has static
  content and is stable between builds.

**Computing hashes from a built site:**

After running `bun run build`, extract each inline script body and hash it.
All three scripts must be listed in `script-src` — missing any one will block that
feature:

```bash
# Extract and hash the FOUC-prevention script (BaseLayout.astro, define:vars)
node -e "
const fs = require('fs');
const html = fs.readFileSync('apps/site/dist/index.html', 'utf8');
const m = html.match(/<script[^>]*>(([\s\S]*?validThemeIds[\s\S]*?))<\/script>/);
if (m) process.stdout.write(m[1]);
" > fouc-script.txt
FOUC_HASH=$(openssl dgst -sha256 -binary fouc-script.txt | openssl base64 -A)

# Extract and hash the theme-dropdown script (BaseLayout.astro, define:vars)
node -e "
const fs = require('fs');
const html = fs.readFileSync('apps/site/dist/index.html', 'utf8');
const m = html.match(/<script[^>]*>(([\s\S]*?themeNames[\s\S]*?))<\/script>/);
if (m) process.stdout.write(m[1]);
" > dropdown-script.txt
DROPDOWN_HASH=$(openssl dgst -sha256 -binary dropdown-script.txt | openssl base64 -A)

# Extract and hash the sidebar-toggle script (DocsLayout.astro, static)
# Use a docs page that renders DocsLayout, e.g. the first docs page:
node -e "
const fs = require('fs'), path = require('path'), glob = require('glob');
const pages = glob.sync('apps/site/dist/docs/**/*.html');
if (!pages.length) { process.stderr.write('No docs pages found\n'); process.exit(1); }
const html = fs.readFileSync(pages[0], 'utf8');
const m = html.match(/<script[^>]*>(([\s\S]*?sidebar[\s\S]*?))<\/script>/i);
if (m) process.stdout.write(m[1]);
" > sidebar-script.txt
SIDEBAR_HASH=$(openssl dgst -sha256 -binary sidebar-script.txt | openssl base64 -A)

echo "FOUC_HASH:     $FOUC_HASH"
echo "DROPDOWN_HASH: $DROPDOWN_HASH"
echo "SIDEBAR_HASH:  $SIDEBAR_HASH"
```

Use all three values in your CSP:

```
script-src 'self' 'sha256-FOUC_HASH' 'sha256-DROPDOWN_HASH' 'sha256-SIDEBAR_HASH';
```

> **Important:** recompute and update all three hashes every time you run `bun run build`
> if theme metadata has changed. A stale hash will silently block that script and cause
> theme-flashing or broken navigation.

### unsafe-inline (last resort)

```
script-src 'self' 'unsafe-inline';
```

`'unsafe-inline'` defeats much of the XSS protection that CSP provides and is not
recommended for production. Use it only during local development or when neither nonces
nor hashes are feasible.

> **Note:** when a `nonce-*` or `sha256-*` source is present in `script-src`, browsers
> that support CSP Level 2 will ignore `'unsafe-inline'` entirely, making it safe to
> include for backward-compatibility with very old browsers that only understand CSP
> Level 1 — but this is rarely necessary in practice.

---

## CDN Usage

If your users install turbo-themes from a CDN rather than bundling it, they need the CDN
origin in `style-src`:

| CDN      | Addition to `style-src`    |
| -------- | -------------------------- |
| unpkg    | `https://unpkg.com`        |
| jsDelivr | `https://cdn.jsdelivr.net` |

Example (unpkg):

```
Content-Security-Policy:
  default-src 'self';
  style-src 'self' https://fonts.googleapis.com https://unpkg.com;
  font-src 'self' https://fonts.gstatic.com;
  script-src 'self' 'nonce-{random}';
  img-src 'self' data:;
  connect-src 'self';
  base-uri 'self';
  object-src 'none';
```

CDN origins are broad by design — if you want a tighter policy, self-host the CSS file
and remove the CDN entry.

---

## Platform-specific Examples

### Nginx

For static sites served by Nginx, use precomputed `'sha256-...'` hashes (see
[Hash-based CSP](#hash-based-csp-static-builds)):

```nginx
server {
    # ... other config ...

    add_header Content-Security-Policy
        "default-src 'self'; \
         style-src 'self' https://fonts.googleapis.com; \
         font-src 'self' https://fonts.gstatic.com; \
         script-src 'self' 'sha256-FOUC_HASH' 'sha256-DROPDOWN_HASH' 'sha256-SIDEBAR_HASH'; \
         img-src 'self' data:; \
         connect-src 'self'; \
         base-uri 'self'; \
         object-src 'none';"
        always;
}
```

> **Nonce-based approach for Nginx:** `$request_id` is an nginx-internal hex identifier
> that sets the CSP header, but the pre-built HTML `<script>` tags have no matching
> `nonce="..."` attributes. To use nonces with Nginx you must also rewrite the HTML via
> an `ngx_http_sub_module` `sub_filter` or an njs/Lua module that injects the nonce into
> every `<script>` tag. For static turbo-themes builds, the hash-based approach above is
> simpler and fully functional.

### Apache

```apache
<IfModule mod_headers.c>
    Header always set Content-Security-Policy \
        "default-src 'self'; \
         style-src 'self' https://fonts.googleapis.com; \
         font-src 'self' https://fonts.gstatic.com; \
         script-src 'self' 'nonce-REPLACE_WITH_NONCE'; \
         img-src 'self' data:; \
         connect-src 'self'; \
         base-uri 'self'; \
         object-src 'none';"
</IfModule>
```

For static sites served by Apache, replace `'nonce-REPLACE_WITH_NONCE'` with the
`'sha256-...'` values computed at build time.

### Vercel

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; script-src 'self' 'sha256-FOUC_HASH' 'sha256-DROPDOWN_HASH' 'sha256-SIDEBAR_HASH'; img-src 'self' data:; connect-src 'self'; base-uri 'self'; object-src 'none';"
        }
      ]
    }
  ]
}
```

Replace each `*_HASH` placeholder with the SHA-256 computed from the built output (see
[Hash-based CSP](#hash-based-csp-static-builds)).

For server-side rendering on Vercel (Node.js or Edge runtime), use an Astro middleware
to generate a per-request nonce and set the header dynamically instead of using static
hashes in `vercel.json`.

### Netlify

In your `netlify.toml` or a `_headers` file placed in the site's publish directory:

**`netlify.toml`:**

```toml
[[headers]]
  for = "/*"
  [headers.values]
    Content-Security-Policy = "default-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; script-src 'self' 'sha256-FOUC_HASH' 'sha256-DROPDOWN_HASH' 'sha256-SIDEBAR_HASH'; img-src 'self' data:; connect-src 'self'; base-uri 'self'; object-src 'none';"
```

**`_headers` file:**

```
/*
  Content-Security-Policy: default-src 'self'; style-src 'self' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; script-src 'self' 'sha256-FOUC_HASH' 'sha256-DROPDOWN_HASH' 'sha256-SIDEBAR_HASH'; img-src 'self' data:; connect-src 'self'; base-uri 'self'; object-src 'none';
```

### GitHub Pages

GitHub Pages serves static files and does **not** support custom HTTP response headers.
The only CSP option on Pages is the `<meta>` tag approach:

```html
<meta
  http-equiv="Content-Security-Policy"
  content="
    default-src 'self';
    style-src 'self' https://fonts.googleapis.com;
    font-src 'self' https://fonts.gstatic.com;
    script-src 'self' 'sha256-FOUC_HASH' 'sha256-DROPDOWN_HASH' 'sha256-SIDEBAR_HASH';
    img-src 'self' data:;
    connect-src 'self';
    base-uri 'self';
    object-src 'none';
  "
/>
```

Add this tag inside `<head>` in your base layout.

**Limitations of `<meta>` CSP:**

- The `<meta>` tag is processed by the HTML parser, not the network layer, so it does
  not restrict `frame-ancestors`, `sandbox`, or `report-uri`/`report-to` directives.
  Those only work in HTTP headers.
- The FOUC-prevention script appears _after_ the `<meta>` tag in the same `<head>`
  block, so the browser will have already parsed the policy before encountering the
  script.

For strongest protection, deploy on a platform that supports HTTP response headers
(Vercel, Netlify, Nginx, Apache, Cloudflare Pages) and set the policy there.

---

## See Also

- [SECURITY.md](../SECURITY.md) — vulnerability reporting policy
- [MDN: Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [CSP Evaluator](https://csp-evaluator.withgoogle.com/) — Google tool for auditing your
  policy
