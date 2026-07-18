import type { ThemePackage } from '../types.js';

/**
 * Terminal theme - first-party turbo palette
 * CRT phosphor green on void, inspired by classic monochrome terminals.
 * Canonical, hand-authored palette maintained in turbo-themes (no upstream sync).
 * @see https://github.com/lgtm-hq/turbo-themes
 * @license MIT
 */
export const terminalThemes: ThemePackage = {
  id: 'terminal',
  name: 'Terminal',
  homepage: 'https://github.com/lgtm-hq/turbo-themes',
  license: {
    spdx: 'MIT',
    url: 'https://github.com/lgtm-hq/turbo-themes/blob/main/LICENSE',
    copyright: 'Turbo Themes contributors',
  },
  source: {
    repository: 'https://github.com/lgtm-hq/turbo-themes',
  },
  flavors: [
    {
      id: 'terminal',
      label: 'Terminal',
      vendor: 'turbo',
      appearance: 'dark',
      tokens: {
        background: {
          base: '#0d0d0d', // Void
          surface: '#080808',
          overlay: '#111111',
        },
        text: {
          primary: '#c8ffc8', // Body green
          secondary: '#8fbc8f', // Muted green
          inverse: '#0d0d0d',
        },
        brand: {
          primary: '#39ff14', // Phosphor green
        },
        state: {
          info: '#7dd3fc', // Cyan
          success: '#39ff14', // Phosphor green
          warning: '#ffb000', // Amber
          danger: '#ff4444', // Red
        },
        border: {
          default: '#1f3d1f',
        },
        accent: {
          link: '#7dd3fc', // Cyan
        },
        typography: {
          fonts: {
            sans: '"IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
            mono: '"IBM Plex Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
          },
          webFonts: [
            'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&display=swap',
          ],
        },
        content: {
          heading: {
            h1: '#39ff14', // Phosphor green
            h2: '#7dd3fc', // Cyan
            h3: '#ffb000', // Amber
            h4: '#39ff14', // Phosphor green
            h5: '#8fbc8f', // Muted green
            h6: '#c8ffc8', // Body green
          },
          body: {
            primary: '#c8ffc8',
            secondary: '#8fbc8f',
          },
          link: {
            default: '#7dd3fc', // Cyan
          },
          selection: {
            fg: '#0d0d0d',
            bg: '#39ff14', // Phosphor green highlight
          },
          blockquote: {
            border: '#39ff14',
            fg: '#8fbc8f',
            bg: '#111111',
          },
          codeInline: {
            fg: '#ffb000', // Amber
            bg: '#111111',
          },
          codeBlock: {
            fg: '#c8ffc8',
            bg: '#080808',
          },
          table: {
            border: '#1f3d1f',
            stripe: '#111111',
            theadBg: '#080808',
            headerFg: '#c8ffc8',
          },
        },
      },
    },
  ],
} as const;
