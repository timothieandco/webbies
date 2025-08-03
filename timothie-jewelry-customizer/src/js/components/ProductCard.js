// =============================================================================
// ProductCard Component - Individual product card for grid and list views
// =============================================================================

export class ProductCard {
    constructor(product, options = {}) {
        this.product = product;
        this.options = {
            viewMode: options.viewMode || 'grid', // 'grid' or 'list'
            showQuickActions: options.showQuickActions !== false,
            showRating: options.showRating !== false,
            showDescription: options.showDescription !== false,
            onAddToCart: options.onAddToCart || (() => {}),
            onCustomize: options.onCustomize || (() => {}),
            onClick: options.onClick || (() => {}),
            cartManager: options.cartManager || null,
            ...options
        };
        
        this.element = null;
        this.isInWishlist = false;
    }

    render() {
        this.element = document.createElement('div');
        this.element.className = `product-card ${this.options.viewMode}-view`;
        this.element.dataset.productId = this.product.id;
        
        this.element.innerHTML = this.getCardHTML();
        this.attachEventListeners();
        
        return this.element;
    }

    getCardHTML() {
        if (this.options.viewMode === 'list') {
            return this.getListHTML();
        }
        return this.getGridHTML();
    }

    getGridHTML() {
        const { product } = this;
        const isOutOfStock = product.stock <= 0;
        const isLowStock = product.stock > 0 && product.stock < 5;
        const hasDiscount = product.originalPrice && product.originalPrice > product.price;
        
        return `
            <div class="product-image-container">
                ${this.getProductImage()}
                ${this.getStockBadge()}
                ${this.options.showQuickActions ? this.getQuickActions() : ''}
            </div>
            
            <div class="product-info">
                ${this.getCategoryBadge()}
                ${this.getProductTitle()}
                ${this.options.showDescription ? this.getProductDescription() : ''}
                ${this.getPricingSection()}
                ${this.options.showRating ? this.getRatingSection() : ''}
                ${this.getActionButtons()}
            </div>
        `;
    }

    getListHTML() {
        const { product } = this;
        
        return `
            <div class="product-image-container">
                ${this.getProductImage()}
                ${this.getStockBadge()}
            </div>
            
            <div class="product-info">
                <div class="product-header">
                    ${this.getCategoryBadge()}
                    ${this.getProductTitle()}
                </div>
                
                <div class="product-details">
                    ${this.getProductDescription()}
                    ${this.getPricingSection()}
                    ${this.options.showRating ? this.getRatingSection() : ''}
                </div>
            </div>
            
            <div class="product-actions-list">
                ${this.getActionButtons()}
            </div>
        `;
    }

    getProductImage() {
        const { product } = this;
        const defaultImage = '/src/assets/images/ui/011A2614.jpg';
        
        return `
            <img src="${product.image || defaultImage}" 
                 alt="${product.name}" 
                 class="product-image"
                 loading="lazy"
                 onerror="this.src='${defaultImage}'">
        `;
    }

    getStockBadge() {
        const { product } = this;
        const isOutOfStock = product.stock <= 0;
        const isLowStock = product.stock > 0 && product.stock < 5;
        
        const stockStatus = isOutOfStock 
            ? 'out-of-stock' 
            : isLowStock 
                ? 'low-stock' 
                : 'in-stock';
                
        const stockText = isOutOfStock 
            ? 'Out of Stock' 
            : isLowStock 
                ? `Only ${product.stock} left` 
                : 'In Stock';

        return `<div class="product-status ${stockStatus}">${stockText}</div>`;
    }

