/**
 * JewelryCustomizer Unit Tests
 * Tests the main application controller class
 */

import JewelryCustomizer from '../../../src/js/core/JewelryCustomizer.js';
import { mockCharms, mockNecklaces, mockCanvasConfig, createMockDOM } from '../../fixtures/testData.js';

// Mock Konva
jest.mock('konva', () => require('../../mocks/konvaMock.js'));

// Mock the import modules
jest.mock('../../../src/js/core/CharmManager.js', () => {
  const mockCharmManager = jest.fn().mockImplementation(() => ({
    addCharm: jest.fn().mockResolvedValue({ id: () => 'mock-charm' }),
    removeCharm: jest.fn().mockReturnValue(true),
    clearAll: jest.fn(),
    getCharmCount: jest.fn().mockReturnValue(0),
    getState: jest.fn().mockReturnValue({}),
    loadState: jest.fn(),
    setAttachmentZones: jest.fn(),
    showSelection: jest.fn(),
    hideSelection: jest.fn(),
    getCharmData: jest.fn().mockReturnValue([]),
    onCharmPlaced: null,
    onCharmMoved: null,
    onCharmSelected: null,
    onError: null
  }));
  
  // Return the mock constructor
  return mockCharmManager;
});

jest.mock('../../../src/js/core/StateManager.js', () => {
  const mockStateManager = jest.fn().mockImplementation(() => ({
    saveState: jest.fn(),
    undo: jest.fn().mockReturnValue(null),
    redo: jest.fn().mockReturnValue(null),
    canUndo: jest.fn().mockReturnValue(false),
    canRedo: jest.fn().mockReturnValue(false)
  }));
  
  // Return the mock constructor
  return mockStateManager;
});

jest.mock('../../../src/js/core/ExportManager.js', () => {
  const mockExportManager = jest.fn().mockImplementation(() => ({
    exportDesign: jest.fn().mockResolvedValue('mock-export-url')
  }));
  
  // Return the mock constructor
  return mockExportManager;
});

jest.mock('../../../src/js/utils/ImageLoader.js', () => {
  const mockImageLoader = jest.fn().mockImplementation(() => ({
    loadImage: jest.fn().mockResolvedValue({
      width: 100,
      height: 100,
      src: 'mock-image-url'
    })
  }));
  
  // Return the mock constructor
  return mockImageLoader;
});

jest.mock('../../../src/js/utils/images.js', () => ({
  necklaceImages: {
    plainChain: 'mock-necklace-image.png'
  }
}));

