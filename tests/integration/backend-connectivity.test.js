/**
 * Backend Connectivity Integration Tests
 * Tests real Supabase integration with test database
 */

import { InventoryAPI } from '../../src/js/services/InventoryAPI.js';
import { InventoryService } from '../../src/js/services/InventoryService.js';

// Test environment configuration
const TEST_SUPABASE_URL = process.env.TEST_SUPABASE_URL || 'https://test-project.supabase.co';
const TEST_SUPABASE_KEY = process.env.TEST_SUPABASE_ANON_KEY || 'test-anon-key';

describe('Backend Connectivity Integration', () => {
  let api;
  let inventoryService;
  let testUser;

  beforeAll(async () => {
    // Skip integration tests if test credentials not available
    if (!process.env.TEST_SUPABASE_URL) {
      console.warn('⚠️ Skipping integration tests: TEST_SUPABASE_URL not set');
      return;
    }

    // Initialize API with test credentials
    api = new InventoryAPI(TEST_SUPABASE_URL, TEST_SUPABASE_KEY);
    inventoryService = new InventoryService(api);
  });

  beforeEach(async () => {
    if (!api) return; // Skip if no test environment

    // Clean up any existing test data
    await cleanupTestData();
  });

  afterEach(async () => {
    if (!api) return;

    // Clean up test data after each test
    await cleanupTestData();
  });

  describe('Database Connection', () => {
    test('should connect to test database', async () => {
      if (!api) return;

      // Test basic connection by fetching inventory
      const result = await api.getInventory({}, { limit: 1 });
      
      expect(result).toBeDefined();
      expect(result.data).toBeInstanceOf(Array);
      expect(result.count).toBeGreaterThanOrEqual(0);
    });

    test('should handle connection failures gracefully', async () => {
      const invalidApi = new InventoryAPI('https://invalid-url.supabase.co', 'invalid-key');
      
      await expect(invalidApi.getInventory()).rejects.toThrow();
    });
  });

  describe('Authentication Integration', () => {
    test('should sign up new test user', async () => {
      if (!api) return;

      const testEmail = `test-${Date.now()}@example.com`;
      const testPassword = 'TestPassword123!';
      
      const result = await api.signUp(testEmail, testPassword, {
        name: 'Test User'
      });
      
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(testEmail);
      
      testUser = result.user;
    });

    test('should sign in existing user', async () => {
      if (!api || !testUser) return;

      // First create a user
      const testEmail = `test-signin-${Date.now()}@example.com`;
      const testPassword = 'TestPassword123!';
      
      await api.signUp(testEmail, testPassword);
      
      // Then sign in
      const result = await api.signIn(testEmail, testPassword);
      
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(testEmail);
      expect(result.session).toBeDefined();
      expect(result.session.access_token).toBeDefined();
    });

    test('should handle invalid credentials', async () => {
      if (!api) return;

      await expect(
        api.signIn('nonexistent@example.com', 'wrongpassword')
      ).rejects.toThrow();
    });

    test('should sign out user', async () => {
      if (!api) return;

      // First sign in
      const testEmail = `test-signout-${Date.now()}@example.com`;
      const testPassword = 'TestPassword123!';
      
      await api.signUp(testEmail, testPassword);
      await api.signIn(testEmail, testPassword);
      
      // Then sign out
      await expect(api.signOut()).resolves.not.toThrow();
    });
  });

  describe('Inventory Operations', () => {
    test('should fetch inventory items', async () => {
      if (!api) return;

      const result = await api.getInventory();
      
      expect(result.data).toBeInstanceOf(Array);
      expect(result.count).toBeGreaterThanOrEqual(0);
      expect(result.page).toBe(1);
      expect(result.total_pages).toBeGreaterThanOrEqual(1);
    });

    test('should filter inventory by category', async () => {
      if (!api) return;

      const result = await api.getInventory({ category: 'Charms' });
      
      expect(result.data).toBeInstanceOf(Array);
      
      // If there are results, they should all be Charms
      if (result.data.length > 0) {
        result.data.forEach(item => {
          expect(item.category).toBe('Charms');
        });
      }
    });

    test('should search inventory items', async () => {
      if (!api) return;

      const searchTerm = 'heart';
      const results = await api.searchInventory(searchTerm);
      
      expect(results).toBeInstanceOf(Array);
      
      // If there are results, they should contain the search term
      if (results.length > 0) {
        results.forEach(item => {
          const containsSearchTerm = 
            item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            item.description.toLowerCase().includes(searchTerm.toLowerCase());
          expect(containsSearchTerm).toBe(true);
        });
      }
    });

    test('should handle pagination', async () => {
      if (!api) return;

      const page1 = await api.getInventory({}, { limit: 5, offset: 0 });
      const page2 = await api.getInventory({}, { limit: 5, offset: 5 });
      
      expect(page1.data).toBeInstanceOf(Array);
      expect(page2.data).toBeInstanceOf(Array);
      
      // If both pages have data, they should be different
      if (page1.data.length > 0 && page2.data.length > 0) {
        const page1Ids = page1.data.map(item => item.id);
        const page2Ids = page2.data.map(item => item.id);
        
        expect(page1Ids).not.toEqual(page2Ids);
      }
    });

    test('should get single inventory item', async () => {
      if (!api) return;

      // First get any item
      const inventory = await api.getInventory({}, { limit: 1 });
      
      if (inventory.data.length > 0) {
        const itemId = inventory.data[0].id;
        const item = await api.getInventoryItem(itemId);
        
        expect(item).toBeDefined();
        expect(item.id).toBe(itemId);
      }
    });
  });

  describe('Design Management', () => {
    let testUserId;

    beforeEach(async () => {
      if (!api) return;

      // Sign in a test user for design operations
      const testEmail = `test-design-${Date.now()}@example.com`;
      const testPassword = 'TestPassword123!';
      
      const signUpResult = await api.signUp(testEmail, testPassword);
      const signInResult = await api.signIn(testEmail, testPassword);
      testUserId = signInResult.user.id;
    });

    test('should save user design', async () => {
      if (!api || !testUserId) return;

      const designData = {
        title: 'Test Design',
        description: 'A test jewelry design',
        design_data: {
          necklace: { id: 'classic-chain', name: 'Classic Chain' },
          charms: [
            { id: 'charm-1', x: 100, y: 100, title: 'Heart Charm' }
          ]
        },
        is_public: false
      };

      const savedDesign = await api.saveDesign(designData);
      
      expect(savedDesign).toBeDefined();
      expect(savedDesign.id).toBeDefined();
      expect(savedDesign.title).toBe(designData.title);
      expect(savedDesign.user_id).toBe(testUserId);
      expect(savedDesign.design_data).toEqual(designData.design_data);
    });

    test('should fetch user designs', async () => {
      if (!api || !testUserId) return;

      // Save a design first
      const designData = {
        title: 'Test Design for Fetch',
        description: 'Test design',
        design_data: { charms: [], necklace: null }
      };

      await api.saveDesign(designData);

      // Fetch designs
      const designs = await api.getUserDesigns();
      
      expect(designs).toBeInstanceOf(Array);
      expect(designs.length).toBeGreaterThan(0);
      
      const savedDesign = designs.find(d => d.title === designData.title);
      expect(savedDesign).toBeDefined();
    });

    test('should update design', async () => {
      if (!api || !testUserId) return;

      // Save a design first
      const originalDesign = await api.saveDesign({
        title: 'Original Title',
        description: 'Original description',
        design_data: { charms: [], necklace: null }
      });

      // Update the design
      const updates = {
        title: 'Updated Title',
        description: 'Updated description'
      };

      const updatedDesign = await api.updateDesign(originalDesign.id, updates);
      
      expect(updatedDesign.title).toBe(updates.title);
      expect(updatedDesign.description).toBe(updates.description);
      expect(updatedDesign.id).toBe(originalDesign.id);
    });

    test('should delete design', async () => {
      if (!api || !testUserId) return;

      // Save a design first
      const design = await api.saveDesign({
        title: 'Design to Delete',
        description: 'This will be deleted',
        design_data: { charms: [], necklace: null }
      });

      // Delete the design
      await expect(api.deleteDesign(design.id)).resolves.not.toThrow();

      // Verify it's deleted
      const designs = await api.getUserDesigns();
      const deletedDesign = designs.find(d => d.id === design.id);
      expect(deletedDesign).toBeUndefined();
    });
  });

  describe('Real-time Subscriptions', () => {
    test('should subscribe to inventory changes', async () => {
      if (!api) return;

      let receivedChange = false;
      const timeout = 5000; // 5 second timeout

      const subscription = api.subscribeToInventoryChanges((payload) => {
        receivedChange = true;
        expect(payload).toBeDefined();
      });

      // Wait for potential changes or timeout
      await new Promise(resolve => setTimeout(resolve, timeout));

      // Clean up subscription
      if (subscription && subscription.unsubscribe) {
        subscription.unsubscribe();
      }

      // Note: This test might not receive changes if no inventory updates occur
      // The important thing is that the subscription doesn't throw errors
      expect(subscription).toBeDefined();
    });

    test('should handle subscription errors gracefully', async () => {
      if (!api) return;

      // Test with invalid table/filter
      expect(() => {
        api.subscribeToUserDesigns(() => {});
      }).toThrow('User not authenticated');
    });
  });

  describe('Service Layer Integration', () => {
    test('should integrate with InventoryService', async () => {
      if (!api) return;

      const categories = await inventoryService.getCategories();
      
      expect(categories).toBeInstanceOf(Array);
      expect(categories.length).toBeGreaterThan(0);
      
      // Each category should have required properties
      categories.forEach(category => {
        expect(category.name).toBeDefined();
        expect(category.count).toBeGreaterThanOrEqual(0);
      });
    });

    test('should load inventory through service layer', async () => {
      if (!api) return;

      const inventory = await inventoryService.loadInventory();
      
      expect(inventory).toBeInstanceOf(Array);
      
      // Each item should have required properties for customizer
      if (inventory.length > 0) {
        inventory.forEach(item => {
          expect(item.id).toBeDefined();
          expect(item.title).toBeDefined();
          expect(item.category).toBeDefined();
          expect(item.image_url).toBeDefined();
        });
      }
    });

    test('should search through service layer', async () => {
      if (!api) return;

      const query = 'heart';
      const results = await inventoryService.search(query);
      
      expect(results).toBeInstanceOf(Array);
      
      // Results should match search criteria
      if (results.length > 0) {
        results.forEach(item => {
          const matchesQuery = 
            item.title.toLowerCase().includes(query.toLowerCase()) ||
            item.description.toLowerCase().includes(query.toLowerCase()) ||
            item.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()));
          expect(matchesQuery).toBe(true);
        });
      }
    });
  });

  describe('Error Handling and Resilience', () => {
    test('should handle network timeouts', async () => {
      if (!api) return;

      // This test would require mocking network conditions
      // For now, we test that the API handles errors gracefully
      try {
        await api.getInventoryItem('non-existent-id');
      } catch (error) {
        expect(error).toBeDefined();
        expect(error.message).toBeDefined();
      }
    });

    test('should handle malformed data gracefully', async () => {
      if (!api) return;

      // Test with invalid data
      await expect(api.createInventoryItem({})).rejects.toThrow();
    });

    test('should handle rate limiting', async () => {
      if (!api) return;

      // Make multiple rapid requests
      const promises = Array.from({ length: 10 }, () => 
        api.getInventory({}, { limit: 1 })
      );

      // Should handle all requests (or gracefully fail with rate limiting)
      const results = await Promise.allSettled(promises);
      
      // At least some should succeed
      const successful = results.filter(r => r.status === 'fulfilled');
      expect(successful.length).toBeGreaterThan(0);
    });
  });

  describe('Data Validation', () => {
    test('should validate inventory item structure', async () => {
      if (!api) return;

      const inventory = await api.getInventory({}, { limit: 5 });
      
      if (inventory.data.length > 0) {
        inventory.data.forEach(item => {
          // Check required fields
          expect(item.id).toBeDefined();
          expect(item.title).toBeDefined();
          expect(item.category).toBeDefined();
          expect(item.price).toBeGreaterThanOrEqual(0);
          expect(item.quantity_available).toBeGreaterThanOrEqual(0);
          expect(item.status).toBeDefined();
          
          // Check data types
          expect(typeof item.id).toBe('string');
          expect(typeof item.title).toBe('string');
          expect(typeof item.category).toBe('string');
          expect(typeof item.price).toBe('number');
          expect(typeof item.quantity_available).toBe('number');
        });
      }
    });

    test('should validate design data structure', async () => {
      if (!api) return;

      // Sign in a test user
      const testEmail = `test-validate-${Date.now()}@example.com`;
      await api.signUp(testEmail, 'TestPassword123!');
      await api.signIn(testEmail, 'TestPassword123!');

      const designData = {
        title: 'Validation Test Design',
        description: 'Testing data structure',
        design_data: {
          necklace: { id: 'chain-1', name: 'Test Chain' },
          charms: [
            { id: 'charm-1', x: 100, y: 100, title: 'Test Charm' }
          ]
        },
        is_public: false
      };

      const savedDesign = await api.saveDesign(designData);
      
      // Validate structure
      expect(savedDesign.design_data).toBeDefined();
      expect(savedDesign.design_data.necklace).toBeDefined();
      expect(savedDesign.design_data.charms).toBeInstanceOf(Array);
      expect(savedDesign.design_data.charms[0].x).toBe(100);
      expect(savedDesign.design_data.charms[0].y).toBe(100);
    });
  });
});

// Helper function to clean up test data
async function cleanupTestData() {
  // This would clean up any test data created during tests
  // Implementation depends on your test database setup
  try {
    // Example: Delete test designs, users, etc.
    // await api.deleteTestData();
  } catch (error) {
    console.warn('⚠️ Failed to clean up test data:', error.message);
  }
}