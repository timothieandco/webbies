/**
 * Timothie & Co Jewelry Customizer - Main Entry Point
 * Initializes the application and handles UI interactions
 */

import '../css/main.css';
import JewelryCustomizer from './core/JewelryCustomizer.js';
import { charmImages, necklaceImages } from './utils/images.js';
import './debug/dragTest.js';

class JewelryCustomizerApp {
    constructor() {
        this.customizer = null;
        this.isInitialized = false;
        
        // UI Elements
        this.elements = {
            canvas: null,
            charmLibrary: null,
            controlButtons: {},
            modal: null
        };
        
        // Sample data using your uploaded charm images
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
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            console.log('Initializing Jewelry Customizer...');
            
            // Get UI elements
            this.getUIElements();
            
            // Initialize the customizer with cart functionality
            this.customizer = new JewelryCustomizer('jewelry-canvas', {
                width: 800,
                height: 600,
                maxCharms: 10,
                enableAnimation: true,
                enableCart: true,
                cartSidebarContainer: 'cart-sidebar-container',
                cartIconContainer: 'cart-icon-container',
                autoShowCartOnAdd: true,
                enableCartIntegration: true
            });

            // Setup event callbacks
            this.setupCustomizerCallbacks();
            
            // Setup UI interactions
            this.setupUIInteractions();
            
            // Load charm library
            this.loadCharmLibrary();
            
            // Populate necklace thumbnail
            this.populateNecklaceUI();
            
            // Initialize cart functionality
            this.initializeCartFeatures();
            
            // Wait for customizer to initialize
            await this.waitForInitialization();
            
            this.isInitialized = true;
            console.log('Jewelry Customizer initialized successfully!');
            
        } catch (error) {
            console.error('Failed to initialize application:', error);
            this.showError('Failed to initialize the jewelry customizer. Please refresh the page.');
        }
    }

    /**
     * Get references to UI elements
     */
    getUIElements() {
        this.elements.canvas = document.getElementById('jewelry-canvas');
        this.elements.charmLibrary = document.getElementById('charm-library');
        this.elements.modal = document.getElementById('export-modal');
        
        // Control buttons
        this.elements.controlButtons = {
            undo: document.getElementById('undo-btn'),
            redo: document.getElementById('redo-btn'),
            clear: document.getElementById('clear-btn'),
            save: document.getElementById('save-btn'),
            export: document.getElementById('export-btn'),
            addToCart: document.getElementById('add-to-cart-btn')
        };

        // Cart elements
        this.elements.cartToggle = document.getElementById('toggle-cart');
        this.elements.quickAddTabs = document.querySelectorAll('.quick-add-tab');
        this.elements.quickAddItems = document.getElementById('quick-add-items');

        // Validate all elements exist
        for (const [key, element] of Object.entries(this.elements.controlButtons)) {
            if (!element) {
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

        if (this.elements.controlButtons.addToCart) {
            this.elements.controlButtons.addToCart.addEventListener('click', () => {
                this.addDesignToCart();
            });
        }

        // Cart toggle
        if (this.elements.cartToggle) {
            this.elements.cartToggle.addEventListener('click', () => {
                this.toggleCartSection();
            });
        }

        // Quick add tabs
        this.elements.quickAddTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                this.selectQuickAddCategory(e.target.dataset.category);
                
                // Update active state
                this.elements.quickAddTabs.forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
            });
        });

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
     * Populate necklace UI elements with actual images
     */
    populateNecklaceUI() {
        const necklaceThumb = document.getElementById('necklace-thumb');
        if (necklaceThumb) {
            necklaceThumb.src = necklaceImages.plainChain;
        }
    }

    /**
     * Load charm library into UI
     */
    loadCharmLibrary() {
        if (!this.elements.charmLibrary) return;

        // Clear existing charms
        this.elements.charmLibrary.innerHTML = '';

        // Add each charm
        this.sampleCharms.forEach(charm => {
            const charmElement = this.createCharmElement(charm);
            this.elements.charmLibrary.appendChild(charmElement);
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

        element.innerHTML = `
            <img src="${charm.imageUrl}" alt="${charm.name}" class="charm-image" />
            <span class="charm-name">${charm.name}</span>
            <span class="charm-price">$${charm.price}</span>
            <div class="charm-tooltip">${charm.name} - $${charm.price}.00 USD</div>
        `;

        // Setup drag and drop
        element.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('application/json', JSON.stringify(charm));
            e.dataTransfer.effectAllowed = 'copy';
        });

        // Setup click to add (alternative to drag)
        element.addEventListener('click', () => {
            this.addCharmToCanvas(charm);
        });

        return element;
    }

    /**
     * Add charm to canvas at center position
     */
    async addCharmToCanvas(charmData) {
        if (!this.customizer) return;

        const centerX = this.customizer.stage.width() / 2;
        const centerY = this.customizer.stage.height() / 2;
        
        // Add slight random offset to avoid stacking
        const offsetX = (Math.random() - 0.5) * 100;
        const offsetY = (Math.random() - 0.5) * 100;

        await this.customizer.addCharm(charmData, {
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
            totalPriceEl.textContent = `$${totalPrice}`;
        }
    }

    /**
     * Calculate total price of placed charms
     */
    calculateTotalPrice() {
        if (!this.customizer) return 0;

        const placedCharms = this.customizer.charmManager.getCharmData();
        return placedCharms.reduce((total, charm) => {
            const charmData = this.sampleCharms.find(c => c.id === charm.id);
            return total + (charmData ? charmData.price : 0);
        }, 0);
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
     * Save design to localStorage
     */
    saveDesign() {
        if (!this.customizer) return;

        try {
            const designData = this.customizer.getDesignData();
            localStorage.setItem('timothie_saved_design', JSON.stringify(designData));
            
            // Show success feedback
            this.showMessage('Design saved successfully!', 'success');
            
        } catch (error) {
            console.error('Failed to save design:', error);
            this.showError('Failed to save design. Please try again.');
        }
    }

    /**
     * Load saved design
     */
    async loadSavedDesign() {
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
            if (selectedFormat === 'cart') {
                // Export to cart instead of downloading
                await this.addDesignToCart();
                this.hideExportModal();
                return;
            }

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
     * Initialize cart-specific features
     */
    async initializeCartFeatures() {
        // Load quick add items
        this.loadQuickAddItems();
        
        // Setup cart event listeners
        this.setupCartEventListeners();
        
        // Initialize cart toggle state
        this.initializeCartToggleState();
    }

    /**
     * Setup cart-specific event listeners
     */
    setupCartEventListeners() {
        // Listen for cart updates to update UI
        document.addEventListener('cart-updated', (event) => {
            this.updateCartRelatedUI(event.detail);
        });

        // Listen for design exported to cart
        document.addEventListener('design-exported-to-cart', (event) => {
            this.showMessage('Design successfully added to cart!', 'success');
            this.updateDesignInfo();
        });
    }

    /**
     * Add current design to cart
     */
    async addDesignToCart() {
        if (!this.customizer) {
            this.showError('Customizer not initialized');
            return;
        }

        try {
            const designData = this.customizer.getDesignData();
            if (!designData.charms || designData.charms.length === 0) {
                this.showError('Please add some charms to your design before adding to cart');
                return;
            }

            const metadata = {
                name: `Custom Design ${new Date().toLocaleDateString()}`,
                description: `Custom jewelry design with ${designData.charms.length} charms`,
                price: this.calculateTotalPrice(),
                category: 'custom-design'
            };

            await this.customizer.exportToCart(metadata);
            
        } catch (error) {
            console.error('Failed to add design to cart:', error);
            this.showError(error.message || 'Failed to add design to cart');
        }
    }

    /**
     * Toggle cart section visibility
     */
    toggleCartSection() {
        const cartContainer = document.getElementById('cart-sidebar-container');
        const toggleIcon = this.elements.cartToggle?.querySelector('.toggle-icon');
        
        if (cartContainer) {
            const isHidden = cartContainer.style.display === 'none';
            cartContainer.style.display = isHidden ? 'block' : 'none';
            
            if (toggleIcon) {
                toggleIcon.textContent = isHidden ? '▲' : '▼';
            }
        }
    }

    /**
     * Initialize cart toggle state
     */
    initializeCartToggleState() {
        const cartContainer = document.getElementById('cart-sidebar-container');
        if (cartContainer) {
            cartContainer.style.display = 'block'; // Start expanded
        }
    }

    /**
     * Load quick add items
     */
    loadQuickAddItems() {
        if (!this.elements.quickAddItems) return;

        // Sample quick add items - these would come from your inventory API
        const quickAddItems = {
            chains: [
                { id: 'chain-gold-18', name: 'Gold Chain 18"', price: 45, imageUrl: necklaceImages.plainChain },
                { id: 'chain-silver-20', name: 'Silver Chain 20"', price: 35, imageUrl: necklaceImages.plainChain }
            ],
            charms: this.sampleCharms.slice(0, 4), // Show first 4 charms
            accessories: [
                { id: 'jump-rings', name: 'Jump Rings (10pk)', price: 8, imageUrl: '/placeholder-jump-rings.jpg' },
                { id: 'jewelry-box', name: 'Gift Box', price: 12, imageUrl: '/placeholder-box.jpg' }
            ]
        };

        // Load initial category (chains)
        this.selectQuickAddCategory('chains', quickAddItems);
    }

    /**
     * Select quick add category
     */
    selectQuickAddCategory(category, itemData = null) {
        if (!this.elements.quickAddItems) return;

        // Default items if not provided
        const defaultItems = {
            chains: [
                { id: 'chain-gold-18', name: 'Gold Chain 18"', price: 45, imageUrl: necklaceImages.plainChain },
                { id: 'chain-silver-20', name: 'Silver Chain 20"', price: 35, imageUrl: necklaceImages.plainChain }
            ],
            charms: this.sampleCharms.slice(0, 4),
            accessories: [
                { id: 'jump-rings', name: 'Jump Rings (10pk)', price: 8, imageUrl: '/placeholder-jump-rings.jpg' },
                { id: 'jewelry-box', name: 'Gift Box', price: 12, imageUrl: '/placeholder-box.jpg' }
            ]
        };

        const items = itemData ? itemData[category] : defaultItems[category];
        
        // Clear current items
        this.elements.quickAddItems.innerHTML = '';

        // Add items for selected category
        if (items && items.length > 0) {
            items.forEach(item => {
                const itemElement = this.createQuickAddItem(item, category);
                this.elements.quickAddItems.appendChild(itemElement);
            });
        } else {
            this.elements.quickAddItems.innerHTML = '<p class="no-items">No items available</p>';
        }
    }

    /**
     * Create quick add item element
     */
    createQuickAddItem(item, category) {
        const element = document.createElement('div');
        element.className = 'quick-add-item';
        
        element.innerHTML = `
            <img src="${item.imageUrl}" alt="${item.name}" class="quick-add-image" onerror="this.src='/placeholder.jpg'" />
            <div class="quick-add-info">
                <span class="quick-add-name">${item.name}</span>
                <span class="quick-add-price">$${item.price}</span>
            </div>
            <button class="quick-add-btn" data-item-id="${item.id}">Add to Cart</button>
        `;

        // Add to cart handler
        const addButton = element.querySelector('.quick-add-btn');
        addButton.addEventListener('click', () => {
            this.addItemToCart(item);
        });

        return element;
    }

    /**
     * Add item to cart
     */
    async addItemToCart(item) {
        if (!this.customizer) return;

        try {
            await this.customizer.addItemToCart(item, 1);
            this.showMessage(`${item.name} added to cart!`, 'success');
        } catch (error) {
            console.error('Failed to add item to cart:', error);
            this.showError(error.message || 'Failed to add item to cart');
        }
    }

    /**
     * Update cart-related UI elements
     */
    updateCartRelatedUI(cartSummary) {
        // Update design info to show cart context
        if (cartSummary) {
            const inventoryStatusEl = document.getElementById('inventory-status');
            if (inventoryStatusEl) {
                inventoryStatusEl.textContent = `${cartSummary.itemCount} items in cart`;
            }
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