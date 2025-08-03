/**
 * Debug wrapper for JewelryCustomizer to identify initialization hang points
 */

import JewelryCustomizer from './src/js/core/JewelryCustomizer.js';

export default class DebugJewelryCustomizer extends JewelryCustomizer {
    constructor(containerId, options = {}) {
        console.log('🔍 DebugJewelryCustomizer constructor called with:', { containerId, options });
        
        // Override the init method to add debugging
        const originalInit = JewelryCustomizer.prototype.init;
        JewelryCustomizer.prototype.init = async function() {
            console.log('🔍 JewelryCustomizer.init() called');
            
            try {
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
                    console.log('🔍 Cart disabled, skipping initializeCart()');
                }
                
                console.log('🔍 Step 6: setupEventHandlers()');
                this.setupEventHandlers();
                
                console.log('🔍 Step 7: loadDefaultNecklace()');
                await this.loadDefaultNecklace();
                
                console.log('🔍 Step 8: hideLoading()');
                this.hideLoading();
                
                console.log('🔍 JewelryCustomizer.init() completed successfully');
            } catch (error) {
                console.error('🔍 JewelryCustomizer.init() failed at step:', error);
                this.handleError('Initialization failed', error);
                throw error;
            }
        };
        
        super(containerId, options);
    }
}