    getQuickActions() {
        return `
            <div class="product-actions">
                <button class="product-action-btn" 
                        data-action="quick-view" 
                        title="Quick View">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M8 3C4.5 3 1.73 5.11 1 8c.73 2.89 3.5 5 7 5s6.27-2.11 7-5c-.73-2.89-3.5-5-7-5zm0 8.5c-1.93 0-3.5-1.57-3.5-3.5S6.07 4.5 8 4.5s3.5 1.57 3.5 3.5S9.93 11.5 8 11.5z"/>
                        <circle cx="8" cy="8" r="1.5"/>
                    </svg>
                </button>
                
                <button class="product-action-btn ${this.isInWishlist ? 'active' : ''}" 
                        data-action="add-to-wishlist" 
                        title="${this.isInWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M8 14.5L6.75 13.3C3.5 10.36 1.5 8.55 1.5 6.3c0-1.65 1.35-3 3-3 .99 0 1.98.51 2.5 1.3.52-.79 1.51-1.3 2.5-1.3 1.65 0 3 1.35 3 3 0 2.25-2 4.06-5.25 7L8 14.5z"/>
                    </svg>
                </button>
            </div>
        `;
    }

    getCategoryBadge() {
        const { product } = this;
        return `<div class="product-category">${product.category || 'Jewelry'}</div>`;
    }

    getProductTitle() {
        const { product } = this;
        return `<h3 class="product-name">${product.name}</h3>`;
    }

    getProductDescription() {
        const { product } = this;
        const description = product.description || 'Beautiful handcrafted jewelry piece';
        return `<p class="product-description">${description}</p>`;
    }

    getPricingSection() {
        const { product } = this;
        const hasDiscount = product.originalPrice && product.originalPrice > product.price;
        
        return `
            <div class="product-pricing">
                <div class="product-price">
                    $${product.price.toFixed(2)}
                    ${hasDiscount ? `<span class="product-price-original">$${product.originalPrice.toFixed(2)}</span>` : ''}
                </div>
                ${hasDiscount ? `<div class="product-discount">${this.calculateDiscountPercentage()}% off</div>` : ''}
            </div>
        `;
    }

    getRatingSection() {
        const { product } = this;
        const rating = product.rating || 0;
        const reviewCount = product.reviewCount || 0;
        
        if (rating === 0) return '';
        
        return `
            <div class="product-rating">
                <div class="product-stars">
                    ${this.generateStars(rating)}
                </div>
                <span class="product-rating-count">(${reviewCount})</span>
            </div>
        `;
    }

    getActionButtons() {
        const { product } = this;
        const isOutOfStock = product.stock <= 0;
        
        return `
            <div class="product-actions-footer">
                <button class="btn-add-to-cart" 
                        data-action="add-to-cart"
                        ${isOutOfStock ? 'disabled' : ''}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l2-4A1 1 0 0016 6V3a1 1 0 00-1-1H3.28l-.22-.916A1 1 0 002 1H1a1 1 0 000 2h.78l.22.916"/>
                    </svg>
                    ${isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                </button>
                
                <button class="btn-customize" data-action="customize">
                    Customize
                </button>
            </div>
        `;
    }

    attachEventListeners() {
        if (!this.element) return;

        // Handle all button clicks
        this.element.addEventListener('click', (e) => {
            const action = e.target.closest('[data-action]')?.dataset.action;
            
            switch (action) {
                case 'add-to-cart':
                    e.stopPropagation();
                    this.handleAddToCart(e.target.closest('button'));
                    break;
                    
                case 'customize':
                    e.stopPropagation();
                    this.options.onCustomize(this.product);
                    break;
                    
                case 'quick-view':
                    e.stopPropagation();
                    this.showQuickView();
                    break;
                    
                case 'add-to-wishlist':
                    e.stopPropagation();
                    this.toggleWishlist(e.target.closest('button'));
                    break;
                    
                default:
                    // Default click handler for product navigation
                    if (!e.target.closest('button')) {
                        this.options.onClick(this.product);
                    }
                    break;
            }
        });

        // Handle hover effects
        this.element.addEventListener('mouseenter', () => {
            this.element.classList.add('hovered');
        });

        this.element.addEventListener('mouseleave', () => {
            this.element.classList.remove('hovered');
        });
    }

