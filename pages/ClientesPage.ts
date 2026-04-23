import { type Page, type Locator, expect } from "@playwright/test";
import { Cliente } from '../types/Cliente';

// Page Object para la pagina de Clientes de demo.serenity.is
// En Selenium esta page usaba JavascriptExecutor para scrollear la grilla
// y leer celda. En playwright, getByText() busca en toda la pagina
export class ClientesPage{
    // Page
    private readonly page: Page;

    // Locators de la pagina de Clientes
    private readonly heading: Locator;
    private readonly searchBox: Locator;
    private readonly newClientButton: Locator;

    // ===== LOCATORS DE FILTROS =====
    // Serenity usa Select2 para los dropdowns de filtro.
    // Cada filtro está en un div.quick-filter-item con data-qffield que identifica el campo.
    private readonly filtroPais: Locator;
    private readonly filtroCiudad: Locator;
    private readonly contadorRegistros: Locator;

    // ===== LOCATORS DE HEADERS (para ordenamiento) =====
    private readonly headerID: Locator;
    private readonly headerEmpresa: Locator;

    // ===== LOCATORS DE LA GRILLA =====
    // SlickGrid (el componente que usa Serenity) tiene una estructura particular:
    // - .grid-canvas es el contenedor lógico de TODAS las filas (aunque solo
    //   renderiza las visibles en el viewport en cada momento).
    // - .slick-viewport es el contenedor con scroll. Es el elemento al que
    //   le hacemos scrollTop programático.
    // - .slick-row son las filas individuales actualmente renderizadas.
    private readonly grillaCanvas: Locator;
    private readonly grillaViewport: Locator;
    private readonly grillaFilas: Locator;

    // ===== CONSTANTES DE COLUMNAS =====
    // SlickGrid usa clases l0, l1, l2... para identificar columnas.
    // Las mantenemos como constantes para no hardcodear índices en el código.
    private static readonly COL_ID = 0;
    private static readonly COL_EMPRESA = 1;
    private static readonly COL_CONTACTO = 2;
    private static readonly COL_TITULO = 3;
    private static readonly COL_REGION = 4;
    private static readonly COL_CODIGO_POSTAL = 5;
    private static readonly COL_PAIS = 6;
    private static readonly COL_CIUDAD = 7;
    private static readonly COL_TELEFONO = 8;
    private static readonly COL_FAX = 9;
    private static readonly COL_REPRESENTANTES = 10;

    constructor(page: Page) {
        this.page = page;
        this.heading = page.locator('#GridDiv').getByText('Clientes');
        this.searchBox = page.getByRole('textbox', { name: 'Ingrese el texto para buscar' });
        this.newClientButton = page.getByText('Nuevo Cliente');

        this.grillaCanvas = page.locator('div.sg-body.sg-main.grid-canvas');
        this.grillaViewport = page.locator('div.sg-body.sg-main.slick-viewport');
        this.grillaFilas = page.locator('div.slick-row');

        // Filtros
        this.filtroPais = page.locator('div.quick-filter-item[data-qffield="Country"]');
        this.filtroCiudad = page.locator('div.quick-filter-item[data-qffield="City"]');
        this.contadorRegistros = page.locator('span.slick-pg-stat');

        // Headers
        this.headerID = page.locator('div.slick-header-column[data-id="CustomerID"]');
        this.headerEmpresa = page.locator('div.slick-header-column[data-id="CompanyName"]');

    }

    // Verificar que estamos en la página de Clientes
    async verificarVisible() {
        await expect(this.heading).toBeVisible();
    }

    // Buscar un cliente en la grilla
    async verificarClienteVisible(nombre: string) {
        await expect(this.page.getByText(nombre, { exact: true })).toBeVisible();
    }

    // Verificar que un texto aparece en la grilla
    // Reemplaza todo el sistema de leerGrillaCompleta() + obtenerValorPorId() de Selenium
    async clienteVisible(nombre: string): Promise<boolean> {
        return await this.page.getByText(nombre).isVisible();
    }

    /**
     * Espera a que la grilla esté visible y tenga al menos una fila renderizada.
     * Llamar antes de cualquier interacción con la grilla.
     */
    async esperarGrillaCargada(): Promise<void> {
    await this.grillaCanvas.waitFor({ state: 'visible' });
    await this.grillaFilas.first().waitFor({ state: 'visible' });
    }

