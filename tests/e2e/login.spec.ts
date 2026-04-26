import { test, expect } from '../../fixtures/test-fixtures';

// test.describe.configure({ mode: 'parallel' });

// ===== DATA-DRIVEN: credenciales inválidas =====
const credencialesInvalidas = [
  {
    caso: 'Password incorrecta',
    usuario: 'admin',
    password: 'mal',
    mensajeEsperado: 'Error de validación: ¡Nombre de usuario o contraseña inválidos!',
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
  // Sin storageState: login real, no arrancar logueado
  test.use({ storageState: { cookies: [], origins: [] } });

  test('login válido lleva al dashboard', async ({ loginPage, dashboardPage }) => {
    await loginPage.goto();
    await loginPage.login('admin', 'serenity');
    await dashboardPage.verificarVisible();
  });

  test('click directo con credenciales precargadas lleva al dashboard', async ({ loginPage, dashboardPage }) => {
    await loginPage.goto();
    await loginPage.clickLogin();
    await dashboardPage.verificarVisible();
  });
});

// ===== LOGIN NEGATIVO =====
test.describe('Login negativo - data-driven', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  for (const datos of credencialesInvalidas) {
    test(`login inválido: ${datos.caso}`, async ({ loginPage }) => {
      await loginPage.goto();
      await loginPage.login(datos.usuario, datos.password);
      const mensajeReal = await loginPage.obtenerMensajeError();
      expect(mensajeReal).toContain(datos.mensajeEsperado);
    });
  }
});