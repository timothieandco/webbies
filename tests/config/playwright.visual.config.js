/**
 * Playwright Visual Regression Testing Configuration
 * Configured for consistent visual testing across environments
 */

import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  // Test directory for visual tests
  testDir: '../visual',
  
  // Run tests in files in parallel
  fullyParallel: false, // Disable for visual consistency
  
  // Retry configuration for visual tests
  retries: process.env.CI ? 3 : 1,
  
  // Single worker for visual consistency
  workers: 1,
  
  // Visual testing reporter
  reporter: [
    ['html', { outputFolder: 'test-results/visual-report' }],
    ['json', { outputFile: 'test-results/visual-results.json' }]
  ],
  
  // Global test settings for visual testing
  use: {
    // Base URL
    baseURL: 'http://localhost:3000',
    
    // Consistent viewport for visual testing
    viewport: { width: 1280, height: 720 },
    
    // Disable animations for consistent screenshots
    reducedMotion: 'reduce',
    
    // Screenshot settings
    screenshot: 'only-on-failure',
    
    // Video recording
    video: 'retain-on-failure',
    
    // Trace for debugging
    trace: 'on-first-retry',
    
    // Longer timeouts for visual tests
    actionTimeout: 15000,
    navigationTimeout: 30000,
    
    // Visual testing specific options
    ignoreHTTPSErrors: true,
    
    // Force consistent font rendering
    fontFamily: '"Segoe UI", "Helvetica Neue", Arial, sans-serif',
    
    // Disable web security for consistent testing
    webSecurity: false
  },

  // Test timeout
  timeout: 60000,
  
  // Expect timeout
  expect: {
    // Visual comparison timeout
    timeout: 15000,
    
    // Visual comparison threshold
    threshold: 0.2, // Allow 20% difference
    
    // Animation handling
    animations: 'disabled'
  },

  // Visual testing projects
  projects: [
    {
      name: 'desktop-chrome-visual',
      use: { 
        ...devices['Desktop Chrome'],
        // Consistent browser settings for visual testing
        deviceScaleFactor: 1,
        hasTouch: false,
        colorScheme: 'light',
        // Disable hardware acceleration for consistency
        launchOptions: {
          args: ['--disable-gpu', '--disable-dev-shm-usage']
        }
      },
    },

    {
      name: 'desktop-firefox-visual',
      use: { 
        ...devices['Desktop Firefox'],
        deviceScaleFactor: 1,
        hasTouch: false,
        colorScheme: 'light'
      },
    },

    {
      name: 'mobile-visual',
      use: { 
        ...devices['iPhone 12'],
        deviceScaleFactor: 2 // Account for mobile scaling
      },
    }
  ],

  // Web server for visual testing
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000
  },

  // Output directory
  outputDir: 'test-results/visual-artifacts',

  // Global setup for visual testing
  globalSetup: require.resolve('./playwright.visual.setup.js')
});