    async handleAddToCart(button) {
        if (this.product.stock <= 0) return;

        // Add loading state
        const originalText = button.innerHTML;
        button.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" class="animate-spin">
                <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="2" fill="none" stroke-dasharray="31.416" stroke-dashoffset="31.416">
                    <animate attributeName="stroke-dasharray" dur="2s" values="0 31.416;15.708 15.708;0 31.416" repeatCount="indefinite"/>
                    <animate attributeName="stroke-dashoffset" dur="2s" values="0;-15.708;-31.416" repeatCount="indefinite"/>
                </circle>
            </svg>
            Adding...
        `;
        button.disabled = true;

        try {
            await this.options.onAddToCart(this.product);
            
            // Success state
            button.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
                </svg>
                Added!
            `;
            button.style.background = '#22c55e';
            
            setTimeout(() => {
                button.innerHTML = originalText;
                button.disabled = false;
                button.style.background = '';
            }, 2000);
            
        } catch (error) {
            // Error state
            button.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                    <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
                </svg>
                Error
            `;
            button.style.background = '#ef4444';
            
            setTimeout(() => {
                button.innerHTML = originalText;
                button.disabled = false;
                button.style.background = '';
            }, 2000);
        }
    }

    toggleWishlist(button) {
        this.isInWishlist = !this.isInWishlist;
        
        if (this.isInWishlist) {
            button.classList.add('active');
            button.style.color = '#ef4444';
            button.title = 'Remove from Wishlist';
        } else {
            button.classList.remove('active');
            button.style.color = '';
            button.title = 'Add to Wishlist';
        }
        
        // Animation effect
        button.style.transform = 'scale(1.2)';
        setTimeout(() => {
            button.style.transform = '';
        }, 150);
        
        // Dispatch custom event for wishlist change
        this.element.dispatchEvent(new CustomEvent('wishlistToggle', {
            detail: { product: this.product, isInWishlist: this.isInWishlist },
            bubbles: true
        }));
    }

    showQuickView() {
        // Dispatch custom event for quick view
        this.element.dispatchEvent(new CustomEvent('quickView', {
            detail: { product: this.product },
            bubbles: true
        }));
    }

    // Utility Methods
    calculateDiscountPercentage() {
        const { product } = this;
        if (!product.originalPrice || product.originalPrice <= product.price) return 0;
        
        const discount = ((product.originalPrice - product.price) / product.originalPrice) * 100;
        return Math.round(discount);
    }

    generateStars(rating) {
        const fullStars = Math.floor(rating);
        const hasHalfStar = rating % 1 !== 0;
        const emptyStars = 5 - Math.ceil(rating);
        
        let stars = '';
        
        // Full stars
        for (let i = 0; i < fullStars; i++) {
            stars += '★';
        }
        
        // Half star
        if (hasHalfStar) {
            stars += '☆'; // You could use a half-star symbol here
        }
        
        // Empty stars
        for (let i = 0; i < emptyStars; i++) {
            stars += '☆';
        }
        
        return stars;
    }

    // Public methods for updating the card
    updateProduct(newProductData) {
        this.product = { ...this.product, ...newProductData };
        if (this.element) {
            this.element.innerHTML = this.getCardHTML();
            this.attachEventListeners();
        }
    }

    updateStock(newStock) {
        this.product.stock = newStock;
        
        // Update stock badge
        const stockBadge = this.element?.querySelector('.product-status');
        if (stockBadge) {
            const isOutOfStock = newStock <= 0;
            const isLowStock = newStock > 0 && newStock < 5;
            
            stockBadge.className = `product-status ${isOutOfStock ? 'out-of-stock' : isLowStock ? 'low-stock' : 'in-stock'}`;
            stockBadge.textContent = isOutOfStock ? 'Out of Stock' : isLowStock ? `Only ${newStock} left` : 'In Stock';
        }
        
        // Update add to cart button
        const addToCartBtn = this.element?.querySelector('[data-action="add-to-cart"]');
        if (addToCartBtn) {
            addToCartBtn.disabled = newStock <= 0;
            if (newStock <= 0) {
                addToCartBtn.innerHTML = `
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                        <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l2-4A1 1 0 0016 6V3a1 1 0 00-1-1H3.28l-.22-.916A1 1 0 002 1H1a1 1 0 000 2h.78l.22.916"/>
                    </svg>
                    Out of Stock
                `;
            }
        }
    }

    // Method to get the current product data
    getProduct() {
        return this.product;
    }

    // Method to destroy the card and clean up event listeners
    destroy() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        this.element = null;
    }
}

export default ProductCard;