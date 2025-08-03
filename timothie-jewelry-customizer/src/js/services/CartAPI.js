/**
 * CartAPI - Backend cart operations service
 * Handles cart persistence, synchronization, and backend integration
 * 
 * Features:
 * - User cart management (CRUD operations)
 * - Guest cart management with session tracking
 * - Cart merging and synchronization
 * - Inventory validation integration
 * - Real-time cart subscriptions
 * - Cart migration (guest → user)
 * - Error handling and retry logic
 */

import { getAPI } from './InventoryAPI.js';
import { EVENTS } from '../config/events.js';
import { STORAGE_KEYS } from '../config/supabase.js';

export default class CartAPI {
    constructor(options = {}) {
        this.options = {
            enableRetry: options.enableRetry !== false,
            maxRetries: options.maxRetries || 3,
            retryDelay: options.retryDelay || 1000,
            enableRealTime: options.enableRealTime !== false,
            guestCartExpiry: options.guestCartExpiry || 7 * 24 * 60 * 60 * 1000, // 7 days
            ...options
        };

        // API instances
        this.inventoryAPI = null;
        
        // State
        this.isInitialized = false;
        this.subscriptions = new Map();
        
        // Error tracking
        this.lastError = null;
        this.retryAttempts = new Map();
    }

    /**
     * Initialize the CartAPI service
     */
    async initialize() {
        try {
            // Get inventory API instance
            this.inventoryAPI = getAPI();
            
            this.isInitialized = true;
            console.log('CartAPI initialized successfully');
        } catch (error) {
            console.warn('CartAPI initialization warning:', error);
            // Continue with limited functionality
            this.isInitialized = true;
        }
    }

    // ===========================================
    // User Cart Operations
    // ===========================================

    /**
     * Save user cart to backend
     * @param {Object} cartState - Cart state data
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Saved cart data
     */
    async saveUserCart(cartState, userId) {
        const operationKey = `save_user_cart_${userId}`;
        
        return await this.executeWithRetry(operationKey, async () => {
            if (!this.inventoryAPI) {
                throw new Error('InventoryAPI not available');
            }

            const cartData = this.prepareCartDataForSave(cartState, userId);
            const result = await this.inventoryAPI.saveUserCart(cartData, userId);
            
            console.log(`User cart saved for user ${userId}`);
            return result;
        });
    }

    /**
     * Load user cart from backend
     * @param {string} userId - User ID
     * @returns {Promise<Object|null>} User cart data
     */
    async getUserCart(userId) {
        const operationKey = `get_user_cart_${userId}`;
        
        return await this.executeWithRetry(operationKey, async () => {
            if (!this.inventoryAPI) {
                console.warn('InventoryAPI not available for getUserCart');
                return null;
            }

            const result = await this.inventoryAPI.getUserCart(userId);
            
            if (result) {
                console.log(`User cart loaded for user ${userId}`);
                return this.processLoadedCartData(result);
            }
            
            return null;
        });
    }

    /**
     * Delete user cart
     * @param {string} userId - User ID
     * @returns {Promise<boolean>} Success status
     */
    async deleteUserCart(userId) {
        const operationKey = `delete_user_cart_${userId}`;
        
        return await this.executeWithRetry(operationKey, async () => {
            if (!this.inventoryAPI) {
                throw new Error('InventoryAPI not available');
            }

            await this.inventoryAPI.deleteUserCart(userId);
            console.log(`User cart deleted for user ${userId}`);
            return true;
        });
    }

    /**
     * Subscribe to user cart changes
     * @param {string} userId - User ID
     * @param {Function} callback - Change callback
     * @returns {Function} Unsubscribe function
     */
    subscribeToUserCartChanges(userId, callback) {
        if (!this.inventoryAPI || !this.options.enableRealTime) {
            console.warn('Real-time cart subscriptions not available');
            return () => {}; // Return empty unsubscribe function
        }

        try {
            const subscription = this.inventoryAPI.subscribeToCartChanges(userId, (payload) => {
                console.log('User cart changed:', payload);
                callback(payload);
            });

            this.subscriptions.set(`user_cart_${userId}`, subscription);
            
            return () => {
                subscription.unsubscribe();
                this.subscriptions.delete(`user_cart_${userId}`);
            };
        } catch (error) {
            console.error('Failed to subscribe to user cart changes:', error);
            return () => {};
        }
    }

    // ===========================================
    // Guest Cart Operations
    // ===========================================

