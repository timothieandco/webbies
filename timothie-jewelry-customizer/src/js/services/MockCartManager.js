/**
 * MockCartManager.js
 * 
 * Mock cart implementation with localStorage persistence.
 * Provides the same interface as the real CartManager but works entirely
 * offline with local storage for data persistence.
 */

import AppConfig from '../config/AppConfig.js';
import eventBus, { Events } from '../core/EventBus.js';

class MockCartManager {
    constructor() {
        this.storageKey = AppConfig.get('storage.prefix') + AppConfig.get('storage.cartKey');
        this.sessionKey = AppConfig.get('storage.prefix') + AppConfig.get('storage.sessionKey');
        this.items = [];
        this.sessionId = this.generateSessionId();
        this.initialized = false;
        
        // Auto-save configuration
        this.autoSave = true;
        this.saveTimeout = null;
        this.saveDelay = AppConfig.get('performance.retryDelay', 1000);
    }

    /**
     * Initialize the cart manager
     */
    async initialize() {
        if (this.initialized) {
            return;
        }

        // Load cart from localStorage
        await this.loadCart();
        
        // Set up auto-save
        this.setupAutoSave();
        
        this.initialized = true;
        console.log('✅ MockCartManager initialized with', this.items.length, 'items');
        
        // Emit initialization event
        eventBus.emit(Events.SERVICE_READY, { service: 'cart', type: 'mock' });
    }

    /**
     * Load cart from localStorage
     */
    async loadCart() {
        try {
            const saved = localStorage.getItem(this.storageKey);
            if (saved) {
                const cartData = JSON.parse(saved);
                if (this.isCartDataValid(cartData)) {
                    this.items = cartData.items || [];
                    this.sessionId = cartData.sessionId || this.generateSessionId();
                    console.log('📦 Loaded cart with', this.items.length, 'items');
                    return;
                }
            }
        } catch (error) {
            console.warn('Failed to load cart from storage:', error);
        }

        // Initialize empty cart
        this.items = [];
        this.saveCart();
    }

    /**
     * Add item to cart
     * @param {Object} item - Item to add
     * @param {number} quantity - Quantity to add
     * @returns {Promise<Object>} Cart item
     */
    async addItem(item, quantity = 1) {
        if (!item || !item.id) {
            throw new Error('Invalid item: missing id');
        }

        const existingItem = this.items.find(cartItem => cartItem.id === item.id);
        
        if (existingItem) {
            // Update existing item quantity
            existingItem.quantity += quantity;
            existingItem.updated_at = new Date().toISOString();
        } else {
            // Add new item
            const cartItem = {
                id: item.id,
                name: item.name,
                description: item.description,
                image_url: item.image_url,
                price: item.price || 0,
                category: item.category,
                quantity: quantity,
                added_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                session_id: this.sessionId
            };
            
            this.items.push(cartItem);
        }

        // Save and emit events
        this.scheduleAutoSave();
        eventBus.emit(Events.CART_ADD, { item, quantity });
        eventBus.emit(Events.CART_UPDATE, { items: this.items });

        return this.items.find(cartItem => cartItem.id === item.id);
    }

    /**
     * Remove item from cart
     * @param {string} itemId - ID of item to remove
     * @param {number} quantity - Quantity to remove (null = remove all)
     * @returns {Promise<boolean>}
     */
    async removeItem(itemId, quantity = null) {
        const itemIndex = this.items.findIndex(item => item.id === itemId);
        
        if (itemIndex === -1) {
            return false;
        }

        const item = this.items[itemIndex];
        
        if (quantity === null || quantity >= item.quantity) {
            // Remove entire item
            this.items.splice(itemIndex, 1);
            eventBus.emit(Events.CART_REMOVE, { itemId, quantity: item.quantity });
        } else {
            // Reduce quantity
            item.quantity -= quantity;
            item.updated_at = new Date().toISOString();
            eventBus.emit(Events.CART_REMOVE, { itemId, quantity });
        }

        this.scheduleAutoSave();
        eventBus.emit(Events.CART_UPDATE, { items: this.items });
        
        return true;
    }

    /**
     * Update item quantity
     * @param {string} itemId - ID of item to update
     * @param {number} quantity - New quantity
     * @returns {Promise<boolean>}
     */
    async updateQuantity(itemId, quantity) {
        const item = this.items.find(item => item.id === itemId);
        
        if (!item) {
            return false;
        }

        if (quantity <= 0) {
            return this.removeItem(itemId);
        }

        const oldQuantity = item.quantity;
        item.quantity = quantity;
        item.updated_at = new Date().toISOString();

        this.scheduleAutoSave();
        eventBus.emit(Events.CART_UPDATE, { 
            itemId, 
            oldQuantity, 
            newQuantity: quantity,
            items: this.items 
        });

        return true;
    }

    /**
     * Clear all items from cart
     * @returns {Promise<void>}
     */
    async clearCart() {
        const itemCount = this.items.length;
        this.items = [];
        
        this.scheduleAutoSave();
        eventBus.emit(Events.CART_CLEAR, { itemCount });
        eventBus.emit(Events.CART_UPDATE, { items: this.items });
    }

