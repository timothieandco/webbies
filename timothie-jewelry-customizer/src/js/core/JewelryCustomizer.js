/**
 * Timothie & Co Jewelry Customizer - Main Application Class
 * Handles the core canvas setup, layer management, and coordinate user interactions
 * Now includes comprehensive cart integration for seamless e-commerce functionality
 */

import Konva from 'konva';
import CharmManager from './CharmManager.js';
import StateManager from './StateManager.js';
import ExportManager from './ExportManager.js';
import ImageLoader from '../utils/ImageLoader.js';
import { necklaceImages } from '../utils/images.js';

export default class JewelryCustomizer {
    constructor(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        if (!this.container) {
            throw new Error(`Container with id "${containerId}" not found`);
        }

        // Configuration options with defaults - increased canvas size for better visibility
        this.options = {
            width: options.width || 1000,
            height: options.height || 750,
            backgroundColor: options.backgroundColor || '#ffffff',
            maxCharms: options.maxCharms || 12,
            minCharmSpacing: options.minCharmSpacing || 30,
            enableAnimation: options.enableAnimation !== false,
            // Cart configuration
            enableCart: options.enableCart !== false,
            cartSidebarContainer: options.cartSidebarContainer || 'cart-sidebar-container',
            cartIconContainer: options.cartIconContainer || 'cart-icon-container',
            autoShowCartOnAdd: options.autoShowCartOnAdd !== false,
            enableCartIntegration: options.enableCartIntegration !== false,
            ...options
        };

        // External services (can be injected for modular architecture)
        this.cartService = options.cartService || null;
        this.inventoryService = options.inventoryService || null;
        this.storageService = options.storageService || null;

        // Core Konva components
        this.stage = null;
        this.backgroundLayer = null;
        this.charmLayer = null;
        this.uiLayer = null;

        // Application state
        this.selectedCharm = null;
        this.currentNecklace = null;
        this.isLoading = false;
        this.isDragging = false;

        // Managers
        this.charmManager = null;
        this.stateManager = null;
        this.exportManager = null;
        this.imageLoader = null;
        this.cartManager = null;

        // Cart UI components
        this.cartSidebar = null;
        this.cartIcon = null;

        // Event callbacks
        this.onCharmPlaced = null;
        this.onCharmRemoved = null;
        this.onStateChanged = null;
        this.onError = null;

        // Initialize the application
        this.init();
    }

    /**
     * Initialize the jewelry customizer
     */
    async init() {
        try {
            console.log('🔍 JewelryCustomizer.init() starting...');
            
            console.log('🔍 Step 1: showLoading()');
            this.showLoading();
            
            console.log('🔍 Step 2: createStage()');
            this.createStage();
            
            console.log('🔍 Step 3: createLayers()');
            this.createLayers();
            
            console.log('🔍 Step 4: initializeManagers()');
            this.initializeManagers();
            
            console.log('🔍 Step 5: initializeCart()');
            if (this.options.enableCart) {
                await this.initializeCart();
            } else {
                console.log('🔍 Cart disabled, skipping cart initialization');
            }
            
            console.log('🔍 Step 6: setupEventHandlers()');
            this.setupEventHandlers();
            
            console.log('🔍 Step 7: loadDefaultNecklace() - THIS MIGHT HANG');
            await this.loadDefaultNecklace();
            console.log('🔍 Step 7 COMPLETED: loadDefaultNecklace()');
            
            console.log('🔍 Step 8: hideLoading()');
            this.hideLoading();
            
            console.log('✅ Jewelry Customizer initialized successfully');
        } catch (error) {
            console.error('💥 JewelryCustomizer.init() failed:', error);
            this.handleError('Failed to initialize customizer', error);
            throw error; // Re-throw for parent handling
        }
    }

