/**
 * CartManager - Comprehensive cart management for the jewelry customizer
 * Handles cart state, items, calculations, persistence, and integration with existing systems
 * 
 * Features:
 * - Complete CRUD operations for cart items
 * - Real-time price calculations (subtotal, tax, shipping, discounts)
 * - Inventory validation and stock checking  
 * - Design export integration with Konva.js
 * - Cross-page persistence (localStorage + Supabase)
 * - Event system for real-time UI updates
 * - Guest and authenticated user support
 * - Cart merging and synchronization
 * - Undo/redo functionality for cart operations
 * - Error handling and graceful degradation
 */

import { EVENTS } from '../config/events.js';
import { STORAGE_KEYS, VALIDATION_RULES } from '../config/supabase.js';
import { getAPI } from '../services/InventoryAPI.js';
import CartAPI from '../services/CartAPI.js';

export default class CartManager {
    constructor(options = {}) {
        // Configuration with defaults
        this.options = {
            enablePersistence: options.enablePersistence !== false,
            enableRealTimeSync: options.enableRealTimeSync !== false,
            autoSave: options.autoSave !== false,
            persistenceInterval: options.persistenceInterval || 30000, // 30 seconds
            maxRetries: options.maxRetries || 3,
            
            // Pricing configuration
            taxRate: options.taxRate || 0.08, // 8% default tax
            freeShippingThreshold: options.freeShippingThreshold || 75,
            standardShipping: options.standardShipping || 12.99,
            currency: options.currency || 'USD',
            
            // Cart limits
            maxItems: options.maxItems || 50,
            maxQuantityPerItem: options.maxQuantityPerItem || 10,
            
            ...options
        };

        // Core cart state
        this.cartState = {
            items: [],
            subtotal: 0,
            tax: 0,
            shipping: 0,
            discount: 0,
            total: 0,
            currency: this.options.currency,
            itemCount: 0,
            version: '1.0',
            lastUpdated: Date.now(),
            sessionId: this.generateSessionId(),
            userId: null
        };

        // Undo/redo state management
        this.history = [];
        this.historyIndex = -1;
        this.maxHistorySize = options.maxHistorySize || 20;

        // Event subscribers
        this.subscribers = new Map();
        
        // Services
        this.inventoryAPI = null;
        this.cartAPI = null;
        
        // State tracking
        this.isInitialized = false;
        this.isDirty = false;
        this.isLoading = false;
        this.persistenceTimer = null;
        
        // Error state
        this.lastError = null;
        this.retryCount = 0;

        // Initialize the cart manager
        this.initialize();
    }

    /**
     * Initialize the cart manager
     */
    async initialize() {
        try {
            this.isLoading = true;

            // Initialize API services
            await this.initializeServices();
            
            // Load existing cart data
            await this.loadCartData();
            
            // Setup real-time synchronization
            if (this.options.enableRealTimeSync) {
                this.setupRealTimeSync();
            }
            
            // Setup auto-save
            if (this.options.autoSave) {
                this.setupAutoSave();
            }

            // Setup event listeners
            this.setupEventListeners();

            this.isInitialized = true;
            this.isLoading = false;
            
            console.log('CartManager initialized successfully', this.getCartSummary());
            this.emitEvent(EVENTS.CART_UPDATED, this.getCartSummary());
        } catch (error) {
            this.isLoading = false;
            this.handleError('Failed to initialize CartManager', error);
            throw error;
        }
    }

    /**
     * Initialize API services
     */
    async initializeServices() {
        try {
            // Get inventory API instance
            this.inventoryAPI = getAPI();
            
            // Initialize cart API
            this.cartAPI = new CartAPI();
            await this.cartAPI.initialize();
            
            console.log('Cart services initialized');
        } catch (error) {
            console.warn('Some cart services failed to initialize:', error);
            // Continue with degraded functionality
        }
    }

    // ===========================================
    // Core Cart Operations
    // ===========================================

