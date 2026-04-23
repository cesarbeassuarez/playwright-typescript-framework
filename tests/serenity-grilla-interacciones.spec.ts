import { test, expect } from '@playwright/test';
import { ClientesPage } from '../pages/ClientesPage';
import { DashboardPage } from '../pages/DashboardPage';

// Todos los tests de este archivo necesitan navegar a la grilla de Clientes.
// En vez de repetir la navegación en cada test, usamos beforeEach.
test.beforeEach(async ({ page }) => {
    const dashboard = new DashboardPage(page);
    const clientesPage = new ClientesPage(page);

    await page.goto('https://demo.serenity.is/', { timeout: 15000 });
    await dashboard.verificarVisible();
    await dashboard.irAClientes();
    await clientesPage.verificarVisible();
});

// ===== ORDENAMIENTO =====

test('ordenar por ID: primer click asc (ALFKI), segundo click desc (WOLZA)', async ({ page }) => {
    const clientesPage = new ClientesPage(page);

    // Estado inicial: la grilla carga con ALFKI primero
    expect(await clientesPage.obtenerPrimerIDVisible()).toBe('ALFKI');

    // Primer click → ascendente (sigue ALFKI, ya estaba asc)
    await clientesPage.ordenarPorID();
    expect(await clientesPage.obtenerPrimerIDVisible()).toBe('ALFKI');

    // Segundo click → descendente (WOLZA primero)
    await clientesPage.ordenarPorID();
    expect(await clientesPage.obtenerPrimerIDVisible()).toBe('WOLZA');
});

test('ordenar por Empresa: primer click asc, segundo click desc', async ({ page }) => {
    const clientesPage = new ClientesPage(page);

    // Primer click → ascendente (Alfreds Futterkiste primero)
    await clientesPage.ordenarPorEmpresa();
    const empresaAsc = await clientesPage.obtenerPrimerValorVisible(1);
    expect(empresaAsc).toBe('Alfreds Futterkiste');

    // Segundo click → descendente (Wolski Zajazd primero)
    await clientesPage.ordenarPorEmpresa();
    const empresaDesc = await clientesPage.obtenerPrimerValorVisible(1);
    expect(empresaDesc).toBe('Wolski Zajazd');
});

// ===== FILTROS =====

test('filtrar por País Argentina: 3 clientes (CACTU, OCEAN, RANCH)', async ({ page }) => {
    const clientesPage = new ClientesPage(page);

    await clientesPage.filtrarPorPais('Argentina');

    // Verificar contador
    const total = await clientesPage.obtenerTotalRegistros();
    expect(total).toBe(3);

    // Verificar que los 3 IDs esperados están visibles
    const ids = await clientesPage.obtenerIDsVisibles();
    expect(ids).toContain('CACTU');
    expect(ids).toContain('OCEAN');
    expect(ids).toContain('RANCH');
    expect(ids).toHaveLength(3);
});

test('filtro combinado: Argentina + Buenos Aires = 3 clientes', async ({ page }) => {
    const clientesPage = new ClientesPage(page);

    await clientesPage.filtrarPorPais('Argentina');
    await clientesPage.filtrarPorCiudad('Buenos Aires');

    const total = await clientesPage.obtenerTotalRegistros();
    expect(total).toBe(3);

    const ids = await clientesPage.obtenerIDsVisibles();
    expect(ids).toContain('CACTU');
    expect(ids).toContain('OCEAN');
    expect(ids).toContain('RANCH');
    expect(ids).toHaveLength(3);
});

test('limpiar filtros: vuelve a 91 registros', async ({ page }) => {
    const clientesPage = new ClientesPage(page);

    // Aplicar filtro
    await clientesPage.filtrarPorPais('Argentina');
    expect(await clientesPage.obtenerTotalRegistros()).toBe(3);

    // Limpiar
    await clientesPage.limpiarFiltroPais();
    const total = await clientesPage.obtenerTotalRegistros();
    expect(total).toBe(91);
});

// ===== BÚSQUEDA =====

test('buscar ALFKI: una sola fila, buscar texto inexistente: 0 filas', async ({ page }) => {
    const clientesPage = new ClientesPage(page);

    // Buscar un ID que existe
    await clientesPage.buscar('ALFKI');
    const idsAlfki = await clientesPage.obtenerIDsVisibles();
    expect(idsAlfki).toEqual(['ALFKI']);

    // Limpiar y buscar algo que no existe
    await clientesPage.limpiarBusqueda();
    await clientesPage.buscar('ZZZZZ_NO_EXISTE');
    const totalInexistente = await clientesPage.obtenerTotalRegistros();
    expect(totalInexistente).toBe(0);
});