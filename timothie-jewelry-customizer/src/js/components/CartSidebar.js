/**
 * CartSidebar - Interactive cart UI component for the jewelry customizer
 * Displays cart contents, allows quantity editing, shows totals, and handles cart operations
 * 
 * Features:
 * - Interactive cart item display with thumbnails
 * - Quantity editing with validation
 * - Real-time total calculations
 * - Remove item functionality
 * - Responsive design with mobile support
 * - Custom design item highlighting
 * - Empty cart state handling
 * - Loading states for operations
 * - Error handling and user feedback
 * - Integration with CartManager events
 */

import { EVENTS } from '../config/events.js';
import { CSS_CLASSES } from '../config/supabase.js';

export default class CartSidebar {
    constructor(containerId, cartManager, options = {}) {
        // Validate required parameters
        if (!containerId || !cartManager) {
            throw new Error('CartSidebar requires containerId and cartManager');
        }

        this.container = document.getElementById(containerId);
        if (!this.container) {
            throw new Error(`Container with id "${containerId}" not found`);
        }

        this.cartManager = cartManager;

        // Configuration options
        this.options = {
            position: options.position || 'right', // 'left' or 'right'
            showTotals: options.showTotals !== false,
            enableQuantityEdit: options.enableQuantityEdit !== false,
            enableRemove: options.enableRemove !== false,
            showThumbnails: options.showThumbnails !== false,
            animateUpdates: options.animateUpdates !== false,
            closeOnCheckout: options.closeOnCheckout !== false,
            maxHeight: options.maxHeight || '80vh',
            width: options.width || '400px',
            ...options
        };

        // State
        this.isVisible = false;
        this.isLoading = false;
        this.cartItems = [];
        this.cartSummary = {};

        // Event subscriptions
        this.subscriptions = [];

        // DOM elements
        this.sidebar = null;
        this.overlay = null;
        this.itemsContainer = null;
        this.totalsContainer = null;
        this.checkoutButton = null;

        // Initialize the component
        this.init();
    }

    /**
     * Initialize the cart sidebar
     */
    init() {
        try {
            this.createSidebarStructure();
            this.setupEventListeners();
            this.subscribeToCartEvents();
            this.updateCartDisplay();
            
            console.log('CartSidebar initialized successfully');
        } catch (error) {
            console.error('Failed to initialize CartSidebar:', error);
            throw error;
        }
    }