    /**
     * Add item to cart
     * @param {Object} item - Item to add
     * @param {number} quantity - Quantity to add
     * @param {Object} options - Additional options
     * @returns {Promise<Object>} Cart item
     */
    async addItem(item, quantity = 1, options = {}) {
        try {
            this.validateItem(item);
            this.validateQuantity(quantity);

            // Check cart limits
            if (this.cartState.items.length >= this.options.maxItems) {
                throw new Error(`Cart limit reached. Maximum ${this.options.maxItems} items allowed.`);
            }

            // Validate inventory if not skipped
            if (!options.skipValidation) {
                await this.validateInventoryItem(item, quantity);
            }

            // Save current state for undo
            this.saveStateForUndo();

            // Check if item already exists in cart
            const existingItemIndex = this.findItemIndex(item);
            
            if (existingItemIndex !== -1) {
                // Update existing item quantity
                const existingItem = this.cartState.items[existingItemIndex];
                const newQuantity = existingItem.quantity + quantity;
                
                if (newQuantity > this.options.maxQuantityPerItem) {
                    throw new Error(`Maximum ${this.options.maxQuantityPerItem} units allowed per item.`);
                }
                
                await this.updateItemQuantity(existingItem.cartItemId, newQuantity);
                return existingItem;
            } else {
                // Add new item
                const cartItem = this.createCartItem(item, quantity, options);
                this.cartState.items.push(cartItem);
                
                await this.recalculateCart();
                await this.persistCart();
                
                this.emitEvent(EVENTS.CART_ITEM_ADDED, { 
                    item: cartItem, 
                    summary: this.getCartSummary() 
                });
                
                console.log(`Added item to cart: ${item.title} (qty: ${quantity})`);
                return cartItem;
            }
        } catch (error) {
            this.handleError('Failed to add item to cart', error);
            throw error;
        }
    }

    /**
     * Remove item from cart
     * @param {string} cartItemId - Cart item ID
     * @returns {Promise<boolean>} Success status
     */
    async removeItem(cartItemId) {
        try {
            const itemIndex = this.cartState.items.findIndex(item => item.cartItemId === cartItemId);
            if (itemIndex === -1) {
                throw new Error('Item not found in cart');
            }

            // Save current state for undo
            this.saveStateForUndo();

            const removedItem = this.cartState.items.splice(itemIndex, 1)[0];
            
            await this.recalculateCart();
            await this.persistCart();
            
            this.emitEvent(EVENTS.CART_ITEM_REMOVED, { 
                item: removedItem, 
                summary: this.getCartSummary() 
            });
            
            console.log(`Removed item from cart: ${removedItem.title}`);
            return true;
        } catch (error) {
            this.handleError('Failed to remove item from cart', error);
            throw error;
        }
    }

    /**
     * Update item quantity
     * @param {string} cartItemId - Cart item ID
     * @param {number} newQuantity - New quantity
     * @returns {Promise<Object>} Updated cart item
     */
    async updateItemQuantity(cartItemId, newQuantity) {
        try {
            this.validateQuantity(newQuantity);

            const itemIndex = this.cartState.items.findIndex(item => item.cartItemId === cartItemId);
            if (itemIndex === -1) {
                throw new Error('Item not found in cart');
            }

            const item = this.cartState.items[itemIndex];

            // Validate new quantity
            if (newQuantity > this.options.maxQuantityPerItem) {
                throw new Error(`Maximum ${this.options.maxQuantityPerItem} units allowed per item.`);
            }

            // Validate inventory
            await this.validateInventoryItem(item, newQuantity);

            // Save current state for undo
            this.saveStateForUndo();

            // Update quantity
            const oldQuantity = item.quantity;
            item.quantity = newQuantity;
            item.totalPrice = item.price * newQuantity;
            item.lastUpdated = Date.now();

            await this.recalculateCart();
            await this.persistCart();

            this.emitEvent(EVENTS.CART_ITEM_UPDATED, { 
                item, 
                oldQuantity, 
                newQuantity, 
                summary: this.getCartSummary() 
            });

            console.log(`Updated item quantity: ${item.title} (${oldQuantity} → ${newQuantity})`);
            return item;
        } catch (error) {
            this.handleError('Failed to update item quantity', error);
            throw error;
        }
    }

