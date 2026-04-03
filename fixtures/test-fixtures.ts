import { test as base, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';
import { ClientesPage } from '../pages/ClientesPage';

// Definir los tipos de los fixtures custom
type MyFixtures = {
    loginPage: LoginPage;
    dashboardPage: DashboardPage;
    clientesPage: ClientesPage;
};

// Extender test con fixtures custom
export const test = base.extend<MyFixtures>({
    loginPage: async ({ page }, use) => {
        const loginPage = new LoginPage(page);
        await use(loginPage);
    },
    dashboardPage: async ({ page }, use) => {
        const dashboardPage = new DashboardPage(page);
        await use(dashboardPage);
    },
    clientesPage: async ({ page }, use) => {
        const clientesPage = new ClientesPage(page);
        await use(clientesPage);
    },
});

export { expect };