    /**
     * Save guest cart to backend
     * @param {Object} cartState - Cart state data
     * @param {string} sessionId - Session ID
     * @returns {Promise<Object>} Saved cart data
     */
    async saveGuestCart(cartState, sessionId) {
        const operationKey = `save_guest_cart_${sessionId}`;
        
        return await this.executeWithRetry(operationKey, async () => {
            if (!this.inventoryAPI) {
                // Fallback to localStorage for guest carts
                return this.saveGuestCartToLocalStorage(cartState, sessionId);
            }

            const cartData = this.prepareCartDataForSave(cartState);
            const result = await this.inventoryAPI.saveGuestCart(cartData, sessionId);
            
            console.log(`Guest cart saved for session ${sessionId}`);
            return result;
        });
    }

    /**
     * Load guest cart from backend
     * @param {string} sessionId - Session ID
     * @returns {Promise<Object|null>} Guest cart data
     */
    async getGuestCart(sessionId) {
        const operationKey = `get_guest_cart_${sessionId}`;
        
        return await this.executeWithRetry(operationKey, async () => {
            if (!this.inventoryAPI) {
                // Fallback to localStorage for guest carts
                return this.getGuestCartFromLocalStorage(sessionId);
            }

            const result = await this.inventoryAPI.getGuestCart(sessionId);
            
            if (result) {
                console.log(`Guest cart loaded for session ${sessionId}`);
                return this.processLoadedCartData(result);
            }
            
            return null;
        });
    }

    /**
     * Delete guest cart
     * @param {string} sessionId - Session ID
     * @returns {Promise<boolean>} Success status
     */
    async deleteGuestCart(sessionId) {
        const operationKey = `delete_guest_cart_${sessionId}`;
        
        return await this.executeWithRetry(operationKey, async () => {
            if (!this.inventoryAPI) {
                // Remove from localStorage
                this.deleteGuestCartFromLocalStorage(sessionId);
                return true;
            }

            await this.inventoryAPI.deleteGuestCart(sessionId);
            console.log(`Guest cart deleted for session ${sessionId}`);
            return true;
        });
    }

    // ===========================================
    // Cart Migration & Merging
    // ===========================================

    /**
     * Transfer guest cart to user account
     * @param {string} sessionId - Guest session ID
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Merged cart data
     */
    async transferGuestCartToUser(sessionId, userId) {
        const operationKey = `transfer_cart_${sessionId}_to_${userId}`;
        
        return await this.executeWithRetry(operationKey, async () => {
            if (!this.inventoryAPI) {
                // Handle transfer with localStorage fallback
                return this.transferGuestCartToUserLocal(sessionId, userId);
            }

            const result = await this.inventoryAPI.transferGuestCartToUser(sessionId, userId);
            console.log(`Guest cart transferred from session ${sessionId} to user ${userId}`);
            return result;
        });
    }

    /**
     * Merge two cart data objects
     * @param {Object} guestCartData - Guest cart data
     * @param {Object} userCartData - User cart data
     * @returns {Object} Merged cart data
     */
    mergeCartData(guestCartData, userCartData) {
        const mergedItems = [...(userCartData.items || [])];
        
        // Merge items from guest cart
        for (const guestItem of (guestCartData.items || [])) {
            const existingItemIndex = mergedItems.findIndex(userItem => 
                this.areCartItemsEquivalent(userItem, guestItem)
            );

            if (existingItemIndex !== -1) {
                // Merge quantities
                const existingItem = mergedItems[existingItemIndex];
                existingItem.quantity += guestItem.quantity;
                existingItem.totalPrice = existingItem.price * existingItem.quantity;
                existingItem.lastUpdated = Date.now();
            } else {
                // Add new item
                mergedItems.push({
                    ...guestItem,
                    lastUpdated: Date.now()
                });
            }
        }

        // Recalculate totals
        const subtotal = mergedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const tax = subtotal * 0.08; // 8% tax
        const shipping = subtotal >= 75 ? 0 : 12.99; // Free shipping over $75
        const total = subtotal + tax + shipping;

        return {
            items: mergedItems,
            subtotal: Math.round(subtotal * 100) / 100,
            tax: Math.round(tax * 100) / 100,
            shipping: Math.round(shipping * 100) / 100,
            discount: 0,
            total: Math.round(total * 100) / 100,
            currency: userCartData.currency || guestCartData.currency || 'USD',
            itemCount: mergedItems.reduce((sum, item) => sum + item.quantity, 0),
            lastUpdated: Date.now(),
            version: '1.0'
        };
    }

    /**
     * Check if two cart items are equivalent for merging
     * @param {Object} item1 - First cart item
     * @param {Object} item2 - Second cart item
     * @returns {boolean} Are items equivalent
     */
    areCartItemsEquivalent(item1, item2) {
        // Basic comparison
        if (item1.id !== item2.id) return false;
        
        // Custom designs are never equivalent
        if (item1.is_custom_design || item2.is_custom_design) return false;
        
        // Same inventory item - can be merged
        return true;
    }

