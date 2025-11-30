import { test, expect, } from '@playwright/test';
import { login } from '@/test/helpers/functions';

test('User can log in with valid credentials - User has Spotify set up already + has friends', async ({ page }) => {
  await login(page, process.env.EMAIL_1, process.env.PASSWORD_1);
  await expect(page.getByRole('button', { name: process.env.USERNAME_2 })).toBeVisible();
});

test('User can log in with valid credentials - User does not have Spotify set up yet', async ({ page }) => {
  await login(page, process.env.EMAIL_3, process.env.PASSWORD_3);
  await expect(page.getByRole('button', { name: 'Authenticate Spotify' })).toBeVisible();
});