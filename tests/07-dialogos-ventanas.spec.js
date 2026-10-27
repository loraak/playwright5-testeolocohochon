const { test, expect, contador } = require('../helpers/fixtures');

const nuevoId = contador('DLG');
const caso = (descripcion, esperado, fn) => test(`${nuevoId()} | ${descripcion} | ${esperado}`, fn);
const btn = { alerta: '#js-alert', confirmar: '#js-confirm', prompt: '#js-prompt' };
const resultado = (page) => page.locator('#dialog-response');

// Registra el diálogo, lo acepta/descarta y devuelve sus datos.
function manejar(page, { aceptar = true, texto } = {}) {
  const info = { tipo: '', mensaje: '' };
  page.once('dialog', async (d) => {
    info.tipo = d.type();
    info.mensaje = d.message();
    if (aceptar) await d.accept(texto); else await d.dismiss();
  });
  return info;
}

// ---------- JS Alert (4)
caso('Alert: se muestra un diálogo de tipo alert', 'Aparece un alert con mensaje', async ({ page }) => {
  await page.goto('/js-dialogs');
  const info = manejar(page);
  await page.locator(btn.alerta).click();
  await expect.poll(() => info.tipo).toBe('alert');
  expect(info.mensaje.length).toBeGreaterThan(0);
});
caso('Alert: aceptar actualiza el resultado', 'El área de resultado muestra "OK"', async ({ page }) => {
  await page.goto('/js-dialogs');
  manejar(page);
  await page.locator(btn.alerta).click();
  await expect(resultado(page)).toContainText(/ok/i);
});
caso('Alert: se puede lanzar dos veces', 'Ambos diálogos se aceptan sin errores', async ({ page }) => {
  await page.goto('/js-dialogs');
  for (let i = 0; i < 2; i++) {
    const info = manejar(page);
    await page.locator(btn.alerta).click();
    await expect.poll(() => info.tipo).toBe('alert');
  }
});
caso('Alert: el botón es visible', 'Se muestra el botón de JavaScript Alert', async ({ page }) => {
  await page.goto('/js-dialogs');
  await expect(page.locator(btn.alerta)).toBeVisible();
});

// ---------- JS Confirm (5)
caso('Confirm: se muestra un diálogo de tipo confirm', 'Aparece un confirm con mensaje', async ({ page }) => {
  await page.goto('/js-dialogs');
  const info = manejar(page);
  await page.locator(btn.confirmar).click();
  await expect.poll(() => info.tipo).toBe('confirm');
  expect(info.mensaje.length).toBeGreaterThan(0);
});
caso('Confirm: aceptar', 'El resultado indica "Ok"', async ({ page }) => {
  await page.goto('/js-dialogs');
  manejar(page, { aceptar: true });
  await page.locator(btn.confirmar).click();
  await expect(resultado(page)).toContainText(/ok/i);
});
caso('Confirm: cancelar', 'El resultado indica "Cancel"', async ({ page }) => {
  await page.goto('/js-dialogs');
  manejar(page, { aceptar: false });
  await page.locator(btn.confirmar).click();
  await expect(resultado(page)).toContainText(/cancel/i);
});
caso('Confirm: cancelar y luego aceptar', 'El resultado final indica "Ok"', async ({ page }) => {
  await page.goto('/js-dialogs');
  manejar(page, { aceptar: false });
  await page.locator(btn.confirmar).click();
  manejar(page, { aceptar: true });
  await page.locator(btn.confirmar).click();
  await expect(resultado(page)).toContainText(/ok/i);
});
caso('Confirm: aceptar dos veces', 'El resultado sigue indicando "Ok"', async ({ page }) => {
  await page.goto('/js-dialogs');
  for (let i = 0; i < 2; i++) {
    manejar(page, { aceptar: true });
    await page.locator(btn.confirmar).click();
  }
  await expect(resultado(page)).toContainText(/ok/i);
});

// ---------- JS Prompt (8)
for (const texto of ['Hola', 'Playwright', '12345', 'áéí ñ', '@#$%']) {
  caso(`Prompt: aceptar con texto (${texto})`, 'El resultado muestra el texto ingresado', async ({ page }) => {
    await page.goto('/js-dialogs');
    manejar(page, { aceptar: true, texto });
    await page.locator(btn.prompt).click();
    await expect(resultado(page)).toContainText(texto);
  });
}
caso('Prompt: aceptar sin texto', 'El diálogo se acepta y la página sigue operativa', async ({ page }) => {
  await page.goto('/js-dialogs');
  const info = manejar(page, { aceptar: true, texto: '' });
  await page.locator(btn.prompt).click();
  await expect.poll(() => info.tipo).toBe('prompt');
  await expect(page.locator(btn.prompt)).toBeVisible();
});
caso('Prompt: cancelar', 'El resultado no muestra texto ingresado', async ({ page }) => {
  await page.goto('/js-dialogs');
  manejar(page, { aceptar: false });
  await page.locator(btn.prompt).click();
  await expect(resultado(page)).not.toContainText('Hola');
});
caso('Prompt: el tipo de diálogo es prompt', 'Playwright detecta un diálogo de tipo prompt', async ({ page }) => {
  await page.goto('/js-dialogs');
  const info = manejar(page, { aceptar: true, texto: 'x' });
  await page.locator(btn.prompt).click();
  await expect.poll(() => info.tipo).toBe('prompt');
});

// ---------- Ventanas múltiples (4)
async function abrirVentana(page) {
  await page.goto('/windows');
  const [popup] = await Promise.all([
    page.waitForEvent('popup'),
    page.locator('a[target="_blank"]').first().click(),
  ]);
  await popup.waitForLoadState('domcontentloaded');
  return popup;
}
caso('Ventanas: el enlace abre una nueva pestaña', 'Se dispara el evento popup', async ({ page }) => {
  const popup = await abrirVentana(page);
  expect(popup).toBeTruthy();
});
caso('Ventanas: la nueva pestaña tiene URL propia', 'La URL es distinta de /windows', async ({ page }) => {
  const popup = await abrirVentana(page);
  expect(popup.url()).not.toMatch(/\/windows$/);
});
caso('Ventanas: la nueva pestaña tiene título', 'El título no está vacío', async ({ page }) => {
  const popup = await abrirVentana(page);
  expect((await popup.title()).length).toBeGreaterThan(0);
});
caso('Ventanas: la pestaña original sigue abierta', 'La página original conserva su URL', async ({ page }) => {
  await abrirVentana(page);
  await expect(page).toHaveURL(/\/windows/);
});

// ---------- Iframes (4)
caso('IFrame: la página carga un iframe', 'Hay al menos un iframe en el DOM', async ({ page }) => {
  await page.goto('/iframe');
  expect(await page.locator('iframe').count()).toBeGreaterThan(0);
});
caso('IFrame: el primer iframe es visible', 'Se muestra en pantalla', async ({ page }) => {
  await page.goto('/iframe');
  await expect(page.locator('iframe').first()).toBeVisible();
});
caso('IFrame: se puede acceder a su contenido', 'El body del iframe existe', async ({ page }) => {
  await page.goto('/iframe');
  await expect(page.frameLocator('iframe').first().locator('body')).toBeAttached();
});
caso('IFrame: encabezado de la página', 'Se muestra un h1', async ({ page }) => {
  await page.goto('/iframe');
  await expect(page.locator('h1').first()).toBeVisible();
});