    // ===========================================
    // Cart Validation
    // ===========================================

    /**
     * Validate cart items against current inventory
     * @param {Array} cartItems - Cart items to validate
     * @returns {Promise<Object>} Validation result
     */
    async validateCartItems(cartItems) {
        const operationKey = 'validate_cart_items';
        
        return await this.executeWithRetry(operationKey, async () => {
            if (!this.inventoryAPI) {
                console.warn('Cannot validate cart items without InventoryAPI');
                return { isValid: true, invalidItems: [], quantityIssues: [], priceChanges: [] };
            }

            return await this.inventoryAPI.validateCartItems(cartItems);
        });
    }

    /**
     * Validate custom design components
     * @param {Array} components - Design components
     * @returns {Promise<Object>} Validation result
     */
    async validateCustomDesignComponents(components) {
        const operationKey = 'validate_design_components';
        
        return await this.executeWithRetry(operationKey, async () => {
            if (!this.inventoryAPI) {
                console.warn('Cannot validate design components without InventoryAPI');
                return { isValid: true, unavailableComponents: [] };
            }

            return await this.inventoryAPI.validateCustomDesignComponents(components);
        });
    }

    // ===========================================
    // Order Creation
    // ===========================================

    /**
     * Create order from cart
     * @param {Object} cartData - Cart data
     * @param {Object} orderDetails - Additional order details
     * @returns {Promise<Object>} Created order
     */
    async createOrderFromCart(cartData, orderDetails = {}) {
        const operationKey = 'create_order_from_cart';
        
        return await this.executeWithRetry(operationKey, async () => {
            if (!this.inventoryAPI) {
                throw new Error('Cannot create order without InventoryAPI');
            }

            const result = await this.inventoryAPI.createOrderFromCart(cartData, orderDetails);
            console.log('Order created from cart:', result.order_number);
            return result;
        });
    }

    // ===========================================
    // Data Processing Helpers
    // ===========================================

    /**
     * Prepare cart data for saving
     * @param {Object} cartState - Cart state
     * @param {string} userId - User ID (optional)
     * @returns {Object} Prepared cart data
     */
    prepareCartDataForSave(cartState, userId = null) {
        // Clean and validate cart data before saving
        const cleanedItems = cartState.items.map(item => ({
            cartItemId: item.cartItemId,
            id: item.id,
            title: item.title,
            description: item.description,
            price: item.price,
            image_url: item.image_url,
            category: item.category,
            quantity: item.quantity,
            totalPrice: item.totalPrice,
            is_custom_design: item.is_custom_design || false,
            design_data: item.design_data || null,
            addedAt: item.addedAt,
            lastUpdated: item.lastUpdated
        }));

        return {
            items: cleanedItems,
            subtotal: cartState.subtotal,
            tax: cartState.tax,
            shipping: cartState.shipping,
            discount: cartState.discount,
            total: cartState.total,
            currency: cartState.currency,
            itemCount: cartState.itemCount,
            version: cartState.version || '1.0',
            lastUpdated: Date.now(),
            sessionId: cartState.sessionId,
            userId: userId
        };
    }

    /**
     * Process loaded cart data
     * @param {Object} rawCartData - Raw cart data from backend
     * @returns {Object} Processed cart data
     */
    processLoadedCartData(rawCartData) {
        // Extract cart_data if it's wrapped
        const cartData = rawCartData.cart_data || rawCartData;
        
        // Ensure all required fields exist
        return {
            items: cartData.items || [],
            subtotal: cartData.subtotal || 0,
            tax: cartData.tax || 0,
            shipping: cartData.shipping || 0,
            discount: cartData.discount || 0,
            total: cartData.total || 0,
            currency: cartData.currency || 'USD',
            itemCount: cartData.itemCount || 0,
            version: cartData.version || '1.0',
            lastUpdated: cartData.lastUpdated || rawCartData.last_updated || Date.now(),
            sessionId: cartData.sessionId,
            userId: cartData.userId || rawCartData.user_id
        };
    }

    // ===========================================
    // LocalStorage Fallback Methods
    // ===========================================

