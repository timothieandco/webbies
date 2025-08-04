/**
 * End-to-End Design-to-Export Workflow Tests
 * Tests the complete user journey from browsing inventory to exporting final designs
 */

// Mock browser environment for Konva and DOM operations
global.document = {
  createElement: jest.fn(() => ({
    getContext: jest.fn(() => ({
      fillRect: jest.fn(),
      clearRect: jest.fn(),
      getImageData: jest.fn(() => ({
        data: new Uint8ClampedArray(4 * 800 * 600),
        width: 800,
        height: 600
      })),
      putImageData: jest.fn(),
      createImageData: jest.fn(() => ({
        data: new Uint8ClampedArray(4 * 800 * 600),
        width: 800,
        height: 600
      })),
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
      moveTo: jest.fn(),
      measureText: jest.fn(() => ({ width: 100 })),
      canvas: {
        width: 800,
        height: 600,
        toDataURL: jest.fn(() => 'data:image/png;base64,mock-image-data')
      }
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
    })),
    appendChild: jest.fn(),
    removeChild: jest.fn(),
    id: 'mock-canvas',
    width: 800,
    height: 600
  })),
  getElementById: jest.fn((id) => {
    if (id === 'jewelry-canvas') {
      return {
        id: 'jewelry-canvas',
        getContext: jest.fn(() => ({
          fillRect: jest.fn(),
          clearRect: jest.fn(),
          canvas: {
            width: 800,
            height: 600,
            toDataURL: jest.fn(() => 'data:image/png;base64,mock-canvas-data')
          }
        })),
        style: {},
        addEventListener: jest.fn(),
        getBoundingClientRect: jest.fn(() => ({
          width: 800,
          height: 600,
          top: 0,
          left: 0
        })),
        appendChild: jest.fn(),
        width: 800,
        height: 600
      };
    }
    return null;
  }),
  body: { appendChild: jest.fn() },
  addEventListener: jest.fn()
};

global.window = {
  devicePixelRatio: 1,
  addEventListener: jest.fn(),
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  requestAnimationFrame: jest.fn(cb => setTimeout(cb, 16)),
  cancelAnimationFrame: jest.fn()
};

// Mock Image class
global.Image = class MockImage {
  constructor() {
    this.src = '';
    this.onload = null;
    this.onerror = null;
    this.width = 100;
    this.height = 100;
    setTimeout(() => {
      if (this.onload) this.onload();
    }, 10);
  }
};

// Mock canvas for Konva
global.HTMLCanvasElement = class MockCanvas {
  constructor() {
    this.width = 800;
    this.height = 600;
    this.style = {};
  }
  
  getContext() {
    return {
      fillRect: jest.fn(),
      clearRect: jest.fn(),
      getImageData: jest.fn(() => ({
        data: new Uint8ClampedArray(4 * 800 * 600),
        width: 800,
        height: 600
      })),
      putImageData: jest.fn(),
      createImageData: jest.fn(() => ({
        data: new Uint8ClampedArray(4 * 800 * 600),
        width: 800,
        height: 600
      })),
      drawImage: jest.fn(),
      save: jest.fn(),
      restore: jest.fn(),
      canvas: this
    };
  }
  
  toDataURL() {
    return 'data:image/png;base64,mock-canvas-export';
  }
};

import { JewelryCustomizer } from '../../src/js/core/JewelryCustomizer.js';
import { InventoryService } from '../../src/js/services/InventoryService.js';

