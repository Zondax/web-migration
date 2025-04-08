import { expect, test } from '@playwright/test'

test.describe('Home Page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the homepage before each test
    await page.goto('/')
  })

  test('should have the correct title', async ({ page }) => {
    // Check if the title is correct
    await expect(page).toHaveTitle(/Polkadot Migration/)
  })

  test('should have primary and secondary migration buttons', async ({ page }) => {
    // Check for primary "Start Migration" button
    const primaryMigrationButton = page.getByText('Start Migration', { exact: true }).nth(0)
    await expect(primaryMigrationButton).toBeVisible()

    // Check for secondary "Start Migration" button
    const secondaryMigrationButton = page.getByText('Start Migration', { exact: true }).nth(1)
    await expect(secondaryMigrationButton).toBeVisible()
  })

  test('should display main content sections', async ({ page }) => {
    // Check for main content sections
    await expect(page.locator('main')).toBeVisible()

    // You can add more specific checks for content here
    // For example:
    await expect(page.locator('h1')).toBeVisible()
  })

  test('should handle responsive layout', async ({ page }) => {
    // Test responsive behavior - mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    let primaryMigrationButton = page.getByText('Start Migration', { exact: true }).nth(0)
    await expect(primaryMigrationButton).toBeVisible()

    // Test responsive behavior - desktop viewport
    await page.setViewportSize({ width: 1280, height: 800 })
    primaryMigrationButton = page.getByText('Start Migration', { exact: true }).nth(0)
    await expect(primaryMigrationButton).toBeVisible()
  })
})
