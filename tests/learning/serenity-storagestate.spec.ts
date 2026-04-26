import { test, expect } from '@playwright/test';

test.describe('Tests sin login (storageState)', () => {

  test('acceder al dashboard sin login', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Tablero' })).toBeVisible();
  });

  test('acceder a clientes sin login', async ({ page }) => {
    await page.goto('/Northwind/Customer');
    await expect(page.locator('#GridDiv')).toContainText('ANTON');
  });

});