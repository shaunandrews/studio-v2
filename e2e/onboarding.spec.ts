import { test, expect } from '@playwright/test'

test.describe('Onboarding flow', () => {
  test('fresh visit lands on persona chooser', async ({ page }) => {
    await page.goto('/')
    // First-ever visit with no localStorage → /choose
    await expect(page).toHaveURL('/choose')
  })

  test('persona chooser shows available personas', async ({ page }) => {
    await page.goto('/choose')
    await expect(page.locator('text=New User')).toBeVisible()
    await expect(page.locator('text=Shaun')).toBeVisible()
  })

  test('selecting new-user persona starts onboarding', async ({ page }) => {
    await page.goto('/choose')
    await page.locator('text=New User').click()
    await expect(page).toHaveURL('/welcome')
  })

  test('existing-user persona skips onboarding', async ({ page }) => {
    await page.goto('/choose')
    await page.locator('text=Shaun').click()
    await page.waitForURL(/\/(all-sites|site\/)/)
  })

  test('onboarding welcome shows features and actions', async ({ page }) => {
    await page.goto('/choose')
    await page.locator('text=New User').click()
    await page.waitForURL('/welcome')

    await expect(page.locator('text=Build here. Go anywhere.')).toBeVisible()
    await expect(page.locator('text=AI-powered building')).toBeVisible()
    await expect(page.locator('text=Easy previews')).toBeVisible()
    await expect(page.locator('text=Seamless sync')).toBeVisible()
    await expect(page.locator('text=Skip')).toBeVisible()
    await expect(page.locator('text=Log in with WordPress.com')).toBeVisible()
  })

  test('skip button advances to permissions step', async ({ page }) => {
    await page.goto('/choose')
    await page.locator('text=New User').click()
    await page.waitForURL('/welcome')

    await page.locator('text=Skip').click()
    await expect(page).toHaveURL('/permissions')
    await expect(page.locator('text=Almost ready')).toBeVisible()
  })
})