    /**
     * Lee toda la grilla scrolleando programáticamente de arriba a abajo.
     *
     * Por qué es necesario: SlickGrid virtualiza el DOM. Solo las filas visibles
     * en el viewport están renderizadas en cada momento. Si scrolleamos, las filas
     * de arriba se sacan del DOM y se agregan las nuevas.
     *
     * Estrategia: scrollear de a pasos, y en cada paso extraer TODOS los datos
     * de las filas visibles en una sola llamada page.evaluate(). Esto es mucho
     * más rápido y robusto que iterar con Locators (que se vuelven inválidos
     * cuando SlickGrid desmonta filas del DOM).
     *
     * @returns Map<string, Cliente> con todos los clientes leídos de la grilla.
     */
    async leerGrillaCompleta(): Promise<Map<string, Cliente>> {
        await this.esperarGrillaCargada();

        const clientes = new Map<string, Cliente>();

        // Obtenemos las dimensiones del viewport: cuánto hay para scrollear
        // y cuánto se ve en cada momento.
        const dimensiones = await this.grillaViewport.evaluate((viewport) => ({
            alturaTotal: viewport.scrollHeight,
            alturaVisible: viewport.clientHeight,
        }));

        // Reseteamos el scroll al tope antes de empezar
        await this.grillaViewport.evaluate((vp) => {
            vp.scrollTop = 0;
        });
        await this.page.waitForTimeout(300);

        // Scrolleamos de a medio viewport por paso, para solapar y no perder filas.
        const paso = Math.floor(dimensiones.alturaVisible / 2);

        for (let pos = 0; pos <= dimensiones.alturaTotal; pos += paso) {
            // Movemos el scroll al paso actual
            await this.grillaViewport.evaluate(
                (vp, scrollPos) => {
                    vp.scrollTop = scrollPos;
                },
                pos
            );

            // Esperamos que SlickGrid renderice las nuevas filas
            await this.page.waitForTimeout(200);

            // Extraemos TODAS las filas visibles en UNA sola llamada al browser.
            // Esto es la clave del performance y la estabilidad: en lugar de hacer
            // cientos de round-trips Node↔browser (uno por celda), hacemos uno solo
            // por scroll y traemos todo de una.
            const filasData = await this.page.evaluate(() => {
                const filas = document.querySelectorAll('div.slick-row');
                const resultado: string[][] = [];

                for (const fila of filas) {
                    const valores: string[] = [];
                    for (let col = 0; col < 11; col++) {
                        const celda = fila.querySelector(`div.slick-cell.l${col}`);
                        valores.push(celda ? (celda.textContent ?? '').trim() : '');
                    }
                    resultado.push(valores);
                }

                return resultado;
            });

            // Procesamos los datos extraídos en Node, sin tocar más el browser
            for (const valores of filasData) {
                const id = valores[0];
                // Si la fila no tiene ID o ya la leímos en un scroll anterior, la salteamos
                if (!id || clientes.has(id)) continue;

                clientes.set(id, {
                    id: valores[0],
                    empresa: valores[1],
                    contacto: valores[2],
                    titulo: valores[3],
                    region: valores[4],
                    codigoPostal: valores[5],
                    pais: valores[6],
                    ciudad: valores[7],
                    telefono: valores[8],
                    fax: valores[9],
                    representantes: valores[10],
                });
            }
        }

        // Volvemos al tope, por cortesía con tests siguientes
        await this.grillaViewport.evaluate((vp) => {
            vp.scrollTop = 0;
        });

        return clientes;
    }

    // ===== MÉTODOS DE ORDENAMIENTO =====

    /**
     * Click en un header de columna para ordenar.
     * SlickGrid alterna: primer click = desc, segundo = asc, tercero = limpiar orden.
     */
    async ordenarPorID(): Promise<void> {
        await this.headerID.click();
        // Esperar a que la grilla se re-renderice
        await this.page.waitForTimeout(500);
    }

    async ordenarPorEmpresa(): Promise<void> {
        await this.headerEmpresa.click();
        await this.page.waitForTimeout(500);
    }

    /**
     * Lee el ID de la primera fila visible en la grilla.
     * No necesita scroll — solo lee lo que está renderizado.
     */
    async obtenerPrimerIDVisible(): Promise<string> {
        const primeraFila = this.grillaFilas.first();
        const celdaID = primeraFila.locator(`div.slick-cell.l${ClientesPage.COL_ID}`);
        return (await celdaID.innerText()).trim();
    }

