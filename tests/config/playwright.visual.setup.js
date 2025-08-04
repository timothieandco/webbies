/**
 * Playwright Visual Testing Setup
 * Ensures consistent environment for visual regression testing
 */

import { chromium } from '@playwright/test';

async function globalSetup() {
  console.log('🎨 Setting up visual testing environment...');

  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 1,
    isMobile: false,
    hasTouch: false,
    colorScheme: 'light'
  });
  
  const page = await context.newPage();

  try {
    // Wait for application to be ready
    console.log('⏳ Waiting for application...');
    await page.goto('http://localhost:3000/home.html', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });

    // Pre-load fonts and assets
    console.log('🔤 Pre-loading fonts and assets...');
    await page.addStyleTag({
      content: `
        @font-face {
          font-family: 'Segoe UI';
          src: local('Segoe UI');
          font-display: block;
        }
        * {
          font-smooth: never;
          -webkit-font-smoothing: none;
          text-rendering: geometricPrecision;
        }
      `
    });

    // Wait for fonts to load
    await page.evaluate(() => {
      return document.fonts.ready;
    });

    // Pre-warm customizer page
    console.log('🔥 Pre-warming customizer...');
    await page.goto('http://localhost:3000/index.html');
    await page.waitForLoadState('networkidle');
    
    // Wait for Konva and customizer to initialize
    await page.waitForFunction(() => {
      return window.Konva && window.jewelryCustomizer;
    }, { timeout: 15000 });

    // Wait for loading to complete
    await page.waitForSelector('.canvas-overlay', { state: 'hidden', timeout: 10000 });

    // Disable animations globally for visual testing
    await page.addStyleTag({
      content: `
        *, *::before, *::after {
          animation-duration: 0s !important;
          animation-delay: 0s !important;
          transition-duration: 0s !important;
          transition-delay: 0s !important;
        }
        
        /* Ensure consistent scrollbar appearance */
        ::-webkit-scrollbar {
          width: 16px;
        }
        
        ::-webkit-scrollbar-track {
          background: #f1f1f1;
        }
        
        ::-webkit-scrollbar-thumb {
          background: #c1c1c1;
        }
        
        /* Disable any potential flickering */
        * {
          backface-visibility: hidden;
          perspective: 1000px;
        }
      `
    });

    // Set up consistent test environment
    await page.evaluate(() => {
      // Disable smooth scrolling
      if ('scrollBehavior' in document.documentElement.style) {
        document.documentElement.style.scrollBehavior = 'auto';
      }
      
      // Set consistent time for any time-based elements
      Date.now = () => 1640995200000; // Fixed timestamp: 2022-01-01
      
      // Mock random for consistent layouts
      Math.random = () => 0.5;
      
      // Disable any auto-refresh or dynamic content
      window.isVisualTesting = true;
    });

    console.log('✅ Visual testing environment ready');

  } catch (error) {
    console.error('❌ Visual setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
}

module.exports = globalSetup;