    /**
     * Save guest cart to localStorage (fallback)
     * @param {Object} cartState - Cart state
     * @param {string} sessionId - Session ID
     * @returns {Object} Saved cart data
     */
    saveGuestCartToLocalStorage(cartState, sessionId) {
        try {
            const guestCartKey = `${STORAGE_KEYS.SHOPPING_CART}_guest_${sessionId}`;
            const cartData = this.prepareCartDataForSave(cartState);
            
            localStorage.setItem(guestCartKey, JSON.stringify(cartData));
            console.log(`Guest cart saved to localStorage for session ${sessionId}`);
            
            return cartData;
        } catch (error) {
            console.error('Failed to save guest cart to localStorage:', error);
            throw error;
        }
    }

    /**
     * Get guest cart from localStorage (fallback)
     * @param {string} sessionId - Session ID
     * @returns {Object|null} Guest cart data
     */
    getGuestCartFromLocalStorage(sessionId) {
        try {
            const guestCartKey = `${STORAGE_KEYS.SHOPPING_CART}_guest_${sessionId}`;
            const savedCart = localStorage.getItem(guestCartKey);
            
            if (savedCart) {
                const cartData = JSON.parse(savedCart);
                console.log(`Guest cart loaded from localStorage for session ${sessionId}`);
                return this.processLoadedCartData(cartData);
            }
            
            return null;
        } catch (error) {
            console.error('Failed to load guest cart from localStorage:', error);
            return null;
        }
    }

    /**
     * Delete guest cart from localStorage (fallback)
     * @param {string} sessionId - Session ID
     */
    deleteGuestCartFromLocalStorage(sessionId) {
        try {
            const guestCartKey = `${STORAGE_KEYS.SHOPPING_CART}_guest_${sessionId}`;
            localStorage.removeItem(guestCartKey);
            console.log(`Guest cart removed from localStorage for session ${sessionId}`);
        } catch (error) {
            console.error('Failed to delete guest cart from localStorage:', error);
        }
    }

    /**
     * Transfer guest cart to user (localStorage fallback)
     * @param {string} sessionId - Guest session ID
     * @param {string} userId - User ID
     * @returns {Object} Merged cart data
     */
    async transferGuestCartToUserLocal(sessionId, userId) {
        try {
            // Get guest cart from localStorage
            const guestCart = this.getGuestCartFromLocalStorage(sessionId);
            if (!guestCart) {
                console.log('No guest cart to transfer');
                return null;
            }

            // Get user cart (might not exist)
            const userCartKey = `${STORAGE_KEYS.SHOPPING_CART}_user_${userId}`;
            const userCartData = localStorage.getItem(userCartKey);
            let userCart = { items: [], currency: 'USD' };
            
            if (userCartData) {
                userCart = JSON.parse(userCartData);
            }

            // Merge carts
            const mergedCart = this.mergeCartData(guestCart, userCart);
            
            // Save merged cart as user cart
            localStorage.setItem(userCartKey, JSON.stringify(mergedCart));
            
            // Remove guest cart
            this.deleteGuestCartFromLocalStorage(sessionId);
            
            console.log(`Guest cart transferred to user ${userId} using localStorage`);
            return mergedCart;
        } catch (error) {
            console.error('Failed to transfer guest cart to user (localStorage):', error);
            throw error;
        }
    }

    // ===========================================
    // Cart Maintenance
    // ===========================================

    /**
     * Clean up expired guest carts
     * @returns {Promise<number>} Number of carts cleaned up
     */
    async cleanupExpiredGuestCarts() {
        const operationKey = 'cleanup_expired_carts';
        
        return await this.executeWithRetry(operationKey, async () => {
            if (!this.inventoryAPI) {
                return this.cleanupExpiredGuestCartsLocal();
            }

            const result = await this.inventoryAPI.cleanupExpiredGuestCarts();
            console.log(`Cleaned up ${result} expired guest carts`);
            return result;
        });
    }

    /**
     * Clean up expired guest carts from localStorage
     * @returns {number} Number of carts cleaned up
     */
    cleanupExpiredGuestCartsLocal() {
        let cleanedCount = 0;
        
        try {
            const keys = Object.keys(localStorage);
            const guestCartKeys = keys.filter(key => key.startsWith(`${STORAGE_KEYS.SHOPPING_CART}_guest_`));
            
            for (const key of guestCartKeys) {
                try {
                    const cartData = JSON.parse(localStorage.getItem(key));
                    const expiry = cartData.lastUpdated + this.options.guestCartExpiry;
                    
                    if (Date.now() > expiry) {
                        localStorage.removeItem(key);
                        cleanedCount++;
                    }
                } catch (error) {
                    // Invalid cart data, remove it
                    localStorage.removeItem(key);
                    cleanedCount++;
                }
            }
            
            console.log(`Cleaned up ${cleanedCount} expired guest carts from localStorage`);
        } catch (error) {
            console.error('Failed to cleanup expired guest carts from localStorage:', error);
        }
        
        return cleanedCount;
    }

