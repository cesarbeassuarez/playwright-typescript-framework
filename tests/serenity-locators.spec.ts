import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('https://demo.serenity.is/Account/Login');
  await page.getByRole('textbox', { name: '* Nombre de usuario' }).click();
  await page.getByRole('textbox', { name: '* Nombre de usuario' }).fill('admin');
  await page.getByRole('textbox', { name: '* Contraseña' }).click();
  await page.getByRole('textbox', { name: '* Contraseña' }).fill('serenity');
  await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Tablero' })).toBeVisible();
  await page.getByRole('link', { name: ' Northwind ' }).click();
  await page.getByRole('link', { name: ' Clientes' }).click();
  await expect(page.locator('section')).toBeVisible();
  await expect(page.locator('#GridDiv')).toContainText('ANTON');
});

