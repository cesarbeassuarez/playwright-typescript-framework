import { type Page, type Locator } from "@playwright/test";

// Page Object para la pagina de login de demo.serenity.is
// Locators obtenidos con codegen (npx playwright codegen)
export class LoginPage{
    // Page
    private readonly page: Page;

    // Locators de login
    private readonly usernameInput: Locator;
    private readonly passwordInput: Locator;
    private readonly loginButton: Locator;
    private readonly errorBanner: Locator;

    constructor(page: Page) {
        this.page = page;
        // Locators semanticos - no usan IDs internos como en Selenium (By.id("LoginPanel0_Username"))
        this.usernameInput = page.getByRole('textbox', { name: '* Nombre de usuario' });
        this.passwordInput = page.getByRole('textbox', { name: '* Contraseña'});
        this.loginButton = page.getByRole('button', { name: 'Iniciar sesión', exact: true });
        this.errorBanner = page.getByText(/Error de validación|Por favor, valide/);
    }

    // Navegar a la pagina de login
    async goto() {
        await this.page.goto('/Account/Login');
    }

    // Login completo: fill() limpia el campo antes de escribir (no necesita clear() como en Selenium)
    async login(username: string, password: string) {
        await this.usernameInput.fill(username);
        await this.passwordInput.fill(password);
        await this.loginButton.click();
    }

    // Click directo en el botón sin tipear nada (la app viene con credenciales precargadas)
    async clickLogin() {
    await this.loginButton.click();
}

    // Lee el mensaje del banner de error (sirve para credenciales inválidas y campos vacíos)
    async obtenerMensajeError(): Promise<string> {
        return (await this.errorBanner.textContent()) ?? '';
    }

}