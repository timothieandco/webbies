/**
 * Order Confirmation Page Controller
 * Handles order confirmation display, tracking, and post-purchase actions
 * 
 * Features:
 * - Order details display from URL parameters or session storage
 * - Order tracking and status updates
 * - Receipt printing functionality
 * - Social sharing integration
 * - Customer service contact helpers
 * - Analytics tracking for order completion
 */

import OrderAPI from './services/OrderAPI.js';
import { EVENTS } from './config/supabase.js';

class OrderConfirmationController {
    constructor() {
        // Services
        this.orderAPI = null;
        
        // State
        this.orderData = null;
        this.orderNumber = null;
        this.isInitialized = false;
        
        // UI elements
        this.loadingElement = document.getElementById('confirmation-loading');
        this.errorElement = document.getElementById('confirmation-error');
        this.contentElement = document.getElementById('confirmation-content');
        
        this.initialize();
    }

    /**
     * Initialize the order confirmation controller
     */
    async initialize() {
        try {
            console.log('Initializing order confirmation controller...');
            
            this.showLoading();
            
            // Initialize services
            await this.initializeServices();
            
            // Get order information
            this.orderNumber = this.getOrderNumber();
            
            if (!this.orderNumber) {
                throw new Error('No order number found');
            }
            
            // Load order data
            await this.loadOrderData();
            
            // Display order confirmation
            this.displayOrderConfirmation();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Track page view
            this.trackOrderConfirmationView();
            
            this.showContent();
            this.isInitialized = true;
            
            console.log('Order confirmation controller initialized successfully');
            
        } catch (error) {
            console.error('Failed to initialize order confirmation:', error);
            this.showError('Unable to load order details. Please contact support if this issue persists.');
        }
    }

    /**
     * Initialize services
     */
    async initializeServices() {
        try {
            this.orderAPI = new OrderAPI({
                enableRetry: true,
                maxRetries: 3
            });
            
            await this.orderAPI.initialize();
            
            console.log('Order confirmation services initialized');
        } catch (error) {
            console.error('Failed to initialize services:', error);
            throw error;
        }
    }

    /**
     * Get order number from URL parameters or session storage
     * @returns {string|null} Order number
     */
    getOrderNumber() {
        // Try URL parameters first
        const urlParams = new URLSearchParams(window.location.search);
        let orderNumber = urlParams.get('order') || urlParams.get('orderNumber');
        
        if (orderNumber) {
            console.log('Order number from URL:', orderNumber);
            return orderNumber;
        }
        
        // Try session storage
        try {
            const orderConfirmation = sessionStorage.getItem('orderConfirmation');
            if (orderConfirmation) {
                const data = JSON.parse(orderConfirmation);
                orderNumber = data.orderNumber;
                console.log('Order number from session storage:', orderNumber);
                return orderNumber;
            }
        } catch (error) {
            console.warn('Failed to parse order confirmation from session storage:', error);
        }
        
        console.warn('No order number found');
        return null;
    }

    /**
     * Load order data from API
     */
    async loadOrderData() {
        try {
            console.log('Loading order data for:', this.orderNumber);
            
            this.orderData = await this.orderAPI.getOrderByNumber(this.orderNumber);
            
            if (!this.orderData) {
                throw new Error('Order not found');
            }
            
            console.log('Order data loaded:', this.orderData);
        } catch (error) {
            console.error('Failed to load order data:', error);
            throw error;
        }
    }

    /**
     * Display order confirmation details
     */
    displayOrderConfirmation() {
        console.log('Displaying order confirmation');
        
        // Update page title
        document.title = `Order ${this.orderData.order_number} Confirmed - Timothie & Co`;
        
        // Display order number and date
        this.displayOrderHeader();
        
        // Display order items
        this.displayOrderItems();
        
        // Display addresses and payment info
        this.displayOrderInfo();
        
        // Display timeline
        this.displayTimeline();
        
        console.log('Order confirmation displayed');
    }

