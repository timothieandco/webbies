/**
 * main-modular.js
 * 
 * Modular entry point for the Timothie & Co Jewelry Customizer.
 * Uses progressive enhancement and graceful degradation to ensure
 * the application works regardless of dependency availability.
 */

import '../css/main.css';

// Core architecture imports
import AppConfig from './config/AppConfig.js';
import FeatureDetector from './core/FeatureDetector.js';
import eventBus, { Events } from './core/EventBus.js';
import errorBoundary from './utils/ErrorBoundary.js';
import ServiceFactory from './services/ServiceFactory.js';

// Core functionality imports
import JewelryCustomizer from './core/JewelryCustomizer.js';
import { charmImages, necklaceImages } from './utils/images.js';

class ModularCustomizerApp {
    constructor() {
        this.customizer = null;
        this.services = new Map();
        this.features = new Map();
        
        // Wrap initialization with error boundary
        this.init = errorBoundary.wrap(this.init.bind(this), {
            name: 'ModularCustomizerApp.init',
            fallback: () => this.showFallbackUI(),
            critical: true
        });
    }

    async init() {
        try {
            console.log('🚀 Initializing Modular Jewelry Customizer...');
            
            // Show loading indicator
            this.showLoading();
            
            // Emit app initialization event
            eventBus.emit(Events.APP_INIT);
            
            // Step 1: Detect available features
            console.log('📡 Step 1: Detecting features...');
            await this.detectFeatures();
            
            // Step 2: Initialize core services
            console.log('🔧 Step 2: Initializing services...');
            await this.initializeServices();
            
            // Step 3: Initialize core customizer
            console.log('💎 Step 3: Initializing customizer...');
            try {
                await this.initializeCustomizer();
                console.log('✅ Customizer initialization completed successfully');
            } catch (customizerError) {
                console.error('💥 Customizer initialization failed:', customizerError);
                this.forceHideLoadingAndShowError(`Customizer failed to load: ${customizerError.message}`);
                return; // Exit early, don't continue with UI setup
            }
            
            // Step 4: Setup UI components
            console.log('🎨 Step 4: Setting up UI...');
            await this.setupUI();
            
            // Step 5: Initialize optional features
            console.log('📦 Step 5: Loading optional features...');
            await this.initializeOptionalFeatures();
            
            // Hide loading indicator
            this.hideLoading();
            
            // Emit app ready event
            eventBus.emit(Events.APP_READY);
            console.log('✅ Modular Jewelry Customizer ready!');
            
            // Log feature summary if in debug mode
            if (AppConfig.get('debug')) {
                this.logFeatureSummary();
            }
            
        } catch (error) {
            console.error('💥 Failed to initialize Modular Jewelry Customizer:', error);
            this.forceHideLoadingAndShowError(`Application failed to load: ${error.message}`);
        }
    }

    async detectFeatures() {
        const features = await FeatureDetector.detectFeatures();
        this.features = features;
        
        // Update app configuration with detected features
        AppConfig.updateFeatures(Object.fromEntries(features));
        
        // Emit feature detection complete event
        eventBus.emit(Events.FEATURES_DETECTED, features);
        
        // Log results
        FeatureDetector.logResults();
    }

    async initializeServices() {
        // Get required services with automatic fallbacks
        const serviceNames = ['inventory', 'cart', 'storage'];
        
        for (const serviceName of serviceNames) {
            try {
                const service = await ServiceFactory.getService(serviceName);
                if (service) {
                    this.services.set(serviceName, service);
                    console.log(`✅ ${serviceName} service initialized (fallback: ${service._isFallback})`);
                }
            } catch (error) {
                console.warn(`⚠️ ${serviceName} service unavailable:`, error.message);
            }
        }
    }