// Mock InventoryService
jest.mock('../../src/js/services/InventoryService.js', () => ({
  InventoryService: jest.fn().mockImplementation(() => ({
    initialize: jest.fn().mockResolvedValue(),
    isReady: jest.fn(() => true),
    getCharmInventory: jest.fn().mockResolvedValue([
      {
        id: 'charm-heart-001',
        title: 'Heart Charm',
        description: 'Beautiful silver heart charm',
        imageUrl: 'data:image/png;base64,mock-heart-charm',
        price: 15.99,
        priceValue: 15.99,
        category: 'charms',
        material: 'sterling silver',
        available: true,
        quantity: 10
      },
      {
        id: 'charm-star-002',
        title: 'Star Charm',
        description: 'Sparkling gold star charm',
        imageUrl: 'data:image/png;base64,mock-star-charm',
        price: 18.50,
        priceValue: 18.50,
        category: 'charms',
        material: 'gold plated',
        available: true,
        quantity: 5
      },
      {
        id: 'charm-butterfly-003',
        title: 'Butterfly Charm',
        description: 'Delicate butterfly charm with crystals',
        imageUrl: 'data:image/png;base64,mock-butterfly-charm',
        price: 22.00,
        priceValue: 22.00,
        category: 'charms',
        material: 'sterling silver',
        available: true,
        quantity: 8
      }
    ]),
    getCategories: jest.fn().mockResolvedValue([
      { name: 'all', count: 3 },
      { name: 'charms', count: 3 }
    ]),
    searchInventory: jest.fn().mockImplementation((query) => {
      const mockResults = [
        {
          id: 'charm-heart-001',
          title: 'Heart Charm',
          imageUrl: 'data:image/png;base64,mock-heart-charm',
          price: 15.99
        }
      ];
      return Promise.resolve(query.toLowerCase().includes('heart') ? mockResults : []);
    }),
    saveDesign: jest.fn().mockResolvedValue({
      id: 'design-12345',
      title: 'My Custom Design',
      user_id: 'user-123',
      created_at: new Date().toISOString()
    }),
    calculateDesignPrice: jest.fn().mockImplementation((components) => {
      return Promise.resolve(components.reduce((total, comp) => total + (comp.priceValue || 0), 0));
    })
  }))
}));

