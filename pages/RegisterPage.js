class RegisterPage {
  constructor(page) {
    this.page = page;
    this.user = page.locator('#username');
    this.pass = page.locator('#password');
    this.confirm = page.locator('#confirmPassword');
    this.submit = page.locator('button[type="submit"]');
    this.flash = page.locator('#flash');
  }
  async goto() { await this.page.goto('/register'); }
  async registrar(u, p, c = p) {
    await this.user.fill(u);
    await this.pass.fill(p);
    await this.confirm.fill(c);
    await this.submit.click();
  }
  // Espera a que el sitio responda para poder confirmar que NO se completó el registro.
  async esperarRechazo() {
    await this.page.waitForLoadState('domcontentloaded');
    await this.page.waitForTimeout(700);
  }
}
module.exports = { RegisterPage };
