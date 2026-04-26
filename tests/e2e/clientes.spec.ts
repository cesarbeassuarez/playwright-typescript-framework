import { test, expect } from '../../fixtures/test-fixtures';
import { leerClientesDesdeExcel } from '../../utils/excelReader';
import path from 'path';

// Todos los tests arrancan en la grilla de Clientes.
// beforeEach centraliza la navegación usando fixtures.
test.beforeEach(async ({ page, dashboardPage, clientesPage }) => {
  await page.goto('/', { timeout: 15000 });
  await dashboardPage.verificarVisible();
  await dashboardPage.irAClientes();
  await clientesPage.verificarVisible();
});

// ===== VALIDACIÓN CONTRA EXCEL =====
test.describe('Validación contra Excel', () => {

  test('los 91 clientes de la grilla coinciden con el Excel', async ({ clientesPage }) => {
    const rutaExcel = path.join(__dirname, '..', '..', 'test-data', 'clientes-data.xlsx');
    const clientesExcel = await leerClientesDesdeExcel(rutaExcel);
    const clientesGrilla = await clientesPage.leerGrillaCompleta();

    expect.soft(clientesGrilla.size, 'Cantidad total').toBe(clientesExcel.size);

    for (const [id, esperado] of clientesExcel) {
      const real = clientesGrilla.get(id);
      if (!real) {
        expect.soft(real, `${id} debería existir`).toBeDefined();
        continue;
      }
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

// ===== ORDENAMIENTO =====
test.describe('Ordenamiento', () => {

  test('ordenar por ID: asc (ALFKI) → desc (WOLZA)', async ({ clientesPage }) => {
    expect(await clientesPage.obtenerPrimerIDVisible()).toBe('ALFKI');
    await clientesPage.ordenarPorID();
    expect(await clientesPage.obtenerPrimerIDVisible()).toBe('ALFKI');
    await clientesPage.ordenarPorID();
    expect(await clientesPage.obtenerPrimerIDVisible()).toBe('WOLZA');
  });

  test('ordenar por Empresa: asc → desc', async ({ clientesPage }) => {
    await clientesPage.ordenarPorEmpresa();
    expect(await clientesPage.obtenerPrimerValorVisible(1)).toBe('Alfreds Futterkiste');
    await clientesPage.ordenarPorEmpresa();
    expect(await clientesPage.obtenerPrimerValorVisible(1)).toBe('Wolski Zajazd');
  });

});

// ===== FILTROS SELECT2 =====
test.describe('Filtros Select2', () => {

  test('filtrar por Argentina: 3 clientes (CACTU, OCEAN, RANCH)', async ({ clientesPage }) => {
    await clientesPage.filtrarPorPais('Argentina');
    expect(await clientesPage.obtenerTotalRegistros()).toBe(3);
    const ids = await clientesPage.obtenerIDsVisibles();
    expect(ids).toContain('CACTU');
    expect(ids).toContain('OCEAN');
    expect(ids).toContain('RANCH');
    expect(ids).toHaveLength(3);
  });

  test('filtro combinado: Argentina + Buenos Aires = 3', async ({ clientesPage }) => {
    await clientesPage.filtrarPorPais('Argentina');
    await clientesPage.filtrarPorCiudad('Buenos Aires');
    expect(await clientesPage.obtenerTotalRegistros()).toBe(3);
  });

  test('limpiar filtros vuelve a 91', async ({ clientesPage }) => {
    await clientesPage.filtrarPorPais('Argentina');
    expect(await clientesPage.obtenerTotalRegistros()).toBe(3);
    await clientesPage.limpiarFiltroPais();
    expect(await clientesPage.obtenerTotalRegistros()).toBe(91);
  });

});

// ===== BÚSQUEDA =====
test.describe('Búsqueda', () => {

  test('ALFKI devuelve 1 fila, texto inexistente devuelve 0', async ({ clientesPage }) => {
    await clientesPage.buscar('ALFKI');
    expect(await clientesPage.obtenerIDsVisibles()).toEqual(['ALFKI']);

    await clientesPage.limpiarBusqueda();
    await clientesPage.buscar('ZZZZZ_NO_EXISTE');
    expect(await clientesPage.obtenerTotalRegistros()).toBe(0);
  });

});