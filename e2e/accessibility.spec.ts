import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';
import {
  getContrastRatio,
  serveThemeCssWithoutExternalImports,
  waitForStylesheetLoad,
  waitForThemeApplied,
} from './helpers';

/**
 * Runs an accessibility scan using axe-core and logs violations if found.
 *
 * @param page - The Playwright page instance to scan.
 * @returns The accessibility scan results.
 */
async function runAccessibilityScan(page: Page) {
  const accessibilityScanResults = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag21a', 'wcag22a']) // Remove wcag2aa, wcag21aa, wcag22aa to skip contrast requirements
    .disableRules(['target-size', 'color-contrast', 'link-in-text-block', 'scrollable-region-focusable']) // Disable checks handled by CSS or not critical for theme demos
    .analyze();

  if (accessibilityScanResults.violations.length > 0) {
    console.error(
      'Accessibility violations found:',
      JSON.stringify(accessibilityScanResults.violations, null, 2)
    );
  }

  return accessibilityScanResults;
}

/**
 * Accessibility tests using axe-core.
 *
 * Tests:
 * - Homepage accessibility compliance
 * - Theme switching doesn't break accessibility
 * - Navigation accessibility
 * - Keyboard navigation support
 */
test.describe('Accessibility Tests @a11y', () => {
  // Skip on webkit due to timing issues with CSS loading and axe-core
  test.skip(({ browserName }) => browserName === 'webkit', 'Webkit has CSS timing issues with axe-core');

  test('should have no accessibility violations on homepage', async ({ homePage }) => {
    await homePage.goto();

    await test.step('Run axe accessibility scan', async () => {
      const accessibilityScanResults = await runAccessibilityScan(homePage.page);
      expect(accessibilityScanResults.violations).toHaveLength(0);
    });
  });

  const themes = ['catppuccin-mocha', 'catppuccin-latte'] as const;

  themes.forEach((theme) => {
    test(`should have no accessibility violations when switching to ${theme} theme`, async ({
      homePage,
    }) => {
      await homePage.goto();

      await test.step(`Switch to ${theme} theme`, async () => {
        await homePage.switchToTheme(theme);
      });

      await test.step(`Run axe accessibility scan with ${theme} theme`, async () => {
        const accessibilityScanResults = await runAccessibilityScan(homePage.page);
        expect(accessibilityScanResults.violations).toHaveLength(0);
      });
    });
  });

  test('should have no accessibility violations on components page', async ({ basePage }) => {
    await basePage.goto('/');
    await basePage.navigateToPage('components');

    await test.step('Run axe accessibility scan on components page', async () => {
      const accessibilityScanResults = await runAccessibilityScan(basePage.page);
      expect(accessibilityScanResults.violations).toHaveLength(0);
    });
  });

  test('should have no accessibility violations on themes page', async ({ basePage }) => {
    await basePage.goto('/');
    await basePage.navigateToPage('themes');

    await test.step('Run axe accessibility scan on themes page', async () => {
      const accessibilityScanResults = await runAccessibilityScan(basePage.page);
      expect(accessibilityScanResults.violations).toHaveLength(0);
    });
  });

  /**
   * Representative theme sample for showcase scans: light + dark from the
   * default family plus a high-saturation dark and an independent light theme.
   */
  const showcaseThemes = ['catppuccin-latte', 'catppuccin-mocha', 'dracula', 'github-light'] as const;

  /** WCAG 2.x AA minimum contrast ratio for normal-size text. */
  const MIN_CONTRAST_NORMAL_TEXT = 4.5;

  test.describe('Showcase homepage per-theme audit', () => {
    showcaseThemes.forEach((theme) => {
      test(`should have no axe or contrast violations on homepage under ${theme}`, async ({
        homePage,
      }) => {
        // Reduced motion keeps reveal animations from racing the scans
        // (axe skips text while its reveal animation holds opacity at 0).
        await homePage.page.emulateMedia({ reducedMotion: 'reduce' });
        await serveThemeCssWithoutExternalImports(homePage.page);
        try {
          await homePage.goto();

          await test.step(`Switch to ${theme} theme`, async () => {
            await homePage.switchToTheme(theme);
            await waitForStylesheetLoad(homePage.getThemeCss());
            expect(await waitForThemeApplied(homePage.page, theme)).toBe(true);
          });

          await test.step('Run axe accessibility scan', async () => {
            const accessibilityScanResults = await runAccessibilityScan(homePage.page);
            expect(accessibilityScanResults.violations).toHaveLength(0);
          });

          await test.step('Run axe color-contrast scan on the showcase content', async () => {
            const contrastScanResults = await new AxeBuilder({ page: homePage.page })
              .include('.showcase-page')
              .withRules(['color-contrast'])
              .analyze();

            if (contrastScanResults.violations.length > 0) {
              console.error(
                'Color-contrast violations found:',
                JSON.stringify({ theme, violations: contrastScanResults.violations }, null, 2)
              );
            }
            expect(contrastScanResults.violations).toHaveLength(0);
          });

          await test.step('Verify contrast of decorative showcase text', async () => {
            // Targeted checks for text axe skips or approximates: the marquee
            // names live inside aria-labelled buttons, and the badge/feature
            // copy sits on translucent color-mix backgrounds.
            const decorativeText = {
              badge: homePage.page.locator('.showcase-badge'),
              'marquee theme name': homePage.page.locator('.showcase-marquee-name').first(),
              'feature card title': homePage.page.locator('.showcase-feature h3').first(),
              'feature card description': homePage.page.locator('.showcase-feature p').first(),
            };

            for (const [label, locator] of Object.entries(decorativeText)) {
              const ratio = await getContrastRatio(locator);
              expect(
                ratio,
                `${label} contrast ratio under ${theme} (got ${ratio.toFixed(2)})`
              ).toBeGreaterThanOrEqual(MIN_CONTRAST_NORMAL_TEXT);
            }
          });
        } finally {
          await homePage.page.unrouteAll({ behavior: 'ignoreErrors' });
        }
      });
    });
  });

  test.describe('Showcase keyboard operability', () => {
    test.beforeEach(async ({ homePage }) => {
      // Freeze marquee/reveal animations so focus targets are stable.
      await homePage.page.emulateMedia({ reducedMotion: 'reduce' });
      await homePage.goto();
    });

    test('should reach preview tabs and marquee theme buttons in tab order', async ({
      homePage,
    }) => {
      const page = homePage.page;

      await test.step('Tab from the hero CTA lands on the active preview tab', async () => {
        await page.getByTestId('home-cta-explore-themes').focus();
        await page.keyboard.press('Tab');
        await expect(homePage.getPreviewTab('overview')).toBeFocused();
      });

      await test.step('Inactive tabs are out of the tab order (roving tabindex)', async () => {
        await expect(homePage.getPreviewTab('components')).toHaveAttribute('tabindex', '-1');
        await expect(homePage.getPreviewTab('themes')).toHaveAttribute('tabindex', '-1');
      });

      await test.step('Tab continues into the active panel, then the marquee', async () => {
        await page.keyboard.press('Tab');
        await expect(page.getByTestId('home-preview-code-copy')).toBeFocused();

        // Capture the expected first marquee card before Tab so a new
        // focusable in the overview panel cannot silently retarget :focus.
        const firstMarqueeCard = page.locator('.showcase-marquee-card').first();
        await page.keyboard.press('Tab');
        await expect(firstMarqueeCard).toBeFocused();
        await expect(firstMarqueeCard).toHaveAttribute('data-theme-preview', /.+/);
      });
    });

    test('should operate preview tabs with the ARIA tablist keyboard pattern', async ({
      homePage,
    }) => {
      const page = homePage.page;
      const overviewTab = homePage.getPreviewTab('overview');
      const componentsTab = homePage.getPreviewTab('components');
      const themesTab = homePage.getPreviewTab('themes');

      await test.step('Arrow keys move focus without changing the selection', async () => {
        await overviewTab.focus();
        await page.keyboard.press('ArrowRight');

        await expect(componentsTab).toBeFocused();
        await expect(componentsTab).toHaveAttribute('tabindex', '0');
        await expect(overviewTab).toHaveAttribute('aria-selected', 'true');
        await expect(homePage.getPreviewPanel('overview')).toBeVisible();
      });

      await test.step('Space activates the focused tab', async () => {
        await page.keyboard.press('Space');

        await expect(componentsTab).toHaveAttribute('aria-selected', 'true');
        await expect(homePage.getPreviewPanel('components')).toBeVisible();
        await expect(homePage.getPreviewPanel('overview')).toBeHidden();
      });

      await test.step('Enter activates the next tab', async () => {
        await page.keyboard.press('ArrowRight');
        await expect(themesTab).toBeFocused();
        await page.keyboard.press('Enter');

        await expect(themesTab).toHaveAttribute('aria-selected', 'true');
        await expect(homePage.getPreviewPanel('themes')).toBeVisible();
        await expect(homePage.getPreviewPanel('components')).toBeHidden();
      });

      await test.step('Arrow keys wrap around the tablist', async () => {
        await page.keyboard.press('ArrowRight');
        await expect(overviewTab).toBeFocused();

        await page.keyboard.press('ArrowLeft');
        await expect(themesTab).toBeFocused();
      });

      await test.step('Home and End jump to the first and last tab', async () => {
        await page.keyboard.press('Home');
        await expect(overviewTab).toBeFocused();

        await page.keyboard.press('End');
        await expect(themesTab).toBeFocused();
      });
    });

    test('should apply a marquee theme with the keyboard', async ({ homePage }) => {
      const page = homePage.page;
      await serveThemeCssWithoutExternalImports(page);
      try {
        const card = homePage.getMarqueeThemeCard('dracula');

        await test.step('Focus the marquee card and press Enter', async () => {
          await card.focus();
          await expect(card).toBeFocused();
          await page.keyboard.press('Enter');
        });

        await test.step('Verify the theme is applied through the selector pipeline', async () => {
          await expect(page.locator('html')).toHaveAttribute('data-theme', 'dracula');
          await expect(card).toHaveAttribute('aria-pressed', 'true');
        });
      } finally {
        await page.unrouteAll({ behavior: 'ignoreErrors' });
      }
    });

    test('should disable marquee and reveal animation under reduced motion', async ({
      homePage,
    }) => {
      const page = homePage.page;

      await test.step('Marquee rows do not animate', async () => {
        await expect(page.locator('.showcase-marquee-left')).toHaveCSS('animation-name', 'none');
        await expect(page.locator('.showcase-marquee-right')).toHaveCSS('animation-name', 'none');
      });

      await test.step('Hero reveal text is immediately visible', async () => {
        const badge = page.locator('.showcase-badge');
        await expect(badge).toHaveCSS('animation-name', 'none');
        await expect(badge).toHaveCSS('opacity', '1');
      });

      await test.step('Scroll-reveal cards are revealed without animation', async () => {
        const feature = page.locator('.showcase-feature[data-showcase-reveal]').first();
        await expect(feature).toHaveClass(/is-visible/);
        await expect(feature).toHaveCSS('opacity', '1');
      });
    });
  });

  test('should have proper ARIA attributes on navigation', async ({ basePage }) => {
    await basePage.goto('/');

    await test.step('Verify navigation has proper ARIA roles', async () => {
      const nav = basePage.page.getByRole('navigation');
      await expect(nav).toBeVisible();
    });

    await test.step('Verify links have proper ARIA attributes', async () => {
      const links = await basePage.getAllNavLinks();

      // Check that links are accessible (they have implicit link role)
      await expect(links.home).toBeVisible();
      await expect(links.components).toBeVisible();
      await expect(links.themes).toBeVisible();

      // Verify active link has aria-current="page"
      // On the homepage, the navigation should always have an active link indicating the current page
      const activeLink = basePage.page.locator('nav a.nav-link.active');
      await expect(activeLink).toHaveCount(1);
      await expect(activeLink.first()).toHaveAttribute('aria-current', 'page');
    });
  });

  /**
   * Regression for #741: Noir `html:root a` used to paint accent ink on
   * `<a class="btn btn-primary">`, making pastel-gradient CTAs unreadable.
   */
  test.describe('btn-primary anchor contrast', () => {
    const btnThemes = ['catppuccin-frappe', 'catppuccin-latte'] as const;

    btnThemes.forEach((theme) => {
      test(`should keep home and examples primary CTA contrast under ${theme}`, async ({
        homePage,
      }) => {
        await homePage.page.emulateMedia({ reducedMotion: 'reduce' });
        await serveThemeCssWithoutExternalImports(homePage.page);
        try {
          await homePage.goto();
          await homePage.switchToTheme(theme);
          await waitForStylesheetLoad(homePage.getThemeCss());
          expect(await waitForThemeApplied(homePage.page, theme)).toBe(true);

          await test.step('Homepage Get started CTA meets AA contrast', async () => {
            const cta = homePage.page.getByTestId('home-cta-get-started');
            await expect(cta).toBeVisible();
            const ratio = await getContrastRatio(cta);
            expect(
              ratio,
              `home-cta-get-started contrast under ${theme} (got ${ratio.toFixed(2)})`
            ).toBeGreaterThanOrEqual(MIN_CONTRAST_NORMAL_TEXT);
          });

          await test.step('Examples page primary CTA meets AA contrast', async () => {
            await homePage.page.goto('/examples/');
            await homePage.page.waitForLoadState('domcontentloaded');
            expect(await waitForThemeApplied(homePage.page, theme)).toBe(true);
            const cta = homePage.page.getByTestId('examples-cta-contribute');
            await expect(cta).toBeVisible();
            const ratio = await getContrastRatio(cta);
            expect(
              ratio,
              `examples-cta-contribute contrast under ${theme} (got ${ratio.toFixed(2)})`
            ).toBeGreaterThanOrEqual(MIN_CONTRAST_NORMAL_TEXT);
          });
        } finally {
          await homePage.page.unrouteAll({ behavior: 'ignoreErrors' });
        }
      });
    });
  });
});