    async initializeCustomizer() {
        const timeoutMs = 10000; // 10 second timeout
        let timeoutId;
        
        try {
            console.log('💎 Creating JewelryCustomizer instance...');
            
            // Check if container exists first
            const container = document.getElementById('jewelry-canvas');
            if (!container) {
                throw new Error('Container with id "jewelry-canvas" not found');
            }
            console.log('✅ Canvas container found:', container);
            
            const config = AppConfig.getModuleConfig('customizer');
            
            // Set up a timeout to force completion
            const initPromise = new Promise(async (resolve, reject) => {
                timeoutId = setTimeout(() => {
                    reject(new Error('JewelryCustomizer initialization timeout after 10 seconds'));
                }, timeoutMs);
                
                try {
                    console.log('🏗️ About to create JewelryCustomizer...');
                    
                    // Create customizer with safer options - disable cart for now to avoid import issues
                    this.customizer = new JewelryCustomizer('jewelry-canvas', {
                        width: config.canvas.width || 800,
                        height: config.canvas.height || 600,
                        maxCharms: config.maxCharms || 10,
                        enableAnimation: config.enableAnimations !== false,
                        enableCart: false, // Disable cart temporarily to avoid dynamic import issues
                        // Pass services if available
                        cartService: this.services.get('cart'),
                        inventoryService: this.services.get('inventory'),
                        storageService: this.services.get('storage')
                    });

                    console.log('💎 JewelryCustomizer constructor completed');
                    
                    // Monitor the customizer's initialization state
                    let attempts = 0;
                    const maxAttempts = 50; // 5 seconds of checking
                    
                    const checkInit = async () => {
                        attempts++;
                        console.log(`🔍 Checking initialization attempt ${attempts}/${maxAttempts}...`);
                        
                        if (this.customizer.stage) {
                            console.log('✅ Stage found, initialization likely complete');
                            clearTimeout(timeoutId);
                            resolve();
                            return;
                        }
                        
                        if (this.customizer.isLoading === false) {
                            console.log('✅ Loading flag is false, initialization complete');
                            clearTimeout(timeoutId);
                            resolve();
                            return;
                        }
                        
                        if (attempts >= maxAttempts) {
                            reject(new Error('Max initialization attempts reached'));
                            return;
                        }
                        
                        // Wait 100ms before checking again
                        setTimeout(checkInit, 100);
                    };
                    
                    // Start checking after a brief delay
                    setTimeout(checkInit, 100);
                    
                } catch (error) {
                    clearTimeout(timeoutId);
                    reject(error);
                }
            });
            
            // Wait for initialization with timeout
            await initPromise;
            
            console.log('✅ JewelryCustomizer initialization completed successfully');
            
            // Verify stage exists
            if (this.customizer.stage) {
                console.log('✅ JewelryCustomizer stage verified:', {
                    width: this.customizer.stage.width(),
                    height: this.customizer.stage.height(),
                    container: this.customizer.stage.container()
                });
            } else {
                console.warn('⚠️ Stage not found, but initialization reported complete');
            }

            // Setup event listeners for customizer events
            this.setupCustomizerEvents();
            console.log('💎 Customizer initialization complete');
            
        } catch (error) {
            // Clean up timeout if it exists
            if (timeoutId) {
                clearTimeout(timeoutId);
            }
            
            console.error('💥 Failed to initialize customizer:', error);
            console.error('💥 Error stack:', error.stack);
            
            // Force hide loading and show error state
            this.forceHideLoadingAndShowError(error.message);
            
            throw error; // Re-throw to be handled by main init error handler
        }
    }

    async setupUI() {
        // Setup charm sidebar
        await this.setupCharmSidebar();
        
        // Setup control buttons
        this.setupControls();
        
        // Setup cart sidebar if cart service is available
        if (this.services.has('cart') && AppConfig.isFeatureEnabled('cart')) {
            await this.setupCartSidebar();
        }
        
        // Setup search functionality if inventory service is available
        if (this.services.has('inventory') && AppConfig.isFeatureEnabled('inventory')) {
            await this.setupSearch();
        }
    }

