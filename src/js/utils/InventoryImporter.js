/**
 * @fileoverview Utility for importing AliExpress inventory data into Supabase
 * Handles data transformation and batch import operations
 */

import { DataTransformers, ValidationHelpers } from '../types/inventory.js';
import { getAPI } from '../services/InventoryAPI.js';

/**
 * Utility class for importing inventory data
 */
export class InventoryImporter {
  constructor() {
    this.api = null;
    this.batchSize = 50;
    this.importStats = {
      total: 0,
      processed: 0,
      successful: 0,
      failed: 0,
      errors: []
    };
  }

  /**
   * Initialize the importer
   */
  async initialize() {
    try {
      this.api = getAPI();
      if (!this.api) {
        throw new Error('API not initialized');
      }
    } catch (error) {
      console.error('Failed to initialize InventoryImporter:', error);
      throw error;
    }
  }

  /**
   * Import AliExpress inventory data from JSON
   * @param {Array|string} data - JSON data or JSON string
   * @param {Object} options - Import options
   * @returns {Promise<Object>} Import results
   */
  async importAliExpressData(data, options = {}) {
    try {
      // Reset stats
      this.resetStats();

      // Parse data if it's a string
      const inventoryData = typeof data === 'string' ? JSON.parse(data) : data;
      
      if (!Array.isArray(inventoryData)) {
        throw new Error('Data must be an array of inventory items');
      }

      this.importStats.total = inventoryData.length;
      console.log(`Starting import of ${this.importStats.total} items...`);

      // Transform and validate data
      const transformedItems = await this.transformAliExpressData(inventoryData, options);
      
      // Import in batches
      const results = await this.batchImport(transformedItems, options);
      
      // Generate summary
      const summary = this.generateImportSummary();
      console.log('Import completed:', summary);
      
      return {
        success: this.importStats.failed === 0,
        stats: this.importStats,
        summary,
        results
      };
    } catch (error) {
      console.error('Import failed:', error);
      throw error;
    }
  }

  /**
   * Import from the local JSON file
   * @param {string} filePath - Path to JSON file (relative to project root)
   * @param {Object} options - Import options
   * @returns {Promise<Object>} Import results
   */
  async importFromFile(filePath = '/inventory/aliexpress-orders-2025-08-02T17-54-46-302Z.json', options = {}) {
    try {
      console.log(`Loading inventory data from ${filePath}...`);
      
      // In a browser environment, we'd need to fetch the file
      // For now, assume the data is passed directly
      throw new Error('File import not implemented for browser environment. Use importAliExpressData() with data array instead.');
    } catch (error) {
      console.error('Failed to import from file:', error);
      throw error;
    }
  }

  /**
   * Transform AliExpress data to inventory format
   * @param {Array} data - AliExpress data
   * @param {Object} options - Transform options
   * @returns {Promise<Array>} Transformed data
   */
  async transformAliExpressData(data, options = {}) {
    const transformed = [];
    const {
      skipDuplicates = true,
      defaultStatus = 'active',
      categoryMapping = {}
    } = options;

    for (const item of data) {
      try {
        this.importStats.processed++;

        // Transform the item
        let transformedItem = DataTransformers.transformAliExpressToInventory(item);
        
        // Apply custom category mapping if provided
        if (categoryMapping[transformedItem.category]) {
          transformedItem.category = categoryMapping[transformedItem.category];
        }
        
        // Set status
        transformedItem.status = defaultStatus;
        
        // Validate the transformed item
        if (!ValidationHelpers.validateInventoryItem(transformedItem)) {
          throw new Error(`Invalid item data for: ${item.title}`);
        }

        // Check for duplicates if required
        if (skipDuplicates) {
          const isDuplicate = await this.checkForDuplicate(transformedItem);
          if (isDuplicate) {
            console.log(`Skipping duplicate item: ${transformedItem.title}`);
            continue;
          }
        }

        transformed.push(transformedItem);
        
        // Progress update
        if (this.importStats.processed % 10 === 0) {
          console.log(`Processed ${this.importStats.processed}/${this.importStats.total} items...`);
        }
      } catch (error) {
        this.importStats.failed++;
        this.importStats.errors.push({
          item: item.title || item.id,
          error: error.message
        });
        console.warn(`Failed to transform item ${item.id}:`, error.message);
      }
    }

    return transformed;
  }

  /**
   * Import items in batches
   * @param {Array} items - Items to import
   * @param {Object} options - Import options
   * @returns {Promise<Array>} Import results
   */
  async batchImport(items, options = {}) {
    const results = [];
    const { batchSize = this.batchSize } = options;

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      
      try {
        console.log(`Importing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(items.length / batchSize)}...`);
        
        const batchResult = await this.importBatch(batch);
        results.push(...batchResult);
        
        // Small delay between batches to avoid overwhelming the database
        if (i + batchSize < items.length) {
          await this.delay(100);
        }
      } catch (error) {
        console.error(`Batch import failed for items ${i}-${i + batchSize}:`, error);
        
        // Try importing items individually if batch fails
        const individualResults = await this.importIndividually(batch);
        results.push(...individualResults);
      }
    }

