# @lgtm-hq/turbo-themes-adapter-home-assistant

Home Assistant theme adapter for Turbo Themes. Emits a single, self-contained
`themes.yaml`-compatible YAML string that maps Turbo theme tokens onto Home Assistant
frontend theme variables.

## Overview

Home Assistant lets you define custom frontend themes as a YAML document. This adapter
turns every Turbo theme into a Home Assistant theme:

- 27 flat themes (one per Turbo flavor)
- 8 "auto" themes that pair a dark and light flavor via Home Assistant `modes:`

All emitted values are concrete hex colors or `R, G, B` triplets (for `rgb-*`
variables). No CSS `var()` references are emitted, so the artifact is deterministic and
self-contained.

## Usage

```ts
import { generateHomeAssistantThemes } from '@lgtm-hq/turbo-themes/adapters/home-assistant';

const yaml = generateHomeAssistantThemes();
// Write to <config>/themes/turbo-themes.yaml and reference it from configuration.yaml:
//   frontend:
//     themes: !include_dir_merge_named themes
```

Then pick a theme from the Home Assistant profile page, or set it per-user via a service
call.

## API

- `generateHomeAssistantThemes()` — returns the full YAML document as a string.
- `mapTokensToHomeAssistant(tokens)` — maps a single `ThemeTokens` to Home Assistant
  variables (`Record<string, string>`).
- `REQUIRED_KEYS` — the ordered list of every variable key emitted per theme.
- `AUTO_THEME_PAIRINGS` — the dark/light pairings used for the auto themes.
- `assertPairingsValid()` — validates the pairings against the theme registry.

## License

MIT
