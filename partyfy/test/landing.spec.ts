import { test, expect } from '@playwright/test';
import { selectors } from './helpers/selectors';

/**
 * Landing Page Tests
 *
 * These tests verify the landing page functionality using translation-based test IDs.
 * Run with: npx playwright test test/landing.spec.ts
 * Run with UI: npx playwright test test/landing.spec.ts --ui
 */

test.describe('Landing Page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the landing page
    await page.goto('/');
  });

  test('should display the Partyfy title', async ({ page }) => {
    // Using translation key as test ID
    const title = page.getByTestId(selectors.landing.title);
    await expect(title).toBeVisible();
    await expect(title).toHaveText('Partyfy');
  });

  test('should display the description', async ({ page }) => {
    const description = page.getByTestId(selectors.landing.description);
    await expect(description).toBeVisible();
    await expect(description).toContainText('Add to your friend\'s Spotify queue');
  });

  test('should display login button', async ({ page }) => {
    const loginButton = page.getByTestId(selectors.landing.loginButton);
    await expect(loginButton).toBeVisible();
    await expect(loginButton).toHaveText('Log In / Sign Up');
  });

  test('should have Partyfy logo', async ({ page }) => {
    const logo = page.locator('img[alt="Partyfy Logo"]');
    await expect(logo).toBeVisible();
  });

  test('login button should be clickable', async ({ page }) => {
    const loginButton = page.getByTestId(selectors.landing.loginButton);
    await expect(loginButton).toBeEnabled();
  });
});