    /**
     * Display order header information
     */
    displayOrderHeader() {
        const orderNumberElement = document.getElementById('order-number-display');
        const orderDateElement = document.getElementById('order-date-display');
        const orderStatusElement = document.getElementById('order-status-display');
        const customerEmailElement = document.getElementById('customer-email-display');
        
        if (orderNumberElement) {
            orderNumberElement.textContent = this.orderData.order_number;
        }
        
        if (orderDateElement) {
            const orderDate = new Date(this.orderData.created_at);
            orderDateElement.textContent = orderDate.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }
        
        if (orderStatusElement) {
            orderStatusElement.textContent = this.formatOrderStatus(this.orderData.status);
            orderStatusElement.className = `status-badge status-badge--${this.orderData.status}`;
        }
        
        if (customerEmailElement) {
            customerEmailElement.textContent = this.orderData.customer_email;
        }
    }

    /**
     * Display order items
     */
    displayOrderItems() {
        const container = document.getElementById('order-items-container');
        
        if (!container || !this.orderData.items) {
            return;
        }
        
        const itemsHtml = this.orderData.items.map(item => this.renderOrderItem(item)).join('');
        container.innerHTML = itemsHtml;
    }

    /**
     * Render individual order item
     * @param {Object} item - Order item
     * @returns {string} HTML for order item
     */
    renderOrderItem(item) {
        const isCustomDesign = item.customization_data && Object.keys(item.customization_data).length > 0;
        const totalPrice = this.formatCurrency(item.total_price);
        const unitPrice = this.formatCurrency(item.unit_price);

        return `
            <div class="order-item">
                <div class="order-item-image">
                    <img src="${item.preview_image_url || '/images/placeholder.png'}" 
                         alt="${item.item_name}"
                         loading="lazy">
                    ${isCustomDesign ? '<div class="custom-design-badge">Custom</div>' : ''}
                </div>
                
                <div class="order-item-details">
                    <h4 class="order-item-title">${item.item_name}</h4>
                    ${item.item_description ? `<p class="order-item-description">${item.item_description}</p>` : ''}
                    
                    ${isCustomDesign ? this.renderCustomDesignInfo(item.customization_data) : ''}
                    
                    <div class="order-item-meta">
                        <span class="quantity">Quantity: ${item.quantity}</span>
                        <span class="unit-price">${unitPrice} each</span>
                    </div>
                    
                    ${item.production_status ? `
                        <div class="production-status">
                            <span class="status-label">Status:</span>
                            <span class="status-value status-${item.production_status}">${this.formatProductionStatus(item.production_status)}</span>
                        </div>
                    ` : ''}
                </div>
                
                <div class="order-item-total">
                    <span class="price">${totalPrice}</span>
                </div>
            </div>
        `;
    }

    /**
     * Render custom design information
     * @param {Object} customizationData - Customization data
     * @returns {string} HTML for custom design info
     */
    renderCustomDesignInfo(customizationData) {
        if (!customizationData || !customizationData.components) {
            return '';
        }

        const componentCount = customizationData.components.length;
        
        return `
            <div class="custom-design-info">
                <span class="design-type">Custom Design</span>
                <span class="component-count">${componentCount} components</span>
                <span class="production-time">2-3 weeks production time</span>
            </div>
        `;
    }

    /**
     * Display order information (addresses, payment, totals)
     */
    displayOrderInfo() {
        this.displayShippingAddress();
        this.displayBillingAddress();
        this.displayPaymentMethod();
        this.displayOrderTotals();
    }

    /**
     * Display shipping address
     */
    displayShippingAddress() {
        const container = document.getElementById('shipping-address-display');
        
        if (!container) return;
        
        const address = `
            <div class="address">
                <p>${this.orderData.customer_name}</p>
                <p>${this.orderData.shipping_address_line1}</p>
                ${this.orderData.shipping_address_line2 ? `<p>${this.orderData.shipping_address_line2}</p>` : ''}
                <p>${this.orderData.shipping_city}, ${this.orderData.shipping_state} ${this.orderData.shipping_postal_code}</p>
                <p>${this.orderData.shipping_country}</p>
            </div>
        `;
        
        container.innerHTML = address;
    }

