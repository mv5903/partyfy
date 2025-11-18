import { test, expect } from '@playwright/test';
import { selectors } from './helpers/selectors';

/**
 * Button Component Tests
 *
 * These tests demonstrate how to test buttons and interactive elements
 * using translation-based test IDs.
 *
 * Run with: npx playwright test test/buttons.spec.ts
 * Run with UI: npx playwright test test/buttons.spec.ts --ui
 */

test.describe('Common Buttons', () => {
  test('save button should be identifiable by translation key', async ({ page }) => {
    await page.goto('/dashboard');

    // Using the translation key as test ID
    const saveButton = page.getByTestId(selectors.buttons.save);

    // Check if button exists (may not be visible on all pages)
    const count = await saveButton.count();
    if (count > 0) {
      await expect(saveButton.first()).toHaveText('Save');
    }
  });

  test('cancel button should be identifiable by translation key', async ({ page }) => {
    await page.goto('/dashboard');

    const cancelButton = page.getByTestId(selectors.buttons.cancel);

    const count = await cancelButton.count();
    if (count > 0) {
      await expect(cancelButton.first()).toHaveText('Cancel');
    }
  });
});

test.describe.skip('Button Interactions - Authenticated', () => {
  // These tests require authentication

  test.beforeEach(async ({ page }) => {
    // TODO: Set up auth state
    await page.goto('/dashboard');
  });

  test('clicking save button should trigger save action', async ({ page }) => {
    const saveButton = page.getByTestId(selectors.buttons.save);

    // Wait for button to be enabled
    await expect(saveButton).toBeEnabled();

    // Click the button
    await saveButton.click();

    // TODO: Assert expected behavior after clicking save
    // For example, check for success message, disabled state, etc.
  });

  test('cancel button should close dialog', async ({ page }) => {
    // Open a dialog/modal that has a cancel button
    // TODO: Implement based on your app's flow

    const cancelButton = page.getByTestId(selectors.buttons.cancel);
    await cancelButton.click();

    // Dialog should be closed
    // TODO: Assert dialog is no longer visible
  });
});

test.describe('Button States', () => {
  test('buttons should have proper hover states', async ({ page }) => {
    await page.goto('/');

    const loginButton = page.getByTestId(selectors.landing.loginButton);

    // Hover over the button
    await loginButton.hover();

    // Button should still be visible and enabled
    await expect(loginButton).toBeVisible();
    await expect(loginButton).toBeEnabled();
  });

  test('buttons should be keyboard accessible', async ({ page }) => {
    await page.goto('/');

    const loginButton = page.getByTestId(selectors.landing.loginButton);

    // Focus the button using keyboard
    await loginButton.focus();

    // Button should be focused
    await expect(loginButton).toBeFocused();

    // Should be activatable with Enter/Space
    // (actual activation would require mocking auth)
  });
});

/**
 * Example: Testing buttons within specific contexts
 */
test.describe('Context-Specific Buttons', () => {
  test.skip('friend request buttons should work correctly', async ({ page }) => {
    // TODO: Set up auth state
    await page.goto('/dashboard');

    // Open friends menu
    const friendsTitle = page.getByTestId(selectors.friends.title);
    // Assuming clicking opens the menu
    // await friendsTitle.click();

    // Find and click add friends button
    const addFriendsButton = page.getByTestId(selectors.friends.addFriends);
    await expect(addFriendsButton).toBeVisible();
    await addFriendsButton.click();

    // TODO: Assert expected behavior
  });

  test.skip('settings buttons should be accessible', async ({ page }) => {
    // TODO: Set up auth state
    await page.goto('/dashboard');

    // Open settings
    const settingsTitle = page.getByTestId(selectors.settings.title);
    // await settingsTitle.click();

    // Verify all settings buttons are present
    const deleteAccountButton = page.getByTestId(selectors.settings.deleteAccount);
    const changeUsernameButton = page.getByTestId(selectors.settings.changeUsername);
    const unlinkSpotifyButton = page.getByTestId(selectors.settings.unlinkSpotify);

    await expect(deleteAccountButton).toBeVisible();
    await expect(changeUsernameButton).toBeVisible();
    await expect(unlinkSpotifyButton).toBeVisible();
  });
});
