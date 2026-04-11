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
}