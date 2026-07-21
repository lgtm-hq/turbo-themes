import type { ThemePackage, ThemeTokens } from "../types.js";

/**
 * Kanagawa theme — inspired by Katsushika Hokusai's "The Great Wave off Kanagawa".
 * Ported from rebelot/kanagawa.nvim (colors.lua / themes.lua).
 * @see https://github.com/rebelot/kanagawa.nvim
 * @license MIT
 */
const TYPOGRAPHY = {
  fonts: {
    sans: 'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
    mono: 'JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  },
  webFonts: [
    "https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap",
    "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&display=swap",
  ],
} as const;

function buildTokens(partial: Omit<ThemeTokens, "typography">): ThemeTokens {
  return {
    ...partial,
    typography: {
      fonts: {
        sans: TYPOGRAPHY.fonts.sans,
        mono: TYPOGRAPHY.fonts.mono,
      },
      webFonts: [...TYPOGRAPHY.webFonts],
    },
  };
}

export const kanagawaThemes: ThemePackage = {
  id: "kanagawa",
  name: "Kanagawa",
  homepage: "https://github.com/rebelot/kanagawa.nvim",
  license: {
    spdx: "MIT",
    url: "https://github.com/rebelot/kanagawa.nvim/blob/master/LICENSE",
    copyright: "Tommaso Laurenzi",
  },
  source: {
    repository: "https://github.com/rebelot/kanagawa.nvim",
  },
  flavors: [
    {
      id: "kanagawa-wave",
      label: "Kanagawa Wave",
      vendor: "kanagawa",
      appearance: "dark",
      tokens: buildTokens({
        background: {
          base: "#1F1F28",
          surface: "#2A2A37",
          overlay: "#363646",
        },
        text: {
          primary: "#DCD7BA",
          secondary: "#C8C093",
          inverse: "#1F1F28",
        },
        brand: {
          primary: "#7E9CD8",
        },
        state: {
          info: "#658594",
          success: "#98BB6C",
          warning: "#FF9E3B",
          danger: "#E82424",
        },
        border: {
          default: "#54546D",
        },
        accent: {
          link: "#7E9CD8",
        },
        content: {
          heading: {
            h1: "#7E9CD8",
            h2: "#957FB8",
            h3: "#7AA89F",
            h4: "#E6C384",
            h5: "#FFA066",
            h6: "#D27E99",
          },
          body: {
            primary: "#DCD7BA",
            secondary: "#C8C093",
          },
          link: {
            default: "#7E9CD8",
          },
          selection: {
            fg: "#DCD7BA",
            bg: "#223249",
          },
          blockquote: {
            border: "#54546D",
            fg: "#C8C093",
            bg: "#2A2A37",
          },
          codeInline: {
            fg: "#E6C384",
            bg: "#363646",
          },
          codeBlock: {
            fg: "#DCD7BA",
            bg: "#16161D",
          },
          table: {
            border: "#54546D",
            stripe: "#2A2A37",
            theadBg: "#363646",
          },
        },
      }),
    },
    {
      id: "kanagawa-dragon",
      label: "Kanagawa Dragon",
      vendor: "kanagawa",
      appearance: "dark",
      tokens: buildTokens({
        background: {
          base: "#181616",
          surface: "#282727",
          overlay: "#393836",
        },
        text: {
          primary: "#c5c9c5",
          secondary: "#C8C093",
          inverse: "#181616",
        },
        brand: {
          primary: "#8ba4b0",
        },
        state: {
          info: "#658594",
          success: "#98BB6C",
          warning: "#FF9E3B",
          danger: "#E82424",
        },
        border: {
          default: "#54546D",
        },
        accent: {
          link: "#8ba4b0",
        },
        content: {
          heading: {
            h1: "#8ba4b0",
            h2: "#8992a7",
            h3: "#8ea4a2",
            h4: "#c4b28a",
            h5: "#b6927b",
            h6: "#a292a3",
          },
          body: {
            primary: "#c5c9c5",
            secondary: "#C8C093",
          },
          link: {
            default: "#8ba4b0",
          },
          selection: {
            fg: "#c5c9c5",
            // dragonBlack5 — Dragon palette elevated ink (not Wave's waveBlue1).
            bg: "#393836",
          },
          blockquote: {
            border: "#54546D",
            fg: "#C8C093",
            bg: "#282727",
          },
          codeInline: {
            fg: "#c4b28a",
            bg: "#393836",
          },
          codeBlock: {
            fg: "#c5c9c5",
            bg: "#0d0c0c",
          },
          table: {
            border: "#54546D",
            stripe: "#282727",
            theadBg: "#393836",
          },
        },
      }),
    },
    {
      id: "kanagawa-lotus",
      label: "Kanagawa Lotus",
      vendor: "kanagawa",
      appearance: "light",
      tokens: buildTokens({
        background: {
          base: "#f2ecbc",
          surface: "#e7dba0",
          overlay: "#e4d794",
        },
        text: {
          primary: "#545464",
          secondary: "#43436c",
          inverse: "#f2ecbc",
        },
        brand: {
          primary: "#4d699b",
        },
        state: {
          info: "#5a7785",
          success: "#6f894e",
          warning: "#e98a00",
          danger: "#e82424",
          warningText: "#000000",
        },
        border: {
          default: "#716e61",
        },
        accent: {
          link: "#4d699b",
        },
        content: {
          heading: {
            h1: "#4d699b",
            h2: "#624c83",
            h3: "#597b75",
            h4: "#77713f",
            h5: "#cc6d00",
            h6: "#b35b79",
          },
          body: {
            primary: "#545464",
            secondary: "#43436c",
          },
          link: {
            default: "#4d699b",
          },
          selection: {
            fg: "#545464",
            bg: "#c9cbd1",
          },
          blockquote: {
            border: "#716e61",
            fg: "#43436c",
            bg: "#e7dba0",
          },
          codeInline: {
            fg: "#624c83",
            bg: "#e4d794",
          },
          codeBlock: {
            fg: "#545464",
            bg: "#e4d794",
          },
          table: {
            border: "#716e61",
            stripe: "#e7dba0",
            theadBg: "#e4d794",
          },
        },
      }),
    },
  ],
} as const;
