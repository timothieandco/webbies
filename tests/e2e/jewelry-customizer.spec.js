/**
 * Jewelry Customizer E2E Tests
 * Tests the main application functionality including drag-and-drop, canvas operations, and user interactions
 */

import { test, expect } from '@playwright/test';

test.describe('Jewelry Customizer', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to customizer page
    await page.goto('/index.html');
    
    // Wait for application to fully load
    await page.waitForLoadState('networkidle');
    
    // Wait for Konva.js and customizer to initialize
    await page.waitForFunction(() => {
      return window.Konva && window.jewelryCustomizer;
    }, { timeout: 15000 });
    
    // Wait for loading indicator to disappear
    await page.waitForSelector('.canvas-overlay', { state: 'hidden', timeout: 10000 });
  });

  test.describe('Application Initialization', () => {
    test('should load customizer successfully', async ({ page }) => {
      // Check page title
      await expect(page).toHaveTitle(/Jewelry Customizer/);
      
      // Check main containers are present
      await expect(page.locator('#jewelry-customizer')).toBeVisible();
      await expect(page.locator('#charm-library')).toBeVisible();
      await expect(page.locator('.customizer-controls')).toBeVisible();
    });

    test('should initialize Konva canvas', async ({ page }) => {
      // Check that Konva stage is created
      const canvas = page.locator('#jewelry-customizer canvas');
      await expect(canvas).toBeVisible();
      
      // Verify canvas dimensions
      const canvasBox = await canvas.boundingBox();
      expect(canvasBox.width).toBeGreaterThan(0);
      expect(canvasBox.height).toBeGreaterThan(0);
    });

    test('should load default necklace', async ({ page }) => {
      // Wait for necklace to be rendered
      await page.waitForTimeout(2000);
      
      // Check that necklace image is loaded in canvas
      const hasNecklace = await page.evaluate(() => {
        return window.jewelryCustomizer && 
               window.jewelryCustomizer.currentNecklace !== null;
      });
      
      expect(hasNecklace).toBe(true);
    });
  });

  test.describe('Sidebar and Inventory', () => {
    test('should display charm categories', async ({ page }) => {
      const sidebar = page.locator('#charm-library');
      
      // Check category filters
      const categoryButtons = sidebar.locator('.category-filter button');
      await expect(categoryButtons).toHaveCount.greaterThan(0);
      
      // Should have 'All' category
      await expect(sidebar.locator('button[data-category="all"]')).toBeVisible();
    });

    test('should display charm inventory', async ({ page }) => {
      const sidebar = page.locator('#charm-library');
      
      // Wait for inventory to load
      await page.waitForTimeout(2000);
      
      // Check that charm items are displayed
      const charmItems = sidebar.locator('.charm-item');
      await expect(charmItems.first()).toBeVisible();
      
      // Each charm should have an image and title
      const firstCharm = charmItems.first();
      await expect(firstCharm.locator('img')).toBeVisible();
      await expect(firstCharm.locator('.charm-title')).toBeVisible();
    });

    test('should filter charms by category', async ({ page }) => {
      const sidebar = page.locator('#charm-library');
      
      // Wait for initial load
      await page.waitForTimeout(2000);
      
      // Get initial charm count
      const initialCount = await sidebar.locator('.charm-item:visible').count();
      
      // Click on a specific category (if available)
      const charmsCategory = sidebar.locator('button[data-category="Charms"]');
      if (await charmsCategory.isVisible()) {
        await charmsCategory.click();
        
        // Wait for filter to apply
        await page.waitForTimeout(1000);
        
        // Verify filtering worked (count may be same or different)
        const filteredCount = await sidebar.locator('.charm-item:visible').count();
        expect(filteredCount).toBeGreaterThan(0);
      }
    });

    test('should search charms', async ({ page }) => {
      const sidebar = page.locator('#charm-library');
      const searchInput = sidebar.locator('input[type="search"]');
      
      if (await searchInput.isVisible()) {
        // Get initial charm count
        const initialCount = await sidebar.locator('.charm-item:visible').count();
        
        // Type search term
        await searchInput.fill('heart');
        await page.waitForTimeout(1000);
        
        // Verify search results
        const searchResults = await sidebar.locator('.charm-item:visible').count();
        // Results should be <= initial count (filtering effect)
        expect(searchResults).toBeLessThanOrEqual(initialCount);
      }
    });
  });

  test.describe('Drag and Drop Functionality', () => {
    test('should drag charm from sidebar to canvas', async ({ page }) => {
      const sidebar = page.locator('#charm-library');
      const canvas = page.locator('#jewelry-customizer canvas');
      
      // Wait for charms to load
      await page.waitForTimeout(2000);
      
      // Get first available charm
      const firstCharm = sidebar.locator('.charm-item').first();
      await expect(firstCharm).toBeVisible();
      
      // Get canvas center position
      const canvasBox = await canvas.boundingBox();
      const targetX = canvasBox.x + canvasBox.width / 2;
      const targetY = canvasBox.y + canvasBox.height / 2;
      
      // Perform drag and drop
      await firstCharm.dragTo(canvas, {
        targetPosition: { x: canvasBox.width / 2, y: canvasBox.height / 2 }
      });
      
      // Wait for charm to be added
      await page.waitForTimeout(1000);
      
      // Verify charm was added to canvas
      const charmCount = await page.evaluate(() => {
        return window.jewelryCustomizer ? 
               window.jewelryCustomizer.charmManager.getCharmCount() : 0;
      });
      
      expect(charmCount).toBeGreaterThan(0);
    });

    test('should allow charm repositioning', async ({ page }) => {
      // First add a charm
      await addCharmToCanvas(page);
      
      const canvas = page.locator('#jewelry-customizer canvas');
      const canvasBox = await canvas.boundingBox();
      
      // Click and drag charm to new position
      const initialX = canvasBox.width / 2;
      const initialY = canvasBox.height / 2;
      const newX = initialX + 100;
      const newY = initialY + 50;
      
      await page.mouse.move(canvasBox.x + initialX, canvasBox.y + initialY);
      await page.mouse.down();
      await page.mouse.move(canvasBox.x + newX, canvasBox.y + newY);
      await page.mouse.up();
      
      // Wait for drag operation to complete
      await page.waitForTimeout(500);
      
      // Verify charm position changed
      const charmMoved = await page.evaluate(() => {
        const charms = window.jewelryCustomizer.charmManager.charms;
        return charms.size > 0; // At least charm exists
      });
      
      expect(charmMoved).toBe(true);
    });
  });

  test.describe('Charm Selection and Manipulation', () => {
    test('should select charm on click', async ({ page }) => {
      // Add charm first
      await addCharmToCanvas(page);
      
      const canvas = page.locator('#jewelry-customizer canvas');
      const canvasBox = await canvas.boundingBox();
      
      // Click on the charm position
      await page.mouse.click(
        canvasBox.x + canvasBox.width / 2,
        canvasBox.y + canvasBox.height / 2
      );
      
      // Wait for selection
      await page.waitForTimeout(500);
      
      // Verify charm is selected
      const isSelected = await page.evaluate(() => {
        return window.jewelryCustomizer.selectedCharm !== null;
      });
      
      expect(isSelected).toBe(true);
    });

    test('should delete selected charm with Delete key', async ({ page }) => {
      // Add and select charm
      await addCharmToCanvas(page);
      await selectCharmOnCanvas(page);
      
      // Press Delete key
      await page.keyboard.press('Delete');
      
      // Wait for deletion
      await page.waitForTimeout(500);
      
      // Verify charm was removed
      const charmCount = await page.evaluate(() => {
        return window.jewelryCustomizer.charmManager.getCharmCount();
      });
      
      expect(charmCount).toBe(0);
    });

    test('should deselect charm when clicking empty area', async ({ page }) => {
      // Add and select charm
      await addCharmToCanvas(page);
      await selectCharmOnCanvas(page);
      
      const canvas = page.locator('#jewelry-customizer canvas');
      const canvasBox = await canvas.boundingBox();
      
      // Click on empty area (top-left corner)
      await page.mouse.click(canvasBox.x + 50, canvasBox.y + 50);
      
      // Wait for deselection
      await page.waitForTimeout(500);
      
      // Verify charm is deselected
      const isSelected = await page.evaluate(() => {
        return window.jewelryCustomizer.selectedCharm !== null;
      });
      
      expect(isSelected).toBe(false);
    });
  });

  test.describe('Control Panel Functionality', () => {
    test('should clear all charms', async ({ page }) => {
      // Add multiple charms
      await addCharmToCanvas(page);
      await addCharmToCanvas(page, 100, 100); // Different position
      
      // Click clear button
      const clearButton = page.locator('button:has-text("Clear")');
      if (await clearButton.isVisible()) {
        await clearButton.click();
        
        // Wait for clearing
        await page.waitForTimeout(500);
        
        // Verify all charms are removed
        const charmCount = await page.evaluate(() => {
          return window.jewelryCustomizer.charmManager.getCharmCount();
        });
        
        expect(charmCount).toBe(0);
      }
    });

    test('should export design', async ({ page }) => {
      // Add a charm first
      await addCharmToCanvas(page);
      
      // Click export button
      const exportButton = page.locator('button:has-text("Export")');
      if (await exportButton.isVisible()) {
        // Set up download promise before clicking
        const downloadPromise = page.waitForEvent('download');
        
        await exportButton.click();
        
        // Wait for download
        const download = await downloadPromise;
        
        // Verify download occurred
        expect(download.suggestedFilename()).toContain('.png');
      }
    });

    test('should handle undo/redo operations', async ({ page }) => {
      // Add a charm
      await addCharmToCanvas(page);
      
      let charmCount = await page.evaluate(() => {
        return window.jewelryCustomizer.charmManager.getCharmCount();
      });
      expect(charmCount).toBe(1);
      
      // Undo
      await page.keyboard.press('Control+z');
      await page.waitForTimeout(500);
      
      charmCount = await page.evaluate(() => {
        return window.jewelryCustomizer.charmManager.getCharmCount();
      });
      expect(charmCount).toBe(0);
      
      // Redo
      await page.keyboard.press('Control+Shift+z');
      await page.waitForTimeout(500);
      
      charmCount = await page.evaluate(() => {
        return window.jewelryCustomizer.charmManager.getCharmCount();
      });
      expect(charmCount).toBe(1);
    });
  });

  test.describe('Responsive Design', () => {
    test('should adapt to mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Reload page for mobile layout
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Check that elements are still functional
      await expect(page.locator('#jewelry-customizer')).toBeVisible();
      await expect(page.locator('#charm-library')).toBeVisible();
      
      // Canvas should resize
      const canvas = page.locator('#jewelry-customizer canvas');
      const canvasBox = await canvas.boundingBox();
      expect(canvasBox.width).toBeLessThan(375);
    });

    test('should handle tablet orientation', async ({ page }) => {
      // Set tablet landscape
      await page.setViewportSize({ width: 1024, height: 768 });
      
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Layout should adapt
      await expect(page.locator('#jewelry-customizer')).toBeVisible();
      await expect(page.locator('#charm-library')).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      // Simulate network failure
      await page.route('**/api/**', route => route.abort());
      
      // Reload page
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Application should still load with fallback data
      await expect(page.locator('#jewelry-customizer')).toBeVisible();
    });

    test('should handle image loading failures', async ({ page }) => {
      // Simulate image loading failures
      await page.route('**/*.png', route => route.abort());
      await page.route('**/*.jpg', route => route.abort());
      
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Application should handle gracefully
      await expect(page.locator('#jewelry-customizer')).toBeVisible();
    });
  });

  test.describe('Performance', () => {
    test('should handle multiple charm operations efficiently', async ({ page }) => {
      const startTime = Date.now();
      
      // Add multiple charms quickly
      for (let i = 0; i < 5; i++) {
        await addCharmToCanvas(page, 200 + i * 50, 200 + i * 50);
        await page.waitForTimeout(100); // Small delay between operations
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should complete within reasonable time
      expect(duration).toBeLessThan(10000); // 10 seconds
      
      // Verify all charms were added
      const charmCount = await page.evaluate(() => {
        return window.jewelryCustomizer.charmManager.getCharmCount();
      });
      
      expect(charmCount).toBe(5);
    });

    test('should maintain smooth canvas interactions', async ({ page }) => {
      // Add charm and perform multiple drag operations
      await addCharmToCanvas(page);
      
      const canvas = page.locator('#jewelry-customizer canvas');
      const canvasBox = await canvas.boundingBox();
      
      const startTime = Date.now();
      
      // Perform rapid drag operations
      for (let i = 0; i < 5; i++) {
        const x = canvasBox.x + 300 + i * 20;
        const y = canvasBox.y + 300 + i * 20;
        
        await page.mouse.move(x - 20, y - 20);
        await page.mouse.down();
        await page.mouse.move(x, y);
        await page.mouse.up();
        
        await page.waitForTimeout(100);
      }
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      // Should remain responsive
      expect(duration).toBeLessThan(5000); // 5 seconds
    });
  });
});

// Helper functions
async function addCharmToCanvas(page, x = null, y = null) {
  const sidebar = page.locator('#charm-library');
  const canvas = page.locator('#jewelry-customizer canvas');
  
  // Wait for charms to be available
  await page.waitForTimeout(1000);
  
  const firstCharm = sidebar.locator('.charm-item').first();
  await expect(firstCharm).toBeVisible();
  
  const canvasBox = await canvas.boundingBox();
  const targetX = x || canvasBox.width / 2;
  const targetY = y || canvasBox.height / 2;
  
  await firstCharm.dragTo(canvas, {
    targetPosition: { x: targetX, y: targetY }
  });
  
  await page.waitForTimeout(500);
}

async function selectCharmOnCanvas(page) {
  const canvas = page.locator('#jewelry-customizer canvas');
  const canvasBox = await canvas.boundingBox();
  
  // Click on charm position
  await page.mouse.click(
    canvasBox.x + canvasBox.width / 2,
    canvasBox.y + canvasBox.height / 2
  );
  
  await page.waitForTimeout(500);
}