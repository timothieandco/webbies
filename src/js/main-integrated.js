/**
 * Timothie & Co Jewelry Customizer - Integrated Main Entry Point
 * Initializes the application with backend inventory integration
 */

import '../css/main.css';
import JewelryCustomizer from './core/JewelryCustomizer.js';
import { charmImages, necklaceImages } from './utils/images.js';
import { initializeAPI } from './services/InventoryAPI.js';
import inventoryService from './services/InventoryService.js';
import inventoryImporter from './utils/InventoryImporter.js';
import { SUPABASE_CONFIG } from './config/supabase.js';
import './debug/dragTest.js';

class JewelryCustomizerApp {
    constructor() {
        this.customizer = null;
        this.isInitialized = false;
        this.inventoryLoaded = false;
        this.useBackend = false; // Flag to enable/disable backend integration
        
        // UI Elements
        this.elements = {
            canvas: null,
            charmLibrary: null,
            controlButtons: {},
            modal: null,
            inventoryStatus: null
        };
        
        // Sample data as fallback (keeping existing charms for backward compatibility)
        this.sampleCharms = [
            {
                id: 'charm-one',
                name: 'Charm One',
                imageUrl: charmImages.charmOne,
                price: 15,
                category: 'symbols',
                material: 'sterling silver',
                attachmentMethod: 'jump ring'
            },
            {
                id: 'charm-two',
                name: 'Charm Two',
                imageUrl: charmImages.charmTwo,
                price: 12,
                category: 'symbols',
                material: 'gold plated',
                attachmentMethod: 'jump ring'
            },
            {
                id: 'charm-three',
                name: 'Charm Three',
                imageUrl: charmImages.charmThree,
                price: 18,
                category: 'animals',
                material: 'sterling silver',
                attachmentMethod: 'jump ring'
            },
            {
                id: 'charm-four',
                name: 'Charm Four',
                imageUrl: charmImages.charmFour,
                price: 14,
                category: 'symbols',
                material: 'sterling silver',
                attachmentMethod: 'jump ring'
            },
            {
                id: 'charm-five',
                name: 'Charm Five',
                imageUrl: charmImages.charmFive,
                price: 16,
                category: 'symbols',
                material: 'rose gold',
                attachmentMethod: 'jump ring'
            },
            {
                id: 'charm-six',
                name: 'Charm Six',
                imageUrl: charmImages.charmSix,
                price: 20,
                category: 'letters',
                material: 'sterling silver',
                attachmentMethod: 'jump ring'
            },
            {
                id: 'charm-seven',
                name: 'Charm Seven',
                imageUrl: charmImages.charmSeven,
                price: 22,
                category: 'birthstones',
                material: 'sterling silver',
                attachmentMethod: 'jump ring'
            },
            {
                id: 'charm-eight',
                name: 'Charm Eight',
                imageUrl: charmImages.charmEight,
                price: 17,
                category: 'animals',
                material: 'gold plated',
                attachmentMethod: 'jump ring'
            }
        ];

        // Current inventory items (loaded from backend or sample data)
        this.currentInventory = [];
        this.currentCategories = [];
    }

    /**
     * Initialize the application with inventory integration
     */
    async init() {
        try {
            console.log('Initializing Jewelry Customizer with Inventory System...');
            
            // Get UI elements
            this.getUIElements();
            
            // Try to initialize backend integration
            await this.initializeBackendIntegration();
            
            // Initialize the customizer
            this.customizer = new JewelryCustomizer('jewelry-canvas', {
                width: 800,
                height: 600,
                maxCharms: 10,
                enableAnimation: true
            });

            // Setup event callbacks
            this.setupCustomizerCallbacks();
            
            // Setup UI interactions
            this.setupUIInteractions();
            
            // Load inventory and populate UI
            await this.loadInventoryData();
            
            // Populate necklace thumbnail
            this.populateNecklaceUI();
            
            // Wait for customizer to initialize
            await this.waitForInitialization();
            
            this.isInitialized = true;
            console.log('Jewelry Customizer initialized successfully!');
            
            // Show inventory status
            this.updateInventoryStatus();
            
        } catch (error) {
            console.error('Failed to initialize application:', error);
            this.showError('Failed to initialize the jewelry customizer. Please refresh the page.');
        }
    }

