import { expect, test } from '@playwright/test'

test.describe('Login flow', () => {
  test('valid credentials navigate to dashboard', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel(/e-posta/i).fill('admin@demo.com')
    await page.getByLabel(/sifre/i).fill('demo123')
    await page.getByRole('button', { name: /giris yap/i }).click()

    await expect(page).toHaveURL(/\/$/)
    await expect(page.getByText(/genel bakis/i)).toBeVisible()
  })

  test('invalid credentials show an error state', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel(/e-posta/i).fill('admin@demo.com')
    await page.getByLabel(/sifre/i).fill('yanlis123')
    await page.getByRole('button', { name: /giris yap/i }).click()

    await expect(page.getByText(/hatali|gecersiz|invalid/i)).toBeVisible()
  })
})

