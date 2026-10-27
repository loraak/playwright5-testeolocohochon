const { test, expect, contador } = require('../helpers/fixtures');

const nuevoId = contador('INT');
const caso = (descripcion, esperado, fn) => test(`${nuevoId()} | ${descripcion} | ${esperado}`, fn);

// ---------- Key presses (10)
const teclas = [
  ['A', /a/i], ['Z', /z/i], ['5', /5/], ['Enter', /enter/i], ['Escape', /esc/i],
  ['Tab', /tab/i], ['ArrowUp', /up/i], ['ArrowDown', /down/i], ['Space', /space|\s/i], ['Backspace', /back/i],
];
for (const [tecla, patron] of teclas) {
  caso(`Key Presses: tecla ${tecla}`, 'La página registra la tecla presionada', async ({ page }) => {
    await page.goto('/key-presses');
    const campo = page.locator('input:visible').first();
    if (await campo.count()) await campo.focus();
    await page.keyboard.press(tecla);
    await expect(page.locator('body')).toContainText(patron);
  });
}

// ---------- Hovers (4)
const figuras = (page) => page.locator('.figure, figure');
caso('Hovers: la página muestra figuras', 'Hay 3 o más figuras', async ({ page }) => {
  await page.goto('/hovers');
  expect(await figuras(page).count()).toBeGreaterThanOrEqual(3);
});
for (let i = 0; i < 3; i++) {
  caso(`Hovers: pasar el mouse sobre la figura ${i + 1}`, 'Aparece la información del usuario', async ({ page }) => {
    await page.goto('/hovers');
    const f = figuras(page).nth(i);
    await f.hover();
    await expect(f.locator('.figcaption, figcaption')).toBeVisible();
  });
}

// ---------- Drag and drop (4)
const colA = '#column-a';
const colB = '#column-b';
caso('Drag and Drop: estado inicial', 'Columna A muestra "A" y B muestra "B"', async ({ page }) => {
  await page.goto('/drag-and-drop');
  await expect(page.locator(`${colA} header`)).toHaveText('A');
  await expect(page.locator(`${colB} header`)).toHaveText('B');
});
caso('Drag and Drop: arrastrar A sobre B', 'Los encabezados se intercambian', async ({ page }) => {
  await page.goto('/drag-and-drop');
  await page.locator(colA).dragTo(page.locator(colB));
  await expect(page.locator(`${colA} header`)).toHaveText('B');
  await expect(page.locator(`${colB} header`)).toHaveText('A');
});
caso('Drag and Drop: arrastrar B sobre A', 'Los encabezados se intercambian', async ({ page }) => {
  await page.goto('/drag-and-drop');
  await page.locator(colB).dragTo(page.locator(colA));
  await expect(page.locator(`${colA} header`)).toHaveText('B');
});
caso('Drag and Drop: arrastrar dos veces', 'Vuelve al orden original', async ({ page }) => {
  await page.goto('/drag-and-drop');
  await page.locator(colA).dragTo(page.locator(colB));
  await page.locator(colA).dragTo(page.locator(colB));
  await expect(page.locator(`${colA} header`)).toHaveText('A');
});

// ---------- Slider (2)
for (const v of ['0', '5']) {
  caso(`Slider horizontal: valor ${v}`, `El control queda en ${v}`, async ({ page }) => {
    await page.goto('/horizontal-slider');
    const s = page.locator('input[type="range"]');
    await s.fill(v);
    await expect(s).toHaveValue(v);
  });
}
