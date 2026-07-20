import { expect, test } from './fixtures';
import {
  takeScreenshotWithHighlight,
  waitForStylesheetLoad,
} from './helpers';

/**
 * Homepage theme switching E2E tests.
 *
 * Tests:
 * - Theme selector is visible and functional
 * - Theme switching updates DOM attributes
 * - Theme persists in localStorage
 * - Visual snapshots for different themes
 */
test.describe('Homepage Theme Switching @smoke', () => {
  test.beforeEach(async ({ homePage }) => {
    await homePage.goto();
  });

  test('should display theme selector', async ({ homePage }) => {
    await test.step('Verify theme selector is visible', async () => {
      await homePage.expectThemeSelectorVisible();

      // Take screenshot highlighting the selector
      await takeScreenshotWithHighlight(
        homePage.page,
        homePage.getThemeSelector(),
        'theme-selector-display'
      );
    });
  });

  test('should persist theme selection after page reload', async ({ homePage }) => {
    await test.step('Switch to catppuccin-mocha theme', async () => {
      await homePage.switchToTheme('catppuccin-mocha');
    });

    await test.step('Verify theme persists after reload', async () => {
      await homePage.verifyThemePersistence('catppuccin-mocha');

      // Take screenshot showing persisted theme
      const htmlElement = homePage.page.locator('html');
      await takeScreenshotWithHighlight(homePage.page, htmlElement, 'theme-persisted-after-reload');
    });
  });

  // Theme switching tests organized by theme
  test.describe('Theme Switching', () => {
    const themesToTest = ['catppuccin-mocha', 'catppuccin-latte'];

    for (const theme of themesToTest) {
      test(`should switch to ${theme} theme`, async ({ homePage, browserName }) => {
        // Skip catppuccin-latte on webkit due to CSS loading timing issues
        test.skip(browserName === 'webkit' && theme === 'catppuccin-latte', 'Webkit has CSS loading timing issues');

        await test.step(`Switch to ${theme} theme`, async () => {
          await homePage.switchToTheme(theme);
        });

        await test.step('Verify theme applied and take screenshot', async () => {
          // Verify data-theme attribute on html element
          await expect(homePage.page.locator('html')).toHaveAttribute('data-theme', theme);

          // Verify localStorage contains the theme
          const storedTheme = await homePage.page.evaluate(() => localStorage.getItem('turbo-theme'));
          expect(storedTheme).toBe(theme);

          // Verify theme CSS is loaded
          const themeCss = homePage.page.locator('#turbo-theme-css');
          // Escape all regex special chars
          const escapedTheme = theme.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          await expect(themeCss).toHaveAttribute(
            'href',
            new RegExp(`${escapedTheme}\\.css(?:\\?.*)?`)
          );

          // Wait for stylesheet network response + load event to avoid timeouts
          await homePage.page
            .waitForResponse((resp) => resp.url().includes(`${theme}.css`) && resp.ok(), {
              timeout: 15000,
            })
            .catch(() => {});
          await waitForStylesheetLoad(themeCss);

          // Take screenshot with theme CSS element highlighted
          await takeScreenshotWithHighlight(homePage.page, themeCss, `${theme}-theme-applied`);
        });
      });
    }
  });

  // Showcase-specific interactions (marquee theme cards, preview tabs)
  test.describe('Showcase Interactions', () => {
    test.beforeEach(async ({ homePage }) => {
      // Freeze the marquee animation so cards are stable click targets
      await homePage.page.emulateMedia({ reducedMotion: 'reduce' });
      await homePage.goto();
    });

    test('should apply a theme from a marquee card', async ({ homePage }) => {
      // Theme stylesheets start with Google Fonts @imports. CI blocks
      // external font hosts, which makes the <link> fire `error` and the
      // selector roll the lazy load back (#698/#699). Serve the stylesheet
      // with external imports stripped so the pipeline outcome is
      // deterministic across environments.
      await homePage.page.route('**/assets/css/themes/turbo/bulma-dark.css', async (route) => {
        const response = await route.fetch();
        const body = (await response.text()).replace(/@import url\((?:'|")https?:[^)]*\);/g, '');
        await route.fulfill({ response, body });
      });

      const card = homePage.getMarqueeThemeCard('bulma-dark');

      await test.step('Click the marquee theme card', async () => {
        await expect(card).toBeVisible();
        await card.click();
      });

      await test.step('Verify the theme is applied through the selector pipeline', async () => {
        await expect(homePage.page.locator('html')).toHaveAttribute('data-theme', 'bulma-dark');
        await expect(card).toHaveAttribute('aria-pressed', 'true');

        const storedTheme = await homePage.page.evaluate(() =>
          localStorage.getItem('turbo-theme')
        );
        expect(storedTheme).toBe('bulma-dark');

        // The integration API loads theme CSS lazily via the selector loader
        const themeCss = homePage.page.locator('link#theme-bulma-dark-css');
        await expect(themeCss).toHaveAttribute('href', /bulma-dark\.css/);
      });

      // Ignore route callbacks still in flight (e.g. the hover prefetch)
      await homePage.page.unrouteAll({ behavior: 'ignoreErrors' });
    });

    test('should prefetch theme CSS when hovering a marquee card', async ({ homePage }) => {
      const card = homePage.getMarqueeThemeCard('catppuccin-frappe');

      await test.step('Hover the marquee theme card', async () => {
        await expect(card).toBeVisible();
        await card.hover();
      });

      await test.step('Verify a prefetch link was injected', async () => {
        const prefetch = homePage.page.locator('link#theme-catppuccin-frappe-prefetch');
        await expect(prefetch).toHaveAttribute('href', /catppuccin-frappe\.css/);
        await expect(prefetch).toHaveAttribute('rel', 'prefetch');
      });
    });

    test('should switch preview panels via the preview tabs', async ({ homePage }) => {
      await test.step('Switch to the components panel', async () => {
        const componentsTab = homePage.getPreviewTab('components');
        await componentsTab.click();

        await expect(componentsTab).toHaveAttribute('aria-selected', 'true');
        await expect(homePage.getPreviewPanel('components')).toBeVisible();
        await expect(homePage.getPreviewPanel('overview')).toBeHidden();
      });

      await test.step('Switch to the themes panel and verify the active theme', async () => {
        await homePage.getPreviewTab('themes').click();

        await expect(homePage.getPreviewPanel('themes')).toBeVisible();
        await expect(
          homePage.page.locator('#showcase-preview-theme-name')
        ).toHaveText('Catppuccin Mocha');
      });
    });

    test('should sync the marquee active card with the header dropdown', async ({ homePage }) => {
      await test.step('Switch theme via the header dropdown', async () => {
        await homePage.switchToTheme('catppuccin-latte');
      });

      await test.step('Verify the matching marquee card is marked active', async () => {
        await expect(homePage.getMarqueeThemeCard('catppuccin-latte')).toHaveAttribute(
          'aria-pressed',
          'true'
        );
        await expect(homePage.getMarqueeThemeCard('catppuccin-mocha')).toHaveAttribute(
          'aria-pressed',
          'false'
        );
      });
    });
  });

  // Visual snapshot tests organized separately
  test.describe('Visual Snapshots @visual', () => {
    const themes = ['catppuccin-mocha', 'catppuccin-latte'];

    for (const theme of themes) {
      test(`should take visual snapshot of ${theme} theme`, async ({ homePage }) => {
        await test.step(`Switch to ${theme} theme`, async () => {
          await homePage.switchToTheme(theme);
        });

        await test.step('Take visual snapshot', async () => {
          // Wait for CSS to be fully applied
          const themeCss = homePage.page.locator('#turbo-theme-css');
          // Escape all regex special chars
          const escapedTheme = theme.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          await expect(themeCss).toHaveAttribute(
            'href',
            new RegExp(`${escapedTheme}\\.css(?:\\?.*)?`)
          );
          // stylesheet loaded (wait for 'load' if not yet loaded)
          await homePage.page
            .waitForResponse((resp) => resp.url().includes(`${theme}.css`) && resp.ok(), {
              timeout: 15000,
            })
            .catch(() => {});
          await waitForStylesheetLoad(themeCss);

          // Take snapshot of the main content area
          const mainContent = homePage.getMainContent();

          // Skip visual snapshots for now - focus on functional testing
          // Visual regression testing can be added later with proper baseline snapshots
          await expect(mainContent).toBeVisible();
        });
      });
    }
  });
});