    /**
     * Get cart statistics
     * @returns {Promise<Object>} Cart statistics
     */
    async getCartStatistics() {
        const operationKey = 'get_cart_statistics';
        
        return await this.executeWithRetry(operationKey, async () => {
            if (!this.inventoryAPI) {
                return this.getCartStatisticsLocal();
            }

            // This would require additional backend endpoints
            // For now, return basic statistics
            return {
                activeUserCarts: 0,
                activeGuestCarts: 0,
                totalCartValue: 0,
                averageCartValue: 0
            };
        });
    }

    /**
     * Get cart statistics from localStorage
     * @returns {Object} Cart statistics
     */
    getCartStatisticsLocal() {
        try {
            const keys = Object.keys(localStorage);
            const userCartKeys = keys.filter(key => key.startsWith(`${STORAGE_KEYS.SHOPPING_CART}_user_`));
            const guestCartKeys = keys.filter(key => key.startsWith(`${STORAGE_KEYS.SHOPPING_CART}_guest_`));
            
            let totalValue = 0;
            let cartCount = 0;
            
            [...userCartKeys, ...guestCartKeys].forEach(key => {
                try {
                    const cartData = JSON.parse(localStorage.getItem(key));
                    totalValue += cartData.total || 0;
                    cartCount++;
                } catch (error) {
                    // Skip invalid carts
                }
            });
            
            return {
                activeUserCarts: userCartKeys.length,
                activeGuestCarts: guestCartKeys.length,
                totalCartValue: Math.round(totalValue * 100) / 100,
                averageCartValue: cartCount > 0 ? Math.round((totalValue / cartCount) * 100) / 100 : 0
            };
        } catch (error) {
            console.error('Failed to get cart statistics from localStorage:', error);
            return {
                activeUserCarts: 0,
                activeGuestCarts: 0,
                totalCartValue: 0,
                averageCartValue: 0
            };
        }
    }

    // ===========================================
    // Error Handling & Retry Logic
    // ===========================================

    /**
     * Execute operation with retry logic
     * @param {string} operationKey - Unique key for the operation
     * @param {Function} operation - Operation to execute
     * @returns {Promise<*>} Operation result
     */
    async executeWithRetry(operationKey, operation) {
        if (!this.options.enableRetry) {
            return await operation();
        }

        const maxRetries = this.options.maxRetries;
        let lastError;

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                const result = await operation();
                
                // Reset retry count on success
                this.retryAttempts.delete(operationKey);
                return result;
            } catch (error) {
                lastError = error;
                
                // Don't retry on certain types of errors
                if (this.isNonRetryableError(error)) {
                    throw error;
                }

                // Don't retry if we've reached max attempts
                if (attempt >= maxRetries) {
                    break;
                }

                // Track retry attempts
                const currentAttempts = this.retryAttempts.get(operationKey) || 0;
                this.retryAttempts.set(operationKey, currentAttempts + 1);

                // Wait before retrying
                const delay = this.options.retryDelay * Math.pow(2, attempt); // Exponential backoff
                await this.sleep(delay);
                
                console.warn(`Retrying operation ${operationKey}, attempt ${attempt + 1}/${maxRetries}:`, error.message);
            }
        }

        // All retries failed
        this.lastError = { operationKey, error: lastError, timestamp: Date.now() };
        throw lastError;
    }

    /**
     * Check if error should not be retried
     * @param {Error} error - Error to check
     * @returns {boolean} Is non-retryable
     */
    isNonRetryableError(error) {
        // Don't retry validation errors, authentication errors, etc.
        const nonRetryableMessages = [
            'invalid',
            'unauthorized',
            'forbidden',
            'not found',
            'validation'
        ];

        const message = error.message.toLowerCase();
        return nonRetryableMessages.some(msg => message.includes(msg));
    }

    /**
     * Sleep for specified duration
     * @param {number} ms - Milliseconds to sleep
     * @returns {Promise<void>}
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
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
        this.retryAttempts.clear();
    }

    // ===========================================
    // Cleanup
    // ===========================================

    /**
     * Cleanup CartAPI resources
     */
    destroy() {
        // Unsubscribe from all subscriptions
        this.subscriptions.forEach(subscription => {
            try {
                if (subscription && subscription.unsubscribe) {
                    subscription.unsubscribe();
                }
            } catch (error) {
                console.warn('Error unsubscribing from cart changes:', error);
            }
        });
        
        this.subscriptions.clear();
        this.retryAttempts.clear();
        
        console.log('CartAPI destroyed');
    }
}