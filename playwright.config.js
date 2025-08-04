/**
 * Playwright Configuration for E2E Testing
 * Comprehensive cross-browser testing setup
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // Test directory
  testDir: './tests/e2e',
  
  // Run tests in files in parallel
  fullyParallel: true,
  
  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,
  
  // Retry on CI only
  retries: process.env.CI ? 2 : 0,
  
  // Opt out of parallel tests on CI
  workers: process.env.CI ? 1 : undefined,
  
  // Reporter configuration
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/playwright-report.json' }],
    ['junit', { outputFile: 'test-results/playwright-junit.xml' }],
    process.env.CI ? ['github'] : ['list']
  ],
  
  // Global test settings
  use: {
    // Base URL for tests
    baseURL: 'http://localhost:3000',
    
    // Browser context options
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    
    // Capture screenshot on failure
    screenshot: 'only-on-failure',
    
    // Record video on failure
    video: 'retain-on-failure',
    
    // Record trace for debugging
    trace: 'on-first-retry',
    
    // Action timeout
    actionTimeout: 10000,
    
    // Navigation timeout
    navigationTimeout: 30000
  },

  // Test timeout
  timeout: 30000,
  
  // Expect timeout
  expect: {
    // Increase expect timeout for better stability
    timeout: 10000
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: { 
        ...devices['Desktop Chrome'],
        // Enable canvas permissions for Konva.js
        permissions: ['clipboard-read', 'clipboard-write']
      },
    },

    {
      name: 'firefox',
      use: { 
        ...devices['Desktop Firefox']
      },
    },

    {
      name: 'webkit',
      use: { 
        ...devices['Desktop Safari']
      },
    },

    // Mobile testing
    {
      name: 'Mobile Chrome',
      use: { 
        ...devices['Pixel 5']
      },
    },
    {
      name: 'Mobile Safari',
      use: { 
        ...devices['iPhone 12']
      },
    },

    // Tablet testing
    {
      name: 'Tablet',
      use: {
        ...devices['iPad Pro']
      }
    }
  ],

  // Web server configuration for development testing
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000
  },

  // Output directory for test results
  outputDir: 'test-results/playwright-artifacts',

  // Global setup and teardown
  globalSetup: './tests/config/playwright.global.setup.js',
  globalTeardown: './tests/config/playwright.global.teardown.js'
});