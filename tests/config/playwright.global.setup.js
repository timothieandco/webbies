/**
 * Playwright Global Setup
 * Runs once before all tests across all projects
 */

import { chromium } from '@playwright/test';
import path from 'path';

async function globalSetup() {
  console.log('🚀 Starting Playwright global setup...');

  // Create browser instance for setup tasks
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Wait for dev server to be ready
    console.log('⏳ Waiting for dev server...');
    
    let retries = 0;
    const maxRetries = 30; // 30 seconds timeout
    
    while (retries < maxRetries) {
      try {
        const response = await page.goto('http://localhost:3000/home.html', { 
          waitUntil: 'networkidle',
          timeout: 5000 
        });
        
        if (response && response.ok()) {
          console.log('✅ Dev server is ready');
          break;
        }
      } catch (error) {
        retries++;
        if (retries >= maxRetries) {
          throw new Error('Dev server failed to start within timeout period');
        }
        await page.waitForTimeout(1000);
      }
    }

    // Pre-warm the application pages
    console.log('🔥 Pre-warming application pages...');
    
    // Load home page
    await page.goto('http://localhost:3000/home.html');
    await page.waitForLoadState('networkidle');
    
    // Load customizer page
    await page.goto('http://localhost:3000/index.html');
    await page.waitForLoadState('networkidle');
    
    // Wait for Konva.js and other libraries to initialize
    await page.waitForFunction(() => {
      return window.Konva && window.jewelryCustomizer;
    }, { timeout: 10000 });

    console.log('✅ Application pre-warming completed');

    // Set up test data if needed
    await setupTestData(page);

    console.log('✅ Playwright global setup completed successfully');

  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

/**
 * Set up any test data needed for E2E tests
 */
async function setupTestData(page) {
  console.log('📊 Setting up test data...');
  
  try {
    // Clear any existing localStorage data
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // Set up mock environment variables if needed
    await page.addInitScript(() => {
      // Mock environment for testing
      window.isTestEnvironment = true;
      
      // Mock console methods to reduce noise in tests
      if (window.location.href.includes('localhost:3000')) {
        const originalLog = console.log;
        const originalWarn = console.warn;
        
        console.log = (...args) => {
          if (!args[0] || !args[0].toString().includes('🎨')) {
            originalLog.apply(console, args);
          }
        };
        
        console.warn = (...args) => {
          if (!args[0] || !args[0].toString().includes('Warning:')) {
            originalWarn.apply(console, args);
          }
        };
      }
    });

    console.log('✅ Test data setup completed');
  } catch (error) {
    console.warn('⚠️ Test data setup failed, continuing anyway:', error.message);
  }
}

export default globalSetup;