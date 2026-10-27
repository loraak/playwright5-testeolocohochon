const { test, expect, contador } = require('../helpers/fixtures');

const nuevoId = contador('NAV');
const caso = (descripcion, esperado, fn) => test(`${nuevoId()} | ${descripcion} | ${esperado}`, fn);
const rutas = [
  '/inputs', '/login', '/register', '/forgot-password', '/dynamic-table', '/locators', '/radio-buttons',
  '/drag-and-drop', '/form-validation', '/upload', '/download', '/add-remove-elements', '/notification-message',
  '/autocomplete', '/challenging-dom', '/shadowdom', '/typos', '/broken-images', '/infinite-scroll',
  '/js-dialogs', '/checkboxes', '/key-presses', '/dropdown', '/hovers', '/iframe',
];

for (const ruta of rutas) {
  caso(`Desde el inicio, abrir ${ruta}`, `Al hacer clic se navega a ${ruta}`, async ({ page }) => {
    await page.goto('/');
    const enlace = page
      .locator(`a[href="${ruta}"], a[href="https://practice.expandtesting.com${ruta}"]`)
      .first();
    await expect(enlace).toBeAttached();
    await enlace.click();
    await expect(page).toHaveURL(new RegExp(`${ruta.replace(/[-/]/g, '\\$&')}/?$`));
  });
}