    async setupCharmSidebar() {
        const sidebar = document.getElementById('charm-sidebar');
        if (!sidebar) return;

        const inventoryService = this.services.get('inventory');
        
        // Create loading indicator
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'loading-indicator';
        loadingDiv.textContent = 'Loading charms...';
        sidebar.appendChild(loadingDiv);

        try {
            // Try to load charms from inventory service
            let charms = [];
            
            if (inventoryService) {
                charms = await inventoryService.getCharms();
            }
            
            // Fallback to sample data if no charms or service unavailable
            if (!charms || charms.length === 0) {
                console.log('Using sample charm data');
                charms = Object.entries(charmImages).map(([name, url]) => ({
                    id: name,
                    name: this.formatCharmName(name),
                    image_url: url,
                    category: 'sample'
                }));
            }

            // Remove loading indicator
            sidebar.removeChild(loadingDiv);
            
            // Create charm grid
            const charmGrid = document.createElement('div');
            charmGrid.className = 'charm-grid';

            // Add charms to grid
            charms.forEach(charm => {
                const charmItem = this.createCharmItem(charm);
                charmGrid.appendChild(charmItem);
            });

            sidebar.appendChild(charmGrid);
            
            // Emit event
            eventBus.emit(Events.INVENTORY_LOADED, { count: charms.length });
            
        } catch (error) {
            console.error('Failed to load charms:', error);
            sidebar.removeChild(loadingDiv);
            
            // Show error message
            const errorDiv = document.createElement('div');
            errorDiv.className = 'sidebar-error';
            errorDiv.textContent = 'Failed to load charms. Using sample data.';
            sidebar.appendChild(errorDiv);
            
            // Fallback to sample data
            setTimeout(() => this.setupSampleCharms(sidebar), 1000);
        }
    }

    createCharmItem(charm) {
        const charmItem = document.createElement('div');
        charmItem.className = 'charm-item';
        charmItem.dataset.charmId = charm.id;
        
        charmItem.innerHTML = `
            <img src="${charm.image_url}" alt="${charm.name}" draggable="false">
            <span class="charm-name">${charm.name}</span>
            ${charm.price ? `<span class="charm-price">$${charm.price}</span>` : ''}
        `;
        
        // Add click handler with error boundary
        charmItem.addEventListener('click', errorBoundary.wrap(() => {
            if (this.customizer) {
                this.customizer.addCharm(charm.image_url, {
                    id: charm.id,
                    name: charm.name,
                    price: charm.price
                });
                
                // Emit charm added event
                eventBus.emit(Events.CHARM_ADDED, charm);
            }
        }, {
            name: 'CharmItem.click',
            fallback: null
        }));
        
        return charmItem;
    }

    setupSampleCharms(sidebar) {
        const charmGrid = document.createElement('div');
        charmGrid.className = 'charm-grid';

        Object.entries(charmImages).forEach(([name, url]) => {
            const charm = {
                id: name,
                name: this.formatCharmName(name),
                image_url: url,
                category: 'sample'
            };
            const charmItem = this.createCharmItem(charm);
            charmGrid.appendChild(charmItem);
        });

        sidebar.innerHTML = '';
        sidebar.appendChild(charmGrid);
    }

    setupControls() {
        const controls = [
            {
                id: 'clear-btn',
                handler: () => this.customizer?.clearAllCharms(),
                event: 'controls:clear'
            },
            {
                id: 'export-btn',
                handler: () => this.customizer?.exportAsImage(),
                event: 'controls:export'
            },
            {
                id: 'undo-btn',
                handler: () => this.customizer?.undo(),
                event: 'controls:undo'
            },
            {
                id: 'redo-btn',
                handler: () => this.customizer?.redo(),
                event: 'controls:redo'
            },
            {
                id: 'save-btn',
                handler: () => this.saveDesign(),
                event: 'controls:save'
            },
            {
                id: 'load-btn',
                handler: () => this.loadDesign(),
                event: 'controls:load'
            }
        ];

        controls.forEach(({ id, handler, event }) => {
            const button = document.getElementById(id);
            if (button) {
                button.addEventListener('click', errorBoundary.wrap(() => {
                    handler();
                    eventBus.emit(event);
                }, {
                    name: `Control.${id}`,
                    fallback: null
                }));
            }
        });
    }

    async setupCartSidebar() {
        // This will be implemented when cart functionality is needed
        console.log('Cart sidebar setup deferred - will lazy load when needed');
    }