    /**
     * Clear all items from cart
     * @returns {Promise<boolean>} Success status
     */
    async clearCart() {
        try {
            if (this.cartState.items.length === 0) {
                return true;
            }

            // Save current state for undo
            this.saveStateForUndo();

            const itemCount = this.cartState.items.length;
            this.cartState.items = [];
            
            await this.recalculateCart();
            await this.persistCart();

            this.emitEvent(EVENTS.CART_CLEARED, { 
                itemCount, 
                summary: this.getCartSummary() 
            });

            console.log(`Cleared cart (${itemCount} items removed)`);
            return true;
        } catch (error) {
            this.handleError('Failed to clear cart', error);
            throw error;
        }
    }

    // ===========================================
    // Design Export Integration
    // ===========================================

    /**
     * Export Konva.js design to cart as custom item
     * @param {Object} designState - Design state from StateManager
     * @param {Object} metadata - Design metadata
     * @returns {Promise<Object>} Created cart item
     */
    async exportDesignToCart(designState, metadata = {}) {
        try {
            if (!designState || !designState.charms || designState.charms.length === 0) {
                throw new Error('No charms found in design to export');
            }

            // Calculate design price from components
            const designPrice = await this.calculateDesignPrice(designState.charms);
            
            // Create custom design item
            const customItem = {
                id: `custom_design_${Date.now()}`,
                title: metadata.name || `Custom Design ${new Date().toLocaleDateString()}`,
                description: metadata.description || 'Custom jewelry design created with our customizer',
                price: designPrice,
                image_url: metadata.thumbnailUrl || await this.generateDesignThumbnail(designState),
                category: 'custom_designs',
                is_custom_design: true,
                design_data: {
                    state: designState,
                    components: designState.charms,
                    metadata: {
                        ...metadata,
                        exportedAt: Date.now(),
                        version: '1.0'
                    }
                },
                // Custom design attributes
                custom_components: designState.charms.length,
                estimated_completion: metadata.estimatedCompletion || '2-3 weeks',
                requires_consultation: metadata.requiresConsultation || false
            };

            // Add to cart
            const cartItem = await this.addItem(customItem, 1, { 
                skipValidation: true // Custom designs don't have inventory 
            });

            console.log('Design exported to cart successfully:', cartItem);
            return cartItem;
        } catch (error) {
            this.handleError('Failed to export design to cart', error);
            throw error;
        }
    }

    // ===========================================
    // Price Calculations
    // ===========================================

    /**
     * Recalculate cart totals
     */
    async recalculateCart() {
        try {
            // Calculate subtotal
            this.cartState.subtotal = this.cartState.items.reduce((sum, item) => {
                return sum + (item.price * item.quantity);
            }, 0);

            // Calculate tax
            this.cartState.tax = this.cartState.subtotal * this.options.taxRate;

            // Calculate shipping
            this.cartState.shipping = this.calculateShipping();

            // Apply discounts
            this.cartState.discount = await this.calculateDiscounts();

            // Calculate total
            this.cartState.total = this.cartState.subtotal + this.cartState.tax + this.cartState.shipping - this.cartState.discount;

            // Update item count
            this.cartState.itemCount = this.cartState.items.reduce((sum, item) => sum + item.quantity, 0);

            // Update timestamp
            this.cartState.lastUpdated = Date.now();

            // Round all monetary values
            this.cartState.subtotal = Math.round(this.cartState.subtotal * 100) / 100;
            this.cartState.tax = Math.round(this.cartState.tax * 100) / 100;
            this.cartState.shipping = Math.round(this.cartState.shipping * 100) / 100;
            this.cartState.discount = Math.round(this.cartState.discount * 100) / 100;
            this.cartState.total = Math.round(this.cartState.total * 100) / 100;

            this.markDirty();
        } catch (error) {
            console.error('Error recalculating cart:', error);
            throw error;
        }
    }

    /**
     * Calculate shipping cost
     * @returns {number} Shipping cost
     */
    calculateShipping() {
        // Free shipping threshold
        if (this.cartState.subtotal >= this.options.freeShippingThreshold) {
            return 0;
        }

        // Standard shipping
        return this.options.standardShipping;
    }

    /**
     * Calculate applicable discounts
     * @returns {Promise<number>} Discount amount
     */
    async calculateDiscounts() {
        // Placeholder for discount calculation logic
        // This would integrate with a discount/coupon system
        return 0;
    }

