/**
 * Simplified Integrated Main Application Bootstrap Tests
 * Tests the backend-integrated jewelry customizer application functionality
 */

// Mock CSS and imports
jest.mock('../../../src/css/main.css', () => ({}), { virtual: true });
jest.mock('../../../src/js/debug/dragTest.js', () => ({}), { virtual: true });

// Mock dependencies
const mockCustomizer = {
  isLoading: false,
  stage: {
    width: jest.fn(() => 800),
    height: jest.fn(() => 600)
  },
  charmManager: {
    getCharmCount: jest.fn(() => 0),
    getCharmData: jest.fn(() => [])
  },
  exportManager: {
    downloadExport: jest.fn()
  },
  addCharm: jest.fn(),
  undo: jest.fn(),
  redo: jest.fn(),
  clearAllCharms: jest.fn(),
  canUndo: jest.fn(() => false),
  canRedo: jest.fn(() => false),
  getDesignData: jest.fn(() => ({ charms: [] })),
  loadDesign: jest.fn(),
  exportDesign: jest.fn(() => Promise.resolve({
    dataURL: 'data:image/png;base64,mock',
    width: 400,
    height: 300,
    fileSize: '50KB'
  })),
  onCharmPlaced: null,
  onCharmRemoved: null,
  onStateChanged: null,
  onError: null
};

jest.mock('../../../src/js/core/JewelryCustomizer.js', () => {
  return jest.fn().mockImplementation(() => mockCustomizer);
});

// Mock API and services
const mockAPI = {
  getInventory: jest.fn(),
  subscribe: jest.fn()
};

const mockInventoryService = {
  initialize: jest.fn(),
  isReady: jest.fn(() => true),
  getCharmInventory: jest.fn(() => Promise.resolve([])),
  getCategories: jest.fn(() => Promise.resolve([])),
  saveDesign: jest.fn(() => Promise.resolve({ id: 'design-1' })),
  subscribe: jest.fn()
};

const mockInventoryImporter = {
  initialize: jest.fn()
};

jest.mock('../../../src/js/services/InventoryAPI.js', () => ({
  initializeAPI: jest.fn(() => mockAPI)
}));

jest.mock('../../../src/js/services/InventoryService.js', () => ({
  default: mockInventoryService
}));

jest.mock('../../../src/js/utils/InventoryImporter.js', () => ({
  default: mockInventoryImporter
}));

// Mock configuration
jest.mock('../../../src/js/config/supabase.js', () => ({
  SUPABASE_CONFIG: {
    URL: 'https://test-project.supabase.co',
    ANON_KEY: 'test-anon-key'
  }
}));

// Mock image imports
jest.mock('../../../src/js/utils/images.js', () => ({
  charmImages: {
    charmOne: 'mock-charm-1.png',
    charmTwo: 'mock-charm-2.png',
    charmThree: 'mock-charm-3.png',
    charmFour: 'mock-charm-4.png',
    charmFive: 'mock-charm-5.png',
    charmSix: 'mock-charm-6.png',
    charmSeven: 'mock-charm-7.png',
    charmEight: 'mock-charm-8.png'
  },
  necklaceImages: {
    plainChain: 'mock-necklace.png'
  }
}));

// Mock debug module
jest.mock('../../../src/js/debug/dragTest.js', () => ({}));

// Mock DOM elements
const createMockElement = (id) => {
  const element = document.createElement('div');
  element.id = id;
  element.addEventListener = jest.fn();
  element.style = {};
  element.disabled = false;
  element.textContent = '';
  element.innerHTML = '';
  element.appendChild = jest.fn();
  element.querySelectorAll = jest.fn(() => []);
  element.querySelector = jest.fn();
  element.dataset = {};
  return element;
};

