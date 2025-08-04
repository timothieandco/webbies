/**
 * Unit tests for InventoryImporter
 * Tests data import, transformation, validation, and batch processing functionality
 */

import { InventoryImporter, ImportUtils } from '../../../src/js/utils/InventoryImporter.js';

// Mock dependencies
jest.mock('../../../src/js/types/inventory.js', () => ({
  DataTransformers: {
    transformAliExpressToInventory: jest.fn()
  },
  ValidationHelpers: {
    validateInventoryItem: jest.fn()
  }
}));

jest.mock('../../../src/js/services/InventoryAPI.js', () => ({
  getAPI: jest.fn()
}));

// Import mocked modules for assertions
import { DataTransformers, ValidationHelpers } from '../../../src/js/types/inventory.js';
import { getAPI } from '../../../src/js/services/InventoryAPI.js';

describe('InventoryImporter', () => {
  let importer;
  let mockAPI;

  beforeEach(() => {
    // Create fresh importer instance
    importer = new InventoryImporter();
    
    // Setup mock API
    mockAPI = {
      client: {
        from: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis()
      },
      createInventoryItem: jest.fn(),
      getInventory: jest.fn(),
      getInventoryStats: jest.fn(),
      getCategoriesWithCounts: jest.fn()
    };
    
    getAPI.mockReturnValue(mockAPI);
    
    // Reset all mocks
    jest.clearAllMocks();
    
    // Setup console mocks
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
    jest.spyOn(console, 'warn').mockImplementation();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Constructor', () => {
    test('should initialize with correct default values', () => {
      expect(importer.api).toBe(null);
      expect(importer.batchSize).toBe(50);
      expect(importer.importStats).toEqual({
        total: 0,
        processed: 0,
        successful: 0,
        failed: 0,
        errors: []
      });
    });
  });

  describe('initialize()', () => {
    test('should initialize API successfully', async () => {
      await importer.initialize();
      
      expect(getAPI).toHaveBeenCalled();
      expect(importer.api).toBe(mockAPI);
    });

    test('should throw error when API initialization fails', async () => {
      getAPI.mockReturnValue(null);
      
      await expect(importer.initialize()).rejects.toThrow('API not initialized');
      expect(console.error).toHaveBeenCalledWith('Failed to initialize InventoryImporter:', expect.any(Error));
    });

    test('should throw error when getAPI throws', async () => {
      const error = new Error('API connection failed');
      getAPI.mockImplementation(() => { throw error; });
      
      await expect(importer.initialize()).rejects.toThrow('API connection failed');
    });
  });

  describe('importAliExpressData()', () => {
    beforeEach(async () => {
      await importer.initialize();
    });

    test('should import data from array successfully', async () => {
      const testData = [
        { id: '1', title: 'Test Item 1', price: 10 },
        { id: '2', title: 'Test Item 2', price: 15 }
      ];

      const transformedItem = {
        title: 'Test Item 1',
        price: 10,
        category: 'charms',
        external_id: '1'
      };

      DataTransformers.transformAliExpressToInventory.mockReturnValue(transformedItem);
      ValidationHelpers.validateInventoryItem.mockReturnValue(true);
      importer.checkForDuplicate = jest.fn().mockResolvedValue(false);
      importer.batchImport = jest.fn().mockResolvedValue([{ id: 'new-1' }, { id: 'new-2' }]);

      const result = await importer.importAliExpressData(testData);

      expect(result.success).toBe(true);
      expect(result.stats.total).toBe(2);
      expect(importer.batchImport).toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith('Starting import of 2 items...');
    });

    test('should parse JSON string data', async () => {
      const testData = [{ id: '1', title: 'Test Item', price: 10 }];
      const jsonString = JSON.stringify(testData);

      DataTransformers.transformAliExpressToInventory.mockReturnValue({
        title: 'Test Item',
        price: 10,
        category: 'charms'
      });
      ValidationHelpers.validateInventoryItem.mockReturnValue(true);
      importer.checkForDuplicate = jest.fn().mockResolvedValue(false);
      importer.batchImport = jest.fn().mockResolvedValue([{ id: 'new-1' }]);

      const result = await importer.importAliExpressData(jsonString);

      expect(result.success).toBe(true);
      expect(result.stats.total).toBe(1);
    });

    test('should throw error for invalid JSON', async () => {
      const invalidJson = 'invalid json';

      await expect(importer.importAliExpressData(invalidJson)).rejects.toThrow();
    });

    test('should throw error for non-array data', async () => {
      const invalidData = { not: 'an array' };

      await expect(importer.importAliExpressData(invalidData))
        .rejects.toThrow('Data must be an array of inventory items');
    });

    test('should handle transformation errors gracefully', async () => {
      const testData = [
        { id: '1', title: 'Valid Item', price: 10 },
        { id: '2', title: 'Invalid Item', price: 15 }
      ];

      DataTransformers.transformAliExpressToInventory
        .mockReturnValueOnce({ title: 'Valid Item', price: 10, category: 'charms' })
        .mockImplementationOnce(() => { throw new Error('Transform failed'); });
      
      ValidationHelpers.validateInventoryItem.mockReturnValue(true);
      importer.checkForDuplicate = jest.fn().mockResolvedValue(false);
      importer.batchImport = jest.fn().mockResolvedValue([{ id: 'new-1' }]);

      const result = await importer.importAliExpressData(testData);

      expect(result.stats.failed).toBe(1);
      expect(result.stats.errors).toHaveLength(1);
      expect(console.warn).toHaveBeenCalledWith('Failed to transform item 2:', 'Transform failed');
    });
  });

  describe('transformAliExpressData()', () => {
    beforeEach(async () => {
      await importer.initialize();
    });

    test('should transform data with default options', async () => {
      const testData = [
        { id: '1', title: 'Test Item', price: 10 }
      ];

      const transformedItem = {
        title: 'Test Item',
        price: 10,
        category: 'charms',
        external_id: '1'
      };

      DataTransformers.transformAliExpressToInventory.mockReturnValue(transformedItem);
      ValidationHelpers.validateInventoryItem.mockReturnValue(true);
      importer.checkForDuplicate = jest.fn().mockResolvedValue(false);

      const result = await importer.transformAliExpressData(testData);

      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('active');
      expect(DataTransformers.transformAliExpressToInventory).toHaveBeenCalledWith(testData[0]);
      expect(ValidationHelpers.validateInventoryItem).toHaveBeenCalledWith(expect.objectContaining({
        ...transformedItem,
        status: 'active'
      }));
    });

    test('should apply custom category mapping', async () => {
      const testData = [
        { id: '1', title: 'Test Item', price: 10 }
      ];

      const transformedItem = {
        title: 'Test Item',
        price: 10,
        category: 'old_category'
      };

      const options = {
        categoryMapping: {
          'old_category': 'new_category'
        }
      };

      DataTransformers.transformAliExpressToInventory.mockReturnValue(transformedItem);
      ValidationHelpers.validateInventoryItem.mockReturnValue(true);
      importer.checkForDuplicate = jest.fn().mockResolvedValue(false);

      const result = await importer.transformAliExpressData(testData, options);

      expect(result[0].category).toBe('new_category');
    });

    test('should skip duplicates when option enabled', async () => {
      const testData = [
        { id: '1', title: 'Duplicate Item', price: 10 },
        { id: '2', title: 'Unique Item', price: 15 }
      ];

      DataTransformers.transformAliExpressToInventory.mockReturnValue({
        title: 'Test Item',
        category: 'charms'
      });
      ValidationHelpers.validateInventoryItem.mockReturnValue(true);
      importer.checkForDuplicate = jest.fn()
        .mockResolvedValueOnce(true)  // First item is duplicate
        .mockResolvedValueOnce(false); // Second item is unique

      const result = await importer.transformAliExpressData(testData, { skipDuplicates: true });

      expect(result).toHaveLength(1);
      expect(console.log).toHaveBeenCalledWith('Skipping duplicate item: Test Item');
    });

    test('should handle validation failures', async () => {
      const testData = [
        { id: '1', title: 'Invalid Item', price: 10 }
      ];

      DataTransformers.transformAliExpressToInventory.mockReturnValue({
        title: 'Invalid Item',
        category: 'charms'
      });
      ValidationHelpers.validateInventoryItem.mockReturnValue(false);

      const result = await importer.transformAliExpressData(testData);

      expect(result).toHaveLength(0);
      expect(importer.importStats.failed).toBe(1);
      expect(importer.importStats.errors[0]).toEqual({
        item: 'Invalid Item',
        error: 'Invalid item data for: Invalid Item'
      });
    });

    test('should log progress updates', async () => {
      // Create 25 items to trigger progress logging
      const testData = Array.from({ length: 25 }, (_, i) => ({
        id: `${i + 1}`,
        title: `Item ${i + 1}`,
        price: 10
      }));

      // Need to set the total first, like importAliExpressData does
      importer.importStats.total = testData.length;

      DataTransformers.transformAliExpressToInventory.mockReturnValue({
        title: 'Test Item',
        category: 'charms'
      });
      ValidationHelpers.validateInventoryItem.mockReturnValue(true);
      importer.checkForDuplicate = jest.fn().mockResolvedValue(false);

      await importer.transformAliExpressData(testData);

      // Should log progress at items 10 and 20
      expect(console.log).toHaveBeenCalledWith('Processed 10/25 items...');
      expect(console.log).toHaveBeenCalledWith('Processed 20/25 items...');
    });
  });

  describe('batchImport()', () => {
    beforeEach(async () => {
      await importer.initialize();
    });

    test('should import items in batches', async () => {
      const items = Array.from({ length: 75 }, (_, i) => ({ id: i + 1, title: `Item ${i + 1}` }));
      
      importer.importBatch = jest.fn()
        .mockResolvedValueOnce(Array.from({ length: 50 }, (_, i) => ({ id: i + 1 })))
        .mockResolvedValueOnce(Array.from({ length: 25 }, (_, i) => ({ id: i + 51 })));

      importer.delay = jest.fn().mockResolvedValue();

      const result = await importer.batchImport(items, { batchSize: 50 });

      expect(result).toHaveLength(75);
      expect(importer.importBatch).toHaveBeenCalledTimes(2);
      expect(importer.delay).toHaveBeenCalledWith(100);
      expect(console.log).toHaveBeenCalledWith('Importing batch 1/2...');
      expect(console.log).toHaveBeenCalledWith('Importing batch 2/2...');
    });

    test('should fallback to individual import when batch fails', async () => {
      const items = [
        { id: 1, title: 'Item 1' },
        { id: 2, title: 'Item 2' }
      ];

      importer.importBatch = jest.fn().mockRejectedValue(new Error('Batch failed'));
      importer.importIndividually = jest.fn().mockResolvedValue([
        { id: 'new-1' },
        { id: 'new-2' }
      ]);

      const result = await importer.batchImport(items);

      expect(result).toHaveLength(2);
      expect(importer.importIndividually).toHaveBeenCalledWith(items);
      expect(console.error).toHaveBeenCalledWith('Batch import failed for items 0-50:', expect.any(Error));
    });
  });

  describe('importBatch()', () => {
    beforeEach(async () => {
      await importer.initialize();
    });

    test('should import batch successfully', async () => {
      const batch = [
        { id: 1, title: 'Item 1' },
        { id: 2, title: 'Item 2' }
      ];

      const mockData = [
        { id: 'new-1', title: 'Item 1' },
        { id: 'new-2', title: 'Item 2' }
      ];

      mockAPI.client.select.mockResolvedValue({
        data: mockData,
        error: null
      });

      const result = await importer.importBatch(batch);

      expect(result).toEqual(mockData);
      expect(importer.importStats.successful).toBe(2);
      expect(mockAPI.client.from).toHaveBeenCalledWith('inventory');
      expect(mockAPI.client.insert).toHaveBeenCalledWith(batch);
    });

    test('should handle batch import error', async () => {
      const batch = [{ id: 1, title: 'Item 1' }];
      const error = new Error('Database error');

      mockAPI.client.select.mockResolvedValue({
        data: null,
        error
      });

      await expect(importer.importBatch(batch)).rejects.toThrow('Database error');
      expect(console.error).toHaveBeenCalledWith('Batch import error:', error);
    });
  });

  describe('importIndividually()', () => {
    beforeEach(async () => {
      await importer.initialize();
    });

    test('should import items individually', async () => {
      const items = [
        { id: 1, title: 'Item 1' },
        { id: 2, title: 'Item 2' }
      ];

      mockAPI.createInventoryItem
        .mockResolvedValueOnce({ id: 'new-1' })
        .mockResolvedValueOnce({ id: 'new-2' });

      const result = await importer.importIndividually(items);

      expect(result).toHaveLength(2);
      expect(importer.importStats.successful).toBe(2);
      expect(mockAPI.createInventoryItem).toHaveBeenCalledTimes(2);
    });

    test('should handle individual import failures', async () => {
      const items = [
        { id: 1, title: 'Item 1' },
        { id: 2, title: 'Item 2' }
      ];

      mockAPI.createInventoryItem
        .mockResolvedValueOnce({ id: 'new-1' })
        .mockRejectedValueOnce(new Error('Import failed'));

      const result = await importer.importIndividually(items);

      expect(result).toHaveLength(1);
      expect(importer.importStats.successful).toBe(1);
      expect(importer.importStats.failed).toBe(1);
      expect(importer.importStats.errors).toHaveLength(1);
      expect(console.warn).toHaveBeenCalledWith('Failed to import individual item Item 2:', 'Import failed');
    });
  });

  describe('checkForDuplicate()', () => {
    beforeEach(async () => {
      await importer.initialize();
    });

    test('should return true for duplicate items', async () => {
      const item = { external_id: 'existing-123' };

      mockAPI.client.limit.mockResolvedValue({
        data: [{ id: 'existing-item' }],
        error: null
      });

      const result = await importer.checkForDuplicate(item);

      expect(result).toBe(true);
      expect(mockAPI.client.from).toHaveBeenCalledWith('inventory');
      expect(mockAPI.client.eq).toHaveBeenCalledWith('external_id', 'existing-123');
    });

    test('should return false for unique items', async () => {
      const item = { external_id: 'unique-123' };

      mockAPI.client.limit.mockResolvedValue({
        data: [],
        error: null
      });

      const result = await importer.checkForDuplicate(item);

      expect(result).toBe(false);
    });

    test('should return false on database error', async () => {
      const item = { external_id: 'test-123' };

      mockAPI.client.limit.mockResolvedValue({
        data: null,
        error: new Error('Database error')
      });

      const result = await importer.checkForDuplicate(item);

      expect(result).toBe(false);
      expect(console.warn).toHaveBeenCalledWith('Error checking for duplicate:', expect.any(Error));
    });
  });

  describe('generateImportSummary()', () => {
    test('should generate correct summary', () => {
      importer.importStats = {
        total: 100,
        processed: 100,
        successful: 85,
        failed: 15,
        errors: Array.from({ length: 15 }, (_, i) => ({ item: `Item ${i}`, error: 'Error' }))
      };

      const summary = importer.generateImportSummary();

      expect(summary.total).toBe(100);
      expect(summary.successful).toBe(85);
      expect(summary.failed).toBe(15);
      expect(summary.successRate).toBe('85.00');
      expect(summary.errors).toHaveLength(10); // First 10 errors
      expect(summary.hasMoreErrors).toBe(true);
      expect(summary.recommendations).toHaveLength(3);
    });

    test('should handle zero total items', () => {
      const summary = importer.generateImportSummary();

      expect(summary.successRate).toBe(0);
      expect(summary.errors).toHaveLength(0);
      expect(summary.hasMoreErrors).toBe(false);
    });
  });

  describe('generateRecommendations()', () => {
    test('should include warning for failed imports', () => {
      importer.importStats.failed = 5;
      importer.importStats.successful = 10;

      const recommendations = importer.generateRecommendations();

      expect(recommendations).toContainEqual({
        type: 'warning',
        message: '5 items failed to import. Check error details.'
      });
    });

    test('should include success message for successful imports', () => {
      importer.importStats.successful = 10;

      const recommendations = importer.generateRecommendations();

      expect(recommendations).toContainEqual({
        type: 'success',
        message: '10 items imported successfully.'
      });
    });

    test('should always include review message', () => {
      const recommendations = importer.generateRecommendations();

      expect(recommendations).toContainEqual({
        type: 'info',
        message: 'Review imported items and verify categories are correctly assigned.'
      });
    });
  });

  describe('resetStats()', () => {
    test('should reset import statistics', () => {
      importer.importStats = {
        total: 100,
        processed: 50,
        successful: 30,
        failed: 20,
        errors: [{ item: 'test', error: 'error' }]
      };

      importer.resetStats();

      expect(importer.importStats).toEqual({
        total: 0,
        processed: 0,
        successful: 0,
        failed: 0,
        errors: []
      });
    });
  });

  describe('delay()', () => {
    test('should delay for specified milliseconds', async () => {
      const start = Date.now();
      await importer.delay(100);
      const end = Date.now();

      expect(end - start).toBeGreaterThanOrEqual(100);
    });
  });

  describe('exportInventory()', () => {
    beforeEach(async () => {
      await importer.initialize();
    });

    test('should export inventory as JSON', async () => {
      const mockInventory = [
        { id: 1, title: 'Item 1' },
        { id: 2, title: 'Item 2' }
      ];

      mockAPI.getInventory.mockResolvedValue({
        data: mockInventory
      });

      const result = await importer.exportInventory();

      expect(JSON.parse(result)).toEqual(mockInventory);
      expect(mockAPI.getInventory).toHaveBeenCalledWith({}, { limit: 1000 });
    });

    test('should handle export errors', async () => {
      const error = new Error('Export failed');
      mockAPI.getInventory.mockRejectedValue(error);

      await expect(importer.exportInventory()).rejects.toThrow('Export failed');
      expect(console.error).toHaveBeenCalledWith('Export failed:', error);
    });
  });

  describe('validateImportedData()', () => {
    beforeEach(async () => {
      await importer.initialize();
    });

    test('should validate imported data successfully', async () => {
      const mockStats = {
        total_items: 100,
        active_items: 85,
        average_price: 15.50
      };

      const mockCategories = [
        { name: 'charms', count: 50 },
        { name: 'necklaces', count: 35 }
      ];

      mockAPI.getInventoryStats.mockResolvedValue(mockStats);
      mockAPI.getCategoriesWithCounts.mockResolvedValue(mockCategories);

      const result = await importer.validateImportedData();

      expect(result).toEqual({
        totalItems: 100,
        activeItems: 85,
        categoriesFound: 2,
        averagePrice: 15.50,
        validationPassed: true
      });
    });

    test('should handle validation errors', async () => {
      const error = new Error('Validation failed');
      mockAPI.getInventoryStats.mockRejectedValue(error);

      const result = await importer.validateImportedData();

      expect(result).toEqual({
        validationPassed: false,
        error: 'Validation failed'
      });
      expect(console.error).toHaveBeenCalledWith('Validation failed:', error);
    });
  });

  describe('importFromFile()', () => {
    test('should throw error for browser environment', async () => {
      await expect(importer.importFromFile())
        .rejects.toThrow('File import not implemented for browser environment');
    });
  });
});