    /**
     * Create the main Konva stage
     */
    createStage() {
        // Calculate responsive dimensions - use more available space
        const containerRect = this.container.getBoundingClientRect();
        const width = Math.min(this.options.width, containerRect.width * 0.95);
        const height = Math.min(this.options.height, containerRect.height * 0.9);

        console.log('🎪 Creating Konva stage:', width, 'x', height, 'in container:', this.container);
        console.log('📊 Container info:', {
            id: this.container.id,
            offsetWidth: this.container.offsetWidth,
            offsetHeight: this.container.offsetHeight,
            clientWidth: this.container.clientWidth,
            clientHeight: this.container.clientHeight,
            style: this.container.style.cssText,
            computedStyle: window.getComputedStyle(this.container).display
        });

        this.stage = new Konva.Stage({
            container: this.container,
            width: width,
            height: height,
            draggable: false,
            listening: true
        });

        console.log('✅ Konva stage created successfully', {
            stageWidth: this.stage.width(),
            stageHeight: this.stage.height(),
            container: this.stage.container()
        });

        // Handle stage resize
        this.handleResize();
        window.addEventListener('resize', () => this.handleResize());
    }

    /**
     * Create the layer hierarchy for optimal performance
     */
    createLayers() {
        // Background layer - static content (necklace base)
        this.backgroundLayer = new Konva.Layer({
            name: 'background',
            listening: false  // Background doesn't need to listen for events
        });

        // Charm layer - interactive draggable elements
        this.charmLayer = new Konva.Layer({
            name: 'charms',
            listening: true,
            draggable: false  // Layer itself shouldn't be draggable, only children
        });

        // UI layer - selection indicators and controls
        this.uiLayer = new Konva.Layer({
            name: 'ui',
            listening: true,
            draggable: false
        });

        // Add layers to stage in correct order
        this.stage.add(this.backgroundLayer);
        this.stage.add(this.charmLayer);
        this.stage.add(this.uiLayer);

        console.log('🎨 Canvas layers created:', {
            background: { listening: this.backgroundLayer.listening() },
            charms: { listening: this.charmLayer.listening(), draggable: this.charmLayer.draggable() },
            ui: { listening: this.uiLayer.listening() },
            stage: { listening: this.stage.listening() }
        });
        
        // Force redraw
        this.stage.draw();
    }

    /**
     * Initialize manager classes
     */
    initializeManagers() {
        this.imageLoader = new ImageLoader();
        this.charmManager = new CharmManager(this.charmLayer, this.options);
        this.stateManager = new StateManager(this.options.maxHistorySize || 50);
        this.exportManager = new ExportManager(this);

        // Connect manager events
        this.charmManager.onCharmPlaced = (charm) => this.handleCharmPlaced(charm);
        this.charmManager.onCharmMoved = (charm) => this.handleCharmMoved(charm);
        this.charmManager.onCharmSelected = (charm) => this.handleCharmSelected(charm);
        this.charmManager.onError = (error) => this.handleError('Charm operation failed', error);
    }

    /**
     * Initialize cart functionality
     */
    async initializeCart() {
        try {
            // Use injected cart service or create fallback
            if (this.cartService) {
                this.cartManager = this.cartService;
            } else {
                // Fallback: try to dynamically import and create CartManager if available
                try {
                    const { default: CartManager } = await import('./CartManager.js');
                    this.cartManager = new CartManager(this.options);
                } catch (error) {
                    console.warn('CartManager not available, cart functionality disabled');
                    this.options.enableCart = false;
                    return;
                }
            }
            
            // Initialize cart UI components if cart manager is available
            if (this.cartManager) {
                await this.initializeCartUI();
                
                // Integrate cart with state manager
                if (this.options.enableCartIntegration && this.stateManager.initializeCartIntegration) {
                    this.stateManager.initializeCartIntegration(this.cartManager);
                }
                
                // Setup cart event handlers
                this.setupCartEventHandlers();
                
                console.log('Cart functionality initialized successfully');
            }
        } catch (error) {
            console.error('Failed to initialize cart functionality:', error);
            // Continue without cart functionality
            this.options.enableCart = false;
        }
    }

