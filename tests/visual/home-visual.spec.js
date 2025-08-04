/**
 * Home Page Visual Regression Tests
 * Ensures visual consistency across browsers and updates
 */

import { test, expect } from '@playwright/test';

test.describe('Home Page Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home page
    await page.goto('/home.html');
    
    // Wait for page to fully load and settle
    await page.waitForLoadState('networkidle');
    
    // Wait for fonts to load
    await page.evaluate(() => document.fonts.ready);
    
    // Wait for any potential animations to complete
    await page.waitForTimeout(1000);
  });

  test.describe('Full Page Screenshots', () => {
    test('should match home page layout - desktop', async ({ page }) => {
      // Take full page screenshot
      await expect(page).toHaveScreenshot('home-page-desktop.png', {
        fullPage: true,
        animations: 'disabled'
      });
    });

    test('should match home page layout - mobile', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Wait for responsive layout to settle
      await page.waitForTimeout(500);
      
      await expect(page).toHaveScreenshot('home-page-mobile.png', {
        fullPage: true,
        animations: 'disabled'
      });
    });

    test('should match home page layout - tablet', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      
      await page.waitForTimeout(500);
      
      await expect(page).toHaveScreenshot('home-page-tablet.png', {
        fullPage: true,
        animations: 'disabled'
      });
    });
  });

  test.describe('Section Screenshots', () => {
    test('should match hero section appearance', async ({ page }) => {
      const heroSection = page.locator('.hero-section');
      
      await expect(heroSection).toHaveScreenshot('hero-section.png', {
        animations: 'disabled'
      });
    });

    test('should match navigation appearance', async ({ page }) => {
      const navigation = page.locator('nav');
      
      await expect(navigation).toHaveScreenshot('navigation.png', {
        animations: 'disabled'
      });
    });

    test('should match how it works section', async ({ page }) => {
      const howItWorks = page.locator('.how-it-works');
      
      // Scroll to section to ensure it's fully visible
      await howItWorks.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      
      await expect(howItWorks).toHaveScreenshot('how-it-works-section.png', {
        animations: 'disabled'
      });
    });

    test('should match collection section', async ({ page }) => {
      const collection = page.locator('.our-collection');
      
      await collection.scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      
      await expect(collection).toHaveScreenshot('collection-section.png', {
        animations: 'disabled'
      });
    });
  });

  test.describe('Component Screenshots', () => {
    test('should match collection cards appearance', async ({ page }) => {
      const collectionCards = page.locator('.collection-card');
      
      // Wait for images to load
      await page.waitForLoadState('networkidle');
      
      for (let i = 0; i < await collectionCards.count(); i++) {
        const card = collectionCards.nth(i);
        await expect(card).toHaveScreenshot(`collection-card-${i}.png`, {
          animations: 'disabled'
        });
      }
    });

    test('should match step cards in how it works', async ({ page }) => {
      const stepCards = page.locator('.step-card');
      
      await page.locator('.how-it-works').scrollIntoViewIfNeeded();
      await page.waitForTimeout(300);
      
      for (let i = 0; i < await stepCards.count(); i++) {
        const card = stepCards.nth(i);
        await expect(card).toHaveScreenshot(`step-card-${i}.png`, {
          animations: 'disabled'
        });
      }
    });

    test('should match call-to-action buttons', async ({ page }) => {
      const ctaButtons = page.locator('a[href*="index.html"]');
      
      for (let i = 0; i < await ctaButtons.count(); i++) {
        const button = ctaButtons.nth(i);
        
        // Ensure button is in viewport
        await button.scrollIntoViewIfNeeded();
        await page.waitForTimeout(100);
        
        await expect(button).toHaveScreenshot(`cta-button-${i}.png`, {
          animations: 'disabled'
        });
      }
    });
  });

  test.describe('Hover States', () => {
    test('should match button hover states', async ({ page }) => {
      const designButton = page.locator('.hero-section a[href*="index.html"]').first();
      
      await designButton.scrollIntoViewIfNeeded();
      
      // Hover over button
      await designButton.hover();
      await page.waitForTimeout(100);
      
      await expect(designButton).toHaveScreenshot('button-hover-state.png', {
        animations: 'disabled'
      });
    });

    test('should match collection card hover states', async ({ page }) => {
      const firstCard = page.locator('.collection-card').first();
      
      await firstCard.scrollIntoViewIfNeeded();
      
      // Hover over card
      await firstCard.hover();
      await page.waitForTimeout(100);
      
      await expect(firstCard).toHaveScreenshot('collection-card-hover.png', {
        animations: 'disabled'
      });
    });
  });

  test.describe('Typography and Fonts', () => {
    test('should match heading typography', async ({ page }) => {
      const mainHeading = page.locator('h1').first();
      
      await expect(mainHeading).toHaveScreenshot('main-heading-typography.png', {
        animations: 'disabled'
      });
    });

    test('should match section headings', async ({ page }) => {
      const sectionHeadings = page.locator('h2');
      
      for (let i = 0; i < await sectionHeadings.count(); i++) {
        const heading = sectionHeadings.nth(i);
        await heading.scrollIntoViewIfNeeded();
        await page.waitForTimeout(100);
        
        await expect(heading).toHaveScreenshot(`section-heading-${i}.png`, {
          animations: 'disabled'
        });
      }
    });

    test('should match body text rendering', async ({ page }) => {
      const bodyText = page.locator('.hero-section p').first();
      
      if (await bodyText.isVisible()) {
        await expect(bodyText).toHaveScreenshot('body-text-rendering.png', {
          animations: 'disabled'
        });
      }
    });
  });

  test.describe('Color and Branding', () => {
    test('should match brand color consistency', async ({ page }) => {
      // Test brand elements that should maintain consistent colors
      const brandElements = [
        page.locator('nav'),
        page.locator('.hero-section'),
        page.locator('.how-it-works'),
        page.locator('.our-collection')
      ];

      for (let i = 0; i < brandElements.length; i++) {
        const element = brandElements[i];
        
        if (await element.isVisible()) {
          await element.scrollIntoViewIfNeeded();
          await page.waitForTimeout(200);
          
          await expect(element).toHaveScreenshot(`brand-element-${i}.png`, {
            animations: 'disabled'
          });
        }
      }
    });
  });

  test.describe('Cross-Browser Consistency', () => {
    test('should render consistently in different browsers', async ({ page, browserName }) => {
      // Take screenshot with browser name for comparison
      await expect(page).toHaveScreenshot(`home-page-${browserName}.png`, {
        fullPage: true,
        animations: 'disabled'
      });
    });
  });

  test.describe('Responsive Breakpoints', () => {
    const breakpoints = [
      { name: 'small-mobile', width: 320, height: 568 },
      { name: 'mobile', width: 375, height: 667 },
      { name: 'large-mobile', width: 414, height: 896 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'small-desktop', width: 1024, height: 768 },
      { name: 'desktop', width: 1280, height: 720 },
      { name: 'large-desktop', width: 1920, height: 1080 }
    ];

    for (const breakpoint of breakpoints) {
      test(`should display correctly at ${breakpoint.name} breakpoint`, async ({ page }) => {
        await page.setViewportSize({ 
          width: breakpoint.width, 
          height: breakpoint.height 
        });
        
        // Wait for responsive layout to settle
        await page.waitForTimeout(500);
        
        await expect(page).toHaveScreenshot(`home-${breakpoint.name}.png`, {
          fullPage: true,
          animations: 'disabled'
        });
      });
    }
  });

  test.describe('Image Loading', () => {
    test('should display images consistently', async ({ page }) => {
      // Wait for all images to load
      await page.waitForLoadState('networkidle');
      
      // Check each image section
      const imageSections = [
        page.locator('.hero-section'),
        page.locator('.how-it-works'),
        page.locator('.our-collection')
      ];

      for (let i = 0; i < imageSections.length; i++) {
        const section = imageSections[i];
        
        if (await section.isVisible()) {
          await section.scrollIntoViewIfNeeded();
          await page.waitForTimeout(300);
          
          await expect(section).toHaveScreenshot(`image-section-${i}.png`, {
            animations: 'disabled'
          });
        }
      }
    });

    test('should handle missing images gracefully', async ({ page }) => {
      // Simulate image loading failures
      await page.route('**/*.jpg', route => route.abort());
      await page.route('**/*.png', route => route.abort());
      
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      await expect(page).toHaveScreenshot('home-missing-images.png', {
        fullPage: true,
        animations: 'disabled'
      });
    });
  });

  test.describe('Loading States', () => {
    test('should match loading appearance', async ({ page }) => {
      // Simulate slow loading by blocking some resources temporarily
      await page.route('**/*.css', route => {
        setTimeout(() => route.continue(), 500);
      });
      
      // Navigate and capture during loading
      const navigationPromise = page.goto('/home.html');
      
      // Wait a bit then capture
      await page.waitForTimeout(200);
      
      if (await page.locator('body').isVisible()) {
        await expect(page).toHaveScreenshot('home-loading-state.png', {
          animations: 'disabled'
        });
      }
      
      await navigationPromise;
    });
  });
});