    /**
     * Display billing address
     */
    displayBillingAddress() {
        const container = document.getElementById('billing-address-display');
        
        if (!container) return;
        
        // Check if billing is same as shipping
        const isSameAsShipping = 
            this.orderData.billing_address_line1 === this.orderData.shipping_address_line1 &&
            this.orderData.billing_city === this.orderData.shipping_city;
        
        if (isSameAsShipping) {
            container.innerHTML = '<p class="same-as-shipping">Same as shipping address</p>';
        } else {
            const address = `
                <div class="address">
                    <p>${this.orderData.customer_name}</p>
                    <p>${this.orderData.billing_address_line1}</p>
                    ${this.orderData.billing_address_line2 ? `<p>${this.orderData.billing_address_line2}</p>` : ''}
                    <p>${this.orderData.billing_city}, ${this.orderData.billing_state} ${this.orderData.billing_postal_code}</p>
                    <p>${this.orderData.billing_country}</p>
                </div>
            `;
            container.innerHTML = address;
        }
    }

    /**
     * Display payment method
     */
    displayPaymentMethod() {
        const container = document.getElementById('payment-method-display');
        
        if (!container) return;
        
        // This would be enhanced with actual payment method details
        const paymentInfo = `
            <div class="payment-info">
                <p><strong>Payment Method:</strong> Credit Card</p>
                <p><strong>Status:</strong> ${this.formatPaymentStatus(this.orderData.payment_status)}</p>
                ${this.orderData.payment_intent_id ? `<p><strong>Transaction ID:</strong> ${this.orderData.payment_intent_id}</p>` : ''}
            </div>
        `;
        
        container.innerHTML = paymentInfo;
    }

    /**
     * Display order totals
     */
    displayOrderTotals() {
        const container = document.getElementById('order-totals-display');
        
        if (!container) return;
        
        const totals = `
            <div class="totals-breakdown">
                <div class="total-line">
                    <span>Subtotal:</span>
                    <span>${this.formatCurrency(this.orderData.subtotal)}</span>
                </div>
                
                ${this.orderData.shipping_amount > 0 ? `
                    <div class="total-line">
                        <span>Shipping:</span>
                        <span>${this.formatCurrency(this.orderData.shipping_amount)}</span>
                    </div>
                ` : `
                    <div class="total-line">
                        <span>Shipping:</span>
                        <span>Free</span>
                    </div>
                `}
                
                <div class="total-line">
                    <span>Tax:</span>
                    <span>${this.formatCurrency(this.orderData.tax_amount)}</span>
                </div>
                
                ${this.orderData.discount_amount > 0 ? `
                    <div class="total-line">
                        <span>Discount:</span>
                        <span>-${this.formatCurrency(this.orderData.discount_amount)}</span>
                    </div>
                ` : ''}
                
                <div class="total-line total-line--final">
                    <span><strong>Total:</strong></span>
                    <span><strong>${this.formatCurrency(this.orderData.total_amount)}</strong></span>
                </div>
            </div>
        `;
        
        container.innerHTML = totals;
    }

    /**
     * Display order timeline
     */
    displayTimeline() {
        const hasCustomItems = this.orderData.items?.some(item => 
            item.customization_data && Object.keys(item.customization_data).length > 0
        );
        
        // Update timeline based on order contents
        if (hasCustomItems) {
            this.updateTimelineForCustomOrder();
        } else {
            this.updateTimelineForStandardOrder();
        }
    }

    /**
     * Update timeline for custom orders
     */
    updateTimelineForCustomOrder() {
        const productionStep = document.getElementById('production-step');
        const productionDescription = document.getElementById('production-description');
        const productionTime = document.getElementById('production-time');
        const shippingTime = document.getElementById('shipping-time');
        const deliveryTime = document.getElementById('delivery-time');
        
        if (productionDescription) {
            productionDescription.textContent = 'Your custom pieces are being handcrafted by our artisans';
        }
        
        if (productionTime) {
            productionTime.textContent = '2-3 weeks';
        }
        
        if (shippingTime) {
            shippingTime.textContent = '3-5 business days after production';
        }
        
        if (deliveryTime) {
            deliveryTime.textContent = '3-4 weeks total';
        }
    }

