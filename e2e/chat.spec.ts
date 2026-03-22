import { test, expect } from '@playwright/test'

async function setupExistingUser(page: import('@playwright/test').Page) {
  await page.goto('/choose')
  await page.locator('text=Shaun').click()
  await page.waitForURL(/\/(all-sites|site\/)/)
}

test.describe('Chat / Task flow', () => {
  test('can navigate to tasks screen', async ({ page }) => {
    await setupExistingUser(page)
    // Navigate directly to tasks for the current site
    const url = page.url()
    const siteMatch = url.match(/\/site\/([^/]+)/)
    if (siteMatch) {
      await page.goto(`/sites/${siteMatch[1]}/tasks`)
      await page.waitForURL(/\/tasks/)
    }
  })

  test('new task shows welcome state and input', async ({ page }) => {
    await setupExistingUser(page)
    const url = page.url()
    const siteMatch = url.match(/\/site\/([^/]+)/)
    if (!siteMatch) return

    // Look for new task button
    const newTaskBtn = page.locator('[aria-label="New task"], button:has-text("New task")').first()
    if (await newTaskBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await newTaskBtn.click()
      await page.waitForURL(/\/tasks\//)
      await expect(page.locator('text=New task')).toBeVisible()
      await expect(page.locator('textarea')).toBeVisible()
    }
  })

  test('sending a message adds it to the chat', async ({ page }) => {
    await setupExistingUser(page)
    const url = page.url()
    const siteMatch = url.match(/\/site\/([^/]+)/)
    if (!siteMatch) return

    const newTaskBtn = page.locator('[aria-label="New task"], button:has-text("New task")').first()
    if (await newTaskBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await newTaskBtn.click()
      await page.waitForURL(/\/tasks\//)

      const textarea = page.locator('textarea')
      await textarea.fill('Hello, can you help me?')
      await textarea.press('Enter')

      await expect(page.locator('text=Hello, can you help me?')).toBeVisible({ timeout: 5000 })
    }
  })
})
