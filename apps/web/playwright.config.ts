import { defineConfig, devices } from '@playwright/test';

// Web flows and screenshots (SPEC 8.4, 11). Runs against the dev server on port 3000, starting
// it when it is not already running.
export default defineConfig({
  testDir: './e2e',
  outputDir: './e2e/.results',
  fullyParallel: false,
  workers: 1,
  timeout: 120_000,
  expect: { timeout: 20_000 },
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 900 } },
    },
    { name: 'phone', use: { ...devices['Pixel 7'], viewport: { width: 360, height: 780 } } },
  ],
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3000/en/welcome',
    reuseExistingServer: true,
    timeout: 300_000,
  },
});
