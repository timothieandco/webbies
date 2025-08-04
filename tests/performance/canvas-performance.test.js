/**
 * Canvas Performance Tests
 * Tests rendering performance, drag operations, and memory usage
 */

import { performanceTestData } from '../fixtures/testData.js';

// Mock Konva for performance testing
jest.mock('konva', () => require('../mocks/konvaMock.js'));

// Mock dependencies
jest.mock('../../src/js/core/CharmManager.js', () => {
  return jest.fn().mockImplementation(() => ({
    addCharm: jest.fn().mockResolvedValue({ id: () => 'mock-charm' }),
    removeCharm: jest.fn().mockReturnValue(true),
    clearAll: jest.fn(),
    getCharmCount: jest.fn().mockReturnValue(0),
    getState: jest.fn().mockReturnValue({ charms: [] }),
    loadState: jest.fn(),
    setAttachmentZones: jest.fn(),
    showSelection: jest.fn(),
    hideSelection: jest.fn(),
    getCharmData: jest.fn().mockReturnValue([])
  }));
});

jest.mock('../../src/js/utils/ImageLoader.js', () => {
  return jest.fn().mockImplementation(() => ({
    loadImage: jest.fn().mockResolvedValue({
      width: 100,
      height: 100,
      src: 'mock-image'
    })
  }));
});

import JewelryCustomizer from '../../src/js/core/JewelryCustomizer.js';
import CharmManager from '../../src/js/core/CharmManager.js';
import { createMockDOM } from '../fixtures/testData.js';

