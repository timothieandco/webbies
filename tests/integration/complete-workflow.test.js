/**
 * Complete Workflow Integration Tests
 * Tests end-to-end user journeys and complete system integration
 */

import { InventoryAPI } from '../../src/js/services/InventoryAPI.js';
import { InventoryService } from '../../src/js/services/InventoryService.js';
import { JewelryCustomizer } from '../../src/js/core/JewelryCustomizer.js';

// Mock DOM environment for Konva
global.document = {
  createElement: jest.fn(() => ({
    getContext: jest.fn(() => ({
      fillRect: jest.fn(),
      clearRect: jest.fn(),
      getImageData: jest.fn(),
      putImageData: jest.fn(),
      createImageData: jest.fn(),
      setTransform: jest.fn(),
      drawImage: jest.fn(),
      save: jest.fn(),
      restore: jest.fn(),
      beginPath: jest.fn(),
      closePath: jest.fn(),
      stroke: jest.fn(),
      fill: jest.fn(),
      arc: jest.fn(),
      lineTo: jest.fn(),
      moveTo: jest.fn()
    })),
    style: {},
    addEventListener: jest.fn(),
    setAttribute: jest.fn(),
    getAttribute: jest.fn(() => ''),
    getBoundingClientRect: jest.fn(() => ({
      width: 800,
      height: 600,
      top: 0,
      left: 0
    }))
  })),
  getElementById: jest.fn(() => null),
  body: { appendChild: jest.fn() }
};

global.window = {
  devicePixelRatio: 1,
  addEventListener: jest.fn()
};

// Mock image loading
global.Image = class {
  constructor() {
    this.src = '';
    this.onload = null;
    this.onerror = null;
    setTimeout(() => {
      if (this.onload) this.onload();
    }, 10);
  }
};

