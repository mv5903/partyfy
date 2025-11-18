import { test, expect } from '@playwright/test';
import { selectors } from './helpers/selectors';

/**
 * RequestSong Component Tests
 *
 * These tests verify the song request functionality using translation-based test IDs.
 *
 * Note: These tests require authentication. You may need to set up auth state.
 * See: https://playwright.dev/docs/auth
 *
 * Run with: npx playwright test test/request-song.spec.ts
 * Run with UI: npx playwright test test/request-song.spec.ts --ui
 * Run headed: npx playwright test test/request-song.spec.ts --headed
 */

test.describe('Request Song - Unauthenticated', () => {
  test('should redirect to landing page when not authenticated', async ({ page }) => {
    await page.goto('/request/somefriend123');

    // Should redirect to landing page
    await expect(page).toHaveURL('/');
  });
});

// Example: Authenticated tests (requires auth setup)
test.describe.skip('Request Song - Authenticated', () => {
  // TODO: Set up authentication state before these tests
  // See: https://playwright.dev/docs/auth#basic-shared-account-in-all-tests

  test.beforeEach(async ({ page }) => {
    // TODO: Load auth state
    // await page.context().addCookies([...authCookies]);
    await page.goto('/request/friend123');
  });

  test('should display controlling header', async ({ page }) => {
    const controllingHeader = page.getByTestId(selectors.request.controlling);
    await expect(controllingHeader).toBeVisible();
    await expect(controllingHeader).toContainText('Controlling:');
  });

  test('should display queue quota when available', async ({ page }) => {
    const quotaDisplay = page.getByTestId(selectors.request.queueQuotaRemaining);

    // Wait for quota to load (API call)
    await expect(quotaDisplay).toBeVisible({ timeout: 10000 });
    await expect(quotaDisplay).toContainText('queues remaining');
  });

  test('should display time remaining when quota exhausted', async ({ page }) => {
    const timeRemaining = page.getByTestId(selectors.request.queueQuotaTimeRemaining);

    // This will only be visible when quota is exhausted
    if (await timeRemaining.isVisible()) {
      await expect(timeRemaining).toContainText('remaining until your next queue');
      await expect(timeRemaining).toHaveClass(/text-yellow-400/);
    }
  });

  test('should have three tabs for authenticated users', async ({ page }) => {
    const searchTab = page.getByTestId(selectors.request.tabs.search);
    const yourMusicTab = page.getByTestId(selectors.request.tabs.yourMusic);
    const sessionTab = page.getByTestId(selectors.request.tabs.session);

    await expect(searchTab).toBeVisible();
    await expect(yourMusicTab).toBeVisible();
    await expect(sessionTab).toBeVisible();
  });

  test('should switch between tabs', async ({ page }) => {
    const searchTab = page.getByTestId(selectors.request.tabs.search);
    const yourMusicTab = page.getByTestId(selectors.request.tabs.yourMusic);
    const sessionTab = page.getByTestId(selectors.request.tabs.session);

    // Click on Your Music tab
    await yourMusicTab.click();
    await expect(yourMusicTab).toHaveAttribute('data-state', 'active');

    // Click on Session tab
    await sessionTab.click();
    await expect(sessionTab).toHaveAttribute('data-state', 'active');

    // Click back to Search tab
    await searchTab.click();
    await expect(searchTab).toHaveAttribute('data-state', 'active');
  });
});

test.describe('Request Song - Temporary Session', () => {
  test.skip('should display two tabs for temporary session users', async ({ page }) => {
    // TODO: Create a temporary session and navigate to it
    await page.goto('/session/temp-session-id-123');

    const searchTab = page.getByTestId(selectors.request.tabs.search);
    const sessionTab = page.getByTestId(selectors.request.tabs.session);
    const yourMusicTab = page.getByTestId(selectors.request.tabs.yourMusic);

    await expect(searchTab).toBeVisible();
    await expect(sessionTab).toBeVisible();
    // Your Music tab should NOT be visible for temporary sessions
    await expect(yourMusicTab).not.toBeVisible();
  });
});
