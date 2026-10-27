const { test, expect, contador } = require('../helpers/fixtures');

const nuevoId = contador('FORGOT');
const caso = (descripcion, esperado, fn) => test(`${nuevoId()} | ${descripcion} | ${esperado}`, fn);
const email = (page) => page.locator('#email');
const enviar = (page) => page.locator('button[type="submit"]');

caso('Página de recuperación visible', 'Carga /forgot-password con un h1', async ({ page }) => {
  await page.goto('/forgot-password');
  await expect(page.locator('h1').first()).toBeVisible();
});
caso('Campo de correo presente', 'Existe el campo email', async ({ page }) => {
  await page.goto('/forgot-password');
  await expect(email(page)).toBeVisible();
});
caso('Campo de correo con tipo email', 'El input es de tipo email', async ({ page }) => {
  await page.goto('/forgot-password');
  await expect(email(page)).toHaveAttribute('type', 'email');
});
caso('Botón de envío presente', 'Existe el botón para recuperar contraseña', async ({ page }) => {
  await page.goto('/forgot-password');
  await expect(enviar(page)).toBeVisible();
});

for (const mail of ['qa.test@example.com', 'user+tag@example.org', 'a@b.co']) {
  caso(`Correo válido (${mail})`, 'El sitio responde con un mensaje de confirmación', async ({ page }) => {
    await page.goto('/forgot-password');
    await email(page).fill(mail);
    await enviar(page).click();
    await expect(page.locator('#flash, .alert, [role="alert"]').first()).toBeVisible();
  });
}

const invalidos = ['', 'plainaddress', '@missing.com', 'user@', 'user@@x.com', 'user name@x.com', 'user@.com', '<script>alert(1)</script>'];
for (const mail of invalidos) {
  caso(`Correo inválido (${mail || 'vacío'})`, 'No se envía y permanece en /forgot-password', async ({ page }) => {
    await page.goto('/forgot-password');
    await email(page).fill(mail);
    await enviar(page).click();
    await page.waitForTimeout(700);
    await expect(page).toHaveURL(/\/forgot-password/);
  });
}
