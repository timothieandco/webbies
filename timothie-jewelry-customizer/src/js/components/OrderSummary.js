/**
 * OrderSummary - Cart review component for checkout
 * Displays cart items, totals, and allows final quantity adjustments
 * 
 * Features:
 * - Cart item display with images and details
 * - Custom design thumbnails and specifications
 * - Quantity adjustment with inventory validation
 * - Remove items functionality
 * - Price calculations and breakdown
 * - Discount code application
 * - Shipping calculator
 * - Mobile-responsive design
 */

import { EVENTS } from '../config/supabase.js';

export default class OrderSummary {
    constructor(containerId, options = {}) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        
        if (!this.container) {
            throw new Error(`Container element not found: ${containerId}`);
        }

        this.options = {
            allowQuantityAdjustment: options.allowQuantityAdjustment !== false,
            allowItemRemoval: options.allowItemRemoval !== false,
            showDiscountCode: options.showDiscountCode !== false,
            showShippingCalculator: options.showShippingCalculator !== false,
            currencySymbol: options.currencySymbol || '$',
            ...options
        };

        // State
        this.cartData = null;
        this.isUpdating = false;
        this.appliedDiscounts = [];
        
        // Callbacks
        this.onCartUpdate = options.onCartUpdate || (() => {});
        this.onItemRemove = options.onItemRemove || (() => {});
        this.onQuantityChange = options.onQuantityChange || (() => {});
        this.onDiscountApply = options.onDiscountApply || (() => {});