    /**
     * Calculate design price from components
     * @param {Array} charms - Design charms/components
     * @returns {Promise<number>} Total design price
     */
    async calculateDesignPrice(charms) {
        let totalPrice = 0;
        const baseDesignFee = 25; // Base fee for custom design

        try {
            // Add component costs
            for (const charm of charms) {
                if (charm.inventoryId && this.inventoryAPI) {
                    try {
                        const item = await this.inventoryAPI.getInventoryItem(charm.inventoryId);
                        totalPrice += item.price || 0;
                    } catch (error) {
                        console.warn(`Could not fetch price for component ${charm.inventoryId}`);
                    }
                }
            }

            // Add design complexity fee
            const complexityMultiplier = Math.max(1, charms.length / 5); // Increase fee for complex designs
            const designFee = baseDesignFee * complexityMultiplier;

            return totalPrice + designFee;
        } catch (error) {
            console.error('Error calculating design price:', error);
            return baseDesignFee; // Return minimum fee on error
        }
    }

    // ===========================================
    // Validation Methods
    // ===========================================

    /**
     * Validate cart item data
     * @param {Object} item - Item to validate
     */
    validateItem(item) {
        if (!item || typeof item !== 'object') {
            throw new Error('Invalid item data');
        }

        if (!item.id) {
            throw new Error('Item ID is required');
        }

        if (!item.title || typeof item.title !== 'string') {
            throw new Error('Item title is required');
        }

        if (typeof item.price !== 'number' || item.price < 0) {
            throw new Error('Valid item price is required');
        }

        if (item.price > VALIDATION_RULES.MAX_PRICE) {
            throw new Error(`Item price exceeds maximum allowed (${VALIDATION_RULES.MAX_PRICE})`);
        }
    }

    /**
     * Validate quantity
     * @param {number} quantity - Quantity to validate
     */
    validateQuantity(quantity) {
        if (!Number.isInteger(quantity) || quantity < 1) {
            throw new Error('Quantity must be a positive integer');
        }

        if (quantity > this.options.maxQuantityPerItem) {
            throw new Error(`Maximum ${this.options.maxQuantityPerItem} units allowed per item`);
        }
    }

    /**
     * Validate inventory availability
     * @param {Object} item - Item to validate
     * @param {number} quantity - Required quantity
     */
    async validateInventoryItem(item, quantity) {
        // Skip validation for custom designs
        if (item.is_custom_design) {
            return true;
        }

        if (!this.inventoryAPI) {
            console.warn('Inventory API not available for validation');
            return true; // Allow operation to continue
        }

        try {
            const inventoryItem = await this.inventoryAPI.getInventoryItem(item.id);
            
            if (!inventoryItem) {
                throw new Error('Item not found in inventory');
            }

            if (inventoryItem.status !== 'active') {
                throw new Error('Item is no longer available');
            }

            if (inventoryItem.quantity_available < quantity) {
                throw new Error(`Only ${inventoryItem.quantity_available} units available`);
            }

            return true;
        } catch (error) {
            console.error('Inventory validation failed:', error);
            throw error;
        }
    }

    /**
     * Validate entire cart inventory
     * @returns {Promise<Object>} Validation result
     */
    async validateInventory() {
        const result = {
            isValid: true,
            invalidItems: [],
            quantityIssues: [],
            priceChanges: []
        };

        if (!this.inventoryAPI) {
            console.warn('Cannot validate inventory without API');
            return result;
        }

        try {
            for (const cartItem of this.cartState.items) {
                if (cartItem.is_custom_design) {
                    // Validate custom design components
                    const componentValidation = await this.validateCustomDesignComponents(cartItem.design_data?.components || []);
                    if (!componentValidation.isValid) {
                        result.isValid = false;
                        result.invalidItems.push({
                            cartItem,
                            reason: 'Custom design components unavailable',
                            details: componentValidation.unavailableComponents
                        });
                    }
                } else {
                    try {
                        const inventoryItem = await this.inventoryAPI.getInventoryItem(cartItem.id);
                        
                        if (!inventoryItem || inventoryItem.status !== 'active') {
                            result.isValid = false;
                            result.invalidItems.push({
                                cartItem,
                                reason: 'Item no longer available'
                            });
                        } else {
                            // Check quantity
                            if (inventoryItem.quantity_available < cartItem.quantity) {
                                result.quantityIssues.push({
                                    cartItem,
                                    available: inventoryItem.quantity_available,
                                    requested: cartItem.quantity
                                });
                            }

                            // Check price changes
                            if (Math.abs(inventoryItem.price - cartItem.price) > 0.01) {
                                result.priceChanges.push({
                                    cartItem,
                                    oldPrice: cartItem.price,
                                    newPrice: inventoryItem.price
                                });
                            }
                        }
                    } catch (error) {
                        result.isValid = false;
                        result.invalidItems.push({
                            cartItem,
                            reason: 'Unable to validate item',
                            error: error.message
                        });
                    }
                }
            }

            if (result.quantityIssues.length > 0 || result.priceChanges.length > 0) {
                this.emitEvent(EVENTS.CART_VALIDATION_FAILED, result);
            }

            return result;
        } catch (error) {
            console.error('Cart validation failed:', error);
            throw error;
        }
    }