    /**
     * Initialize backend integration (optional)
     */
    async initializeBackendIntegration() {
        try {
            // Check if Supabase configuration is available
            if (SUPABASE_CONFIG.URL !== 'https://your-project.supabase.co' && 
                SUPABASE_CONFIG.ANON_KEY !== 'your-supabase-anon-key') {
                
                console.log('Initializing backend inventory system...');
                
                // Initialize API client
                const api = initializeAPI(SUPABASE_CONFIG.URL, SUPABASE_CONFIG.ANON_KEY);
                
                // Initialize inventory service
                await inventoryService.initialize({
                    enableRealTime: true
                });
                
                // Initialize importer
                await inventoryImporter.initialize();
                
                this.useBackend = true;
                console.log('Backend integration initialized successfully');
                
                // Setup real-time subscriptions
                this.setupInventorySubscriptions();
                
            } else {
                console.log('Backend not configured, using sample data');
                this.useBackend = false;
            }
        } catch (error) {
            console.warn('Backend integration failed, falling back to sample data:', error);
            this.useBackend = false;
        }
    }

    /**
     * Setup inventory real-time subscriptions
     */
    setupInventorySubscriptions() {
        if (!this.useBackend) return;

        // Subscribe to inventory updates
        inventoryService.subscribe('inventory-updated', (data) => {
            console.log('Inventory updated:', data);
            this.refreshInventoryDisplay();
        });

        // Subscribe to design saves
        inventoryService.subscribe('design-saved', (data) => {
            console.log('Design saved:', data);
            this.showMessage('Design saved to your account!', 'success');
        });
    }

    /**
     * Load inventory data from backend or use sample data
     */
    async loadInventoryData() {
        try {
            if (this.useBackend) {
                console.log('Loading inventory from backend...');
                
                // Load charm inventory for the customizer
                const charmInventory = await inventoryService.getCharmInventory();
                
                // Load categories
                const categories = await inventoryService.getCategories();
                
                if (charmInventory.length > 0) {
                    this.currentInventory = charmInventory;
                    this.currentCategories = categories;
                    this.inventoryLoaded = true;
                    console.log(`Loaded ${charmInventory.length} items from inventory`);
                } else {
                    // No backend inventory, use sample data
                    this.loadSampleData();
                }
            } else {
                // Backend not available, use sample data
                this.loadSampleData();
            }
            
            // Populate the charm library UI
            this.loadCharmLibrary();
            this.loadCategoryFilters();
            
        } catch (error) {
            console.error('Failed to load inventory data:', error);
            this.loadSampleData();
            this.loadCharmLibrary();
        }
    }

    /**
     * Load sample data as fallback
     */
    loadSampleData() {
        console.log('Using sample charm data');
        this.currentInventory = this.sampleCharms;
        this.inventoryLoaded = false;
        
        // Create sample categories
        this.currentCategories = [
            { name: 'all', count: this.sampleCharms.length },
            { name: 'symbols', count: this.sampleCharms.filter(c => c.category === 'symbols').length },
            { name: 'animals', count: this.sampleCharms.filter(c => c.category === 'animals').length },
            { name: 'letters', count: this.sampleCharms.filter(c => c.category === 'letters').length },
            { name: 'birthstones', count: this.sampleCharms.filter(c => c.category === 'birthstones').length }
        ];
    }

