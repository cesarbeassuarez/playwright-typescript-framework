import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { ClientesPage } from '../pages/ClientesPage';

test.describe('Assertions en demo.serenity.is', () => {
    test('assertions de navegación: URL y título', async ({ page }) => {
        const loginPage = new LoginPage(page);
        await loginPage.goto();

        // Verificar URL del login
        await expect(page).toHaveURL(/Account\/Login/);

        // Verificar título de la página
        await expect(page).toHaveTitle(/Iniciar sesión/);

        await loginPage.login('admin', 'serenity');

        //Después del login, verificar que la URL cambió
        await expect(page).toHaveURL(/\/$/);
    })

    test('assertions de elementos: texto, visibilidad, atributos', async ({ page }) => {
        const loginPage = new LoginPage(page);
        await loginPage.goto();

        // Verificar que el botón de login tiene el texto correcto
        await expect(page.getByRole('button', { name: 'Iniciar sesión', exact: true })).toHaveText('Iniciar sesión');

        // Verificar que el campo usuario tiene el atributo placeholder
        await expect(page.getByRole('button', { name: 'Iniciar sesión con Google' })).toBeVisible();

        // Verificar cantidad de botones de login externo (Google, Github, Microsoft)
        await expect(page.getByRole('button', { name: /Iniciar sesión con/ })).toHaveCount(3);

        // Login y verificar título del dashboard
        await loginPage.login('admin', 'serenity');
        await expect(page).toHaveTitle(/Dashboard/);
    })

    test('soft assertions: múltiples verificaciones sin frenar', async ({ page }) => {
        const loginPage = new LoginPage(page);
        await loginPage.goto();
        await loginPage.login('admin', 'serenity');

        const dashboardPage = new DashboardPage(page);

        // Soft assertions - si una falla, el test sigue corriendo
        await expect.soft(page).toHaveTitle(/Dashboard/);
        await expect.soft(page).toHaveURL(/\/$/);
        await expect.soft(page.getByRole('heading', { name: 'Tablero' })).toBeVisible();

        // Esta va a fallar a propósito - para mostrar el comportamiento
        // await expect.soft(page.getByText('Texto que no existe')).toBeVisible();

        // Esta se ejecuta AUNQUE la anterior falló
        await expect.soft(page.getByText('Northwind')).toBeVisible();
    })

    test('assertions negativas: verificar que algo NO existe', async ({ page }) => {
        const loginPage = new LoginPage(page);
        await loginPage.goto();

        // Verificar que NO estamos logueados (no hay heading de dashboard)
        await expect(page.getByRole('heading', { name: 'Tablero' })).not.toBeVisible();

        // Verificar que la URL NO es la del dashboard
        await expect(page).not.toHaveURL(/\/$/);

        // Login
        await loginPage.login('admin', 'serenity');

        // Después del login, verificar que el form de login NO está visible
        await expect(page.getByRole('button', { name: 'Iniciar sesión', exact: true })).not.toBeVisible();
    })


})