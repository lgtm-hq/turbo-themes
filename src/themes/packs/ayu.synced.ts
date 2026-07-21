import type { ThemePackage } from '../types.js';

/**
 * Ayu theme - Bright colors for comfortable all-day coding
 * Auto-synced from ayu
 * @see https://ayutheme.com
 * @license MIT
 *
 * DO NOT EDIT MANUALLY - regenerate with: node scripts/sync-ayu.mjs
 */
export const ayuSynced: ThemePackage = {
  id: 'ayu',
  name: 'Ayu (synced)',
  homepage: 'https://ayutheme.com',
  license: {
    spdx: 'MIT',
    url: 'https://github.com/ayu-theme/ayu-colors/blob/master/license',
    copyright: 'Ayu Theme',
  },
  source: {
    package: 'ayu',
    version: '9.0.0',
    repository: 'https://github.com/ayu-theme/ayu-colors',
  },
  flavors: [
    {
      id: 'ayu-dark',
      label: 'Ayu Dark',
      vendor: 'ayu',
      appearance: 'dark',
      tokens: {
        background: {
          base: '#0d1017',
          surface: '#141821',
          overlay: '#1b1f29',
        },
        text: {
          primary: '#bfbdb6',
          secondary: '#5b6876',
          inverse: '#0d1017',
        },
        brand: {
          primary: '#e6b450',
        },
        state: {
          info: '#39bae6',
          success: '#aad94c',
          warning: '#ff8f40',
          danger: '#d95757',
        },
        border: {
          default: '#1b1f29',
        },
        accent: {
          link: '#ffb454',
        },
        typography: {
          fonts: {
            sans: 'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
            mono: 'JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
          },
          webFonts: [
            'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap',
            'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&display=swap',
          ],
        },
        content: {
          heading: {
            h1: '#ffb454',
            h2: '#59c2ff',
            h3: '#39bae6',
            h4: '#aad94c',
            h5: '#d2a6ff',
            h6: '#ff8f40',
          },
          body: {
            primary: '#bfbdb6',
            secondary: '#5b6876',
          },
          link: {
            default: '#ffb454',
          },
          selection: {
            fg: '#bfbdb6',
            bg: '#1c212b',
          },
          blockquote: {
            border: '#1b1f29',
            fg: '#bfbdb6',
            bg: '#141821',
          },
          codeInline: {
            fg: '#bfbdb6',
            bg: '#1b1f29',
          },
          codeBlock: {
            fg: '#bfbdb6',
            bg: '#1b1f29',
          },
          table: {
            border: '#1b1f29',
            stripe: '#141821',
            theadBg: '#1b1f29',
          },
        },
      },
    },
    {
      id: 'ayu-light',
      label: 'Ayu Light',
      vendor: 'ayu',
      appearance: 'light',
      tokens: {
        background: {
          base: '#f8f9fa',
          surface: '#fafafa',
          overlay: '#e7eaed',
        },
        text: {
          primary: '#5c6166',
          secondary: '#828e9f',
          inverse: '#f8f9fa',
        },
        brand: {
          primary: '#f29718',
        },
        state: {
          info: '#55b4d4',
          success: '#86b300',
          warning: '#ff7e33',
          danger: '#e65050',
          infoText: '#000000',
          successText: '#000000',
          warningText: '#000000',
        },
        border: {
          default: '#e7eaed',
        },
        accent: {
          link: '#a37acc',
        },
        typography: {
          fonts: {
            sans: 'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
            mono: 'JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
          },
          webFonts: [
            'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap',
            'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&display=swap',
          ],
        },
        content: {
          heading: {
            h1: '#f2a300',
            h2: '#399ee6',
            h3: '#55b4d4',
            h4: '#86b300',
            h5: '#a37acc',
            h6: '#ff7e33',
          },
          body: {
            primary: '#5c6166',
            secondary: '#828e9f',
          },
          link: {
            default: '#a37acc',
          },
          selection: {
            fg: '#5c6166',
            bg: '#e5e9ed',
          },
          blockquote: {
            border: '#e7eaed',
            fg: '#5c6166',
            bg: '#fafafa',
          },
          codeInline: {
            fg: '#5c6166',
            bg: '#e7eaed',
          },
          codeBlock: {
            fg: '#5c6166',
            bg: '#e7eaed',
          },
          table: {
            border: '#e7eaed',
            stripe: '#fafafa',
            theadBg: '#e7eaed',
          },
        },
      },
    },
    {
      id: 'ayu-mirage',
      label: 'Ayu Mirage',
      vendor: 'ayu',
      appearance: 'dark',
      tokens: {
        background: {
          base: '#1f2430',
          surface: '#282e3b',
          overlay: '#293040',
        },
        text: {
          primary: '#cccac2',
          secondary: '#707a8c',
          inverse: '#1f2430',
        },
        brand: {
          primary: '#ffcc66',
        },
        state: {
          info: '#5ccfe6',
          success: '#d5ff80',
          warning: '#ffad66',
          danger: '#ff6666',
        },
        border: {
          default: '#171b24',
        },
        accent: {
          link: '#ffd173',
        },
        typography: {
          fonts: {
            sans: 'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
            mono: 'JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
          },
          webFonts: [
            'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap',
            'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&display=swap',
          ],
        },
        content: {
          heading: {
            h1: '#ffd173',
            h2: '#73d0ff',
            h3: '#5ccfe6',
            h4: '#d5ff80',
            h5: '#dfbfff',
            h6: '#ffad66',
          },
          body: {
            primary: '#cccac2',
            secondary: '#707a8c',
          },
          link: {
            default: '#ffd173',
          },
          selection: {
            fg: '#cccac2',
            bg: '#293040',
          },
          blockquote: {
            border: '#171b24',
            fg: '#cccac2',
            bg: '#282e3b',
          },
          codeInline: {
            fg: '#cccac2',
            bg: '#293040',
          },
          codeBlock: {
            fg: '#cccac2',
            bg: '#293040',
          },
          table: {
            border: '#171b24',
            stripe: '#282e3b',
            theadBg: '#293040',
          },
        },
      },
    },
  ],
} as const;
