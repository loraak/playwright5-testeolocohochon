const { test, expect, contador } = require('../helpers/fixtures');
const { LoginPage } = require('../pages/LoginPage');
const { USER, PASS } = require('../helpers/data');

const nuevoId = contador('LOGIN');
const caso = (descripcion, esperado, fn) => test(`${nuevoId()} | ${descripcion} | ${esperado}`, fn);

async function intentar(page, u, p) {
  const l = new LoginPage(page);
  await l.goto();
  await l.login(u, p);
  return l;
}
async function entrar(page) {
  const l = await intentar(page, USER, PASS);
  await expect(page).toHaveURL(/\/secure/);
  return l;
}
const corto = (s) => (s.length > 25 ? `${s.length} caracteres` : s || 'vacío');

caso('Login con credenciales válidas', 'Redirige a /secure y muestra "You logged into a secure area!"', async ({ page }) => {
  const l = await entrar(page);
  await expect(l.flash).toContainText('You logged into a secure area');
});

caso('Logout después de iniciar sesión', 'Vuelve a /login y muestra mensaje de cierre de sesión', async ({ page }) => {
  const l = await entrar(page);
  await l.logout.click();
  await expect(page).toHaveURL(/\/login/);
  await expect(l.flash).toContainText(/logged out/i);
});

const passIncorrectas = ['wrong', 'supersecretpassword!', 'SuperSecretPassword', 'SUPERSECRETPASSWORD!',
  '12345', 'password', 'admin', 'SuperSecretPassword!!', 'a'.repeat(200)];
for (const p of passIncorrectas) {
  caso(`Contraseña incorrecta (${corto(p)})`, 'Muestra "Your password is invalid!" y no inicia sesión', async ({ page }) => {
    const l = await intentar(page, USER, p);
    await expect(l.flash).toContainText('Your password is invalid!');
    await expect(page).not.toHaveURL(/\/secure/);
  });
}

const usuariosIncorrectos = ['noexiste', 'Practice', 'PRACTICE', 'admin', 'root', 'test', '123', 'practic', 'practice1', 'user@mail.com'];
for (const u of usuariosIncorrectos) {
  caso(`Usuario incorrecto (${u})`, 'Muestra "Your username is invalid!" y no inicia sesión', async ({ page }) => {
    const l = await intentar(page, u, PASS);
    await expect(l.flash).toContainText('Your username is invalid!');
    await expect(page).not.toHaveURL(/\/secure/);
  });
}

const ataques = [
  ["' OR '1'='1", 'inyección SQL clásica'],
  ["admin'--", 'inyección SQL con comentario'],
  ['"; DROP TABLE users;--', 'inyección SQL destructiva'],
  ['<script>alert(1)</script>', 'XSS con script'],
  ['<img src=x onerror=alert(1)>', 'XSS con evento'],
  ['../../etc/passwd', 'path traversal'],
];
for (const [payload, nombre] of ataques) {
  caso(`Entrada maliciosa: ${nombre}`, 'Se rechaza el acceso y no se ejecuta ningún script', async ({ page }) => {
    let dialogo = false;
    page.on('dialog', (d) => { dialogo = true; d.dismiss(); });
    const l = await intentar(page, payload, PASS);
    await expect(l.flash).toContainText(/invalid/i);
    await expect(page).not.toHaveURL(/\/secure/);
    expect(dialogo).toBe(false);
  });
}

const vacios = [['', '', 'ambos campos vacíos'], [USER, '', 'solo usuario'], ['', PASS, 'solo contraseña']];
for (const [u, p, nombre] of vacios) {
  caso(`Campos incompletos: ${nombre}`, 'No inicia sesión y permanece en /login', async ({ page }) => {
    await intentar(page, u, p);
    await page.waitForTimeout(700);
    await expect(page).toHaveURL(/\/login/);
  });
}

caso('Formulario de login visible', 'Se muestran usuario, contraseña y botón de envío', async ({ page }) => {
  const l = new LoginPage(page);
  await l.goto();
  await expect(l.user).toBeVisible();
  await expect(l.pass).toBeVisible();
  await expect(l.submit).toBeVisible();
});

caso('Contraseña enmascarada', 'El campo contraseña es de tipo password', async ({ page }) => {
  const l = new LoginPage(page);
  await l.goto();
  await expect(l.pass).toHaveAttribute('type', 'password');
});

caso('Enviar con tecla Enter', 'Enter en el campo contraseña inicia sesión', async ({ page }) => {
  const l = new LoginPage(page);
  await l.goto();
  await l.user.fill(USER);
  await l.pass.fill(PASS);
  await l.pass.press('Enter');
  await expect(page).toHaveURL(/\/secure/);
});

caso('Acceso directo a /secure sin sesión', 'Redirige a /login', async ({ page }) => {
  await page.goto('/secure');
  await expect(page).toHaveURL(/\/login/);
});

caso('Acceso a /secure después de cerrar sesión', 'Redirige a /login', async ({ page }) => {
  const l = await entrar(page);
  await l.logout.click();
  await expect(page).toHaveURL(/\/login/);
  await page.goto('/secure');
  await expect(page).toHaveURL(/\/login/);
});

caso('La sesión persiste al recargar', 'Tras recargar sigue en /secure', async ({ page }) => {
  await entrar(page);
  await page.reload();
  await expect(page).toHaveURL(/\/secure/);
});

caso('Encabezado del área segura', 'El h1 menciona "Secure Area"', async ({ page }) => {
  await entrar(page);
  await expect(page.locator('h1').first()).toContainText(/Secure Area/i);
});

caso('Botón de logout visible', 'Tras iniciar sesión aparece la opción Logout', async ({ page }) => {
  const l = await entrar(page);
  await expect(l.logout).toBeVisible();
});

caso('Cookie de sesión creada', 'Existe al menos una cookie tras iniciar sesión', async ({ page, context }) => {
  await entrar(page);
  const cookies = await context.cookies();
  expect(cookies.length).toBeGreaterThan(0);
});

caso('Volver a /secure en la misma sesión', 'Se puede abrir /secure de nuevo sin pedir login', async ({ page }) => {
  await entrar(page);
  await page.goto('/');
  await page.goto('/secure');
  await expect(page).toHaveURL(/\/secure/);
});