describe('ImportUtils', () => {
  describe('generateImportTemplate()', () => {
    test('should generate CSV template with headers and example', () => {
      const template = ImportUtils.generateImportTemplate();
      const lines = template.split('\n');

      expect(lines).toHaveLength(2);
      expect(lines[0]).toContain('title,description,image_url');
      expect(lines[1]).toContain('Example Charm,Beautiful gold-plated charm');
    });
  });

  describe('validateImportFormat()', () => {
    test('should validate correct format', () => {
      const data = [
        {
          title: 'Test Item',
          price: 15.99,
          category: 'charms'
        }
      ];

      const result = ImportUtils.validateImportFormat(data);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should detect missing required fields', () => {
      const data = [
        {
          title: 'Test Item'
          // Missing price and category
        }
      ];

      const result = ImportUtils.validateImportFormat(data);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Missing price in item 1');
      expect(result.errors).toContain('Missing category in item 1');
    });

    test('should detect invalid price values', () => {
      const data = [
        {
          title: 'Test Item',
          price: 'invalid',
          category: 'charms'
        },
        {
          title: 'Test Item 2',
          price: -10,
          category: 'charms'
        }
      ];

      const result = ImportUtils.validateImportFormat(data);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid price in item 1');
      expect(result.errors).toContain('Invalid price in item 2');
    });

    test('should handle non-array input', () => {
      const data = { not: 'an array' };

      const result = ImportUtils.validateImportFormat(data);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Data must be an array');
    });

    test('should limit errors to first 20', () => {
      // Create data with 25 items missing required fields
      const data = Array.from({ length: 25 }, (_, i) => ({}));

      const result = ImportUtils.validateImportFormat(data);

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeLessThanOrEqual(20);
    });
  });
});