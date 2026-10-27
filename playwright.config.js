const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 30_000,
  expect: { timeout: 7_000 },
  fullyParallel: true,
  retries: 1,
  workers: 3,
  reporter: [
    ['list'],
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'reports/results.json' }],
  ],
  use: {
    baseURL: 'https://practice.expandtesting.com',
    screenshot: 'on', // evidencia de cada prueba
    trace: 'retain-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 20_000,
    acceptDownloads: true,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
