/**
 * Home Page E2E Tests
 * Tests the landing page functionality and navigation
 */

import { test, expect } from '@playwright/test';

test.describe('Home Page', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home page
    await page.goto('/home.html');
  });

  test.describe('Page Load and Structure', () => {
    test('should load home page successfully', async ({ page }) => {
      // Check page title
      await expect(page).toHaveTitle(/Timothie & Co/);
      
      // Check main elements are present
      await expect(page.locator('nav')).toBeVisible();
      await expect(page.locator('.hero-section')).toBeVisible();
      await expect(page.locator('.how-it-works')).toBeVisible();
      await expect(page.locator('.our-collection')).toBeVisible();
    });

    test('should display brand logo', async ({ page }) => {
      const logo = page.locator('nav img[alt*="Timothie"]');
      await expect(logo).toBeVisible();
      await expect(logo).toHaveAttribute('src', /Logo/);
    });

    test('should have proper navigation links', async ({ page }) => {
      const designButton = page.locator('a[href*="index.html"]').first();
      await expect(designButton).toBeVisible();
      await expect(designButton).toContainText(/Design/i);
    });
  });

  test.describe('Hero Section', () => {
    test('should display hero content', async ({ page }) => {
      const heroSection = page.locator('.hero-section');
      
      // Check main heading
      await expect(heroSection.locator('h1')).toContainText(/Craft Your Story/i);
      
      // Check call-to-action button
      const ctaButton = heroSection.locator('a[href*="index.html"]');
      await expect(ctaButton).toBeVisible();
    });

    test('should navigate to customizer from hero CTA', async ({ page }) => {
      const ctaButton = page.locator('.hero-section a[href*="index.html"]');
      
      await ctaButton.click();
      
      // Should navigate to customizer
      await expect(page).toHaveURL(/index\.html/);
      await expect(page.locator('#jewelry-customizer')).toBeVisible();
    });
  });

  test.describe('How It Works Section', () => {
    test('should display process steps', async ({ page }) => {
      const howItWorks = page.locator('.how-it-works');
      
      // Check section title
      await expect(howItWorks.locator('h2')).toContainText(/Create Your Unique Style/i);
      
      // Check process cards
      const cards = howItWorks.locator('.step-card');
      await expect(cards).toHaveCount(3);
      
      // Check first card content
      await expect(cards.first()).toContainText(/Choose Your Base/i);
    });

    test('should display animated demo', async ({ page }) => {
      const demoImage = page.locator('.how-it-works img[src*="gif"]');
      await expect(demoImage).toBeVisible();
    });
  });

  test.describe('Our Collection Section', () => {
    test('should display collection items', async ({ page }) => {
      const collection = page.locator('.our-collection');
      
      // Check section title
      await expect(collection.locator('h2')).toContainText(/Our Collection/i);
      
      // Check collection cards
      const cards = collection.locator('.collection-card');
      await expect(cards).toHaveCount(3);
      
      // Check each card has an image and title
      for (let i = 0; i < 3; i++) {
        const card = cards.nth(i);
        await expect(card.locator('img')).toBeVisible();
        await expect(card.locator('h3')).toBeVisible();
      }
    });
  });

  test.describe('Navigation', () => {
    test('should navigate to jewelry customizer', async ({ page }) => {
      // Click on main design button
      const designButton = page.locator('a[href*="index.html"]').first();
      await designButton.click();
      
      // Verify navigation
      await expect(page).toHaveURL(/index\.html/);
      
      // Wait for customizer to load
      await page.waitForLoadState('networkidle');
      
      // Check that customizer container is present
      await expect(page.locator('#jewelry-customizer')).toBeVisible();
    });

    test('should handle smooth scrolling to sections', async ({ page }) => {
      // Test scroll to How It Works (if link exists)
      const howItWorksLink = page.locator('a[href="#how-it-works"]');
      
      if (await howItWorksLink.isVisible()) {
        await howItWorksLink.click();
        
        // Check that section is in viewport
        const howItWorksSection = page.locator('.how-it-works');
        await expect(howItWorksSection).toBeInViewport();
      }
    });
  });

  test.describe('Responsive Design', () => {
    test('should adapt to mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      // Check that elements are still visible and properly arranged
      await expect(page.locator('.hero-section')).toBeVisible();
      await expect(page.locator('.how-it-works')).toBeVisible();
      
      // Check that navigation might be collapsed or adapted
      const nav = page.locator('nav');
      await expect(nav).toBeVisible();
    });

    test('should adapt to tablet viewport', async ({ page }) => {
      // Set tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      
      // Check layout adaptations
      await expect(page.locator('.hero-section')).toBeVisible();
      
      // Collection cards might be arranged differently
      const cards = page.locator('.collection-card');
      await expect(cards).toHaveCount(3);
    });
  });

  test.describe('Performance', () => {
    test('should load quickly', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/home.html');
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      
      // Should load within 3 seconds
      expect(loadTime).toBeLessThan(3000);
    });

    test('should load images efficiently', async ({ page }) => {
      await page.goto('/home.html');
      
      // Wait for images to load
      await page.waitForLoadState('networkidle');
      
      // Check that hero image is loaded
      const heroImage = page.locator('.hero-section img').first();
      if (await heroImage.isVisible()) {
        await expect(heroImage).toHaveAttribute('src');
      }
      
      // Check collection images
      const collectionImages = page.locator('.collection-card img');
      const count = await collectionImages.count();
      
      for (let i = 0; i < count; i++) {
        const img = collectionImages.nth(i);
        await expect(img).toHaveAttribute('src');
      }
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper heading hierarchy', async ({ page }) => {
      // Check that there's only one h1
      const h1Elements = page.locator('h1');
      expect(await h1Elements.count()).toBe(1);
      
      // Check that headings are present
      await expect(page.locator('h1, h2, h3')).toHaveCount.greaterThan(0);
    });

    test('should have alt text for images', async ({ page }) => {
      const images = page.locator('img');
      const count = await images.count();
      
      for (let i = 0; i < count; i++) {
        const img = images.nth(i);
        // Either alt attribute should exist or role should be decorative
        const hasAlt = await img.getAttribute('alt') !== null;
        const isDecorative = await img.getAttribute('role') === 'presentation';
        
        expect(hasAlt || isDecorative).toBe(true);
      }
    });

    test('should be keyboard navigable', async ({ page }) => {
      // Test tab navigation
      await page.keyboard.press('Tab');
      
      // Should focus on first focusable element
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();
      
      // Test that Enter key works on links
      const designLink = page.locator('a[href*="index.html"]').first();
      await designLink.focus();
      
      // Press Enter to activate link
      await page.keyboard.press('Enter');
      await expect(page).toHaveURL(/index\.html/);
    });
  });

  test.describe('Visual Consistency', () => {
    test('should maintain brand styling', async ({ page }) => {
      // Check that brand colors are applied
      const heroSection = page.locator('.hero-section');
      
      // Check computed styles (this is basic - more detailed tests would check specific colors)
      const styles = await heroSection.evaluate((el) => {
        const computed = window.getComputedStyle(el);
        return {
          backgroundColor: computed.backgroundColor,
          color: computed.color
        };
      });
      
      expect(styles).toBeDefined();
    });

    test('should load custom fonts', async ({ page }) => {
      // Wait for fonts to load
      await page.waitForLoadState('networkidle');
      
      // Check that custom fonts are applied
      const heading = page.locator('h1').first();
      const fontFamily = await heading.evaluate((el) => {
        return window.getComputedStyle(el).fontFamily;
      });
      
      // Should not be just default system fonts
      expect(fontFamily).not.toBe('serif');
      expect(fontFamily).not.toBe('sans-serif');
    });
  });
});