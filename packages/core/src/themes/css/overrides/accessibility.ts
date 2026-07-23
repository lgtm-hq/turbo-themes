// SPDX-License-Identifier: MIT
// Accessibility CSS overrides - contrast fixes for specific themes

/**
 * Generate accessibility-related CSS overrides.
 * Includes contrast fixes for themes that need WCAG compliance adjustments.
 * Selectors cover both `data-flavor` (Bulma generator) and `data-theme` (site).
 */
export function cssAccessibilityOverrides(): string {
  return `/* Accessibility contrast fixes (Axe / WCAG AA) */
[data-flavor='catppuccin-latte'] .navbar-item,
[data-theme='catppuccin-latte'] .navbar-item,
[data-flavor='catppuccin-latte'] .has-text-centered > p,
[data-theme='catppuccin-latte'] .has-text-centered > p,
[data-flavor='catppuccin-latte'] a.navbar-item,
[data-theme='catppuccin-latte'] a.navbar-item,
[data-flavor='catppuccin-latte'] .title,
[data-theme='catppuccin-latte'] .title,
[data-flavor='catppuccin-latte'] h1,
[data-theme='catppuccin-latte'] h1,
[data-flavor='catppuccin-latte'] h2,
[data-theme='catppuccin-latte'] h2,
[data-flavor='catppuccin-latte'] h3,
[data-theme='catppuccin-latte'] h3,
[data-flavor='catppuccin-latte'] h4,
[data-theme='catppuccin-latte'] h4 {
  color: #1e293b; /* strong slate for >=4.5:1 on light bg */
}

[data-flavor='catppuccin-latte'] .button.is-text,
[data-theme='catppuccin-latte'] .button.is-text,
[data-flavor='catppuccin-latte'] .button.is-ghost,
[data-theme='catppuccin-latte'] .button.is-ghost,
[data-flavor='catppuccin-latte'] .navbar-item.is-active,
[data-theme='catppuccin-latte'] .navbar-item.is-active {
  color: #0b66d6; /* deeper blue for >=4.5:1 on light bg */
}

[data-flavor='github-dark'] strong,
[data-theme='github-dark'] strong,
[data-flavor='github-dark'] th,
[data-theme='github-dark'] th,
[data-flavor='github-dark'] .has-text-centered > p,
[data-theme='github-dark'] .has-text-centered > p {
  color: #c9d1d9; /* github-dark foreground */
}

[data-flavor='github-dark'] .button.is-text,
[data-theme='github-dark'] .button.is-text,
[data-flavor='github-dark'] .button.is-ghost,
[data-theme='github-dark'] .button.is-ghost {
  color: #58a6ff; /* accessible link blue on dark bg */
}

/* Focus visibility for keyboard-focusable scrollable code regions */
pre:focus-visible,
.highlight pre:focus-visible,
pre.highlight:focus-visible {
  outline: 2px solid var(--turbo-brand-primary, currentColor);
  outline-offset: 2px;
}`;
}
