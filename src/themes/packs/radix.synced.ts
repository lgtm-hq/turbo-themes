import type { ThemePackage } from "../types.js";

/**
 * Radix Colors theme - accessibility-focused color system by WorkOS
 * Auto-synced from @radix-ui/colors
 * @see https://www.radix-ui.com/colors
 * @license MIT
 *
 * DO NOT EDIT MANUALLY - regenerate with: node scripts/sync-radix.mjs
 */
export const radixSynced: ThemePackage = {
  id: "radix",
  name: "Radix Colors (synced)",
  homepage: "https://www.radix-ui.com/colors",
  license: {
    spdx: "MIT",
    url: "https://github.com/radix-ui/colors/blob/main/LICENSE",
    copyright: "WorkOS",
  },
  source: {
    package: "@radix-ui/colors",
    version: "3.0.0",
    repository: "https://github.com/radix-ui/colors",
  },
  flavors: [
    {
      id: "radix-mauve-dark",
      label: "Radix Colors Mauve Dark",
      vendor: "radix",
      appearance: "dark",
      iconUrl: "/assets/img/radix-slate-dark.png",
      tokens: {
        background: {
          base: "#121113",
          surface: "#1a191b",
          overlay: "#232225",
        },
        text: {
          primary: "#eeeef0",
          secondary: "#b5b2bc",
          inverse: "#121113",
        },
        brand: {
          primary: "#0090ff",
        },
        state: {
          info: "#00a2c7",
          success: "#30a46c",
          warning: "#ffc53d",
          danger: "#e5484d",
        },
        border: {
          default: "#3c393f",
        },
        accent: {
          link: "#70b8ff",
        },
        typography: {
          fonts: {
            sans: 'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
            mono: 'JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
          },
          webFonts: [
            "https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap",
            "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&display=swap",
          ],
        },
        content: {
          heading: {
            h1: "#3dd68c",
            h2: "#70b8ff",
            h3: "#4ccce6",
            h4: "#ffca16",
            h5: "#baa7ff",
            h6: "#ff9592",
          },
          body: {
            primary: "#eeeef0",
            secondary: "#b5b2bc",
          },
          link: {
            default: "#70b8ff",
          },
          selection: {
            fg: "#eeeef0",
            bg: "#323035",
          },
          blockquote: {
            border: "#49474e",
            fg: "#eeeef0",
            bg: "#1a191b",
          },
          codeInline: {
            fg: "#eeeef0",
            bg: "#232225",
          },
          codeBlock: {
            fg: "#eeeef0",
            bg: "#232225",
          },
          table: {
            border: "#49474e",
            stripe: "#1a191b",
            theadBg: "#2b292d",
          },
        },
      },
    },
    {
      id: "radix-mauve-light",
      label: "Radix Colors Mauve Light",
      vendor: "radix",
      appearance: "light",
      iconUrl: "/assets/img/radix-slate-light.png",
      tokens: {
        background: {
          base: "#fdfcfd",
          surface: "#faf9fb",
          overlay: "#f2eff3",
        },
        text: {
          primary: "#211f26",
          secondary: "#65636d",
          inverse: "#fdfcfd",
        },
        brand: {
          primary: "#0090ff",
        },
        state: {
          info: "#00a2c7",
          success: "#30a46c",
          warning: "#ffc53d",
          danger: "#e5484d",
          infoText: "#000000",
          successText: "#000000",
          warningText: "#000000",
          dangerText: "#000000",
        },
        border: {
          default: "#dbd8e0",
        },
        accent: {
          link: "#0d74ce",
        },
        typography: {
          fonts: {
            sans: 'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
            mono: 'JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
          },
          webFonts: [
            "https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap",
            "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&display=swap",
          ],
        },
        content: {
          heading: {
            h1: "#218358",
            h2: "#0d74ce",
            h3: "#107d98",
            h4: "#ab6400",
            h5: "#6550b9",
            h6: "#ce2c31",
          },
          body: {
            primary: "#211f26",
            secondary: "#65636d",
          },
          link: {
            default: "#0d74ce",
          },
          selection: {
            fg: "#211f26",
            bg: "#e3dfe6",
          },
          blockquote: {
            border: "#d0cdd7",
            fg: "#211f26",
            bg: "#faf9fb",
          },
          codeInline: {
            fg: "#211f26",
            bg: "#f2eff3",
          },
          codeBlock: {
            fg: "#211f26",
            bg: "#f2eff3",
          },
          table: {
            border: "#d0cdd7",
            stripe: "#faf9fb",
            theadBg: "#eae7ec",
          },
        },
      },
    },
    {
      id: "radix-slate-dark",
      label: "Radix Colors Slate Dark",
      vendor: "radix",
      appearance: "dark",
      iconUrl: "/assets/img/radix-slate-dark.png",
      tokens: {
        background: {
          base: "#111113",
          surface: "#18191b",
          overlay: "#212225",
        },
        text: {
          primary: "#edeef0",
          secondary: "#b0b4ba",
          inverse: "#111113",
        },
        brand: {
          primary: "#0090ff",
        },
        state: {
          info: "#00a2c7",
          success: "#30a46c",
          warning: "#ffc53d",
          danger: "#e5484d",
        },
        border: {
          default: "#363a3f",
        },
        accent: {
          link: "#70b8ff",
        },
        typography: {
          fonts: {
            sans: 'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
            mono: 'JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
          },
          webFonts: [
            "https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap",
            "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&display=swap",
          ],
        },
        content: {
          heading: {
            h1: "#3dd68c",
            h2: "#70b8ff",
            h3: "#4ccce6",
            h4: "#ffca16",
            h5: "#baa7ff",
            h6: "#ff9592",
          },
          body: {
            primary: "#edeef0",
            secondary: "#b0b4ba",
          },
          link: {
            default: "#70b8ff",
          },
          selection: {
            fg: "#edeef0",
            bg: "#2e3135",
          },
          blockquote: {
            border: "#43484e",
            fg: "#edeef0",
            bg: "#18191b",
          },
          codeInline: {
            fg: "#edeef0",
            bg: "#212225",
          },
          codeBlock: {
            fg: "#edeef0",
            bg: "#212225",
          },
          table: {
            border: "#43484e",
            stripe: "#18191b",
            theadBg: "#272a2d",
          },
        },
      },
    },
    {
      id: "radix-slate-light",
      label: "Radix Colors Slate Light",
      vendor: "radix",
      appearance: "light",
      iconUrl: "/assets/img/radix-slate-light.png",
      tokens: {
        background: {
          base: "#fcfcfd",
          surface: "#f9f9fb",
          overlay: "#f0f0f3",
        },
        text: {
          primary: "#1c2024",
          secondary: "#60646c",
          inverse: "#fcfcfd",
        },
        brand: {
          primary: "#0090ff",
        },
        state: {
          info: "#00a2c7",
          success: "#30a46c",
          warning: "#ffc53d",
          danger: "#e5484d",
          infoText: "#000000",
          successText: "#000000",
          warningText: "#000000",
          dangerText: "#000000",
        },
        border: {
          default: "#d9d9e0",
        },
        accent: {
          link: "#0d74ce",
        },
        typography: {
          fonts: {
            sans: 'Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"',
            mono: 'JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
          },
          webFonts: [
            "https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap",
            "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&display=swap",
          ],
        },
        content: {
          heading: {
            h1: "#218358",
            h2: "#0d74ce",
            h3: "#107d98",
            h4: "#ab6400",
            h5: "#6550b9",
            h6: "#ce2c31",
          },
          body: {
            primary: "#1c2024",
            secondary: "#60646c",
          },
          link: {
            default: "#0d74ce",
          },
          selection: {
            fg: "#1c2024",
            bg: "#e0e1e6",
          },
          blockquote: {
            border: "#cdced6",
            fg: "#1c2024",
            bg: "#f9f9fb",
          },
          codeInline: {
            fg: "#1c2024",
            bg: "#f0f0f3",
          },
          codeBlock: {
            fg: "#1c2024",
            bg: "#f0f0f3",
          },
          table: {
            border: "#cdced6",
            stripe: "#f9f9fb",
            theadBg: "#e8e8ec",
          },
        },
      },
    },
  ],
} as const;