    /**
     * Create the sidebar DOM structure
     */
    createSidebarStructure() {
        // Create overlay
        this.overlay = document.createElement('div');
        this.overlay.className = 'cart-sidebar-overlay';
        this.overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            z-index: 1000;
            opacity: 0;
            visibility: hidden;
            transition: opacity 0.3s ease, visibility 0.3s ease;
        `;

        // Create sidebar
        this.sidebar = document.createElement('div');
        this.sidebar.className = 'cart-sidebar';
        this.sidebar.style.cssText = `
            position: fixed;
            top: 0;
            ${this.options.position}: 0;
            width: ${this.options.width};
            height: 100%;
            background: #ffffff;
            box-shadow: ${this.options.position === 'right' ? '-2px' : '2px'} 0 10px rgba(0, 0, 0, 0.1);
            z-index: 1001;
            transform: translateX(${this.options.position === 'right' ? '100%' : '-100%'});
            transition: transform 0.3s ease;
            display: flex;
            flex-direction: column;
            max-width: 90vw;
        `;

        // Create header
        const header = document.createElement('div');
        header.className = 'cart-sidebar-header';
        header.style.cssText = `
            padding: 20px;
            border-bottom: 1px solid #e0e0e0;
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: #f8f9fa;
        `;

        const title = document.createElement('h3');
        title.textContent = 'Shopping Cart';
        title.style.cssText = `
            margin: 0;
            font-size: 18px;
            font-weight: 600;
            color: #333;
        `;

        const closeButton = document.createElement('button');
        closeButton.className = 'cart-sidebar-close';
        closeButton.innerHTML = '×';
        closeButton.style.cssText = `
            background: none;
            border: none;
            font-size: 24px;
            cursor: pointer;
            padding: 0;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
            transition: background-color 0.2s ease;
        `;
        closeButton.addEventListener('click', () => this.hide());
        closeButton.addEventListener('mouseenter', () => {
            closeButton.style.backgroundColor = '#f0f0f0';
        });
        closeButton.addEventListener('mouseleave', () => {
            closeButton.style.backgroundColor = 'transparent';
        });

        header.appendChild(title);
        header.appendChild(closeButton);

        // Create content area
        const content = document.createElement('div');
        content.className = 'cart-sidebar-content';
        content.style.cssText = `
            flex: 1;
            overflow-y: auto;
            padding: 0;
            max-height: ${this.options.maxHeight};
        `;

        // Create items container
        this.itemsContainer = document.createElement('div');
        this.itemsContainer.className = 'cart-items-container';
        this.itemsContainer.style.cssText = `
            padding: 20px;
            min-height: 200px;
        `;

        // Create totals container
        this.totalsContainer = document.createElement('div');
        this.totalsContainer.className = 'cart-totals-container';
        this.totalsContainer.style.cssText = `
            padding: 20px;
            border-top: 1px solid #e0e0e0;
            background: #f8f9fa;
        `;

        // Create footer with checkout button
        const footer = document.createElement('div');
        footer.className = 'cart-sidebar-footer';
        footer.style.cssText = `
            padding: 20px;
            border-top: 1px solid #e0e0e0;
            background: #ffffff;
        `;

        this.checkoutButton = document.createElement('button');
        this.checkoutButton.className = 'cart-checkout-button';
        this.checkoutButton.textContent = 'Proceed to Checkout';
        this.checkoutButton.style.cssText = `
            width: 100%;
            padding: 16px;
            background: #007bff;
            color: white;
            border: none;
            border-radius: 6px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            transition: background-color 0.2s ease;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        `;
        this.checkoutButton.addEventListener('click', () => this.handleCheckout());
        this.checkoutButton.addEventListener('mouseenter', () => {
            this.checkoutButton.style.backgroundColor = '#0056b3';
        });
        this.checkoutButton.addEventListener('mouseleave', () => {
            this.checkoutButton.style.backgroundColor = '#007bff';
        });

        footer.appendChild(this.checkoutButton);

        // Assemble content
        content.appendChild(this.itemsContainer);
        if (this.options.showTotals) {
            content.appendChild(this.totalsContainer);
        }

        // Assemble sidebar
        this.sidebar.appendChild(header);
        this.sidebar.appendChild(content);
        this.sidebar.appendChild(footer);

        // Add to container
        this.container.appendChild(this.overlay);
        this.container.appendChild(this.sidebar);

        // Add responsive styles
        this.addResponsiveStyles();
    }

    /**
     * Add responsive CSS styles
     */
    addResponsiveStyles() {
        if (!document.getElementById('cart-sidebar-styles')) {
            const styles = document.createElement('style');
            styles.id = 'cart-sidebar-styles';
            styles.textContent = `
                @media (max-width: 768px) {
                    .cart-sidebar {
                        width: 100% !important;
                        max-width: 100% !important;
                    }
                }

                .cart-item {
                    transition: transform 0.2s ease, box-shadow 0.2s ease;
                }

                .cart-item:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                }

                .cart-item-custom {
                    position: relative;
                }

                .cart-item-custom::before {
                    content: "CUSTOM";
                    position: absolute;
                    top: 8px;
                    right: 8px;
                    background: #ff6b35;
                    color: white;
                    padding: 2px 8px;
                    border-radius: 12px;
                    font-size: 10px;
                    font-weight: bold;
                    text-transform: uppercase;
                }

                .cart-sidebar-loading {
                    pointer-events: none;
                    opacity: 0.7;
                }

                .quantity-input:focus {
                    outline: none;
                    border-color: #007bff;
                    box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
                }

                .remove-button:hover {
                    background-color: #dc3545 !important;
                    color: white !important;
                }

                @keyframes slideInRight {
                    from { opacity: 0; transform: translateX(20px); }
                    to { opacity: 1; transform: translateX(0); }
                }

                @keyframes slideInLeft {
                    from { opacity: 0; transform: translateX(-20px); }
                    to { opacity: 1; transform: translateX(0); }
                }