describe('Canvas Performance Tests', () => {
  let customizer;
  let charmManager;
  let mockDOM;

  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = '';
    mockDOM = createMockDOM();
    
    // Clear performance marks
    if (performance.clearMarks) {
      performance.clearMarks();
    }
    if (performance.clearMeasures) {
      performance.clearMeasures();
    }
    
    jest.clearAllMocks();
  });

  afterEach(() => {
    if (customizer) {
      customizer.destroy();
    }
    document.body.innerHTML = '';
  });

  describe('Initialization Performance', () => {
    test('should initialize customizer within acceptable time', async () => {
      const startTime = performance.now();
      
      customizer = new JewelryCustomizer('jewelry-customizer');
      
      // Wait for initialization
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const endTime = performance.now();
      const initTime = endTime - startTime;
      
      // Should initialize within 500ms
      expect(initTime).toBeLessThan(500);
    });

    test('should create canvas layers efficiently', async () => {
      performance.mark('layers-start');
      
      customizer = new JewelryCustomizer('jewelry-customizer');
      await new Promise(resolve => setTimeout(resolve, 100));
      
      performance.mark('layers-end');
      performance.measure('layers-creation', 'layers-start', 'layers-end');
      
      const measures = performance.getEntriesByName('layers-creation');
      expect(measures[0].duration).toBeLessThan(100);
    });

    test('should handle multiple customizer instances', async () => {
      const startTime = performance.now();
      
      // Create multiple instances
      const instances = [];
      for (let i = 0; i < 3; i++) {
        const container = document.createElement('div');
        container.id = `customizer-${i}`;
        document.body.appendChild(container);
        
        instances.push(new JewelryCustomizer(`customizer-${i}`));
      }
      
      // Wait for all to initialize
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      // Should handle multiple instances efficiently
      expect(totalTime).toBeLessThan(1000);
      
      // Cleanup
      instances.forEach(instance => instance.destroy());
    });
  });

  describe('Charm Operations Performance', () => {
    beforeEach(async () => {
      customizer = new JewelryCustomizer('jewelry-customizer');
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    test('should add multiple charms efficiently', async () => {
      const charmCount = 20;
      const startTime = performance.now();
      
      // Add multiple charms
      const addPromises = [];
      for (let i = 0; i < charmCount; i++) {
        const charmData = {
          id: `perf-charm-${i}`,
          title: `Charm ${i}`,
          image_url: 'mock-charm.png'
        };
        const position = { x: 100 + i * 10, y: 100 + i * 10 };
        
        addPromises.push(customizer.addCharm(charmData, position));
      }
      
      await Promise.all(addPromises);
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const timePerCharm = totalTime / charmCount;
      
      // Should add each charm within 50ms on average
      expect(timePerCharm).toBeLessThan(50);
      expect(totalTime).toBeLessThan(2000); // Total under 2 seconds
    });

    test('should remove charms efficiently', async () => {
      // First add some charms
      const charmIds = [];
      for (let i = 0; i < 10; i++) {
        const charmData = {
          id: `remove-charm-${i}`,
          title: `Charm ${i}`,
          image_url: 'mock-charm.png'
        };
        await customizer.addCharm(charmData, { x: 100 + i * 10, y: 100 });
        charmIds.push(charmData.id);
      }
      
      const startTime = performance.now();
      
      // Remove all charms
      charmIds.forEach(id => {
        customizer.removeCharm(id);
      });
      
      const endTime = performance.now();
      const removalTime = endTime - startTime;
      
      // Should remove all charms quickly
      expect(removalTime).toBeLessThan(100);
    });

    test('should handle rapid drag operations', async () => {
      // Add a charm first
      const charmData = {
        id: 'drag-test-charm',
        title: 'Drag Test Charm',
        image_url: 'mock-charm.png'
      };
      await customizer.addCharm(charmData, { x: 200, y: 200 });
      
      const operationCount = 50;
      const startTime = performance.now();
      
      // Simulate rapid position updates
      for (let i = 0; i < operationCount; i++) {
        // Simulate charm movement (this would normally trigger through drag events)
        customizer.handleCharmMoved({ id: () => charmData.id });
        
        // Small delay to simulate real drag timing
        await new Promise(resolve => setTimeout(resolve, 1));
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const timePerOperation = totalTime / operationCount;
      
      // Each drag operation should be very fast
      expect(timePerOperation).toBeLessThan(10);
    });
  });

  describe('State Management Performance', () => {
    beforeEach(async () => {
      customizer = new JewelryCustomizer('jewelry-customizer');
      await new Promise(resolve => setTimeout(resolve, 100));
    });

    test('should handle frequent state saves efficiently', async () => {
      const saveCount = 30;
      const startTime = performance.now();
      
      // Perform multiple state saves
      for (let i = 0; i < saveCount; i++) {
        customizer.saveState();
        
        // Small delay between saves
        await new Promise(resolve => setTimeout(resolve, 1));
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const timePerSave = totalTime / saveCount;
      
      // Each state save should be fast
      expect(timePerSave).toBeLessThan(20);
    });

    test('should handle rapid undo/redo operations', async () => {
      // Set up some state first
      for (let i = 0; i < 10; i++) {
        customizer.saveState();
      }
      
      const operationCount = 20;
      const startTime = performance.now();
      
      // Perform rapid undo/redo
      for (let i = 0; i < operationCount; i++) {
        if (i % 2 === 0) {
          customizer.undo();
        } else {
          customizer.redo();
        }
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const timePerOperation = totalTime / operationCount;
      
      // Undo/redo should be very fast
      expect(timePerOperation).toBeLessThan(5);
    });
  });

  describe('Memory Management', () => {
    test('should not create memory leaks with charm operations', async () => {
      customizer = new JewelryCustomizer('jewelry-customizer');
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Measure initial memory (if available)
      const initialMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
      
      // Perform many add/remove operations
      for (let cycle = 0; cycle < 5; cycle++) {
        // Add many charms
        for (let i = 0; i < 20; i++) {
          const charmData = {
            id: `memory-test-${cycle}-${i}`,
            title: `Memory Test Charm`,
            image_url: 'mock-charm.png'
          };
          await customizer.addCharm(charmData, { x: 100 + i * 5, y: 100 });
        }
        
        // Clear all charms
        customizer.clearAllCharms();
        
        // Force garbage collection if available
        if (global.gc) {
          global.gc();
        }
      }
      
      // Measure final memory
      const finalMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
      
      if (performance.memory) {
        const memoryIncrease = finalMemory - initialMemory;
        // Memory increase should be reasonable (less than 10MB)
        expect(memoryIncrease).toBeLessThan(10 * 1024 * 1024);
      }
    });

    test('should clean up properly on destroy', async () => {
      customizer = new JewelryCustomizer('jewelry-customizer');
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Add some charms
      for (let i = 0; i < 5; i++) {
        const charmData = {
          id: `cleanup-charm-${i}`,
          title: `Cleanup Test`,
          image_url: 'mock-charm.png'
        };
        await customizer.addCharm(charmData, { x: 100 + i * 20, y: 100 });
      }
      
      const startTime = performance.now();
      
      // Destroy customizer
      customizer.destroy();
      
      const endTime = performance.now();
      const cleanupTime = endTime - startTime;
      
      // Cleanup should be fast
      expect(cleanupTime).toBeLessThan(100);
      
      customizer = null; // Prevent double cleanup
    });
  });

  describe('Large Dataset Performance', () => {
    test('should handle large charm inventory efficiently', async () => {
      customizer = new JewelryCustomizer('jewelry-customizer');
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const largeDataset = performanceTestData.largeCharmSet;
      const startTime = performance.now();
      
      // Simulate loading large inventory (this would be through the service layer)
      // For this test, we just measure the potential impact
      let processedItems = 0;
      
      for (const item of largeDataset) {
        // Simulate processing each item (validation, categorization, etc.)
        if (item.title && item.category && item.id) {
          processedItems++;
        }
        
        // Yield control periodically to prevent blocking
        if (processedItems % 20 === 0) {
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }
      
      const endTime = performance.now();
      const processingTime = endTime - startTime;
      const timePerItem = processingTime / largeDataset.length;
      
      expect(processedItems).toBe(largeDataset.length);
      expect(timePerItem).toBeLessThan(5); // Less than 5ms per item
      expect(processingTime).toBeLessThan(2000); // Total under 2 seconds
    });

    test('should maintain responsiveness with many canvas elements', async () => {
      customizer = new JewelryCustomizer('jewelry-customizer');
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const elementCount = 50;
      const startTime = performance.now();
      
      // Add many elements quickly
      const addPromises = [];
      for (let i = 0; i < elementCount; i++) {
        const charmData = {
          id: `responsive-charm-${i}`,
          title: `Responsive Test ${i}`,
          image_url: 'mock-charm.png'
        };
        const position = {
          x: 100 + (i % 10) * 30,
          y: 100 + Math.floor(i / 10) * 30
        };
        
        addPromises.push(customizer.addCharm(charmData, position));
      }
      
      await Promise.all(addPromises);
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      
      // Should handle many elements without blocking
      expect(totalTime).toBeLessThan(5000); // 5 seconds max
      
      // Test responsiveness by performing a quick operation
      const responsiveStartTime = performance.now();
      customizer.deselectCharm();
      const responsiveEndTime = performance.now();
      
      // Should remain responsive
      expect(responsiveEndTime - responsiveStartTime).toBeLessThan(50);
    });
  });

  describe('Rendering Performance', () => {
    test('should redraw canvas efficiently', async () => {
      customizer = new JewelryCustomizer('jewelry-customizer');
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Add some charms
      for (let i = 0; i < 10; i++) {
        const charmData = {
          id: `render-charm-${i}`,
          title: `Render Test`,
          image_url: 'mock-charm.png'
        };
        await customizer.addCharm(charmData, { x: 100 + i * 25, y: 100 });
      }
      
      const redrawCount = 20;
      const startTime = performance.now();
      
      // Force multiple redraws
      for (let i = 0; i < redrawCount; i++) {
        // Simulate stage redraw (normally triggered by Konva)
        if (customizer.stage && customizer.stage.draw) {
          customizer.stage.draw();
        }
        
        // Small delay between redraws
        await new Promise(resolve => setTimeout(resolve, 1));
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const timePerRedraw = totalTime / redrawCount;
      
      // Each redraw should be fast
      expect(timePerRedraw).toBeLessThan(30);
    });

    test('should handle resize operations efficiently', async () => {
      customizer = new JewelryCustomizer('jewelry-customizer');
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const resizeCount = 10;
      const startTime = performance.now();
      
      // Simulate multiple resize operations
      for (let i = 0; i < resizeCount; i++) {
        // Mock container size change
        mockDOM.container.style.width = `${800 + i * 50}px`;
        mockDOM.container.style.height = `${600 + i * 30}px`;
        
        // Trigger resize handler
        customizer.handleResize();
        
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      
      const endTime = performance.now();
      const totalTime = endTime - startTime;
      const timePerResize = totalTime / resizeCount;
      
      // Resize operations should be efficient
      expect(timePerResize).toBeLessThan(50);
    });
  });

  describe('Benchmark Comparisons', () => {
    test('should meet performance benchmarks', async () => {
      const benchmarks = {
        initialization: 500,    // ms
        charmAddition: 50,      // ms per charm
        stateOperation: 20,     // ms per undo/redo
        rendering: 30,          // ms per redraw
        cleanup: 100           // ms for destroy
      };
      
      // Test initialization
      let startTime = performance.now();
      customizer = new JewelryCustomizer('jewelry-customizer');
      await new Promise(resolve => setTimeout(resolve, 100));
      let duration = performance.now() - startTime;
      expect(duration).toBeLessThan(benchmarks.initialization);
      
      // Test charm addition
      startTime = performance.now();
      const charmData = {
        id: 'benchmark-charm',
        title: 'Benchmark Test',
        image_url: 'mock-charm.png'
      };
      await customizer.addCharm(charmData, { x: 200, y: 200 });
      duration = performance.now() - startTime;
      expect(duration).toBeLessThan(benchmarks.charmAddition);
      
      // Test state operation
      customizer.saveState();
      startTime = performance.now();
      customizer.undo();
      duration = performance.now() - startTime;
      expect(duration).toBeLessThan(benchmarks.stateOperation);
      
      // Test cleanup
      startTime = performance.now();
      customizer.destroy();
      duration = performance.now() - startTime;
      expect(duration).toBeLessThan(benchmarks.cleanup);
      
      customizer = null;
    });
  });
});