    /**
     * Get all cart items
     * @returns {Promise<Array>}
     */
    async getItems() {
        return [...this.items];
    }

    /**
     * Get cart item by ID
     * @param {string} itemId
     * @returns {Promise<Object|null>}
     */
    async getItem(itemId) {
        return this.items.find(item => item.id === itemId) || null;
    }

    /**
     * Get cart summary
     * @returns {Promise<Object>}
     */
    async getSummary() {
        const totalItems = this.items.reduce((sum, item) => sum + item.quantity, 0);
        const totalPrice = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const uniqueItems = this.items.length;

        return {
            totalItems,
            totalPrice,
            uniqueItems,
            isEmpty: this.items.length === 0,
            sessionId: this.sessionId,
            lastUpdated: this.getLastUpdated()
        };
    }

    /**
     * Check if item is in cart
     * @param {string} itemId
     * @returns {Promise<boolean>}
     */
    async hasItem(itemId) {
        return this.items.some(item => item.id === itemId);
    }

    /**
     * Get quantity of specific item in cart
     * @param {string} itemId
     * @returns {Promise<number>}
     */
    async getItemQuantity(itemId) {
        const item = this.items.find(item => item.id === itemId);
        return item ? item.quantity : 0;
    }

    /**
     * Get items by category
     * @param {string} category
     * @returns {Promise<Array>}
     */
    async getItemsByCategory(category) {
        return this.items.filter(item => item.category === category);
    }

    /**
     * Save cart to localStorage
     */
    saveCart() {
        try {
            const cartData = {
                items: this.items,
                sessionId: this.sessionId,
                timestamp: Date.now(),
                version: '1.0'
            };
            
            localStorage.setItem(this.storageKey, JSON.stringify(cartData));
            
            // Also save session info
            const sessionData = {
                sessionId: this.sessionId,
                lastActivity: Date.now()
            };
            localStorage.setItem(this.sessionKey, JSON.stringify(sessionData));
            
        } catch (error) {
            console.error('Failed to save cart:', error);
            // Emit error event for user notification
            eventBus.emit(Events.APP_ERROR, {
                component: 'MockCartManager',
                error: new Error('Failed to save cart to storage'),
                critical: false
            });
        }
    }

    /**
     * Setup auto-save functionality
     */
    setupAutoSave() {
        if (!this.autoSave) return;

        // Save when page is about to unload
        window.addEventListener('beforeunload', () => {
            this.saveCart();
        });

        // Periodic save (every 30 seconds)
        setInterval(() => {
            if (this.items.length > 0) {
                this.saveCart();
            }
        }, 30000);
    }

    /**
     * Schedule auto-save with debouncing
     */
    scheduleAutoSave() {
        if (!this.autoSave) return;

        clearTimeout(this.saveTimeout);
        this.saveTimeout = setTimeout(() => {
            this.saveCart();
        }, this.saveDelay);
    }

    /**
     * Validate cart data structure
     */
    isCartDataValid(cartData) {
        return (
            cartData &&
            Array.isArray(cartData.items) &&
            cartData.sessionId &&
            cartData.timestamp &&
            (Date.now() - cartData.timestamp) < (24 * 60 * 60 * 1000) // 24 hours
        );
    }

    /**
     * Generate unique session ID
     */
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Get last updated timestamp
     */
    getLastUpdated() {
        if (this.items.length === 0) return null;
        
        return this.items.reduce((latest, item) => {
            const itemTime = new Date(item.updated_at).getTime();
            return itemTime > latest ? itemTime : latest;
        }, 0);
    }

    /**
     * Export cart data for backup/sync
     * @returns {Object}
     */
    exportCart() {
        return {
            items: this.items,
            sessionId: this.sessionId,
            exportedAt: new Date().toISOString(),
            version: '1.0'
        };
    }

    /**
     * Import cart data from backup/sync
     * @param {Object} cartData
     * @returns {Promise<boolean>}
     */
    async importCart(cartData) {
        try {
            if (!cartData || !Array.isArray(cartData.items)) {
                throw new Error('Invalid cart data format');
            }

            this.items = cartData.items;
            this.sessionId = cartData.sessionId || this.generateSessionId();
            
            this.saveCart();
            eventBus.emit(Events.CART_UPDATE, { items: this.items });
            
            return true;
        } catch (error) {
            console.error('Failed to import cart:', error);
            return false;
        }
    }

    /**
     * Clear storage (for testing/reset)
     */
    clearStorage() {
        localStorage.removeItem(this.storageKey);
        localStorage.removeItem(this.sessionKey);
        this.items = [];
        eventBus.emit(Events.CART_CLEAR, { itemCount: 0 });
    }

    /**
     * Get service status
     * @returns {Object}
     */
    getStatus() {
        return {
            initialized: this.initialized,
            itemCount: this.items.length,
            totalValue: this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0),
            sessionId: this.sessionId,
            autoSave: this.autoSave,
            type: 'mock',
            version: '1.0'
        };
    }

    /**
     * Enable/disable auto-save
     * @param {boolean} enabled
     */
    setAutoSave(enabled) {
        this.autoSave = enabled;
        if (enabled) {
            this.setupAutoSave();
        }
    }
}

export default MockCartManager;