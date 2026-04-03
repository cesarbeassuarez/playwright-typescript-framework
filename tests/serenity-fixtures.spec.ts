import { test, expect } from '../fixtures/test-fixtures';

test.describe('Con beforeEach: login automático', () => {

    test.beforeEach(async ({ loginPage }) => {
        await loginPage.goto();
        await loginPage.login('admin', 'serenity');
    });

    test('verificar heading del dashboard', async ({ page }) => {
        await expect(page.getByRole('heading', { name: 'Tablero' })).toBeVisible();
    })

    test('verificar URL y título', async ({ page }) => {
        await expect(page).toHaveURL(/\/$/);
        await expect(page).toHaveTitle(/Dashboard/);
    })

    test('verificar menú Northwind', async ({ page }) => {
        await expect(page.getByText('Northwind')).toBeVisible();
    })
})

test.describe('Sin beforeEach: fixtures directos', () => {

    test('usar fixtures custom directamente', async ({ loginPage, page }) => {
        await loginPage.goto();
        await loginPage.login('admin', 'serenity');

        await expect(page.getByRole('heading', { name: 'Tablero' })).toBeVisible();

        await page.getByRole('link', { name: /Northwind/ }).click();
        await page.getByRole('link', { name: /Clientes/ }).click();

        await expect(page.locator('#GridDiv')).toContainText('ALFKI');
    })
})