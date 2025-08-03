/**
 * Timothie & Co Jewelry Customizer - Main Application Class
 * Handles the core canvas setup, layer management, and coordinate user interactions
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
            ...options
        };

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
            this.showLoading();
            
            // Create Konva stage and layers
            this.createStage();
            this.createLayers();
            
            // Initialize managers
            this.initializeManagers();
            
            // Setup event handlers
            this.setupEventHandlers();
            
            // Load default necklace
            await this.loadDefaultNecklace();
            
            this.hideLoading();
            
            console.log('Jewelry Customizer initialized successfully');
        } catch (error) {
            this.handleError('Failed to initialize customizer', error);
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
        const defaultNecklaceData = {
            id: 'classic-chain',
            name: 'Classic Chain',
            imageUrl: necklaceImages.plainChain,
            attachmentZones: this.generateAttachmentZones()
        };

        console.log('🔗 Loading default necklace with imageUrl:', defaultNecklaceData.imageUrl);
        await this.loadNecklace(defaultNecklaceData);
    }

    /**
     * Load a necklace base image
     */
    async loadNecklace(necklaceData) {
        try {
            this.showLoading();

            // Load necklace image
            console.log('📷 Loading necklace image from:', necklaceData.imageUrl);
            const imageObj = await this.imageLoader.loadImage(necklaceData.imageUrl);
            console.log('✅ Necklace image loaded successfully:', imageObj.width, 'x', imageObj.height);
            
            // Remove existing necklace
            this.backgroundLayer.destroyChildren();

            // Calculate scaled dimensions to fit canvas (doubled scale factor for zoom effect)
            const scale = this.calculateImageScale(imageObj, this.stage.width(), this.stage.height(), 1.7);
            const scaledWidth = imageObj.width * scale;
            const scaledHeight = imageObj.height * scale;

            // Create necklace image node
            const necklaceImage = new Konva.Image({
                x: (this.stage.width() - scaledWidth) / 2,
                y: (this.stage.height() - scaledHeight) / 2,
                image: imageObj,
                width: scaledWidth,
                height: scaledHeight,
                name: 'necklace-base',
                id: necklaceData.id
            });

            this.backgroundLayer.add(necklaceImage);
            console.log('🎨 Added necklace to background layer, drawing...');
            this.backgroundLayer.draw();
            console.log('🖼️ Background layer drawn successfully');
            
            // Debug: Verify canvas content
            console.log('📊 Canvas debug info:', {
                stageSize: { width: this.stage.width(), height: this.stage.height() },
                layerChildren: this.backgroundLayer.children.length,
                necklacePosition: { x: necklaceImage.x(), y: necklaceImage.y() },
                necklaceSize: { width: necklaceImage.width(), height: necklaceImage.height() }
            });

            // Store current necklace data
            this.currentNecklace = {
                ...necklaceData,
                konvaImage: necklaceImage,
                scale: scale
            };

            // Update charm manager with new attachment zones
            this.charmManager.setAttachmentZones(necklaceData.attachmentZones, necklaceImage);

            // Cache background layer for performance
            this.backgroundLayer.cache();

            this.hideLoading();
            
            console.log(`Necklace "${necklaceData.name}" loaded successfully`);
        } catch (error) {
            this.handleError(`Failed to load necklace: ${necklaceData.name}`, error);
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

    /**
     * Clean up resources
     */
    destroy() {
        if (this.stage) {
            this.stage.destroy();
        }
        
        // Remove event listeners
        window.removeEventListener('resize', this.handleResize);
        
        console.log('Jewelry Customizer destroyed');
    }
}