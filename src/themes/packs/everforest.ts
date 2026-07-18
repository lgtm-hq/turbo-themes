import type { ThemePackage, ThemeTokens } from '../types.js';

/**
 * Everforest theme - green-based, nature-inspired palette designed for eye comfort.
 * @see https://github.com/sainnhe/everforest
 * @license MIT
 */
const TYPOGRAPHY = {
  fonts: {
    sans: 'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
    mono: 'JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  },
  webFonts: [
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap',
    'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&display=swap',
  ],
} as const;

const DARK_ACCENTS = {
  brand: '#A7C080',
  info: '#7FBBB3',
  success: '#A7C080',
  warning: '#DBBC7F',
  danger: '#E67E80',
  link: '#83C092',
  codeInline: '#E69875',
  headings: {
    h1: '#A7C080',
    h2: '#7FBBB3',
    h3: '#83C092',
    h4: '#DBBC7F',
    h5: '#D699B6',
    h6: '#E67E80',
  },
} as const;

const LIGHT_ACCENTS = {
  // Darkened slightly from upstream light accents for WCAG AA readability on paper tones.
  brand: '#6B7C01',
  info: '#2A7A9E',
  success: '#6B7C01',
  warning: '#A87800',
  danger: '#D03A38',
  link: '#1D6B4F',
  codeInline: '#C45A12',
  headings: {
    h1: '#6B7C01',
    h2: '#2A7A9E',
    h3: '#1D6B4F',
    h4: '#A87800',
    h5: '#B84F96',
    h6: '#D03A38',
  },
} as const;

type TokensInput = {
  appearance: 'light' | 'dark';
  background: {
    base: string;
    surface: string;
    overlay: string;
  };
  text: {
    primary: string;
    secondary: string;
  };
  border: string;
};

function hexToRgba(hex: string, alpha: number): string {
  if (!/^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(hex)) {
    throw new Error(`Invalid hex color: ${hex}`);
  }
  const h = hex.slice(1);
  let r: number, g: number, b: number;
  if (h.length === 3) {
    r = parseInt(h.charAt(0) + h.charAt(0), 16);
    g = parseInt(h.charAt(1) + h.charAt(1), 16);
    b = parseInt(h.charAt(2) + h.charAt(2), 16);
  } else {
    r = parseInt(h.slice(0, 2), 16);
    g = parseInt(h.slice(2, 4), 16);
    b = parseInt(h.slice(4, 6), 16);
  }
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function buildTokens({ appearance, background, text, border }: TokensInput): ThemeTokens {
  const accents = appearance === 'dark' ? DARK_ACCENTS : LIGHT_ACCENTS;
  return {
    background: {
      base: background.base,
      surface: background.surface,
      overlay: background.overlay,
    },
    text: {
      primary: text.primary,
      secondary: text.secondary,
      inverse: background.base,
    },
    brand: {
      primary: accents.brand,
    },
    state: {
      info: accents.info,
      success: accents.success,
      warning: accents.warning,
      danger: accents.danger,
      ...(appearance === 'light'
        ? {
            // Light state colors are mid-tone; black label text meets AA large on buttons.
            infoText: '#000000',
            successText: '#000000',
            warningText: '#000000',
            dangerText: '#000000',
          }
        : {}),
    },
    border: {
      default: border,
    },
    accent: {
      link: accents.link,
    },
    typography: {
      fonts: {
        sans: TYPOGRAPHY.fonts.sans,
        mono: TYPOGRAPHY.fonts.mono,
      },
      webFonts: [...TYPOGRAPHY.webFonts],
    },
    content: {
      heading: {
        h1: accents.headings.h1,
        h2: accents.headings.h2,
        h3: accents.headings.h3,
        h4: accents.headings.h4,
        h5: accents.headings.h5,
        h6: accents.headings.h6,
      },
      body: {
        primary: text.primary,
        secondary: text.secondary,
      },
      link: {
        default: accents.link,
      },
      selection: {
        fg: text.primary,
        bg: background.overlay,
      },
      blockquote: {
        border,
        fg: text.secondary,
        bg: background.surface,
      },
      codeInline: {
        fg: accents.codeInline,
        bg: background.overlay,
      },
      codeBlock: {
        fg: text.primary,
        bg: background.surface,
      },
      table: {
        border,
        stripe: background.overlay,
        theadBg: background.surface,
      },
    },
    components:
      appearance === 'dark'
        ? {
            card: { bg: background.surface, border, headerBg: background.base, footerBg: background.surface },
            message: { bg: background.base, headerBg: background.surface, border, bodyFg: text.primary },
            panel: {
              bg: background.surface,
              headerBg: background.base,
              headerFg: text.primary,
              border,
              blockBg: background.base,
              blockHoverBg: background.surface,
              blockActiveBg: background.overlay,
            },
            box: { bg: background.surface, border },
            notification: { bg: background.base, border },
            modal: {
              bg: hexToRgba(background.base, 0.9),
              cardBg: background.surface,
              headerBg: background.base,
              footerBg: background.surface,
            },
            dropdown: { bg: background.surface, itemHoverBg: background.overlay, border },
            tabs: { border, linkBg: background.surface, linkActiveBg: background.base, linkHoverBg: background.overlay },
          }
        : {
            card: { bg: background.base, border, headerBg: background.surface, footerBg: background.surface },
            message: { bg: background.surface, headerBg: background.base, border, bodyFg: text.primary },
            panel: {
              bg: background.base,
              headerBg: background.surface,
              headerFg: text.primary,
              border,
              blockBg: background.surface,
              blockHoverBg: background.base,
              blockActiveBg: background.overlay,
            },
            box: { bg: background.base, border },
            notification: { bg: background.surface, border },
            modal: {
              bg: hexToRgba(text.primary, 0.86),
              cardBg: background.base,
              headerBg: background.surface,
              footerBg: background.surface,
            },
            dropdown: { bg: background.base, itemHoverBg: background.surface, border },
            tabs: { border, linkBg: background.surface, linkActiveBg: background.base, linkHoverBg: background.overlay },
          },
  };
}

const DARK_TEXT = {
  primary: '#D3C6AA',
  secondary: '#9DA9A0',
} as const;

const LIGHT_TEXT = {
  primary: '#5C6A72',
  // statusline2 — greys from the light palette are too light for AA on soft paper.
  secondary: '#708089',
} as const;

const DARK_BORDER = '#4F585E';
const LIGHT_BORDER = '#BDC3AF';

export const everforestThemes: ThemePackage = {
  id: 'everforest',
  name: 'Everforest',
  homepage: 'https://github.com/sainnhe/everforest',
  license: {
    spdx: 'MIT',
    url: 'https://github.com/sainnhe/everforest/blob/master/LICENSE',
    copyright: 'Sainnhe Park',
  },
  source: {
    repository: 'https://github.com/sainnhe/everforest',
  },
  flavors: [
    {
      id: 'everforest-dark-hard',
      label: 'Everforest Dark Hard',
      vendor: 'everforest',
      appearance: 'dark',
      iconUrl: '/assets/img/everforest-dark-hard.png',
      tokens: buildTokens({
        appearance: 'dark',
        background: {
          base: '#272E33',
          surface: '#2E383C',
          overlay: '#374145',
        },
        text: DARK_TEXT,
        border: '#495156',
      }),
    },
    {
      id: 'everforest-dark',
      label: 'Everforest Dark',
      vendor: 'everforest',
      appearance: 'dark',
      iconUrl: '/assets/img/everforest-dark.png',
      tokens: buildTokens({
        appearance: 'dark',
        background: {
          base: '#2D353B',
          surface: '#343F44',
          overlay: '#3D484D',
        },
        text: DARK_TEXT,
        border: DARK_BORDER,
      }),
    },
    {
      id: 'everforest-dark-soft',
      label: 'Everforest Dark Soft',
      vendor: 'everforest',
      appearance: 'dark',
      iconUrl: '/assets/img/everforest-dark-soft.png',
      tokens: buildTokens({
        appearance: 'dark',
        background: {
          base: '#333C43',
          surface: '#3A464C',
          overlay: '#434F55',
        },
        text: DARK_TEXT,
        border: '#555F66',
      }),
    },
    {
      id: 'everforest-light-hard',
      label: 'Everforest Light Hard',
      vendor: 'everforest',
      appearance: 'light',
      iconUrl: '/assets/img/everforest-light-hard.png',
      tokens: buildTokens({
        appearance: 'light',
        background: {
          base: '#FFFBEF',
          surface: '#F8F5E4',
          overlay: '#EDEADA',
        },
        text: LIGHT_TEXT,
        border: '#E8E5D5',
      }),
    },
    {
      id: 'everforest-light',
      label: 'Everforest Light',
      vendor: 'everforest',
      appearance: 'light',
      iconUrl: '/assets/img/everforest-light.png',
      tokens: buildTokens({
        appearance: 'light',
        background: {
          base: '#FDF6E3',
          surface: '#F4F0D9',
          overlay: '#E6E2CC',
        },
        text: LIGHT_TEXT,
        border: LIGHT_BORDER,
      }),
    },
    {
      id: 'everforest-light-soft',
      label: 'Everforest Light Soft',
      vendor: 'everforest',
      appearance: 'light',
      iconUrl: '/assets/img/everforest-light-soft.png',
      tokens: (() => {
        const t = buildTokens({
          appearance: 'light',
          background: {
            base: '#F3EAD3',
            surface: '#EAE4CA',
            overlay: '#DDD8BE',
          },
          text: LIGHT_TEXT,
          border: '#D8D3BA',
        });
        // Surface is too warm/dark for AA normal text; use base for code blocks.
        return {
          ...t,
          content: {
            ...t.content,
            codeBlock: { ...t.content.codeBlock, bg: '#F3EAD3' },
          },
        };
      })(),
    },
  ],
} as const;
