/**
 * InventoryService Unit Tests
 * Tests business logic layer for inventory management and design integration
 */

import { InventoryService } from '../../../src/js/services/InventoryService.js';

// Mock InventoryAPI
const mockAPI = {
  getInventory: jest.fn(),
  searchInventory: jest.fn(),
  getInventoryItem: jest.fn(),
  updateInventoryItem: jest.fn(),
  saveDesign: jest.fn(),
  getDesign: jest.fn(),
  getCategoriesWithCounts: jest.fn(),
  getInventoryStats: jest.fn(),
  subscribeToInventoryChanges: jest.fn()
};

// Mock getAPI function
jest.mock('../../../src/js/services/InventoryAPI.js', () => ({
  getAPI: jest.fn(() => mockAPI)
}));

// Mock DOM methods
class MockCustomEvent {
  constructor(type, eventInitDict = {}) {
    this.type = type;
    this.detail = eventInitDict.detail;
    this.bubbles = eventInitDict.bubbles || false;
    this.cancelable = eventInitDict.cancelable || false;
    this.composed = eventInitDict.composed || false;
    this.target = null;
    this.currentTarget = null;
    this.eventPhase = 0;
    this.timestamp = Date.now();
  }
}

global.CustomEvent = MockCustomEvent;

global.document = {
  dispatchEvent: jest.fn((event) => {
    // Mock event dispatch - just return true to indicate success
    // Don't perform any validation since we're testing the service logic, not DOM events
    return true;
  }),
  querySelector: jest.fn(() => null)
};

// Mock constants
jest.mock('../../../src/js/config/supabase.js', () => ({
  STORAGE_KEYS: {},
  EVENTS: {
    DESIGN_SAVED: 'design-saved',
    INVENTORY_UPDATED: 'inventory-updated'
  },
  CSS_CLASSES: {
    UPDATED: 'updated'
  }
}));

// Mock data transformers
jest.mock('../../../src/js/types/inventory.js', () => ({
  CATEGORIES: {
    NECKLACES: 'necklaces',
    BRACELETS: 'bracelets',
    CHARMS: 'charms',
    KEYCHAINS: 'keychains',
    EARRINGS: 'earrings',
    ACCESSORIES: 'accessories',
    MATERIALS: 'materials'
  },
  STATUS: {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    DISCONTINUED: 'discontinued'
  },
  DataTransformers: {
    formatPrice: jest.fn((price, currency = 'USD') => `$${price.toFixed(2)}`),
    formatDate: jest.fn((date) => date)
  }
}));

