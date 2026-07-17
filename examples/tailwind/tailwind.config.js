/**
 * Tailwind + Turbo Themes example.
 *
 * The preset below enables all themes. To expose only a curated subset, pass
 * a `themes` array to the preset using the existing filtering helpers:
 *
 *   const { themeIds, getThemesByVendor, getThemesByAppearance } =
 *     require('@lgtm-hq/turbo-themes');
 *   const preset = require('@lgtm-hq/turbo-themes/adapters/tailwind/preset');
 *
 *   module.exports = {
 *     presets: [
 *       // Hardcoded minimal set:
 *       preset({ themes: ['catppuccin-mocha', 'catppuccin-latte', 'dracula',
 *                         'github-dark', 'github-light'] }),
 *
 *       // Vendor filter:
 *       preset({ themes: getThemesByVendor('catppuccin').map(f => f.id) }),
 *
 *       // Dark-only themes:
 *       preset({ themes: getThemesByAppearance('dark').map(f => f.id) }),
 *
 *       // All themes (default):
 *       preset({ themes: themeIds }),
 *     ],
 *   };
 *
 * Note: a themeSets / createThemeCatalog() shorthand is planned in #495.
 *
 * @type {import('tailwindcss').Config}
 */
module.exports = {
  content: ['./index.html'],
  theme: {
    extend: {
      colors: {
        // Base theme colors (use CSS custom properties)
        background: 'var(--turbo-bg-base)',
        surface: 'var(--turbo-bg-surface)',
        'surface-alt': 'var(--turbo-bg-overlay)',
        foreground: 'var(--turbo-text-primary)',
        muted: 'var(--turbo-text-secondary)',
        inverse: 'var(--turbo-text-inverse)',
        // Brand colors
        primary: 'var(--turbo-brand-primary)',
        // State colors
        success: 'var(--turbo-state-success)',
        warning: 'var(--turbo-state-warning)',
        danger: 'var(--turbo-state-danger)',
        info: 'var(--turbo-state-info)',
        // Border colors
        default: 'var(--turbo-border-default)',
        strong: 'var(--turbo-border-strong)',
      },
      borderColor: {
        default: 'var(--turbo-border-default)',
        strong: 'var(--turbo-border-strong)',
      },
      fontFamily: {
        sans: 'var(--turbo-font-sans)',
        mono: 'var(--turbo-font-mono)',
      },
    },
  },
  plugins: [],
};