                .cart-item-enter {
                    animation: ${this.options.position === 'right' ? 'slideInRight' : 'slideInLeft'} 0.3s ease;
                }
            `;
            document.head.appendChild(styles);
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Close sidebar when clicking overlay
        this.overlay.addEventListener('click', () => this.hide());

        // Prevent sidebar from closing when clicking inside
        this.sidebar.addEventListener('click', (e) => e.stopPropagation());

        // Handle escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isVisible) {
                this.hide();
            }
        });
    }

    /**
     * Subscribe to cart manager events
     */
    subscribeToCartEvents() {
        // Subscribe to cart updates
        this.subscriptions.push(
            this.cartManager.subscribe(EVENTS.CART_UPDATED, () => {
                this.updateCartDisplay();
            })
        );

        this.subscriptions.push(
            this.cartManager.subscribe(EVENTS.CART_ITEM_ADDED, () => {
                this.updateCartDisplay();
                if (this.options.animateUpdates) {
                    this.animateNewItem();
                }
            })
        );

        this.subscriptions.push(
            this.cartManager.subscribe(EVENTS.CART_ITEM_REMOVED, () => {
                this.updateCartDisplay();
            })
        );

        this.subscriptions.push(
            this.cartManager.subscribe(EVENTS.CART_ITEM_UPDATED, () => {
                this.updateCartDisplay();
            })
        );

        this.subscriptions.push(
            this.cartManager.subscribe(EVENTS.CART_CLEARED, () => {
                this.updateCartDisplay();
            })
        );
    }

    /**
     * Update cart display
     */
    async updateCartDisplay() {
        try {
            this.setLoading(true);

            // Get current cart data
            this.cartItems = this.cartManager.getItems();
            this.cartSummary = this.cartManager.getCartSummary();

            // Update items display
            this.renderCartItems();

            // Update totals
            if (this.options.showTotals) {
                this.renderTotals();
            }

            // Update checkout button state
            this.updateCheckoutButton();

        } catch (error) {
            console.error('Error updating cart display:', error);
        } finally {
            this.setLoading(false);
        }
    }

    /**
     * Render cart items
     */
    renderCartItems() {
        this.itemsContainer.innerHTML = '';

        if (this.cartItems.length === 0) {
            this.renderEmptyState();
            return;
        }

        this.cartItems.forEach((item, index) => {
            const itemElement = this.createCartItemElement(item, index);
            this.itemsContainer.appendChild(itemElement);
        });
    }

    /**
     * Render empty cart state
     */
    renderEmptyState() {
        const emptyState = document.createElement('div');
        emptyState.className = 'cart-empty-state';
        emptyState.style.cssText = `
            text-align: center;
            padding: 40px 20px;
            color: #666;
        `;

        emptyState.innerHTML = `
            <div style="font-size: 48px; margin-bottom: 16px; opacity: 0.5;">🛒</div>
            <h4 style="margin: 0 0 8px 0; color: #333;">Your cart is empty</h4>
            <p style="margin: 0; font-size: 14px;">Add some beautiful jewelry to get started!</p>
        `;

        this.itemsContainer.appendChild(emptyState);
    }

    /**
     * Create cart item element
     * @param {Object} item - Cart item
     * @param {number} index - Item index
     * @returns {HTMLElement} Item element
     */
    createCartItemElement(item, index) {
        const itemElement = document.createElement('div');
        itemElement.className = `cart-item ${item.is_custom_design ? 'cart-item-custom' : ''}`;
        itemElement.style.cssText = `
            display: flex;
            gap: 12px;
            padding: 16px;
            border: 1px solid #e0e0e0;
            border-radius: 8px;
            margin-bottom: 12px;
            background: white;
            position: relative;
        `;

        // Add animation class for new items
        if (this.options.animateUpdates) {
            itemElement.classList.add('cart-item-enter');
        }

        // Create thumbnail
        const thumbnail = this.createItemThumbnail(item);
        
        // Create details section
        const details = this.createItemDetails(item);
        
        // Create actions section
        const actions = this.createItemActions(item);

        itemElement.appendChild(thumbnail);
        itemElement.appendChild(details);
        itemElement.appendChild(actions);

        return itemElement;
    }

    /**
     * Create item thumbnail
     * @param {Object} item - Cart item
     * @returns {HTMLElement} Thumbnail element
     */
    createItemThumbnail(item) {
        const thumbnail = document.createElement('div');
        thumbnail.className = 'cart-item-thumbnail';
        thumbnail.style.cssText = `
            width: 60px;
            height: 60px;
            border-radius: 6px;
            overflow: hidden;
            background: #f0f0f0;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
        `;

        if (this.options.showThumbnails && item.image_url) {
            const img = document.createElement('img');
            img.src = item.image_url;
            img.alt = item.title;
            img.style.cssText = `
                width: 100%;
                height: 100%;
                object-fit: cover;
            `;
            img.onerror = () => {
                img.style.display = 'none';
                thumbnail.innerHTML = '📿'; // Fallback emoji
                thumbnail.style.fontSize = '24px';
            };
            thumbnail.appendChild(img);
        } else {
            thumbnail.innerHTML = item.is_custom_design ? '✨' : '📿';
            thumbnail.style.fontSize = '24px';
        }

        return thumbnail;
    }

    /**
     * Create item details section
     * @param {Object} item - Cart item
     * @returns {HTMLElement} Details element
     */
    createItemDetails(item) {
        const details = document.createElement('div');
        details.className = 'cart-item-details';
        details.style.cssText = `
            flex: 1;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            min-width: 0;
        `;

        const title = document.createElement('h4');
        title.textContent = item.title;
        title.style.cssText = `
            margin: 0 0 4px 0;
            font-size: 14px;
            font-weight: 600;
            color: #333;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        `;

