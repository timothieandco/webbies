/**
 * CartIcon - Navigation cart icon component with real-time updates
 * Shows cart item count, total value, and provides click interaction to open cart
 * 
 * Features:
 * - Real-time cart count badge
 * - Optional total value display
 * - Customizable icon styles and sizes
 * - Click actions (sidebar, modal, redirect)
 * - Animated updates and transitions
 * - Responsive design
 * - Accessibility support
 * - Empty/full state styling
 * - Integration with CartManager events
 */

import { EVENTS } from '../config/events.js';
import { CSS_CLASSES } from '../config/supabase.js';

export default class CartIcon {
    constructor(containerId, cartManager, options = {}) {
        // Validate required parameters
        if (!containerId || !cartManager) {
            throw new Error('CartIcon requires containerId and cartManager');
        }

        this.container = document.getElementById(containerId);
        if (!this.container) {
            throw new Error(`Container with id "${containerId}" not found`);
        }

        this.cartManager = cartManager;

        // Configuration options
        this.options = {
            showCount: options.showCount !== false,
            showTotal: options.showTotal || false,
            animateUpdates: options.animateUpdates !== false,
            size: options.size || 'medium', // 'small', 'medium', 'large'
            style: options.style || 'default', // 'default', 'minimal', 'fancy'
            clickAction: options.clickAction || 'sidebar', // 'sidebar', 'modal', 'redirect', 'custom'
            customClickHandler: options.customClickHandler || null,
            redirectUrl: options.redirectUrl || '/cart',
            position: options.position || 'relative', // 'relative', 'fixed'
            fixedPosition: options.fixedPosition || { top: '20px', right: '20px' },
            hideWhenEmpty: options.hideWhenEmpty || false,
            maxCountDisplay: options.maxCountDisplay || 99,
            tooltipEnabled: options.tooltipEnabled !== false,
            ...options
        };

        // State
        this.cartCount = 0;
        this.cartTotal = 0;
        this.cartCurrency = 'USD';
        this.isVisible = true;

        // Event subscriptions
        this.subscriptions = [];

        // DOM elements
        this.iconElement = null;
        this.badge = null;
        this.totalDisplay = null;
        this.tooltip = null;

        // Initialize the component
        this.init();
    }

    /**
     * Initialize the cart icon
     */
    init() {
        try {
            this.createIconStructure();
            this.setupEventListeners();
            this.subscribeToCartEvents();
            this.updateDisplay();
            
            console.log('CartIcon initialized successfully');
        } catch (error) {
            console.error('Failed to initialize CartIcon:', error);
            throw error;
        }
    }

    /**
     * Create the icon DOM structure
     */
    createIconStructure() {
        // Create main icon container
        this.iconElement = document.createElement('div');
        this.iconElement.className = `cart-icon cart-icon-${this.options.style} cart-icon-${this.options.size}`;
        this.iconElement.setAttribute('role', 'button');
        this.iconElement.setAttribute('aria-label', 'Shopping cart');
        this.iconElement.setAttribute('tabindex', '0');

        // Apply positioning
        if (this.options.position === 'fixed') {
            this.iconElement.style.position = 'fixed';
            this.iconElement.style.top = this.options.fixedPosition.top;
            this.iconElement.style.right = this.options.fixedPosition.right;
            this.iconElement.style.zIndex = '1000';
        }

        // Base styles
        this.iconElement.style.cssText += `
            ${this.iconElement.style.cssText}
            display: inline-flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            user-select: none;
            position: ${this.options.position};
            transition: all 0.2s ease;
        `;

        // Apply size-specific styles
        this.applySizeStyles();

        // Apply style-specific styles
        this.applyStyleTheme();

        // Create icon SVG
        const iconSvg = this.createIconSVG();
        this.iconElement.appendChild(iconSvg);

        // Create count badge
        if (this.options.showCount) {
            this.badge = this.createCountBadge();
            this.iconElement.appendChild(this.badge);
        }

        // Create total display
        if (this.options.showTotal) {
            this.totalDisplay = this.createTotalDisplay();
            this.iconElement.appendChild(this.totalDisplay);
        }

        // Create tooltip
        if (this.options.tooltipEnabled) {
            this.tooltip = this.createTooltip();
            this.iconElement.appendChild(this.tooltip);
        }

        // Add to container
        this.container.appendChild(this.iconElement);

        // Add CSS animations
        this.addAnimationStyles();
    }

