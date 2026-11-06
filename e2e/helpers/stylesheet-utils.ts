/**
 * Stylesheet utility functions for E2E tests.
 * Helpers for waiting on CSS stylesheet loading and theme application.
 */

import { type Locator } from '@playwright/test';

/**
 * Waits for a stylesheet link element to be fully loaded.
 * Checks if the sheet property exists (already loaded) or waits for the 'load' event.
 * Resolves gracefully on timeout to avoid flaky test failures (especially in webkit).
 *
 * @param locator - The Playwright locator for the stylesheet link element
 * @param timeoutMs - Maximum time to wait for loading (default: 8000ms)
 * @returns Promise that resolves when the stylesheet is loaded or timeout is reached
 */
export async function waitForStylesheetLoad(locator: Locator, timeoutMs = 8000): Promise<void> {
  try {
    await locator.evaluate(
      (el, timeout) =>
        (el as HTMLLinkElement).sheet
          ? Promise.resolve()
          : new Promise<void>((resolve) => {
              const to = window.setTimeout(() => {
                resolve();
              }, timeout);
              el.addEventListener(
                'load',
                () => {
                  window.clearTimeout(to);
                  resolve();
                },
                { once: true }
              );
              el.addEventListener(
                'error',
                () => {
                  window.clearTimeout(to);
                  // Resolve instead of reject to avoid test failures for CSS load issues
                  resolve();
                },
                { once: true }
              );
            }),
      timeoutMs,
      { timeout: timeoutMs + 5000 } // Give extra time for the evaluate call itself
    );
  } catch {
    // Swallow timeout errors - stylesheet may already be loaded or browser is slow
    // The test should continue and verify actual functionality
  }
}

export { waitForThemeApplied } from './theme-applied';
