import { type Page, type Locator, expect } from "@playwright/test";

// Page Object para el dashboard de demo.serenity.is
// Locators obtenidos con codegen (npx playwright codegen)
export class DashboardPage{
    // Page
    private readonly page: Page;

    // Locators de dashboard
    private readonly tableroHeading: Locator;
    private readonly desplegableNorthwind: Locator;
    private readonly linkClientes: Locator;

    constructor(page: Page) {
        this.page = page;
        // Locators semanticos - no usan CSS selectors como en Selenium (By.cssSelector("a[href='#nav_menu_2_1']"))
        this.tableroHeading = page.getByRole('heading', { name: 'Tablero' });
        this.desplegableNorthwind = page.getByRole('link', { name: ' Northwind ' });
        this.linkClientes =page.getByRole('link', { name: ' Clientes' });
    }

    // Verificar que estamos en el dashboard
    async verificarVisible() {
        await expect(this.tableroHeading).toBeVisible();
    }

    // Navegar a Clientes desde el menú lateral
    async irAClientes() {
        await this.desplegableNorthwind.click();
        await this.linkClientes.click();
    }

}