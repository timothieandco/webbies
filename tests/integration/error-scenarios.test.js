/**
 * Real-World Error Scenarios Integration Tests
 * Tests how the application handles various failure modes and edge cases
 */

import { InventoryAPI } from '../../src/js/services/InventoryAPI.js';
import { InventoryService } from '../../src/js/services/InventoryService.js';
import inventoryImporter from '../../src/js/utils/InventoryImporter.js';

// Mock fetch for network simulation
const originalFetch = global.fetch;

describe('Real-World Error Scenarios', () => {
  let api;
  let inventoryService;

  beforeAll(() => {
    // Use test configuration
    api = new InventoryAPI(
      process.env.TEST_SUPABASE_URL || 'https://test-project.supabase.co',
      process.env.TEST_SUPABASE_ANON_KEY || 'test-anon-key'
    );
    inventoryService = new InventoryService(api);
  });

  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = originalFetch;
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe('Network Connectivity Issues', () => {
    test('should handle complete network failure', async () => {
      // Mock complete network failure
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      const result = await inventoryService.getCharmInventory().catch(error => error);
      
      expect(result).toBeInstanceOf(Error);
      expect(result.message).toContain('Network error');
    });

    test('should handle slow network with timeout', async () => {
      // Mock slow network response
      global.fetch = jest.fn().mockImplementation(() => 
        new Promise(resolve => 
          setTimeout(() => resolve({
            ok: true,
            json: () => Promise.resolve({ data: [] })
          }), 10000) // 10 second delay
        )
      );

      const startTime = Date.now();
      const result = await inventoryService.getCharmInventory().catch(error => error);
      const duration = Date.now() - startTime;

      // Should timeout before 10 seconds
      expect(duration).toBeLessThan(10000);
      expect(result).toBeInstanceOf(Error);
    });

    test('should handle intermittent connection drops', async () => {
      let callCount = 0;
      global.fetch = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount <= 2) {
          return Promise.reject(new Error('Connection refused'));
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ data: [], count: 0 })
        });
      });

      // Should eventually succeed after retries
      const result = await inventoryService.getCharmInventory();
      expect(result).toBeInstanceOf(Array);
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    test('should handle DNS resolution failures', async () => {
      global.fetch = jest.fn().mockRejectedValue(new Error('ENOTFOUND'));

      const result = await inventoryService.searchInventoryInventory('test').catch(error => error);
      
      expect(result).toBeInstanceOf(Error);
      expect(result.message).toContain('ENOTFOUND');
    });
  });

  describe('Server Response Errors', () => {
    test('should handle 500 internal server error', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.resolve({ 
          error: { message: 'Database connection failed' }
        })
      });

      const result = await inventoryService.getCharmInventory().catch(error => error);
      
      expect(result).toBeInstanceOf(Error);
      expect(result.message).toContain('500');
    });

    test('should handle 503 service unavailable', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
        json: () => Promise.resolve({ 
          error: { message: 'Service temporarily unavailable' }
        })
      });

      const result = await inventoryService.getCategories().catch(error => error);
      
      expect(result).toBeInstanceOf(Error);
      expect(result.message).toContain('503');
    });

    test('should handle 429 rate limiting', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        headers: new Map([['retry-after', '60']]),
        json: () => Promise.resolve({ 
          error: { message: 'Rate limit exceeded' }
        })
      });

      const result = await inventoryService.searchInventory('popular item').catch(error => error);
      
      expect(result).toBeInstanceOf(Error);
      expect(result.message).toContain('429');
    });

    test('should handle malformed JSON responses', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.reject(new Error('Unexpected end of JSON input'))
      });

      const result = await inventoryService.getCharmInventory().catch(error => error);
      
      expect(result).toBeInstanceOf(Error);
      expect(result.message).toContain('JSON');
    });

    test('should handle empty or null responses', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(null)
      });

      const result = await inventoryService.getCharmInventory();
      
      // Should handle gracefully and return empty array
      expect(result).toBeInstanceOf(Array);
      expect(result).toHaveLength(0);
    });
  });

  describe('Authentication and Authorization Failures', () => {
    test('should handle expired tokens', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: () => Promise.resolve({ 
          error: { message: 'JWT expired' }
        })
      });

      const result = await api.getUserDesigns().catch(error => error);
      
      expect(result).toBeInstanceOf(Error);
      expect(result.message).toContain('401');
    });

    test('should handle invalid credentials', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: () => Promise.resolve({ 
          error: { message: 'Invalid credentials' }
        })
      });

      const result = await api.signIn('invalid@email.com', 'wrongpassword').catch(error => error);
      
      expect(result).toBeInstanceOf(Error);
      expect(result.message).toContain('Invalid credentials');
    });

    test('should handle permission denied errors', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 403,
        statusText: 'Forbidden',
        json: () => Promise.resolve({ 
          error: { message: 'Insufficient permissions' }
        })
      });

      const result = await api.createInventoryItem({}).catch(error => error);
      
      expect(result).toBeInstanceOf(Error);
      expect(result.message).toContain('403');
    });
  });

  describe('Data Integrity Issues', () => {
    test('should handle corrupted inventory data', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          data: [
            { id: '1', title: 'Valid Item', price: 10, category: 'charms' },
            { id: null, title: null, price: 'invalid', category: undefined },
            { /* empty object */ },
            { id: '2', price: -5 }, // negative price
            { id: '3', title: 'No Category', price: 15 } // missing category
          ],
          count: 5
        })
      });

      const result = await inventoryService.getCharmInventory();
      
      // Should filter out invalid items and return only valid ones
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeLessThan(5);
      
      // All returned items should be valid
      result.forEach(item => {
        expect(item.id).toBeDefined();
        expect(item.title).toBeDefined();
        expect(typeof item.price).toBe('number');
        expect(item.price).toBeGreaterThanOrEqual(0);
        expect(item.category).toBeDefined();
      });
    });

    test('should handle missing required fields', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          data: [
            { title: 'No ID Item', price: 10, category: 'charms' },
            { id: '1', price: 15, category: 'necklaces' }, // missing title
            { id: '2', title: 'No Price', category: 'charms' } // missing price
          ],
          count: 3
        })
      });

      const result = await inventoryService.getCharmInventory();
      
      // Should handle missing fields gracefully
      expect(result).toBeInstanceOf(Array);
      
      result.forEach(item => {
        // Items should have sensible defaults or be filtered out
        if (item.id) {
          expect(item.title || item.name).toBeDefined();
          expect(typeof (item.price || 0)).toBe('number');
        }
      });
    });

    test('should handle duplicate inventory items', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          data: [
            { id: '1', title: 'Duplicate Item', price: 10, category: 'charms' },
            { id: '1', title: 'Duplicate Item', price: 10, category: 'charms' },
            { id: '2', title: 'Unique Item', price: 15, category: 'necklaces' }
          ],
          count: 3
        })
      });

      const result = await inventoryService.getCharmInventory();
      
      // Should deduplicate items
      const ids = result.map(item => item.id);
      const uniqueIds = [...new Set(ids)];
      expect(ids.length).toBe(uniqueIds.length);
    });

    test('should handle extremely large datasets', async () => {
      // Mock a response with 10,000 items
      const largeDataset = Array.from({ length: 10000 }, (_, i) => ({
        id: `item-${i}`,
        title: `Item ${i}`,
        price: Math.random() * 100,
        category: i % 2 === 0 ? 'charms' : 'necklaces'
      }));

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          data: largeDataset,
          count: 10000
        })
      });

      const startTime = Date.now();
      const result = await inventoryService.getCharmInventory();
      const duration = Date.now() - startTime;

      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBe(10000);
      // Should complete within reasonable time (2 seconds)
      expect(duration).toBeLessThan(2000);
    });
  });

  describe('Database Transaction Failures', () => {
    test('should handle concurrent modification errors', async () => {
      let callCount = 0;
      global.fetch = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({
            ok: false,
            status: 409,
            statusText: 'Conflict',
            json: () => Promise.resolve({ 
              error: { message: 'The resource was modified by another user' }
            })
          });
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ data: { id: '1', title: 'Updated' } })
        });
      });

      const result = await api.updateDesign('design-1', { title: 'New Title' }).catch(error => error);
      
      expect(result).toBeInstanceOf(Error);
      expect(result.message).toContain('409');
    });

    test('should handle deadlock situations', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.resolve({ 
          error: { 
            message: 'deadlock detected',
            code: 'PGSQL_DEADLOCK'
          }
        })
      });

      const result = await inventoryImporter.importAliExpressData([
        { id: '1', title: 'Item 1', price: 10 }
      ]).catch(error => error);
      
      expect(result).toBeInstanceOf(Error);
      expect(result.message).toContain('deadlock');
    });

    test('should handle connection pool exhaustion', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
        json: () => Promise.resolve({ 
          error: { 
            message: 'remaining connection slots are reserved',
            code: 'PGSQL_CONNECTION_LIMIT'
          }
        })
      });

      const promises = Array.from({ length: 100 }, () => 
        inventoryService.loadInventory().catch(error => error)
      );

      const results = await Promise.all(promises);
      
      // Some should fail with connection limit error
      const connectionErrors = results.filter(result => 
        result instanceof Error && result.message.includes('connection')
      );
      expect(connectionErrors.length).toBeGreaterThan(0);
    });
  });

  describe('Memory and Performance Issues', () => {
    test('should handle memory exhaustion gracefully', async () => {
      // Mock a response that would cause memory issues
      const mockLargeString = 'x'.repeat(100 * 1024 * 1024); // 100MB string
      
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          data: [{
            id: '1',
            title: 'Large Item',
            description: mockLargeString,
            price: 10
          }]
        })
      });

      const result = await inventoryService.getCharmInventory().catch(error => error);
      
      // Should either handle gracefully or fail with appropriate error
      if (result instanceof Error) {
        expect(result.message).toMatch(/memory|size|limit/i);
      } else {
        expect(result).toBeInstanceOf(Array);
      }
    });

    test('should handle CPU-intensive operations with timeout', async () => {
      // Mock response that requires heavy processing
      const heavyData = Array.from({ length: 50000 }, (_, i) => ({
        id: `item-${i}`,
        title: `Complex Item ${i}`,
        description: `Very long description ${'x'.repeat(1000)}`,
        tags: Array.from({ length: 100 }, (_, j) => `tag-${j}`),
        price: Math.random() * 1000
      }));

      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          data: heavyData,
          count: 50000
        })
      });

      const startTime = Date.now();
      const result = await inventoryService.searchInventory('Complex').catch(error => error);
      const duration = Date.now() - startTime;

      // Should complete within reasonable time or fail with timeout
      if (result instanceof Error) {
        expect(result.message).toMatch(/timeout|time|limit/i);
      } else {
        expect(duration).toBeLessThan(5000); // 5 second limit
      }
    });
  });

  describe('Third-Party Service Failures', () => {
    test('should handle image service unavailability', async () => {
      global.fetch = jest.fn().mockImplementation((url) => {
        if (url.includes('image') || url.includes('cdn')) {
          return Promise.reject(new Error('Image service unavailable'));
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            data: [{
              id: '1',
              title: 'Item with broken image',
              image_url: 'https://broken-cdn.com/image.jpg',
              price: 10
            }]
          })
        });
      });

      const result = await inventoryService.getCharmInventory();
      
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
      
      // Items should have fallback images or handle missing images gracefully
      result.forEach(item => {
        if (item.image_url) {
          expect(typeof item.image_url).toBe('string');
        }
      });
    });

    test('should handle email service failures during user registration', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 502,
        statusText: 'Bad Gateway',
        json: () => Promise.resolve({ 
          error: { 
            message: 'Email service unavailable',
            code: 'EMAIL_SERVICE_DOWN'
          }
        })
      });

      const result = await api.signUp('test@example.com', 'password123').catch(error => error);
      
      expect(result).toBeInstanceOf(Error);
      expect(result.message).toContain('Email service');
    });
  });

  describe('Edge Cases and Boundary Conditions', () => {
    test('should handle empty search queries', async () => {
      const result = await inventoryService.searchInventory('');
      
      expect(result).toBeInstanceOf(Array);
      // Empty search should return all items or no items (both are valid)
    });

    test('should handle very long search queries', async () => {
      const longQuery = 'a'.repeat(10000);
      
      const result = await inventoryService.searchInventory(longQuery).catch(error => error);
      
      // Should either handle gracefully or fail with appropriate error
      if (result instanceof Error) {
        expect(result.message).toMatch(/query|length|limit/i);
      } else {
        expect(result).toBeInstanceOf(Array);
      }
    });

    test('should handle special characters in search', async () => {
      const specialQuery = "'; DROP TABLE inventory; --";
      
      const result = await inventoryService.searchInventory(specialQuery).catch(error => error);
      
      // Should handle SQL injection attempts safely
      expect(result).toBeInstanceOf(Array);
    });

    test('should handle unicode and emoji in data', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          data: [{
            id: '1',
            title: '❤️ Heart Charm 💕',
            description: 'Beautiful charm with émojis and ùnicøde',
            price: 15,
            category: 'charms'
          }]
        })
      });

      const result = await inventoryService.getCharmInventory();
      
      expect(result).toBeInstanceOf(Array);
      expect(result[0].title).toContain('❤️');
      expect(result[0].description).toContain('émojis');
    });

    test('should handle extreme price values', async () => {
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          data: [
            { id: '1', title: 'Free Item', price: 0, category: 'charms' },
            { id: '2', title: 'Expensive Item', price: 999999.99, category: 'necklaces' },
            { id: '3', title: 'Micro Price', price: 0.01, category: 'charms' }
          ]
        })
      });

      const result = await inventoryService.getCharmInventory();
      
      expect(result).toBeInstanceOf(Array);
      result.forEach(item => {
        expect(item.price).toBeGreaterThanOrEqual(0);
        expect(typeof item.price).toBe('number');
        expect(isFinite(item.price)).toBe(true);
      });
    });
  });

  describe('Recovery and Resilience Testing', () => {
    test('should recover from temporary service outage', async () => {
      let callCount = 0;
      global.fetch = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount <= 3) {
          return Promise.reject(new Error('Service temporarily unavailable'));
        }
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({ data: [], count: 0 })
        });
      });

      // Should eventually succeed after service recovers
      const result = await inventoryService.getCharmInventory();
      expect(result).toBeInstanceOf(Array);
      expect(callCount).toBeGreaterThan(3);
    });

    test('should maintain data consistency during partial failures', async () => {
      let requestCount = 0;
      global.fetch = jest.fn().mockImplementation(() => {
        requestCount++;
        
        // Simulate partial success - some requests succeed, others fail
        if (requestCount % 3 === 0) {
          return Promise.reject(new Error('Partial failure'));
        }
        
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            data: [{ id: `item-${requestCount}`, title: `Item ${requestCount}`, price: 10 }],
            count: 1
          })
        });
      });

      // Make multiple concurrent requests
      const promises = Array.from({ length: 9 }, () => 
        inventoryService.loadInventory().catch(() => [])
      );

      const results = await Promise.all(promises);
      
      // Should have a mix of successful and failed requests
      const successful = results.filter(r => r.length > 0);
      const failed = results.filter(r => r.length === 0);
      
      expect(successful.length).toBeGreaterThan(0);
      expect(failed.length).toBeGreaterThan(0);
    });

    test('should handle graceful degradation', async () => {
      // Mock a scenario where advanced features fail but basic ones work
      global.fetch = jest.fn().mockImplementation((url) => {
        if (url.includes('search') || url.includes('categories')) {
          return Promise.reject(new Error('Advanced features unavailable'));
        }
        
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve({
            data: [{ id: '1', title: 'Basic Item', price: 10, category: 'general' }],
            count: 1
          })
        });
      });

      // Basic inventory loading should work
      const inventory = await inventoryService.getCharmInventory();
      expect(inventory).toBeInstanceOf(Array);
      expect(inventory.length).toBeGreaterThan(0);

      // Advanced features should fail gracefully
      const searchResult = await inventoryService.searchInventory('test').catch(() => []);
      expect(searchResult).toBeInstanceOf(Array);
      expect(searchResult.length).toBe(0);

      const categories = await inventoryService.getCategories().catch(() => []);
      expect(categories).toBeInstanceOf(Array);
    });
  });
});