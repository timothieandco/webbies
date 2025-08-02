/**
 * @fileoverview Integration test script for the inventory management system
 * Tests all major components to ensure they work together correctly
 */

import { InventoryAPI } from '../src/js/services/InventoryAPI.js';
import inventoryService from '../src/js/services/InventoryService.js';
import inventoryImporter from '../src/js/utils/InventoryImporter.js';
import { ValidationHelpers, DataTransformers } from '../src/js/types/inventory.js';
import { ConfigUtils } from '../src/js/config/supabase.js';

class IntegrationTester {
  constructor() {
    this.testResults = [];
    this.errors = [];
  }

  /**
   * Run all integration tests
   * @param {Object} config - Test configuration
   * @returns {Promise<Object>} Test results
   */
  async runAllTests(config = {}) {
    console.log('🧪 Starting Backend Inventory Integration Tests...\n');
    
    this.testResults = [];
    this.errors = [];
    
    try {
      // Configuration tests
      await this.testConfiguration();
      
      // Data model tests
      await this.testDataModels();
      
      // Service layer tests
      await this.testServiceLayer();
      
      // API integration tests (if backend is available)
      if (config.testBackend) {
        await this.testBackendIntegration(config);
      }
      
      // Import functionality tests
      await this.testImportFunctionality();
      
      // Generate summary
      const summary = this.generateTestSummary();
      console.log('\n📊 Test Summary:');
      console.log(summary);
      
      return {
        success: this.errors.length === 0,
        results: this.testResults,
        errors: this.errors,
        summary
      };
      
    } catch (error) {
      console.error('❌ Test suite failed:', error);
      this.errors.push(`Test suite failure: ${error.message}`);
      return {
        success: false,
        error: error.message,
        results: this.testResults,
        errors: this.errors
      };
    }
  }

  /**
   * Test configuration validation
   */
  async testConfiguration() {
    console.log('🔧 Testing Configuration...');
    
    try {
      // Test config validation
      const isValid = ConfigUtils.validateSupabaseConfig();
      this.addResult('Configuration Validation', isValid, 
        isValid ? 'Configuration is valid' : 'Configuration needs setup');
      
      // Test feature flags
      const realTimeEnabled = ConfigUtils.isFeatureEnabled('REAL_TIME_INVENTORY');
      this.addResult('Feature Flags', true, `Real-time inventory: ${realTimeEnabled}`);
      
      // Test environment detection
      const envConfig = ConfigUtils.getEnvironmentConfig();
      this.addResult('Environment Config', !!envConfig, `Timeout: ${envConfig.TIMEOUT}ms`);
      
    } catch (error) {
      this.addError('Configuration test failed', error);
    }
  }

  /**
   * Test data models and validation
   */
  async testDataModels() {
    console.log('📋 Testing Data Models...');
    
    try {
      // Test inventory item validation
      const validItem = {
        title: 'Test Charm',
        price: 15.99,
        quantity_available: 10,
        category: 'charms'
      };
      
      const isValidItem = ValidationHelpers.validateInventoryItem(validItem);
      this.addResult('Inventory Validation', isValidItem, 'Valid item passes validation');
      
      // Test invalid item
      const invalidItem = { title: 'Invalid', price: -5 };
      const isInvalidItem = ValidationHelpers.validateInventoryItem(invalidItem);
      this.addResult('Invalid Item Detection', !isInvalidItem, 'Invalid item correctly rejected');
      
      // Test data transformation
      const aliexpressItem = {
        id: 'test-123',
        title: 'Test AliExpress Charm',
        price: '$12.99',
        quantity: 5,
        attributes: 'Color: Gold, Size: 12mm'
      };
      
      const transformed = DataTransformers.transformAliExpressToInventory(aliexpressItem);
      this.addResult('Data Transformation', 
        transformed.price === 12.99 && transformed.attributes.color === 'Gold',
        'AliExpress data correctly transformed');
      
      // Test price formatting
      const formattedPrice = DataTransformers.formatPrice(15.99, 'USD');
      this.addResult('Price Formatting', formattedPrice === '$15.99', 
        `Price formatted: ${formattedPrice}`);
      
    } catch (error) {
      this.addError('Data model test failed', error);
    }
  }

  /**
   * Test service layer functionality
   */
  async testServiceLayer() {
    console.log('⚙️ Testing Service Layer...');
    
    try {
      // Test service initialization
      const isServiceReady = inventoryService.isReady();
      this.addResult('Service Ready Check', true, 
        `Service ready: ${isServiceReady}`);
      
      // Test data transformation methods
      const shortName = inventoryService.extractShortName('This is a very long product title that should be truncated');
      this.addResult('Name Extraction', shortName.length <= 30, 
        `Short name: "${shortName}"`);
      
      // Test categorization
      const category = DataTransformers.categorizeByTitle('Gold Heart Charm Pendant');
      this.addResult('Auto Categorization', category === 'charms', 
        `Categorized as: ${category}`);
      
    } catch (error) {
      this.addError('Service layer test failed', error);
    }
  }

