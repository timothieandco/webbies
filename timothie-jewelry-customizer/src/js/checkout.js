/**
 * Checkout Page Controller
 * Orchestrates the checkout process with cart integration, form handling, and order creation
 * 
 * Features:
 * - Cart validation and loading
 * - Multi-step checkout form management
 * - Order summary display and updates
 * - Payment processing integration
 * - Order creation and confirmation
 * - Error handling and user feedback
 * - Mobile-responsive interactions
 */

import CartManager from './core/CartManager.js';
import OrderAPI from './services/OrderAPI.js';
import CheckoutForm from './components/CheckoutForm.js';
import OrderSummary from './components/OrderSummary.js';
import { EVENTS } from './config/supabase.js';

class CheckoutController {
    constructor() {
        // Core services
        this.cartManager = null;
        this.orderAPI = null;
        
        // Components
        this.checkoutForm = null;
        this.orderSummary = null;
        
        // State
        this.isInitialized = false;
        this.isProcessingOrder = false;
        this.currentCartData = null;
        
        // UI elements
        this.loadingElement = document.getElementById('checkout-loading');
        this.errorElement = document.getElementById('checkout-error');
        this.emptyCartElement = document.getElementById('empty-cart');
        this.formContainer = document.getElementById('checkout-form-container');
        this.summaryContainer = document.getElementById('order-summary-container');
        
        this.initialize();
    }

    /**
     * Initialize the checkout controller
     */
    async initialize() {
        try {
            console.log('Initializing checkout controller...');
            
            this.showLoading();
            
            // Initialize services
            await this.initializeServices();
            
            // Load and validate cart
            await this.loadCart();
            
            // Initialize components if cart is valid
            if (this.isCartValid()) {
                await this.initializeComponents();
                this.setupEventListeners();
                this.showCheckout();
            } else {
                this.showEmptyCart();
            }
            
            this.isInitialized = true;
            console.log('Checkout controller initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize checkout:', error);
            this.showError('Failed to load checkout. Please try again.', error);
        }
    }

    /**
     * Initialize core services
     */
    async initializeServices() {
        try {
            // Initialize cart manager
            this.cartManager = new CartManager({
                enablePersistence: true,
                enableRealTimeSync: true,
                autoSave: true
            });
            
            // Initialize order API
            this.orderAPI = new OrderAPI({
                enableRetry: true,
                maxRetries: 3
            });
            
            await this.orderAPI.initialize();
            
            console.log('Checkout services initialized');
        } catch (error) {
            console.error('Failed to initialize checkout services:', error);
            throw error;
        }
    }

    /**
     * Load cart data
     */
    async loadCart() {
        try {
            // Get current cart state
            this.currentCartData = this.cartManager.getCartState();
            
            // Validate inventory for all items
            const validationResult = await this.cartManager.validateInventory();
            
            if (!validationResult.isValid) {
                console.warn('Cart validation issues found:', validationResult);
                
                // Handle validation issues
                await this.handleCartValidationIssues(validationResult);
                
                // Refresh cart data after handling issues
                this.currentCartData = this.cartManager.getCartState();
            }
            
            console.log('Cart loaded and validated:', this.currentCartData);
        } catch (error) {
            console.error('Failed to load cart:', error);
            throw error;
        }
    }

    /**
     * Handle cart validation issues
     * @param {Object} validationResult - Validation result from cart manager
     */
    async handleCartValidationIssues(validationResult) {
        const { invalidItems, quantityIssues, priceChanges } = validationResult;
        
        // Remove invalid items
        for (const issue of invalidItems) {
            console.log('Removing invalid item:', issue.cartItem.title);
            await this.cartManager.removeItem(issue.cartItem.cartItemId);
        }
        
        // Adjust quantities for items with insufficient stock
        for (const issue of quantityIssues) {
            console.log('Adjusting quantity for:', issue.cartItem.title, 'to', issue.available);
            if (issue.available > 0) {
                await this.cartManager.updateItemQuantity(issue.cartItem.cartItemId, issue.available);
            } else {
                await this.cartManager.removeItem(issue.cartItem.cartItemId);
            }
        }
        
        // Update prices for items with price changes
        for (const issue of priceChanges) {
            console.log('Price updated for:', issue.cartItem.title, 'from', issue.oldPrice, 'to', issue.newPrice);
            // Price updates are handled automatically by the cart manager
        }
        
        // Show notification to user if there were issues
        if (invalidItems.length > 0 || quantityIssues.length > 0 || priceChanges.length > 0) {
            this.showCartUpdateNotification(validationResult);
        }
    }

