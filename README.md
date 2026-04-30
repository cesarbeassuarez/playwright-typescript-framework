# 🔬 Playwright + TypeScript

**A Playwright + TypeScript automation framework, built from scratch with every architectural decision and problem documented publicly.**

This is not a tutorial project. It's a working framework where fixtures replace `@BeforeMethod`, `page.evaluate()` extracts data from virtualized grids, and `storageState` handles auth without repeating login. Every decision, every real error, and every iteration is documented publicly. Built by a QA engineer with 4+ years of experience testing enterprise ERP systems.

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Language | TypeScript |
| Automation | Playwright |
| Test Runner | Playwright Test (built-in) |
| Reporting | Playwright HTML Reporter |
| Data Source | Excel (exceljs) |
| Auth | storageState (cookies in JSON) |
| Build | npm |
| CI/CD | GitHub Actions |
| Report Hosting | GitHub Pages |

## ⚙️ CI/CD Pipeline

Every push to `main` triggers an automated pipeline:

```
Push to main
    ↓
GitHub Actions (Ubuntu + Chromium headless)
    ↓
npx playwright test (e2e specs)
    ↓
HTML Report generated
    ↓
Published to GitHub Pages
```

**Live report:** [cesarbeassuarez.github.io/playwright-typescript-framework](https://cesarbeassuarez.github.io/playwright-typescript-framework/)

> [!NOTE]
> The pipeline runs only `tests/e2e/` specs (production tests). `tests/learning/` contains didactic specs from the blog series — they're preserved for reference but excluded from CI. The report includes real failures from the test target (demo.serenity.is), not fabricated examples.

## 📁 Project Structure

**Why this structure:**

- **`tests/e2e/` vs `tests/learning/` separation** — production tests live in `e2e/` with fixtures and POM. Didactic specs from the blog series live in `learning/` and are excluded from CI via `testIgnore`. This avoids breaking published post links while keeping the framework clean.
- **Fixtures instead of BaseTest** — Playwright's fixture system replaces the `@BeforeMethod` / `BaseTest` pattern from TestNG. `test-fixtures.ts` provides `loginPage`, `dashboardPage`, and `clientesPage` already initialized. Tests declare what they need, Playwright handles lifecycle.
- **`storageState` for auth** — login runs once in `auth.setup.ts`, cookies are saved to `.auth/user.json`, and all browser projects load them. Tests never repeat login.
- **One Page Object per screen** — same principle as the Selenium framework. If a selector changes, one class changes.
- **Flat config** — everything lives at root level. No `src/main` vs `src/test` split — Playwright projects don't need it.

```text
playwright-typescript-framework/
├── .auth/
│   └── user.json                  # Saved cookies from auth.setup.ts (gitignored)
├── .github/
│   └── workflows/
│       └── playwright.yml         # CI: runs e2e suite, publishes HTML report to GitHub Pages
├── fixtures/
│   └── test-fixtures.ts           # Custom fixtures: loginPage, dashboardPage, clientesPage
├── pages/
│   ├── LoginPage.ts               # POM: login screen selectors and actions
│   ├── DashboardPage.ts           # POM: post-login dashboard
│   └── ClientesPage.ts            # POM: clientes CRUD, grid interactions, SlickGrid extraction
├── test-data/
│   └── clientes-data.xlsx         # 91 clients for data-driven grid validation
├── tests/
│   ├── e2e/                       # Production tests (run in CI)
│   │   ├── login.spec.ts          # Login flows: positive, negative, parametrized
│   │   ├── clientes.spec.ts       # Clientes module: grid, ordering, filters, search
│   │   ├── api-clientes.spec.ts   # Native API testing: CRUD via request context
│   │   └── visual-regression.spec.ts  # Screenshot comparison with toHaveScreenshot()
│   ├── learning/                  # Didactic specs from the blog series (excluded from CI)
│   │   ├── example.spec.ts        # Post 1: first Playwright test
│   │   ├── saucedemo.spec.ts      # Post 1: test against Saucedemo
│   │   ├── serenity-locators.spec.ts      # Post 2: locator strategies
│   │   ├── serenity-assertions.spec.ts    # Post 4: auto-retry, soft assertions
│   │   ├── serenity-fixtures.spec.ts      # Post 5: beforeEach, custom fixtures
│   │   ├── serenity-storagestate.spec.ts  # Post 7: auth with storageState
│   │   ├── serenity-data-driven.spec.ts   # Post 8: parametrized tests
│   │   ├── serenity-clientes-excel.spec.ts    # Post 9: Excel validation, page.evaluate()
│   │   ├── serenity-grilla-interacciones.spec.ts  # Post 10: grid ordering, Select2, search
│   │   ├── serenity-api.spec.ts           # Post 13: native API testing
│   │   ├── network-interception.spec.ts   # Post 14: route(), mock, block requests
│   │   └── visual-testing.spec.ts         # Post 15: toHaveScreenshot(), golden files
│   └── auth.setup.ts              # Global auth: login once, save cookies for all projects
├── types/
│   └── Cliente.ts                 # TypeScript interface for client data
├── utils/
│   └── excelReader.ts             # Excel reading with exceljs for data-driven tests
├── .gitignore
├── package.json
├── package-lock.json
├── playwright.config.ts           # Projects, storageState, locale, timeouts, testIgnore
└── README.md
```

---

## Folder responsibilities

### `fixtures/`
Custom Playwright fixtures. `test-fixtures.ts` extends the base `test` object with page objects (`loginPage`, `dashboardPage`, `clientesPage`). Any spec that imports `test` from this file gets pre-built page objects — no manual instantiation.

In Selenium, this role was split between `BaseTest` (lifecycle) and manual `new LoginPage(driver)` calls. Here, fixtures handle both.

### `pages/`
Pure Page Object Model. Same principle as the Selenium framework: private locators, public methods representing user actions. Tests never see a `.locator()` or `.getByRole()` directly.

The difference: Playwright pages receive `page` via constructor (from fixtures), not `WebDriver`. Locators use Playwright's auto-waiting — no explicit waits needed.

### `tests/e2e/`
Production tests. These use fixtures, POM, and `storageState`. Organized by feature (`login`, `clientes`, `api-clientes`, `visual-regression`). This is what CI runs.

### `tests/learning/`
Every spec from the blog series, preserved as-is. Each file maps to a post and demonstrates a specific concept. Excluded from CI via `testIgnore` in `playwright.config.ts`, but runnable locally for anyone following the series.

### `types/`
TypeScript interfaces. `Cliente.ts` defines the shape of client data used in Excel validation and API tests. Strong typing catches mismatches at compile time, not at runtime.

### `utils/`
Cross-cutting tools. `excelReader.ts` reads `.xlsx` files with `exceljs` for data-driven testing. In the Selenium framework, this was `ExcelReader.java` with Apache POI — same concept, simpler implementation.

### `auth.setup.ts`
Runs before all browser projects. Logs into demo.serenity.is, saves cookies to `.auth/user.json`. Every test starts already authenticated. In Selenium, this required manual cookie management with `driver.manage().getCookies()` — here it's a config property.

### `playwright.config.ts`
Central config: `baseURL`, `locale: 'es-AR'`, `storageState`, browser projects with `dependencies: ['setup']`, `testIgnore` for `learning/` specs, timeouts, and reporter config. One file controls everything.

## 🧭 Build Log

Each entry represents a real development iteration. Full context on decisions and tradeoffs documented on [my blog](https://cesarbeassuarez.dev/tag/playwright/).

| # | Focus | Date |
|---|---|---|
| 1 | [Playwright + TypeScript desde cero](https://cesarbeassuarez.dev/playwright-typescript-setup-primer-test/) — Why Playwright over Cypress, TypeScript over JavaScript. Setup, 9 tests in 3 browsers against real app. | 26 Mar 2026 |
| 2 | [Locators: codegen, herramientas y comparación con Selenium](https://cesarbeassuarez.dev/playwright-locators-codegen-herramientas-vs-selenium/) — Codegen generates locators. UI Mode shows each step. A locale error that doesn't happen in Selenium. | 29 Mar 2026 |
| 3 | [Page Object Model: 3 pages, 2 errores y la diferencia con Selenium](https://cesarbeassuarez.dev/playwright-pom-vs-selenium/) — 3 page objects, 2 real errors (baseURL, exact match), refactor. What Playwright solves vs what Selenium needed. | 01 Apr 2026 |
| 4 | [Assertions: auto-retry, soft assertions y lo que en Selenium armé a mano](https://cesarbeassuarez.dev/playwright-assertions-auto-retry-soft-vs-selenium/) — 4 tests, 5 real errors. Auto-retry, soft assertions, `.not`. No explicit waits. | 02 Apr 2026 |
| 5 | [Fixtures: { page }, beforeEach, custom fixtures y 2 errores reales](https://cesarbeassuarez.dev/playwright-fixtures-beforeeach-custom-fixtures/) — What `{ page }` is, how it replaces `@BeforeMethod`. Custom fixtures reusable across files. Double login and emoji errors. | 03 Apr 2026 |
| 6 | [playwright.config.ts: cada propiedad explicada, 3 experimentos](https://cesarbeassuarez.dev/playwright-config-propiedades/) — Properties, timeout 5s (0/12), 15s (11/12), retries. What Selenium distributes across 5 files, Playwright centralizes. | 03 Apr 2026 |
| 7 | [Autenticación con storageState: login una vez, tests sin login](https://cesarbeassuarez.dev/playwright-storagestate-login-una-vez/) — auth.setup.ts, cookies in JSON, tests without login. A typo error, ENOENT without setup. What in Selenium is custom code, here is 2 lines. | 03 Apr 2026 |
| 8 | [Data-driven testing: un test, N casos, sin DataProvider](https://cesarbeassuarez.dev/playwright-data-driven-testing/) — Positive login, 3 negative parametrized with array and `for...of`. Intentional fail testing isolation. | 08 Apr 2026 |
| 9 | [Validar 91 clientes contra Excel: el bug que Selenium no había encontrado](https://cesarbeassuarez.dev/playwright-excel-bug-selenium/) — exceljs, `page.evaluate()` for virtualized SlickGrid grids, soft assertions for 910 comparisons. A double-space bug Selenium missed. | 10 Apr 2026 |
| 10 | [Testing de grilla: ordenamiento, filtros Select2 y búsqueda en SlickGrid](https://cesarbeassuarez.dev/playwright-grilla-ordenamiento-filtros-busqueda/) — 6 tests for ordering, Select2 filtering, SlickGrid search. `pressSequentially` vs `fill`, codegen for debugging Select2. | 23 Apr 2026 |
| 11 | [Reorganización del framework: de archivos didácticos a estructura de producción](https://cesarbeassuarez.dev/playwright-reorganizacion-framework-learning-e2e/) — 9 didactic specs separated into `learning/`, 2 production tests in `e2e/` with fixtures and POM. Real refactor. | 25 Apr 2026 |
| 12 | [Ejecución paralela: workers, tiempos y bottleneck](https://cesarbeassuarez.dev/playwright-ejecucion-paralela-workers-tiempos/) — 6 runs with different workers and parallel mode. 2 workers was optimal. More isn't always faster. Real data. | 26 Apr 2026 |
| 13 | [API testing nativo: request sin browser, mismo framework](https://cesarbeassuarez.dev/playwright-api-testing-nativo-request-sin-browser/) — No Postman, no RestAssured. Playwright's built-in `request` for APIs. storageState + CSRF token + 4 tests. | 27 Apr 2026 |
| 14 | [Network interception: interceptar, mockear y bloquear requests HTTP](https://cesarbeassuarez.dev/playwright-network-interception-mockear-requests-route/) — `page.route()` and `page.on()` — four interception scenarios without mock servers or proxies, in one spec. | 28 Apr 2026 |
| 15 | [Visual testing: toHaveScreenshot(), golden files y el diff que lo muestra todo](https://cesarbeassuarez.dev/playwright-visual-testing-tohavescreenshot-golden-files-diff/) — Golden files, 11,964 pixel diff, tolerance with `maxDiffPixels` and strict mode. What Selenium needs Ashot for, here is native. | 29 Apr 2026 |
| 16 | [CI/CD con GitHub Actions: pipeline, errores reales y reporte público](https://cesarbeassuarez.dev/playwright-cicd-github-actions-pipeline-reporte-github-pages/) — GitHub Actions + GitHub Pages. storageState errors, visual tests on Linux, public HTML report. Contrast with Selenium CI/CD. | 30 Apr 2026 |

## 🔄 Selenium vs Playwright — Key differences in this framework

| Concept | Selenium (Java) | Playwright (TypeScript) |
|---|---|---|
| Test lifecycle | `@BeforeMethod` / `@AfterMethod` in `BaseTest` | Fixtures (`{ page }`, custom fixtures) |
| Driver management | `DriverManager` + `ThreadLocal` | Built-in, handled by Playwright Test |
| Auth reuse | Manual cookie serialization | `storageState` + `auth.setup.ts` |
| Waits | `WebDriverWait`, `FluentWait` | Auto-waiting (built-in) |
| Assertions | `Assert.assertEquals()` + custom helpers | `expect()` with auto-retry |
| Data-driven | TestNG `@DataProvider` + `Object[][]` | Arrays + `for...of` or `test.describe` |
| Parallel execution | TestNG XML config + `ThreadLocal` | `workers` in config, isolation by default |
| API testing | Needs separate tool (RestAssured, Postman) | Built-in `request` context |
| Visual testing | Ashot library | Native `toHaveScreenshot()` |
| Network mocking | Not native (proxy tools) | `page.route()` built-in |
| Reporting | Allure (external) | HTML Reporter (built-in) |
| Excel reading | Apache POI | exceljs |
| Config | `config.properties` + `ConfigReader.java` | `playwright.config.ts` (single file) |
| CI/CD | Maven + GitHub Actions | npm + GitHub Actions |

## 🎯 What makes this different

- **Not a tutorial project.** Every decision reflects real testing experience on enterprise systems.
- **Documented tradeoffs.** I explain *why*, not just *how*.
- **Built in public.** Progress, mistakes, and iterations — all visible.
- **CI/CD integrated.** Tests run automatically, reports are public.
- **Parallel series.** Each Playwright concept is explained by contrasting it with the Selenium equivalent — see the [Selenium framework](https://github.com/cesarbeassuarez/selenium-java-framework) for the other side.

## 📝 Related content

- Blog (Playwright series): [cesarbeassuarez.dev/tag/playwright](https://cesarbeassuarez.dev/tag/playwright/)
- Blog (Selenium series): [cesarbeassuarez.dev/tag/selenium](https://cesarbeassuarez.dev/tag/selenium/)
- Live report: [cesarbeassuarez.github.io/playwright-typescript-framework](https://cesarbeassuarez.github.io/playwright-typescript-framework/)
- Selenium framework: [github.com/cesarbeassuarez/selenium-java-framework](https://github.com/cesarbeassuarez/selenium-java-framework)
- LinkedIn: [linkedin.com/in/cesarbeassuarez](https://www.linkedin.com/in/cesarbeassuarez/)
