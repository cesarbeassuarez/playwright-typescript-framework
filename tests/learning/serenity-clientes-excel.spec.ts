import { test, expect } from '@playwright/test';
import { ClientesPage } from '../../pages/ClientesPage';
import { DashboardPage } from '../../pages/DashboardPage';
import { leerClientesDesdeExcel } from '../../utils/excelReader';
import path from 'path';

test.describe('Validación de grilla de Clientes contra Excel', () => {

  test('los 91 clientes de la grilla coinciden con el Excel', async ({ page }) => {
    // ===== 1. LEER EXCEL =====
    // Cargamos los datos esperados desde el archivo .xlsx
    const rutaExcel = path.join(__dirname, '..', 'test-data', 'clientes-data.xlsx');
    const clientesExcel = await leerClientesDesdeExcel(rutaExcel);

    console.log(`Excel: ${clientesExcel.size} clientes leídos`);

    // ===== 2. NAVEGAR A LA GRILLA =====
    const dashboard = new DashboardPage(page);
    const clientesPage = new ClientesPage(page);

    await page.goto('https://demo.serenity.is/');
    await dashboard.verificarVisible();
    await dashboard.irAClientes();
    await clientesPage.verificarVisible();

    // ===== 3. LEER GRILLA =====
    // Scroll programático + extracción en bloque (ver ClientesPage.leerGrillaCompleta)
    const clientesGrilla = await clientesPage.leerGrillaCompleta();

    console.log(`Grilla: ${clientesGrilla.size} clientes leídos`);

    // ===== 4. VALIDACIÓN DE CONTEO =====
    // Primera verificación: ¿la grilla tiene la misma cantidad que el Excel?
    // Si esto falla, ya sabemos que falta o sobra alguien antes de comparar campos.
    expect.soft(
      clientesGrilla.size,
      'Cantidad total de clientes (grilla vs Excel)'
    ).toBe(clientesExcel.size);

    // ===== 5. VALIDACIÓN CAMPO A CAMPO =====
    // Iteramos los clientes del Excel (la "fuente de verdad") y verificamos
    // que cada uno exista en la grilla con los mismos valores.
    //
    // Usamos expect.soft() en vez de expect() porque queremos ver TODAS las
    // diferencias en una sola corrida, no parar en la primera. Con 91 clientes
    // y 10 campos cada uno, son hasta 910 verificaciones — necesitamos el
    // panorama completo, no ir descubriendo errores de a uno.
    for (const [id, esperado] of clientesExcel) {
      const real = clientesGrilla.get(id);

      // Si el cliente del Excel no existe en la grilla, fail y seguimos
      if (!real) {
        expect.soft(
          real,
          `Cliente ${id} debería existir en la grilla pero no se encontró`
        ).toBeDefined();
        continue;
      }

      // Comparamos cada campo. El segundo argumento de expect.soft es el
      // mensaje custom que aparece en el reporte cuando falla — fundamental
      // para que después podamos identificar QUÉ falló sin tener que adivinar.
      expect.soft(real.empresa, `${id} - Empresa`).toBe(esperado.empresa);
      expect.soft(real.contacto, `${id} - Contacto`).toBe(esperado.contacto);
      expect.soft(real.titulo, `${id} - Título`).toBe(esperado.titulo);
      expect.soft(real.region, `${id} - Región`).toBe(esperado.region);
      expect.soft(real.codigoPostal, `${id} - Código Postal`).toBe(esperado.codigoPostal);
      expect.soft(real.pais, `${id} - País`).toBe(esperado.pais);
      expect.soft(real.ciudad, `${id} - Ciudad`).toBe(esperado.ciudad);
      expect.soft(real.telefono, `${id} - Teléfono`).toBe(esperado.telefono);
      expect.soft(real.fax, `${id} - Fax`).toBe(esperado.fax);
      expect.soft(real.representantes, `${id} - Representantes`).toBe(esperado.representantes);
    }
  });

});