describe('Complete Workflow Integration Tests', () => {
  let api;
  let inventoryService;
  let customizer;
  let testUser;

  beforeAll(async () => {
    // Skip if no test environment
    if (!process.env.TEST_SUPABASE_URL) {
      console.warn('⚠️ Skipping workflow tests: TEST_SUPABASE_URL not set');
      return;
    }

    // Initialize services
    api = new InventoryAPI(
      process.env.TEST_SUPABASE_URL,
      process.env.TEST_SUPABASE_ANON_KEY
    );
    inventoryService = new InventoryService(api);
    
    // Create test user
    const testEmail = `workflow-test-${Date.now()}@example.com`;
    const testPassword = 'WorkflowTest123!';
    
    try {
      const signUpResult = await api.signUp(testEmail, testPassword, {
        name: 'Workflow Test User'
      });
      
      const signInResult = await api.signIn(testEmail, testPassword);
      testUser = signInResult.user;
      
      console.log('✅ Test user created for workflow tests');
    } catch (error) {
      console.warn('⚠️ Could not create test user:', error.message);
    }
  });

  beforeEach(() => {
    // Reset any mocks
    jest.clearAllMocks();
  });

  describe('User Registration and Authentication Flow', () => {
    test('complete user onboarding journey', async () => {
      if (!api) return;

      // Step 1: User visits site and signs up
      const userEmail = `onboarding-${Date.now()}@example.com`;
      const userPassword = 'OnboardingTest123!';
      
      const signUpResult = await api.signUp(userEmail, userPassword, {
        name: 'New User',
        preferences: {
          newsletter: true,
          notifications: false
        }
      });
      
      expect(signUpResult.user).toBeDefined();
      expect(signUpResult.user.email).toBe(userEmail);
      
      // Step 2: User confirms email and signs in
      const signInResult = await api.signIn(userEmail, userPassword);
      
      expect(signInResult.user).toBeDefined();
      expect(signInResult.session).toBeDefined();
      expect(signInResult.session.access_token).toBeDefined();
      
      // Step 3: User updates profile
      const profileUpdate = {
        name: 'Updated Name',
        bio: 'Jewelry enthusiast',
        preferences: {
          theme: 'dark',
          language: 'en'
        }
      };
      
      const updatedProfile = await api.updateProfile(profileUpdate);
      expect(updatedProfile.name).toBe(profileUpdate.name);
      
      // Step 4: User signs out
      await expect(api.signOut()).resolves.not.toThrow();
    });

    test('authentication error recovery flow', async () => {
      if (!api) return;

      // Step 1: User tries to sign in with wrong password
      const result1 = await api.signIn('valid@email.com', 'wrongpassword').catch(e => e);
      expect(result1).toBeInstanceOf(Error);
      
      // Step 2: User requests password reset
      await expect(api.resetPassword('valid@email.com')).resolves.not.toThrow();
      
      // Step 3: User signs in with correct credentials after reset
      const userEmail = `recovery-${Date.now()}@example.com`;
      const userPassword = 'RecoveryTest123!';
      
      await api.signUp(userEmail, userPassword);
      const signInResult = await api.signIn(userEmail, userPassword);
      
      expect(signInResult.user).toBeDefined();
    });
  });

  describe('Inventory Discovery and Browsing Flow', () => {
    test('complete inventory browsing journey', async () => {
      if (!inventoryService) return;

      // Step 1: User loads initial inventory
      const inventory = await inventoryService.loadInventory();
      expect(inventory).toBeInstanceOf(Array);
      
      // Step 2: User explores categories
      const categories = await inventoryService.getCategories();
      expect(categories).toBeInstanceOf(Array);
      expect(categories.length).toBeGreaterThan(0);
      
      // Step 3: User filters by category
      if (categories.length > 0) {
        const firstCategory = categories[0].name;
        const filteredItems = await inventoryService.getItemsByCategory(firstCategory);
        expect(filteredItems).toBeInstanceOf(Array);
        
        if (filteredItems.length > 0) {
          filteredItems.forEach(item => {
            expect(item.category.toLowerCase()).toBe(firstCategory.toLowerCase());
          });
        }
      }
      
      // Step 4: User searches for specific items
      const searchResults = await inventoryService.search('heart');
      expect(searchResults).toBeInstanceOf(Array);
      
      // Step 5: User views item details
      if (inventory.length > 0) {
        const itemId = inventory[0].id;
        const itemDetails = await api.getInventoryItem(itemId);
        expect(itemDetails).toBeDefined();
        expect(itemDetails.id).toBe(itemId);
      }
    });

    test('inventory performance with large datasets', async () => {
      if (!inventoryService) return;

      const startTime = Date.now();
      
      // Load large dataset
      const inventory = await inventoryService.loadInventory();
      const loadTime = Date.now() - startTime;
      
      // Should load within reasonable time (5 seconds)
      expect(loadTime).toBeLessThan(5000);
      expect(inventory).toBeInstanceOf(Array);
      
      // Test search performance
      const searchStart = Date.now();
      const searchResults = await inventoryService.search('charm');
      const searchTime = Date.now() - searchStart;
      
      // Search should be fast (2 seconds)
      expect(searchTime).toBeLessThan(2000);
      expect(searchResults).toBeInstanceOf(Array);
    });
  });

  describe('Design Creation and Customization Flow', () => {
    test('complete jewelry design workflow', async () => {
      if (!inventoryService) return;

      // Step 1: Initialize customizer
      customizer = new JewelryCustomizer('test-canvas', {
        width: 800,
        height: 600,
        maxCharms: 10
      });
      
      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Step 2: Load available charms
      const charms = await inventoryService.getItemsByCategory('charms');
      expect(charms).toBeInstanceOf(Array);
      
      // Step 3: Add charms to design
      if (charms.length > 0) {
        const charm1 = charms[0];
        await customizer.addCharm(charm1, { x: 100, y: 100 });
        
        if (charms.length > 1) {
          const charm2 = charms[1];
          await customizer.addCharm(charm2, { x: 200, y: 150 });
        }
        
        // Verify charms were added
        const charmCount = customizer.charmManager.getCharmCount();
        expect(charmCount).toBeGreaterThan(0);
      }
      
      // Step 4: Customize design (move, resize, etc.)
      const designData = customizer.getDesignData();
      expect(designData).toBeDefined();
      expect(designData.charms).toBeInstanceOf(Array);
      
      // Step 5: Save design
      if (testUser && api) {
        const designMetadata = {
          title: 'My Custom Jewelry Design',
          description: 'A beautiful custom piece',
          is_public: false
        };
        
        const savedDesign = await api.saveDesign({
          ...designMetadata,
          design_data: designData
        });
        
        expect(savedDesign).toBeDefined();
        expect(savedDesign.id).toBeDefined();
        expect(savedDesign.title).toBe(designMetadata.title);
      }
    });

    test('design validation and error handling', async () => {
      if (!customizer) {
        customizer = new JewelryCustomizer('test-canvas', {
          width: 800,
          height: 600,
          maxCharms: 5
        });
      }
      
      // Test adding invalid charm
      const invalidCharm = { id: 'invalid', name: 'Invalid Charm' };
      const result = await customizer.addCharm(invalidCharm, { x: 100, y: 100 }).catch(e => e);
      
      // Should handle gracefully
      expect(result).toBeDefined();
      
      // Test exceeding max charms
      const validCharm = {
        id: 'valid-charm',
        name: 'Valid Charm',
        imageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
      };
      
      // Add maximum number of charms
      for (let i = 0; i < 6; i++) {
        await customizer.addCharm({
          ...validCharm,
          id: `charm-${i}`
        }, { x: 100 + i * 50, y: 100 });
      }
      
      // Should not exceed maximum
      const finalCount = customizer.charmManager.getCharmCount();
      expect(finalCount).toBeLessThanOrEqual(5);
    });
  });

  describe('Design Export and Sharing Flow', () => {
    test('complete export workflow', async () => {
      if (!customizer) {
        customizer = new JewelryCustomizer('test-canvas', {
          width: 800,
          height: 600
        });
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      // Step 1: Create a design with some content
      const testCharm = {
        id: 'export-test-charm',
        name: 'Export Test Charm',
        imageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
      };
      
      await customizer.addCharm(testCharm, { x: 400, y: 300 });
      
      // Step 2: Export in different formats
      const pngExport = await customizer.exportDesign({
        format: 'PNG',
        width: 1200,
        height: 900,
        quality: 1.0
      });
      
      expect(pngExport).toBeDefined();
      expect(pngExport.dataURL).toMatch(/^data:image\/png;base64,/);
      expect(pngExport.width).toBe(1200);
      expect(pngExport.height).toBe(900);
      
      const jpegExport = await customizer.exportDesign({
        format: 'JPEG',
        width: 800,
        height: 600,
        quality: 0.8
      });
      
      expect(jpegExport).toBeDefined();
      expect(jpegExport.dataURL).toMatch(/^data:image\/jpeg;base64,/);
      
      // Step 3: Export with metadata
      const exportWithMeta = await customizer.exportDesign({
        format: 'PNG',
        width: 800,
        height: 600,
        includeMetadata: true,
        watermark: 'Timothie & Co'
      });
      
      expect(exportWithMeta).toBeDefined();
      expect(exportWithMeta.metadata).toBeDefined();
    });

    test('export performance and quality validation', async () => {
      if (!customizer) return;
      
      // Test large export
      const startTime = Date.now();
      const largeExport = await customizer.exportDesign({
        format: 'PNG',
        width: 3000,
        height: 2250,
        quality: 1.0
      });
      const exportTime = Date.now() - startTime;
      
      // Should complete within reasonable time (10 seconds)
      expect(exportTime).toBeLessThan(10000);
      expect(largeExport).toBeDefined();
      expect(largeExport.fileSize).toBeDefined();
      
      // Validate export quality
      expect(largeExport.width).toBe(3000);
      expect(largeExport.height).toBe(2250);
      expect(largeExport.dataURL.length).toBeGreaterThan(1000);
    });
  });

  describe('Data Persistence and Synchronization Flow', () => {
    test('complete data sync workflow', async () => {
      if (!api || !testUser) return;

      // Step 1: Create and save design
      const designData = {
        title: 'Sync Test Design',
        description: 'Testing data synchronization',
        design_data: {
          necklace: { id: 'chain-1', name: 'Test Chain' },
          charms: [
            { id: 'charm-1', x: 100, y: 100, title: 'Charm 1' },
            { id: 'charm-2', x: 200, y: 150, title: 'Charm 2' }
          ]
        },
        is_public: false
      };
      
      const savedDesign = await api.saveDesign(designData);
      expect(savedDesign).toBeDefined();
      
      // Step 2: Retrieve and verify
      const retrievedDesign = await api.getDesign(savedDesign.id);
      expect(retrievedDesign).toBeDefined();
      expect(retrievedDesign.title).toBe(designData.title);
      expect(retrievedDesign.design_data).toEqual(designData.design_data);
      
      // Step 3: Update design
      const updatedData = {
        title: 'Updated Sync Test Design',
        design_data: {
          ...designData.design_data,
          charms: [
            ...designData.design_data.charms,
            { id: 'charm-3', x: 300, y: 200, title: 'Charm 3' }
          ]
        }
      };
      
      const updatedDesign = await api.updateDesign(savedDesign.id, updatedData);
      expect(updatedDesign.title).toBe(updatedData.title);
      expect(updatedDesign.design_data.charms).toHaveLength(3);
      
      // Step 4: Test concurrent access
      const concurrentUpdate1 = api.updateDesign(savedDesign.id, {
        title: 'Concurrent Update 1'
      });
      
      const concurrentUpdate2 = api.updateDesign(savedDesign.id, {
        title: 'Concurrent Update 2'
      });
      
      const [result1, result2] = await Promise.allSettled([
        concurrentUpdate1,
        concurrentUpdate2
      ]);
      
      // At least one should succeed
      const successful = [result1, result2].filter(r => r.status === 'fulfilled');
      expect(successful.length).toBeGreaterThan(0);
    });

    test('offline/online synchronization simulation', async () => {
      if (!api || !inventoryService) return;

      // Step 1: Load data while "online"
      const onlineInventory = await inventoryService.loadInventory();
      expect(onlineInventory).toBeInstanceOf(Array);
      
      // Step 2: Simulate going offline (mock fetch to fail)
      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockRejectedValue(new Error('Network unavailable'));
      
      // Step 3: Try to load data while "offline"
      const offlineResult = await inventoryService.loadInventory().catch(e => e);
      expect(offlineResult).toBeInstanceOf(Error);
      
      // Step 4: Restore "online" status
      global.fetch = originalFetch;
      
      // Step 5: Verify data sync after coming back online
      const resyncedInventory = await inventoryService.loadInventory();
      expect(resyncedInventory).toBeInstanceOf(Array);
    });
  });

  describe('Error Recovery and User Experience Flow', () => {
    test('graceful degradation workflow', async () => {
      if (!inventoryService) return;

      // Simulate partial service failure
      const originalFetch = global.fetch;
      let requestCount = 0;
      
      global.fetch = jest.fn().mockImplementation((url) => {
        requestCount++;
        
        // Fail every 3rd request
        if (requestCount % 3 === 0) {
          return Promise.reject(new Error('Intermittent failure'));
        }
        
        return originalFetch(url);
      });
      
      // Try multiple operations
      const results = await Promise.allSettled([
        inventoryService.loadInventory(),
        inventoryService.getCategories(),
        inventoryService.search('heart'),
        inventoryService.loadInventory(),
        inventoryService.getCategories()
      ]);
      
      // Some should succeed, some might fail
      const successful = results.filter(r => r.status === 'fulfilled');
      const failed = results.filter(r => r.status === 'rejected');
      
      expect(successful.length).toBeGreaterThan(0);
      expect(successful.length + failed.length).toBe(5);
      
      // Restore original fetch
      global.fetch = originalFetch;
    });

    test('user notification and feedback flow', async () => {
      if (!customizer) return;

      let notificationReceived = null;
      let errorReceived = null;
      
      // Set up event listeners
      customizer.onNotification = (message) => {
        notificationReceived = message;
      };
      
      customizer.onError = (error) => {
        errorReceived = error;
      };
      
      // Trigger some operations that might generate notifications
      const testCharm = {
        id: 'notification-test',
        name: 'Notification Test Charm',
        imageUrl: 'data:image/png;base64,invalid'
      };
      
      await customizer.addCharm(testCharm, { x: 100, y: 100 }).catch(() => {});
      
      // Should have received some feedback
      expect(notificationReceived || errorReceived).toBeDefined();
    });
  });

  describe('Performance and Scalability Flow', () => {
    test('concurrent user operations simulation', async () => {
      if (!api || !inventoryService) return;

      // Simulate multiple users performing operations simultaneously
      const userOperations = Array.from({ length: 10 }, async (_, index) => {
        try {
          // Each "user" performs a series of operations
          const inventory = await inventoryService.loadInventory();
          const categories = await inventoryService.getCategories();
          const searchResults = await inventoryService.search(`item-${index}`);
          
          return {
            userId: index,
            inventory: inventory.length,
            categories: categories.length,
            searchResults: searchResults.length,
            success: true
          };
        } catch (error) {
          return {
            userId: index,
            error: error.message,
            success: false
          };
        }
      });
      
      const results = await Promise.all(userOperations);
      
      // Most operations should succeed
      const successful = results.filter(r => r.success);
      expect(successful.length).toBeGreaterThan(7); // At least 70% success rate
      
      // All successful operations should return valid data
      successful.forEach(result => {
        expect(result.inventory).toBeGreaterThanOrEqual(0);
        expect(result.categories).toBeGreaterThanOrEqual(0);
        expect(result.searchResults).toBeGreaterThanOrEqual(0);
      });
    });

    test('memory usage and cleanup validation', async () => {
      if (!customizer) return;

      const initialMemory = process.memoryUsage?.()?.heapUsed || 0;
      
      // Perform memory-intensive operations
      for (let i = 0; i < 100; i++) {
        const charm = {
          id: `memory-test-${i}`,
          name: `Memory Test Charm ${i}`,
          imageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
        };
        
        await customizer.addCharm(charm, { x: Math.random() * 800, y: Math.random() * 600 });
        
        // Periodically clear some charms to test cleanup
        if (i % 20 === 0) {
          customizer.clearAllCharms();
        }
      }
      
      // Force cleanup
      customizer.clearAllCharms();
      
      // Allow time for garbage collection
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const finalMemory = process.memoryUsage?.()?.heapUsed || 0;
      
      // Memory should not have grown excessively (less than 50MB increase)
      const memoryIncrease = finalMemory - initialMemory;
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });
  });

  afterAll(async () => {
    // Cleanup test data
    if (api && testUser) {
      try {
        // Delete test user designs
        const designs = await api.getUserDesigns();
        for (const design of designs) {
          await api.deleteDesign(design.id);
        }
        
        // Sign out
        await api.signOut();
        
        console.log('✅ Workflow test cleanup completed');
      } catch (error) {
        console.warn('⚠️ Cleanup error:', error.message);
      }
    }
    
    // Cleanup customizer
    if (customizer && customizer.destroy) {
      customizer.destroy();
    }
  });
});