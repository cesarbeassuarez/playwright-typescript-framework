import { test, expect } from '@playwright/test';

test.use({ storageState: '.auth/user.json' });

test.describe('Network interception básica', () => {

    test('interceptar request de la grilla de clientes', async ({ page }) => {

        // Interceptar el request que la grilla hace al servidor
        page.on('request', request => {
            if (request.url().includes('Customer/List')) {
                console.log('>>> REQUEST interceptado:');
                console.log('    URL:', request.url());
                console.log('    Método:', request.method());
                console.log('    Body:', request.postData());
            }
        });

        page.on('response', async response => {
            if (response.url().includes('Customer/List')) {
                console.log('>>> RESPONSE interceptada:');
                console.log('    Status:', response.status());
                const body = await response.json();
                console.log('    Clientes recibidos:', body.Entities?.length);
                console.log('    Primer cliente:', body.Entities?.[0]?.CompanyName);
            }
        });

        // Navegar a la grilla — esto dispara el request automáticamente
        await page.goto('/Northwind/Customer');
        await page.waitForLoadState('networkidle');
    });

    test('mockear respuesta: grilla con 2 clientes inventados', async ({ page }) => {

        // Interceptar y reemplazar la respuesta del servidor
        await page.route('**/Services/Northwind/Customer/List', async route => {
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({
                    Entities: [
                        {
                            CustomerID: 'TEST1',
                            CompanyName: 'Empresa Inventada SA',
                            ContactName: 'César Beas',
                            City: 'Córdoba',
                            Country: 'Argentina'
                        },
                        {
                            CustomerID: 'TEST2',
                            CompanyName: 'Playwright Mock Corp',
                            ContactName: 'Test User',
                            City: 'Buenos Aires',
                            Country: 'Argentina'
                        }
                    ],
                    TotalCount: 2
                })
            });
        });

        // Navegar — la grilla va a recibir nuestros datos falsos
        await page.goto('/Northwind/Customer');
        await page.waitForLoadState('networkidle');

        // Verificar que la grilla muestra NUESTROS datos, no los del servidor
        const filas = page.locator('.slick-row');
        await expect(filas).toHaveCount(2);

        await expect(page.locator('.slick-row').first()).toContainText('Empresa Inventada SA');
        await expect(page.locator('.slick-row').last()).toContainText('Playwright Mock Corp');
        
    });

    test('simular error 500: la API falla', async ({ page }) => {

        // Interceptar y devolver error 500
        await page.route('**/Services/Northwind/Customer/List', async route => {
            await route.fulfill({
                status: 500,
                contentType: 'application/json',
                body: JSON.stringify({ Error: 'Internal Server Error simulado' })
            });
        });

        await page.goto('/Northwind/Customer');
        await page.waitForLoadState('networkidle');

        // Verificar que la grilla está vacía (no hay datos)
        const filas = page.locator('.slick-row');
        await expect(filas).toHaveCount(0);
    });

    test('bloquear CSS: la página carga sin estilos', async ({ page }) => {

        // Bloquear todos los archivos CSS
        await page.route('**/*.css', route => route.abort());

        await page.goto('/Northwind/Customer');
        await page.waitForLoadState('networkidle');

        // La página cargó (el body tiene contenido)
        const body = page.locator('body');
        await expect(body).not.toBeEmpty();
    });

});