    /**
     * Validate custom design components
     * @param {Array} components - Design components
     * @returns {Promise<Object>} Validation result
     */
    async validateCustomDesignComponents(components) {
        const result = {
            isValid: true,
            unavailableComponents: []
        };

        if (!this.inventoryAPI || !components.length) {
            return result;
        }

        for (const component of components) {
            try {
                const item = await this.inventoryAPI.getInventoryItem(component.inventoryId);
                
                if (!item || item.status !== 'active' || item.quantity_available < 1) {
                    result.isValid = false;
                    result.unavailableComponents.push(component);
                }
            } catch (error) {
                result.isValid = false;
                result.unavailableComponents.push(component);
            }
        }

        return result;
    }

    // ===========================================
    // State Management & Persistence
    // ===========================================

    /**
     * Load cart data from storage
     */
    async loadCartData() {
        try {
            // Try to load user cart first (if authenticated)
            const userId = await this.getCurrentUserId();
            
            if (userId) {
                await this.loadUserCart(userId);
            } else {
                await this.loadGuestCart();
            }
        } catch (error) {
            console.warn('Failed to load cart data:', error);
            // Continue with empty cart
        }
    }

    /**
     * Load user cart from backend
     * @param {string} userId - User ID
     */
    async loadUserCart(userId) {
        try {
            if (!this.cartAPI) {
                throw new Error('CartAPI not available');
            }

            const userCart = await this.cartAPI.getUserCart(userId);
            if (userCart && userCart.cart_data) {
                this.cartState = { ...this.cartState, ...userCart.cart_data };
                this.cartState.userId = userId;
                await this.recalculateCart(); // Recalculate in case of data changes
                console.log('User cart loaded successfully');
            }
        } catch (error) {
            console.warn('Failed to load user cart:', error);
            throw error;
        }
    }

    /**
     * Load guest cart from localStorage
     */
    async loadGuestCart() {
        try {
            const savedCart = localStorage.getItem(STORAGE_KEYS.SHOPPING_CART);
            if (savedCart) {
                const cartData = JSON.parse(savedCart);
                this.cartState = { ...this.cartState, ...cartData };
                await this.recalculateCart();
                console.log('Guest cart loaded from localStorage');
            }
        } catch (error) {
            console.warn('Failed to load guest cart:', error);
            // Continue with empty cart
        }
    }

    /**
     * Persist cart data
     */
    async persistCart() {
        if (!this.options.enablePersistence) {
            return;
        }

        try {
            const userId = this.cartState.userId || await this.getCurrentUserId();
            
            if (userId) {
                await this.saveUserCart(userId);
            } else {
                await this.saveGuestCart();
            }
        } catch (error) {
            console.warn('Failed to persist cart:', error);
            // Continue operation - persistence failure shouldn't break functionality
        }
    }

    /**
     * Save user cart to backend
     * @param {string} userId - User ID
     */
    async saveUserCart(userId) {
        try {
            if (!this.cartAPI) {
                throw new Error('CartAPI not available');
            }

            await this.cartAPI.saveUserCart(this.cartState, userId);
            this.cartState.userId = userId;
            console.log('User cart saved successfully');
        } catch (error) {
            console.error('Failed to save user cart:', error);
            throw error;
        }
    }

