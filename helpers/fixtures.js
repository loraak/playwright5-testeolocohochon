const base = require('@playwright/test');

// Bloquea anuncios y trackers que a veces tapan botones y causan fallos falsos.
const BLOQUEADOS =
  /(googlesyndication|doubleclick|googleadservices|adservice\.google|google-analytics|googletagmanager|buymeacoffee|adsbygoogle)/i;

const test = base.test.extend({
  context: async ({ context }, use) => {
    await context.route(BLOQUEADOS, (route) => route.abort());
    await use(context);
  },
});

/**
 * Devuelve un generador de IDs por módulo (LOGIN-001, LOGIN-002, ...).
 * Cada spec define su propio "caso" para que Playwright asocie la prueba al archivo correcto.
 * Título resultante:  ID | descripción | resultado esperado
 */
function contador(prefijo) {
  let n = 0;
  return () => `${prefijo}-${String(++n).padStart(3, '0')}`;
}

module.exports = { test, expect: base.expect, contador };
