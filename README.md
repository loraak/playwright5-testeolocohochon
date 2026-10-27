# 300 pruebas con Playwright (JavaScript) — practice.expandtesting.com

## Requisitos
- Node.js 18 o superior

## Instalación
```bash
npm install
npx playwright install chromium
```

## Ejecutar las 300 pruebas
```bash
npm test                 # ejecuta todo (genera reporte HTML, JSON y capturas)
npm run test:list        # lista las pruebas sin ejecutarlas (debe decir 300)
npx playwright test tests/01-login.spec.js   # solo un módulo
npm run report           # abre el reporte HTML en el navegador
```

## Generar los PDF
```bash
npm run pdf:framework    # PDF del reporte nativo de Playwright -> reports/reporte-playwright-framework.pdf
npm run pdf:resumen      # PDF con tabla de casos           -> reports/reporte-resultados.pdf
npm run pdf              # ambos
```
Evidencia en el PDF de resultados: por defecto solo capturas de los fallos.
Para incluir todas: `EVIDENCIA=todas npm run pdf:resumen` (Windows PowerShell: `$env:EVIDENCIA="todas"; npm run pdf:resumen`).

Si el PDF del framework sale con secciones colapsadas, abre `npm run report`, expande las secciones y usa Ctrl+P → Guardar como PDF.

## Distribución (300)
| Archivo | Módulo | Pruebas |
|---|---|---|
| 01-login | Login / Logout / sesión | 40 |
| 02-registro | Registro | 40 |
| 03-recuperar-password | Forgot password | 15 |
| 04-inputs | Web inputs | 35 |
| 05-controles | Checkboxes, radios, dropdown | 30 |
| 06-dinamicos | Add/Remove, Dynamic table | 25 |
| 07-dialogos-ventanas | JS dialogs, ventanas, iframes | 25 |
| 08-interacciones | Teclas, hovers, drag & drop, slider | 20 |
| 09-archivos | Upload / Download | 15 |
| 10-navegacion | Navegación desde el inicio | 25 |
| 11-validacion-paginas | Validación de páginas | 30 |

## Cómo se nombran los casos
Cada prueba se llama `ID | descripción | resultado esperado` (por ejemplo `LOGIN-001 | ... | ...`).
El script `pdf-resumen.js` usa ese formato para armar la tabla de casos.

## Si alguna prueba falla en la primera ejecución
Los selectores y mensajes se escribieron según lo conocido del sitio, pero no se pudieron
ejecutar contra él al crear el proyecto. Abre el reporte (`npm run report`), mira la captura y el error,
y ajusta el selector o el texto esperado en el archivo correspondiente. Los más probables:
ids de `/inputs` (`#output-*`), `#js-alert|confirm|prompt` y `#dialog-response`, teclas en `/key-presses`,
y las reglas de validación de `/register`.
