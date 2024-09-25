import { PlaywrightTestConfig,devices } from '@playwright/test'

const config: PlaywrightTestConfig = {
  timeout: 120000,
  retries: 0,
  use: {
    headless: true,
    viewport: { width: 1280, height: 720 },
    actionTimeout: 15000,
    ignoreHTTPSErrors: true,
    screenshot: 'only-on-failure',
  },
  reporter: [["list"]],
  projects: [
    {
      name: 'BO_Single',
      use: {
        ...devices["Desktop Chrome"],
      },
      // testMatch: `**/tests/*.smoke.spec.ts`,
      testMatch: `**/tests/bo-single-integration.smoke.spec.ts`,

    },
    {
      name: 'BO_Parlay',
      use: {
        ...devices["Desktop Chrome"],
      },
      // testMatch: `**/tests/*.smoke.spec.ts`,
      testMatch: `**/tests/bo-parlay-integration.smoke.spec.ts`,

    },
    {
      name: 'PS',
      use: {
        ...devices["Desktop Chrome"],
      },
      // testMatch: `**/tests/*.smoke.spec.ts`,
      testMatch: `**/tests/ps-*.smoke.spec.ts`,

    },
    {
      name: 'BO_SabaPlus',
      use: {
        ...devices["Desktop Chrome"],
      },
      // testMatch: `**/tests/*.smoke.spec.ts`,
      testMatch: `**/tests/bo-sabaplus-integration.smoke.spec.ts`,

    },
  ],
  
}

export default config
