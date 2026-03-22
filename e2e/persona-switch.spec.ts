import { test, expect } from '@playwright/test'

test.describe('Persona switching', () => {
  test('switching personas via URL param resets state', async ({ page }) => {
    // Start as existing user
    await page.goto('/choose')
    await page.locator('text=Shaun').click()
    await page.waitForURL(/\/(all-sites|sites\/)/)

    // Switch to new-user via URL param (the way persona switching works)
    await page.goto('/?persona=new-user')
    await page.waitForURL('/welcome')
    await expect(page.locator('text=Build here. Go anywhere.')).toBeVisible()
  })

  test('persona persists across page reload', async ({ page }) => {
    // Choose existing user
    await page.goto('/choose')
    await page.locator('text=Shaun').click()
    await page.waitForURL(/\/(all-sites|site\/)/)

    // Reload the page
    await page.reload()

    // Should still be in the app (not redirected to /choose)
    await page.waitForURL(/\/(all-sites|site\/)/)
  })

  test('URL persona param overrides localStorage', async ({ page }) => {
    // First set up as existing user
    await page.goto('/choose')
    await page.locator('text=Shaun').click()
    await page.waitForURL(/\/(all-sites|site\/)/)

    // Navigate with new-user persona param — should override
    await page.goto('/?persona=new-user')
    await page.waitForURL('/welcome')
  })
})