        this.initialize();
    }

    /**
     * Initialize the component
     */
    initialize() {
        this.render();
        this.attachEventListeners();
        console.log('OrderSummary component initialized');
    }

    /**
     * Update cart data and re-render
     * @param {Object} cartData - Updated cart data
     */
    updateCart(cartData) {
        this.cartData = cartData;
        this.render();
    }

    /**
     * Render the order summary
     */
    render() {
        if (!this.cartData || !this.cartData.items || this.cartData.items.length === 0) {
            this.renderEmptyCart();
            return;
        }

        const html = `
            <div class="order-summary">
                <div class="order-summary-header">
                    <h3>Order Review</h3>
                    <span class="item-count">${this.cartData.itemCount} ${this.cartData.itemCount === 1 ? 'item' : 'items'}</span>
                </div>
                
                <div class="order-items">
                    ${this.renderOrderItems()}
                </div>
                
                ${this.options.showDiscountCode ? this.renderDiscountSection() : ''}
                
                <div class="order-totals">
                    ${this.renderTotals()}
                </div>
                
                ${this.options.showShippingCalculator ? this.renderShippingInfo() : ''}
                
                <div class="order-actions">
                    ${this.renderOrderActions()}
                </div>
            </div>
        `;

        this.container.innerHTML = html;
        this.attachItemEventListeners();
    }

    /**
     * Render empty cart state
     */
    renderEmptyCart() {
        const html = `
            <div class="order-summary order-summary--empty">
                <div class="empty-cart">
                    <div class="empty-cart-icon">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                            <circle cx="9" cy="21" r="1"></circle>
                            <circle cx="20" cy="21" r="1"></circle>
                            <path d="m1 1 4 4 5.05 5.05a1 1 0 0 0 .7.29H20a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1H9l-1-1"></path>
                            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path>
                        </svg>
                    </div>
                    <h3>Your cart is empty</h3>
                    <p>Add some items to your cart to continue with checkout.</p>
                    <a href="/browse.html" class="btn btn-primary">Continue Shopping</a>
                </div>
            </div>
        `;

        this.container.innerHTML = html;
    }

    /**
     * Render order items
     * @returns {string} HTML for order items
     */
    renderOrderItems() {
        return this.cartData.items.map(item => this.renderOrderItem(item)).join('');
    }

    /**
     * Render individual order item
     * @param {Object} item - Cart item
     * @returns {string} HTML for order item
     */
    renderOrderItem(item) {
        const isCustomDesign = item.is_custom_design;
        const totalPrice = this.formatCurrency(item.totalPrice || (item.price * item.quantity));
        const unitPrice = this.formatCurrency(item.price);

        return `
            <div class="order-item" data-cart-item-id="${item.cartItemId}">
                <div class="order-item-image">
                    <img src="${item.image_url || '/images/placeholder.png'}" 
                         alt="${item.title}"
                         loading="lazy">
                    ${isCustomDesign ? '<div class="custom-design-badge">Custom</div>' : ''}
                </div>
                
                <div class="order-item-details">
                    <div class="order-item-info">
                        <h4 class="order-item-title">${item.title}</h4>
                        ${item.description ? `<p class="order-item-description">${item.description}</p>` : ''}
                        
                        ${isCustomDesign ? this.renderCustomDesignDetails(item) : ''}
                        
                        <div class="order-item-price">
                            <span class="unit-price">${unitPrice} each</span>
                            ${item.quantity > 1 ? `<span class="total-price">${totalPrice} total</span>` : ''}
                        </div>
                    </div>
                    
                    <div class="order-item-controls">
                        ${this.renderQuantityControls(item)}
                        ${this.options.allowItemRemoval ? this.renderRemoveButton(item) : ''}
                    </div>
                </div>
                
                <div class="order-item-total">
                    <span class="price">${totalPrice}</span>
                </div>
            </div>
        `;
    }

    /**
     * Render custom design details
     * @param {Object} item - Custom design item
     * @returns {string} HTML for custom design details
     */
    renderCustomDesignDetails(item) {
        if (!item.design_data || !item.design_data.components) {
            return '';
        }

        const componentCount = item.design_data.components.length;
        const estimatedTime = item.estimated_completion || '2-3 weeks';

        return `
            <div class="custom-design-details">
                <div class="design-specs">
                    <span class="component-count">${componentCount} components</span>
                    <span class="estimated-time">Est. ${estimatedTime}</span>
                </div>
                
                <div class="design-components">
                    ${item.design_data.components.slice(0, 3).map(component => `
                        <div class="design-component">
                            <img src="${component.image || '/images/placeholder.png'}" 
                                 alt="Component" class="component-thumb">
                        </div>
                    `).join('')}
                    ${item.design_data.components.length > 3 ? 
                        `<div class="more-components">+${item.design_data.components.length - 3}</div>` : ''}
                </div>
            </div>
        `;
    }

    /**
     * Render quantity controls
     * @param {Object} item - Cart item
     * @returns {string} HTML for quantity controls
     */
    renderQuantityControls(item) {
        if (!this.options.allowQuantityAdjustment) {
            return `<span class="quantity-display">Qty: ${item.quantity}</span>`;
        }

        return `
            <div class="quantity-controls">
                <label for="qty-${item.cartItemId}" class="sr-only">Quantity for ${item.title}</label>
                <button type="button" 
                        class="quantity-btn quantity-decrease" 
                        data-cart-item-id="${item.cartItemId}"
                        ${item.quantity <= 1 ? 'disabled' : ''}
                        aria-label="Decrease quantity">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                </button>
                
                <input type="number" 
                       id="qty-${item.cartItemId}"
                       class="quantity-input" 
                       value="${item.quantity}" 
                       min="1" 
                       max="10"
                       data-cart-item-id="${item.cartItemId}">
                
                <button type="button" 
                        class="quantity-btn quantity-increase" 
                        data-cart-item-id="${item.cartItemId}"
                        ${item.quantity >= 10 ? 'disabled' : ''}
                        aria-label="Increase quantity">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <line x1="12" y1="5" x2="12" y2="19"></line>
                        <line x1="5" y1="12" x2="19" y2="12"></line>
                    </svg>
                </button>
            </div>
        `;
    }

    /**
     * Render remove button
     * @param {Object} item - Cart item
     * @returns {string} HTML for remove button
     */
    renderRemoveButton(item) {
        return `
            <button type="button" 
                    class="remove-item-btn" 
                    data-cart-item-id="${item.cartItemId}"
                    aria-label="Remove ${item.title} from cart">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3,6 5,6 21,6"></polyline>
                    <path d="M19,6V20a2,2 0 0,1 -2,2H7a2,2 0 0,1 -2,-2V6M8,6V4a2,2 0 0,1 2,-2h4a2,2 0 0,1 2,2V6"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
                Remove
            </button>
        `;
    }

    /**
     * Render discount section
     * @returns {string} HTML for discount section
     */
    renderDiscountSection() {
        return `
            <div class="discount-section">
                <div class="discount-input-group">
                    <input type="text" 
                           id="discount-code" 
                           class="discount-input" 
                           placeholder="Enter discount code"
                           maxlength="20">
                    <button type="button" class="discount-apply-btn">Apply</button>
                </div>
                
                ${this.appliedDiscounts.length > 0 ? `
                    <div class="applied-discounts">
                        ${this.appliedDiscounts.map(discount => `
                            <div class="applied-discount">
                                <span class="discount-code">${discount.code}</span>
                                <span class="discount-amount">-${this.formatCurrency(discount.amount)}</span>
                                <button type="button" 
                                        class="remove-discount-btn" 
                                        data-discount-code="${discount.code}"
                                        aria-label="Remove discount ${discount.code}">×</button>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Render order totals
     * @returns {string} HTML for order totals
     */
    renderTotals() {
        const subtotal = this.formatCurrency(this.cartData.subtotal);
        const tax = this.formatCurrency(this.cartData.tax);
        const shipping = this.formatCurrency(this.cartData.shipping);
        const discount = this.formatCurrency(this.cartData.discount || 0);
        const total = this.formatCurrency(this.cartData.total);

        return `
            <div class="totals-breakdown">
                <div class="total-line">
                    <span class="total-label">Subtotal</span>
                    <span class="total-value">${subtotal}</span>
                </div>
                
                ${this.cartData.shipping > 0 ? `
                    <div class="total-line">
                        <span class="total-label">Shipping</span>
                        <span class="total-value">${shipping}</span>
                    </div>
                ` : `
                    <div class="total-line total-line--free">
                        <span class="total-label">Shipping</span>
                        <span class="total-value">Free</span>
                    </div>
                `}
                
                <div class="total-line">
                    <span class="total-label">Tax</span>
                    <span class="total-value">${tax}</span>
                </div>
                
                ${this.cartData.discount > 0 ? `
                    <div class="total-line total-line--discount">
                        <span class="total-label">Discount</span>
                        <span class="total-value">-${discount}</span>
                    </div>
                ` : ''}
                
                <div class="total-line total-line--final">
                    <span class="total-label">Total</span>
                    <span class="total-value">${total}</span>
                </div>
            </div>
        `;
    }

    /**
     * Render shipping information
     * @returns {string} HTML for shipping info
     */
    renderShippingInfo() {
        const freeShippingThreshold = 75;
        const remaining = freeShippingThreshold - this.cartData.subtotal;

        return `
            <div class="shipping-info">
                ${this.cartData.shipping === 0 ? `
                    <div class="shipping-message shipping-message--success">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="20,6 9,17 4,12"></polyline>
                        </svg>
                        You qualify for free shipping!
                    </div>
                ` : remaining > 0 ? `
                    <div class="shipping-message">
                        Add ${this.formatCurrency(remaining)} more for free shipping
                    </div>
                ` : ''}
                
                <div class="shipping-options">
                    <div class="shipping-option">
                        <span class="shipping-method">Standard Shipping</span>
                        <span class="shipping-time">5-7 business days</span>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render order actions
     * @returns {string} HTML for order actions
     */
    renderOrderActions() {
        return `
            <div class="order-actions-content">
                <button type="button" class="btn btn-secondary continue-shopping-btn">
                    Continue Shopping
                </button>
            </div>
        `;
    }

    /**
     * Attach event listeners
     */
    attachEventListeners() {
        // Global event listeners that don't depend on rendered content
        document.addEventListener('cartUpdated', (event) => {
            this.updateCart(event.detail);
        });
    }

    /**
     * Attach event listeners for item interactions
     */
    attachItemEventListeners() {
        // Quantity controls
        this.container.querySelectorAll('.quantity-btn').forEach(btn => {
            btn.addEventListener('click', this.handleQuantityButtonClick.bind(this));
        });

        this.container.querySelectorAll('.quantity-input').forEach(input => {
            input.addEventListener('change', this.handleQuantityInputChange.bind(this));
            input.addEventListener('blur', this.handleQuantityInputChange.bind(this));
        });

        // Remove item buttons
        this.container.querySelectorAll('.remove-item-btn').forEach(btn => {
            btn.addEventListener('click', this.handleRemoveItemClick.bind(this));
        });

        // Discount code
        const discountApplyBtn = this.container.querySelector('.discount-apply-btn');
        if (discountApplyBtn) {
            discountApplyBtn.addEventListener('click', this.handleDiscountApply.bind(this));
        }

        const discountInput = this.container.querySelector('.discount-input');
        if (discountInput) {
            discountInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleDiscountApply();
                }
            });
        }

        // Remove discount buttons
        this.container.querySelectorAll('.remove-discount-btn').forEach(btn => {
            btn.addEventListener('click', this.handleRemoveDiscountClick.bind(this));
        });

        // Continue shopping
        const continueShoppingBtn = this.container.querySelector('.continue-shopping-btn');
        if (continueShoppingBtn) {
            continueShoppingBtn.addEventListener('click', () => {
                window.location.href = '/browse.html';
            });
        }
    }

    /**
     * Handle quantity button clicks
     * @param {Event} event - Click event
     */
    async handleQuantityButtonClick(event) {
        if (this.isUpdating) return;

        const btn = event.currentTarget;
        const cartItemId = btn.dataset.cartItemId;
        const isIncrease = btn.classList.contains('quantity-increase');
        
        const input = this.container.querySelector(`input[data-cart-item-id="${cartItemId}"]`);
        if (!input) return;

        const currentQuantity = parseInt(input.value);
        const newQuantity = isIncrease ? currentQuantity + 1 : currentQuantity - 1;

        if (newQuantity < 1 || newQuantity > 10) return;

        await this.updateItemQuantity(cartItemId, newQuantity);
    }

    /**
     * Handle quantity input changes
     * @param {Event} event - Change event
     */
    async handleQuantityInputChange(event) {
        if (this.isUpdating) return;

        const input = event.target;
        const cartItemId = input.dataset.cartItemId;
        const newQuantity = parseInt(input.value);

        if (isNaN(newQuantity) || newQuantity < 1 || newQuantity > 10) {
            // Reset to previous valid value
            const item = this.cartData.items.find(item => item.cartItemId === cartItemId);
            input.value = item ? item.quantity : 1;
            return;
        }

        await this.updateItemQuantity(cartItemId, newQuantity);
    }

    /**
     * Update item quantity
     * @param {string} cartItemId - Cart item ID
     * @param {number} newQuantity - New quantity
     */
    async updateItemQuantity(cartItemId, newQuantity) {
        this.isUpdating = true;

        try {
            this.showLoadingState(cartItemId);
            
            await this.onQuantityChange(cartItemId, newQuantity);
            
            // UI will be updated via cart update event
        } catch (error) {
            console.error('Failed to update quantity:', error);
            this.showError('Failed to update quantity. Please try again.');
            
            // Reset input to previous value
            const item = this.cartData.items.find(item => item.cartItemId === cartItemId);
            const input = this.container.querySelector(`input[data-cart-item-id="${cartItemId}"]`);
            if (input && item) {
                input.value = item.quantity;
            }
        } finally {
            this.hideLoadingState(cartItemId);
            this.isUpdating = false;
        }
    }

    /**
     * Handle remove item clicks
     * @param {Event} event - Click event
     */
    async handleRemoveItemClick(event) {
        if (this.isUpdating) return;

        const btn = event.currentTarget;
        const cartItemId = btn.dataset.cartItemId;
        
        // Find item for confirmation
        const item = this.cartData.items.find(item => item.cartItemId === cartItemId);
        if (!item) return;

        // Show confirmation
        if (!confirm(`Remove "${item.title}" from your cart?`)) {
            return;
        }

        this.isUpdating = true;

        try {
            this.showLoadingState(cartItemId);
            
            await this.onItemRemove(cartItemId);
            
            // UI will be updated via cart update event
        } catch (error) {
            console.error('Failed to remove item:', error);
            this.showError('Failed to remove item. Please try again.');
        } finally {
            this.hideLoadingState(cartItemId);
            this.isUpdating = false;
        }
    }

    /**
     * Handle discount code application
     */
    async handleDiscountApply() {
        const discountInput = this.container.querySelector('.discount-input');
        if (!discountInput) return;

        const code = discountInput.value.trim().toUpperCase();
        if (!code) return;

        try {
            discountInput.disabled = true;
            
            const result = await this.onDiscountApply(code);
            
            if (result.success) {
                this.appliedDiscounts.push({
                    code: code,
                    amount: result.amount
                });
                
                discountInput.value = '';
                this.render(); // Re-render to show applied discount
            } else {
                this.showError(result.error || 'Invalid discount code');
            }
        } catch (error) {
            console.error('Failed to apply discount:', error);
            this.showError('Failed to apply discount. Please try again.');
        } finally {
            discountInput.disabled = false;
        }
    }

    /**
     * Handle remove discount clicks
     * @param {Event} event - Click event
     */
    handleRemoveDiscountClick(event) {
        const btn = event.currentTarget;
        const discountCode = btn.dataset.discountCode;
        
        this.appliedDiscounts = this.appliedDiscounts.filter(discount => 
            discount.code !== discountCode
        );
        
        this.render();
        
        // Notify parent component
        this.onDiscountApply(null, discountCode); // null amount means removal
    }

    /**
     * Show loading state for item
     * @param {string} cartItemId - Cart item ID
     */
    showLoadingState(cartItemId) {
        const itemElement = this.container.querySelector(`[data-cart-item-id="${cartItemId}"]`);
        if (itemElement) {
            itemElement.classList.add('updating');
        }
    }

    /**
     * Hide loading state for item
     * @param {string} cartItemId - Cart item ID
     */
    hideLoadingState(cartItemId) {
        const itemElement = this.container.querySelector(`[data-cart-item-id="${cartItemId}"]`);
        if (itemElement) {
            itemElement.classList.remove('updating');
        }
    }

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        // Create or update error display
        let errorElement = this.container.querySelector('.order-summary-error');
        
        if (!errorElement) {
            errorElement = document.createElement('div');
            errorElement.className = 'order-summary-error';
            this.container.insertBefore(errorElement, this.container.firstChild);
        }
        
        errorElement.innerHTML = `
            <div class="error-message">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="15" y1="9" x2="9" y2="15"></line>
                    <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
                ${message}
                <button type="button" class="error-close" aria-label="Close error">×</button>
            </div>
        `;
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (errorElement.parentNode) {
                errorElement.remove();
            }
        }, 5000);
        
        // Close button handler
        errorElement.querySelector('.error-close').addEventListener('click', () => {
            errorElement.remove();
        });
    }

    /**
     * Format currency value
     * @param {number} amount - Amount to format
     * @returns {string} Formatted currency
     */
    formatCurrency(amount) {
        if (typeof amount !== 'number') {
            amount = parseFloat(amount) || 0;
        }
        
        return `${this.options.currencySymbol}${amount.toFixed(2)}`;
    }

    /**
     * Get current cart data
     * @returns {Object} Current cart data
     */
    getCartData() {
        return this.cartData;
    }

    /**
     * Check if cart is valid for checkout
     * @returns {boolean} Is valid
     */
    isValidForCheckout() {
        return this.cartData && 
               this.cartData.items && 
               this.cartData.items.length > 0 && 
               this.cartData.total > 0;
    }

    /**
     * Destroy the component
     */
    destroy() {
        if (this.container) {
            this.container.innerHTML = '';
        }
        console.log('OrderSummary component destroyed');
    }
}