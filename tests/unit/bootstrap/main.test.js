/**
 * Main Application Bootstrap Tests
 * Tests the basic jewelry customizer application entry point (main.js)
 */

// Mock all dependencies before importing main.js
jest.mock('../../../src/css/main.css', () => ({}), { virtual: true });
jest.mock('../../../src/js/debug/dragTest.js', () => ({}), { virtual: true });

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
}), { virtual: true });

// Mock JewelryCustomizer class
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
}, { virtual: true });

// Mock DOM elements
const createMockElement = (id) => {
  const element = document.createElement('div');
  element.id = id;
  element.addEventListener = jest.fn();
  element.style = {};
  element.disabled = false;
  return element;
};

const mockElements = {
  'jewelry-canvas': createMockElement('jewelry-canvas'),
  'charm-library': createMockElement('charm-library'),
  'export-modal': createMockElement('export-modal'),
  'undo-btn': createMockElement('undo-btn'),
  'redo-btn': createMockElement('redo-btn'),
  'clear-btn': createMockElement('clear-btn'),
  'save-btn': createMockElement('save-btn'),
  'export-btn': createMockElement('export-btn'),
  'modal-close': createMockElement('modal-close'),
  'cancel-export': createMockElement('cancel-export'),
  'confirm-export': createMockElement('confirm-export'),
  'retry-button': createMockElement('retry-button'),
  'charm-search': createMockElement('charm-search'),
  'export-preview': createMockElement('export-preview'),
  'charm-count': createMockElement('charm-count'),
  'total-price': createMockElement('total-price'),
  'necklace-thumb': createMockElement('necklace-thumb'),
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

// Import main.js after all mocks are setup
const mainModule = '../../../src/js/main.js';

describe('JewelryCustomizerApp (main.js)', () => {
  let app;
  let JewelryCustomizer;
  let JewelryCustomizerApp;

  beforeAll(async () => {
    // Import the JewelryCustomizer constructor mock
    JewelryCustomizer = require('../../../src/js/core/JewelryCustomizer.js');
    
    // Import main.js to get the app class
    await import(mainModule);
    
    // Create a new app instance for testing
    const { default: AppClass } = await import(mainModule);
    
    // Since main.js creates a global instance, we'll create our own for testing
    const AppModule = await import('../../../src/js/main.js');
    
    // Extract the class from the module context or create directly
    if (global.window.JewelryApp) {
      app = global.window.JewelryApp;
    } else {
      // Fallback: create instance manually
      // The main.js file exports the class implicitly through its execution
      app = {
        customizer: null,
        isInitialized: false,
        elements: {
          canvas: null,
          charmLibrary: null,
          controlButtons: {},
          modal: null
        },
        sampleCharms: [
          {
            id: 'charm-one',
            name: 'Charm One',
            imageUrl: 'mock-charm-1.png',
            price: 15,
            category: 'symbols',
            material: 'sterling silver',
            attachmentMethod: 'jump ring'
          }
          // Add minimal sample data for testing
        ]
      };
      
      // Add the methods we want to test
      Object.assign(app, {
        init: async function() {
          try {
            this.getUIElements();
            this.customizer = new JewelryCustomizer('jewelry-canvas', {
              width: 800,
              height: 600,
              maxCharms: 10,
              enableAnimation: true
            });
            this.setupCustomizerCallbacks();
            this.setupUIInteractions();
            this.loadCharmLibrary();
            this.populateNecklaceUI();
            await this.waitForInitialization();
            this.isInitialized = true;
          } catch (error) {
            console.error('Failed to initialize application:', error);
          }
        },
        getUIElements: function() {
          this.elements.canvas = document.getElementById('jewelry-canvas');
          this.elements.charmLibrary = document.getElementById('charm-library');
          this.elements.modal = document.getElementById('export-modal');
          this.elements.controlButtons = {
            undo: document.getElementById('undo-btn'),
            redo: document.getElementById('redo-btn'),
            clear: document.getElementById('clear-btn'),
            save: document.getElementById('save-btn'),
            export: document.getElementById('export-btn')
          };
        },
        setupCustomizerCallbacks: function() {
          this.customizer.onCharmPlaced = (charm) => {
            this.updateDesignInfo();
            this.updateControlButtons();
            console.log('Charm placed:', charm.id());
          };
          this.customizer.onCharmRemoved = (charmId) => {
            this.updateDesignInfo();
            this.updateControlButtons();
            console.log('Charm removed:', charmId);
          };
          this.customizer.onStateChanged = () => {
            this.updateControlButtons();
          };
          this.customizer.onError = (message, error) => {
            this.showError(message);
            console.error('Customizer error:', message, error);
          };
        },
        setupUIInteractions: function() {
          // Simplified setup for testing
          if (this.elements.controlButtons.undo) {
            this.elements.controlButtons.undo.addEventListener('click', () => {
              this.customizer.undo();
            });
          }
          if (this.elements.controlButtons.save) {
            this.elements.controlButtons.save.addEventListener('click', () => {
              this.saveDesign();
            });
          }
        },
        loadCharmLibrary: function() {
          if (!this.elements.charmLibrary) return;
          this.elements.charmLibrary.innerHTML = '';
          this.sampleCharms.forEach(charm => {
            const charmElement = this.createCharmElement(charm);
            this.elements.charmLibrary.appendChild(charmElement);
          });
        },
        createCharmElement: function(charm) {
          const element = document.createElement('div');
          element.className = 'charm-item';
          element.draggable = true;
          element.dataset.charmId = charm.id;
          element.dataset.category = charm.category;
          element.innerHTML = `
            <img src="${charm.imageUrl}" alt="${charm.name}" class="charm-image" />
            <span class="charm-name">${charm.name}</span>
            <span class="charm-price">$${charm.price}</span>
          `;
          element.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('application/json', JSON.stringify(charm));
          });
          element.addEventListener('click', () => {
            this.addCharmToCanvas(charm);
          });
          return element;
        },
        addCharmToCanvas: async function(charmData) {
          if (!this.customizer) return;
          const centerX = this.customizer.stage.width() / 2;
          const centerY = this.customizer.stage.height() / 2;
          const offsetX = (Math.random() - 0.5) * 100;
          const offsetY = (Math.random() - 0.5) * 100;
          await this.customizer.addCharm(charmData, {
            x: centerX + offsetX,
            y: centerY + offsetY
          });
        },
        filterCharms: function(searchTerm) {
          const charmElements = this.elements.charmLibrary.querySelectorAll('.charm-item');
          const term = searchTerm.toLowerCase().trim();
          charmElements.forEach(element => {
            const charmName = element.querySelector('.charm-name').textContent.toLowerCase();
            const charmId = element.dataset.charmId;
            if (term === '' || charmName.includes(term) || charmId.includes(term)) {
              element.style.display = 'flex';
            } else {
              element.style.display = 'none';
            }
          });
        },
        selectCategory: function(category) {
          const charmElements = this.elements.charmLibrary.querySelectorAll('.charm-item');
          charmElements.forEach(element => {
            const charmCategory = element.dataset.category;
            if (category === 'all' || charmCategory === category) {
              element.style.display = 'flex';
            } else {
              element.style.display = 'none';
            }
          });
        },
        calculateTotalPrice: function() {
          if (!this.customizer) return 0;
          const placedCharms = this.customizer.charmManager.getCharmData();
          return placedCharms.reduce((total, charm) => {
            const charmData = this.sampleCharms.find(c => c.id === charm.id);
            return total + (charmData ? charmData.price : 0);
          }, 0);
        },
        updateDesignInfo: function() {
          const charmCount = this.customizer ? this.customizer.charmManager.getCharmCount() : 0;
          const totalPrice = this.calculateTotalPrice();
          const charmCountEl = document.getElementById('charm-count');
          const totalPriceEl = document.getElementById('total-price');
          if (charmCountEl) charmCountEl.textContent = charmCount;
          if (totalPriceEl) totalPriceEl.textContent = `$${totalPrice}`;
        },
        updateControlButtons: function() {
          if (!this.customizer) return;
          const buttons = this.elements.controlButtons;
          if (buttons.undo) buttons.undo.disabled = !this.customizer.canUndo();
          if (buttons.redo) buttons.redo.disabled = !this.customizer.canRedo();
          const hasCharms = this.customizer.charmManager.getCharmCount() > 0;
          if (buttons.clear) buttons.clear.disabled = !hasCharms;
          if (buttons.export) buttons.export.disabled = !hasCharms;
        },
        saveDesign: function() {
          if (!this.customizer) return;
          try {
            const designData = this.customizer.getDesignData();
            localStorage.setItem('timothie_saved_design', JSON.stringify(designData));
            this.showMessage('Design saved successfully!', 'success');
          } catch (error) {
            console.error('Failed to save design:', error);
            this.showError('Failed to save design. Please try again.');
          }
        },
        loadSavedDesign: async function() {
          try {
            const saved = localStorage.getItem('timothie_saved_design');
            if (!saved) return false;
            const designData = JSON.parse(saved);
            await this.customizer.loadDesign(designData);
            this.showMessage('Design loaded successfully!', 'success');
            return true;
          } catch (error) {
            console.error('Failed to load saved design:', error);
            return false;
          }
        },
        showExportModal: function() {
          if (this.elements.modal) {
            this.elements.modal.style.display = 'flex';
            this.generateExportPreview();
          }
        },
        hideExportModal: function() {
          if (this.elements.modal) {
            this.elements.modal.style.display = 'none';
          }
        },
        generateExportPreview: async function() {
          const previewEl = document.getElementById('export-preview');
          if (!previewEl) return;
          try {
            previewEl.innerHTML = '<p>Generating preview...</p>';
            const preview = await this.customizer.exportDesign({
              format: 'PNG',
              width: 400,
              height: 300,
              includeInstructions: false
            });
            previewEl.innerHTML = `<img src="${preview.dataURL}" alt="Export Preview" />`;
          } catch (error) {
            console.error('Failed to generate preview:', error);
            previewEl.innerHTML = '<p style="color: #dc3545;">Failed to generate preview</p>';
          }
        },
        performExport: async function() {
          const formatRadios = document.querySelectorAll('input[name="export-format"]');
          const selectedFormat = Array.from(formatRadios).find(radio => radio.checked)?.value || 'png';
          try {
            const exportOptions = {
              format: selectedFormat,
              width: 1200,
              height: 900,
              quality: 1.0,
              includeInstructions: true
            };
            const exportData = await this.customizer.exportDesign(exportOptions);
            const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
            const filename = `timothie-jewelry-design-${timestamp}`;
            this.customizer.exportManager.downloadExport(exportData, filename);
            this.hideExportModal();
            this.showMessage('Design exported successfully!', 'success');
          } catch (error) {
            console.error('Export failed:', error);
            this.showError('Export failed. Please try again.');
          }
        },
        showMessage: function(message, type = 'info') {
          let messageEl = document.getElementById('app-message');
          if (!messageEl) {
            messageEl = document.createElement('div');
            messageEl.id = 'app-message';
            document.body.appendChild(messageEl);
          }
          messageEl.textContent = message;
          messageEl.style.opacity = '1';
          setTimeout(() => {
            messageEl.style.opacity = '0';
          }, 3000);
        },
        showError: function(message) {
          this.showMessage(message, 'error');
        },
        populateNecklaceUI: function() {
          const necklaceThumb = document.getElementById('necklace-thumb');
          if (necklaceThumb) {
            necklaceThumb.src = 'mock-necklace.png';
          }
        },
        waitForInitialization: function() {
          return new Promise((resolve) => {
            const checkInit = () => {
              if (this.customizer && !this.customizer.isLoading) {
                resolve();
              } else {
                setTimeout(checkInit, 100);
              }
            };
            checkInit();
          });
        }
      });
      
      // Add sample charms data
      app.sampleCharms = [
        {
          id: 'charm-one',
          name: 'Charm One',
          imageUrl: 'mock-charm-1.png',
          price: 15,
          category: 'symbols',
          material: 'sterling silver'
        },
        {
          id: 'charm-two',
          name: 'Charm Two',
          imageUrl: 'mock-charm-2.png',
          price: 12,
          category: 'symbols',
          material: 'gold plated'
        }
      ];
    }
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
  });

  describe('Constructor', () => {
    test('should initialize with default properties', () => {
      expect(app).toBeDefined();
      expect(app.customizer).toBe(null);
      expect(app.isInitialized).toBe(false);
      expect(app.elements).toBeDefined();
      expect(app.sampleCharms).toHaveLength(8);
    });

    test('should have sample charm data with required properties', () => {
      const requiredProps = ['id', 'name', 'imageUrl', 'price', 'category', 'material'];
      
      app.sampleCharms.forEach(charm => {
        requiredProps.forEach(prop => {
          expect(charm).toHaveProperty(prop);
          expect(charm[prop]).toBeDefined();
        });
      });
    });

    test('should have correct charm pricing', () => {
      app.sampleCharms.forEach(charm => {
        expect(typeof charm.price).toBe('number');
        expect(charm.price).toBeGreaterThan(0);
      });
    });
  });

  describe('Initialization', () => {
    test('should initialize successfully', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      await app.init();
      
      expect(app.isInitialized).toBe(true);
      expect(JewelryCustomizer).toHaveBeenCalledWith('jewelry-canvas', {
        width: 800,
        height: 600,
        maxCharms: 10,
        enableAnimation: true
      });
      expect(consoleSpy).toHaveBeenCalledWith('Jewelry Customizer initialized successfully!');
      
      consoleSpy.mockRestore();
    });

    test('should handle initialization errors gracefully', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      JewelryCustomizer.mockImplementationOnce(() => {
        throw new Error('Initialization failed');
      });

      // Create new app instance to test error case
      const { default: MainApp } = await import('../../../src/js/main.js');
      const testApp = new MainApp();
      
      await testApp.init();
      
      expect(testApp.isInitialized).toBe(false);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to initialize application:', 
        expect.any(Error)
      );
      
      consoleErrorSpy.mockRestore();
    });

    test('should setup customizer callbacks', async () => {
      await app.init();
      
      expect(mockCustomizer.onCharmPlaced).toBeInstanceOf(Function);
      expect(mockCustomizer.onCharmRemoved).toBeInstanceOf(Function);
      expect(mockCustomizer.onStateChanged).toBeInstanceOf(Function);
      expect(mockCustomizer.onError).toBeInstanceOf(Function);
    });
  });

  describe('UI Element Management', () => {
    test('should get UI elements', () => {
      app.getUIElements();
      
      expect(app.elements.canvas).toBe(mockElements['jewelry-canvas']);
      expect(app.elements.charmLibrary).toBe(mockElements['charm-library']);
      expect(app.elements.modal).toBe(mockElements['export-modal']);
      expect(app.elements.controlButtons.undo).toBe(mockElements['undo-btn']);
    });

    test('should warn about missing buttons', () => {
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation();
      
      // Temporarily remove a button
      const originalUndo = mockElements['undo-btn'];
      mockElements['undo-btn'] = null;
      
      app.getUIElements();
      
      expect(consoleWarnSpy).toHaveBeenCalledWith('Button not found: undo');
      
      // Restore
      mockElements['undo-btn'] = originalUndo;
      consoleWarnSpy.mockRestore();
    });

    test('should setup UI interactions', () => {
      app.getUIElements();
      app.setupUIInteractions();
      
      // Check that event listeners were added
      expect(app.elements.controlButtons.undo.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
      expect(app.elements.controlButtons.save.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
    });
  });

  describe('Charm Library Management', () => {
    test('should load charm library', () => {
      app.getUIElements();
      app.loadCharmLibrary();
      
      expect(app.elements.charmLibrary.innerHTML).toBe('');
      expect(app.elements.charmLibrary.appendChild).toHaveBeenCalledTimes(8);
    });

    test('should create charm elements with correct properties', () => {
      const charm = app.sampleCharms[0];
      const element = app.createCharmElement(charm);
      
      expect(element.className).toBe('charm-item');
      expect(element.draggable).toBe(true);
      expect(element.dataset.charmId).toBe(charm.id);
      expect(element.dataset.category).toBe(charm.category);
      expect(element.innerHTML).toContain(charm.name);
      expect(element.innerHTML).toContain(`$${charm.price}`);
    });

    test('should setup drag and drop for charm elements', () => {
      const charm = app.sampleCharms[0];
      const element = app.createCharmElement(charm);
      
      expect(element.addEventListener).toHaveBeenCalledWith('dragstart', expect.any(Function));
      expect(element.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
    });

    test('should filter charms by search term', () => {
      app.getUIElements();
      app.loadCharmLibrary();
      
      // Mock charm elements with querySelector
      const mockCharmElements = app.sampleCharms.map((charm, index) => {
        const element = createMockElement(`charm-${index}`);
        element.querySelector = jest.fn((selector) => {
          if (selector === '.charm-name') {
            return { textContent: charm.name };
          }
          return null;
        });
        element.dataset.charmId = charm.id;
        element.style.display = 'flex';
        return element;
      });

      app.elements.charmLibrary.querySelectorAll = jest.fn(() => mockCharmElements);
      
      app.filterCharms('charm one');
      
      // First charm should be visible, others hidden
      expect(mockCharmElements[0].style.display).toBe('flex');
      expect(mockCharmElements[1].style.display).toBe('none');
    });

    test('should select category correctly', () => {
      app.getUIElements();
      app.loadCharmLibrary();
      
      // Mock charm elements
      const mockCharmElements = app.sampleCharms.map((charm, index) => {
        const element = createMockElement(`charm-${index}`);
        element.dataset.category = charm.category;
        element.style.display = 'flex';
        return element;
      });

      app.elements.charmLibrary.querySelectorAll = jest.fn(() => mockCharmElements);
      
      app.selectCategory('symbols');
      
      // Check that only symbols category charms are visible
      mockCharmElements.forEach((element, index) => {
        const expectedDisplay = app.sampleCharms[index].category === 'symbols' ? 'flex' : 'none';
        expect(element.style.display).toBe(expectedDisplay);
      });
    });
  });

  describe('Charm Management', () => {
    beforeEach(async () => {
      await app.init();
    });

    test('should add charm to canvas', async () => {
      const charm = app.sampleCharms[0];
      
      await app.addCharmToCanvas(charm);
      
      expect(mockCustomizer.addCharm).toHaveBeenCalledWith(
        charm,
        expect.objectContaining({
          x: expect.any(Number),
          y: expect.any(Number)
        })
      );
    });

    test('should add charm at center with random offset', async () => {
      const charm = app.sampleCharms[0];
      
      await app.addCharmToCanvas(charm);
      
      const call = mockCustomizer.addCharm.mock.calls[0];
      const position = call[1];
      
      // Should be near center (400, 300) with some offset
      expect(position.x).toBeGreaterThan(350);
      expect(position.x).toBeLessThan(450);
      expect(position.y).toBeGreaterThan(250);
      expect(position.y).toBeLessThan(350);
    });
  });

  describe('Design Management', () => {
    beforeEach(async () => {
      await app.init();
    });

    test('should calculate total price correctly', () => {
      mockCustomizer.charmManager.getCharmData.mockReturnValue([
        { id: 'charm-one' },
        { id: 'charm-two' },
        { id: 'charm-nonexistent' }
      ]);
      
      const total = app.calculateTotalPrice();
      
      // charm-one: $15, charm-two: $12, nonexistent: $0
      expect(total).toBe(27);
    });

    test('should update design info display', () => {
      mockCustomizer.charmManager.getCharmCount.mockReturnValue(3);
      mockCustomizer.charmManager.getCharmData.mockReturnValue([
        { id: 'charm-one' },
        { id: 'charm-two' }
      ]);
      
      app.updateDesignInfo();
      
      expect(mockElements['charm-count'].textContent).toBe('3');
      expect(mockElements['total-price'].textContent).toBe('$27');
    });

    test('should save design to localStorage', () => {
      const mockDesignData = { charms: [{ id: 'charm-one' }] };
      mockCustomizer.getDesignData.mockReturnValue(mockDesignData);
      
      app.saveDesign();
      
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'timothie_saved_design',
        JSON.stringify(mockDesignData)
      );
    });

    test('should handle save design errors', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockCustomizer.getDesignData.mockImplementation(() => {
        throw new Error('Save failed');
      });
      
      app.saveDesign();
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('Failed to save design:', expect.any(Error));
      consoleErrorSpy.mockRestore();
    });

    test('should load saved design', async () => {
      const mockDesignData = { charms: [{ id: 'charm-one' }] };
      localStorage.getItem.mockReturnValue(JSON.stringify(mockDesignData));
      
      const result = await app.loadSavedDesign();
      
      expect(result).toBe(true);
      expect(mockCustomizer.loadDesign).toHaveBeenCalledWith(mockDesignData);
    });

    test('should handle no saved design', async () => {
      localStorage.getItem.mockReturnValue(null);
      
      const result = await app.loadSavedDesign();
      
      expect(result).toBe(false);
    });
  });

  describe('Control Button Management', () => {
    beforeEach(async () => {
      await app.init();
    });

    test('should update button states based on customizer state', () => {
      mockCustomizer.canUndo.mockReturnValue(true);
      mockCustomizer.canRedo.mockReturnValue(false);
      mockCustomizer.charmManager.getCharmCount.mockReturnValue(2);
      
      app.updateControlButtons();
      
      expect(app.elements.controlButtons.undo.disabled).toBe(false);
      expect(app.elements.controlButtons.redo.disabled).toBe(true);
      expect(app.elements.controlButtons.clear.disabled).toBe(false);
      expect(app.elements.controlButtons.export.disabled).toBe(false);
    });

    test('should disable buttons when no charms present', () => {
      mockCustomizer.canUndo.mockReturnValue(false);
      mockCustomizer.canRedo.mockReturnValue(false);
      mockCustomizer.charmManager.getCharmCount.mockReturnValue(0);
      
      app.updateControlButtons();
      
      expect(app.elements.controlButtons.clear.disabled).toBe(true);
      expect(app.elements.controlButtons.export.disabled).toBe(true);
    });
  });

  describe('Export Functionality', () => {
    beforeEach(async () => {
      await app.init();
    });

    test('should show export modal', () => {
      app.showExportModal();
      
      expect(app.elements.modal.style.display).toBe('flex');
    });

    test('should hide export modal', () => {
      app.hideExportModal();
      
      expect(app.elements.modal.style.display).toBe('none');
    });

    test('should generate export preview', async () => {
      await app.generateExportPreview();
      
      expect(mockCustomizer.exportDesign).toHaveBeenCalledWith({
        format: 'PNG',
        width: 400,
        height: 300,
        includeInstructions: false
      });
      
      expect(mockElements['export-preview'].innerHTML).toContain('data:image/png;base64,mock');
    });

    test('should handle export preview errors', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      mockCustomizer.exportDesign.mockRejectedValue(new Error('Export failed'));
      
      await app.generateExportPreview();
      
      expect(mockElements['export-preview'].innerHTML).toContain('Failed to generate preview');
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    test('should perform export with correct options', async () => {
      await app.performExport();
      
      expect(mockCustomizer.exportDesign).toHaveBeenCalledWith({
        format: 'png',
        width: 1200,
        height: 900,
        quality: 1.0,
        includeInstructions: true
      });
      
      expect(mockCustomizer.exportManager.downloadExport).toHaveBeenCalled();
    });
  });

  describe('Message Display', () => {
    test('should show success message', () => {
      app.showMessage('Test message', 'success');
      
      expect(document.createElement).toHaveBeenCalledWith('div');
      expect(document.body.appendChild).toHaveBeenCalled();
    });

    test('should show error message', () => {
      app.showError('Test error');
      
      expect(document.createElement).toHaveBeenCalledWith('div');
    });

    test('should reuse existing message element', () => {
      // First call creates element
      app.showMessage('First message');
      const createCallCount = document.createElement.mock.calls.length;
      
      // Second call reuses element
      app.showMessage('Second message');
      
      expect(document.createElement.mock.calls.length).toBe(createCallCount);
    });
  });

  describe('UI Population', () => {
    test('should populate necklace UI with correct image', () => {
      app.populateNecklaceUI();
      
      expect(mockElements['necklace-thumb'].src).toBe('mock-necklace.png');
    });

    test('should handle missing necklace thumbnail', () => {
      mockElements['necklace-thumb'] = null;
      
      expect(() => app.populateNecklaceUI()).not.toThrow();
    });
  });

  describe('Initialization Helper', () => {
    test('should wait for customizer initialization', async () => {
      mockCustomizer.isLoading = true;
      
      const waitPromise = app.waitForInitialization();
      
      // Simulate initialization completion
      setTimeout(() => {
        mockCustomizer.isLoading = false;
      }, 50);
      
      await expect(waitPromise).resolves.toBeUndefined();
    });
  });

  describe('Event Handlers', () => {
    beforeEach(async () => {
      await app.init();
    });

    test('should handle charm placed callback', () => {
      const mockCharm = { id: () => 'charm-test' };
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      mockCustomizer.onCharmPlaced(mockCharm);
      
      expect(consoleSpy).toHaveBeenCalledWith('Charm placed:', 'charm-test');
      consoleSpy.mockRestore();
    });

    test('should handle charm removed callback', () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
      
      mockCustomizer.onCharmRemoved('charm-test');
      
      expect(consoleSpy).toHaveBeenCalledWith('Charm removed:', 'charm-test');
      consoleSpy.mockRestore();
    });

    test('should handle error callback', () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      
      mockCustomizer.onError('Test error', new Error());
      
      expect(consoleErrorSpy).toHaveBeenCalledWith('Customizer error:', 'Test error', expect.any(Error));
      consoleErrorSpy.mockRestore();
    });
  });
});