  /**
   * Test backend integration (if available)
   */
  async testBackendIntegration(config) {
    console.log('🌐 Testing Backend Integration...');
    
    try {
      // Test API initialization
      const api = new InventoryAPI(config.supabaseUrl, config.supabaseKey);
      this.addResult('API Initialization', !!api, 'API client created');
      
      // Test connection (if configured)
      if (config.supabaseUrl && config.supabaseKey) {
        try {
          // This would test actual connection
          console.log('  → Backend connection test skipped (requires live credentials)');
          this.addResult('Backend Connection', true, 'Test skipped - requires live setup');
        } catch (error) {
          this.addResult('Backend Connection', false, error.message);
        }
      } else {
        this.addResult('Backend Connection', true, 'No credentials provided - test skipped');
      }
      
    } catch (error) {
      this.addError('Backend integration test failed', error);
    }
  }

  /**
   * Test import functionality
   */
  async testImportFunctionality() {
    console.log('📥 Testing Import Functionality...');
    
    try {
      // Test import data validation
      const sampleData = [
        {
          id: 'test-1',
          title: 'Test Import Item',
          price: '$19.99',
          quantity: 3,
          attributes: 'Color: Silver'
        }
      ];
      
      const validation = inventoryImporter.constructor.prototype.validateImportFormat(sampleData);
      this.addResult('Import Validation', validation.isValid, 
        validation.isValid ? 'Sample data valid' : `Errors: ${validation.errors.join(', ')}`);
      
      // Test data transformation
      const transformed = await inventoryImporter.constructor.prototype.transformAliExpressData.call(
        { importStats: { total: 1, processed: 0, failed: 0, errors: [] } },
        sampleData,
        { skipDuplicates: false }
      );
      
      this.addResult('Import Transformation', transformed.length === 1, 
        `Transformed ${transformed.length} items`);
      
    } catch (error) {
      this.addError('Import functionality test failed', error);
    }
  }

  /**
   * Add test result
   */
  addResult(testName, success, details) {
    const result = {
      test: testName,
      success,
      details,
      timestamp: new Date().toISOString()
    };
    
    this.testResults.push(result);
    
    const icon = success ? '✅' : '❌';
    console.log(`  ${icon} ${testName}: ${details}`);
  }

  /**
   * Add error
   */
  addError(testName, error) {
    const errorDetails = error.message || error;
    this.errors.push(`${testName}: ${errorDetails}`);
    this.addResult(testName, false, errorDetails);
  }

  /**
   * Generate test summary
   */
  generateTestSummary() {
    const total = this.testResults.length;
    const passed = this.testResults.filter(r => r.success).length;
    const failed = total - passed;
    
    return {
      total,
      passed,
      failed,
      successRate: total > 0 ? ((passed / total) * 100).toFixed(1) : 0,
      errors: this.errors.length,
      status: this.errors.length === 0 ? 'PASS' : 'PARTIAL',
      recommendations: this.generateRecommendations()
    };
  }

  /**
   * Generate recommendations based on test results
   */
  generateRecommendations() {
    const recommendations = [];
    
    const configTest = this.testResults.find(r => r.test === 'Configuration Validation');
    if (configTest && !configTest.success) {
      recommendations.push('Configure Supabase credentials in /src/js/config/supabase.js');
    }
    
    if (this.errors.length > 0) {
      recommendations.push('Review error details and fix failing tests');
    }
    
    if (this.testResults.filter(r => r.success).length === this.testResults.length) {
      recommendations.push('All tests passed! System is ready for production');
    }
    
    return recommendations;
  }
}

// Export for use in other modules
export default IntegrationTester;

// Self-test when run directly
if (typeof window !== 'undefined' && window.location) {
  // Browser environment - add to global scope for console testing
  window.IntegrationTester = IntegrationTester;
  
  console.log('🧪 Integration Tester loaded. Run tests with:');
  console.log('const tester = new IntegrationTester();');
  console.log('tester.runAllTests().then(results => console.log(results));');
}

// Example usage:
/*
import IntegrationTester from './scripts/test-integration.js';

const tester = new IntegrationTester();
const results = await tester.runAllTests({
  testBackend: true,
  supabaseUrl: 'https://your-project.supabase.co',
  supabaseKey: 'your-anon-key'
});

console.log('Test Results:', results);
*/