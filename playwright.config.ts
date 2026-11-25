import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './tests',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  retries: 0,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: 'http://127.0.0.1:5174',
    trace: 'off',
  },
  webServer: {
    command: 'npx vite --host 127.0.0.1 --port 5174',
    url: 'http://127.0.0.1:5174/da/',
    reuseExistingServer: true,
    timeout: 60_000,
  },
  projects: [
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
})