    /**
     * Save guest cart to localStorage
     */
    async saveGuestCart() {
        try {
            localStorage.setItem(STORAGE_KEYS.SHOPPING_CART, JSON.stringify(this.cartState));
            console.log('Guest cart saved to localStorage');
        } catch (error) {
            console.error('Failed to save guest cart:', error);
            throw error;
        }
    }

    // ===========================================
    // Undo/Redo Functionality
    // ===========================================

    /**
     * Save current state for undo functionality
     */
    saveStateForUndo() {
        // Remove any future states if we're not at the end
        if (this.historyIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.historyIndex + 1);
        }

        // Deep clone current state
        const stateSnapshot = JSON.parse(JSON.stringify(this.cartState));
        this.history.push(stateSnapshot);
        this.historyIndex++;

        // Limit history size
        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
            this.historyIndex--;
        }
    }

    /**
     * Undo last cart operation
     * @returns {boolean} Success status
     */
    async undo() {
        if (this.historyIndex <= 0) {
            return false;
        }

        try {
            this.historyIndex--;
            const previousState = JSON.parse(JSON.stringify(this.history[this.historyIndex]));
            this.cartState = previousState;
            
            await this.persistCart();
            this.emitEvent(EVENTS.CART_UNDONE, this.getCartSummary());
            
            console.log('Cart undo performed');
            return true;
        } catch (error) {
            this.handleError('Failed to undo cart operation', error);
            return false;
        }
    }

    /**
     * Redo last undone cart operation
     * @returns {boolean} Success status
     */
    async redo() {
        if (this.historyIndex >= this.history.length - 1) {
            return false;
        }

        try {
            this.historyIndex++;
            const nextState = JSON.parse(JSON.stringify(this.history[this.historyIndex]));
            this.cartState = nextState;
            
            await this.persistCart();
            this.emitEvent(EVENTS.CART_REDONE, this.getCartSummary());
            
            console.log('Cart redo performed');
            return true;
        } catch (error) {
            this.handleError('Failed to redo cart operation', error);
            return false;
        }
    }

    /**
     * Check if undo is available
     * @returns {boolean} Can undo
     */
    canUndo() {
        return this.historyIndex > 0;
    }

    /**
     * Check if redo is available
     * @returns {boolean} Can redo
     */
    canRedo() {
        return this.historyIndex < this.history.length - 1;
    }

    // ===========================================
    // User Authentication Integration
    // ===========================================

    /**
     * Handle user login - merge guest cart with user cart
     * @param {string} userId - User ID
     */
    async handleUserLogin(userId) {
        try {
            console.log('Handling user login for cart synchronization');
            
            // Save current guest cart
            const guestCart = { ...this.cartState };
            
            // Load user cart
            await this.loadUserCart(userId);
            
            // Merge guest cart if it has items
            if (guestCart.items.length > 0) {
                await this.mergeGuestCart(guestCart);
            }
            
            this.emitEvent(EVENTS.CART_USER_LOGGED_IN, { 
                userId, 
                summary: this.getCartSummary() 
            });
            
            console.log('User cart synchronization completed');
        } catch (error) {
            this.handleError('Failed to handle user login', error);
        }
    }

    /**
     * Handle user logout - clear user data
     */
    async handleUserLogout() {
        try {
            this.cartState.userId = null;
            await this.saveGuestCart();
            
            this.emitEvent(EVENTS.CART_USER_LOGGED_OUT, this.getCartSummary());
            
            console.log('User logged out, cart converted to guest cart');
        } catch (error) {
            this.handleError('Failed to handle user logout', error);
        }
    }

    /**
     * Merge guest cart with user cart
     * @param {Object} guestCart - Guest cart state
     */
    async mergeGuestCart(guestCart) {
        try {
            const mergedItems = [...this.cartState.items];
            
            // Merge items from guest cart
            for (const guestItem of guestCart.items) {
                const existingIndex = this.findItemIndex(guestItem);
                
                if (existingIndex !== -1) {
                    // Merge quantities
                    const existingItem = mergedItems[existingIndex];
                    const newQuantity = existingItem.quantity + guestItem.quantity;
                    
                    if (newQuantity <= this.options.maxQuantityPerItem) {
                        existingItem.quantity = newQuantity;
                        existingItem.totalPrice = existingItem.price * newQuantity;
                    }
                } else {
                    // Add new item
                    mergedItems.push(guestItem);
                }
            }
            
            this.cartState.items = mergedItems;
            await this.recalculateCart();
            await this.persistCart();
            
            this.emitEvent(EVENTS.CART_SYNCED, this.getCartSummary());
            console.log('Guest cart merged with user cart');
        } catch (error) {
            console.error('Failed to merge guest cart:', error);
            throw error;
        }
    }

    // ===========================================
    // Utility Methods
    // ===========================================

    /**
     * Create cart item from inventory item
     * @param {Object} item - Inventory item
     * @param {number} quantity - Quantity
     * @param {Object} options - Additional options
     * @returns {Object} Cart item
     */
    createCartItem(item, quantity, options = {}) {
        return {
            cartItemId: this.generateCartItemId(),
            id: item.id,
            title: item.title,
            description: item.description || '',
            price: item.price,
            image_url: item.image_url,
            category: item.category,
            quantity: quantity,
            totalPrice: item.price * quantity,
            is_custom_design: item.is_custom_design || false,
            design_data: item.design_data || null,
            addedAt: Date.now(),
            lastUpdated: Date.now(),
            ...options
        };
    }

    /**
     * Find item index in cart
     * @param {Object} item - Item to find
     * @returns {number} Item index or -1
     */
    findItemIndex(item) {
        return this.cartState.items.findIndex(cartItem => {
            // Custom designs are never considered duplicates
            if (item.is_custom_design || cartItem.is_custom_design) {
                return false;
            }
            
            return cartItem.id === item.id;
        });
    }

    /**
     * Generate unique cart item ID
     * @returns {string} Unique ID
     */
    generateCartItemId() {
        return `cart_item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Generate unique session ID
     * @returns {string} Session ID
     */
    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * Get current user ID from authentication
     * @returns {Promise<string|null>} User ID
     */
    async getCurrentUserId() {
        try {
            if (this.inventoryAPI && this.inventoryAPI.currentUser) {
                return this.inventoryAPI.currentUser.id;
            }
            return null;
        } catch (error) {
            return null;
        }
    }

    /**
     * Generate design thumbnail (placeholder)
     * @param {Object} designState - Design state
     * @returns {Promise<string>} Thumbnail URL
     */
    async generateDesignThumbnail(designState) {
        // Placeholder - in real implementation this would capture the Konva canvas
        return '/images/design-placeholder.png';
    }

    /**
     * Mark cart as dirty (needs persistence)
     */
    markDirty() {
        this.isDirty = true;
    }

    // ===========================================
    // Event System
    // ===========================================

    /**
     * Subscribe to cart events
     * @param {string} eventName - Event name
     * @param {Function} callback - Event callback
     * @returns {Function} Unsubscribe function
     */
    subscribe(eventName, callback) {
        if (!this.subscribers.has(eventName)) {
            this.subscribers.set(eventName, new Set());
        }
        
        this.subscribers.get(eventName).add(callback);
        
        return () => {
            this.subscribers.get(eventName)?.delete(callback);
        };
    }

    /**
     * Emit cart event
     * @param {string} eventName - Event name
     * @param {*} data - Event data
     */
    emitEvent(eventName, data) {
        // Notify subscribers
        const subscribers = this.subscribers.get(eventName);
        if (subscribers) {
            subscribers.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in cart event subscriber for ${eventName}:`, error);
                }
            });
        }

        // Emit DOM event
        const event = new CustomEvent(eventName, { detail: data });
        document.dispatchEvent(event);
    }

    // ===========================================
    // Auto-save and Real-time Sync
    // ===========================================

    /**
     * Setup auto-save functionality
     */
    setupAutoSave() {
        this.persistenceTimer = setInterval(() => {
            if (this.isDirty) {
                this.persistCart().then(() => {
                    this.isDirty = false;
                }).catch(error => {
                    console.warn('Auto-save failed:', error);
                });
            }
        }, this.options.persistenceInterval);
    }

    /**
     * Setup real-time synchronization
     */
    setupRealTimeSync() {
        // Subscribe to auth state changes
        document.addEventListener(EVENTS.USER_AUTHENTICATED, (event) => {
            this.handleUserLogin(event.detail.user.id);
        });

        document.addEventListener(EVENTS.USER_SIGNED_OUT, () => {
            this.handleUserLogout();
        });
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Window beforeunload for final save
        window.addEventListener('beforeunload', () => {
            if (this.isDirty) {
                this.persistCart();
            }
        });

        // Page visibility change for sync
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.options.enableRealTimeSync) {
                // Page became visible - sync cart state
                this.syncCartState();
            }
        });
    }

    /**
     * Sync cart state (for real-time updates)
     */
    async syncCartState() {
        try {
            const userId = await this.getCurrentUserId();
            if (userId && this.cartAPI) {
                const serverCart = await this.cartAPI.getUserCart(userId);
                if (serverCart && serverCart.last_updated > this.cartState.lastUpdated) {
                    // Server has newer data
                    this.cartState = { ...this.cartState, ...serverCart.cart_data };
                    await this.recalculateCart();
                    this.emitEvent(EVENTS.CART_SYNCED, this.getCartSummary());
                }
            }
        } catch (error) {
            console.warn('Cart sync failed:', error);
        }
    }

    // ===========================================
    // Public API Methods
    // ===========================================

    /**
     * Get cart state
     * @returns {Object} Cart state
     */
    getCartState() {
        return { ...this.cartState };
    }

    /**
     * Get cart summary
     * @returns {Object} Cart summary
     */
    getCartSummary() {
        return {
            itemCount: this.cartState.itemCount,
            subtotal: this.cartState.subtotal,
            tax: this.cartState.tax,
            shipping: this.cartState.shipping,
            discount: this.cartState.discount,
            total: this.cartState.total,
            currency: this.cartState.currency,
            hasItems: this.cartState.items.length > 0,
            lastUpdated: this.cartState.lastUpdated
        };
    }

    /**
     * Get cart items
     * @returns {Array} Cart items
     */
    getItems() {
        return [...this.cartState.items];
    }

    /**
     * Get item count
     * @returns {number} Total item count
     */
    getItemCount() {
        return this.cartState.itemCount;
    }

    /**
     * Get cart total
     * @returns {number} Cart total
     */
    getTotal() {
        return this.cartState.total;
    }

    /**
     * Check if cart is empty
     * @returns {boolean} Is cart empty
     */
    isEmpty() {
        return this.cartState.items.length === 0;
    }

    /**
     * Check if cart has item
     * @param {string} itemId - Item ID
     * @returns {boolean} Has item
     */
    hasItem(itemId) {
        return this.cartState.items.some(item => item.id === itemId);
    }

    /**
     * Get specific cart item
     * @param {string} cartItemId - Cart item ID
     * @returns {Object|null} Cart item
     */
    getItem(cartItemId) {
        return this.cartState.items.find(item => item.cartItemId === cartItemId) || null;
    }

    // ===========================================
    // Error Handling
    // ===========================================

    /**
     * Handle errors
     * @param {string} message - Error message
     * @param {Error} error - Error object
     */
    handleError(message, error) {
        this.lastError = { message, error, timestamp: Date.now() };
        console.error(message, error);
        
        this.emitEvent(EVENTS.CART_ERROR, {
            message,
            error: error.message,
            timestamp: Date.now()
        });
    }

    /**
     * Get last error
     * @returns {Object|null} Last error
     */
    getLastError() {
        return this.lastError;
    }

    /**
     * Clear last error
     */
    clearError() {
        this.lastError = null;
    }

    // ===========================================
    // Cleanup
    // ===========================================

    /**
     * Cleanup cart manager
     */
    destroy() {
        // Clear timers
        if (this.persistenceTimer) {
            clearInterval(this.persistenceTimer);
        }

        // Final save
        if (this.isDirty) {
            this.persistCart();
        }

        // Clear subscribers
        this.subscribers.clear();

        // Remove event listeners
        window.removeEventListener('beforeunload', this.persistCart);

        console.log('CartManager destroyed');
    }
}