    /**
     * Initialize cart UI components
     */
    async initializeCartUI() {
        try {
            // Initialize cart sidebar with dynamic import
            const sidebarContainer = document.getElementById(this.options.cartSidebarContainer);
            if (sidebarContainer) {
                try {
                    const { default: CartSidebar } = await import('../components/CartSidebar.js');
                    this.cartSidebar = new CartSidebar(
                        this.options.cartSidebarContainer, 
                        this.cartManager, 
                        {
                            position: 'right',
                            showTotals: true,
                            enableQuantityEdit: true,
                            enableRemove: true,
                            showThumbnails: true
                        }
                    );
                    
                    // Store reference for external access
                    sidebarContainer.cartSidebarInstance = this.cartSidebar;
                } catch (error) {
                    console.warn('CartSidebar component not available:', error.message);
                }
            } else {
                console.warn(`Cart sidebar container '${this.options.cartSidebarContainer}' not found`);
            }

            // Initialize cart icon with dynamic import
            const iconContainer = document.getElementById(this.options.cartIconContainer);
            if (iconContainer) {
                try {
                    const { default: CartIcon } = await import('../components/CartIcon.js');
                    this.cartIcon = new CartIcon(
                        this.options.cartIconContainer, 
                        this.cartManager, 
                        {
                            showCount: true,
                            showTotal: false,
                            animateUpdates: true,
                            size: 'medium',
                            style: 'default',
                            clickAction: 'sidebar'
                        }
                    );
                } catch (error) {
                    console.warn('CartIcon component not available:', error.message);
                }
            } else {
                console.warn(`Cart icon container '${this.options.cartIconContainer}' not found`);
            }
        } catch (error) {
            console.error('Failed to initialize cart UI:', error);
        }
    }

    /**
     * Setup cart-specific event handlers
     */
    setupCartEventHandlers() {
        // Listen for cart events to update UI
        this.cartManager.subscribe(EVENTS.CART_ITEM_ADDED, (data) => {
            if (this.options.autoShowCartOnAdd && this.cartSidebar) {
                this.cartSidebar.show();
            }
            
            // Auto-save design state when items are added to cart
            if (this.options.enableCartIntegration) {
                const currentState = this.exportManager.getCurrentState();
                this.stateManager.autoSaveForCartChange(currentState, 'Item added to cart');
            }
        });

        // Listen for design export events
        document.addEventListener('design-exported-to-cart', (event) => {
            const { designData, cartItem } = event.detail;
            console.log('Design exported to cart:', designData, cartItem);
        });

        // Listen for cart validation failures
        this.cartManager.subscribe(EVENTS.CART_VALIDATION_FAILED, (data) => {
            this.showNotification('Please review cart items before proceeding', 'warning');
        });

        // Listen for cart errors
        this.cartManager.subscribe(EVENTS.CART_ERROR, (data) => {
            this.showNotification(data.error, 'error');
        });
    }

    /**
     * Setup event handlers for user interactions
     */
    setupEventHandlers() {
        // Stage click events for deselection
        this.stage.on('click tap', (e) => {
            // If clicked on empty space, deselect current charm
            if (e.target === this.stage) {
                this.deselectCharm();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.target.tagName === 'INPUT') return; // Ignore when typing in inputs

            switch (e.key) {
                case 'Delete':
                case 'Backspace':
                    if (this.selectedCharm) {
                        this.removeCharm(this.selectedCharm.id());
                        e.preventDefault();
                    }
                    break;
                case 'z':
                    if (e.ctrlKey || e.metaKey) {
                        e.shiftKey ? this.redo() : this.undo();
                        e.preventDefault();
                    }
                    break;
                case 'Escape':
                    this.deselectCharm();
                    break;
            }
        });

        // Handle drag and drop from charm library
        this.setupDragAndDrop();
    }

    /**
     * Setup drag and drop from external charm library
     */
    setupDragAndDrop() {
        // Get the stage container position for coordinate conversion
        this.stage.on('dragover', (e) => {
            e.evt.preventDefault();
        });

        this.stage.on('drop', async (e) => {
            e.evt.preventDefault();
            
            // Get charm data from drag event
            const charmData = JSON.parse(e.evt.dataTransfer.getData('application/json'));
            
            // Get drop position relative to stage
            this.stage.setPointersPositions(e.evt);
            const position = this.stage.getPointerPosition();
            
            // Add charm at drop position
            await this.addCharm(charmData, position);
        });
    }

