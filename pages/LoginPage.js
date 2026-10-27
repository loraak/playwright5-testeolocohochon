class LoginPage {
  constructor(page) {
    this.page = page;
    this.user = page.locator('#username');
    this.pass = page.locator('#password');
    this.submit = page.locator('button[type="submit"]');
    this.flash = page.locator('#flash');
    this.logout = page.locator('a[href="/logout"], button:has-text("Logout"), a:has-text("Logout")').first();
  }
  async goto() { await this.page.goto('/login'); }
  async login(u, p) {
    await this.user.fill(u);
    await this.pass.fill(p);
    await this.submit.click();
  }
}
module.exports = { LoginPage };
