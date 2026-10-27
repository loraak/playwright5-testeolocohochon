const { test, expect, contador } = require('../helpers/fixtures');

const nuevoId = contador('CTRL');
const caso = (descripcion, esperado, fn) => test(`${nuevoId()} | ${descripcion} | ${esperado}`, fn);

// ---------- Checkboxes (8)
const checks = (page) => page.locator('input[type="checkbox"]');

caso('Checkboxes: existen al menos 2', 'La página tiene 2 o más checkboxes', async ({ page }) => {
  await page.goto('/checkboxes');
  expect(await checks(page).count()).toBeGreaterThanOrEqual(2);
});
caso('Checkbox 1: marcar', 'Queda seleccionado', async ({ page }) => {
  await page.goto('/checkboxes');
  await checks(page).nth(0).check();
  await expect(checks(page).nth(0)).toBeChecked();
});
caso('Checkbox 1: desmarcar', 'Queda sin seleccionar', async ({ page }) => {
  await page.goto('/checkboxes');
  await checks(page).nth(0).check();
  await checks(page).nth(0).uncheck();
  await expect(checks(page).nth(0)).not.toBeChecked();
});
caso('Checkbox 2: marcar', 'Queda seleccionado', async ({ page }) => {
  await page.goto('/checkboxes');
  await checks(page).nth(1).check();
  await expect(checks(page).nth(1)).toBeChecked();
});
caso('Checkbox 2: desmarcar', 'Queda sin seleccionar', async ({ page }) => {
  await page.goto('/checkboxes');
  await checks(page).nth(1).check();
  await checks(page).nth(1).uncheck();
  await expect(checks(page).nth(1)).not.toBeChecked();
});
caso('Checkboxes: ambos marcados', 'Los dos quedan seleccionados', async ({ page }) => {
  await page.goto('/checkboxes');
  await checks(page).nth(0).check();
  await checks(page).nth(1).check();
  await expect(checks(page).nth(0)).toBeChecked();
  await expect(checks(page).nth(1)).toBeChecked();
});
caso('Checkboxes: ambos desmarcados', 'Los dos quedan sin seleccionar', async ({ page }) => {
  await page.goto('/checkboxes');
  await checks(page).nth(0).uncheck();
  await checks(page).nth(1).uncheck();
  await expect(checks(page).nth(0)).not.toBeChecked();
  await expect(checks(page).nth(1)).not.toBeChecked();
});
caso('Checkbox 1: alternar tres veces', 'Termina seleccionado', async ({ page }) => {
  await page.goto('/checkboxes');
  const c = checks(page).nth(0);
  await c.check();
  await c.uncheck();
  await c.check();
  await expect(c).toBeChecked();
});

// ---------- Radio buttons (10)
const radios = (page) => page.locator('input[type="radio"]');

for (let i = 0; i < 7; i++) {
  caso(`Radio #${i + 1}: seleccionar`, 'Queda seleccionado (o permanece deshabilitado si lo está)', async ({ page }) => {
    await page.goto('/radio-buttons');
    const r = radios(page).nth(i);
    await expect(r).toBeAttached();
    if (await r.isDisabled()) {
      await expect(r).toBeDisabled();
    } else {
      await r.check({ force: true });
      await expect(r).toBeChecked();
    }
  });
}
caso('Radios: hay al menos 2', 'La página tiene 2 o más radio buttons', async ({ page }) => {
  await page.goto('/radio-buttons');
  expect(await radios(page).count()).toBeGreaterThanOrEqual(2);
});
caso('Radios: selección exclusiva dentro de un grupo', 'Al elegir otro, el anterior se desmarca', async ({ page }) => {
  await page.goto('/radio-buttons');
  const nombre = await radios(page).first().getAttribute('name');
  const grupo = page.locator(`input[type="radio"][name="${nombre}"]:enabled`);
  expect(await grupo.count()).toBeGreaterThanOrEqual(2);
  await grupo.nth(0).check({ force: true });
  await grupo.nth(1).check({ force: true });
  await expect(grupo.nth(0)).not.toBeChecked();
  await expect(grupo.nth(1)).toBeChecked();
});
caso('Radios: grupos independientes', 'Elegir en un grupo no cambia el otro', async ({ page }) => {
  await page.goto('/radio-buttons');
  const todos = radios(page);
  const total = await todos.count();
  const n1 = await todos.nth(0).getAttribute('name');
  let otro = -1;
  for (let i = 1; i < total; i++) {
    if ((await todos.nth(i).getAttribute('name')) !== n1 && (await todos.nth(i).isEnabled())) { otro = i; break; }
  }
  expect(otro).toBeGreaterThan(0);
  await todos.nth(0).check({ force: true });
  await todos.nth(otro).check({ force: true });
  await expect(todos.nth(0)).toBeChecked();
  await expect(todos.nth(otro)).toBeChecked();
});

// ---------- Dropdown (12)
const principal = (page) => page.locator('select').nth(0);
const paises = (page) => page.locator('select').nth(1);

caso('Dropdown: opción por defecto', 'Muestra el texto "Please select..."', async ({ page }) => {
  await page.goto('/dropdown');
  await expect(principal(page).locator('option:checked')).toHaveText(/select/i);
});
caso('Dropdown: elegir Option 1', 'Queda seleccionada "Option 1"', async ({ page }) => {
  await page.goto('/dropdown');
  await principal(page).selectOption({ label: 'Option 1' });
  await expect(principal(page).locator('option:checked')).toHaveText('Option 1');
});
caso('Dropdown: elegir Option 2', 'Queda seleccionada "Option 2"', async ({ page }) => {
  await page.goto('/dropdown');
  await principal(page).selectOption({ label: 'Option 2' });
  await expect(principal(page).locator('option:checked')).toHaveText('Option 2');
});
caso('Dropdown: cambiar de opción varias veces', 'Termina en "Option 1"', async ({ page }) => {
  await page.goto('/dropdown');
  await principal(page).selectOption({ label: 'Option 1' });
  await principal(page).selectOption({ label: 'Option 2' });
  await principal(page).selectOption({ label: 'Option 1' });
  await expect(principal(page).locator('option:checked')).toHaveText('Option 1');
});
for (let i = 1; i <= 6; i++) {
  caso(`Dropdown de países: opción en posición ${i}`, 'Se selecciona un país con texto visible', async ({ page }) => {
    await page.goto('/dropdown');
    await paises(page).selectOption({ index: i });
    await expect(paises(page).locator('option:checked')).not.toHaveText('');
  });
}
for (const pais of ['Mexico', 'Canada']) {
  caso(`Dropdown de países: ${pais}`, `Queda seleccionado "${pais}"`, async ({ page }) => {
    await page.goto('/dropdown');
    await paises(page).selectOption({ label: pais });
    await expect(paises(page).locator('option:checked')).toHaveText(pais);
  });
}
