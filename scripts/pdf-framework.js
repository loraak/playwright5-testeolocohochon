// Convierte el reporte HTML nativo de Playwright (playwright-report/index.html) en PDF.
const { chromium } = require('@playwright/test');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');

(async () => {
  const archivo = path.resolve('playwright-report', 'index.html');
  if (!fs.existsSync(archivo)) {
    console.error('No existe playwright-report/index.html. Ejecuta primero: npm test');
    process.exit(1);
  }
  fs.mkdirSync('reports', { recursive: true });

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
  await page.goto(pathToFileURL(archivo).href);
  await page.waitForLoadState('load');
  await page.waitForTimeout(2000);

  // Expande las secciones colapsadas para que el PDF incluya el detalle (mejor esfuerzo).
  const cerrados = page.locator('[aria-expanded="false"], .chip-header.expanded-false');
  for (let intentos = 0; intentos < 500; intentos++) {
    if ((await cerrados.count()) === 0) break;
    await cerrados.first().click({ timeout: 2000 }).catch(() => {});
    await page.waitForTimeout(30);
  }

  const salida = path.join('reports', 'reporte-playwright-framework.pdf');
  await page.pdf({ path: salida, format: 'A4', landscape: true, printBackground: true, margin: { top: '10mm', bottom: '10mm', left: '8mm', right: '8mm' } });
  await browser.close();
  console.log('PDF del framework generado en:', salida);
})();
