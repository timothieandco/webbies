/**
 * OrderAPI - Order management and checkout operations service
 * Handles order creation, tracking, inventory management, and checkout processing
 * 
 * Features:
 * - Order creation from cart data
 * - Inventory reservation and validation
 * - Order status management and tracking
 * - Payment processing integration
 * - Email notification triggers
 * - Order history and lookup
 * - Custom design order handling
 */

import { getAPI } from './InventoryAPI.js';
import { EVENTS } from '../config/supabase.js';

export default class OrderAPI {
    constructor(options = {}) {
        this.options = {
            enableRetry: options.enableRetry !== false,
            maxRetries: options.maxRetries || 3,
            retryDelay: options.retryDelay || 1000,
            orderNumberPrefix: options.orderNumberPrefix || 'TJC',
            defaultTaxRate: options.defaultTaxRate || 0.08,
            freeShippingThreshold: options.freeShippingThreshold || 75,
            standardShipping: options.standardShipping || 12.99,
            ...options
        };

        // API instances
        this.inventoryAPI = null;
        
        // State
        this.isInitialized = false;
        this.activeOrders = new Map(); // Track active order processing
        
        // Error tracking
        this.lastError = null;
        this.retryAttempts = new Map();
    }

    /**
     * Initialize the OrderAPI service
     */
    async initialize() {
        try {
            // Get inventory API instance
            this.inventoryAPI = getAPI();
            
            this.isInitialized = true;
            console.log('OrderAPI initialized successfully');
        } catch (error) {
            console.warn('OrderAPI initialization warning:', error);
            this.isInitialized = true;
        }
    }

    // ===========================================
    // Order Creation & Processing
    // ===========================================

    /**
     * Create order from cart data
     * @param {Object} cartData - Complete cart state
     * @param {Object} customerInfo - Customer information
     * @param {Object} shippingAddress - Shipping address
     * @param {Object} billingAddress - Billing address (optional)
     * @param {Object} paymentInfo - Payment information
     * @returns {Promise<Object>} Created order
     */
    async createOrder(cartData, customerInfo, shippingAddress, billingAddress = null, paymentInfo = {}) {
        const operationKey = `create_order_${Date.now()}`;
        
        return await this.executeWithRetry(operationKey, async () => {
            if (!this.inventoryAPI) {
                throw new Error('InventoryAPI not available for order creation');
            }

            // Validate cart before creating order
            await this.validateCartForOrder(cartData);

            // Generate order number
            const orderNumber = await this.generateOrderNumber();
            
            // Reserve inventory
            const reservationResult = await this.reserveInventoryForOrder(cartData.items);
            if (!reservationResult.success) {
                throw new Error(`Inventory reservation failed: ${reservationResult.error}`);
            }

            try {
                // Prepare order data
                const orderData = this.prepareOrderData(
                    cartData, 
                    customerInfo, 
                    shippingAddress, 
                    billingAddress, 
                    paymentInfo,
                    orderNumber
                );

                // Create order in database
                const order = await this.inventoryAPI.createOrder(orderData);

                // Create order items
                const orderItems = await this.createOrderItems(order.id, cartData.items);

                // Process payment if payment info provided
                let paymentResult = null;
                if (paymentInfo.paymentMethodId) {
                    paymentResult = await this.processPayment(order, paymentInfo);
                    
                    // Update order with payment status
                    await this.updateOrderPaymentStatus(order.id, paymentResult);
                }

                // Send order confirmation email
                await this.triggerOrderConfirmationEmail(order, orderItems);

                const completeOrder = {
                    ...order,
                    items: orderItems,
                    payment: paymentResult,
                    reservation_id: reservationResult.reservationId
                };

                console.log(`Order created successfully: ${orderNumber}`);
                this.emitOrderEvent(EVENTS.ORDER_CREATED, completeOrder);

                return completeOrder;

            } catch (error) {
                // Release inventory reservation on failure
                await this.releaseInventoryReservation(reservationResult.reservationId);
                throw error;
            }
        });
    }

    /**
     * Validate cart items for order creation
     * @param {Object} cartData - Cart data to validate
     * @returns {Promise<void>}
     */
    async validateCartForOrder(cartData) {
        if (!cartData.items || cartData.items.length === 0) {
            throw new Error('Cart is empty');
        }

        if (cartData.total <= 0) {
            throw new Error('Invalid order total');
        }

        // Validate each item
        for (const item of cartData.items) {
            if (!item.id || !item.title || item.price <= 0 || item.quantity <= 0) {
                throw new Error(`Invalid item data: ${item.title || 'Unknown item'}`);
            }

            // Validate custom designs
            if (item.is_custom_design && item.design_data) {
                await this.validateCustomDesignForOrder(item.design_data);
            }
        }

        // Final inventory check
        const inventoryValidation = await this.validateInventoryAvailability(cartData.items);
        if (!inventoryValidation.isValid) {
            throw new Error(`Inventory validation failed: ${inventoryValidation.error}`);
        }
    }

