import { PlaywrightTestConfig,devices } from '@playwright/test'

const config: PlaywrightTestConfig = {
  timeout: 60000,
  retries: 0,
  use: {
    headless: true,
    viewport: { width: 1280, height: 720 },
    actionTimeout: 15000,
    ignoreHTTPSErrors: true,
    screenshot: 'only-on-failure',
  },
  reporter: [["list"],["html"]],
  projects: [
    {
      name: 'Chromium',
      use: {
        ...devices["Desktop Chrome"],
      },
      testMatch: `**/tests/*.smoke.spec.ts`,
    },
  ],
}

export default config
