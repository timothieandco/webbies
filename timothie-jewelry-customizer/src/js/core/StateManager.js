/**
 * StateManager - Handles undo/redo functionality and state persistence
 * Manages application state history with localStorage integration
 * Now supports cart state integration for comprehensive state management
 */

export default class StateManager {
    constructor(maxHistorySize = 50) {
        this.history = [];
        this.currentIndex = -1;
        this.maxHistorySize = maxHistorySize;
        this.storageKey = 'timothie_jewelry_customizer_state';
        
        // Cart integration
        this.cartManager = null;
        this.cartStateSubscription = null;
        
        // Load existing state from localStorage if available
        this.loadFromStorage();
    }

    /**
     * Save a new state to history
     */
    saveState(state) {
        // Don't save if state is identical to current
        if (this.currentIndex >= 0 && this.statesEqual(state, this.history[this.currentIndex])) {
            return false;
        }

        // Remove any future history if we're not at the end
        if (this.currentIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.currentIndex + 1);
        }

        // Add timestamp to state
        const timestampedState = {
            ...state,
            timestamp: Date.now(),
            id: this.generateStateId()
        };

        // Add new state
        this.history.push(timestampedState);
        this.currentIndex++;

        // Limit history size
        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
            this.currentIndex--;
        }

        // Save to localStorage
        this.saveToStorage();

        console.log(`State saved (${this.currentIndex + 1}/${this.history.length})`);
        return true;
    }

    /**
     * Undo to previous state
     */
    undo() {
        if (!this.canUndo()) {
            return null;
        }

        this.currentIndex--;
        const state = this.history[this.currentIndex];
        
        console.log(`Undo to state ${this.currentIndex + 1}/${this.history.length}`);
        return this.cloneState(state);
    }

    /**
     * Redo to next state
     */
    redo() {
        if (!this.canRedo()) {
            return null;
        }

        this.currentIndex++;
        const state = this.history[this.currentIndex];
        
        console.log(`Redo to state ${this.currentIndex + 1}/${this.history.length}`);
        return this.cloneState(state);
    }

    /**
     * Check if undo is available
     */
    canUndo() {
        return this.currentIndex > 0;
    }

    /**
     * Check if redo is available
     */
    canRedo() {
        return this.currentIndex < this.history.length - 1;
    }

    /**
     * Get current state
     */
    getCurrentState() {
        if (this.currentIndex >= 0) {
            return this.cloneState(this.history[this.currentIndex]);
        }
        return null;
    }

    /**
     * Get history information
     */
    getHistoryInfo() {
        return {
            total: this.history.length,
            current: this.currentIndex + 1,
            canUndo: this.canUndo(),
            canRedo: this.canRedo(),
            states: this.history.map((state, index) => ({
                id: state.id,
                timestamp: state.timestamp,
                isCurrent: index === this.currentIndex,
                charmCount: state.charms ? state.charms.length : 0
            }))
        };
    }

    /**
     * Jump to specific state by index
     */
    jumpToState(index) {
        if (index < 0 || index >= this.history.length) {
            throw new Error(`Invalid state index: ${index}`);
        }

        this.currentIndex = index;
        const state = this.history[this.currentIndex];
        
        console.log(`Jumped to state ${this.currentIndex + 1}/${this.history.length}`);
        return this.cloneState(state);
    }

    /**
     * Clear all history
     */
    clearHistory() {
        this.history = [];
        this.currentIndex = -1;
        this.saveToStorage();
        console.log('State history cleared');
    }

    /**
     * Save state to localStorage
     */
    saveToStorage() {
        try {
            const dataToSave = {
                history: this.history,
                currentIndex: this.currentIndex,
                lastUpdated: Date.now()
            };

            localStorage.setItem(this.storageKey, JSON.stringify(dataToSave));
        } catch (error) {
            console.warn('Failed to save state to localStorage:', error);
        }
    }

    /**
     * Load state from localStorage
     */
    loadFromStorage() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (!saved) return;

            const data = JSON.parse(saved);
            
            // Validate loaded data
            if (data.history && Array.isArray(data.history) && typeof data.currentIndex === 'number') {
                this.history = data.history;
                this.currentIndex = data.currentIndex;
                
                // Ensure currentIndex is valid
                if (this.currentIndex >= this.history.length) {
                    this.currentIndex = this.history.length - 1;
                }
                
                console.log(`State loaded from storage: ${this.history.length} states`);
            }
        } catch (error) {
            console.warn('Failed to load state from localStorage:', error);
            this.clearHistory();
        }
    }

    /**
     * Export history as JSON
     */
    exportHistory() {
        return {
            history: this.history,
            currentIndex: this.currentIndex,
            exportTime: Date.now(),
            version: '1.0'
        };
    }

    /**
     * Import history from JSON
     */
    importHistory(data) {
        try {
            if (!data.history || !Array.isArray(data.history)) {
                throw new Error('Invalid history data format');
            }

            this.history = data.history;
            this.currentIndex = Math.min(data.currentIndex || 0, this.history.length - 1);
            
            // Limit to max size
            if (this.history.length > this.maxHistorySize) {
                const excess = this.history.length - this.maxHistorySize;
                this.history = this.history.slice(excess);
                this.currentIndex = Math.max(0, this.currentIndex - excess);
            }

            this.saveToStorage();
            console.log(`History imported: ${this.history.length} states`);
            return true;
        } catch (error) {
            console.error('Failed to import history:', error);
            return false;
        }
    }

    /**
     * Create a branch from current state
     */
    createBranch(branchName) {
        if (this.currentIndex < 0) {
            throw new Error('No current state to branch from');
        }

        const currentState = this.cloneState(this.history[this.currentIndex]);
        currentState.branch = branchName;
        currentState.branchedFrom = this.history[this.currentIndex].id;
        
        return currentState;
    }

    /**
     * Get memory usage information
     */
    getMemoryUsage() {
        const jsonString = JSON.stringify(this.history);
        const sizeInBytes = new Blob([jsonString]).size;
        
        return {
            states: this.history.length,
            sizeBytes: sizeInBytes,
            sizeKB: Math.round(sizeInBytes / 1024),
            sizeMB: Math.round(sizeInBytes / (1024 * 1024) * 100) / 100
        };
    }

    /**
     * Optimize history by removing redundant states
     */
    optimizeHistory() {
        const originalLength = this.history.length;
        const optimized = [];
        let lastState = null;

        for (let i = 0; i < this.history.length; i++) {
            const state = this.history[i];
            
            // Keep state if it's significantly different from the last one
            if (!lastState || !this.statesEqual(state, lastState) || this.isImportantState(state)) {
                optimized.push(state);
                lastState = state;
            }
        }

        // Always keep the last state
        if (this.history.length > 0 && !optimized.includes(this.history[this.history.length - 1])) {
            optimized.push(this.history[this.history.length - 1]);
        }

        this.history = optimized;
        this.currentIndex = Math.min(this.currentIndex, this.history.length - 1);
        
        const removed = originalLength - optimized.length;
        if (removed > 0) {
            console.log(`History optimized: removed ${removed} redundant states`);
            this.saveToStorage();
        }
        
        return removed;
    }

    /**
     * Check if two states are equal (deep comparison of important properties)
     */
    statesEqual(state1, state2) {
        if (!state1 || !state2) return false;
        if (!state1.charms || !state2.charms) return false;
        if (state1.charms.length !== state2.charms.length) return false;

        // Compare charm data
        for (let i = 0; i < state1.charms.length; i++) {
            const charm1 = state1.charms[i];
            const charm2 = state2.charms[i];
            
            if (charm1.id !== charm2.id ||
                Math.abs(charm1.x - charm2.x) > 1 ||
                Math.abs(charm1.y - charm2.y) > 1 ||
                charm1.rotation !== charm2.rotation) {
                return false;
            }
        }

        return true;
    }

    /**
     * Check if a state is considered important (should not be optimized away)
     */
    isImportantState(state) {
        // Consider states with major changes as important
        return state.branch || 
               state.milestone || 
               (state.charms && state.charms.length === 0) || // Empty state
               state.exported; // Exported state
    }

    /**
     * Create a deep clone of a state
     */
    cloneState(state) {
        return JSON.parse(JSON.stringify(state));
    }

    /**
     * Generate unique ID for state
     */
    generateStateId() {
        return `state_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Mark current state as milestone
     */
    markMilestone(name) {
        if (this.currentIndex >= 0) {
            this.history[this.currentIndex].milestone = name;
            this.saveToStorage();
            console.log(`State marked as milestone: ${name}`);
        }
    }

    /**
     * Get all milestone states
     */
    getMilestones() {
        return this.history
            .map((state, index) => ({ ...state, index }))
            .filter(state => state.milestone);
    }

    /**
     * Clean up old states based on age
     */
    cleanupOldStates(maxAge = 7 * 24 * 60 * 60 * 1000) { // 7 days default
        const now = Date.now();
        const cutoffTime = now - maxAge;
        
        // Find first state to keep (including milestones)
        let keepFromIndex = 0;
        for (let i = 0; i < this.history.length; i++) {
            if (this.history[i].timestamp > cutoffTime || this.history[i].milestone) {
                keepFromIndex = i;
                break;
            }
        }

        if (keepFromIndex > 0) {
            const removed = keepFromIndex;
            this.history = this.history.slice(keepFromIndex);
            this.currentIndex = Math.max(0, this.currentIndex - removed);
            
            console.log(`Cleaned up ${removed} old states`);
            this.saveToStorage();
            return removed;
        }

        return 0;
    }

    // ===========================================
    // Cart Integration Methods
    // ===========================================

    /**
     * Initialize cart integration
     * @param {CartManager} cartManager - Cart manager instance
     */
    initializeCartIntegration(cartManager) {
        if (!cartManager) {
            console.warn('CartManager not provided for StateManager integration');
            return;
        }

        this.cartManager = cartManager;
        
        // Subscribe to cart state changes to trigger design state saves
        this.cartStateSubscription = this.cartManager.subscribe('cart-updated', (cartSummary) => {
            // Don't save design state for every cart change, but mark as significant
            this.markCartStateChange(cartSummary);
        });

        console.log('Cart integration initialized with StateManager');
    }

    /**
     * Save design state with cart context
     * @param {Object} designState - Design state
     * @param {Object} cartContext - Cart context information
     */
    saveStateWithCartContext(designState, cartContext = {}) {
        const enhancedState = {
            ...designState,
            cartContext: {
                itemCount: cartContext.itemCount || 0,
                total: cartContext.total || 0,
                hasCartItems: cartContext.hasItems || false,
                timestamp: Date.now()
            }
        };

        return this.saveState(enhancedState);
    }

    /**
     * Export current design to cart using cart manager
     * @param {Object} designState - Current design state
     * @param {Object} metadata - Design metadata
     * @returns {Promise<Object>} Cart item created from design
     */
    async exportDesignToCart(designState, metadata = {}) {
        if (!this.cartManager) {
            throw new Error('Cart manager not initialized');
        }

        try {
            // Create enhanced metadata with state information
            const enhancedMetadata = {
                ...metadata,
                name: metadata.name || `Design ${new Date().toLocaleDateString()}`,
                stateId: this.history[this.currentIndex]?.id,
                stateTimestamp: this.history[this.currentIndex]?.timestamp,
                canvasSettings: metadata.canvasSettings || {}
            };

            // Export to cart
            const cartItem = await this.cartManager.exportDesignToCart(designState, enhancedMetadata);
            
            // Mark this state as exported
            this.markStateAsExported(cartItem.id);
            
            // Save milestone for this export
            this.markMilestone(`Exported to Cart: ${enhancedMetadata.name}`);

            console.log('Design exported to cart successfully', cartItem);
            return cartItem;
        } catch (error) {
            console.error('Failed to export design to cart:', error);
            throw error;
        }
    }

    /**
     * Load design state and update cart context
     * @param {number} stateIndex - State index to load
     * @returns {Object} Loaded state with cart context
     */
    loadStateWithCartContext(stateIndex) {
        const state = this.jumpToState(stateIndex);
        
        if (state && state.cartContext) {
            // Emit cart context for UI updates
            this.emitCartContextUpdate(state.cartContext);
        }

        return state;
    }

    /**
     * Create a design bundle that includes both design and cart state
     * @param {string} bundleName - Name for the bundle
     * @returns {Object} Design bundle
     */
    createDesignBundle(bundleName) {
        const currentDesignState = this.getCurrentState();
        const currentCartState = this.cartManager ? this.cartManager.getCartState() : null;

        return {
            bundleName: bundleName,
            designState: currentDesignState,
            cartState: currentCartState,
            timestamp: Date.now(),
            version: '1.0'
        };
    }

    /**
     * Load a design bundle and restore both design and cart state
     * @param {Object} bundle - Design bundle
     * @returns {Promise<boolean>} Success status
     */
    async loadDesignBundle(bundle) {
        try {
            if (!bundle || !bundle.designState) {
                throw new Error('Invalid design bundle format');
            }

            // Restore design state
            if (bundle.designState) {
                this.importHistory({
                    history: [bundle.designState],
                    currentIndex: 0,
                    version: bundle.version || '1.0'
                });
            }

            // Restore cart state if available and cart manager is initialized
            if (bundle.cartState && this.cartManager) {
                // Clear current cart
                await this.cartManager.clearCart();
                
                // Add items from bundle
                for (const item of bundle.cartState.items) {
                    await this.cartManager.addItem(item, item.quantity, {
                        skipValidation: true // Since this is a restore operation
                    });
                }
            }

            console.log(`Design bundle "${bundle.bundleName}" loaded successfully`);
            return true;
        } catch (error) {
            console.error('Failed to load design bundle:', error);
            return false;
        }
    }

    /**
     * Get design state summary with cart information
     * @returns {Object} Enhanced state summary
     */
    getEnhancedStateSummary() {
        const baseSummary = this.getHistoryInfo();
        const cartSummary = this.cartManager ? this.cartManager.getCartSummary() : null;

        return {
            ...baseSummary,
            cartInfo: cartSummary ? {
                itemCount: cartSummary.itemCount,
                total: cartSummary.total,
                hasItems: cartSummary.hasItems
            } : null,
            hasCartIntegration: !!this.cartManager,
            exportedStates: this.getExportedStates()
        };
    }

    /**
     * Mark current state as exported to cart
     * @param {string} cartItemId - Cart item ID
     */
    markStateAsExported(cartItemId) {
        if (this.currentIndex >= 0 && this.history[this.currentIndex]) {
            this.history[this.currentIndex].exported = true;
            this.history[this.currentIndex].cartItemId = cartItemId;
            this.history[this.currentIndex].exportedAt = Date.now();
            this.saveToStorage();
        }
    }

    /**
     * Get all exported states
     * @returns {Array} Exported states
     */
    getExportedStates() {
        return this.history
            .map((state, index) => ({ ...state, index }))
            .filter(state => state.exported);
    }

    /**
     * Mark cart state change for potential design state correlation
     * @param {Object} cartSummary - Cart summary
     */
    markCartStateChange(cartSummary) {
        // Store last cart change for potential correlation with design changes
        this.lastCartChange = {
            summary: cartSummary,
            timestamp: Date.now()
        };
    }

    /**
     * Emit cart context update event
     * @param {Object} cartContext - Cart context
     */
    emitCartContextUpdate(cartContext) {
        const event = new CustomEvent('design-cart-context-updated', {
            detail: cartContext
        });
        document.dispatchEvent(event);
    }

    /**
     * Check if current design has been exported to cart
     * @returns {boolean} Is current design exported
     */
    isCurrentDesignExported() {
        if (this.currentIndex >= 0 && this.history[this.currentIndex]) {
            return !!this.history[this.currentIndex].exported;
        }
        return false;
    }

    /**
     * Get cart item ID for current design (if exported)
     * @returns {string|null} Cart item ID
     */
    getCurrentDesignCartItemId() {
        if (this.currentIndex >= 0 && this.history[this.currentIndex]) {
            return this.history[this.currentIndex].cartItemId || null;
        }
        return null;
    }

    /**
     * Remove export marking from current state
     */
    unmarkCurrentStateAsExported() {
        if (this.currentIndex >= 0 && this.history[this.currentIndex]) {
            delete this.history[this.currentIndex].exported;
            delete this.history[this.currentIndex].cartItemId;
            delete this.history[this.currentIndex].exportedAt;
            this.saveToStorage();
        }
    }

    /**
     * Sync design state with cart when cart items are removed
     * @param {string} cartItemId - Removed cart item ID
     */
    handleCartItemRemoved(cartItemId) {
        // Find states that were exported as this cart item
        const affectedStates = this.history.filter(state => state.cartItemId === cartItemId);
        
        // Remove export markings
        affectedStates.forEach(state => {
            delete state.exported;
            delete state.cartItemId;
            delete state.exportedAt;
        });

        if (affectedStates.length > 0) {
            this.saveToStorage();
            console.log(`Removed export markings for ${affectedStates.length} design states`);
        }
    }

    /**
     * Auto-save design when significant cart changes occur
     * @param {Object} designState - Current design state
     * @param {string} reason - Reason for auto-save
     */
    autoSaveForCartChange(designState, reason = 'Cart change') {
        if (designState && designState.charms && designState.charms.length > 0) {
            const enhancedState = {
                ...designState,
                autoSaved: true,
                autoSaveReason: reason,
                autoSaveTimestamp: Date.now()
            };

            this.saveState(enhancedState);
            console.log(`Auto-saved design state: ${reason}`);
        }
    }

    /**
     * Cleanup cart integration
     */
    cleanupCartIntegration() {
        if (this.cartStateSubscription) {
            this.cartStateSubscription();
            this.cartStateSubscription = null;
        }
        this.cartManager = null;
        console.log('Cart integration cleaned up');
    }
}