        const description = document.createElement('p');
        description.textContent = item.description || '';
        description.style.cssText = `
            margin: 0 0 8px 0;
            font-size: 12px;
            color: #666;
            line-height: 1.3;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        `;

        const priceInfo = document.createElement('div');
        priceInfo.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 14px;
        `;

        const price = document.createElement('span');
        price.textContent = `$${item.price.toFixed(2)}`;
        price.style.cssText = `
            font-weight: 600;
            color: #007bff;
        `;

        const totalPrice = document.createElement('span');
        totalPrice.textContent = `Total: $${item.totalPrice.toFixed(2)}`;
        totalPrice.style.cssText = `
            font-weight: 600;
            color: #333;
        `;

        priceInfo.appendChild(price);
        priceInfo.appendChild(totalPrice);

        details.appendChild(title);
        if (item.description) {
            details.appendChild(description);
        }
        details.appendChild(priceInfo);

        return details;
    }

    /**
     * Create item actions section
     * @param {Object} item - Cart item
     * @returns {HTMLElement} Actions element
     */
    createItemActions(item) {
        const actions = document.createElement('div');
        actions.className = 'cart-item-actions';
        actions.style.cssText = `
            display: flex;
            flex-direction: column;
            gap: 8px;
            align-items: flex-end;
            min-width: 60px;
        `;

        // Quantity controls
        if (this.options.enableQuantityEdit) {
            const quantityControls = this.createQuantityControls(item);
            actions.appendChild(quantityControls);
        }

        // Remove button
        if (this.options.enableRemove) {
            const removeButton = this.createRemoveButton(item);
            actions.appendChild(removeButton);
        }

        return actions;
    }

    /**
     * Create quantity controls
     * @param {Object} item - Cart item
     * @returns {HTMLElement} Quantity controls element
     */
    createQuantityControls(item) {
        const controls = document.createElement('div');
        controls.className = 'quantity-controls';
        controls.style.cssText = `
            display: flex;
            align-items: center;
            gap: 4px;
            border: 1px solid #e0e0e0;
            border-radius: 4px;
            background: white;
        `;

        const decreaseButton = document.createElement('button');
        decreaseButton.textContent = '-';
        decreaseButton.style.cssText = `
            width: 24px;
            height: 24px;
            border: none;
            background: none;
            cursor: pointer;
            font-size: 16px;
            font-weight: bold;
            color: #666;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        decreaseButton.addEventListener('click', () => this.decreaseQuantity(item));

        const quantityInput = document.createElement('input');
        quantityInput.type = 'number';
        quantityInput.min = '1';
        quantityInput.max = '10';
        quantityInput.value = item.quantity;
        quantityInput.className = 'quantity-input';
        quantityInput.style.cssText = `
            width: 40px;
            height: 24px;
            border: none;
            text-align: center;
            font-size: 12px;
            background: none;
        `;
        quantityInput.addEventListener('change', (e) => this.updateQuantity(item, parseInt(e.target.value)));

        const increaseButton = document.createElement('button');
        increaseButton.textContent = '+';
        increaseButton.style.cssText = `
            width: 24px;
            height: 24px;
            border: none;
            background: none;
            cursor: pointer;
            font-size: 16px;
            font-weight: bold;
            color: #666;
            display: flex;
            align-items: center;
            justify-content: center;
        `;
        increaseButton.addEventListener('click', () => this.increaseQuantity(item));