    /**
     * Update timeline for standard orders
     */
    updateTimelineForStandardOrder() {
        const productionDescription = document.getElementById('production-description');
        const productionTime = document.getElementById('production-time');
        
        if (productionDescription) {
            productionDescription.textContent = 'Your order is being prepared for shipment';
        }
        
        if (productionTime) {
            productionTime.textContent = '1-2 business days';
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Print receipt button
        const printButton = document.getElementById('print-receipt');
        if (printButton) {
            printButton.addEventListener('click', this.printReceipt.bind(this));
        }
        
        // Track order button
        const trackButton = document.getElementById('track-order');
        if (trackButton) {
            trackButton.addEventListener('click', this.trackOrder.bind(this));
        }
        
        // Social sharing buttons
        const socialButtons = document.querySelectorAll('.social-btn');
        socialButtons.forEach(button => {
            button.addEventListener('click', this.handleSocialShare.bind(this));
        });
        
        console.log('Order confirmation event listeners setup');
    }

    /**
     * Print receipt
     */
    printReceipt() {
        console.log('Printing receipt...');
        
        // Create a print-friendly version
        const printWindow = window.open('', '_blank');
        const printContent = this.generatePrintableReceipt();
        
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.print();
        printWindow.close();
        
        // Track print action
        this.trackAction('print_receipt');
    }

    /**
     * Generate printable receipt HTML
     * @returns {string} HTML for printable receipt
     */
    generatePrintableReceipt() {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Receipt - ${this.orderData.order_number}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    .receipt-header { text-align: center; margin-bottom: 30px; }
                    .receipt-section { margin-bottom: 20px; }
                    .receipt-section h3 { border-bottom: 1px solid #ccc; padding-bottom: 5px; }
                    .order-items { width: 100%; border-collapse: collapse; }
                    .order-items th, .order-items td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
                    .totals { margin-top: 20px; }
                    .total-final { font-weight: bold; border-top: 2px solid #000; }
                    @media print { body { margin: 0; } }
                </style>
            </head>
            <body>
                <div class="receipt-header">
                    <h1>Timothie & Co</h1>
                    <h2>Order Receipt</h2>
                    <p>Order #${this.orderData.order_number}</p>
                    <p>Date: ${new Date(this.orderData.created_at).toLocaleDateString()}</p>
                </div>
                
                <div class="receipt-section">
                    <h3>Items Ordered</h3>
                    <table class="order-items">
                        <thead>
                            <tr>
                                <th>Item</th>
                                <th>Quantity</th>
                                <th>Unit Price</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${this.orderData.items.map(item => `
                                <tr>
                                    <td>${item.item_name}</td>
                                    <td>${item.quantity}</td>
                                    <td>${this.formatCurrency(item.unit_price)}</td>
                                    <td>${this.formatCurrency(item.total_price)}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                
                <div class="receipt-section totals">
                    <div>Subtotal: ${this.formatCurrency(this.orderData.subtotal)}</div>
                    <div>Shipping: ${this.formatCurrency(this.orderData.shipping_amount)}</div>
                    <div>Tax: ${this.formatCurrency(this.orderData.tax_amount)}</div>
                    <div class="total-final">Total: ${this.formatCurrency(this.orderData.total_amount)}</div>
                </div>
                
                <div class="receipt-section">
                    <h3>Shipping Address</h3>
                    <p>${this.orderData.customer_name}<br>
                    ${this.orderData.shipping_address_line1}<br>
                    ${this.orderData.shipping_address_line2 ? this.orderData.shipping_address_line2 + '<br>' : ''}
                    ${this.orderData.shipping_city}, ${this.orderData.shipping_state} ${this.orderData.shipping_postal_code}</p>
                </div>
                
                <div class="receipt-section">
                    <p><strong>Customer Service:</strong> support@timothieandco.com | (555) 123-4567</p>
                </div>
            </body>
            </html>
        `;
    }

    /**
     * Track order
     */
    trackOrder() {
        console.log('Opening order tracking...');
        
        // This would open a tracking page or modal
        // For now, just show an alert with tracking info
        const message = this.orderData.tracking_number 
            ? `Your tracking number is: ${this.orderData.tracking_number}`
            : 'Tracking information will be available once your order ships.';
        
        alert(message);
        
        // Track action
        this.trackAction('track_order');
    }

    /**
     * Handle social sharing
     * @param {Event} event - Click event
     */
    handleSocialShare(event) {
        const platform = event.currentTarget.dataset.platform;
        const shareText = `I just ordered beautiful jewelry from Timothie & Co! ✨`;
        const shareUrl = window.location.origin;
        
        let shareLink = '';
        
        switch (platform) {
            case 'facebook':
                shareLink = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`;
                break;
            case 'twitter':
                shareLink = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
                break;
            case 'instagram':
                // Instagram doesn't support direct sharing, so copy text to clipboard
                this.copyToClipboard(shareText);
                alert('Share text copied to clipboard! Paste it in your Instagram post.');
                return;
        }
        
        if (shareLink) {
            window.open(shareLink, '_blank', 'width=600,height=400');
        }
        
        // Track share action
        this.trackAction('social_share', { platform });
    }

    /**
     * Copy text to clipboard
     * @param {string} text - Text to copy
     */
    copyToClipboard(text) {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text);
        } else {
            // Fallback for older browsers
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
        }
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
     */
    showError(message) {
        console.error('Showing error state:', message);
        
        this.hideAllStates();
        
        const errorMessageElement = document.getElementById('confirmation-error-message');
        if (errorMessageElement) {
            errorMessageElement.textContent = message;
        }
        
        this.errorElement.setAttribute('aria-hidden', 'false');
    }

    /**
     * Show content
     */
    showContent() {
        this.hideAllStates();
        this.contentElement.setAttribute('aria-hidden', 'false');
    }

    /**
     * Hide all UI states
     */
    hideAllStates() {
        this.loadingElement.setAttribute('aria-hidden', 'true');
        this.errorElement.setAttribute('aria-hidden', 'true');
        this.contentElement.setAttribute('aria-hidden', 'true');
    }

    // ===========================================
    // Utility Methods
    // ===========================================

    /**
     * Format currency value
     * @param {number} amount - Amount to format
     * @returns {string} Formatted currency
     */
    formatCurrency(amount) {
        if (typeof amount !== 'number') {
            amount = parseFloat(amount) || 0;
        }
        
        return `$${amount.toFixed(2)}`;
    }

    /**
     * Format order status
     * @param {string} status - Order status
     * @returns {string} Formatted status
     */
    formatOrderStatus(status) {
        const statusMap = {
            'pending': 'Processing',
            'processing': 'Processing',
            'shipped': 'Shipped',
            'delivered': 'Delivered',
            'cancelled': 'Cancelled'
        };
        
        return statusMap[status] || status;
    }

    /**
     * Format payment status
     * @param {string} status - Payment status
     * @returns {string} Formatted status
     */
    formatPaymentStatus(status) {
        const statusMap = {
            'pending': 'Processing',
            'paid': 'Paid',
            'failed': 'Failed',
            'refunded': 'Refunded'
        };
        
        return statusMap[status] || status;
    }

    /**
     * Format production status
     * @param {string} status - Production status
     * @returns {string} Formatted status
     */
    formatProductionStatus(status) {
        const statusMap = {
            'pending': 'Pending',
            'in_production': 'In Production',
            'completed': 'Completed'
        };
        
        return statusMap[status] || status;
    }

    // ===========================================
    // Analytics & Tracking
    // ===========================================

    /**
     * Track order confirmation page view
     */
    trackOrderConfirmationView() {
        console.log('Tracking order confirmation view');
        
        if (typeof gtag !== 'undefined' && this.orderData) {
            gtag('event', 'page_view', {
                page_title: 'Order Confirmation',
                page_location: window.location.href,
                custom_parameters: {
                    order_number: this.orderData.order_number,
                    order_value: this.orderData.total_amount
                }
            });
        }
    }

    /**
     * Track user actions
     * @param {string} action - Action name
     * @param {Object} parameters - Additional parameters
     */
    trackAction(action, parameters = {}) {
        console.log('Tracking action:', action, parameters);
        
        if (typeof gtag !== 'undefined') {
            gtag('event', action, {
                order_number: this.orderData?.order_number,
                ...parameters
            });
        }
    }

    // ===========================================
    // Cleanup
    // ===========================================

    /**
     * Destroy the controller
     */
    destroy() {
        if (this.orderAPI) {
            this.orderAPI.destroy();
        }
        
        console.log('Order confirmation controller destroyed');
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing order confirmation page...');
    
    // Create global controller instance
    window.orderConfirmationController = new OrderConfirmationController();
    
    // Handle page unload
    window.addEventListener('beforeunload', () => {
        if (window.orderConfirmationController) {
            window.orderConfirmationController.destroy();
        }
    });
});

// Export for module usage
export default OrderConfirmationController;