import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/browser',
  outputDir: '.reports/browser-results',
  reporter: [['list'], ['html', { outputFolder: '.reports/browser-report', open: 'never' }]],
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 2,
  use: { baseURL: 'http://127.0.0.1:4186', trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'mobile-webkit', use: { ...devices['iPhone 13'] } },
    { name: 'chromium-dev', use: { ...devices['Desktop Chrome'], baseURL: 'http://127.0.0.1:4187' } },
  ],
  webServer: [
    { command: 'npm run preview -- --port 4186 --strictPort', url: 'http://127.0.0.1:4186', reuseExistingServer: false },
    { command: 'npm run dev -- --port 4187 --strictPort', url: 'http://127.0.0.1:4187', reuseExistingServer: false },
  ],
});
