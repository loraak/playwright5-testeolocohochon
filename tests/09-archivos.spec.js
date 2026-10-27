const { test, expect, contador } = require('../helpers/fixtures');

const nuevoId = contador('FILE');
const caso = (descripcion, esperado, fn) => test(`${nuevoId()} | ${descripcion} | ${esperado}`, fn);
const campoArchivo = (page) => page.locator('input[type="file"]');
const botonSubir = (page) => page.getByRole('button', { name: /upload/i });

// ---------- Upload (9)
const archivos = [
  { name: 'prueba.txt', mimeType: 'text/plain', buffer: Buffer.from('contenido de prueba') },
  { name: 'datos.json', mimeType: 'application/json', buffer: Buffer.from('{"ok":true}') },
  { name: 'tabla.csv', mimeType: 'text/csv', buffer: Buffer.from('a,b\n1,2\n') },
  { name: 'notas.md', mimeType: 'text/markdown', buffer: Buffer.from('# titulo') },
  { name: 'pixel.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64') },
  { name: 'archivo con espacios.txt', mimeType: 'text/plain', buffer: Buffer.from('espacios') },
];
for (const a of archivos) {
  caso(`Upload: archivo ${a.name}`, 'Muestra "File Uploaded!" con el nombre del archivo', async ({ page }) => {
    await page.goto('/upload');
    await campoArchivo(page).setInputFiles(a);
    await botonSubir(page).click();
    await expect(page.locator('body')).toContainText('File Uploaded');
  });
}
caso('Upload: enviar sin seleccionar archivo', 'No se confirma ninguna carga', async ({ page }) => {
  await page.goto('/upload');
  await botonSubir(page).click();
  await page.waitForTimeout(700);
  await expect(page.locator('body')).not.toContainText('File Uploaded!');
});
caso('Upload: el nombre del archivo aparece en la confirmación', 'Se muestra "reporte.txt"', async ({ page }) => {
  await page.goto('/upload');
  await campoArchivo(page).setInputFiles({ name: 'reporte.txt', mimeType: 'text/plain', buffer: Buffer.from('x') });
  await botonSubir(page).click();
  await expect(page.locator('body')).toContainText('reporte.txt');
});
caso('Upload: subir dos archivos seguidos', 'Ambas cargas se confirman', async ({ page }) => {
  for (const nombre of ['uno.txt', 'dos.txt']) {
    await page.goto('/upload');
    await campoArchivo(page).setInputFiles({ name: nombre, mimeType: 'text/plain', buffer: Buffer.from(nombre) });
    await botonSubir(page).click();
    await expect(page.locator('body')).toContainText('File Uploaded');
  }
});

// ---------- Download (6)
const enlaces = (page) => page.locator('a').filter({ hasText: /\.(txt|png|jpe?g|pdf|json|csv|docx?|xlsx?|zip|log|md|gif)$/i });

caso('Download: hay archivos disponibles', 'La lista tiene al menos un enlace de descarga', async ({ page }) => {
  await page.goto('/download');
  expect(await enlaces(page).count()).toBeGreaterThan(0);
});
caso('Download: los enlaces tienen href', 'El primer enlace apunta a una URL', async ({ page }) => {
  await page.goto('/download');
  const href = await enlaces(page).first().getAttribute('href');
  expect(href && href.length).toBeGreaterThan(0);
});
for (let i = 0; i < 3; i++) {
  caso(`Download: descargar el archivo #${i + 1}`, 'Se dispara la descarga con un nombre sugerido', async ({ page }) => {
    await page.goto('/download');
    const [descarga] = await Promise.all([
      page.waitForEvent('download'),
      enlaces(page).nth(i).click(),
    ]);
    expect(descarga.suggestedFilename().length).toBeGreaterThan(0);
  });
}
caso('Download: el archivo descargado no está vacío', 'El tamaño del archivo es mayor a 0 bytes', async ({ page }) => {
  await page.goto('/download');
  const [descarga] = await Promise.all([
    page.waitForEvent('download'),
    enlaces(page).first().click(),
  ]);
  const ruta = await descarga.path();
  const fs = require('fs');
  expect(fs.statSync(ruta).size).toBeGreaterThan(0);
});