    /**
     * Validate custom design for order
     * @param {Object} designData - Design data to validate
     * @returns {Promise<void>}
     */
    async validateCustomDesignForOrder(designData) {
        if (!designData || !designData.components) {
            throw new Error('Invalid custom design data');
        }

        // Validate design components are still available
        for (const component of designData.components) {
            if (component.inventoryId) {
                const item = await this.inventoryAPI.getInventoryItem(component.inventoryId);
                if (!item || item.status !== 'active' || item.available_quantity < 1) {
                    throw new Error(`Custom design component no longer available: ${component.inventoryId}`);
                }
            }
        }
    }

    /**
     * Prepare order data for database insertion
     * @param {Object} cartData - Cart data
     * @param {Object} customerInfo - Customer information
     * @param {Object} shippingAddress - Shipping address
     * @param {Object} billingAddress - Billing address
     * @param {Object} paymentInfo - Payment information
     * @param {string} orderNumber - Generated order number
     * @returns {Object} Prepared order data
     */
    prepareOrderData(cartData, customerInfo, shippingAddress, billingAddress, paymentInfo, orderNumber) {
        return {
            order_number: orderNumber,
            user_id: customerInfo.userId || null,
            
            // Order totals
            subtotal: cartData.subtotal,
            tax_amount: cartData.tax,
            shipping_amount: cartData.shipping,
            discount_amount: cartData.discount || 0,
            total_amount: cartData.total,
            
            // Customer information
            customer_email: customerInfo.email,
            customer_name: customerInfo.fullName || customerInfo.name,
            customer_phone: customerInfo.phone || null,
            
            // Shipping address
            shipping_address_line1: shippingAddress.addressLine1,
            shipping_address_line2: shippingAddress.addressLine2 || null,
            shipping_city: shippingAddress.city,
            shipping_state: shippingAddress.state,
            shipping_postal_code: shippingAddress.postalCode,
            shipping_country: shippingAddress.country || 'US',
            
            // Billing address (use shipping if not provided)
            billing_address_line1: billingAddress?.addressLine1 || shippingAddress.addressLine1,
            billing_address_line2: billingAddress?.addressLine2 || shippingAddress.addressLine2 || null,
            billing_city: billingAddress?.city || shippingAddress.city,
            billing_state: billingAddress?.state || shippingAddress.state,
            billing_postal_code: billingAddress?.postalCode || shippingAddress.postalCode,
            billing_country: billingAddress?.country || shippingAddress.country || 'US',
            
            // Order status
            status: 'pending',
            payment_status: 'pending',
            payment_intent_id: paymentInfo.paymentIntentId || null,
            
            // Special instructions
            notes: customerInfo.notes || null,
            special_instructions: customerInfo.specialInstructions || null
        };
    }

    /**
     * Create order items from cart items
     * @param {string} orderId - Order ID
     * @param {Array} cartItems - Cart items
     * @returns {Promise<Array>} Created order items
     */
    async createOrderItems(orderId, cartItems) {
        const orderItems = [];

        for (const cartItem of cartItems) {
            const orderItemData = {
                order_id: orderId,
                design_id: cartItem.design_id || null,
                product_id: cartItem.product_id || null,
                
                item_name: cartItem.title,
                item_description: cartItem.description || null,
                quantity: cartItem.quantity,
                unit_price: cartItem.price,
                total_price: cartItem.totalPrice || (cartItem.price * cartItem.quantity),
                
                customization_data: cartItem.design_data || {},
                used_inventory_items: cartItem.is_custom_design ? 
                    this.extractInventoryIds(cartItem.design_data) : [cartItem.id],
                preview_image_url: cartItem.image_url || null,
                
                production_status: cartItem.is_custom_design ? 'pending' : 'completed'
            };

            const orderItem = await this.inventoryAPI.createOrderItem(orderItemData);
            orderItems.push(orderItem);
        }

        return orderItems;
    }

    /**
     * Extract inventory IDs from design data
     * @param {Object} designData - Design data
     * @returns {Array} Inventory IDs
     */
    extractInventoryIds(designData) {
        const inventoryIds = [];
        
        if (designData && designData.components) {
            for (const component of designData.components) {
                if (component.inventoryId) {
                    inventoryIds.push(component.inventoryId);
                }
            }
        }
        
        return inventoryIds;
    }