const mockElements = {
  'jewelry-canvas': createMockElement('jewelry-canvas'),
  'charm-library': createMockElement('charm-library'),
  'export-modal': createMockElement('export-modal'),
  'inventory-status': createMockElement('inventory-status'),
  'undo-btn': createMockElement('undo-btn'),
  'redo-btn': createMockElement('redo-btn'),
  'clear-btn': createMockElement('clear-btn'),
  'save-btn': createMockElement('save-btn'),
  'export-btn': createMockElement('export-btn'),
  'import-data-btn': createMockElement('import-data-btn'),
  'modal-close': createMockElement('modal-close'),
  'cancel-export': createMockElement('cancel-export'),
  'confirm-export': createMockElement('confirm-export'),
  'retry-button': createMockElement('retry-button'),
  'charm-search': createMockElement('charm-search'),
  'export-preview': createMockElement('export-preview'),
  'charm-count': createMockElement('charm-count'),
  'total-price': createMockElement('total-price'),
  'necklace-thumb': createMockElement('necklace-thumb'),
  'category-filters': createMockElement('category-filters'),
  'app-message': createMockElement('app-message')
};

// Setup DOM mocks
global.document.getElementById = jest.fn((id) => mockElements[id] || null);
global.document.querySelectorAll = jest.fn((selector) => {
  if (selector === '.category-btn') {
    return [createMockElement('cat1'), createMockElement('cat2')];
  }
  if (selector === 'input[name="export-format"]') {
    const radio = createMockElement('format-radio');
    radio.checked = true;
    radio.value = 'png';
    return [radio];
  }
  return [];
});

global.document.createElement = jest.fn((tagName) => {
  const element = document.createElement(tagName);
  element.addEventListener = jest.fn();
  element.appendChild = jest.fn();
  element.style = {};
  element.dataset = {};
  element.className = '';
  element.innerHTML = '';
  element.textContent = '';
  return element;
});

global.document.body = {
  appendChild: jest.fn()
};

// Mock window methods
global.window.confirm = jest.fn(() => true);
global.window.localStorage = {
  getItem: jest.fn(),
  setItem: jest.fn()
};

global.location = {
  reload: jest.fn()
};

