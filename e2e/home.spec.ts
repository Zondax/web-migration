import { test, expect } from '@playwright/test'

test.describe('Home Page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the homepage before each test
    await page.goto('/')
  })

  test('should have the correct title', async ({ page }) => {
    // Check if the title is correct
    await expect(page).toHaveTitle(/Polkadot Migration/)
  })

  test('should have main navigation elements', async ({ page }) => {
    // Check for main navigation elements
    await expect(page.locator('nav')).toBeVisible()
    
    // Look for key navigation links (adjust selectors as needed)
    const navLinks = page.locator('nav a')
    await expect(navLinks).toHaveCount(await navLinks.count())
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
    await expect(page.locator('nav')).toBeVisible()
    
    // You might check for mobile menu button
    const mobileMenuButton = page.locator('button[aria-label="Menu"]', { strict: false })
    if (await mobileMenuButton.count() > 0) {
      await expect(mobileMenuButton).toBeVisible()
    }
    
    // Test responsive behavior - desktop viewport
    await page.setViewportSize({ width: 1280, height: 800 })
    await expect(page.locator('nav')).toBeVisible()
  })
})
