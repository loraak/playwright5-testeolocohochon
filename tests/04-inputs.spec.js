const { test, expect, contador } = require('../helpers/fixtures');

const nuevoId = contador('INPUT');
const caso = (descripcion, esperado, fn) => test(`${nuevoId()} | ${descripcion} | ${esperado}`, fn);
const sel = {
  num: '#input-number', txt: '#input-text', pwd: '#input-password', fecha: '#input-date',
  mostrar: '#btn-display-inputs', limpiar: '#btn-clear-inputs',
  oNum: '#output-number', oTxt: '#output-text', oPwd: '#output-password', oFecha: '#output-date',
};
const abrir = (page) => page.goto('/inputs');

// Number válidos (7)
for (const v of ['0', '1', '-1', '42', '100000', '2.5', '-0.5']) {
  caso(`Number: valor válido (${v})`, `Display Inputs muestra ${v}`, async ({ page }) => {
    await abrir(page);
    await page.locator(sel.num).fill(v);
    await page.locator(sel.mostrar).click();
    await expect(page.locator(sel.oNum)).toContainText(v);
  });
}

// Number con letras/símbolos (3)
for (const v of ['abc', '!@#', 'xyz']) {
  caso(`Number: rechaza texto (${v})`, 'El campo numérico queda vacío', async ({ page }) => {
    await abrir(page);
    const n = page.locator(sel.num);
    await n.click();
    await page.keyboard.type(v);
    await expect(n).toHaveValue('');
  });
}

// Text (8)
const textos = ['Hola', 'Hello World', '12345', 'áéíóú ñ', '!@#$%^&*()', 'a'.repeat(200), 'Mixed Case 123', 'Línea con acentos: ¿qué tal?'];
for (const v of textos) {
  caso(`Text: valor (${v.length > 25 ? v.length + ' caracteres' : v})`, 'Display Inputs muestra el texto ingresado', async ({ page }) => {
    await abrir(page);
    await page.locator(sel.txt).fill(v);
    await page.locator(sel.mostrar).click();
    await expect(page.locator(sel.oTxt)).toContainText(v);
  });
}

// Password (5)
for (const v of ['secret', 'P@ssw0rd!', '12345678', '密码测试', 'a'.repeat(50)]) {
  caso(`Password: valor (${v.length > 25 ? v.length + ' caracteres' : v})`, 'El campo está enmascarado y Display Inputs muestra el valor', async ({ page }) => {
    await abrir(page);
    await expect(page.locator(sel.pwd)).toHaveAttribute('type', 'password');
    await page.locator(sel.pwd).fill(v);
    await page.locator(sel.mostrar).click();
    await expect(page.locator(sel.oPwd)).toContainText(v);
  });
}

// Date (5)
for (const v of ['2024-01-01', '1999-12-31', '2000-02-29', '2030-06-15', '1970-01-01']) {
  caso(`Date: fecha (${v})`, 'Display Inputs muestra el año ingresado', async ({ page }) => {
    await abrir(page);
    await page.locator(sel.fecha).fill(v);
    await page.locator(sel.mostrar).click();
    await expect(page.locator(sel.oFecha)).toContainText(v.slice(0, 4));
  });
}

// Clear (2)
caso('Clear Inputs vacía todos los campos', 'Los 4 campos quedan vacíos', async ({ page }) => {
  await abrir(page);
  await page.locator(sel.num).fill('7');
  await page.locator(sel.txt).fill('texto');
  await page.locator(sel.pwd).fill('clave');
  await page.locator(sel.fecha).fill('2024-05-05');
  await page.locator(sel.limpiar).click();
  for (const s of [sel.num, sel.txt, sel.pwd, sel.fecha]) await expect(page.locator(s)).toHaveValue('');
});
caso('Se puede volver a escribir tras limpiar', 'El campo acepta un nuevo valor', async ({ page }) => {
  await abrir(page);
  await page.locator(sel.txt).fill('primero');
  await page.locator(sel.limpiar).click();
  await page.locator(sel.txt).fill('segundo');
  await expect(page.locator(sel.txt)).toHaveValue('segundo');
});

// UI (3)
caso('Los 4 campos son visibles', 'Number, Text, Password y Date se muestran', async ({ page }) => {
  await abrir(page);
  for (const s of [sel.num, sel.txt, sel.pwd, sel.fecha]) await expect(page.locator(s)).toBeVisible();
});
caso('Tipo del campo numérico', 'El atributo type es number', async ({ page }) => {
  await abrir(page);
  await expect(page.locator(sel.num)).toHaveAttribute('type', 'number');
});
caso('Tipo del campo fecha', 'El atributo type es date', async ({ page }) => {
  await abrir(page);
  await expect(page.locator(sel.fecha)).toHaveAttribute('type', 'date');
});

// Combinados (2)
caso('Mostrar los 4 valores a la vez', 'Cada salida refleja su entrada', async ({ page }) => {
  await abrir(page);
  await page.locator(sel.num).fill('123');
  await page.locator(sel.txt).fill('combinado');
  await page.locator(sel.pwd).fill('claveXYZ');
  await page.locator(sel.fecha).fill('2025-03-10');
  await page.locator(sel.mostrar).click();
  await expect(page.locator(sel.oNum)).toContainText('123');
  await expect(page.locator(sel.oTxt)).toContainText('combinado');
  await expect(page.locator(sel.oPwd)).toContainText('claveXYZ');
  await expect(page.locator(sel.oFecha)).toContainText('2025');
});
caso('Mostrar dos veces con valores distintos', 'La salida se actualiza con el último valor', async ({ page }) => {
  await abrir(page);
  await page.locator(sel.txt).fill('uno');
  await page.locator(sel.mostrar).click();
  await page.locator(sel.txt).fill('dos');
  await page.locator(sel.mostrar).click();
  await expect(page.locator(sel.oTxt)).toContainText('dos');
});