    /**
     * Apply size-specific styles
     */
    applySizeStyles() {
        const sizeConfig = {
            small: { 
                iconSize: '20px', 
                padding: '8px', 
                badgeSize: '16px', 
                fontSize: '10px',
                totalFontSize: '11px'
            },
            medium: { 
                iconSize: '24px', 
                padding: '12px', 
                badgeSize: '20px', 
                fontSize: '12px',
                totalFontSize: '13px'
            },
            large: { 
                iconSize: '32px', 
                padding: '16px', 
                badgeSize: '24px', 
                fontSize: '14px',
                totalFontSize: '15px'
            }
        };

        const config = sizeConfig[this.options.size] || sizeConfig.medium;
        
        this.iconElement.style.cssText += `
            width: ${config.iconSize};
            height: ${config.iconSize};
            padding: ${config.padding};
        `;

        // Store config for use in other methods
        this.sizeConfig = config;
    }

    /**
     * Apply style theme
     */
    applyStyleTheme() {
        const themes = {
            default: {
                background: '#f8f9fa',
                color: '#333',
                border: '2px solid #dee2e6',
                borderRadius: '8px',
                hoverBackground: '#e9ecef'
            },
            minimal: {
                background: 'transparent',
                color: '#666',
                border: 'none',
                borderRadius: '0',
                hoverBackground: 'rgba(0,0,0,0.05)'
            },
            fancy: {
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '50%',
                hoverBackground: 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)',
                boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
            }
        };

        const theme = themes[this.options.style] || themes.default;
        
        this.iconElement.style.background = theme.background;
        this.iconElement.style.color = theme.color;
        this.iconElement.style.border = theme.border || 'none';
        this.iconElement.style.borderRadius = theme.borderRadius;
        if (theme.boxShadow) {
            this.iconElement.style.boxShadow = theme.boxShadow;
        }

