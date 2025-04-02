import { expect, test } from '@playwright/test'

test.describe('Homepage', () => {
  test('should load the homepage', async ({ page }) => {
    await page.goto('/')

    // Check if the page loaded successfully
    await expect(page).toHaveTitle(/Polkadot Migration/)

    // REVIEW: Add more specific checks based on your homepage content
    // For example:
    // await expect(page.getByRole('heading', { name: 'Welcome' })).toBeVisible();
    // await expect(page.getByRole('button', { name: 'Connect Wallet' })).toBeVisible();
  })
})