describe('JewelryCustomizerApp (main-integrated.js)', () => {
  let app;
  let JewelryCustomizer;

  beforeAll(() => {
    // Import the JewelryCustomizer constructor mock
    JewelryCustomizer = require('../../../src/js/core/JewelryCustomizer.js');
  });

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    
    // Reset customizer mock
    Object.keys(mockCustomizer).forEach(key => {
      if (typeof mockCustomizer[key] === 'function') {
        mockCustomizer[key].mockClear?.();
      }
    });

    // Reset service mocks
    mockInventoryService.initialize.mockResolvedValue();
    mockInventoryService.getCharmInventory.mockResolvedValue([]);
    mockInventoryService.getCategories.mockResolvedValue([]);
    mockInventoryImporter.initialize.mockResolvedValue();

    // Create new app instance
    app = global.window.JewelryApp;
  });

  describe('Constructor', () => {
    test('should initialize with integrated properties', () => {
      expect(app).toBeDefined();
      expect(app.customizer).toBe(null);
      expect(app.isInitialized).toBe(false);
      expect(app.inventoryLoaded).toBe(false);
      expect(app.useBackend).toBe(false);
      expect(app.currentInventory).toEqual([]);
      expect(app.currentCategories).toEqual([]);
    });

    test('should have sample charm data as fallback', () => {
      expect(app.sampleCharms).toHaveLength(8);
      expect(app.sampleCharms[0]).toHaveProperty('id');
      expect(app.sampleCharms[0]).toHaveProperty('name');
      expect(app.sampleCharms[0]).toHaveProperty('imageUrl');
    });
  });

  describe('Backend Integration Initialization', () => {
    test('should initialize backend integration successfully', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await app.initializeBackendIntegration();
      
      expect(app.useBackend).toBe(true);
      expect(mockInventoryService.initialize).toHaveBeenCalledWith({
        enableRealTime: true
      });
      expect(mockInventoryImporter.initialize).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('Backend integration initialized successfully');
      
      consoleSpy.mockRestore();
    });

    test('should fall back to sample data when backend fails', async () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      mockInventoryService.initialize.mockRejectedValue(new Error('Backend failed'));
      
      await app.initializeBackendIntegration();
      
      expect(app.useBackend).toBe(false);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Backend integration failed, falling back to sample data:',
        expect.any(Error)
      );
      
      consoleWarnSpy.mockRestore();
    });

    test('should skip backend when not configured', async () => {
      // Mock unconfigured backend
      const { SUPABASE_CONFIG } = require('../../../src/js/config/supabase.js');
      SUPABASE_CONFIG.URL = 'https://your-project.supabase.co';
      SUPABASE_CONFIG.ANON_KEY = 'your-supabase-anon-key';
      
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await app.initializeBackendIntegration();
      
      expect(app.useBackend).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Backend not configured, using sample data');
      
      // Restore config
      SUPABASE_CONFIG.URL = 'https://test-project.supabase.co';
      SUPABASE_CONFIG.ANON_KEY = 'test-anon-key';
      consoleSpy.mockRestore();
    });
  });

  describe('Inventory Data Management', () => {
    test('should load inventory from backend when available', async () => {
      const mockCharms = [
        {
          id: 'backend-charm-1',
          name: 'Backend Charm',
          imageUrl: 'backend-charm.png',
          price: '$25.00',
          priceValue: 25,
          category: 'charms',
          available: true
        }
      ];
      
      const mockCategories = [
        { name: 'charms', count: 1 }
      ];
      
      app.useBackend = true;
      mockInventoryService.getCharmInventory.mockResolvedValue(mockCharms);
      mockInventoryService.getCategories.mockResolvedValue(mockCategories);
      
      await app.loadInventoryData();
      
      expect(app.currentInventory).toEqual(mockCharms);
      expect(app.currentCategories).toEqual(mockCategories);
      expect(app.inventoryLoaded).toBe(true);
    });

    test('should fall back to sample data when backend has no inventory', async () => {
      app.useBackend = true;
      mockInventoryService.getCharmInventory.mockResolvedValue([]);
      
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await app.loadInventoryData();
      
      expect(app.currentInventory).toEqual(app.sampleCharms);
      expect(consoleSpy).toHaveBeenCalledWith('Using sample charm data');
      
      consoleSpy.mockRestore();
    });

    test('should use sample data when backend not available', async () => {
      app.useBackend = false;
      
      await app.loadInventoryData();
      
      expect(app.currentInventory).toEqual(app.sampleCharms);
      expect(app.inventoryLoaded).toBe(false);
    });

    test('should handle inventory loading errors', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      app.useBackend = true;
      mockInventoryService.getCharmInventory.mockRejectedValue(new Error('API Error'));
      
      await app.loadInventoryData();
      
      expect(app.currentInventory).toEqual(app.sampleCharms);
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to load inventory data:', expect.any(Error));
      
      consoleErrorSpy.mockRestore();
    });

    test('should load sample data correctly', () => {
      app.loadSampleData();
      
      expect(app.currentInventory).toEqual(app.sampleCharms);
      expect(app.inventoryLoaded).toBe(false);
      expect(app.currentCategories).toHaveLength(5); // all, symbols, animals, letters, birthstones
      expect(app.currentCategories[0].name).toBe('all');
    });
  });

  describe('Real-time Subscriptions', () => {
    test('should setup inventory subscriptions when backend enabled', () => {
      app.useBackend = true;
      
      app.setupInventorySubscriptions();
      
      expect(mockInventoryService.subscribe).toHaveBeenCalledWith('inventory-updated', expect.any(Function));
      expect(mockInventoryService.subscribe).toHaveBeenCalledWith('design-saved', expect.any(Function));
    });

    test('should skip subscriptions when backend disabled', () => {
      app.useBackend = false;
      
      app.setupInventorySubscriptions();
      
      expect(mockInventoryService.subscribe).not.toHaveBeenCalled();
    });

    test('should handle inventory update events', () => {
      app.useBackend = true;
      app.setupInventorySubscriptions();
      
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      // Get the callback function and simulate event
      const updateCallback = mockInventoryService.subscribe.mock.calls[0][1];
      updateCallback({ type: 'inventory-updated' });
      
      expect(consoleSpy).toHaveBeenCalledWith('Inventory updated:', { type: 'inventory-updated' });
      
      consoleSpy.mockRestore();
    });
  });

  describe('Enhanced Charm Management', () => {
    beforeEach(async () => {
      await app.init();
    });

    test('should create charm element with backend-specific features', () => {
      const charm = {
        id: 'backend-charm',
        name: 'Backend Charm',
        imageUrl: 'backend-charm.png',
        price: '$25.00',
        priceValue: 25,
        category: 'charms',
        available: true,
        quantity: 5,
        material: 'gold'
      };
      
      app.useBackend = true;
      
      const element = app.createCharmElement(charm);
      
      expect(element.dataset.inventoryId).toBe(charm.id);
      expect(element.innerHTML).toContain('Material: gold');
      expect(element.innerHTML).toContain('Available: 5');
    });

    test('should add availability indicator for backend charms', () => {
      const charm = {
        id: 'backend-charm',
        name: 'Backend Charm',
        available: true
      };
      
      app.useBackend = true;
      
      const element = app.createCharmElement(charm);
      
      expect(element.appendChild).toHaveBeenCalled();
    });

    test('should prevent adding unavailable charms', async () => {
      const charm = {
        id: 'unavailable-charm',
        name: 'Unavailable Charm',
        available: false
      };
      
      app.useBackend = true;
      
      await app.addCharmToCanvas(charm);
      
      expect(mockCustomizer.addCharm).not.toHaveBeenCalled();
    });

    test('should add inventory ID to charm data', async () => {
      const charm = {
        id: 'backend-charm',
        name: 'Backend Charm',
        available: true
      };
      
      app.useBackend = true;
      
      await app.addCharmToCanvas(charm);
      
      expect(mockCustomizer.addCharm).toHaveBeenCalledWith(
        expect.objectContaining({
          inventoryId: 'backend-charm'
        }),
        expect.any(Object)
      );
    });
  });

  describe('Enhanced Design Management', () => {
    beforeEach(async () => {
      await app.init();
    });

    test('should save design to backend when available', async () => {
      const mockDesignData = { charms: [{ id: 'charm-one' }] };
      mockCustomizer.getDesignData.mockReturnValue(mockDesignData);
      
      app.useBackend = true;
      
      await app.saveDesign();
      
      expect(mockInventoryService.saveDesign).toHaveBeenCalledWith(
        mockDesignData,
        expect.objectContaining({
          name: expect.stringMatching(/Design \d+\/\d+\/\d+/),
          canvasSettings: {
            width: 800,
            height: 600
          }
        })
      );
    });

    test('should fall back to localStorage when backend not ready', async () => {
      const mockDesignData = { charms: [{ id: 'charm-one' }] };
      mockCustomizer.getDesignData.mockReturnValue(mockDesignData);
      
      app.useBackend = false;
      
      await app.saveDesign();
      
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'timothie_saved_design',
        JSON.stringify(mockDesignData)
      );
    });

    test('should calculate total price with backend pricing format', () => {
      mockCustomizer.charmManager.getCharmData.mockReturnValue([
        { id: 'backend-charm-1' },
        { id: 'backend-charm-2' }
      ]);
      
      app.currentInventory = [
        { id: 'backend-charm-1', priceValue: 25.50 },
        { id: 'backend-charm-2', price: 15 }
      ];
      
      const total = app.calculateTotalPrice();
      
      expect(total).toBe(40.50);
    });
  });

  describe('Category Filter Management', () => {
    test('should load category filters dynamically', () => {
      app.currentInventory = app.sampleCharms;
      app.currentCategories = [
        { name: 'all', count: 8 },
        { name: 'symbols', count: 5 },
        { name: 'animals', count: 2 }
      ];
      
      app.loadCategoryFilters();
      
      expect(mockElements['category-filters'].innerHTML).toBe('');
      expect(mockElements['category-filters'].appendChild).toHaveBeenCalledTimes(3); // all + 2 categories
    });

    test('should handle missing category container', () => {
      mockElements['category-filters'] = null;
      
      expect(() => app.loadCategoryFilters()).not.toThrow();
    });
  });

  describe('Inventory Status Display', () => {
    test('should show live inventory status', () => {
      app.useBackend = true;
      app.inventoryLoaded = true;
      app.currentInventory = new Array(25);
      
      app.updateInventoryStatus();
      
      expect(mockElements['inventory-status'].textContent).toBe('✅ Live Inventory (25 items)');
    });

    test('should show sample data status', () => {
      app.useBackend = false;
      app.currentInventory = new Array(8);
      
      app.updateInventoryStatus();
      
      expect(mockElements['inventory-status'].textContent).toBe('📦 Sample Data (8 items)');
    });
  });

  describe('Inventory Refresh', () => {
    test('should refresh inventory display when backend enabled', async () => {
      const newInventory = [{ id: 'new-charm', name: 'New Charm' }];
      app.useBackend = true;
      mockInventoryService.getCharmInventory.mockResolvedValue(newInventory);
      
      await app.refreshInventoryDisplay();
      
      expect(app.currentInventory).toEqual(newInventory);
    });

    test('should handle refresh errors gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      app.useBackend = true;
      mockInventoryService.getCharmInventory.mockRejectedValue(new Error('Refresh failed'));
      
      await app.refreshInventoryDisplay();
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to refresh inventory:', expect.any(Error));
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Data Import Functionality', () => {
    test('should show import dialog for backend users', () => {
      app.useBackend = true;
      
      app.showImportDialog();
      
      expect(window.confirm).toHaveBeenCalledWith(
        expect.stringContaining('This will import the AliExpress inventory data')
      );
    });

    test('should prevent import when backend not available', () => {
      app.useBackend = false;
      
      app.showImportDialog();
      
      expect(window.confirm).not.toHaveBeenCalled();
    });

    test('should perform data import (demo mode)', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await app.performDataImport();
      
      expect(consoleSpy).toHaveBeenCalledWith('Data import feature available - see InventoryImporter class');
      consoleSpy.mockRestore();
    });

    test('should handle import errors', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Mock an error in the import process
      const originalRefresh = app.refreshInventoryDisplay;
      app.refreshInventoryDisplay = jest.fn().mockRejectedValue(new Error('Import failed'));
      
      await app.performDataImport();
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('Import failed:', expect.any(Error));
      
      // Restore
      app.refreshInventoryDisplay = originalRefresh;
      consoleErrorSpy.mockRestore();
    });
  });

  describe('UI Element Management (Extended)', () => {
    test('should get extended UI elements', () => {
      app.getUIElements();
      
      expect(app.elements.inventoryStatus).toBe(mockElements['inventory-status']);
      expect(app.elements.controlButtons.importData).toBe(mockElements['import-data-btn']);
    });

    test('should handle missing import button gracefully', () => {
      mockElements['import-data-btn'] = null;
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      app.getUIElements();
      
      // Should not warn about missing importData button
      expect(consoleWarnSpy).not.toHaveBeenCalledWith('Button not found: importData');
      consoleWarnSpy.mockRestore();
    });
  });

  describe('Complete Integration Flow', () => {
    test('should initialize complete integrated application', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await app.init();
      
      expect(app.isInitialized).toBe(true);
      expect(mockInventoryService.initialize).toHaveBeenCalled();
      expect(mockInventoryImporter.initialize).toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith('Jewelry Customizer initialized successfully!');
      
      consoleSpy.mockRestore();
    });

    test('should handle complete initialization failure', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      // Mock a failure in the initialization chain
      JewelryCustomizer.mockImplementationOnce(() => {
        throw new Error('Complete initialization failed');
      });
      
      await app.init();
      
      expect(app.isInitialized).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to initialize application:',
        expect.any(Error)
      );
      
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Enhanced Event Handling', () => {
    beforeEach(async () => {
      await app.init();
    });

    test('should setup import data button event listener', () => {
      app.getUIElements();
      app.setupUIInteractions();
      
      if (app.elements.controlButtons.importData) {
        expect(app.elements.controlButtons.importData.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
      }
    });

    test('should handle click events on charm elements with availability check', () => {
      const charm = {
        id: 'unavailable-charm',
        name: 'Unavailable Charm',
        available: false
      };
      
      app.useBackend = true;
      const element = app.createCharmElement(charm);
      
      // Get the click handler and call it
      const clickHandler = element.addEventListener.mock.calls.find(call => call[0] === 'click')[1];
      clickHandler();
      
      // Should not add charm due to availability check
      expect(mockCustomizer.addCharm).not.toHaveBeenCalled();
    });
  });
});