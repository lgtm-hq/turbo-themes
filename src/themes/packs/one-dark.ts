import type { ThemePackage } from '../types.js';

/**
 * One Dark theme - the classic Atom One Dark palette and its companion light variant.
 * @see https://github.com/Binaryify/OneDark-Pro
 * @license MIT
 */
export const oneDarkThemes: ThemePackage = {
  id: 'one-dark',
  name: 'One',
  homepage: 'https://github.com/Binaryify/OneDark-Pro',
  license: {
    spdx: 'MIT',
    url: 'https://github.com/Binaryify/OneDark-Pro/blob/master/LICENSE',
    copyright: 'Atom contributors and Binaryify',
  },
  source: {
    repository: 'https://github.com/Binaryify/OneDark-Pro',
  },
  flavors: [
    {
      id: 'one-dark',
      label: 'One Dark',
      vendor: 'one-dark',
      appearance: 'dark',
      iconUrl: '/assets/img/one-dark.png',
      tokens: {
        background: {
          base: '#282c34',
          surface: '#2c313a',
          overlay: '#3e4451',
        },
        text: {
          primary: '#abb2bf',
          secondary: '#828997',
          inverse: '#282c34',
        },
        brand: {
          primary: '#61afef',
        },
        state: {
          info: '#56b6c2',
          success: '#98c379',
          warning: '#e5c07b',
          danger: '#e06c75',
        },
        border: {
          default: '#3e4451',
        },
        accent: {
          link: '#61afef',
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
            h1: '#61afef',
            h2: '#c678dd',
            h3: '#98c379',
            h4: '#e5c07b',
            h5: '#d19a66',
            h6: '#56b6c2',
          },
          body: {
            primary: '#abb2bf',
            secondary: '#828997',
          },
          link: {
            default: '#61afef',
          },
          selection: {
            fg: '#abb2bf',
            bg: '#3e4451',
          },
          blockquote: {
            border: '#3e4451',
            fg: '#828997',
            bg: '#2c313a',
          },
          codeInline: {
            fg: '#c678dd',
            bg: '#2c313a',
          },
          codeBlock: {
            fg: '#abb2bf',
            bg: '#21252b',
          },
          table: {
            border: '#3e4451',
            stripe: '#2c313a',
            theadBg: '#3e4451',
          },
        },
      },
    },
    {
      id: 'one-light',
      label: 'One Light',
      vendor: 'one-dark',
      appearance: 'light',
      iconUrl: '/assets/img/one-light.png',
      tokens: {
        background: {
          base: '#fafafa',
          surface: '#f0f0f0',
          overlay: '#e5e5e6',
        },
        text: {
          primary: '#383a42',
          secondary: '#696c77',
          inverse: '#fafafa',
        },
        brand: {
          primary: '#4078f2',
        },
        state: {
          info: '#0184bc',
          success: '#50a14f',
          warning: '#c18401',
          danger: '#e45649',
          infoText: '#000000',
          successText: '#000000',
          warningText: '#000000',
          dangerText: '#000000',
        },
        border: {
          default: '#d0d0d1',
        },
        accent: {
          link: '#4078f2',
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
            h1: '#4078f2',
            h2: '#a626a4',
            h3: '#50a14f',
            h4: '#c18401',
            h5: '#986801',
            h6: '#0184bc',
          },
          body: {
            primary: '#383a42',
            secondary: '#696c77',
          },
          link: {
            default: '#4078f2',
          },
          selection: {
            fg: '#383a42',
            bg: '#dfe1e5',
          },
          blockquote: {
            border: '#d0d0d1',
            fg: '#696c77',
            bg: '#f0f0f0',
          },
          codeInline: {
            fg: '#a626a4',
            bg: '#e5e5e6',
          },
          codeBlock: {
            fg: '#383a42',
            bg: '#e5e5e6',
          },
          table: {
            border: '#d0d0d1',
            stripe: '#f0f0f0',
            theadBg: '#e5e5e6',
          },
        },
      },
    },
  ],
} as const;
