const { test, expect, contador } = require('../helpers/fixtures');
const { RegisterPage } = require('../pages/RegisterPage');
const { LoginPage } = require('../pages/LoginPage');
const { unico, soloDigitos } = require('../helpers/data');

const nuevoId = contador('REG');
const caso = (descripcion, esperado, fn) => test(`${nuevoId()} | ${descripcion} | ${esperado}`, fn);
const OK = 'Pass1234!';

async function registroExitoso(page, u, p, c) {
  const r = new RegisterPage(page);
  await r.goto();
  await r.registrar(u, p, c);
  await expect(page).toHaveURL(/\/login/);
  await expect(page.locator('#flash')).toContainText(/Successfully registered/i);
}

// --- Registros válidos (5)
caso('Registro válido con usuario alfanumérico', 'Redirige a /login con mensaje de registro exitoso', async ({ page }) => {
  await registroExitoso(page, unico('qa'), OK);
});
caso('Registro válido con guion en el usuario', 'Redirige a /login con mensaje de registro exitoso', async ({ page }) => {
  await registroExitoso(page, `qa-${unico('u')}`, OK);
});
caso('Registro válido con usuario solo numérico', 'Redirige a /login con mensaje de registro exitoso', async ({ page }) => {
  await registroExitoso(page, soloDigitos(), OK);
});
caso('Registro válido con contraseña de 4 caracteres', 'Se acepta la longitud mínima', async ({ page }) => {
  await registroExitoso(page, unico('mn'), 'ab12');
});
caso('Registro válido con contraseña de 64 caracteres', 'Se acepta una contraseña larga', async ({ page }) => {
  await registroExitoso(page, unico('lg'), 'Aa1!'.repeat(16));
});

caso('Registro con usuario duplicado', 'El segundo registro es rechazado', async ({ page }) => {
  const u = unico('dup');
  await registroExitoso(page, u, OK);
  const r = new RegisterPage(page);
  await r.goto();
  await r.registrar(u, OK);
  await r.esperarRechazo();
  await expect(page).toHaveURL(/\/register/);
});

// --- Campos vacíos (5)
const vacios = [
  ['', '', '', 'todos los campos vacíos'],
  ['userSolo', '', '', 'solo usuario'],
  ['', OK, OK, 'sin usuario'],
  ['userSinConfirm', OK, '', 'sin confirmar contraseña'],
  ['userSinPass', '', OK, 'sin contraseña pero con confirmación'],
];
for (const [u, p, c, nombre] of vacios) {
  caso(`Campos incompletos: ${nombre}`, 'No se registra y permanece en /register', async ({ page }) => {
    const r = new RegisterPage(page);
    await r.goto();
    await r.registrar(u, p, c);
    await r.esperarRechazo();
    await expect(page).toHaveURL(/\/register/);
  });
}

// --- Contraseñas distintas (3)
const mismatch = [['Pass1234', 'distinta por un carácter'], ['pass1234!', 'distinta por mayúsculas'], ['Pass1234!x', 'confirmación más larga']];
for (const [c, nombre] of mismatch) {
  caso(`Contraseñas no coinciden (${nombre})`, 'No se registra y permanece en /register', async ({ page }) => {
    const r = new RegisterPage(page);
    await r.goto();
    await r.registrar(unico('mm'), OK, c);
    await r.esperarRechazo();
    await expect(page).toHaveURL(/\/register/);
  });
}

// --- Usuarios inválidos (12)
const usuariosInvalidos = ['ab', 'a', 'user name', 'user@name', '-user', 'user-', 'user--name',
  '<script>alert(1)</script>', 'user.name', 'user!', 'user/name', 'user#1'];
for (const u of usuariosInvalidos) {
  caso(`Usuario con formato inválido (${u})`, 'No se registra y permanece en /register', async ({ page }) => {
    const r = new RegisterPage(page);
    await r.goto();
    await r.registrar(u, OK);
    await r.esperarRechazo();
    await expect(page).toHaveURL(/\/register/);
  });
}

// --- Contraseñas inválidas (3)
for (const p of ['abc', '1', 'ab']) {
  caso(`Contraseña demasiado corta (${p})`, 'No se registra y permanece en /register', async ({ page }) => {
    const r = new RegisterPage(page);
    await r.goto();
    await r.registrar(unico('pc'), p);
    await r.esperarRechazo();
    await expect(page).toHaveURL(/\/register/);
  });
}

// --- Entradas maliciosas (3)
for (const payload of ["' OR '1'='1", "admin'--", '<img src=x onerror=alert(1)>']) {
  caso(`Entrada maliciosa en usuario (${payload})`, 'Se rechaza y no se ejecuta ningún script', async ({ page }) => {
    let dialogo = false;
    page.on('dialog', (d) => { dialogo = true; d.dismiss(); });
    const r = new RegisterPage(page);
    await r.goto();
    await r.registrar(payload, OK);
    await r.esperarRechazo();
    await expect(page).toHaveURL(/\/register/);
    expect(dialogo).toBe(false);
  });
}

// --- Interfaz (5)
caso('Formulario de registro visible', 'Se muestran usuario, contraseña, confirmación y botón', async ({ page }) => {
  const r = new RegisterPage(page);
  await r.goto();
  await expect(r.user).toBeVisible();
  await expect(r.pass).toBeVisible();
  await expect(r.confirm).toBeVisible();
  await expect(r.submit).toBeVisible();
});
caso('Contraseña enmascarada en registro', 'El campo contraseña es de tipo password', async ({ page }) => {
  const r = new RegisterPage(page);
  await r.goto();
  await expect(r.pass).toHaveAttribute('type', 'password');
});
caso('Confirmación enmascarada en registro', 'El campo confirmar contraseña es de tipo password', async ({ page }) => {
  const r = new RegisterPage(page);
  await r.goto();
  await expect(r.confirm).toHaveAttribute('type', 'password');
});
caso('Enlace hacia login', 'Existe un enlace a /login en la página de registro', async ({ page }) => {
  await page.goto('/register');
  await expect(page.locator('a[href*="login"]').first()).toBeVisible();
});
caso('Encabezado de la página de registro', 'Se muestra un h1', async ({ page }) => {
  await page.goto('/register');
  await expect(page.locator('h1').first()).toBeVisible();
});

// --- Flujo completo (1)
caso('Registrar usuario y luego iniciar sesión', 'El usuario nuevo puede entrar a /secure', async ({ page }) => {
  const u = unico('e2e');
  await registroExitoso(page, u, OK);
  const l = new LoginPage(page);
  await l.login(u, OK);
  await expect(page).toHaveURL(/\/secure/);
});

// --- Solo espacios (2)
caso('Usuario formado solo por espacios', 'No se registra y permanece en /register', async ({ page }) => {
  const r = new RegisterPage(page);
  await r.goto();
  await r.registrar('   ', OK);
  await r.esperarRechazo();
  await expect(page).toHaveURL(/\/register/);
});
caso('Contraseña formada solo por espacios', 'No se registra y permanece en /register', async ({ page }) => {
  const r = new RegisterPage(page);
  await r.goto();
  await r.registrar(unico('sp'), '    ');
  await r.esperarRechazo();
  await expect(page).toHaveURL(/\/register/);
});
