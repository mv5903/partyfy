import { test, expect, } from '@playwright/test';
import { TEST_BASE_URL, USERNAME, PASSWORD } from './constants';

test('Can log in to existing account', async ({ page }) => {
  await page.goto(TEST_BASE_URL);

  // Expect a title "to contain" a substring.
  await expect(page).toHaveTitle(/Playwright/);
});

test('get started link', async ({ page }) => {
  await page.goto(TEST_BASE_URL);
  // Click the get started link.
  await page.getByRole('link', { name: 'Get started' }).click();

  // Expects page to have a heading with the name of Installation.
  await expect(page.getByRole('heading', { name: 'Installation' })).toBeVisible();
});