    async setupSearch() {
        const searchInput = document.getElementById('charm-search');
        if (!searchInput) return;

        const inventoryService = this.services.get('inventory');
        if (!inventoryService) return;

        // Debounced search handler
        let searchTimeout;
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(async () => {
                const query = e.target.value.trim();
                if (query.length < 2) return;

                try {
                    const results = await inventoryService.search(query);
                    eventBus.emit(Events.INVENTORY_SEARCH, { query, results });
                    // Update UI with search results
                    this.updateCharmDisplay(results);
                } catch (error) {
                    console.error('Search failed:', error);
                }
            }, AppConfig.get('ui.debounceDelay', 250));
        });
    }

    setupCustomizerEvents() {
        // Listen for charm events from customizer
        if (this.customizer && this.customizer.on) {
            this.customizer.on('charm:added', (charm) => {
                eventBus.emit(Events.CHARM_ADDED, charm);
            });
            
            this.customizer.on('charm:removed', (charm) => {
                eventBus.emit(Events.CHARM_REMOVED, charm);
            });
        }
    }

    async initializeOptionalFeatures() {
        // For now, we'll skip optional feature loading to avoid webpack issues
        // This can be implemented later when specific optional features are needed
        console.log('📦 Optional feature loading deferred for Phase 3');
    }

    async saveDesign() {
        const storageService = this.services.get('storage');
        if (!storageService || !this.customizer) return;

        try {
            const designData = this.customizer.getDesignData();
            const designId = await storageService.saveDesign(designData);
            
            eventBus.emit(Events.DESIGN_SAVED, { id: designId });
            this.showNotification('Design saved successfully!');
        } catch (error) {
            console.error('Failed to save design:', error);
            this.showNotification('Failed to save design', 'error');
        }
    }

    async loadDesign() {
        const storageService = this.services.get('storage');
        if (!storageService || !this.customizer) return;

        try {
            // For now, load the most recent design
            const designs = await storageService.getDesigns();
            if (designs && designs.length > 0) {
                const design = designs[0];
                await this.customizer.loadDesignData(design);
                
                eventBus.emit(Events.DESIGN_LOADED, { id: design.id });
                this.showNotification('Design loaded successfully!');
            } else {
                this.showNotification('No saved designs found', 'info');
            }
        } catch (error) {
            console.error('Failed to load design:', error);
            this.showNotification('Failed to load design', 'error');
        }
    }

    updateCharmDisplay(charms) {
        const sidebar = document.getElementById('charm-sidebar');
        const charmGrid = sidebar?.querySelector('.charm-grid');
        if (!charmGrid) return;

        // Clear current display
        charmGrid.innerHTML = '';

        // Add filtered charms
        charms.forEach(charm => {
            const charmItem = this.createCharmItem(charm);
            charmGrid.appendChild(charmItem);
        });
    }

    showNotification(message, type = 'success') {
        eventBus.emit(Events.NOTIFICATION, { message, type });
        
        // Simple notification display
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);

        // Auto-remove after 3 seconds
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    formatCharmName(name) {
        return name.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    }

    showFallbackUI() {
        console.error('Critical initialization failure - showing fallback UI');
        
        const container = document.getElementById('app-container') || document.body;
        errorBoundary.renderErrorUI(container, new Error('Failed to initialize application'), {
            title: 'Unable to Load Customizer',
            message: 'We\'re having trouble loading the jewelry customizer. Please refresh the page or try again later.',
            showDetails: AppConfig.get('debug'),
            onRetry: () => window.location.reload()
        });
    }

    showLoading() {
        // Show loading indicator
        const loadingIndicator = document.getElementById('loading-indicator');
        if (loadingIndicator) {
            loadingIndicator.style.display = 'block';
        } else {
            // Create loading indicator if it doesn't exist
            const loading = document.createElement('div');
            loading.id = 'loading-indicator';
            loading.innerHTML = `
                <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(255,255,255,0.9); z-index: 9999; display: flex; align-items: center; justify-content: center;">
                    <div style="text-align: center;">
                        <div style="border: 4px solid #f3f3f3; border-top: 4px solid #EFCAC8; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
                        <p style="color: #333; font-family: 'Quicksand', sans-serif;">Loading Jewelry Customizer...</p>
                    </div>
                </div>
                <style>
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                </style>
            `;
            document.body.appendChild(loading);
        }
    }

    hideLoading() {
        console.log('🎭 Hiding loading indicators...');
        
        // Hide main loading indicator
        const loadingIndicator = document.getElementById('loading-indicator');
        if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
            console.log('✅ Main loading indicator hidden');
        } else {
            console.warn('⚠️ Main loading indicator not found');
        }
        
        // Also hide any canvas overlay that might be blocking interactions
        const canvasOverlay = document.querySelector('.canvas-overlay');
        if (canvasOverlay) {
            canvasOverlay.style.display = 'none';
            console.log('✅ Canvas overlay hidden');
        } else {
            console.warn('⚠️ Canvas overlay not found');
        }
        
        // Verify Konva canvas is visible and interactive
        setTimeout(() => {
            const konvaCanvas = document.querySelector('#jewelry-canvas canvas');
            if (konvaCanvas) {
                console.log('✅ Konva canvas found and should be interactive:', {
                    display: window.getComputedStyle(konvaCanvas).display,
                    visibility: window.getComputedStyle(konvaCanvas).visibility,
                    pointerEvents: window.getComputedStyle(konvaCanvas).pointerEvents,
                    zIndex: window.getComputedStyle(konvaCanvas).zIndex
                });
            } else {
                console.error('❌ Konva canvas not found! Canvas may not have been created properly.');
            }
        }, 100);
    }

    forceHideLoadingAndShowError(errorMessage) {
        console.log('🚨 Force hiding loading and showing error state...');
        
        // Force hide ALL loading indicators and overlays
        const loadingIndicator = document.getElementById('loading-indicator');
        if (loadingIndicator) {
            loadingIndicator.style.display = 'none';
            loadingIndicator.style.visibility = 'hidden';
        }
        
        const canvasOverlay = document.querySelector('.canvas-overlay');
        if (canvasOverlay) {
            canvasOverlay.style.display = 'none';
            canvasOverlay.style.visibility = 'hidden';
        }
        
        // Show error in the canvas area
        const canvasContainer = document.getElementById('jewelry-canvas');
        if (canvasContainer) {
            canvasContainer.innerHTML = `
                <div style="
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    height: 100%;
                    min-height: 400px;
                    background: #f8f9fa;
                    border: 2px dashed #dee2e6;
                    border-radius: 8px;
                    flex-direction: column;
                    text-align: center;
                    padding: 20px;
                ">
                    <div style="color: #dc3545; font-size: 48px; margin-bottom: 16px;">⚠️</div>
                    <h3 style="color: #dc3545; margin-bottom: 12px;">Failed to Load Jewelry Customizer</h3>
                    <p style="color: #6c757d; margin-bottom: 16px; max-width: 400px;">${errorMessage}</p>
                    <button onclick="window.location.reload()" style="
                        background: #007bff;
                        color: white;
                        border: none;
                        padding: 10px 20px;
                        border-radius: 4px;
                        cursor: pointer;
                        font-size: 14px;
                    ">Retry</button>
                    <p style="color: #6c757d; font-size: 12px; margin-top: 12px;">Check the browser console for technical details</p>
                </div>
            `;
        }
        
        // Also show error in charm library
        const charmLibrary = document.getElementById('charm-library');
        if (charmLibrary) {
            charmLibrary.innerHTML = `
                <div style="text-align: center; padding: 20px; color: #6c757d;">
                    <p>Charm library unavailable</p>
                </div>
            `;
        }
    }

    logFeatureSummary() {
        console.group('📊 Feature Summary');
        console.log('Services:', Array.from(this.services.keys()));
        console.log('Features:', Object.fromEntries(this.features));
        console.log('Service Status:', ServiceFactory.getStatus());
        console.groupEnd();
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new ModularCustomizerApp();
    app.init().catch(error => {
        console.error('Failed to initialize app:', error);
        errorBoundary.renderErrorUI(document.body, error, {
            title: 'Application Error',
            showDetails: true,
            onRetry: () => window.location.reload()
        });
    });
});

// Export for debugging
window.__ModularCustomizerApp = ModularCustomizerApp;