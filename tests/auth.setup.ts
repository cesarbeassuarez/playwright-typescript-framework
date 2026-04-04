import { test as setup, expect } from '@playwright/test';

const authFile = '.auth/user.json';

setup('autenticación', async ({ page }) => {
    await page.goto('/Account/Login');
    await page.getByRole('textbox', { name: '* Nombre de usuario' }).fill('admin');
    await page.getByRole('textbox', { name: '* Contraseña' }).fill('serenity');
    await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();

    await expect(page.getByRole('heading', { name: 'Tablero' })).toBeVisible();

    await page.context().storageState({ path: authFile });
})