    /**
     * Load the default necklace base
     */
    async loadDefaultNecklace() {
        console.log('🔍 loadDefaultNecklace() starting...');
        
        const defaultNecklaceData = {
            id: 'classic-chain',
            name: 'Classic Chain',
            imageUrl: necklaceImages.plainChain,
            attachmentZones: this.generateAttachmentZones()
        };

        console.log('🔗 Loading default necklace with imageUrl:', defaultNecklaceData.imageUrl);
        console.log('🔍 About to call loadNecklace()...');
        
        try {
            await this.loadNecklace(defaultNecklaceData);
            console.log('🔍 loadNecklace() completed successfully');
        } catch (error) {
            console.error('💥 loadNecklace() failed:', error);
            throw error;
        }
        
        console.log('🔍 loadDefaultNecklace() completed');
    }

    /**
     * Load a necklace base image
     */
    async loadNecklace(necklaceData) {
        try {
            console.log('🔍 loadNecklace() starting with data:', necklaceData);
            
            console.log('🔍 Step A: showLoading()');
            this.showLoading();

            console.log('🔍 Step B: Loading necklace image');
            console.log('📷 Loading necklace image from:', necklaceData.imageUrl);
            
            // Add timeout to image loading
            const imageLoadPromise = this.imageLoader.loadImage(necklaceData.imageUrl);
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Image loading timeout after 5 seconds')), 5000);
            });
            
            const imageObj = await Promise.race([imageLoadPromise, timeoutPromise]);
            console.log('✅ Necklace image loaded successfully:', imageObj.width, 'x', imageObj.height);
            
            console.log('🔍 Step C: Remove existing necklace');
            this.backgroundLayer.destroyChildren();

            console.log('🔍 Step D: Calculate scaled dimensions');
            const scale = this.calculateImageScale(imageObj, this.stage.width(), this.stage.height(), 1.7);
            const scaledWidth = imageObj.width * scale;
            const scaledHeight = imageObj.height * scale;
            console.log('📏 Scale calculated:', { scale, scaledWidth, scaledHeight });

            console.log('🔍 Step E: Create necklace image node');
            const necklaceImage = new Konva.Image({
                x: (this.stage.width() - scaledWidth) / 2,
                y: (this.stage.height() - scaledHeight) / 2,
                image: imageObj,
                width: scaledWidth,
                height: scaledHeight,
                name: 'necklace-base',
                id: necklaceData.id
            });

            console.log('🔍 Step F: Add to background layer and draw');
            this.backgroundLayer.add(necklaceImage);
            console.log('🎨 Added necklace to background layer, drawing...');
            this.backgroundLayer.draw();
            console.log('🖼️ Background layer drawn successfully');
            
            console.log('🔍 Step G: Debug info');
            console.log('📊 Canvas debug info:', {
                stageSize: { width: this.stage.width(), height: this.stage.height() },
                layerChildren: this.backgroundLayer.children.length,
                necklacePosition: { x: necklaceImage.x(), y: necklaceImage.y() },
                necklaceSize: { width: necklaceImage.width(), height: necklaceImage.height() }
            });

            console.log('🔍 Step H: Store necklace data');
            this.currentNecklace = {
                ...necklaceData,
                konvaImage: necklaceImage,
                scale: scale
            };

            console.log('🔍 Step I: Update charm manager');
            this.charmManager.setAttachmentZones(necklaceData.attachmentZones, necklaceImage);

            console.log('🔍 Step J: Cache background layer');
            this.backgroundLayer.cache();

            console.log('🔍 Step K: hideLoading()');
            this.hideLoading();
            
