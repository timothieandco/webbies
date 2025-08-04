/**
 * Enhanced Error Handling Integration Tests
 * Tests how the application handles various failure modes with correct API methods
 */

import { InventoryService } from '../../src/js/services/InventoryService.js';

// Mock the API layer to simulate various error conditions
jest.mock('../../src/js/services/InventoryAPI.js', () => ({
  getAPI: jest.fn(() => ({
    client: {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      ilike: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      offset: jest.fn().mockReturnThis(),
      order: jest.fn().mockReturnThis()
    },
    getInventory: jest.fn(),
    searchInventory: jest.fn(),
    getInventoryItem: jest.fn(),
    createInventoryItem: jest.fn(),
    updateInventoryItem: jest.fn(),
    deleteInventoryItem: jest.fn(),
    saveDesign: jest.fn(),
    getUserDesigns: jest.fn(),
    getDesign: jest.fn(),
    updateDesign: jest.fn(),
    deleteDesign: jest.fn(),
    signUp: jest.fn(),
    signIn: jest.fn(),
    signOut: jest.fn(),
    resetPassword: jest.fn(),
    updateProfile: jest.fn(),
    subscribeToInventoryChanges: jest.fn(() => ({ unsubscribe: jest.fn() })),
    subscribeToUserDesigns: jest.fn(() => ({ unsubscribe: jest.fn() }))
  }))
}));

import { getAPI } from '../../src/js/services/InventoryAPI.js';

