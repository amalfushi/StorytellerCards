import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  timeout: 60_000,
  retries: 0,
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
  },
  webServer: [
    {
      command: 'cd .. && npm run dev',
      port: 5173,
      reuseExistingServer: true,
      timeout: 30_000,
    },
  ],
  projects: [
    {
      name: 'lifecycle',
      testMatch: 'game-lifecycle.spec.ts',
    },
    {
      name: 'sync',
      testMatch: 'cross-device-sync.spec.ts',
    },
    {
      name: 'journey',
      testMatch: 'full-journey.spec.ts',
      timeout: 180_000,
    },
  ],
});