        controls.appendChild(decreaseButton);
        controls.appendChild(quantityInput);
        controls.appendChild(increaseButton);

        return controls;
    }

    /**
     * Create remove button
     * @param {Object} item - Cart item
     * @returns {HTMLElement} Remove button element
     */
    createRemoveButton(item) {
        const removeButton = document.createElement('button');
        removeButton.textContent = '×';
        removeButton.className = 'remove-button';
        removeButton.style.cssText = `
            width: 20px;
            height: 20px;
            border: 1px solid #dc3545;
            background: white;
            color: #dc3545;
            border-radius: 50%;
            cursor: pointer;
            font-size: 14px;
            font-weight: bold;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s ease;
        `;
        removeButton.addEventListener('click', () => this.removeItem(item));

        return removeButton;
    }

    /**
     * Render totals section
     */
    renderTotals() {
        this.totalsContainer.innerHTML = '';

        const totals = [
            { label: 'Subtotal', value: this.cartSummary.subtotal, style: '' },
            { label: 'Tax', value: this.cartSummary.tax, style: '' },
            { label: 'Shipping', value: this.cartSummary.shipping, style: '' }
        ];

        if (this.cartSummary.discount > 0) {
            totals.push({ label: 'Discount', value: -this.cartSummary.discount, style: 'color: #28a745;' });
        }

        totals.forEach(total => {
            const row = document.createElement('div');
            row.style.cssText = `
                display: flex;
                justify-content: space-between;
                margin-bottom: 8px;
                font-size: 14px;
                ${total.style}
            `;

            const label = document.createElement('span');
            label.textContent = total.label;

            const value = document.createElement('span');
            value.textContent = `$${Math.abs(total.value).toFixed(2)}`;

            row.appendChild(label);
            row.appendChild(value);
            this.totalsContainer.appendChild(row);
        });

        // Total row
        const totalRow = document.createElement('div');
        totalRow.style.cssText = `
            display: flex;
            justify-content: space-between;
            padding-top: 8px;
            border-top: 2px solid #333;
            font-size: 16px;
            font-weight: bold;
            color: #333;
        `;

        const totalLabel = document.createElement('span');
        totalLabel.textContent = 'Total';

        const totalValue = document.createElement('span');
        totalValue.textContent = `$${this.cartSummary.total.toFixed(2)}`;

        totalRow.appendChild(totalLabel);
        totalRow.appendChild(totalValue);
        this.totalsContainer.appendChild(totalRow);
    }

    /**
     * Update checkout button state
     */
    updateCheckoutButton() {
        const hasItems = this.cartItems.length > 0;
        
        this.checkoutButton.disabled = !hasItems || this.isLoading;
        this.checkoutButton.style.opacity = hasItems && !this.isLoading ? '1' : '0.5';
        this.checkoutButton.style.cursor = hasItems && !this.isLoading ? 'pointer' : 'not-allowed';
        
        if (this.isLoading) {
            this.checkoutButton.textContent = 'Processing...';
        } else {
            this.checkoutButton.textContent = hasItems ? 'Proceed to Checkout' : 'Cart is Empty';
        }
    }

    // ===========================================
    // Cart Operations
    // ===========================================

    /**
     * Increase item quantity
     * @param {Object} item - Cart item
     */
    async increaseQuantity(item) {
        try {
            await this.cartManager.updateItemQuantity(item.cartItemId, item.quantity + 1);
        } catch (error) {
            this.showError(`Failed to increase quantity: ${error.message}`);
        }
    }

    /**
     * Decrease item quantity
     * @param {Object} item - Cart item
     */
    async decreaseQuantity(item) {
        try {
            if (item.quantity > 1) {
                await this.cartManager.updateItemQuantity(item.cartItemId, item.quantity - 1);
            } else {
                await this.removeItem(item);
            }
        } catch (error) {
            this.showError(`Failed to decrease quantity: ${error.message}`);
        }
    }

    /**
     * Update item quantity
     * @param {Object} item - Cart item
     * @param {number} newQuantity - New quantity
     */
    async updateQuantity(item, newQuantity) {
        try {
            if (newQuantity < 1) {
                await this.removeItem(item);
            } else {
                await this.cartManager.updateItemQuantity(item.cartItemId, newQuantity);
            }
        } catch (error) {
            this.showError(`Failed to update quantity: ${error.message}`);
        }
    }

    /**
     * Remove item from cart
     * @param {Object} item - Cart item
     */
    async removeItem(item) {
        try {
            const confirmed = confirm(`Remove "${item.title}" from cart?`);
            if (confirmed) {
                await this.cartManager.removeItem(item.cartItemId);
            }
        } catch (error) {
            this.showError(`Failed to remove item: ${error.message}`);
        }
    }

    /**
     * Handle checkout button click
     */
    handleCheckout() {
        if (this.cartItems.length === 0) {
            return;
        }

        // Emit checkout event
        const event = new CustomEvent('cart-checkout-requested', {
            detail: {
                items: this.cartItems,
                summary: this.cartSummary
            }
        });
        document.dispatchEvent(event);

        // Close sidebar if configured
        if (this.options.closeOnCheckout) {
            this.hide();
        }
    }

    // ===========================================
    // UI State Management
    // ===========================================

    /**
     * Show the cart sidebar
     */
    show() {
        this.isVisible = true;
        
        // Update cart display
        this.updateCartDisplay();
        
        // Show overlay and sidebar
        this.overlay.style.opacity = '1';
        this.overlay.style.visibility = 'visible';
        this.sidebar.style.transform = 'translateX(0)';
        
        // Prevent body scroll
        document.body.style.overflow = 'hidden';
        
        // Emit event
        const event = new CustomEvent('cart-sidebar-opened');
        document.dispatchEvent(event);
    }

    /**
     * Hide the cart sidebar
     */
    hide() {
        this.isVisible = false;
        
        // Hide overlay and sidebar
        this.overlay.style.opacity = '0';
        this.overlay.style.visibility = 'hidden';
        this.sidebar.style.transform = `translateX(${this.options.position === 'right' ? '100%' : '-100%'})`;
        
        // Restore body scroll
        document.body.style.overflow = '';
        
        // Emit event
        const event = new CustomEvent('cart-sidebar-closed');
        document.dispatchEvent(event);
    }

    /**
     * Toggle sidebar visibility
     */
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    /**
     * Set loading state
     * @param {boolean} loading - Loading state
     */
    setLoading(loading) {
        this.isLoading = loading;
        
        if (loading) {
            this.sidebar.classList.add('cart-sidebar-loading');
        } else {
            this.sidebar.classList.remove('cart-sidebar-loading');
        }
    }

    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        // Create temporary error message
        const errorElement = document.createElement('div');
        errorElement.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #dc3545;
            color: white;
            padding: 16px 24px;
            border-radius: 6px;
            z-index: 10000;
            max-width: 300px;
            text-align: center;
            font-size: 14px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        `;
        errorElement.textContent = message;
        
        document.body.appendChild(errorElement);
        
        setTimeout(() => {
            if (errorElement.parentNode) {
                errorElement.parentNode.removeChild(errorElement);
            }
        }, 3000);
    }

    /**
     * Animate new item addition
     */
    animateNewItem() {
        const items = this.itemsContainer.querySelectorAll('.cart-item');
        const lastItem = items[items.length - 1];
        
        if (lastItem) {
            lastItem.style.opacity = '0';
            lastItem.style.transform = 'translateY(20px)';
            
            setTimeout(() => {
                lastItem.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                lastItem.style.opacity = '1';
                lastItem.style.transform = 'translateY(0)';
            }, 100);
        }
    }

    // ===========================================
    // Public API
    // ===========================================

    /**
     * Check if sidebar is visible
     * @returns {boolean} Is visible
     */
    isOpen() {
        return this.isVisible;
    }

    /**
     * Get cart summary
     * @returns {Object} Cart summary
     */
    getCartSummary() {
        return this.cartSummary;
    }

    /**
     * Refresh cart display
     */
    refresh() {
        this.updateCartDisplay();
    }

    // ===========================================
    // Cleanup
    // ===========================================

    /**
     * Destroy the cart sidebar
     */
    destroy() {
        // Unsubscribe from events
        this.subscriptions.forEach(unsubscribe => unsubscribe());
        this.subscriptions = [];
        
        // Remove DOM elements
        if (this.overlay && this.overlay.parentNode) {
            this.overlay.parentNode.removeChild(this.overlay);
        }
        
        if (this.sidebar && this.sidebar.parentNode) {
            this.sidebar.parentNode.removeChild(this.sidebar);
        }
        
        // Restore body scroll
        document.body.style.overflow = '';
        
        console.log('CartSidebar destroyed');
    }
}