        // Store hover color for event listeners
        this.hoverBackground = theme.hoverBackground;
    }

    /**
     * Create the shopping cart SVG icon
     * @returns {SVGElement} Cart icon SVG
     */
    createIconSVG() {
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('fill', 'none');
        svg.setAttribute('stroke', 'currentColor');
        svg.setAttribute('stroke-width', '2');
        svg.setAttribute('stroke-linecap', 'round');
        svg.setAttribute('stroke-linejoin', 'round');
        svg.style.cssText = `
            width: 100%;
            height: 100%;
            pointer-events: none;
        `;

        // Shopping cart path
        const path1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path1.setAttribute('d', 'M9 22a1 1 0 1 0 0-2 1 1 0 0 0 0 2z');

        const path2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path2.setAttribute('d', 'M20 22a1 1 0 1 0 0-2 1 1 0 0 0 0 2z');

        const path3 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path3.setAttribute('d', 'M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6');

        svg.appendChild(path1);
        svg.appendChild(path2);
        svg.appendChild(path3);

        return svg;
    }

    /**
     * Create count badge
     * @returns {HTMLElement} Badge element
     */
    createCountBadge() {
        const badge = document.createElement('div');
        badge.className = 'cart-icon-badge';
        badge.style.cssText = `
            position: absolute;
            top: -8px;
            right: -8px;
            background: #dc3545;
            color: white;
            border-radius: 50%;
            width: ${this.sizeConfig.badgeSize};
            height: ${this.sizeConfig.badgeSize};
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: ${this.sizeConfig.fontSize};
            font-weight: bold;
            line-height: 1;
            min-width: ${this.sizeConfig.badgeSize};
            opacity: 0;
            transform: scale(0);
            transition: all 0.3s ease;
            z-index: 1;
        `;

        badge.textContent = '0';
        return badge;
    }

    /**
     * Create total display
     * @returns {HTMLElement} Total display element
     */
    createTotalDisplay() {
        const totalDisplay = document.createElement('div');
        totalDisplay.className = 'cart-icon-total';
        totalDisplay.style.cssText = `
            position: absolute;
            bottom: -24px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: ${this.sizeConfig.totalFontSize};
            font-weight: 600;
            white-space: nowrap;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.3s ease;
            z-index: 1;
        `;

        totalDisplay.textContent = '$0.00';
        return totalDisplay;
    }

    /**
     * Create tooltip
     * @returns {HTMLElement} Tooltip element
     */
    createTooltip() {
        const tooltip = document.createElement('div');
        tooltip.className = 'cart-icon-tooltip';
        tooltip.style.cssText = `
            position: absolute;
            bottom: calc(100% + 10px);
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0,0,0,0.9);
            color: white;
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 12px;
            white-space: nowrap;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s ease;
            z-index: 1000;
            pointer-events: none;
        `;

        // Arrow
        const arrow = document.createElement('div');
        arrow.style.cssText = `
            position: absolute;
            top: 100%;
            left: 50%;
            transform: translateX(-50%);
            width: 0;
            height: 0;
            border-left: 6px solid transparent;
            border-right: 6px solid transparent;
            border-top: 6px solid rgba(0,0,0,0.9);
        `;

        tooltip.appendChild(arrow);
        return tooltip;
    }

    /**
     * Add CSS animation styles
     */
    addAnimationStyles() {
        if (!document.getElementById('cart-icon-styles')) {
            const styles = document.createElement('style');
            styles.id = 'cart-icon-styles';
            styles.textContent = `
                .cart-icon:hover {
                    transform: scale(1.05);
                }

                .cart-icon:active {
                    transform: scale(0.95);
                }

                .cart-icon:focus {
                    outline: 2px solid #007bff;
                    outline-offset: 2px;
                }

                @keyframes cartBounce {
                    0%, 20%, 50%, 80%, 100% { transform: scale(1); }
                    40% { transform: scale(1.2); }
                    60% { transform: scale(1.1); }
                }

                @keyframes cartPulse {
                    0% { transform: scale(1); }
                    50% { transform: scale(1.1); }
                    100% { transform: scale(1); }
                }

                .cart-icon-animate-bounce {
                    animation: cartBounce 0.6s ease;
                }

                .cart-icon-animate-pulse {
                    animation: cartPulse 0.8s ease;
                }

                .cart-icon-badge-animate {
                    animation: cartBounce 0.5s ease;
                }

                .cart-icon-hidden {
                    opacity: 0;
                    visibility: hidden;
                    transform: scale(0.8);
                }

                .cart-icon-visible {
                    opacity: 1;
                    visibility: visible;
                    transform: scale(1);
                }
            `;
            document.head.appendChild(styles);
        }
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Click handler
        this.iconElement.addEventListener('click', () => this.handleClick());

        // Keyboard support
        this.iconElement.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                this.handleClick();
            }
        });

        // Hover effects
        this.iconElement.addEventListener('mouseenter', () => this.handleMouseEnter());
        this.iconElement.addEventListener('mouseleave', () => this.handleMouseLeave());

        // Focus effects
        this.iconElement.addEventListener('focus', () => this.handleFocus());
        this.iconElement.addEventListener('blur', () => this.handleBlur());
    }

    /**
     * Subscribe to cart manager events
     */
    subscribeToCartEvents() {
        // Subscribe to cart updates
        this.subscriptions.push(
            this.cartManager.subscribe(EVENTS.CART_UPDATED, (summary) => {
                this.updateFromCartSummary(summary);
            })
        );

        this.subscriptions.push(
            this.cartManager.subscribe(EVENTS.CART_ITEM_ADDED, (data) => {
                this.updateFromCartSummary(data.summary);
                if (this.options.animateUpdates) {
                    this.animateUpdate('bounce');
                }
            })
        );

        this.subscriptions.push(
            this.cartManager.subscribe(EVENTS.CART_ITEM_REMOVED, (data) => {
                this.updateFromCartSummary(data.summary);
                if (this.options.animateUpdates) {
                    this.animateUpdate('pulse');
                }
            })
        );

        this.subscriptions.push(
            this.cartManager.subscribe(EVENTS.CART_ITEM_UPDATED, (data) => {
                this.updateFromCartSummary(data.summary);
            })
        );

        this.subscriptions.push(
            this.cartManager.subscribe(EVENTS.CART_CLEARED, (data) => {
                this.updateFromCartSummary(data.summary);
                if (this.options.animateUpdates) {
                    this.animateUpdate('pulse');
                }
            })
        );
    }

    /**
     * Update display from cart summary
     * @param {Object} summary - Cart summary
     */
    updateFromCartSummary(summary) {
        this.cartCount = summary.itemCount || 0;
        this.cartTotal = summary.total || 0;
        this.cartCurrency = summary.currency || 'USD';
        this.updateDisplay();
    }

    /**
     * Update the icon display
     */
    updateDisplay() {
        // Update count badge
        if (this.badge) {
            this.updateCountBadge();
        }

        // Update total display
        if (this.totalDisplay) {
            this.updateTotalDisplay();
        }

        // Update tooltip
        if (this.tooltip) {
            this.updateTooltip();
        }

        // Update visibility
        this.updateVisibility();

        // Update accessibility
        this.updateAccessibility();
    }

    /**
     * Update count badge
     */
    updateCountBadge() {
        const displayCount = this.cartCount > this.options.maxCountDisplay 
            ? `${this.options.maxCountDisplay}+` 
            : this.cartCount.toString();

        this.badge.textContent = displayCount;

        if (this.cartCount > 0) {
            this.badge.style.opacity = '1';
            this.badge.style.transform = 'scale(1)';
            this.badge.classList.add('cart-icon-badge-animate');
            
            // Remove animation class after animation completes
            setTimeout(() => {
                this.badge.classList.remove('cart-icon-badge-animate');
            }, 500);
        } else {
            this.badge.style.opacity = '0';
            this.badge.style.transform = 'scale(0)';
        }
    }

    /**
     * Update total display
     */
    updateTotalDisplay() {
        const formattedTotal = this.formatCurrency(this.cartTotal, this.cartCurrency);
        this.totalDisplay.textContent = formattedTotal;

        if (this.cartTotal > 0) {
            this.totalDisplay.style.opacity = '1';
        } else {
            this.totalDisplay.style.opacity = '0';
        }
    }

    /**
     * Update tooltip
     */
    updateTooltip() {
        let tooltipText = '';
        
        if (this.cartCount === 0) {
            tooltipText = 'Cart is empty';
        } else if (this.cartCount === 1) {
            tooltipText = '1 item in cart';
        } else {
            tooltipText = `${this.cartCount} items in cart`;
        }

        if (this.options.showTotal && this.cartTotal > 0) {
            const formattedTotal = this.formatCurrency(this.cartTotal, this.cartCurrency);
            tooltipText += ` (${formattedTotal})`;
        }

        this.tooltip.textContent = tooltipText;
    }

    /**
     * Update visibility based on cart state
     */
    updateVisibility() {
        if (this.options.hideWhenEmpty && this.cartCount === 0) {
            this.hide();
        } else {
            this.show();
        }
    }

    /**
     * Update accessibility attributes
     */
    updateAccessibility() {
        const ariaLabel = this.cartCount === 0 
            ? 'Shopping cart is empty'
            : `Shopping cart with ${this.cartCount} item${this.cartCount === 1 ? '' : 's'}`;
        
        this.iconElement.setAttribute('aria-label', ariaLabel);
    }

    // ===========================================
    // Event Handlers
    // ===========================================

    /**
     * Handle click events
     */
    handleClick() {
        const event = new CustomEvent('cart-icon-clicked', {
            detail: {
                cartCount: this.cartCount,
                cartTotal: this.cartTotal,
                action: this.options.clickAction
            }
        });
        document.dispatchEvent(event);

        switch (this.options.clickAction) {
            case 'sidebar':
                this.openSidebar();
                break;
            case 'modal':
                this.openModal();
                break;
            case 'redirect':
                this.redirectToCart();
                break;
            case 'custom':
                if (this.options.customClickHandler) {
                    this.options.customClickHandler({
                        cartCount: this.cartCount,
                        cartTotal: this.cartTotal,
                        cartManager: this.cartManager
                    });
                }
                break;
        }
    }

    /**
     * Handle mouse enter
     */
    handleMouseEnter() {
        if (this.hoverBackground) {
            this.iconElement.style.background = this.hoverBackground;
        }

        // Show tooltip
        if (this.tooltip) {
            this.tooltip.style.opacity = '1';
            this.tooltip.style.visibility = 'visible';
        }

        // Show total display
        if (this.totalDisplay && this.cartTotal > 0) {
            this.totalDisplay.style.opacity = '1';
        }
    }

    /**
     * Handle mouse leave
     */
    handleMouseLeave() {
        // Restore original background
        this.applyStyleTheme();

        // Hide tooltip
        if (this.tooltip) {
            this.tooltip.style.opacity = '0';
            this.tooltip.style.visibility = 'hidden';
        }

        // Hide total display
        if (this.totalDisplay) {
            this.totalDisplay.style.opacity = '0';
        }
    }

    /**
     * Handle focus
     */
    handleFocus() {
        // Show tooltip on focus for accessibility
        if (this.tooltip) {
            this.tooltip.style.opacity = '1';
            this.tooltip.style.visibility = 'visible';
        }
    }

    /**
     * Handle blur
     */
    handleBlur() {
        // Hide tooltip on blur
        if (this.tooltip) {
            this.tooltip.style.opacity = '0';
            this.tooltip.style.visibility = 'hidden';
        }
    }

    // ===========================================
    // Click Actions
    // ===========================================

    /**
     * Open cart sidebar
     */
    openSidebar() {
        const event = new CustomEvent('cart-sidebar-toggle-requested');
        document.dispatchEvent(event);
    }

    /**
     * Open cart modal
     */
    openModal() {
        const event = new CustomEvent('cart-modal-open-requested');
        document.dispatchEvent(event);
    }

    /**
     * Redirect to cart page
     */
    redirectToCart() {
        window.location.href = this.options.redirectUrl;
    }

    // ===========================================
    // Animations
    // ===========================================

    /**
     * Animate icon update
     * @param {string} type - Animation type ('bounce', 'pulse')
     */
    animateUpdate(type = 'bounce') {
        const animationClass = `cart-icon-animate-${type}`;
        
        this.iconElement.classList.add(animationClass);
        
        // Remove animation class after animation completes
        setTimeout(() => {
            this.iconElement.classList.remove(animationClass);
        }, 800);
    }

    /**
     * Animate icon appearance
     */
    animateIn() {
        this.iconElement.classList.remove('cart-icon-hidden');
        this.iconElement.classList.add('cart-icon-visible');
    }

    /**
     * Animate icon disappearance
     */
    animateOut() {
        this.iconElement.classList.remove('cart-icon-visible');
        this.iconElement.classList.add('cart-icon-hidden');
    }

    // ===========================================
    // Visibility Management
    // ===========================================

    /**
     * Show the cart icon
     */
    show() {
        this.isVisible = true;
        this.iconElement.style.display = 'inline-flex';
        
        if (this.options.animateUpdates) {
            this.animateIn();
        }
    }

    /**
     * Hide the cart icon
     */
    hide() {
        this.isVisible = false;
        
        if (this.options.animateUpdates) {
            this.animateOut();
            setTimeout(() => {
                if (!this.isVisible) { // Check if still hidden after animation
                    this.iconElement.style.display = 'none';
                }
            }, 300);
        } else {
            this.iconElement.style.display = 'none';
        }
    }

    /**
     * Toggle icon visibility
     */
    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    // ===========================================
    // Utility Methods
    // ===========================================

    /**
     * Format currency value
     * @param {number} amount - Amount to format
     * @param {string} currency - Currency code
     * @returns {string} Formatted currency string
     */
    formatCurrency(amount, currency = 'USD') {
        try {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: currency
            }).format(amount);
        } catch (error) {
            // Fallback formatting
            return `$${amount.toFixed(2)}`;
        }
    }

    // ===========================================
    // Public API
    // ===========================================

    /**
     * Update cart count manually
     * @param {number} count - New cart count
     */
    setCount(count) {
        this.cartCount = Math.max(0, count);
        this.updateDisplay();
    }

    /**
     * Update cart total manually
     * @param {number} total - New cart total
     */
    setTotal(total) {
        this.cartTotal = Math.max(0, total);
        this.updateDisplay();
    }

    /**
     * Get current cart count
     * @returns {number} Cart count
     */
    getCount() {
        return this.cartCount;
    }

    /**
     * Get current cart total
     * @returns {number} Cart total
     */
    getTotal() {
        return this.cartTotal;
    }

    /**
     * Check if icon is visible
     * @returns {boolean} Is visible
     */
    isIconVisible() {
        return this.isVisible;
    }

    /**
     * Update icon options
     * @param {Object} newOptions - New options
     */
    updateOptions(newOptions) {
        this.options = { ...this.options, ...newOptions };
        this.updateDisplay();
    }

    /**
     * Refresh icon display
     */
    refresh() {
        const summary = this.cartManager.getCartSummary();
        this.updateFromCartSummary(summary);
    }

    // ===========================================
    // Cleanup
    // ===========================================

    /**
     * Destroy the cart icon
     */
    destroy() {
        // Unsubscribe from events
        this.subscriptions.forEach(unsubscribe => unsubscribe());
        this.subscriptions = [];

        // Remove DOM elements
        if (this.iconElement && this.iconElement.parentNode) {
            this.iconElement.parentNode.removeChild(this.iconElement);
        }

        console.log('CartIcon destroyed');
    }
}