describe('InventoryService', () => {
  let inventoryService;
  let CATEGORIES, STATUS;

  beforeAll(() => {
    // Get the mocked constants
    const mockModule = require('../../../src/js/types/inventory.js');
    CATEGORIES = mockModule.CATEGORIES;
    STATUS = mockModule.STATUS;
  });

  beforeEach(() => {
    // Create new instance for each test
    inventoryService = new InventoryService();
    
    // Reset all mocks
    jest.clearAllMocks();
    
    // Reset the getAPI mock
    const { getAPI } = require('../../../src/js/services/InventoryAPI.js');
    getAPI.mockImplementation(() => mockAPI);
    
    // Override document.dispatchEvent to avoid jsdom validation
    global.document.dispatchEvent = jest.fn(() => true);
    
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Initialization', () => {
    test('should initialize successfully', async () => {
      await inventoryService.initialize();
      
      expect(inventoryService.isInitialized).toBe(true);
      expect(inventoryService.api).toBe(mockAPI);
      expect(inventoryService.isReady()).toBeTruthy();
    });

    test('should handle initialization errors', async () => {
      const { getAPI } = require('../../../src/js/services/InventoryAPI.js');
      getAPI.mockImplementation(() => {
        throw new Error('API initialization failed');
      });

      await expect(inventoryService.initialize()).rejects.toThrow('API initialization failed');
      expect(inventoryService.isReady()).toBeFalsy();
    });

    test('should set up real-time subscriptions by default', async () => {
      await inventoryService.initialize();
      
      expect(mockAPI.subscribeToInventoryChanges).toHaveBeenCalled();
    });

    test('should skip real-time subscriptions when disabled', async () => {
      await inventoryService.initialize({ enableRealTime: false });
      
      expect(mockAPI.subscribeToInventoryChanges).not.toHaveBeenCalled();
    });
  });

  describe('Charm Inventory', () => {
    beforeEach(async () => {
      await inventoryService.initialize();
    });

    test('should get charm inventory for sidebar', async () => {
      const mockCharms = [
        {
          id: 'charm-1',
          title: 'Beautiful Heart Charm',
          image_url: 'heart.jpg',
          price: 15.99,
          currency: 'USD',
          category: CATEGORIES.CHARMS,
          quantity_available: 5,
          attributes: { material: 'silver' },
          tags: ['heart', 'love']
        },
        {
          id: 'charm-2',
          title: 'Star Charm with Sparkles',
          image_url: 'star.jpg',
          price: 12.50,
          currency: 'USD',
          category: CATEGORIES.CHARMS,
          quantity_available: 3,
          attributes: { material: 'gold' },
          tags: ['star', 'sparkle']
        }
      ];

      mockAPI.getInventory.mockResolvedValue({
        data: mockCharms,
        count: 2
      });

      const result = await inventoryService.getCharmInventory();

      expect(mockAPI.getInventory).toHaveBeenCalledWith({
        category: CATEGORIES.CHARMS,
        status: STATUS.ACTIVE,
        available_only: true
      });

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: 'charm-1',
        name: 'Beautiful Heart Charm',
        title: 'Beautiful Heart Charm',
        imageUrl: 'heart.jpg',
        price: '$15.99',
        priceValue: 15.99,
        category: CATEGORIES.CHARMS,
        tags: ['heart', 'love'],
        available: true,
        quantity: 5,
        attributes: { material: 'silver' },
        src: 'heart.jpg',
        alt: 'Beautiful Heart Charm'
      });
    });

    test('should handle charm inventory errors gracefully', async () => {
      mockAPI.getInventory.mockRejectedValue(new Error('Network error'));

      const result = await inventoryService.getCharmInventory();

      expect(result).toEqual([]);
    });

    test('should apply custom filters to charm inventory', async () => {
      mockAPI.getInventory.mockResolvedValue({ data: [], count: 0 });

      await inventoryService.getCharmInventory({ tags: ['heart'] });

      expect(mockAPI.getInventory).toHaveBeenCalledWith({
        category: CATEGORIES.CHARMS,
        status: STATUS.ACTIVE,
        available_only: true,
        tags: ['heart']
      });
    });
  });

  describe('Browse Inventory', () => {
    beforeEach(async () => {
      await inventoryService.initialize();
    });

    test('should get browse inventory with caching', async () => {
      const mockItems = [
        {
          id: 'item-1',
          title: 'Test Item',
          image_url: 'test.jpg',
          price: 10.00,
          currency: 'USD',
          quantity_available: 2,
          description: 'Test description',
          supplier_info: { store_name: 'Test Store' },
          updated_at: '2023-01-01',
          status: STATUS.ACTIVE,
          category: CATEGORIES.NECKLACES,
          attributes: {},
          tags: []
        }
      ];

      mockAPI.getInventory.mockResolvedValue({
        data: mockItems,
        count: 1,
        page: 1,
        total_pages: 1
      });

      const result = await inventoryService.getBrowseInventory();

      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toMatchObject({
        id: 'item-1',
        title: 'Test Item',
        description: 'Test description',
        supplier: 'Test Store',
        fullDetails: true
      });

      // Test caching - second call should not hit API
      await inventoryService.getBrowseInventory();
      expect(mockAPI.getInventory).toHaveBeenCalledTimes(1);
    });

    test('should respect cache expiry', async () => {
      mockAPI.getInventory.mockResolvedValue({
        data: [],
        count: 0,
        page: 1,
        total_pages: 1
      });

      // First call
      await inventoryService.getBrowseInventory();
      
      // Advance time past cache expiry (5 minutes)
      jest.advanceTimersByTime(301000);
      
      // Second call should hit API again
      await inventoryService.getBrowseInventory();
      
      expect(mockAPI.getInventory).toHaveBeenCalledTimes(2);
    });

    test('should handle browse inventory errors', async () => {
      mockAPI.getInventory.mockRejectedValue(new Error('API error'));

      await expect(inventoryService.getBrowseInventory()).rejects.toThrow('API error');
    });
  });

  describe('Search Functionality', () => {
    beforeEach(async () => {
      await inventoryService.initialize();
    });

    test('should search inventory items', async () => {
      const mockResults = [
        {
          id: 'search-1',
          title: 'Heart Pendant',
          image_url: 'heart.jpg',
          price: 25.00,
          currency: 'USD',
          quantity_available: 1,
          description: 'Beautiful heart pendant',
          category: CATEGORIES.NECKLACES,
          attributes: {},
          tags: ['heart'],
          updated_at: '2023-01-01',
          status: STATUS.ACTIVE
        }
      ];

      mockAPI.searchInventory.mockResolvedValue(mockResults);

      const result = await inventoryService.searchInventory('heart');

      expect(mockAPI.searchInventory).toHaveBeenCalledWith('heart', {});
      expect(result).toHaveLength(1);
      expect(result[0].title).toBe('Heart Pendant');
    });

    test('should return empty array for short queries', async () => {
      const result = await inventoryService.searchInventory('h');
      
      expect(result).toEqual([]);
      expect(mockAPI.searchInventory).not.toHaveBeenCalled();
    });

    test('should handle search errors gracefully', async () => {
      mockAPI.searchInventory.mockRejectedValue(new Error('Search failed'));

      const result = await inventoryService.searchInventory('heart');

      expect(result).toEqual([]);
    });

    test('should trim search queries', async () => {
      mockAPI.searchInventory.mockResolvedValue([]);

      await inventoryService.searchInventory('  heart  ');

      expect(mockAPI.searchInventory).toHaveBeenCalledWith('heart', {});
    });
  });

  describe('Item Details', () => {
    beforeEach(async () => {
      await inventoryService.initialize();
    });

    test('should get item details with customizer transformation', async () => {
      const mockItem = {
        id: 'detail-1',
        title: 'Detailed Charm',
        image_url: 'detail.jpg',
        price: 20.00,
        currency: 'USD',
        quantity_available: 3,
        description: 'Detailed description',
        category: CATEGORIES.CHARMS,
        attributes: {
          material: 'sterling silver',
          color: 'silver',
          weight: '2g',
          size: '15mm'
        },
        tags: ['detailed'],
        updated_at: '2023-01-01',
        status: STATUS.ACTIVE
      };

      mockAPI.getInventoryItem.mockResolvedValue(mockItem);

      const result = await inventoryService.getItemDetails('detail-1');

      expect(mockAPI.getInventoryItem).toHaveBeenCalledWith('detail-1');
      expect(result).toMatchObject({
        id: 'detail-1',
        title: 'Detailed Charm',
        dimensions: { raw: '15mm' },
        material: 'sterling silver',
        color: 'silver',
        weight: '2g'
      });
    });

    test('should handle item details errors', async () => {
      mockAPI.getInventoryItem.mockRejectedValue(new Error('Item not found'));

      await expect(inventoryService.getItemDetails('nonexistent')).rejects.toThrow('Item not found');
    });
  });

  describe('Item Reservation', () => {
    beforeEach(async () => {
      await inventoryService.initialize();
    });

    test('should reserve items successfully', async () => {
      const mockItem = {
        id: 'reserve-1',
        quantity_available: 5,
        quantity_reserved: 2,
        title: 'Reservable Item'
      };

      mockAPI.getInventoryItem.mockResolvedValue(mockItem);
      mockAPI.updateInventoryItem.mockResolvedValue({});

      const itemsToReserve = [
        { id: 'reserve-1', quantity: 2 }
      ];

      const result = await inventoryService.reserveItems(itemsToReserve);

      expect(result).toBe(true);
      expect(mockAPI.updateInventoryItem).toHaveBeenCalledWith('reserve-1', {
        quantity_available: 3,
        quantity_reserved: 4
      });
    });

    test('should handle insufficient quantity', async () => {
      const mockItem = {
        id: 'reserve-1',
        quantity_available: 1,
        quantity_reserved: 0,
        title: 'Limited Item'
      };

      mockAPI.getInventoryItem.mockResolvedValue(mockItem);

      const itemsToReserve = [
        { id: 'reserve-1', quantity: 5 }
      ];

      await expect(inventoryService.reserveItems(itemsToReserve)).rejects.toThrow('Insufficient quantity for Limited Item');
    });
  });

  describe('Data Transformation', () => {
    beforeEach(async () => {
      await inventoryService.initialize();
    });

    test('should transform item for sidebar', () => {
      const item = {
        id: 'transform-1',
        title: 'Very Long Item Title That Should Be Shortened',
        image_url: 'transform.jpg',
        price: 15.99,
        currency: 'USD',
        category: CATEGORIES.CHARMS,
        tags: ['transform'],
        quantity_available: 3,
        attributes: { material: 'gold' }
      };

      const result = inventoryService.transformForSidebar(item);

      expect(result).toMatchObject({
        id: 'transform-1',
        name: 'Very Long Item',
        title: 'Very Long Item Title That Should Be Shortened',
        imageUrl: 'transform.jpg',
        price: '$15.99',
        priceValue: 15.99,
        available: true,
        quantity: 3,
        src: 'transform.jpg',
        alt: 'Very Long Item Title That Should Be Shortened'
      });
    });

    test('should handle short names correctly', () => {
      const shortTitle = 'Short Name';
      const name = inventoryService.extractShortName(shortTitle);
      expect(name).toBe(shortTitle);
    });

    test('should extract dimensions from attributes', () => {
      const attributes = { size: '20mm x 15mm' };
      const dimensions = inventoryService.extractDimensions(attributes);
      expect(dimensions).toEqual({ raw: '20mm x 15mm' });
    });

    test('should extract material with fallbacks', () => {
      expect(inventoryService.extractMaterial({ material: 'gold' })).toBe('gold');
      expect(inventoryService.extractMaterial({ metal: 'silver' })).toBe('silver');
      expect(inventoryService.extractMaterial({})).toBe('Unknown');
    });

    test('should extract color with fallbacks', () => {
      expect(inventoryService.extractColor({ color: 'blue' })).toBe('blue');
      expect(inventoryService.extractColor({ finish: 'matte' })).toBe('matte');
      expect(inventoryService.extractColor({})).toBe('Default');
    });
  });

  describe('Design Management', () => {
    beforeEach(async () => {
      await inventoryService.initialize();
    });

    test('should save design with inventory references', async () => {
      const designData = {
        children: [
          {
            attrs: {
              inventoryId: 'charm-1',
              x: 100,
              y: 200,
              scaleX: 1.5,
              rotation: 45
            }
          }
        ]
      };

      const metadata = {
        name: 'Test Design',
        productId: 'product-1',
        isPublic: false
      };

      mockAPI.getInventoryItem.mockResolvedValue({ price: 15.99 });
      mockAPI.saveDesign.mockResolvedValue({
        id: 'design-1',
        name: 'Test Design'
      });

      const result = await inventoryService.saveDesign(designData, metadata);

      expect(mockAPI.saveDesign).toHaveBeenCalledWith({
        name: 'Test Design',
        product_id: 'product-1',
        design_data: {
          stage: designData,
          components: [
            {
              inventory_id: 'charm-1',
              position: { x: 100, y: 200 },
              scale: 1.5,
              rotation: 45,
              quantity: 1
            }
          ],
          canvas_settings: {}
        },
        thumbnail_url: undefined,
        total_price: 15.99,
        is_public: false
      });

      expect(result.id).toBe('design-1');
    });

    test('should load design with component validation', async () => {
      const mockDesign = {
        id: 'design-1',
        name: 'Test Design',
        design_data: {
          stage: { width: 800, height: 600 },
          components: [
            { inventory_id: 'charm-1', position: { x: 100, y: 100 } }
          ]
        },
        total_price: 15.99,
        updated_at: '2023-01-01'
      };

      mockAPI.getDesign.mockResolvedValue(mockDesign);
      mockAPI.getInventoryItem.mockResolvedValue({
        status: STATUS.ACTIVE,
        quantity_available: 1
      });

      const result = await inventoryService.loadDesign('design-1');

      expect(result).toMatchObject({
        stage: { width: 800, height: 600 },
        components: [
          { inventory_id: 'charm-1', position: { x: 100, y: 100 } }
        ],
        metadata: {
          id: 'design-1',
          name: 'Test Design',
          totalPrice: 15.99
        }
      });
    });

    test('should filter out unavailable components when loading design', async () => {
      const mockDesign = {
        id: 'design-1',
        name: 'Test Design',
        design_data: {
          components: [
            { inventory_id: 'available-charm' },
            { inventory_id: 'unavailable-charm' }
          ]
        }
      };

      mockAPI.getDesign.mockResolvedValue(mockDesign);
      mockAPI.getInventoryItem
        .mockResolvedValueOnce({ status: STATUS.ACTIVE, quantity_available: 1 })
        .mockRejectedValueOnce(new Error('Not found'));

      const result = await inventoryService.loadDesign('design-1');

      expect(result.components).toHaveLength(1);
      expect(result.components[0].inventory_id).toBe('available-charm');
    });
  });

  describe('Categories and Statistics', () => {
    beforeEach(async () => {
      await inventoryService.initialize();
    });

    test('should get categories with caching', async () => {
      const mockCategories = [
        { name: CATEGORIES.CHARMS, count: 25 },
        { name: CATEGORIES.NECKLACES, count: 15 }
      ];

      mockAPI.getCategoriesWithCounts.mockResolvedValue(mockCategories);

      const result = await inventoryService.getCategories();

      expect(result).toEqual(mockCategories);

      // Test caching
      await inventoryService.getCategories();
      expect(mockAPI.getCategoriesWithCounts).toHaveBeenCalledTimes(1);
    });

    test('should return default categories on error', async () => {
      mockAPI.getCategoriesWithCounts.mockRejectedValue(new Error('API error'));

      const result = await inventoryService.getCategories();

      expect(result).toEqual(
        Object.values(CATEGORIES).map(cat => ({ name: cat, count: 0 }))
      );
    });

    test('should get inventory statistics', async () => {
      const mockStats = {
        total_items: 100,
        total_available: 85,
        categories: 6
      };

      mockAPI.getInventoryStats.mockResolvedValue(mockStats);

      const result = await inventoryService.getInventoryStats();

      expect(result).toEqual(mockStats);
    });

    test('should handle statistics errors gracefully', async () => {
      mockAPI.getInventoryStats.mockRejectedValue(new Error('Stats error'));

      const result = await inventoryService.getInventoryStats();

      expect(result).toEqual({});
    });
  });

  describe('Real-time Updates', () => {
    beforeEach(async () => {
      await inventoryService.initialize();
    });

    test('should handle inventory change events', () => {
      const payload = {
        eventType: 'UPDATE',
        new: { id: 'item-1', quantity_available: 5 },
        old: { id: 'item-1', quantity_available: 3 }
      };

      // Set up cache to test clearing
      inventoryService.cache.set('browse_test', { data: [], timestamp: Date.now() });
      inventoryService.cache.set('categories_test', { data: [], timestamp: Date.now() });

      inventoryService.handleInventoryChange(payload);

      // Cache should be cleared
      expect(inventoryService.cache.has('browse_test')).toBe(false);
      expect(inventoryService.cache.has('categories_test')).toBe(false);

      // Events should be emitted
      expect(global.document.dispatchEvent).toHaveBeenCalled();
    });
  });

  describe('Event System', () => {
    beforeEach(async () => {
      await inventoryService.initialize();
    });

    test('should subscribe and unsubscribe to events', () => {
      const callback = jest.fn();
      const unsubscribe = inventoryService.subscribe('test-event', callback);

      // Emit event
      inventoryService.emitEvent('test-event', { data: 'test' });

      expect(callback).toHaveBeenCalledWith({ data: 'test' });

      // Unsubscribe
      unsubscribe();

      // Emit again - should not be called
      inventoryService.emitEvent('test-event', { data: 'test2' });

      expect(callback).toHaveBeenCalledTimes(1);
    });

    test('should handle callback errors gracefully', () => {
      const errorCallback = jest.fn(() => {
        throw new Error('Callback error');
      });

      inventoryService.subscribe('error-event', errorCallback);
      
      // Should not throw
      expect(() => {
        inventoryService.emitEvent('error-event', {});
      }).not.toThrow();

      expect(errorCallback).toHaveBeenCalled();
    });
  });

  describe('Cache Management', () => {
    beforeEach(async () => {
      await inventoryService.initialize();
    });

    test('should clear inventory-related cache entries', () => {
      inventoryService.cache.set('browse_test1', {});
      inventoryService.cache.set('categories_test1', {});
      inventoryService.cache.set('other_test1', {});

      inventoryService.clearInventoryCache();

      expect(inventoryService.cache.has('browse_test1')).toBe(false);
      expect(inventoryService.cache.has('categories_test1')).toBe(false);
      expect(inventoryService.cache.has('other_test1')).toBe(true);
    });
  });

  describe('Price Calculation', () => {
    beforeEach(async () => {
      await inventoryService.initialize();
    });

    test('should calculate design total price', async () => {
      const components = [
        { inventory_id: 'item-1', quantity: 2 },
        { inventory_id: 'item-2', quantity: 1 }
      ];

      mockAPI.getInventoryItem
        .mockResolvedValueOnce({ price: 10.00 })
        .mockResolvedValueOnce({ price: 15.00 });

      const total = await inventoryService.calculateDesignPrice(components);

      expect(total).toBe(35.00); // (10.00 * 2) + (15.00 * 1)
    });

    test('should handle missing items in price calculation', async () => {
      const components = [
        { inventory_id: 'item-1', quantity: 1 },
        { inventory_id: 'missing-item', quantity: 1 }
      ];

      mockAPI.getInventoryItem
        .mockResolvedValueOnce({ price: 10.00 })
        .mockRejectedValueOnce(new Error('Item not found'));

      const total = await inventoryService.calculateDesignPrice(components);

      expect(total).toBe(10.00); // Only the found item contributes to total
    });
  });

  describe('Component Validation', () => {
    beforeEach(async () => {
      await inventoryService.initialize();
    });

    test('should validate design components', async () => {
      const components = [
        { inventory_id: 'valid-item' },
        { inventory_id: 'inactive-item' },
        { inventory_id: 'out-of-stock-item' }
      ];

      mockAPI.getInventoryItem
        .mockResolvedValueOnce({ status: STATUS.ACTIVE, quantity_available: 1 })
        .mockResolvedValueOnce({ status: STATUS.INACTIVE, quantity_available: 1 })
        .mockResolvedValueOnce({ status: STATUS.ACTIVE, quantity_available: 0 });

      const validated = await inventoryService.validateDesignComponents(components);

      expect(validated).toHaveLength(1);
      expect(validated[0].inventory_id).toBe('valid-item');
    });
  });
});