    /**
     * Show cart update notification
     * @param {Object} validationResult - Validation result
     */
    showCartUpdateNotification(validationResult) {
        const { invalidItems, quantityIssues, priceChanges } = validationResult;
        
        let message = 'Your cart has been updated:\n';
        
        if (invalidItems.length > 0) {
            message += `• ${invalidItems.length} item(s) removed (no longer available)\n`;
        }
        
        if (quantityIssues.length > 0) {
            message += `• ${quantityIssues.length} item(s) quantity adjusted (limited stock)\n`;
        }
        
        if (priceChanges.length > 0) {
            message += `• ${priceChanges.length} item(s) price updated\n`;
        }
        
        // This would ideally be a nicer notification system
        alert(message);
    }

    /**
     * Initialize checkout components
     */
    async initializeComponents() {
        try {
            // Initialize order summary
            this.orderSummary = new OrderSummary('order-summary-container', {
                allowQuantityAdjustment: true,
                allowItemRemoval: true,
                showDiscountCode: true,
                showShippingCalculator: true,
                onQuantityChange: this.handleQuantityChange.bind(this),
                onItemRemove: this.handleItemRemove.bind(this),
                onDiscountApply: this.handleDiscountApply.bind(this)
            });
            
            // Update order summary with current cart
            this.orderSummary.updateCart(this.currentCartData);
            
            // Initialize checkout form
            this.checkoutForm = new CheckoutForm('checkout-form-container', {
                allowGuestCheckout: true,
                requirePhoneNumber: false,
                enableSavedAddresses: false,
                enableStripe: false, // Set to true when Stripe is configured
                onStepChange: this.handleStepChange.bind(this),
                onFormSubmit: this.handleFormSubmit.bind(this),
                onFormValidation: this.handleFormValidation.bind(this)
            });
            
            console.log('Checkout components initialized');
        } catch (error) {
            console.error('Failed to initialize checkout components:', error);
            throw error;
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Cart update events
        document.addEventListener(EVENTS.CART_UPDATED, this.handleCartUpdate.bind(this));
        document.addEventListener(EVENTS.CART_ITEM_ADDED, this.handleCartUpdate.bind(this));
        document.addEventListener(EVENTS.CART_ITEM_REMOVED, this.handleCartUpdate.bind(this));
        document.addEventListener(EVENTS.CART_ITEM_UPDATED, this.handleCartUpdate.bind(this));
        
        // Error retry button
        const retryButton = document.getElementById('retry-checkout');
        if (retryButton) {
            retryButton.addEventListener('click', () => {
                location.reload();
            });
        }
        
        // Page visibility change handling
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.isInitialized) {
                this.refreshCartData();
            }
        });
        
        // Browser back/forward handling
        window.addEventListener('beforeunload', (event) => {
            if (this.isProcessingOrder) {
                event.preventDefault();
                event.returnValue = 'Your order is being processed. Are you sure you want to leave?';
            }
        });
        
        console.log('Event listeners setup complete');
    }

    // ===========================================
    // Cart Event Handlers
    // ===========================================

    /**
     * Handle cart updates
     * @param {Event} event - Cart update event
     */
    handleCartUpdate(event) {
        console.log('Cart updated:', event.detail);
        
        this.currentCartData = event.detail;
        
        // Update order summary
        if (this.orderSummary) {
            this.orderSummary.updateCart(this.currentCartData);
        }
        
        // Check if cart is still valid
        if (!this.isCartValid()) {
            this.showEmptyCart();
        }
    }

    /**
     * Handle quantity changes from order summary
     * @param {string} cartItemId - Cart item ID
     * @param {number} newQuantity - New quantity
     */
    async handleQuantityChange(cartItemId, newQuantity) {
        try {
            await this.cartManager.updateItemQuantity(cartItemId, newQuantity);
        } catch (error) {
            console.error('Failed to update quantity:', error);
            throw error;
        }
    }

    /**
     * Handle item removal from order summary
     * @param {string} cartItemId - Cart item ID
     */
    async handleItemRemove(cartItemId) {
        try {
            await this.cartManager.removeItem(cartItemId);
        } catch (error) {
            console.error('Failed to remove item:', error);
            throw error;
        }
    }

    /**
     * Handle discount code application
     * @param {string} code - Discount code
     * @param {string} removeCode - Code to remove (if removing)
     * @returns {Promise<Object>} Result
     */
    async handleDiscountApply(code, removeCode = null) {
        try {
            if (removeCode) {
                // Handle discount removal
                console.log('Removing discount:', removeCode);
                // This would integrate with a discount service
                return { success: true };
            } else {
                // Handle discount application
                console.log('Applying discount:', code);
                
                // Placeholder discount validation
                const discountResult = await this.validateDiscountCode(code);
                
                if (discountResult.valid) {
                    // Apply discount to cart
                    // This would integrate with the CartManager discount system
                    return {
                        success: true,
                        amount: discountResult.amount
                    };
                } else {
                    return {
                        success: false,
                        error: 'Invalid discount code'
                    };
                }
            }
        } catch (error) {
            console.error('Failed to handle discount:', error);
            return {
                success: false,
                error: 'Failed to apply discount. Please try again.'
            };
        }
    }

    /**
     * Validate discount code (placeholder)
     * @param {string} code - Discount code
     * @returns {Promise<Object>} Validation result
     */
    async validateDiscountCode(code) {
        // Placeholder implementation
        const validCodes = {
            'SAVE10': { valid: true, amount: 10, type: 'percentage' },
            'WELCOME5': { valid: true, amount: 5, type: 'fixed' },
            'FREESHIP': { valid: true, amount: 0, type: 'free_shipping' }
        };
        
        return validCodes[code.toUpperCase()] || { valid: false };
    }

    // ===========================================
    // Form Event Handlers
    // ===========================================

    /**
     * Handle checkout form step changes
     * @param {number} stepIndex - Current step index
     * @param {Object} stepInfo - Step information
     */
    handleStepChange(stepIndex, stepInfo) {
        console.log('Checkout step changed:', stepIndex, stepInfo);
        
        // Update page title to reflect current step
        document.title = `${stepInfo.title} - Checkout - Timothie & Co`;
        
        // Track analytics event
        this.trackCheckoutStep(stepIndex, stepInfo);
    }

    /**
     * Handle form validation
     * @param {Object} validationResult - Validation result
     */
    handleFormValidation(validationResult) {
        console.log('Form validation result:', validationResult);
        
        // Could update UI based on validation state
        // For example, enable/disable continue button
    }

    /**
     * Handle form submission
     * @param {Object} formData - Form data
     */
    async handleFormSubmit(formData) {
        if (this.isProcessingOrder) {
            console.warn('Order already being processed');
            return;
        }
        
        this.isProcessingOrder = true;
        
        try {
            console.log('Processing order with data:', formData);
            
            // Final cart validation
            await this.performFinalCartValidation();
            
            // Create order
            const order = await this.createOrder(formData);
            
            // Clear cart
            await this.cartManager.clearCart();
            
            // Redirect to confirmation page
            this.redirectToConfirmation(order);
            
        } catch (error) {
            console.error('Order submission failed:', error);
            this.handleOrderError(error);
        } finally {
            this.isProcessingOrder = false;
        }
    }

    /**
     * Perform final cart validation before order creation
     */
    async performFinalCartValidation() {
        console.log('Performing final cart validation...');
        
        const validationResult = await this.cartManager.validateInventory();
        
        if (!validationResult.isValid) {
            throw new Error('Cart validation failed. Some items may no longer be available.');
        }
        
        // Check cart totals
        const cartData = this.cartManager.getCartState();
        if (cartData.total <= 0) {
            throw new Error('Invalid order total');
        }
        
        console.log('Final cart validation passed');
    }

    /**
     * Create order
     * @param {Object} formData - Form data
     * @returns {Promise<Object>} Created order
     */
    async createOrder(formData) {
        console.log('Creating order...');
        
        const cartData = this.cartManager.getCartState();
        
        // Prepare payment info (placeholder for Stripe integration)
        const paymentInfo = {
            paymentMethodId: 'pm_placeholder',
            ...formData.payment
        };
        
        // Create order using OrderAPI
        const order = await this.orderAPI.createOrder(
            cartData,
            formData.customer,
            formData.shipping,
            formData.billing,
            paymentInfo
        );
        
        console.log('Order created successfully:', order);
        
        // Track order completion
        this.trackOrderCompletion(order);
        
        return order;
    }

    /**
     * Handle order creation errors
     * @param {Error} error - Error object
     */
    handleOrderError(error) {
        console.error('Order error:', error);
        
        let userMessage = 'There was a problem processing your order. Please try again.';
        
        // Customize message based on error type
        if (error.message.includes('inventory')) {
            userMessage = 'Some items in your cart are no longer available. Please review your cart and try again.';
        } else if (error.message.includes('payment')) {
            userMessage = 'There was a problem processing your payment. Please check your payment information and try again.';
        } else if (error.message.includes('validation')) {
            userMessage = 'Please check your information and try again.';
        }
        
        // Show error to user
        alert(userMessage); // This would be replaced with a better notification system
        
        // Refresh cart to ensure it's up to date
        this.refreshCartData();
    }

    /**
     * Redirect to confirmation page
     * @param {Object} order - Created order
     */
    redirectToConfirmation(order) {
        console.log('Redirecting to confirmation page...');
        
        // Store order info in session storage for confirmation page
        sessionStorage.setItem('orderConfirmation', JSON.stringify({
            orderNumber: order.order_number,
            orderId: order.id,
            timestamp: Date.now()
        }));
        
        // Redirect
        window.location.href = '/order-confirmation.html';
    }

    // ===========================================
    // UI State Management
    // ===========================================

    /**
     * Show loading state
     */
    showLoading() {
        this.hideAllStates();
        this.loadingElement.setAttribute('aria-hidden', 'false');
    }

    /**
     * Show error state
     * @param {string} message - Error message
     * @param {Error} error - Error object
     */
    showError(message, error = null) {
        console.error('Showing error state:', message, error);
        
        this.hideAllStates();
        
        const errorMessageElement = document.getElementById('checkout-error-message');
        if (errorMessageElement) {
            errorMessageElement.textContent = message;
        }
        
        this.errorElement.setAttribute('aria-hidden', 'false');
    }

    /**
     * Show empty cart state
     */
    showEmptyCart() {
        console.log('Showing empty cart state');
        
        this.hideAllStates();
        this.emptyCartElement.setAttribute('aria-hidden', 'false');
    }

    /**
     * Show checkout interface
     */
    showCheckout() {
        console.log('Showing checkout interface');
        
        this.hideAllStates();
        this.formContainer.setAttribute('aria-hidden', 'false');
    }

    /**
     * Hide all UI states
     */
    hideAllStates() {
        this.loadingElement.setAttribute('aria-hidden', 'true');
        this.errorElement.setAttribute('aria-hidden', 'true');
        this.emptyCartElement.setAttribute('aria-hidden', 'true');
        this.formContainer.setAttribute('aria-hidden', 'true');
    }

    // ===========================================
    // Utility Methods
    // ===========================================

    /**
     * Check if cart is valid for checkout
     * @returns {boolean} Is valid
     */
    isCartValid() {
        return this.currentCartData && 
               this.currentCartData.items && 
               this.currentCartData.items.length > 0 && 
               this.currentCartData.total > 0;
    }

    /**
     * Refresh cart data
     */
    async refreshCartData() {
        try {
            await this.loadCart();
            
            if (this.orderSummary) {
                this.orderSummary.updateCart(this.currentCartData);
            }
            
            if (!this.isCartValid()) {
                this.showEmptyCart();
            }
        } catch (error) {
            console.error('Failed to refresh cart data:', error);
        }
    }

    // ===========================================
    // Analytics & Tracking
    // ===========================================

    /**
     * Track checkout step
     * @param {number} stepIndex - Step index
     * @param {Object} stepInfo - Step information
     */
    trackCheckoutStep(stepIndex, stepInfo) {
        // Placeholder for analytics tracking
        console.log('Track checkout step:', stepIndex, stepInfo.title);
        
        // Would integrate with Google Analytics, Mixpanel, etc.
        if (typeof gtag !== 'undefined') {
            gtag('event', 'checkout_progress', {
                checkout_step: stepIndex + 1,
                checkout_option: stepInfo.title
            });
        }
    }

    /**
     * Track order completion
     * @param {Object} order - Completed order
     */
    trackOrderCompletion(order) {
        console.log('Track order completion:', order.order_number);
        
        // Enhanced ecommerce tracking
        if (typeof gtag !== 'undefined') {
            gtag('event', 'purchase', {
                transaction_id: order.order_number,
                value: order.total_amount,
                currency: 'USD',
                items: order.items.map(item => ({
                    item_id: item.id,
                    item_name: item.item_name,
                    category: item.category || 'jewelry',
                    quantity: item.quantity,
                    price: item.unit_price
                }))
            });
        }
    }

    // ===========================================
    // Cleanup
    // ===========================================

    /**
     * Destroy the checkout controller
     */
    destroy() {
        // Cleanup components
        if (this.checkoutForm) {
            this.checkoutForm.destroy();
        }
        
        if (this.orderSummary) {
            this.orderSummary.destroy();
        }
        
        // Cleanup services
        if (this.cartManager) {
            this.cartManager.destroy();
        }
        
        if (this.orderAPI) {
            this.orderAPI.destroy();
        }
        
        console.log('Checkout controller destroyed');
    }
}

// Initialize checkout when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing checkout page...');
    
    // Create global checkout controller instance
    window.checkoutController = new CheckoutController();
    
    // Handle page unload
    window.addEventListener('beforeunload', () => {
        if (window.checkoutController) {
            window.checkoutController.destroy();
        }
    });
});

// Export for module usage
export default CheckoutController;