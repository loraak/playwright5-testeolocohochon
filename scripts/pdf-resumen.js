// Genera un PDF con la tabla de casos de prueba a partir de reports/results.json
const { chromium } = require('@playwright/test');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

const JSON_PATH = path.join('reports', 'results.json');
const EVIDENCIA = (process.env.EVIDENCIA || 'fallos').toLowerCase(); // fallos | todas | ninguna

if (!fs.existsSync(JSON_PATH)) {
  console.error('No existe reports/results.json. Ejecuta primero: npm test');
  process.exit(1);
}

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const sinColor = (s) => String(s || '').replace(/\u001b\[[0-9;]*m/g, '');

function recolectar(suite, archivo, salida) {
  const f = suite.file || archivo;
  for (const spec of suite.specs || []) {
    for (const t of spec.tests || []) {
      const ultimo = (t.results || [])[(t.results || []).length - 1] || {};
      const [id, descripcion, esperado] = spec.title.split(' | ');
      const estado = t.status === 'expected' || t.status === 'flaky' ? 'Pasó' : t.status === 'skipped' ? 'Omitida' : 'Falló';
      const err = sinColor(ultimo.error?.message || ultimo.errors?.[0]?.message || '').split('\n').filter(Boolean).slice(0, 3).join(' ');
      salida.push({
        modulo: path.basename(spec.file || f || '').replace('.spec.js', ''),
        id: id || spec.title, descripcion: descripcion || '', esperado: esperado || '',
        estado, flaky: t.status === 'flaky',
        duracion: (t.results || []).reduce((a, r) => a + (r.duration || 0), 0),
        obtenido: estado === 'Pasó' ? 'Cumple lo esperado' : err || 'Sin detalle',
        captura: (ultimo.attachments || []).find((a) => a.contentType === 'image/png' && a.path)?.path,
      });
    }
  }
  for (const s of suite.suites || []) recolectar(s, f, salida);
}

const casos = [];
const datos = JSON.parse(fs.readFileSync(JSON_PATH, 'utf8'));
for (const s of datos.suites || []) recolectar(s, s.file, casos);
casos.sort((a, b) => a.id.localeCompare(b.id, 'en', { numeric: true }));

const total = casos.length;
const pasaron = casos.filter((c) => c.estado === 'Pasó').length;
const fallaron = casos.filter((c) => c.estado === 'Falló').length;
const omitidas = total - pasaron - fallaron;
const pct = total ? ((pasaron / total) * 100).toFixed(1) : '0.0';

const porModulo = {};
for (const c of casos) {
  const m = (porModulo[c.modulo] ||= { total: 0, pasaron: 0, fallaron: 0 });
  m.total++; if (c.estado === 'Pasó') m.pasaron++; if (c.estado === 'Falló') m.fallaron++;
}

const filaModulo = ([n, m]) => `<tr><td>${esc(n)}</td><td>${m.total}</td><td class="ok">${m.pasaron}</td><td class="bad">${m.fallaron}</td></tr>`;
const filaCaso = (c) => {
  const mostrar = EVIDENCIA === 'todas' || (EVIDENCIA === 'fallos' && c.estado === 'Falló');
  const img = mostrar && c.captura && fs.existsSync(c.captura)
    ? `<img src="${pathToFileURL(path.resolve(c.captura)).href}" />` : (c.captura ? 'Ver reporte HTML' : '—');
  return `<tr><td>${esc(c.id)}</td><td>${esc(c.descripcion)}</td><td>${esc(c.esperado)}</td><td>${esc(c.obtenido)}</td>
    <td class="${c.estado === 'Pasó' ? 'ok' : c.estado === 'Falló' ? 'bad' : ''}">${c.estado}${c.flaky ? ' *' : ''}</td>
    <td>${(c.duracion / 1000).toFixed(1)} s</td><td>${img}</td></tr>`;
};

const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><style>
 body{font-family:Arial,sans-serif;font-size:9px;color:#222} h1{font-size:20px;margin:0 0 4px} h2{font-size:13px;margin:16px 0 6px}
 table{border-collapse:collapse;width:100%} th,td{border:1px solid #bbb;padding:3px 4px;vertical-align:top;text-align:left}
 th{background:#2b3a55;color:#fff} tr{page-break-inside:avoid} .ok{color:#0a7d2c;font-weight:bold} .bad{color:#c0261b;font-weight:bold}
 .resumen td{font-size:11px} img{max-width:200px;max-height:110px;display:block}
</style></head><body>
<h1>Reporte de pruebas automatizadas</h1>
<div>Sitio: https://practice.expandtesting.com &nbsp;|&nbsp; Herramienta: Playwright (JavaScript) &nbsp;|&nbsp; Fecha: ${new Date().toLocaleString('es-MX')}</div>
<h2>Resumen general</h2>
<table class="resumen"><tr><th>Total</th><th>Pasaron</th><th>Fallaron</th><th>Omitidas</th><th>% de éxito</th></tr>
<tr><td>${total}</td><td class="ok">${pasaron}</td><td class="bad">${fallaron}</td><td>${omitidas}</td><td>${pct}%</td></tr></table>
<h2>Resumen por módulo</h2>
<table><tr><th>Módulo (archivo)</th><th>Total</th><th>Pasaron</th><th>Fallaron</th></tr>${Object.entries(porModulo).map(filaModulo).join('')}</table>
<h2>Detalle de los casos de prueba</h2>
<table><tr><th>ID</th><th>Descripción</th><th>Resultado esperado</th><th>Resultado obtenido</th><th>Estado</th><th>Duración</th><th>Evidencia</th></tr>
${casos.map(filaCaso).join('')}</table>
<p>* Pasó en un reintento (prueba intermitente). Las capturas de todas las pruebas están en el reporte HTML de Playwright.</p>
</body></html>`;

(async () => {
  const htmlPath = path.resolve('reports', 'reporte-resultados.html');
  fs.writeFileSync(htmlPath, html);
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(pathToFileURL(htmlPath).href);
  const salida = path.join('reports', 'reporte-resultados.pdf');
  await page.pdf({ path: salida, format: 'A4', landscape: true, printBackground: true, margin: { top: '10mm', bottom: '10mm', left: '8mm', right: '8mm' } });
  await browser.close();
  console.log(`PDF de resultados generado en: ${salida} (${pasaron}/${total} pasaron)`);
})();
