import { test, expect } from '../../fixtures/test-fixtures';

test.beforeEach(async ({ page, dashboardPage, clientesPage }) => {
  await page.goto('/', { timeout: 15000 });
  await dashboardPage.verificarVisible();
  await dashboardPage.irAClientes();
  await clientesPage.verificarVisible();
});

test.describe('Visual regression', () => {

  test('grilla de clientes mantiene layout esperado', async ({ page }) => {
    await page.locator('.slick-row').first().waitFor();
    await expect(page).toHaveScreenshot('clientes-page.png');
  });

  test('contenido de grilla mantiene layout esperado', async ({ page }) => {
    const grilla = page.locator('.slick-viewport.sg-body.sg-main');
    await grilla.locator('.slick-row').first().waitFor();
    await expect(grilla).toHaveScreenshot('clientes-grilla.png');
  });

});