            console.log(`✅ Necklace "${necklaceData.name}" loaded successfully`);
        } catch (error) {
            console.error('💥 loadNecklace() failed at step:', error);
            this.handleError(`Failed to load necklace: ${necklaceData.name}`, error);
            throw error; // Re-throw for parent handling
        }
    }

    /**
     * Add a charm to the canvas
     */
    async addCharm(charmData, position) {
        try {
            // Check if we've reached the maximum number of charms
            if (this.charmManager.getCharmCount() >= this.options.maxCharms) {
                throw new Error(`Maximum ${this.options.maxCharms} charms allowed`);
            }

            // Add charm using CharmManager
            const charm = await this.charmManager.addCharm(charmData, position);
            
            // Save state for undo functionality
            this.saveState();
            
            // Trigger callback
            if (this.onCharmPlaced) {
                this.onCharmPlaced(charm);
            }

            return charm;
        } catch (error) {
            this.handleError('Failed to add charm', error);
            return null;
        }
    }

    /**
     * Remove a charm from the canvas
     */
    removeCharm(charmId) {
        try {
            const removed = this.charmManager.removeCharm(charmId);
            
            if (removed) {
                // Clear selection if this was the selected charm
                if (this.selectedCharm && this.selectedCharm.id() === charmId) {
                    this.deselectCharm();
                }
                
                // Save state for undo functionality
                this.saveState();
                
                // Trigger callback
                if (this.onCharmRemoved) {
                    this.onCharmRemoved(charmId);
                }
            }
            
            return removed;
        } catch (error) {
            this.handleError('Failed to remove charm', error);
            return false;
        }
    }

    /**
     * Clear all charms from the canvas
     */
    clearAllCharms() {
        try {
            this.charmManager.clearAll();
            this.deselectCharm();
            this.saveState();
            
            console.log('All charms cleared');
        } catch (error) {
            this.handleError('Failed to clear charms', error);
        }
    }

    /**
     * Select a charm
     */
    selectCharm(charm) {
        this.deselectCharm(); // Clear previous selection
        
        this.selectedCharm = charm;
        this.charmManager.showSelection(charm);
        
        console.log(`Charm selected: ${charm.id()}`);
    }

    /**
     * Deselect the currently selected charm
     */
    deselectCharm() {
        if (this.selectedCharm) {
            this.charmManager.hideSelection();
            this.selectedCharm = null;
            console.log('Charm deselected');
        }
    }

    /**
     * Save current state for undo/redo
     */
    saveState() {
        const state = this.charmManager.getState();
        this.stateManager.saveState(state);
        
        if (this.onStateChanged) {
            this.onStateChanged();
        }
    }

    /**
     * Undo last action
     */
    undo() {
        const previousState = this.stateManager.undo();
        if (previousState) {
            this.charmManager.loadState(previousState);
            this.deselectCharm();
            console.log('Undo performed');
        }
    }

    /**
     * Redo last undone action
     */
    redo() {
        const nextState = this.stateManager.redo();
        if (nextState) {
            this.charmManager.loadState(nextState);
            this.deselectCharm();
            console.log('Redo performed');
        }
    }

    /**
     * Check if undo is available
     */
    canUndo() {
        return this.stateManager.canUndo();
    }

    /**
     * Check if redo is available
     */
    canRedo() {
        return this.stateManager.canRedo();
    }

    /**
     * Export the current design
     */
    async exportDesign(options = {}) {
        try {
            return await this.exportManager.exportDesign(options);
        } catch (error) {
            this.handleError('Failed to export design', error);
            return null;
        }
    }

    /**
     * Get current design data
     */
    getDesignData() {
        return {
            necklace: this.currentNecklace ? {
                id: this.currentNecklace.id,
                name: this.currentNecklace.name
            } : null,
            charms: this.charmManager.getCharmData(),
            timestamp: Date.now()
        };
    }

    /**
     * Load design data
     */
    async loadDesign(designData) {
        try {
            this.showLoading();
            
            // Load necklace if different from current
            if (designData.necklace && (!this.currentNecklace || this.currentNecklace.id !== designData.necklace.id)) {
                await this.loadNecklace(designData.necklace);
            }
            
            // Clear existing charms
            this.clearAllCharms();
            
            // Load charms
            for (const charmData of designData.charms) {
                await this.addCharm(charmData, { x: charmData.x, y: charmData.y });
            }
            
            this.hideLoading();
            console.log('Design loaded successfully');
        } catch (error) {
            this.handleError('Failed to load design', error);
        }
    }

    /**
     * Handle charm placement
     */
    handleCharmPlaced(charm) {
        console.log(`Charm placed: ${charm.id()}`);
        // Removed auto-selection to allow immediate dragging
        // Users can still click on charms to select them
    }

    /**
     * Handle charm movement
     */
    handleCharmMoved(charm) {
        this.saveState();
    }

    /**
     * Handle charm selection
     */
    handleCharmSelected(charm) {
        this.selectCharm(charm);
    }

    /**
     * Handle responsive resize
     */
    handleResize() {
        const containerRect = this.container.getBoundingClientRect();
        // Improved responsive sizing - use more of the available space
        const newWidth = Math.min(this.options.width, containerRect.width * 0.95);
        const newHeight = Math.min(this.options.height, containerRect.height * 0.9);

        this.stage.width(newWidth);
        this.stage.height(newHeight);
        
        // Redraw all layers
        this.stage.draw();
    }

    /**
     * Calculate optimal image scale to fit within bounds
     */
    calculateImageScale(image, maxWidth, maxHeight, padding = 0.9) {
        const scaleX = (maxWidth * padding) / image.width;
        const scaleY = (maxHeight * padding) / image.height;
        return Math.min(scaleX, scaleY);
    }

    /**
     * Generate attachment zones for the necklace
     */
    generateAttachmentZones() {
        // Default attachment zones for a standard necklace
        // These would normally be customized per necklace type
        const zones = [];
        const centerX = this.options.width / 2;
        const centerY = this.options.height / 2;
        const radius = 360; // Doubled radius to match 2x scale

        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2 - Math.PI / 2; // Start from top
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            
            zones.push({
                x: x,
                y: y,
                radius: 50, // Doubled zone radius to match 2x scale
                occupied: false
            });
        }

        return zones;
    }

    /**
     * Show loading indicator
     */
    showLoading() {
        this.isLoading = true;
        // Show the entire canvas overlay (which contains the loading indicator)
        const overlayEl = document.querySelector('.canvas-overlay');
        if (overlayEl) {
            overlayEl.style.display = 'flex';
        }
        
        const loadingEl = document.getElementById('loading-indicator');
        if (loadingEl) {
            loadingEl.style.display = 'block';
        }
    }

    /**
     * Hide loading indicator
     */
    hideLoading() {
        this.isLoading = false;
        // Hide the entire canvas overlay to reveal the Konva canvas
        const overlayEl = document.querySelector('.canvas-overlay');
        if (overlayEl) {
            console.log('🎭 Hiding canvas overlay - this could be blocking interactions!');
            overlayEl.style.display = 'none';
        } else {
            console.warn('⚠️ Canvas overlay not found!');
        }
        
        const loadingEl = document.getElementById('loading-indicator');
        if (loadingEl) {
            loadingEl.style.display = 'none';
        }
        
        // Debug: Check if Konva canvas is actually visible
        setTimeout(() => {
            const konvaCanvas = document.querySelector('canvas');
            if (konvaCanvas) {
                console.log('🎨 Konva canvas found:', {
                    visible: konvaCanvas.style.display !== 'none',
                    pointerEvents: konvaCanvas.style.pointerEvents,
                    zIndex: konvaCanvas.style.zIndex,
                    position: konvaCanvas.getBoundingClientRect()
                });
            } else {
                console.error('❌ No Konva canvas found in DOM!');
            }
        }, 100);
    }

    /**
     * Handle and display errors
     */
    handleError(message, error) {
        console.error(message, error);
        
        // Show the overlay to display the error
        const overlayEl = document.querySelector('.canvas-overlay');
        if (overlayEl) {
            overlayEl.style.display = 'flex';
        }
        
        // Hide loading indicator but keep overlay visible for error
        const loadingEl = document.getElementById('loading-indicator');
        if (loadingEl) {
            loadingEl.style.display = 'none';
        }
        
        const errorEl = document.getElementById('error-message');
        const errorTextEl = document.getElementById('error-text');
        
        if (errorEl && errorTextEl) {
            errorTextEl.textContent = message;
            errorEl.style.display = 'block';
        }
        
        this.isLoading = false;
        
        if (this.onError) {
            this.onError(message, error);
        }
    }

    // ===========================================
    // Cart Integration Methods (Public API)
    // ===========================================

    /**
     * Export current design to cart
     * @param {Object} metadata - Optional design metadata
     * @returns {Promise<Object>} Cart item created from design
     */
    async exportToCart(metadata = {}) {
        if (!this.cartManager) {
            throw new Error('Cart functionality not enabled');
        }

        try {
            const currentState = this.exportManager.getCurrentState();
            if (!currentState || !currentState.charms || currentState.charms.length === 0) {
                throw new Error('No design to export. Please add some charms first.');
            }

            // Generate thumbnail if not provided
            if (!metadata.thumbnailUrl) {
                metadata.thumbnailUrl = this.exportManager.exportAsDataURL({
                    width: 200,
                    height: 200,
                    pixelRatio: 1
                });
            }

            // Export using state manager for proper integration
            const cartItem = await this.stateManager.exportDesignToCart(currentState, metadata);
            
            // Emit custom event for external integrations
            const event = new CustomEvent('design-exported-to-cart', {
                detail: { designData: currentState, cartItem }
            });
            document.dispatchEvent(event);

            this.showNotification('Design added to cart successfully!', 'success');
            return cartItem;
        } catch (error) {
            this.showNotification(error.message, 'error');
            throw error;
        }
    }

    /**
     * Add inventory item to cart
     * @param {Object} item - Inventory item
     * @param {number} quantity - Quantity to add
     * @returns {Promise<boolean>} Success status
     */
    async addItemToCart(item, quantity = 1) {
        if (!this.cartManager) {
            throw new Error('Cart functionality not enabled');
        }

        try {
            await this.cartManager.addItem(item, quantity);
            return true;
        } catch (error) {
            this.showNotification(error.message, 'error');
            throw error;
        }
    }

    /**
     * Show cart sidebar
     */
    showCart() {
        if (this.cartSidebar) {
            this.cartSidebar.show();
        } else {
            console.warn('Cart sidebar not initialized');
        }
    }

    /**
     * Hide cart sidebar
     */
    hideCart() {
        if (this.cartSidebar) {
            this.cartSidebar.hide();
        }
    }

    /**
     * Toggle cart sidebar visibility
     */
    toggleCart() {
        if (this.cartSidebar) {
            this.cartSidebar.toggle();
        } else {
            console.warn('Cart sidebar not initialized');
        }
    }

    /**
     * Get current cart state
     * @returns {Object} Cart state
     */
    getCartState() {
        return this.cartManager ? this.cartManager.getCartState() : null;
    }

    /**
     * Get cart summary
     * @returns {Object} Cart summary
     */
    getCartSummary() {
        return this.cartManager ? this.cartManager.getCartSummary() : null;
    }

    /**
     * Clear cart
     * @returns {Promise<boolean>} Success status
     */
    async clearCart() {
        if (!this.cartManager) {
            return false;
        }

        try {
            await this.cartManager.clearCart();
            return true;
        } catch (error) {
            this.showNotification(error.message, 'error');
            return false;
        }
    }

    /**
     * Validate cart items
     * @returns {Promise<Object>} Validation result
     */
    async validateCart() {
        if (!this.cartManager) {
            return { isValid: false, errors: ['Cart not available'] };
        }

        try {
            return await this.cartManager.validateInventory();
        } catch (error) {
            return { isValid: false, errors: [error.message] };
        }
    }

    /**
     * Create design bundle with cart state
     * @param {string} bundleName - Name for the bundle
     * @returns {Object} Design bundle
     */
    createDesignBundle(bundleName) {
        if (!this.stateManager.cartManager) {
            console.warn('Cart integration not enabled for bundles');
            return this.stateManager.exportHistory();
        }

        return this.stateManager.createDesignBundle(bundleName);
    }

    /**
     * Load design bundle with cart state
     * @param {Object} bundle - Design bundle
     * @returns {Promise<boolean>} Success status
     */
    async loadDesignBundle(bundle) {
        if (!this.stateManager.cartManager) {
            console.warn('Cart integration not enabled for bundles');
            return this.stateManager.importHistory(bundle);
        }

        try {
            const success = await this.stateManager.loadDesignBundle(bundle);
            if (success) {
                // Refresh display
                this.render();
                this.showNotification('Design bundle loaded successfully', 'success');
            }
            return success;
        } catch (error) {
            this.showNotification('Failed to load design bundle', 'error');
            return false;
        }
    }

    /**
     * Show notification message
     * @param {string} message - Notification message
     * @param {string} type - Notification type ('success', 'error', 'warning', 'info')
     */
    showNotification(message, type = 'info') {
        // Create notification element if it doesn't exist
        let notificationContainer = document.getElementById('notification-container');
        if (!notificationContainer) {
            notificationContainer = document.createElement('div');
            notificationContainer.id = 'notification-container';
            notificationContainer.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                max-width: 400px;
            `;
            document.body.appendChild(notificationContainer);
        }

        // Create notification
        const notification = document.createElement('div');
        notification.className = `notification notification--${type}`;
        notification.style.cssText = `
            background: ${type === 'success' ? '#d4edda' : type === 'error' ? '#f8d7da' : type === 'warning' ? '#fff3cd' : '#d1ecf1'};
            color: ${type === 'success' ? '#155724' : type === 'error' ? '#721c24' : type === 'warning' ? '#856404' : '#0c5460'};
            border: 1px solid ${type === 'success' ? '#c3e6cb' : type === 'error' ? '#f5c6cb' : type === 'warning' ? '#ffeaa7' : '#bee5eb'};
            padding: 12px 16px;
            margin-bottom: 10px;
            border-radius: 4px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            animation: slideInFromRight 0.3s ease-out;
            position: relative;
        `;

        notification.innerHTML = `
            <span>${message}</span>
            <button onclick="this.parentElement.remove()" 
                    style="position: absolute; top: 8px; right: 8px; background: none; border: none; 
                           font-size: 18px; cursor: pointer; color: inherit; opacity: 0.7;">×</button>
        `;

        // Add notification styles if not present
        if (!document.getElementById('notification-styles')) {
            const styles = document.createElement('style');
            styles.id = 'notification-styles';
            styles.textContent = `
                @keyframes slideInFromRight {
                    0% { opacity: 0; transform: translateX(100%); }
                    100% { opacity: 1; transform: translateX(0); }
                }
            `;
            document.head.appendChild(styles);
        }

        notificationContainer.appendChild(notification);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

    /**
     * Get cart manager instance (for advanced integrations)
     * @returns {CartManager|null} Cart manager instance
     */
    getCartManager() {
        return this.cartManager;
    }

    /**
     * Get cart sidebar instance (for advanced integrations)
     * @returns {CartSidebar|null} Cart sidebar instance
     */
    getCartSidebar() {
        return this.cartSidebar;
    }

    /**
     * Get cart icon instance (for advanced integrations)
     * @returns {CartIcon|null} Cart icon instance
     */
    getCartIcon() {
        return this.cartIcon;
    }

    /**
     * Enable/disable cart functionality
     * @param {boolean} enabled - Whether to enable cart
     */
    setCartEnabled(enabled) {
        this.options.enableCart = enabled;
        
        if (enabled && !this.cartManager) {
            this.initializeCart();
        } else if (!enabled && this.cartManager) {
            this.cartManager = null;
            if (this.cartSidebar) {
                this.cartSidebar.destroy();
                this.cartSidebar = null;
            }
            if (this.cartIcon) {
                this.cartIcon.destroy();
                this.cartIcon = null;
            }
        }
    }

    /**
     * Clean up resources
     */
    destroy() {
        // Clean up cart components
        if (this.cartSidebar) {
            this.cartSidebar.destroy();
        }
        if (this.cartIcon) {
            this.cartIcon.destroy();
        }
        if (this.stateManager && this.stateManager.cleanupCartIntegration) {
            this.stateManager.cleanupCartIntegration();
        }

        if (this.stage) {
            this.stage.destroy();
        }
        
        // Remove event listeners
        window.removeEventListener('resize', this.handleResize);
        
        console.log('Jewelry Customizer destroyed');
    }
}