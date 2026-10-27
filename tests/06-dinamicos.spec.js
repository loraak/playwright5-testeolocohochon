const { test, expect, contador } = require('../helpers/fixtures');

const nuevoId = contador('DYN');
const caso = (descripcion, esperado, fn) => test(`${nuevoId()} | ${descripcion} | ${esperado}`, fn);
const agregar = (page) => page.getByRole('button', { name: /Add Element/i });
const borrar = (page) => page.getByRole('button', { name: /^Delete$/i });

async function agregarN(page, n) {
  for (let i = 0; i < n; i++) await agregar(page).click();
}

// ---------- Add/Remove Elements (15)
caso('Add/Remove: estado inicial', 'No hay botones Delete', async ({ page }) => {
  await page.goto('/add-remove-elements');
  await expect(borrar(page)).toHaveCount(0);
});
for (const n of [1, 2, 3, 5, 8, 10, 15]) {
  caso(`Add/Remove: agregar ${n} elemento(s)`, `Aparecen ${n} botones Delete`, async ({ page }) => {
    await page.goto('/add-remove-elements');
    await agregarN(page, n);
    await expect(borrar(page)).toHaveCount(n);
  });
}
for (const k of [1, 2, 4]) {
  caso(`Add/Remove: agregar 4 y eliminar ${k}`, `Quedan ${4 - k} elementos`, async ({ page }) => {
    await page.goto('/add-remove-elements');
    await agregarN(page, 4);
    for (let i = 0; i < k; i++) await borrar(page).first().click();
    await expect(borrar(page)).toHaveCount(4 - k);
  });
}
caso('Add/Remove: agregar, eliminar y volver a agregar', 'Queda 1 elemento', async ({ page }) => {
  await page.goto('/add-remove-elements');
  await agregarN(page, 1);
  await borrar(page).first().click();
  await agregarN(page, 1);
  await expect(borrar(page)).toHaveCount(1);
});
caso('Add/Remove: eliminar todos de uno en uno', 'No queda ningún elemento', async ({ page }) => {
  await page.goto('/add-remove-elements');
  await agregarN(page, 3);
  for (let i = 0; i < 3; i++) await borrar(page).first().click();
  await expect(borrar(page)).toHaveCount(0);
});
caso('Add/Remove: eliminar el último agregado', 'Quedan 2 de 3 elementos', async ({ page }) => {
  await page.goto('/add-remove-elements');
  await agregarN(page, 3);
  await borrar(page).last().click();
  await expect(borrar(page)).toHaveCount(2);
});
caso('Add/Remove: agregar 25 elementos', 'Aparecen 25 botones Delete', async ({ page }) => {
  await page.goto('/add-remove-elements');
  await agregarN(page, 25);
  await expect(borrar(page)).toHaveCount(25);
});

// ---------- Dynamic Table (10)
const encabezados = ['Name', 'CPU', 'Network', 'Memory', 'Disk'];
for (const h of encabezados) {
  caso(`Dynamic Table: encabezado ${h}`, `La tabla tiene una columna "${h}"`, async ({ page }) => {
    await page.goto('/dynamic-table');
    await expect(page.locator('table th', { hasText: h }).first()).toBeVisible();
  });
}
caso('Dynamic Table: la tabla es visible', 'Se muestra al menos una tabla', async ({ page }) => {
  await page.goto('/dynamic-table');
  await expect(page.locator('table').first()).toBeVisible();
});
caso('Dynamic Table: tiene filas de datos', 'Hay una o más filas en el cuerpo', async ({ page }) => {
  await page.goto('/dynamic-table');
  expect(await page.locator('table tbody tr').count()).toBeGreaterThan(0);
});
caso('Dynamic Table: filas con varias celdas', 'Cada fila tiene 5 o más celdas', async ({ page }) => {
  await page.goto('/dynamic-table');
  const celdas = await page.locator('table tbody tr').first().locator('td, th').count();
  expect(celdas).toBeGreaterThanOrEqual(5);
});
caso('Dynamic Table: existe la fila de Chrome', 'Hay una fila con el texto "Chrome"', async ({ page }) => {
  await page.goto('/dynamic-table');
  await expect(page.locator('table tbody tr', { hasText: 'Chrome' }).first()).toBeVisible();
});
caso('Dynamic Table: sigue mostrando datos al recargar', 'Tras recargar hay filas', async ({ page }) => {
  await page.goto('/dynamic-table');
  await page.reload();
  expect(await page.locator('table tbody tr').count()).toBeGreaterThan(0);
});
