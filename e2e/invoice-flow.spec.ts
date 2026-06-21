import { expect, test } from '@playwright/test'

test('quotation to invoice flow renders core screens', async ({ page }) => {
  await page.goto('/login')
  await page.getByLabel(/e-posta/i).fill('admin@demo.com')
  await page.getByLabel(/sifre/i).fill('demo123')
  await page.getByRole('button', { name: /giris yap/i }).click()

  await page.goto('/teklifler')
  await expect(page.getByRole('heading', { name: /teklifler/i })).toBeVisible()

  await page.goto('/faturalar')
  await expect(page.getByRole('heading', { name: /faturalar/i })).toBeVisible()
})