    /**
     * Lee el valor de la primera fila visible para una columna específica.
     */
    async obtenerPrimerValorVisible(columna: number): Promise<string> {
        const primeraFila = this.grillaFilas.first();
        const celda = primeraFila.locator(`div.slick-cell.l${columna}`);
        return (await celda.innerText()).trim();
    }

    // ===== MÉTODOS DE FILTROS =====

    /**
     * Selecciona un valor en el filtro País usando Select2.
     * 
     * Flujo: click en el dropdown → se abre con buscador →
     * tipear para filtrar → click en la opción.
     */
    async filtrarPorPais(pais: string): Promise<void> {
    // Codegen pattern: click en el dropdown, luego click en la opción por role
    await this.filtroPais.locator('.select2-choice').click();
    await this.page.getByRole('option', { name: pais }).click();
    // Esperar a que la grilla se actualice
    await this.page.waitForTimeout(500);
}

    /**
     * Selecciona un valor en el filtro Ciudad.
     * Mismo patrón que filtrarPorPais.
     */
    async filtrarPorCiudad(ciudad: string): Promise<void> {
    await this.filtroCiudad.locator('.select2-choice').click();
    await this.page.getByRole('option', { name: ciudad }).click();
    await this.page.waitForTimeout(500);
}

    /**
     * Limpia el filtro de País clickeando la × de Select2.
     */
    async limpiarFiltroPais(): Promise<void> {
        await this.filtroPais.locator('abbr.select2-search-choice-close').click();
        await this.page.waitForTimeout(500);
    }

    /**
     * Limpia el filtro de Ciudad.
     */
    async limpiarFiltroCiudad(): Promise<void> {
        await this.filtroCiudad.locator('abbr.select2-search-choice-close').click();
        await this.page.waitForTimeout(500);
    }

    // ===== MÉTODOS DE CONTADOR =====

    /**
     * Obtiene el texto completo del contador.
     * Ej: "Mostrando desde 1 hasta 91 de 91 registros totales"
     */
    async obtenerTextoContador(): Promise<string> {
        return (await this.contadorRegistros.innerText()).trim();
    }

    /**
     * Extrae el número total de registros del contador.
     * De "Mostrando desde 1 hasta 3 de 3 registros totales" → 3
     */
    async obtenerTotalRegistros(): Promise<number> {
        const texto = await this.obtenerTextoContador();
        // Cuando no hay resultados, Serenity muestra "No hay registros"
        if (texto.includes('No hay registros')) return 0;
            const match = texto.match(/de (\d+) registros totales/);
        if (!match) throw new Error(`No se pudo parsear el contador: "${texto}"`);
            return parseInt(match[1], 10);
    }

    // ===== MÉTODOS DE BÚSQUEDA =====

    /**
     * Tipea en el buscador de la grilla y espera a que se actualice.
     */
    async buscar(texto: string): Promise<void> {
        await this.searchBox.click();
        await this.searchBox.clear();
        // pressSequentially simula tecla por tecla, disparando keydown/keyup
        // que el buscador de Serenity necesita para activar el filtrado.
        // fill() setea el valor programáticamente y no dispara esos eventos.
        await this.searchBox.pressSequentially(texto, { delay: 50 });
        await this.page.waitForTimeout(1500);
    }

    /**
     * Limpia el buscador.
     */
    async limpiarBusqueda(): Promise<void> {
        await this.searchBox.click();
        await this.searchBox.clear();
        // Disparar un evento de input para que la grilla se entere del cambio
        await this.searchBox.press('Backspace');
        await this.page.waitForTimeout(1500);
    }

    /**
     * Cuenta la cantidad de filas actualmente visibles en el DOM.
     * Útil para verificar resultados de búsqueda o filtros chicos
     * donde todas las filas caben sin scroll.
     */
    async contarFilasVisibles(): Promise<number> {
        return await this.grillaFilas.count();
    }

    /**
     * Lee los IDs de todas las filas actualmente visibles.
     * Para resultados filtrados chicos (< 20 filas) no necesita scroll.
     */
    async obtenerIDsVisibles(): Promise<string[]> {
        const ids: string[] = [];
        const filas = await this.grillaFilas.all();
        for (const fila of filas) {
            const celda = fila.locator(`div.slick-cell.l${ClientesPage.COL_ID}`);
            const id = (await celda.innerText()).trim();
            if (id) ids.push(id);
        }
        return ids;
    }
}