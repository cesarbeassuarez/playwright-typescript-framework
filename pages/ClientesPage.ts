import { type Page, type Locator, expect } from "@playwright/test";

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

    constructor(page: Page) {
        this.page = page;
        this.heading = page.locator('#GridDiv').getByText('Clientes');
        this.searchBox = page.getByRole('textbox', { name: 'Ingrese el texto para buscar' });
        this.newClientButton = page.getByText('Nuevo Cliente');
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
}