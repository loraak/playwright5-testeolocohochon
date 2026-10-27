const { test, expect, contador } = require('../helpers/fixtures');

const nuevoId = contador('PAGE');
const caso = (descripcion, esperado, fn) => test(`${nuevoId()} | ${descripcion} | ${esperado}`, fn);
const paginas = [
  '/about', '/tips', '/test-cases', '/contact', '/feedback', '/scrollbars', '/cookie-alert', '/http-headers',
  '/console-logs', '/random-number', '/dynamic-content', '/dynamic-controls', '/dynamic-loading',
  '/shifting-content', '/status-codes', '/dynamic-id', '/abtest', '/context-menu', '/disappearing-elements',
  '/redirector', '/horizontal-slider', '/floating-menu', '/tables', '/tooltips', '/jqueryui', '/large',
  '/my-browser', '/bmi', '/secure-password-checker', '/color-wheel',
];

for (const ruta of paginas) {
  caso(`Validar página ${ruta}`, 'Responde sin error, tiene título y un encabezado visible', async ({ page }) => {
    const resp = await page.goto(ruta);
    expect(resp.status()).toBeLessThan(400);
    expect((await page.title()).trim().length).toBeGreaterThan(0);
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });
}