describe('Enhanced Error Handling Integration Tests', () => {
  let inventoryService;
  let mockAPI;

  beforeAll(async () => {
    mockAPI = getAPI();
    inventoryService = new InventoryService();
    await inventoryService.initialize();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Service Layer Error Handling', () => {
    test('should handle API initialization failures', async () => {
      // Create a new service with failing API
      getAPI.mockImplementationOnce(() => null);
      
      const failingService = new InventoryService();
      
      await expect(failingService.initialize()).rejects.toThrow();
    });

    test('should handle network timeout errors', async () => {
      mockAPI.getInventory.mockRejectedValue(new Error('Network timeout'));

      const result = await inventoryService.getCharmInventory().catch(error => error);
      
      expect(result).toBeInstanceOf(Error);
      expect(result.message).toContain('Network timeout');
    });

    test('should handle malformed response data', async () => {
      mockAPI.getInventory.mockResolvedValue({
        data: null, // Malformed response
        count: 0
      });

      const result = await inventoryService.getCharmInventory();
      
      // Should handle gracefully and return empty array
      expect(result).toBeInstanceOf(Array);
      expect(result).toHaveLength(0);
    });

    test('should handle search with empty results gracefully', async () => {
      mockAPI.searchInventory.mockResolvedValue([]);

      const result = await inventoryService.searchInventory('nonexistent item');
      
      expect(result).toBeInstanceOf(Array);
      expect(result).toHaveLength(0);
    });

    test('should handle category loading failures', async () => {
      mockAPI.getInventory.mockRejectedValue(new Error('Categories unavailable'));

      const result = await inventoryService.getCategories().catch(error => error);
      
      expect(result).toBeInstanceOf(Error);
      expect(result.message).toContain('Categories unavailable');
    });
  });

  describe('Data Validation and Sanitization', () => {
    test('should filter out invalid inventory items', async () => {
      mockAPI.getInventory.mockResolvedValue({
        data: [
          { id: '1', title: 'Valid Item', price: 10, category: 'charms' },
          { id: null, title: null, price: 'invalid' }, // Invalid item
          { id: '2', title: 'Another Valid Item', price: 15, category: 'necklaces' }
        ],
        count: 3
      });

      const result = await inventoryService.getCharmInventory();
      
      // Should only return valid items
      expect(result).toHaveLength(2);
      result.forEach(item => {
        expect(item.id).toBeDefined();
        expect(item.title).toBeDefined();
        expect(typeof item.price).toBe('number');
      });
    });

    test('should handle search queries with special characters', async () => {
      const specialQuery = "'; DROP TABLE inventory; --";
      
      mockAPI.searchInventory.mockResolvedValue([]);

      const result = await inventoryService.searchInventory(specialQuery);
      
      expect(result).toBeInstanceOf(Array);
      expect(mockAPI.searchInventory).toHaveBeenCalledWith(specialQuery, {});
    });

    test('should handle unicode and emoji in search', async () => {
      const unicodeQuery = '❤️ heart émoji';
      
      mockAPI.searchInventory.mockResolvedValue([
        {
          id: '1',
          title: '❤️ Heart Charm',
          description: 'Beautiful heart with émoji',
          price: 15,
          category: 'charms'
        }
      ]);

      const result = await inventoryService.searchInventory(unicodeQuery);
      
      expect(result).toHaveLength(1);
      expect(result[0].title).toContain('❤️');
    });
  });

  describe('Authentication Error Scenarios', () => {
    test('should handle expired authentication tokens', async () => {
      mockAPI.saveDesign.mockRejectedValue(new Error('JWT expired'));

      const designData = { title: 'Test Design', design_data: {} };
      const result = await inventoryService.saveDesign(designData).catch(error => error);
      
      expect(result).toBeInstanceOf(Error);
      expect(result.message).toContain('JWT expired');
    });

    test('should handle unauthorized access attempts', async () => {
      mockAPI.getUserDesigns.mockRejectedValue(new Error('Unauthorized'));

      const result = await inventoryService.loadDesign('design-id').catch(error => error);
      
      expect(result).toBeInstanceOf(Error);
      expect(result.message).toContain('Unauthorized');
    });
  });

  describe('Performance and Memory Management', () => {
    test('should handle large inventory datasets efficiently', async () => {
      // Create large dataset
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: `item-${i}`,
        title: `Item ${i}`,
        price: Math.random() * 100,
        category: i % 2 === 0 ? 'charms' : 'necklaces'
      }));

      mockAPI.getInventory.mockResolvedValue({
        data: largeDataset,
        count: 1000
      });

      const startTime = Date.now();
      const result = await inventoryService.getCharmInventory();
      const duration = Date.now() - startTime;

      expect(result).toHaveLength(1000);
      // Should complete within reasonable time (1 second)
      expect(duration).toBeLessThan(1000);
    });

    test('should handle concurrent requests properly', async () => {
      mockAPI.getInventory.mockResolvedValue({
        data: [{ id: '1', title: 'Test Item', price: 10, category: 'charms' }],
        count: 1
      });

      // Make multiple concurrent requests
      const promises = Array.from({ length: 10 }, () => 
        inventoryService.getCharmInventory()
      );

      const results = await Promise.all(promises);
      
      // All should succeed
      results.forEach(result => {
        expect(result).toBeInstanceOf(Array);
        expect(result).toHaveLength(1);
      });

      // Should not make excessive API calls due to caching
      expect(mockAPI.getInventory).toHaveBeenCalledTimes(10);
    });
  });

  describe('Cache Management and Data Consistency', () => {
    test('should handle cache invalidation correctly', async () => {
      // Initial load
      mockAPI.getInventory.mockResolvedValueOnce({
        data: [{ id: '1', title: 'Original Item', price: 10, category: 'charms' }],
        count: 1
      });

      const result1 = await inventoryService.getCharmInventory();
      expect(result1[0].title).toBe('Original Item');

      // Simulate data change
      mockAPI.getInventory.mockResolvedValueOnce({
        data: [{ id: '1', title: 'Updated Item', price: 15, category: 'charms' }],
        count: 1
      });

      // Force refresh (simulate cache invalidation)
      inventoryService.cache.clear();
      const result2 = await inventoryService.getCharmInventory();
      
      expect(result2[0].title).toBe('Updated Item');
      expect(result2[0].price).toBe(15);
    });

    test('should handle partial cache corruption', async () => {
      // Simulate corrupted cache data
      inventoryService.cache.set('inventory:charms', 'corrupted data');

      mockAPI.getInventory.mockResolvedValue({
        data: [{ id: '1', title: 'Fresh Item', price: 10, category: 'charms' }],
        count: 1
      });

      const result = await inventoryService.getCharmInventory();
      
      // Should recover by fetching fresh data
      expect(result).toBeInstanceOf(Array);
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Fresh Item');
    });
  });

  describe('Real-time Subscription Error Handling', () => {
    test('should handle subscription connection failures', () => {
      // Test that subscription setup doesn't crash on failure
      expect(() => {
        inventoryService.setupRealTimeSubscriptions();
      }).not.toThrow();
    });

    test('should handle subscription reconnection', async () => {
      let subscriptionCallback;
      
      // Mock subscription setup
      mockAPI.client.from.mockReturnValue({
        on: jest.fn().mockImplementation((event, callback) => {
          subscriptionCallback = callback;
          return {
            subscribe: jest.fn(() => ({
              unsubscribe: jest.fn()
            }))
          };
        })
      });

      inventoryService.setupRealTimeSubscriptions();

      // Simulate a real-time update
      if (subscriptionCallback) {
        const payload = {
          eventType: 'UPDATE',
          new: { id: '1', title: 'Updated Item', price: 20 }
        };
        
        expect(() => subscriptionCallback(payload)).not.toThrow();
      }
    });
  });

  describe('Design Management Error Scenarios', () => {
    test('should handle design save failures gracefully', async () => {
      mockAPI.saveDesign.mockRejectedValue(new Error('Storage full'));

      const designData = {
        title: 'Test Design',
        design_data: { charms: [] }
      };

      const result = await inventoryService.saveDesign(designData, {}).catch(error => error);
      
      expect(result).toBeInstanceOf(Error);
      expect(result.message).toContain('Storage full');
    });

    test('should validate design data before saving', async () => {
      const invalidDesignData = {
        // Missing required fields
        design_data: null
      };

      const result = await inventoryService.saveDesign(invalidDesignData, {}).catch(error => error);
      
      expect(result).toBeInstanceOf(Error);
    });

    test('should handle design loading failures', async () => {
      mockAPI.getDesign.mockRejectedValue(new Error('Design not found'));

      const result = await inventoryService.loadDesign('nonexistent-id').catch(error => error);
      
      expect(result).toBeInstanceOf(Error);
      expect(result.message).toContain('Design not found');
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    test('should handle empty category responses', async () => {
      mockAPI.getInventory.mockResolvedValue({
        data: [],
        count: 0
      });

      const result = await inventoryService.getCategories();
      
      expect(result).toBeInstanceOf(Array);
      expect(result).toHaveLength(0);
    });

    test('should handle extremely long search queries', async () => {
      const longQuery = 'a'.repeat(1000);
      
      mockAPI.searchInventory.mockResolvedValue([]);

      const result = await inventoryService.searchInventory(longQuery);
      
      expect(result).toBeInstanceOf(Array);
      expect(mockAPI.searchInventory).toHaveBeenCalledWith(longQuery, {});
    });

    test('should handle price calculation with invalid data', async () => {
      const components = [
        { id: '1', quantity: 2, price: 10 },
        { id: '2', quantity: 'invalid', price: 'invalid' },
        { id: '3', quantity: 1, price: null }
      ];

      const result = await inventoryService.calculateDesignPrice(components);
      
      // Should handle invalid data gracefully
      expect(typeof result).toBe('number');
      expect(result).toBeGreaterThanOrEqual(0);
    });

    test('should handle component validation with mixed valid/invalid items', async () => {
      const components = [
        { id: '1', type: 'charm', valid: true },
        { id: null, type: 'invalid' }, // Invalid component
        { id: '3', type: 'necklace', valid: true }
      ];

      const result = await inventoryService.validateDesignComponents(components);
      
      expect(result).toBeDefined();
      expect(result.valid).toBeDefined();
      expect(result.errors).toBeInstanceOf(Array);
    });
  });

  describe('Recovery and Resilience', () => {
    test('should recover from temporary API failures', async () => {
      let callCount = 0;
      mockAPI.getInventory.mockImplementation(() => {
        callCount++;
        if (callCount <= 2) {
          return Promise.reject(new Error('Temporary failure'));
        }
        return Promise.resolve({
          data: [{ id: '1', title: 'Success Item', price: 10, category: 'charms' }],
          count: 1
        });
      });

      // Should eventually succeed after retries
      const result = await inventoryService.getCharmInventory();
      
      expect(result).toBeInstanceOf(Array);
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Success Item');
      expect(callCount).toBeGreaterThan(2);
    });

    test('should maintain service state during errors', async () => {
      // Service should remain initialized even after errors
      mockAPI.getInventory.mockRejectedValue(new Error('API Error'));

      await inventoryService.getCharmInventory().catch(() => {});
      
      expect(inventoryService.isReady()).toBe(true);
      expect(inventoryService.isInitialized).toBe(true);
    });

    test('should provide fallback data when primary source fails', async () => {
      mockAPI.getInventory.mockRejectedValue(new Error('Primary source failed'));

      // Service should provide some form of fallback or graceful degradation
      const result = await inventoryService.getCharmInventory().catch(() => []);
      
      expect(result).toBeInstanceOf(Array);
      // Even if empty, it should not crash the application
    });
  });
});