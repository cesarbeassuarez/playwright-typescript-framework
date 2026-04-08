import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';

// ===== DATA-DRIVEN: credenciales inválidas =====
// Equivalente a @DataProvider de TestNG, pero acá es solo un array de objetos.
// El for...of de abajo genera un test() por cada caso.
const credencialesInvalidas = [
  {
    caso: 'Password incorrecta',
    usuario: 'admin',
    password: 'mal',
    mensajeEsperado: 'Error de validación: ¡Nombre de usuario o contraseña inválidos!',
    // mensajeEsperado: 'Mensaje que no existe',  // ← roto a propósito
  },
  {
    caso: 'Usuario incorrecto',
    usuario: 'mal',
    password: 'serenity',
    mensajeEsperado: 'Error de validación: ¡Nombre de usuario o contraseña inválidos!',
  },
  {
    caso: 'Campos vacíos',
    usuario: '',
    password: '',
    mensajeEsperado: 'Por favor, valide los campos vacíos o inválidos (marcados en rojo) antes de enviar el formulario',
  },
];

// ===== LOGIN POSITIVO =====
test.describe('Login positivo', () => {

  // Sin storageState: queremos hacer el login real, no arrancar logueado
  test.use({ storageState: { cookies: [], origins: [] } });

  test('login válido lleva al dashboard', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);

    await loginPage.goto();
    await loginPage.login('admin', 'serenity');

    await dashboardPage.verificarVisible();
  });

  // demo.serenity.is viene con admin/serenity ya cargados en los inputs.
  // Click directo, sin tipear nada, también debería loguear.
  test('click directo en login (credenciales precargadas) lleva al dashboard', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);

    await loginPage.goto();
    await loginPage.clickLogin();

    await dashboardPage.verificarVisible();
});

});

// ===== LOGIN NEGATIVO =====
test.describe('Login negativo - data-driven', () => {

  // Importante: estos tests NO usan storageState (no necesitamos estar logueados)
  test.use({ storageState: { cookies: [], origins: [] } });

  for (const datos of credencialesInvalidas) {
    test(`login inválido: ${datos.caso}`, async ({ page }) => {
      const loginPage = new LoginPage(page);

      await loginPage.goto();
      await loginPage.login(datos.usuario, datos.password);

      const mensajeReal = await loginPage.obtenerMensajeError();
      expect(mensajeReal).toContain(datos.mensajeEsperado);
    });
  }

});