    // ===========================================
    // Inventory Management
    // ===========================================

    /**
     * Reserve inventory for order
     * @param {Array} cartItems - Cart items
     * @returns {Promise<Object>} Reservation result
     */
    async reserveInventoryForOrder(cartItems) {
        const reservationId = `res_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const reservedItems = [];

        try {
            for (const item of cartItems) {
                if (!item.is_custom_design) {
                    // Reserve regular inventory item
                    const reservationResult = await this.inventoryAPI.reserveInventory(
                        item.id, 
                        item.quantity,
                        reservationId
                    );
                    
                    if (!reservationResult.success) {
                        throw new Error(`Failed to reserve ${item.title}: ${reservationResult.error}`);
                    }
                    
                    reservedItems.push({
                        inventoryId: item.id,
                        quantity: item.quantity
                    });
                } else if (item.design_data && item.design_data.components) {
                    // Reserve custom design components
                    for (const component of item.design_data.components) {
                        if (component.inventoryId) {
                            const reservationResult = await this.inventoryAPI.reserveInventory(
                                component.inventoryId,
                                1, // Each component typically needs 1 unit
                                reservationId
                            );
                            
                            if (!reservationResult.success) {
                                throw new Error(`Failed to reserve design component: ${reservationResult.error}`);
                            }
                            
                            reservedItems.push({
                                inventoryId: component.inventoryId,
                                quantity: 1
                            });
                        }
                    }
                }
            }

            return {
                success: true,
                reservationId,
                reservedItems
            };

        } catch (error) {
            // Release any reservations made before the error
            await this.releaseInventoryReservation(reservationId);
            
            return {
                success: false,
                error: error.message
            };
        }
    }

    /**
     * Release inventory reservation
     * @param {string} reservationId - Reservation ID
     * @returns {Promise<boolean>} Success status
     */
    async releaseInventoryReservation(reservationId) {
        try {
            await this.inventoryAPI.releaseInventoryReservation(reservationId);
            console.log(`Released inventory reservation: ${reservationId}`);
            return true;
        } catch (error) {
            console.error(`Failed to release inventory reservation ${reservationId}:`, error);
            return false;
        }
    }

    /**
     * Validate inventory availability
     * @param {Array} cartItems - Cart items to validate
     * @returns {Promise<Object>} Validation result
     */
    async validateInventoryAvailability(cartItems) {
        try {
            for (const item of cartItems) {
                if (!item.is_custom_design) {
                    const inventoryItem = await this.inventoryAPI.getInventoryItem(item.id);
                    
                    if (!inventoryItem) {
                        return {
                            isValid: false,
                            error: `Item not found: ${item.title}`
                        };
                    }
                    
                    if (inventoryItem.available_quantity < item.quantity) {
                        return {
                            isValid: false,
                            error: `Insufficient stock for ${item.title}. Available: ${inventoryItem.available_quantity}, Required: ${item.quantity}`
                        };
                    }
                }
            }

            return { isValid: true };

        } catch (error) {
            return {
                isValid: false,
                error: error.message
            };
        }
    }

    // ===========================================
    // Payment Processing
    // ===========================================

    /**
     * Process payment for order
     * @param {Object} order - Order data
     * @param {Object} paymentInfo - Payment information
     * @returns {Promise<Object>} Payment result
     */
    async processPayment(order, paymentInfo) {
        // This is a placeholder for payment processing integration
        // In a real implementation, this would integrate with Stripe, PayPal, etc.
        
        try {
            // Simulate payment processing
            const paymentResult = {
                paymentIntentId: paymentInfo.paymentIntentId || `pi_${Date.now()}`,
                status: 'succeeded', // 'succeeded', 'failed', 'pending'
                amount: order.total_amount,
                currency: 'usd',
                paymentMethodId: paymentInfo.paymentMethodId,
                created: Date.now()
            };

            // For demo purposes, randomly simulate payment failures
            if (Math.random() < 0.05) { // 5% failure rate
                paymentResult.status = 'failed';
                paymentResult.error = 'Payment declined by card issuer';
            }

            if (paymentResult.status === 'failed') {
                throw new Error(paymentResult.error || 'Payment processing failed');
            }

            console.log(`Payment processed successfully for order ${order.order_number}`);
            return paymentResult;

        } catch (error) {
            console.error('Payment processing failed:', error);
            throw error;
        }
    }

    /**
     * Update order payment status
     * @param {string} orderId - Order ID
     * @param {Object} paymentResult - Payment result
     * @returns {Promise<void>}
     */
    async updateOrderPaymentStatus(orderId, paymentResult) {
        const updateData = {
            payment_status: paymentResult.status,
            payment_intent_id: paymentResult.paymentIntentId
        };

        if (paymentResult.status === 'succeeded') {
            updateData.status = 'processing';
        } else if (paymentResult.status === 'failed') {
            updateData.status = 'cancelled';
        }

        await this.inventoryAPI.updateOrder(orderId, updateData);
    }

    // ===========================================
    // Order Management
    // ===========================================

    /**
     * Get order by ID
     * @param {string} orderId - Order ID
     * @returns {Promise<Object>} Order data
     */
    async getOrder(orderId) {
        return await this.executeWithRetry(`get_order_${orderId}`, async () => {
            if (!this.inventoryAPI) {
                throw new Error('InventoryAPI not available');
            }

            const order = await this.inventoryAPI.getOrder(orderId);
            if (!order) {
                throw new Error('Order not found');
            }

            return order;
        });
    }

    /**
     * Get order by order number
     * @param {string} orderNumber - Order number
     * @returns {Promise<Object>} Order data
     */
    async getOrderByNumber(orderNumber) {
        return await this.executeWithRetry(`get_order_by_number_${orderNumber}`, async () => {
            if (!this.inventoryAPI) {
                throw new Error('InventoryAPI not available');
            }

            return await this.inventoryAPI.getOrderByNumber(orderNumber);
        });
    }

    /**
     * Get user orders
     * @param {string} userId - User ID
     * @param {Object} options - Query options
     * @returns {Promise<Array>} User orders
     */
    async getUserOrders(userId, options = {}) {
        return await this.executeWithRetry(`get_user_orders_${userId}`, async () => {
            if (!this.inventoryAPI) {
                throw new Error('InventoryAPI not available');
            }

            return await this.inventoryAPI.getUserOrders(userId, options);
        });
    }

    /**
     * Update order status
     * @param {string} orderId - Order ID
     * @param {string} status - New status
     * @param {Object} additionalData - Additional update data
     * @returns {Promise<Object>} Updated order
     */
    async updateOrderStatus(orderId, status, additionalData = {}) {
        return await this.executeWithRetry(`update_order_status_${orderId}`, async () => {
            const updateData = {
                status,
                ...additionalData
            };

            if (status === 'shipped') {
                updateData.shipped_at = new Date().toISOString();
            } else if (status === 'delivered') {
                updateData.delivered_at = new Date().toISOString();
            }

            const updatedOrder = await this.inventoryAPI.updateOrder(orderId, updateData);
            
            this.emitOrderEvent(EVENTS.ORDER_STATUS_UPDATED, {
                orderId,
                status,
                order: updatedOrder
            });

            return updatedOrder;
        });
    }

    // ===========================================
    // Utility Functions
    // ===========================================

    /**
     * Generate unique order number
     * @returns {Promise<string>} Order number
     */
    async generateOrderNumber() {
        const date = new Date();
        const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
        const randomStr = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        
        return `${this.options.orderNumberPrefix}-${dateStr}-${randomStr}`;
    }

    /**
     * Trigger order confirmation email
     * @param {Object} order - Order data
     * @param {Array} orderItems - Order items
     * @returns {Promise<void>}
     */
    async triggerOrderConfirmationEmail(order, orderItems) {
        try {
            // This would integrate with an email service (SendGrid, AWS SES, etc.)
            // For now, just emit an event that can be handled by the application
            
            this.emitOrderEvent(EVENTS.ORDER_CONFIRMATION_EMAIL_REQUESTED, {
                order,
                orderItems,
                customerEmail: order.customer_email
            });

            console.log(`Order confirmation email triggered for ${order.customer_email}`);
        } catch (error) {
            console.error('Failed to trigger order confirmation email:', error);
            // Don't throw - email failure shouldn't break order creation
        }
    }

    /**
     * Emit order-related events
     * @param {string} eventName - Event name
     * @param {Object} data - Event data
     */
    emitOrderEvent(eventName, data) {
        // Emit DOM event
        const event = new CustomEvent(eventName, { detail: data });
        document.dispatchEvent(event);
        
        console.log(`Order event emitted: ${eventName}`, data);
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
                const delay = this.options.retryDelay * Math.pow(2, attempt);
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
        const nonRetryableMessages = [
            'invalid',
            'unauthorized',
            'forbidden',
            'not found',
            'validation',
            'insufficient stock',
            'payment declined'
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
     * Cleanup OrderAPI resources
     */
    destroy() {
        this.activeOrders.clear();
        this.retryAttempts.clear();
        console.log('OrderAPI destroyed');
    }
}