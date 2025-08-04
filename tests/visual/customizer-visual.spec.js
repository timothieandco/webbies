/**
 * Customizer Visual Regression Tests
 * Ensures visual consistency of the jewelry customizer interface
 */

import { test, expect } from '@playwright/test';

test.describe('Customizer Visual Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to customizer
    await page.goto('/index.html');
    
    // Wait for application to load
    await page.waitForLoadState('networkidle');
    
    // Wait for Konva and customizer to initialize
    await page.waitForFunction(() => {
      return window.Konva && window.jewelryCustomizer;
    }, { timeout: 15000 });
    
    // Wait for loading overlay to disappear
    await page.waitForSelector('.canvas-overlay', { state: 'hidden', timeout: 10000 });
    
    // Wait for fonts and assets to settle
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(1000);
  });

  test.describe('Application Layout', () => {
    test('should match customizer layout - desktop', async ({ page }) => {
      await expect(page).toHaveScreenshot('customizer-desktop-layout.png', {
        fullPage: true,
        animations: 'disabled'
      });
    });

    test('should match customizer layout - mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(500);
      
      await expect(page).toHaveScreenshot('customizer-mobile-layout.png', {
        fullPage: true,
        animations: 'disabled'
      });
    });

    test('should match customizer layout - tablet', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(500);
      
      await expect(page).toHaveScreenshot('customizer-tablet-layout.png', {
        fullPage: true,
        animations: 'disabled'
      });
    });
  });

  test.describe('Canvas and Workspace', () => {
    test('should match empty canvas state', async ({ page }) => {
      const canvasContainer = page.locator('#jewelry-customizer');
      
      await expect(canvasContainer).toHaveScreenshot('empty-canvas.png', {
        animations: 'disabled'
      });
    });

    test('should match canvas with default necklace', async ({ page }) => {
      // Wait for necklace to render
      await page.waitForTimeout(2000);
      
      const canvasContainer = page.locator('#jewelry-customizer');
      
      await expect(canvasContainer).toHaveScreenshot('canvas-with-necklace.png', {
        animations: 'disabled'
      });
    });

    test('should match canvas controls overlay', async ({ page }) => {
      const controlsOverlay = page.locator('.customizer-controls');
      
      if (await controlsOverlay.isVisible()) {
        await expect(controlsOverlay).toHaveScreenshot('canvas-controls.png', {
          animations: 'disabled'
        });
      }
    });
  });

  test.describe('Sidebar and Inventory', () => {
    test('should match charm library sidebar', async ({ page }) => {
      const sidebar = page.locator('#charm-library');
      
      // Wait for inventory to load
      await page.waitForTimeout(2000);
      
      await expect(sidebar).toHaveScreenshot('charm-library-sidebar.png', {
        animations: 'disabled'
      });
    });

    test('should match category filters', async ({ page }) => {
      const categoryFilters = page.locator('.category-filters');
      
      if (await categoryFilters.isVisible()) {
        await expect(categoryFilters).toHaveScreenshot('category-filters.png', {
          animations: 'disabled'
        });
      }
    });

    test('should match charm grid layout', async ({ page }) => {
      const charmGrid = page.locator('.charm-grid');
      
      await page.waitForTimeout(2000);
      
      if (await charmGrid.isVisible()) {
        await expect(charmGrid).toHaveScreenshot('charm-grid.png', {
          animations: 'disabled'
        });
      }
    });

    test('should match individual charm items', async ({ page }) => {
      await page.waitForTimeout(2000);
      
      const charmItems = page.locator('.charm-item');
      const count = Math.min(await charmItems.count(), 5); // Test first 5 items
      
      for (let i = 0; i < count; i++) {
        const charmItem = charmItems.nth(i);
        
        if (await charmItem.isVisible()) {
          await expect(charmItem).toHaveScreenshot(`charm-item-${i}.png`, {
            animations: 'disabled'
          });
        }
      }
    });

    test('should match search interface', async ({ page }) => {
      const searchInput = page.locator('input[type="search"]');
      
      if (await searchInput.isVisible()) {
        // Take screenshot of search area
        const searchContainer = searchInput.locator('..');
        await expect(searchContainer).toHaveScreenshot('search-interface.png', {
          animations: 'disabled'
        });
      }
    });
  });

  test.describe('Canvas with Charms', () => {
    test('should match canvas with single charm', async ({ page }) => {
      // Add a charm to the canvas
      await addCharmToCanvas(page);
      
      const canvasContainer = page.locator('#jewelry-customizer');
      
      await expect(canvasContainer).toHaveScreenshot('canvas-single-charm.png', {
        animations: 'disabled'
      });
    });

    test('should match canvas with multiple charms', async ({ page }) => {
      // Add multiple charms
      await addCharmToCanvas(page, 300, 250);
      await addCharmToCanvas(page, 450, 300);
      await addCharmToCanvas(page, 550, 250);
      
      const canvasContainer = page.locator('#jewelry-customizer');
      
      await expect(canvasContainer).toHaveScreenshot('canvas-multiple-charms.png', {
        animations: 'disabled'
      });
    });

    test('should match charm selection state', async ({ page }) => {
      // Add and select a charm
      await addCharmToCanvas(page);
      await selectCharmOnCanvas(page);
      
      const canvasContainer = page.locator('#jewelry-customizer');
      
      await expect(canvasContainer).toHaveScreenshot('charm-selected-state.png', {
        animations: 'disabled'
      });
    });
  });

  test.describe('Interactive States', () => {
    test('should match hover states on charm items', async ({ page }) => {
      await page.waitForTimeout(2000);
      
      const firstCharm = page.locator('.charm-item').first();
      
      if (await firstCharm.isVisible()) {
        await firstCharm.hover();
        await page.waitForTimeout(100);
        
        await expect(firstCharm).toHaveScreenshot('charm-item-hover.png', {
          animations: 'disabled'
        });
      }
    });

    test('should match active category filter state', async ({ page }) => {
      const categoryButton = page.locator('button[data-category="Charms"]');
      
      if (await categoryButton.isVisible()) {
        await categoryButton.click();
        await page.waitForTimeout(300);
        
        await expect(categoryButton).toHaveScreenshot('category-filter-active.png', {
          animations: 'disabled'
        });
      }
    });

    test('should match control button states', async ({ page }) => {
      const controlButtons = page.locator('.customizer-controls button');
      
      for (let i = 0; i < await controlButtons.count(); i++) {
        const button = controlButtons.nth(i);
        
        if (await button.isVisible()) {
          await expect(button).toHaveScreenshot(`control-button-${i}.png`, {
            animations: 'disabled'
          });
          
          // Test hover state
          await button.hover();
          await page.waitForTimeout(100);
          
          await expect(button).toHaveScreenshot(`control-button-${i}-hover.png`, {
            animations: 'disabled'
          });
        }
      }
    });
  });

  test.describe('Search and Filtering', () => {
    test('should match search results appearance', async ({ page }) => {
      const searchInput = page.locator('input[type="search"]');
      
      if (await searchInput.isVisible()) {
        await searchInput.fill('heart');
        await page.waitForTimeout(1000);
        
        const sidebar = page.locator('#charm-library');
        await expect(sidebar).toHaveScreenshot('search-results.png', {
          animations: 'disabled'
        });
      }
    });

    test('should match filtered category view', async ({ page }) => {
      const charmsFilter = page.locator('button[data-category="Charms"]');
      
      if (await charmsFilter.isVisible()) {
        await charmsFilter.click();
        await page.waitForTimeout(1000);
        
        const sidebar = page.locator('#charm-library');
        await expect(sidebar).toHaveScreenshot('filtered-charms-view.png', {
          animations: 'disabled'
        });
      }
    });

    test('should match empty search results', async ({ page }) => {
      const searchInput = page.locator('input[type="search"]');
      
      if (await searchInput.isVisible()) {
        await searchInput.fill('nonexistent');
        await page.waitForTimeout(1000);
        
        const sidebar = page.locator('#charm-library');
        await expect(sidebar).toHaveScreenshot('empty-search-results.png', {
          animations: 'disabled'
        });
      }
    });
  });

  test.describe('Loading and Error States', () => {
    test('should match loading state appearance', async ({ page }) => {
      // Force loading state by intercepting requests
      await page.route('**/api/**', route => {
        // Delay the response to capture loading state
        setTimeout(() => route.continue(), 2000);
      });
      
      await page.reload();
      
      // Capture loading state
      const loadingElement = page.locator('.loading-indicator, .canvas-overlay');
      
      if (await loadingElement.isVisible()) {
        await expect(loadingElement).toHaveScreenshot('loading-state.png', {
          animations: 'disabled'
        });
      }
    });

    test('should match error state appearance', async ({ page }) => {
      // Simulate error by blocking all network requests
      await page.route('**/*', route => route.abort());
      
      await page.reload();
      await page.waitForTimeout(2000);
      
      // Check for error display
      const errorElement = page.locator('.error-message, .error-state');
      
      if (await errorElement.isVisible()) {
        await expect(errorElement).toHaveScreenshot('error-state.png', {
          animations: 'disabled'
        });
      }
    });

    test('should match offline state appearance', async ({ page }) => {
      // Simulate offline state
      await page.context().setOffline(true);
      await page.reload();
      await page.waitForTimeout(1000);
      
      await expect(page).toHaveScreenshot('offline-state.png', {
        fullPage: true,
        animations: 'disabled'
      });
      
      // Restore online state
      await page.context().setOffline(false);
    });
  });

  test.describe('Theme and Branding', () => {
    test('should match brand color consistency', async ({ page }) => {
      // Test various UI elements for brand consistency
      const brandElements = [
        page.locator('nav'),
        page.locator('#charm-library'),
        page.locator('.customizer-controls'),
        page.locator('#jewelry-customizer')
      ];

      for (let i = 0; i < brandElements.length; i++) {
        const element = brandElements[i];
        
        if (await element.isVisible()) {
          await expect(element).toHaveScreenshot(`brand-element-${i}.png`, {
            animations: 'disabled'
          });
        }
      }
    });

    test('should match typography consistency', async ({ page }) => {
      const textElements = page.locator('h1, h2, h3, .charm-title, button');
      const count = Math.min(await textElements.count(), 8);
      
      for (let i = 0; i < count; i++) {
        const element = textElements.nth(i);
        
        if (await element.isVisible()) {
          await expect(element).toHaveScreenshot(`typography-${i}.png`, {
            animations: 'disabled'
          });
        }
      }
    });
  });

  test.describe('Cross-Browser Consistency', () => {
    test('should render consistently across browsers', async ({ page, browserName }) => {
      await expect(page).toHaveScreenshot(`customizer-${browserName}.png`, {
        fullPage: true,
        animations: 'disabled'
      });
    });

    test('should maintain canvas consistency across browsers', async ({ page, browserName }) => {
      // Add some content for comparison
      await addCharmToCanvas(page);
      
      const canvasContainer = page.locator('#jewelry-customizer');
      
      await expect(canvasContainer).toHaveScreenshot(`canvas-${browserName}.png`, {
        animations: 'disabled'
      });
    });
  });

  test.describe('Responsive Design Visual Tests', () => {
    const breakpoints = [
      { name: 'mobile-portrait', width: 375, height: 667 },
      { name: 'mobile-landscape', width: 667, height: 375 },
      { name: 'tablet-portrait', width: 768, height: 1024 },
      { name: 'tablet-landscape', width: 1024, height: 768 },
      { name: 'desktop-small', width: 1280, height: 720 },
      { name: 'desktop-large', width: 1920, height: 1080 }
    ];

    for (const breakpoint of breakpoints) {
      test(`should display correctly at ${breakpoint.name}`, async ({ page }) => {
        await page.setViewportSize({ 
          width: breakpoint.width, 
          height: breakpoint.height 
        });
        
        await page.waitForTimeout(500);
        
        await expect(page).toHaveScreenshot(`customizer-${breakpoint.name}.png`, {
          fullPage: true,
          animations: 'disabled'
        });
      });
    }
  });
});

// Helper functions
async function addCharmToCanvas(page, x = null, y = null) {
  const sidebar = page.locator('#charm-library');
  const canvas = page.locator('#jewelry-customizer canvas');
  
  await page.waitForTimeout(1000);
  
  const firstCharm = sidebar.locator('.charm-item').first();
  
  if (await firstCharm.isVisible()) {
    const canvasBox = await canvas.boundingBox();
    const targetX = x || canvasBox.width / 2;
    const targetY = y || canvasBox.height / 2;
    
    await firstCharm.dragTo(canvas, {
      targetPosition: { x: targetX, y: targetY }
    });
    
    await page.waitForTimeout(500);
  }
}

async function selectCharmOnCanvas(page) {
  const canvas = page.locator('#jewelry-customizer canvas');
  const canvasBox = await canvas.boundingBox();
  
  await page.mouse.click(
    canvasBox.x + canvasBox.width / 2,
    canvasBox.y + canvasBox.height / 2
  );
  
  await page.waitForTimeout(300);
}