import { test, expect } from '@playwright/test'

// Helper: select existing-user persona from the chooser
async function setupExistingUser(page: import('@playwright/test').Page) {
  await page.goto('/choose')
  await page.locator('text=Shaun').click()
  await page.waitForURL(/\/(all-sites|site\/)/)
}

test.describe('Add site flow', () => {
  test('add-site page shows path options', async ({ page }) => {
    await setupExistingUser(page)
    await page.goto('/add-site')
    await expect(page.locator('text=Blank site')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('text=Blueprint')).toBeVisible()
    await expect(page.locator('text=Pull existing')).toBeVisible()
    await expect(page.locator('text=Import backup')).toBeVisible()
  })

  test('choosing blank site goes to details form', async ({ page }) => {
    await setupExistingUser(page)
    await page.goto('/add-site')
    await expect(page.locator('text=Blank site')).toBeVisible({ timeout: 10000 })
    await page.locator('text=Blank site').click()
    await expect(page).toHaveURL('/add-site/details')
  })

  test('choosing blueprint goes to picker', async ({ page }) => {
    await setupExistingUser(page)
    await page.goto('/add-site')
    await expect(page.locator('text=Blueprint')).toBeVisible({ timeout: 10000 })
    await page.locator('text=Blueprint').click()
    await expect(page).toHaveURL('/add-site/blueprint')
    await expect(page.locator('text=Quick Start')).toBeVisible()
  })

  test('full blank site creation flow', async ({ page }) => {
    await setupExistingUser(page)
    await page.goto('/add-site')
    await expect(page.locator('text=Blank site')).toBeVisible({ timeout: 10000 })
    await page.locator('text=Blank site').click()
    await expect(page).toHaveURL('/add-site/details')

    const nameInput = page.locator('input[type="text"]').first()
    await nameInput.fill('My Test Site')
    await page.locator('text=Create site').click()

    // Building animation → navigates to site
    await page.waitForURL(/\/sites\//, { timeout: 15000 })
  })
})
