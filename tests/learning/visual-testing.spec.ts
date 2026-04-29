import { test, expect } from '@playwright/test';

test.use({ storageState: '.auth/user.json' });

test('screenshot de grilla de clientes', async ({ page }) => {
  await page.goto('/Northwind/Customer');
  
  // Esperar que la grilla cargue
  await page.locator('.slick-row').first().waitFor();
  
  // Screenshot de página completa
  await expect(page).toHaveScreenshot('grilla-clientes.png');
});

test('grilla con datos mockeados debe fallar visual test', async ({ page }) => {
  // Interceptar la API y devolver 2 clientes inventados
  await page.route('**/Services/Northwind/Customer/List', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        Entities: [
          { CustomerID: 'TEST1', CompanyName: 'Empresa Inventada SA', ContactName: 'César Beas', ContactTitle: 'QA Lead', City: 'Córdoba', Country: 'Argentina' },
          { CustomerID: 'TEST2', CompanyName: 'Playwright Mock Corp', ContactName: 'Test User', ContactTitle: 'Developer', City: 'Buenos Aires', Country: 'Argentina' },
        ],
        TotalCount: 2
      })
    });
  });

  await page.goto('/Northwind/Customer');
  await page.locator('.slick-row').first().waitFor();

  // Comparar contra la MISMA golden file — tiene que fallar
  await expect(page).toHaveScreenshot('grilla-clientes.png');
});

test('screenshot solo de la grilla', async ({ page }) => {
  await page.goto('/Northwind/Customer');
  const grilla = page.locator('.slick-viewport.sg-body.sg-main');
  await grilla.locator('.slick-row').first().waitFor();

  await expect(grilla).toHaveScreenshot('grilla-solo.png');
});

test('mock con tolerancia alta pasa', async ({ page }) => {
  await page.route('**/Services/Northwind/Customer/List', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        Entities: [
          { CustomerID: 'TEST1', CompanyName: 'Empresa Inventada SA', ContactName: 'César Beas', ContactTitle: 'QA Lead', City: 'Córdoba', Country: 'Argentina' },
          { CustomerID: 'TEST2', CompanyName: 'Playwright Mock Corp', ContactName: 'Test User', ContactTitle: 'Developer', City: 'Buenos Aires', Country: 'Argentina' },
        ],
        TotalCount: 2
      })
    });
  });

  await page.goto('/Northwind/Customer');
  await page.locator('.slick-row').first().waitFor();

  // Misma golden file, pero con tolerancia de 15000 píxeles
  await expect(page).toHaveScreenshot('grilla-clientes.png', {
    maxDiffPixels: 15000
  });
});