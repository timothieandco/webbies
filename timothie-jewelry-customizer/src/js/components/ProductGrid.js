// =============================================================================
// ProductGrid Component - Renders grid of product cards
// =============================================================================

export class ProductGrid {
    constructor(container, options = {}) {
        this.container = container;
        this.options = {
            onProductClick: options.onProductClick || (() => {}),
            onAddToCart: options.onAddToCart || (() => {}),
            onCustomize: options.onCustomize || (() => {}),
            cartManager: options.cartManager || null,
            ...options
        };
        
        this.products = [];
    }

    render(products) {
        this.products = products;
        
        if (!this.container) {
            console.error('ProductGrid: Container element not found');
            return;
        }

        if (!products || products.length === 0) {
            this.renderEmptyState();
            return;
        }

        this.container.innerHTML = products.map(product => this.renderProductCard(product)).join('');
        this.attachEventListeners();
    }

    renderProductCard(product) {
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
                ? 'Low Stock' 
                : 'In Stock';

        const hasDiscount = product.originalPrice && product.originalPrice > product.price;
        const rating = product.rating || 0;
        const reviewCount = product.reviewCount || 0;

        return `
            <div class="product-card" data-product-id="${product.id}">
                <div class="product-image-container">
                    <img src="${product.image || '/src/assets/images/ui/011A2614.jpg'}" 
                         alt="${product.name}" 
                         class="product-image"
                         loading="lazy">
                    
                    <div class="product-status ${stockStatus}">
                        ${stockText}
                    </div>
                    
                    <div class="product-actions">
                        <button class="product-action-btn" 
                                data-action="quick-view" 
                                data-product-id="${product.id}"
                                title="Quick View">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                <path d="M8 3C4.5 3 1.73 5.11 1 8c.73 2.89 3.5 5 7 5s6.27-2.11 7-5c-.73-2.89-3.5-5-7-5zm0 8.5c-1.93 0-3.5-1.57-3.5-3.5S6.07 4.5 8 4.5s3.5 1.57 3.5 3.5S9.93 11.5 8 11.5z"/>
                                <circle cx="8" cy="8" r="1.5"/>
                            </svg>
                        </button>
                        
                        <button class="product-action-btn" 
                                data-action="add-to-wishlist" 
                                data-product-id="${product.id}"
                                title="Add to Wishlist">
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                <path d="M8 14.5L6.75 13.3C3.5 10.36 1.5 8.55 1.5 6.3c0-1.65 1.35-3 3-3 .99 0 1.98.51 2.5 1.3.52-.79 1.51-1.3 2.5-1.3 1.65 0 3 1.35 3 3 0 2.25-2 4.06-5.25 7L8 14.5z"/>
                            </svg>
                        </button>
                    </div>
                </div>
                
                <div class="product-info">
                    <div class="product-category">${product.category || 'Jewelry'}</div>
                    
                    <h3 class="product-name">${product.name}</h3>
                    
                    <p class="product-description">
                        ${product.description || 'Beautiful handcrafted jewelry piece'}
                    </p>
                    
                    <div class="product-pricing">
                        <div class="product-price">
                            $${product.price.toFixed(2)}
                            ${hasDiscount ? `<span class="product-price-original">$${product.originalPrice.toFixed(2)}</span>` : ''}
                        </div>
                        
                        ${rating > 0 ? `
                            <div class="product-rating">
                                <div class="product-stars">
                                    ${'★'.repeat(Math.floor(rating))}${'☆'.repeat(5 - Math.floor(rating))}
                                </div>
                                <span class="product-rating-count">(${reviewCount})</span>
                            </div>
                        ` : ''}
                    </div>
                    
                    <div class="product-actions-footer">
                        <button class="btn-add-to-cart" 
                                data-action="add-to-cart" 
                                data-product-id="${product.id}"
                                ${isOutOfStock ? 'disabled' : ''}>
                            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                                <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l2-4A1 1 0 0016 6V3a1 1 0 00-1-1H3.28l-.22-.916A1 1 0 002 1H1a1 1 0 000 2h.78l.22.916"/>
                            </svg>
                            ${isOutOfStock ? 'Out of Stock' : 'Add to Cart'}
                        </button>
                        
                        <button class="btn-customize" 
                                data-action="customize" 
                                data-product-id="${product.id}">
                            Customize
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    renderEmptyState() {
        this.container.innerHTML = `
            <div class="empty-state" style="
                grid-column: 1 / -1;
                text-align: center;
                padding: var(--spacing-xl);
                color: var(--warm-gray);
            ">
                <svg width="64" height="64" viewBox="0 0 64 64" fill="currentColor" style="margin-bottom: 1rem; opacity: 0.5;">
                    <path d="M32 8C18.745 8 8 18.745 8 32s10.745 24 24 24 24-10.745 24-24S45.255 8 32 8zm0 44c-11.046 0-20-8.954-20-20s8.954-20 20-20 20 8.954 20 20-8.954 20-20 20z"/>
                    <path d="M40 32c0-4.418-3.582-8-8-8s-8 3.582-8 8h2c0-3.314 2.686-6 6-6s6 2.686 6 6-2.686 6-6 6v2c4.418 0 8-3.582 8-8z"/>
                </svg>
                <h3 style="margin: 0 0 0.5rem 0; font-family: var(--font-headings);">No products found</h3>
                <p style="margin: 0 0 1rem 0;">Try adjusting your filters or search terms to find what you're looking for.</p>
                <button onclick="browseManager?.clearAllFilters()" class="btn-add-to-cart">
                    Clear All Filters
                </button>
            </div>
        `;
    }

    attachEventListeners() {
        if (!this.container) return;

        // Product card click (for navigation to detail page)
        this.container.addEventListener('click', (e) => {
            const productCard = e.target.closest('.product-card');
            if (!productCard) return;

            const productId = productCard.dataset.productId;
            const product = this.products.find(p => p.id === productId);
            if (!product) return;

            // Handle different actions based on clicked element
            const action = e.target.closest('[data-action]')?.dataset.action;
            
            switch (action) {
                case 'add-to-cart':
                    e.stopPropagation();
                    this.handleAddToCart(product, e.target);
                    break;
                    
                case 'customize':
                    e.stopPropagation();
                    this.options.onCustomize(product);
                    break;
                    
                case 'quick-view':
                    e.stopPropagation();
                    this.handleQuickView(product);
                    break;
                    
                case 'add-to-wishlist':
                    e.stopPropagation();
                    this.handleAddToWishlist(product, e.target);
                    break;
                    
                default:
                    // Default action: navigate to product detail
                    if (!e.target.closest('button')) {
                        this.options.onProductClick(product);
                    }
                    break;
            }
        });
    }

    async handleAddToCart(product, button) {
        if (product.stock <= 0) return;

        // Add loading state to button
        const originalText = button.textContent;
        button.textContent = 'Adding...';
        button.disabled = true;

        try {
            await this.options.onAddToCart(product);
            
            // Success feedback
            button.textContent = 'Added!';
            button.style.background = '#22c55e';
            
            setTimeout(() => {
                button.textContent = originalText;
                button.disabled = false;
                button.style.background = '';
            }, 2000);
            
        } catch (error) {
            // Error feedback
            button.textContent = 'Error';
            button.style.background = '#ef4444';
            
            setTimeout(() => {
                button.textContent = originalText;
                button.disabled = false;
                button.style.background = '';
            }, 2000);
        }
    }

    handleQuickView(product) {
        // Create and show quick view modal
        this.showQuickViewModal(product);
    }

    handleAddToWishlist(product, button) {
        // Toggle wishlist state
        const isInWishlist = button.classList.contains('active');
        
        if (isInWishlist) {
            button.classList.remove('active');
            button.style.color = '';
            button.title = 'Add to Wishlist';
        } else {
            button.classList.add('active');
            button.style.color = '#ef4444';
            button.title = 'Remove from Wishlist';
        }
        
        // Here you would typically sync with wishlist service
        console.log(`${isInWishlist ? 'Removed from' : 'Added to'} wishlist:`, product.name);
    }

    showQuickViewModal(product) {
        // Create quick view modal
        const modal = document.createElement('div');
        modal.className = 'quick-view-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(18, 18, 18, 0.8);
            backdrop-filter: blur(8px);
            z-index: 1000;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: var(--spacing-md);
        `;

        modal.innerHTML = `
            <div class="quick-view-content" style="
                background: var(--soft-white);
                border-radius: var(--radius-lg);
                max-width: 600px;
                width: 100%;
                max-height: 80vh;
                overflow-y: auto;
                position: relative;
            ">
                <button class="quick-view-close" style="
                    position: absolute;
                    top: 1rem;
                    right: 1rem;
                    background: none;
                    border: none;
                    font-size: 1.5rem;
                    cursor: pointer;
                    color: var(--warm-gray);
                    z-index: 1001;
                ">×</button>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: var(--spacing-md); padding: var(--spacing-md);">
                    <div>
                        <img src="${product.image || '/src/assets/images/ui/011A2614.jpg'}" 
                             alt="${product.name}"
                             style="width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: var(--radius-sm);">
                    </div>
                    
                    <div>
                        <div style="color: var(--accent-coral); font-size: 0.875rem; font-weight: 600; text-transform: uppercase; margin-bottom: 0.5rem;">
                            ${product.category || 'Jewelry'}
                        </div>
                        
                        <h2 style="font-family: var(--font-headings); font-size: 1.5rem; margin: 0 0 1rem 0; color: var(--neutral-charcoal);">
                            ${product.name}
                        </h2>
                        
                        <p style="color: var(--warm-gray); line-height: 1.5; margin: 0 0 1rem 0;">
                            ${product.description || 'Beautiful handcrafted jewelry piece'}
                        </p>
                        
                        <div style="font-size: 1.5rem; font-weight: 600; color: var(--neutral-charcoal); margin: 0 0 1.5rem 0;">
                            $${product.price.toFixed(2)}
                        </div>
                        
                        <div style="display: flex; gap: 0.75rem;">
                            <button class="btn-add-to-cart" style="flex: 1;" 
                                    onclick="this.closest('.quick-view-modal').dispatchEvent(new CustomEvent('addToCart', {detail: {product: ${JSON.stringify(product).replace(/"/g, '&quot;')}}}))"
                                    ${product.stock <= 0 ? 'disabled' : ''}>
                                ${product.stock <= 0 ? 'Out of Stock' : 'Add to Cart'}
                            </button>
                            
                            <button class="btn-customize"
                                    onclick="this.closest('.quick-view-modal').dispatchEvent(new CustomEvent('customize', {detail: {product: ${JSON.stringify(product).replace(/"/g, '&quot;')}}})">
                                Customize
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Add event listeners
        modal.querySelector('.quick-view-close').addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });

        modal.addEventListener('addToCart', async (e) => {
            await this.options.onAddToCart(e.detail.product);
            document.body.removeChild(modal);
        });

        modal.addEventListener('customize', (e) => {
            this.options.onCustomize(e.detail.product);
            document.body.removeChild(modal);
        });

        document.body.appendChild(modal);
    }

    // Method to update a single product in the grid
    updateProduct(productId, updates) {
        const productIndex = this.products.findIndex(p => p.id === productId);
        if (productIndex !== -1) {
            this.products[productIndex] = { ...this.products[productIndex], ...updates };
            
            // Re-render the specific product card
            const productCard = this.container.querySelector(`[data-product-id="${productId}"]`);
            if (productCard) {
                productCard.outerHTML = this.renderProductCard(this.products[productIndex]);
                this.attachEventListeners();
            }
        }
    }

    // Method to get current products
    getProducts() {
        return this.products;
    }

    // Method to clear the grid
    clear() {
        if (this.container) {
            this.container.innerHTML = '';
        }
        this.products = [];
    }
}

export default ProductGrid;