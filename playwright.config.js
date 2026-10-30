import { defineConfig, devices } from '@playwright/test'
import { config } from './test/config'
const baseURLs = {
  local: config.FORMS_RUNNER_URL
}

const baseURL = baseURLs.local
/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './test',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 1 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: 'html',
  /* Visual baselines are shared across machines, so leave the OS out of the file name. Generate them in Docker (npm run test:visual:docker) */
  snapshotPathTemplate:
    '{testDir}/__screenshots__/{projectName}/{testFilePath}/{arg}{ext}',
  expect: {
    toHaveScreenshot: {
      animations: 'disabled',
      caret: 'hide',
      maxDiffPixelRatio: 0.001
    }
  },
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('')`. */
    baseURL,
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'retain-on-failure',
    video: 'retain-on-failure'
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 }
      },
      testIgnore: /visual\.(spec|setup)\.js/,
      retries: 1
    },
    {
      name: 'visual-setup',
      testMatch: 'visual.setup.js'
    },
    {
      name: 'visual-desktop',
      testMatch: 'visual.spec.js',
      dependencies: ['visual-setup'],
      retries: 1,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1280, height: 800 }
      }
    },
    {
      name: 'visual-mobile',
      testMatch: 'visual.spec.js',
      dependencies: ['visual-setup'],
      retries: 1,
      use: {
        ...devices['Pixel 7']
      }
    }
  ]
})