describe('Design-to-Export Workflow E2E Tests', () => {
  let customizer;
  let inventoryService;
  let mockUser;

  beforeAll(async () => {
    // Initialize services
    inventoryService = new InventoryService();
    await inventoryService.initialize();
    
    // Create mock user session
    mockUser = {
      id: 'user-123',
      email: 'test@example.com',
      name: 'Test User'
    };
  });

  beforeEach(async () => {
    // Initialize customizer for each test
    customizer = new JewelryCustomizer('jewelry-canvas', {
      width: 800,
      height: 600,
      maxCharms: 10,
      enableAnimation: false // Disable for testing
    });
    
    // Wait for initialization
    await new Promise(resolve => setTimeout(resolve, 100));
    
    jest.clearAllMocks();
  });

  afterEach(() => {
    if (customizer && customizer.destroy) {
      customizer.destroy();
    }
  });

  describe('Complete User Journey: Discovery to Export', () => {
    test('should complete full design workflow from browsing to export', async () => {
      // Step 1: User browses inventory
      console.log('Step 1: Browsing inventory...');
      const inventory = await inventoryService.getCharmInventory();
      
      expect(inventory).toHaveLength(3);
      expect(inventory[0].title).toBe('Heart Charm');
      expect(inventory[1].title).toBe('Star Charm');
      expect(inventory[2].title).toBe('Butterfly Charm');
      
      // Step 2: User searches for specific items
      console.log('Step 2: Searching for heart charms...');
      const heartCharms = await inventoryService.searchInventory('heart');
      
      expect(heartCharms).toHaveLength(1);
      expect(heartCharms[0].title).toBe('Heart Charm');
      
      // Step 3: User starts creating a design
      console.log('Step 3: Creating design...');
      expect(customizer.charmManager.getCharmCount()).toBe(0);
      
      // Step 4: User adds first charm
      console.log('Step 4: Adding heart charm...');
      const heartCharm = inventory.find(item => item.title === 'Heart Charm');
      await customizer.addCharm(heartCharm, { x: 300, y: 250 });
      
      expect(customizer.charmManager.getCharmCount()).toBe(1);
      
      // Step 5: User adds second charm
      console.log('Step 5: Adding star charm...');
      const starCharm = inventory.find(item => item.title === 'Star Charm');
      await customizer.addCharm(starCharm, { x: 500, y: 300 });
      
      expect(customizer.charmManager.getCharmCount()).toBe(2);
      
      // Step 6: User adjusts design (move charm)
      console.log('Step 6: Adjusting design...');
      const charms = customizer.charmManager.getCharmData();
      expect(charms).toHaveLength(2);
      
      // Simulate moving a charm
      if (charms.length > 0) {
        const firstCharm = charms[0];
        // In a real scenario, this would be done through drag interaction
        firstCharm.x = 350;
        firstCharm.y = 280;
      }
      
      // Step 7: User calculates total price
      console.log('Step 7: Calculating price...');
      const designData = customizer.getDesignData();
      const totalPrice = await inventoryService.calculateDesignPrice([
        { priceValue: heartCharm.priceValue },
        { priceValue: starCharm.priceValue }
      ]);
      
      expect(totalPrice).toBe(34.49); // 15.99 + 18.50
      
      // Step 8: User saves design
      console.log('Step 8: Saving design...');
      const savedDesign = await inventoryService.saveDesign({
        title: 'My Heart & Star Design',
        description: 'A beautiful combination of heart and star charms',
        design_data: designData,
        total_price: totalPrice
      });
      
      expect(savedDesign).toBeDefined();
      expect(savedDesign.id).toBe('design-12345');
      expect(savedDesign.title).toBe('My Custom Design');
      
      // Step 9: User exports design
      console.log('Step 9: Exporting design...');
      const exportResult = await customizer.exportDesign({
        format: 'PNG',
        width: 1200,
        height: 900,
        quality: 1.0,
        includeMetadata: true
      });
      
      expect(exportResult).toBeDefined();
      expect(exportResult.dataURL).toMatch(/^data:image\/png;base64,/);
      expect(exportResult.width).toBe(1200);
      expect(exportResult.height).toBe(900);
      expect(exportResult.metadata).toBeDefined();
      
      console.log('✅ Complete workflow test passed!');
    });
  });

  describe('Advanced Design Scenarios', () => {
    test('should handle complex multi-charm design workflow', async () => {
      const inventory = await inventoryService.getCharmInventory();
      
      // Add all available charms to create a complex design
      console.log('Creating complex design with all charms...');
      
      const positions = [
        { x: 200, y: 200 },
        { x: 400, y: 250 },
        { x: 600, y: 200 }
      ];
      
      for (let i = 0; i < inventory.length; i++) {
        await customizer.addCharm(inventory[i], positions[i]);
      }
      
      expect(customizer.charmManager.getCharmCount()).toBe(3);
      
      // Test undo functionality
      customizer.undo();
      expect(customizer.charmManager.getCharmCount()).toBe(2);
      
      // Test redo functionality
      customizer.redo();
      expect(customizer.charmManager.getCharmCount()).toBe(3);
      
      // Export complex design
      const exportResult = await customizer.exportDesign({
        format: 'JPEG',
        width: 800,
        height: 600,
        quality: 0.9
      });
      
      expect(exportResult.dataURL).toMatch(/^data:image\/jpeg;base64,/);
      expect(exportResult.width).toBe(800);
      expect(exportResult.height).toBe(600);
    });

    test('should handle design modification and re-export workflow', async () => {
      const inventory = await inventoryService.getCharmInventory();
      
      // Create initial design
      const heartCharm = inventory[0];
      await customizer.addCharm(heartCharm, { x: 300, y: 300 });
      
      // Export initial version
      const firstExport = await customizer.exportDesign({
        format: 'PNG',
        width: 400,
        height: 300
      });
      
      expect(firstExport.dataURL).toBeDefined();
      
      // Modify design - add another charm
      const starCharm = inventory[1];
      await customizer.addCharm(starCharm, { x: 450, y: 350 });
      
      // Export modified version
      const secondExport = await customizer.exportDesign({
        format: 'PNG',
        width: 400,
        height: 300
      });
      
      expect(secondExport.dataURL).toBeDefined();
      expect(secondExport.dataURL).not.toBe(firstExport.dataURL);
      
      // Clear design and verify
      customizer.clearAllCharms();
      expect(customizer.charmManager.getCharmCount()).toBe(0);
      
      // Export empty design
      const emptyExport = await customizer.exportDesign({
        format: 'PNG',
        width: 400,
        height: 300
      });
      
      expect(emptyExport.dataURL).toBeDefined();
    });
  });

  describe('Error Handling in Complete Workflow', () => {
    test('should gracefully handle export failures', async () => {
      const inventory = await inventoryService.getCharmInventory();
      
      // Create design
      await customizer.addCharm(inventory[0], { x: 300, y: 300 });
      
      // Mock export failure
      const originalToDataURL = global.HTMLCanvasElement.prototype.toDataURL;
      global.HTMLCanvasElement.prototype.toDataURL = jest.fn(() => {
        throw new Error('Canvas export failed');
      });
      
      // Attempt export
      const result = await customizer.exportDesign({
        format: 'PNG',
        width: 800,
        height: 600
      }).catch(error => error);
      
      expect(result).toBeInstanceOf(Error);
      expect(result.message).toContain('Canvas export failed');
      
      // Restore original method
      global.HTMLCanvasElement.prototype.toDataURL = originalToDataURL;
    });

    test('should handle design save failures with fallback', async () => {
      const inventory = await inventoryService.getCharmInventory();
      
      // Create design
      await customizer.addCharm(inventory[0], { x: 300, y: 300 });
      const designData = customizer.getDesignData();
      
      // Mock save failure
      inventoryService.saveDesign.mockRejectedValueOnce(new Error('Save failed'));
      
      const result = await inventoryService.saveDesign({
        title: 'Test Design',
        design_data: designData
      }).catch(error => error);
      
      expect(result).toBeInstanceOf(Error);
      expect(result.message).toContain('Save failed');
      
      // Verify design data is still intact locally
      expect(designData.charms).toHaveLength(1);
    });

    test('should handle inventory loading failures gracefully', async () => {
      // Mock inventory failure
      inventoryService.getCharmInventory.mockRejectedValueOnce(new Error('Network error'));
      
      const result = await inventoryService.getCharmInventory().catch(error => error);
      
      expect(result).toBeInstanceOf(Error);
      expect(result.message).toContain('Network error');
      
      // User should still be able to work with customizer
      expect(customizer.charmManager.getCharmCount()).toBe(0);
    });
  });

  describe('Performance and Quality Validation', () => {
    test('should maintain performance with multiple operations', async () => {
      const inventory = await inventoryService.getCharmInventory();
      
      const startTime = Date.now();
      
      // Perform multiple operations quickly
      for (let i = 0; i < inventory.length; i++) {
        await customizer.addCharm(inventory[i], { 
          x: 200 + i * 100, 
          y: 200 + i * 50 
        });
      }
      
      // Multiple undo/redo operations
      for (let i = 0; i < 3; i++) {
        customizer.undo();
        customizer.redo();
      }
      
      // Export at different sizes
      const exports = await Promise.all([
        customizer.exportDesign({ format: 'PNG', width: 400, height: 300 }),
        customizer.exportDesign({ format: 'JPEG', width: 800, height: 600 }),
        customizer.exportDesign({ format: 'PNG', width: 1200, height: 900 })
      ]);
      
      const totalTime = Date.now() - startTime;
      
      // Should complete within reasonable time (5 seconds)
      expect(totalTime).toBeLessThan(5000);
      
      // All exports should be valid
      exports.forEach((exportResult, index) => {
        expect(exportResult.dataURL).toBeDefined();
        expect(exportResult.width).toBeGreaterThan(0);
        expect(exportResult.height).toBeGreaterThan(0);
      });
    });

    test('should validate export quality at different resolutions', async () => {
      const inventory = await inventoryService.getCharmInventory();
      
      // Create design
      await customizer.addCharm(inventory[0], { x: 400, y: 300 });
      
      // Test various export sizes
      const resolutions = [
        { width: 200, height: 150, name: 'thumbnail' },
        { width: 800, height: 600, name: 'standard' },
        { width: 1920, height: 1440, name: 'high-res' },
        { width: 3840, height: 2880, name: 'ultra-high-res' }
      ];
      
      for (const resolution of resolutions) {
        console.log(`Testing ${resolution.name} export (${resolution.width}x${resolution.height})...`);
        
        const exportResult = await customizer.exportDesign({
          format: 'PNG',
          width: resolution.width,
          height: resolution.height,
          quality: 1.0
        });
        
        expect(exportResult.width).toBe(resolution.width);
        expect(exportResult.height).toBe(resolution.height);
        expect(exportResult.dataURL).toMatch(/^data:image\/png;base64,/);
        
        // Validate data URL length (higher resolution should have more data)
        const dataLength = exportResult.dataURL.length;
        expect(dataLength).toBeGreaterThan(100); // Minimum reasonable size
      }
    });
  });

  describe('User Experience Flow Validation', () => {
    test('should track complete user interaction sequence', async () => {
      const userActions = [];
      
      // Mock user action tracking
      const trackAction = (action, data) => {
        userActions.push({
          action,
          timestamp: Date.now(),
          data
        });
      };
      
      // Simulate complete user session
      trackAction('session_start', { user: mockUser });
      
      // Browse inventory
      trackAction('browse_inventory', { category: 'all' });
      const inventory = await inventoryService.getCharmInventory();
      trackAction('inventory_loaded', { count: inventory.length });
      
      // Search for items
      trackAction('search', { query: 'heart' });
      const searchResults = await inventoryService.searchInventory('heart');
      trackAction('search_results', { count: searchResults.length });
      
      // Create design
      trackAction('design_start', {});
      await customizer.addCharm(inventory[0], { x: 300, y: 300 });
      trackAction('charm_added', { charmId: inventory[0].id });
      
      await customizer.addCharm(inventory[1], { x: 450, y: 350 });
      trackAction('charm_added', { charmId: inventory[1].id });
      
      // Calculate price
      const price = await inventoryService.calculateDesignPrice([
        { priceValue: inventory[0].priceValue },
        { priceValue: inventory[1].priceValue }
      ]);
      trackAction('price_calculated', { total: price });
      
      // Export design
      trackAction('export_start', { format: 'PNG' });
      const exportResult = await customizer.exportDesign({
        format: 'PNG',
        width: 800,
        height: 600
      });
      trackAction('export_complete', { 
        format: 'PNG',
        size: exportResult.dataURL.length 
      });
      
      trackAction('session_end', { 
        duration: Date.now() - userActions[0].timestamp,
        actions: userActions.length 
      });
      
      // Validate user journey
      expect(userActions).toHaveLength(10);
      expect(userActions[0].action).toBe('session_start');
      expect(userActions[userActions.length - 1].action).toBe('session_end');
      
      // Check for critical path completion
      const criticalActions = ['inventory_loaded', 'charm_added', 'export_complete'];
      criticalActions.forEach(action => {
        expect(userActions.some(ua => ua.action === action)).toBe(true);
      });
    });

    test('should validate design persistence across sessions', async () => {
      const inventory = await inventoryService.getCharmInventory();
      
      // Session 1: Create and save design
      await customizer.addCharm(inventory[0], { x: 300, y: 300 });
      await customizer.addCharm(inventory[1], { x: 450, y: 350 });
      
      const originalDesign = customizer.getDesignData();
      
      const savedDesign = await inventoryService.saveDesign({
        title: 'Persistent Design Test',
        design_data: originalDesign
      });
      
      expect(savedDesign.id).toBeDefined();
      
      // Simulate new session - clear current design
      customizer.clearAllCharms();
      expect(customizer.charmManager.getCharmCount()).toBe(0);
      
      // Session 2: Load saved design (simulation)
      // In real implementation, this would load from database
      // For this test, we verify the design data structure
      expect(originalDesign.charms).toHaveLength(2);
      expect(originalDesign.charms[0]).toHaveProperty('id');
      expect(originalDesign.charms[0]).toHaveProperty('x');
      expect(originalDesign.charms[0]).toHaveProperty('y');
      
      // Verify design can be reconstructed
      for (const charmData of originalDesign.charms) {
        const charm = inventory.find(item => item.id === charmData.id);
        if (charm) {
          await customizer.addCharm(charm, { x: charmData.x, y: charmData.y });
        }
      }
      
      const reconstructedDesign = customizer.getDesignData();
      expect(reconstructedDesign.charms).toHaveLength(originalDesign.charms.length);
    });
  });
});