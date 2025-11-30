import { Page } from '@playwright/test';

export async function login(page: Page, email: string, password: string) {
    await page.goto(process.env.BASE_URL);
    await page.getByRole('link', { name: 'Log In' }).first().click();
    await page.getByRole('textbox', { name: 'Email address' }).fill(email);
    await page.getByRole('textbox', { name: 'Email address' }).press('Tab');
    await page.getByRole('textbox', { name: 'Password' }).fill(password);
    await page.getByRole('button', { name: 'Continue', exact: true }).click();
}