    /**
     * Get references to UI elements
     */
    getUIElements() {
        this.elements.canvas = document.getElementById('jewelry-canvas');
        this.elements.charmLibrary = document.getElementById('charm-library');
        this.elements.modal = document.getElementById('export-modal');
        this.elements.inventoryStatus = document.getElementById('inventory-status');
        
        // Control buttons
        this.elements.controlButtons = {
            undo: document.getElementById('undo-btn'),
            redo: document.getElementById('redo-btn'),
            clear: document.getElementById('clear-btn'),
            save: document.getElementById('save-btn'),
            export: document.getElementById('export-btn'),
            importData: document.getElementById('import-data-btn')
        };

        // Validate all elements exist
        for (const [key, element] of Object.entries(this.elements.controlButtons)) {
            if (!element && key !== 'importData') {
                console.warn(`Button not found: ${key}`);
            }
        }
    }

    /**
     * Setup customizer event callbacks
     */
    setupCustomizerCallbacks() {
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
    }

    /**
     * Setup UI interactions
     */
    setupUIInteractions() {
        // Control buttons
        if (this.elements.controlButtons.undo) {
            this.elements.controlButtons.undo.addEventListener('click', () => {
                this.customizer.undo();
            });
        }

        if (this.elements.controlButtons.redo) {
            this.elements.controlButtons.redo.addEventListener('click', () => {
                this.customizer.redo();
            });
        }

        if (this.elements.controlButtons.clear) {
            this.elements.controlButtons.clear.addEventListener('click', () => {
                if (confirm('Are you sure you want to clear all charms?')) {
                    this.customizer.clearAllCharms();
                }
            });
        }

        if (this.elements.controlButtons.save) {
            this.elements.controlButtons.save.addEventListener('click', () => {
                this.saveDesign();
            });
        }

        if (this.elements.controlButtons.export) {
            this.elements.controlButtons.export.addEventListener('click', () => {
                this.showExportModal();
            });
        }

        // Import data button (for testing/admin)
        if (this.elements.controlButtons.importData) {
            this.elements.controlButtons.importData.addEventListener('click', () => {
                this.showImportDialog();
            });
        }

        // Modal interactions
        this.setupModalInteractions();

        // Retry button
        const retryButton = document.getElementById('retry-button');
        if (retryButton) {
            retryButton.addEventListener('click', () => {
                location.reload();
            });
        }

        // Charm search
        const searchInput = document.getElementById('charm-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.filterCharms(e.target.value);
            });
        }

        // Category buttons
        const categoryButtons = document.querySelectorAll('.category-btn');
        categoryButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.selectCategory(e.target.dataset.category);
                
                // Update active state
                categoryButtons.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            });
        });
    }

    /**
     * Setup modal interactions
     */
    setupModalInteractions() {
        const modal = this.elements.modal;
        if (!modal) return;

        const closeBtn = document.getElementById('modal-close');
        const cancelBtn = document.getElementById('cancel-export');
        const confirmBtn = document.getElementById('confirm-export');

        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.hideExportModal());
        }

        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.hideExportModal());
        }

        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => this.performExport());
        }

        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.hideExportModal();
            }
        });
    }

    /**
     * Load charm library into UI
     */
    loadCharmLibrary() {
        if (!this.elements.charmLibrary) return;

        // Clear existing charms
        this.elements.charmLibrary.innerHTML = '';

        // Add each charm from current inventory
        this.currentInventory.forEach(charm => {
            const charmElement = this.createCharmElement(charm);
            this.elements.charmLibrary.appendChild(charmElement);
        });
    }

    /**
     * Load category filters
     */
    loadCategoryFilters() {
        const categoryContainer = document.getElementById('category-filters');
        if (!categoryContainer) return;

        // Clear existing categories
        categoryContainer.innerHTML = '';

        // Add 'All' category first
        const allButton = document.createElement('button');
        allButton.className = 'category-btn active';
        allButton.dataset.category = 'all';
        allButton.textContent = `All (${this.currentInventory.length})`;
        categoryContainer.appendChild(allButton);

        // Add other categories
        this.currentCategories.forEach(category => {
            if (category.name !== 'all') {
                const button = document.createElement('button');
                button.className = 'category-btn';
                button.dataset.category = category.name;
                button.textContent = `${category.name.charAt(0).toUpperCase() + category.name.slice(1)} (${category.count})`;
                categoryContainer.appendChild(button);
            }
        });

        // Re-setup event listeners for new buttons
        const categoryButtons = categoryContainer.querySelectorAll('.category-btn');
        categoryButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.selectCategory(e.target.dataset.category);
                
                // Update active state
                categoryButtons.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            });
        });
    }

    /**
     * Create charm element for the library
     */
    createCharmElement(charm) {
        const element = document.createElement('div');
        element.className = 'charm-item';
        element.draggable = true;
        element.dataset.charmId = charm.id;
        element.dataset.category = charm.category;
        element.dataset.inventoryId = charm.id; // For backend tracking

        // Format price consistently
        const priceDisplay = typeof charm.price === 'string' ? charm.price : `$${charm.price}`;
        const priceValue = typeof charm.priceValue === 'number' ? charm.priceValue : charm.price;

        element.innerHTML = `
            <img src="${charm.imageUrl || charm.src}" alt="${charm.name || charm.title}" class="charm-image" />
            <span class="charm-name">${charm.name || charm.title}</span>
            <span class="charm-price">${priceDisplay}</span>
            <div class="charm-tooltip">
                ${charm.name || charm.title} - ${priceDisplay}
                ${charm.material ? `<br>Material: ${charm.material}` : ''}
                ${charm.available !== undefined ? `<br>Available: ${charm.quantity || 0}` : ''}
            </div>
        `;

        // Add availability indicator if using backend
        if (this.useBackend && charm.available !== undefined) {
            const indicator = document.createElement('div');
            indicator.className = `availability-indicator ${charm.available ? 'available' : 'unavailable'}`;
            indicator.title = charm.available ? 'In Stock' : 'Out of Stock';
            element.appendChild(indicator);
        }

        // Setup drag and drop
        element.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('application/json', JSON.stringify(charm));
            e.dataTransfer.effectAllowed = 'copy';
        });

        // Setup click to add (alternative to drag)
        element.addEventListener('click', () => {
            if (!charm.available && this.useBackend) {
                this.showError('This item is currently out of stock');
                return;
            }
            this.addCharmToCanvas(charm);
        });

        return element;
    }

    /**
     * Add charm to canvas at center position
     */
    async addCharmToCanvas(charmData) {
        if (!this.customizer) return;

        // Check availability if using backend
        if (this.useBackend && !charmData.available) {
            this.showError('This item is currently out of stock');
            return;
        }

        const centerX = this.customizer.stage.width() / 2;
        const centerY = this.customizer.stage.height() / 2;
        
        // Add slight random offset to avoid stacking
        const offsetX = (Math.random() - 0.5) * 100;
        const offsetY = (Math.random() - 0.5) * 100;

        // Add inventory ID to charm data for backend tracking
        const extendedCharmData = {
            ...charmData,
            inventoryId: charmData.id // For backend integration
        };

        await this.customizer.addCharm(extendedCharmData, {
            x: centerX + offsetX,
            y: centerY + offsetY
        });
    }

    /**
     * Filter charms by search term
     */
    filterCharms(searchTerm) {
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
    }

    /**
     * Select charm category
     */
    selectCategory(category) {
        const charmElements = this.elements.charmLibrary.querySelectorAll('.charm-item');

        charmElements.forEach(element => {
            const charmCategory = element.dataset.category;
            
            if (category === 'all' || charmCategory === category) {
                element.style.display = 'flex';
            } else {
                element.style.display = 'none';
            }
        });
    }

    /**
     * Save design (enhanced with backend integration)
     */
    async saveDesign() {
        if (!this.customizer) return;

        try {
            const designData = this.customizer.getDesignData();
            
            if (this.useBackend && inventoryService.isReady()) {
                // Save to backend
                const metadata = {
                    name: `Design ${new Date().toLocaleDateString()}`,
                    canvasSettings: {
                        width: this.customizer.stage.width(),
                        height: this.customizer.stage.height()
                    }
                };
                
                const savedDesign = await inventoryService.saveDesign(designData, metadata);
                this.showMessage('Design saved to your account!', 'success');
                
                console.log('Design saved to backend:', savedDesign);
            } else {
                // Fallback to localStorage
                localStorage.setItem('timothie_saved_design', JSON.stringify(designData));
                this.showMessage('Design saved locally!', 'success');
            }
            
        } catch (error) {
            console.error('Failed to save design:', error);
            this.showError('Failed to save design. Please try again.');
        }
    }

    /**
     * Calculate total price of placed charms
     */
    calculateTotalPrice() {
        if (!this.customizer) return 0;

        const placedCharms = this.customizer.charmManager.getCharmData();
        return placedCharms.reduce((total, charm) => {
            const charmData = this.currentInventory.find(c => c.id === charm.id);
            if (charmData) {
                const price = typeof charmData.priceValue === 'number' ? 
                    charmData.priceValue : 
                    (typeof charmData.price === 'number' ? charmData.price : 0);
                return total + price;
            }
            return total;
        }, 0);
    }

    /**
     * Update design information display
     */
    updateDesignInfo() {
        const charmCount = this.customizer ? this.customizer.charmManager.getCharmCount() : 0;
        const totalPrice = this.calculateTotalPrice();

        const charmCountEl = document.getElementById('charm-count');
        const totalPriceEl = document.getElementById('total-price');

        if (charmCountEl) {
            charmCountEl.textContent = charmCount;
        }

        if (totalPriceEl) {
            totalPriceEl.textContent = `$${totalPrice.toFixed(2)}`;
        }
    }

    /**
     * Update inventory status display
     */
    updateInventoryStatus() {
        if (!this.elements.inventoryStatus) return;

        const status = this.useBackend && this.inventoryLoaded ? 
            `✅ Live Inventory (${this.currentInventory.length} items)` :
            `📦 Sample Data (${this.currentInventory.length} items)`;
        
        this.elements.inventoryStatus.textContent = status;
    }

    /**
     * Refresh inventory display after updates
     */
    async refreshInventoryDisplay() {
        try {
            if (this.useBackend) {
                // Reload inventory from backend
                const charmInventory = await inventoryService.getCharmInventory();
                this.currentInventory = charmInventory;
                
                // Reload the charm library
                this.loadCharmLibrary();
                this.updateInventoryStatus();
                
                this.showMessage('Inventory updated!', 'info');
            }
        } catch (error) {
            console.error('Failed to refresh inventory:', error);
        }
    }

    /**
     * Show import dialog for testing/admin purposes
     */
    showImportDialog() {
        if (!this.useBackend) {
            this.showError('Backend integration required for data import');
            return;
        }

        const result = confirm(
            'This will import the AliExpress inventory data into the database. ' +
            'This action is intended for testing and admin use only. Continue?'
        );

        if (result) {
            this.performDataImport();
        }
    }

    /**
     * Perform data import (testing/admin function)
     */
    async performDataImport() {
        try {
            this.showMessage('Starting data import...', 'info');
            
            // For demo purposes, we'll simulate the import
            // In a real scenario, you'd load the actual JSON file
            console.log('Data import feature available - see InventoryImporter class');
            
            this.showMessage('Data import completed! (Demo mode)', 'success');
            
            // Refresh the inventory display
            await this.refreshInventoryDisplay();
            
        } catch (error) {
            console.error('Import failed:', error);
            this.showError('Data import failed. Check console for details.');
        }
    }

    /**
     * Populate necklace UI elements with actual images
     */
    populateNecklaceUI() {
        const necklaceThumb = document.getElementById('necklace-thumb');
        if (necklaceThumb) {
            necklaceThumb.src = necklaceImages.plainChain;
        }
    }

    /**
     * Update control button states
     */
    updateControlButtons() {
        if (!this.customizer) return;

        const buttons = this.elements.controlButtons;
        
        if (buttons.undo) {
            buttons.undo.disabled = !this.customizer.canUndo();
        }

        if (buttons.redo) {
            buttons.redo.disabled = !this.customizer.canRedo();
        }

        const hasCharms = this.customizer.charmManager.getCharmCount() > 0;
        
        if (buttons.clear) {
            buttons.clear.disabled = !hasCharms;
        }

        if (buttons.export) {
            buttons.export.disabled = !hasCharms;
        }
    }

    /**
     * Show export modal
     */
    showExportModal() {
        if (this.elements.modal) {
            this.elements.modal.style.display = 'flex';
            
            // Generate preview
            this.generateExportPreview();
        }
    }

    /**
     * Hide export modal
     */
    hideExportModal() {
        if (this.elements.modal) {
            this.elements.modal.style.display = 'none';
        }
    }

    /**
     * Generate export preview
     */
    async generateExportPreview() {
        const previewEl = document.getElementById('export-preview');
        if (!previewEl) return;

        try {
            previewEl.innerHTML = '<p>Generating preview...</p>';
            
            // Generate small preview image
            const preview = await this.customizer.exportDesign({
                format: 'PNG',
                width: 400,
                height: 300,
                includeInstructions: false
            });

            previewEl.innerHTML = `
                <img src="${preview.dataURL}" alt="Export Preview" style="max-width: 100%; border-radius: 4px;" />
                <p style="margin-top: 10px; font-size: 0.9rem; color: #666;">
                    Preview (${preview.width}×${preview.height}px, ${preview.fileSize})
                </p>
            `;
            
        } catch (error) {
            console.error('Failed to generate preview:', error);
            previewEl.innerHTML = '<p style="color: #dc3545;">Failed to generate preview</p>';
        }
    }

    /**
     * Perform export based on selected format
     */
    async performExport() {
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
            
            // Generate filename
            const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
            const filename = `timothie-jewelry-design-${timestamp}`;
            
            // Download the export
            this.customizer.exportManager.downloadExport(exportData, filename);
            
            this.hideExportModal();
            this.showMessage('Design exported successfully!', 'success');
            
        } catch (error) {
            console.error('Export failed:', error);
            this.showError('Export failed. Please try again.');
        }
    }

    /**
     * Show success/info message
     */
    showMessage(message, type = 'info') {
        // Create or reuse message element
        let messageEl = document.getElementById('app-message');
        if (!messageEl) {
            messageEl = document.createElement('div');
            messageEl.id = 'app-message';
            messageEl.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 12px 20px;
                border-radius: 6px;
                color: white;
                font-weight: 500;
                z-index: 2000;
                opacity: 0;
                transition: opacity 0.3s ease;
            `;
            document.body.appendChild(messageEl);
        }

        // Set message and styling
        messageEl.textContent = message;
        messageEl.className = `message-${type}`;
        
        // Set background color based on type
        const colors = {
            success: '#28a745',
            error: '#dc3545',
            warning: '#ffc107',
            info: '#17a2b8'
        };
        messageEl.style.backgroundColor = colors[type] || colors.info;

        // Show message
        messageEl.style.opacity = '1';

        // Hide after 3 seconds
        setTimeout(() => {
            messageEl.style.opacity = '0';
        }, 3000);
    }

    /**
     * Show error message
     */
    showError(message) {
        this.showMessage(message, 'error');
    }

    /**
     * Wait for customizer initialization
     */
    async waitForInitialization() {
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
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    const app = new JewelryCustomizerApp();
    
    // Store app instance globally for debugging
    window.JewelryApp = app;
    
    // Initialize the application
    await app.init();
});

// Handle page unload
window.addEventListener('beforeunload', (e) => {
    // Could save current work here
    console.log('Application shutting down...');
});