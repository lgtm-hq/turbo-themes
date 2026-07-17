import { expect, test } from './fixtures';

/**
 * Docs TOC ("On this page") tests.
 *
 * Verifies that the table of contents renders on docs pages when `toc: true`
 * (the default) and is absent when `toc: false` is set in frontmatter.
 */

test.describe('Docs TOC @smoke', () => {
  test('shows "On this page" TOC on a page with toc enabled and headings', async ({
    page,
  }) => {
    // getting-started/concepts has several h2/h3 headings and toc defaults to true
    await page.goto('/docs/getting-started/concepts/');
    await page.waitForLoadState('domcontentloaded');

    const toc = page.getByTestId('docs-toc');
    await expect(toc).toBeVisible();

    const tocTitle = toc.locator('.docs-toc-title');
    await expect(tocTitle).toHaveText('On this page');

    // Should contain at least one link to a heading anchor
    const links = toc.locator('.docs-toc-link');
    await expect(links.first()).toBeVisible();
    const href = await links.first().getAttribute('href');
    expect(href).toMatch(/^#/);
  });

  test('does not render TOC on a page with toc: false', async ({ page }) => {
    // installation/index has toc: false in frontmatter
    await page.goto('/docs/installation/');
    await page.waitForLoadState('domcontentloaded');

    const toc = page.getByTestId('docs-toc');
    await expect(toc).not.toBeAttached();
  });
});