describe('JewelryCustomizer', () => {
  let customizer;
  let mockDOM;

  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = '';
    
    // Create mock DOM elements
    mockDOM = createMockDOM();
    
    // Clear all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    if (customizer) {
      customizer.destroy();
    }
    document.body.innerHTML = '';
  });

  describe('Constructor', () => {
    test('should initialize with default options', () => {
      customizer = new JewelryCustomizer('jewelry-customizer');
      
      expect(customizer.container).toBe(mockDOM.container);
      expect(customizer.options.width).toBe(1000);
      expect(customizer.options.height).toBe(750);
      expect(customizer.options.backgroundColor).toBe('#ffffff');
      expect(customizer.options.maxCharms).toBe(12);
    });

    test('should accept custom options', () => {
      const customOptions = {
        width: 800,
        height: 600,
        maxCharms: 8,
        backgroundColor: '#f0f0f0'
      };

      customizer = new JewelryCustomizer('jewelry-customizer', customOptions);
      
      expect(customizer.options.width).toBe(800);
      expect(customizer.options.height).toBe(600);
      expect(customizer.options.maxCharms).toBe(8);
      expect(customizer.options.backgroundColor).toBe('#f0f0f0');
    });

    test('should throw error if container not found', () => {
      expect(() => {
        new JewelryCustomizer('non-existent-container');
      }).toThrow('Container with id "non-existent-container" not found');
    });
  });

  describe('Initialization', () => {
    beforeEach(async () => {
      customizer = new JewelryCustomizer('jewelry-customizer', mockCanvasConfig);
      // Initialize the customizer
      await customizer.init();
    });

    test('should create Konva stage with correct dimensions', () => {
      expect(customizer.stage).toBeDefined();
      // The stage uses responsive dimensions, so it may not exactly match config
      // but should be properly initialized with reasonable dimensions
      expect(customizer.stage.width()).toBeGreaterThan(0);
      expect(customizer.stage.height()).toBeGreaterThan(0);
      expect(customizer.stage.width()).toBeLessThanOrEqual(mockCanvasConfig.width);
      expect(customizer.stage.height()).toBeLessThanOrEqual(mockCanvasConfig.height);
    });

    test('should create three layers in correct order', () => {
      expect(customizer.backgroundLayer).toBeDefined();
      expect(customizer.charmLayer).toBeDefined();
      expect(customizer.uiLayer).toBeDefined();
      
      // Check that layers were added to stage
      expect(customizer.stage.add).toHaveBeenCalledTimes(3);
    });

    test('should initialize all managers', () => {
      expect(customizer.charmManager).toBeDefined();
      expect(customizer.stateManager).toBeDefined();
      expect(customizer.exportManager).toBeDefined();
      expect(customizer.imageLoader).toBeDefined();
    });

    test('should load default necklace', () => {
      expect(customizer.imageLoader.loadImage).toHaveBeenCalled();
      expect(customizer.currentNecklace).toBeDefined();
    });
  });

  describe('Charm Management', () => {
    beforeEach(async () => {
      customizer = new JewelryCustomizer('jewelry-customizer', mockCanvasConfig);
      await customizer.init();
    });

    test('should add charm successfully', async () => {
      const charmData = mockCharms.charmOne;
      const position = { x: 100, y: 100 };

      const result = await customizer.addCharm(charmData, position);

      expect(customizer.charmManager.addCharm).toHaveBeenCalledWith(charmData, position);
      expect(customizer.stateManager.saveState).toHaveBeenCalled();
      expect(result).toBeDefined();
    });

    test('should prevent adding charms beyond maximum limit', async () => {
      // Mock charm count to be at maximum
      customizer.charmManager.getCharmCount.mockReturnValue(mockCanvasConfig.maxCharms);
      
      const charmData = mockCharms.charmOne;
      const position = { x: 100, y: 100 };

      const result = await customizer.addCharm(charmData, position);

      expect(result).toBeNull();
      expect(customizer.charmManager.addCharm).not.toHaveBeenCalled();
    });

    test('should remove charm successfully', () => {
      const charmId = 'test-charm-id';
      customizer.charmManager.removeCharm.mockReturnValue(true);

      const result = customizer.removeCharm(charmId);

      expect(customizer.charmManager.removeCharm).toHaveBeenCalledWith(charmId);
      expect(customizer.stateManager.saveState).toHaveBeenCalled();
      expect(result).toBe(true);
    });

    test('should clear all charms', () => {
      customizer.clearAllCharms();

      expect(customizer.charmManager.clearAll).toHaveBeenCalled();
      expect(customizer.stateManager.saveState).toHaveBeenCalled();
    });
  });

  describe('Necklace Management', () => {
    beforeEach(async () => {
      customizer = new JewelryCustomizer('jewelry-customizer', mockCanvasConfig);
      await customizer.init();
    });

    test('should load necklace successfully', async () => {
      const necklaceData = mockNecklaces.classicChain;

      await customizer.loadNecklace(necklaceData);

      expect(customizer.imageLoader.loadImage).toHaveBeenCalledWith(necklaceData.imageUrl);
      expect(customizer.currentNecklace).toBeDefined();
      expect(customizer.charmManager.setAttachmentZones).toHaveBeenCalled();
    });

    test('should clear previous necklace before loading new one', async () => {
      const necklaceData = mockNecklaces.classicChain;

      await customizer.loadNecklace(necklaceData);

      expect(customizer.backgroundLayer.destroyChildren).toHaveBeenCalled();
    });
  });

  describe('Selection Management', () => {
    beforeEach(async () => {
      customizer = new JewelryCustomizer('jewelry-customizer', mockCanvasConfig);
      await customizer.init();
    });

    test('should select charm', () => {
      const mockCharm = { id: () => 'test-charm' };

      customizer.selectCharm(mockCharm);

      expect(customizer.selectedCharm).toBe(mockCharm);
      expect(customizer.charmManager.showSelection).toHaveBeenCalledWith(mockCharm);
    });

    test('should deselect charm', () => {
      const mockCharm = { id: () => 'test-charm' };
      customizer.selectedCharm = mockCharm;

      customizer.deselectCharm();

      expect(customizer.selectedCharm).toBeNull();
      expect(customizer.charmManager.hideSelection).toHaveBeenCalled();
    });

    test('should deselect previous charm when selecting new one', () => {
      const mockCharm1 = { id: () => 'test-charm-1' };
      const mockCharm2 = { id: () => 'test-charm-2' };
      
      customizer.selectedCharm = mockCharm1;
      customizer.selectCharm(mockCharm2);

      expect(customizer.selectedCharm).toBe(mockCharm2);
    });
  });

  describe('State Management', () => {
    beforeEach(async () => {
      customizer = new JewelryCustomizer('jewelry-customizer', mockCanvasConfig);
      await customizer.init();
    });

    test('should save state', () => {
      customizer.saveState();

      expect(customizer.charmManager.getState).toHaveBeenCalled();
      expect(customizer.stateManager.saveState).toHaveBeenCalled();
    });

    test('should undo when state available', () => {
      const mockState = { charms: [] };
      customizer.stateManager.undo.mockReturnValue(mockState);

      customizer.undo();

      expect(customizer.stateManager.undo).toHaveBeenCalled();
      expect(customizer.charmManager.loadState).toHaveBeenCalledWith(mockState);
    });

    test('should not undo when no state available', () => {
      customizer.stateManager.undo.mockReturnValue(null);

      customizer.undo();

      expect(customizer.charmManager.loadState).not.toHaveBeenCalled();
    });

    test('should redo when state available', () => {
      const mockState = { charms: [] };
      customizer.stateManager.redo.mockReturnValue(mockState);

      customizer.redo();

      expect(customizer.stateManager.redo).toHaveBeenCalled();
      expect(customizer.charmManager.loadState).toHaveBeenCalledWith(mockState);
    });

    test('should check undo/redo availability', () => {
      customizer.stateManager.canUndo.mockReturnValue(true);
      customizer.stateManager.canRedo.mockReturnValue(false);

      expect(customizer.canUndo()).toBe(true);
      expect(customizer.canRedo()).toBe(false);
    });
  });

  describe('Design Data Management', () => {
    beforeEach(async () => {
      customizer = new JewelryCustomizer('jewelry-customizer', mockCanvasConfig);
      await customizer.init();
    });

    test('should get current design data', () => {
      const mockCharmData = [{ id: 'charm-1', x: 100, y: 100 }];
      customizer.charmManager.getCharmData.mockReturnValue(mockCharmData);
      customizer.currentNecklace = mockNecklaces.classicChain;

      const designData = customizer.getDesignData();

      expect(designData.necklace.id).toBe(mockNecklaces.classicChain.id);
      expect(designData.charms).toBe(mockCharmData);
      expect(designData.timestamp).toBeDefined();
    });

    test('should load design data', async () => {
      const designData = {
        necklace: mockNecklaces.classicChain,
        charms: [mockCharms.charmOne]
      };

      await customizer.loadDesign(designData);

      expect(customizer.charmManager.clearAll).toHaveBeenCalled();
      expect(customizer.charmManager.addCharm).toHaveBeenCalled();
    });
  });

  describe('Export Functionality', () => {
    beforeEach(async () => {
      customizer = new JewelryCustomizer('jewelry-customizer', mockCanvasConfig);
      await customizer.init();
    });

    test('should export design', async () => {
      const exportOptions = { format: 'png', quality: 0.9 };

      const result = await customizer.exportDesign(exportOptions);

      expect(customizer.exportManager.exportDesign).toHaveBeenCalledWith(exportOptions);
      expect(result).toBe('mock-export-url');
    });

    test('should handle export errors gracefully', async () => {
      customizer.exportManager.exportDesign.mockRejectedValue(new Error('Export failed'));

      const result = await customizer.exportDesign();

      expect(result).toBeNull();
    });
  });

  describe('Event Handling', () => {
    beforeEach(async () => {
      customizer = new JewelryCustomizer('jewelry-customizer', mockCanvasConfig);
      await customizer.init();
    });

    test('should handle keyboard shortcuts', () => {
      const mockCharm = { id: () => 'test-charm' };
      customizer.selectedCharm = mockCharm;

      // Test Delete key
      const deleteEvent = new KeyboardEvent('keydown', { key: 'Delete' });
      document.dispatchEvent(deleteEvent);

      expect(customizer.charmManager.removeCharm).toHaveBeenCalledWith('test-charm');
    });

    test('should handle undo/redo shortcuts', () => {
      // Test Ctrl+Z (undo)
      const undoEvent = new KeyboardEvent('keydown', { key: 'z', ctrlKey: true });
      document.dispatchEvent(undoEvent);

      expect(customizer.stateManager.undo).toHaveBeenCalled();

      // Test Ctrl+Shift+Z (redo)
      const redoEvent = new KeyboardEvent('keydown', { key: 'z', ctrlKey: true, shiftKey: true });
      document.dispatchEvent(redoEvent);

      expect(customizer.stateManager.redo).toHaveBeenCalled();
    });

    test('should ignore keyboard events when typing in inputs', () => {
      const input = document.createElement('input');
      document.body.appendChild(input);
      input.focus();

      const deleteEvent = new KeyboardEvent('keydown', { key: 'Delete' });
      Object.defineProperty(deleteEvent, 'target', { value: input });
      document.dispatchEvent(deleteEvent);

      expect(customizer.charmManager.removeCharm).not.toHaveBeenCalled();
    });
  });

  describe('Responsive Behavior', () => {
    beforeEach(async () => {
      customizer = new JewelryCustomizer('jewelry-customizer', mockCanvasConfig);
      await customizer.init();
    });

    test('should handle window resize', () => {
      // Mock container dimensions
      jest.spyOn(customizer.container, 'getBoundingClientRect').mockReturnValue({
        width: 800,
        height: 600
      });

      customizer.handleResize();

      expect(customizer.stage.width).toHaveBeenCalled();
      expect(customizer.stage.height).toHaveBeenCalled();
      expect(customizer.stage.draw).toHaveBeenCalled();
    });

    test('should calculate image scale correctly', () => {
      const mockImage = { width: 200, height: 150 };
      const maxWidth = 400;
      const maxHeight = 300;

      const scale = customizer.calculateImageScale(mockImage, maxWidth, maxHeight);

      expect(scale).toBe(1.8); // (300 * 0.9) / 150 = 1.8
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      customizer = new JewelryCustomizer('jewelry-customizer', mockCanvasConfig);
      await customizer.init();
    });

    test('should handle charm addition errors', async () => {
      customizer.charmManager.addCharm.mockRejectedValue(new Error('Add charm failed'));

      const result = await customizer.addCharm(mockCharms.charmOne, { x: 100, y: 100 });

      expect(result).toBeNull();
    });

    test('should handle necklace loading errors', async () => {
      customizer.imageLoader.loadImage.mockRejectedValue(new Error('Image load failed'));

      // Should not throw
      await expect(customizer.loadNecklace(mockNecklaces.classicChain)).resolves.not.toThrow();
    });

    test('should call error callback when provided', async () => {
      const mockErrorCallback = jest.fn();
      customizer.onError = mockErrorCallback;

      customizer.charmManager.addCharm.mockRejectedValue(new Error('Test error'));
      await customizer.addCharm(mockCharms.charmOne, { x: 100, y: 100 });

      expect(mockErrorCallback).toHaveBeenCalled();
    });
  });

  describe('Cleanup', () => {
    test('should destroy properly', () => {
      customizer = new JewelryCustomizer('jewelry-customizer', mockCanvasConfig);
      
      const removeEventListenerSpy = jest.spyOn(window, 'removeEventListener');

      customizer.destroy();

      expect(customizer.stage.destroy).toHaveBeenCalled();
      expect(removeEventListenerSpy).toHaveBeenCalledWith('resize', expect.any(Function));
    });
  });
});