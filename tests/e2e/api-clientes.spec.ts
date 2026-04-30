import { test, expect } from '@playwright/test';
import fs from 'fs';

test.describe('API testing nativo de Playwright', () => {

    let apiContext;

    test.beforeAll(async ({ playwright }) => {
        // Extraer CSRF token del storageState
        const storageState = JSON.parse(fs.readFileSync('.auth/user.json', 'utf-8'));
        const csrfToken = storageState.cookies.find(c => c.name === 'CSRF-TOKEN')?.value || '';

        apiContext = await playwright.request.newContext({
            baseURL: 'https://demo.serenity.is',
            storageState: '.auth/user.json',
            extraHTTPHeaders: {
                'x-csrf-token': csrfToken
            }
        });
    });

    test.afterAll(async () => {
        await apiContext.dispose();
    });

    test('listar clientes: status 200 y 91 entidades', async () => {
        const response = await apiContext.post('/Services/Northwind/Customer/List', {
            data: { Take: 100, Sort: ['CustomerID'] }
        });

        expect(response.ok()).toBeTruthy();

        const body = await response.json();
        expect(body.Entities).toBeDefined();
        expect(body.Entities.length).toBe(91);
    });

    test('primer cliente es ALFKI', async () => {
        const response = await apiContext.post('/Services/Northwind/Customer/List', {
            data: { Take: 1, Sort: ['CustomerID'] }
        });

        const body = await response.json();
        const primer = body.Entities[0];

        expect(primer.CustomerID).toBe('ALFKI');
        expect(primer.CompanyName).toBe('Alfreds Futterkiste');
        expect(primer.ContactName).toBe('Maria Anders');
        expect(primer.City).toBe('Berlin');
        expect(primer.Country).toBe('Germany');
    });

    test('filtrar clientes por país: Argentina', async () => {
        const response = await apiContext.post('/Services/Northwind/Customer/List', {
            data: {
                Take: 100,
                EqualityFilter: { Country: 'Argentina' }
            }
        });

        const body = await response.json();+
        expect(body.Entities.length).toBe(3);

        // Verificar que todos son de Argentina
        for (const cliente of body.Entities) {
            expect(cliente.Country).toBe('Argentina');
        }
    });

    test('request sin autenticación devuelve error', async ({ playwright }) => {
        // Contexto limpio, sin cookies ni CSRF
        const sinAuth = await playwright.request.newContext({
            baseURL: 'https://demo.serenity.is'
        });

        const response = await sinAuth.post('/Services/Northwind/Customer/List', {
            data: { Take: 10 }
        });

        expect(response.ok()).toBeFalsy();
        expect(response.status()).toBe(400);

        await sinAuth.dispose();
    });

});