    return results;
  }

  /**
   * Import a single batch
   * @param {Array} batch - Batch of items
   * @returns {Promise<Array>} Batch results
   */
  async importBatch(batch) {
    try {
      const { data, error } = await this.api.client
        .from('inventory')
        .insert(batch)
        .select();

      if (error) throw error;

      this.importStats.successful += data.length;
      return data;
    } catch (error) {
      console.error('Batch import error:', error);
      throw error;
    }
  }

  /**
   * Import items individually when batch fails
   * @param {Array} items - Items to import
   * @returns {Promise<Array>} Individual results
   */
  async importIndividually(items) {
    const results = [];

    for (const item of items) {
      try {
        const result = await this.api.createInventoryItem(item);
        results.push(result);
        this.importStats.successful++;
      } catch (error) {
        this.importStats.failed++;
        this.importStats.errors.push({
          item: item.title,
          error: error.message
        });
        console.warn(`Failed to import individual item ${item.title}:`, error.message);
      }
    }

    return results;
  }

  /**
   * Check if item already exists in database
   * @param {Object} item - Item to check
   * @returns {Promise<boolean>} Is duplicate
   */
  async checkForDuplicate(item) {
    try {
      const { data, error } = await this.api.client
        .from('inventory')
        .select('id')
        .eq('external_id', item.external_id)
        .limit(1);

      if (error) throw error;
      return data && data.length > 0;
    } catch (error) {
      console.warn('Error checking for duplicate:', error);
      return false; // Continue with import if check fails
    }
  }

  /**
   * Generate import summary
   * @returns {Object} Import summary
   */
  generateImportSummary() {
    const { total, processed, successful, failed, errors } = this.importStats;
    
    return {
      total,
      processed,
      successful,
      failed,
      successRate: total > 0 ? (successful / total * 100).toFixed(2) : 0,
      errors: errors.slice(0, 10), // First 10 errors
      hasMoreErrors: errors.length > 10,
      categories: this.getCategoryBreakdown(),
      recommendations: this.generateRecommendations()
    };
  }

  /**
   * Get category breakdown of imported items
   * @returns {Object} Category counts
   */
  getCategoryBreakdown() {
    // This would need to be tracked during import
    // For now, return empty object
    return {};
  }

  /**
   * Generate recommendations based on import results
   * @returns {Array} Recommendations
   */
  generateRecommendations() {
    const recommendations = [];
    
    if (this.importStats.failed > 0) {
      recommendations.push({
        type: 'warning',
        message: `${this.importStats.failed} items failed to import. Check error details.`
      });
    }
    
    if (this.importStats.successful > 0) {
      recommendations.push({
        type: 'success',
        message: `${this.importStats.successful} items imported successfully.`
      });
    }
    
    recommendations.push({
      type: 'info',
      message: 'Review imported items and verify categories are correctly assigned.'
    });
    
    return recommendations;
  }

  /**
   * Reset import statistics
   */
  resetStats() {
    this.importStats = {
      total: 0,
      processed: 0,
      successful: 0,
      failed: 0,
      errors: []
    };
  }

  /**
   * Utility delay function
   * @param {number} ms - Milliseconds to delay
   * @returns {Promise<void>}
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Export current inventory to JSON
   * @param {Object} filters - Export filters
   * @returns {Promise<string>} JSON string
   */
  async exportInventory(filters = {}) {
    try {
      const response = await this.api.getInventory(filters, { limit: 1000 });
      return JSON.stringify(response.data, null, 2);
    } catch (error) {
      console.error('Export failed:', error);
      throw error;
    }
  }

  /**
   * Validate imported data integrity
   * @returns {Promise<Object>} Validation results
   */
  async validateImportedData() {
    try {
      const stats = await this.api.getInventoryStats();
      const categories = await this.api.getCategoriesWithCounts();
      
      return {
        totalItems: stats.total_items || 0,
        activeItems: stats.active_items || 0,
        categoriesFound: categories.length,
        averagePrice: stats.average_price || 0,
        validationPassed: true
      };
    } catch (error) {
      console.error('Validation failed:', error);
      return {
        validationPassed: false,
        error: error.message
      };
    }
  }
}

/**
 * Utility functions for import operations
 */
export class ImportUtils {
  /**
   * Download import template
   * @returns {string} CSV template
   */
  static generateImportTemplate() {
    const headers = [
      'title',
      'description',
      'image_url',
      'price',
      'quantity_available',
      'category',
      'subcategory',
      'tags',
      'color',
      'size',
      'material'
    ];
    
    const example = [
      'Example Charm',
      'Beautiful gold-plated charm',
      'https://example.com/image.jpg',
      '15.99',
      '10',
      'charms',
      'animal_charms',
      'gold,charm,animal',
      'gold',
      '12mm',
      'brass'
    ];
    
    return [headers.join(','), example.join(',')].join('\n');
  }

  /**
   * Validate import file format
   * @param {Array} data - Data to validate
   * @returns {Object} Validation result
   */
  static validateImportFormat(data) {
    const errors = [];
    const requiredFields = ['title', 'price', 'category'];
    
    if (!Array.isArray(data)) {
      errors.push('Data must be an array');
      return { isValid: false, errors };
    }
    
    data.forEach((item, index) => {
      requiredFields.forEach(field => {
        if (!item[field]) {
          errors.push(`Missing ${field} in item ${index + 1}`);
        }
      });
      
      if (item.price && (isNaN(item.price) || item.price < 0)) {
        errors.push(`Invalid price in item ${index + 1}`);
      }
    });
    
    return {
      isValid: errors.length === 0,
      errors: errors.slice(0, 20) // First 20 errors
    };
  }
}

// Create singleton instance
const inventoryImporter = new InventoryImporter();

export default inventoryImporter;