import { test, expect } from '@playwright/test';
import { LoginPage } from '../../pages/LoginPage';
import { DashboardPage } from '../../pages/DashboardPage';
import { ClientesPage } from '../../pages/ClientesPage';

test.describe('Locators en demo.serenity.is - con POM', () => {
  test('login, dashboard y navegar a Clientes', async ({ page }) => {
    // Login
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('admin', 'serenity');

    // Verificar dashboard
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.verificarVisible();
    
    // Navegar a Clientes
    await dashboardPage.irAClientes();

    // Verificar que estamos en Clientes
    const clientesPage = new ClientesPage(page);
    await clientesPage.verificarVisible();

    // Verificar dato en grilla
    await clientesPage.verificarClienteVisible('ANTON');

  })

})