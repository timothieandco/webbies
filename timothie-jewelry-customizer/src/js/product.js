// =============================================================================
// Timothie & Co Product Detail Page JavaScript
// Complete product detail experience with cart integration
// =============================================================================

import '../css/product.css';
import { homeImages } from './utils/homeImages.js';
import CartIcon from './components/CartIcon.js';
import CartManager from './core/CartManager.js';
import { InventoryService } from './services/InventoryService.js';
import { ProductGrid } from './components/ProductGrid.js';

// =============================================================================
// Product Detail Manager
// =============================================================================
class ProductDetailManager {
    constructor() {
        // Core services
        this.cartManager = null;
        this.inventoryService = null;
        this.cartIcon = null;
        
        // Product data
        this.product = null;
        this.relatedProducts = [];
        this.currentImage = 0;
        this.selectedOptions = {};
        this.quantity = 1;
        
        // DOM elements
        this.elements = {};
        
        this.init();
    }

    async init() {
        try {
            // Get product ID from URL
            this.productId = this.getProductIdFromURL();
            if (!this.productId) {
                this.showErrorState();
                return;
            }

            // Initialize services
            await this.initializeServices();
            
            // Cache DOM elements
            this.cacheElements();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Load product data
            await this.loadProduct();
            
            // Initialize image manager
            this.initializeImages();
            
            console.log('Product page initialized successfully');
        } catch (error) {
            console.error('Failed to initialize product page:', error);
            this.showErrorState();
        }
    }

    async initializeServices() {
        // Initialize cart manager
        this.cartManager = new CartManager();
        await this.cartManager.initialize();

        // Initialize inventory service
        this.inventoryService = new InventoryService();
        await this.inventoryService.initialize();

        // Initialize cart icon in navigation
        this.cartIcon = new CartIcon('nav-cart-container', this.cartManager, {
            style: 'minimal',
            size: 'medium',
            showCount: true,
            showTotal: false,
            clickAction: 'sidebar',
            tooltipEnabled: true
        });
    }

    cacheElements() {
        this.elements = {
            // Loading and error states
            loadingContainer: document.getElementById('loading-container'),
            errorState: document.getElementById('error-state'),
            productDetail: document.getElementById('product-detail'),
            
            // Breadcrumb
            breadcrumbCategory: document.getElementById('breadcrumb-category'),
            breadcrumbProduct: document.getElementById('breadcrumb-product'),
            
            // Gallery
            mainImage: document.getElementById('main-image'),
            galleryBadges: document.getElementById('gallery-badges'),
            galleryThumbnails: document.getElementById('gallery-thumbnails'),
            zoomBtn: document.getElementById('zoom-btn'),
            zoomModal: document.getElementById('zoom-modal'),
            zoomClose: document.getElementById('zoom-close'),
            zoomImage: document.getElementById('zoom-image'),
            
            // Product info
            productCategory: document.getElementById('product-category'),
            productTitle: document.getElementById('product-title'),
            productRating: document.getElementById('product-rating'),
            productPricing: document.getElementById('product-pricing'),
            productDescription: document.getElementById('product-description'),
            productDetails: document.getElementById('product-details'),
            productOptions: document.getElementById('product-options'),
            productFeatures: document.getElementById('product-features'),
            
            // Actions
            quantityMinus: document.getElementById('quantity-minus'),
            quantityInput: document.getElementById('quantity'),
            quantityPlus: document.getElementById('quantity-plus'),
            addToCartBtn: document.getElementById('add-to-cart-btn'),
            customizeBtn: document.getElementById('customize-btn'),
            wishlistBtn: document.getElementById('wishlist-btn'),
            shareBtn: document.getElementById('share-btn'),
            
            // Related products
            relatedProducts: document.getElementById('related-products'),
            relatedGrid: document.getElementById('related-grid')
        };
    }

    setupEventListeners() {
        // Quantity controls
        if (this.elements.quantityMinus) {
            this.elements.quantityMinus.addEventListener('click', () => {
                this.updateQuantity(this.quantity - 1);
            });
        }
        
        if (this.elements.quantityPlus) {
            this.elements.quantityPlus.addEventListener('click', () => {
                this.updateQuantity(this.quantity + 1);
            });
        }
        
        if (this.elements.quantityInput) {
            this.elements.quantityInput.addEventListener('change', (e) => {
                this.updateQuantity(parseInt(e.target.value) || 1);
            });
        }
        
        // Action buttons
        if (this.elements.addToCartBtn) {
            this.elements.addToCartBtn.addEventListener('click', () => {
                this.handleAddToCart();
            });
        }
        
        if (this.elements.customizeBtn) {
            this.elements.customizeBtn.addEventListener('click', () => {
                this.handleCustomize();
            });
        }
        
        if (this.elements.wishlistBtn) {
            this.elements.wishlistBtn.addEventListener('click', () => {
                this.handleWishlist();
            });
        }
        
        if (this.elements.shareBtn) {
            this.elements.shareBtn.addEventListener('click', () => {
                this.handleShare();
            });
        }
        
        // Image zoom
        if (this.elements.zoomBtn) {
            this.elements.zoomBtn.addEventListener('click', () => {
                this.showImageZoom();
            });
        }
        
        if (this.elements.zoomClose) {
            this.elements.zoomClose.addEventListener('click', () => {
                this.hideImageZoom();
            });
        }
        
        if (this.elements.zoomModal) {
            this.elements.zoomModal.addEventListener('click', (e) => {
                if (e.target === this.elements.zoomModal) {
                    this.hideImageZoom();
                }
            });
        }
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.elements.zoomModal.classList.contains('active')) {
                this.hideImageZoom();
            }
        });
    }

    getProductIdFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('id');
    }

    async loadProduct() {
        try {
            this.showLoading();
            
            // Fetch product from inventory service
            const productData = await this.inventoryService.getProduct(this.productId);
            
            if (!productData) {
                this.showErrorState();
                return;
            }
            
            this.product = productData;
            
            // Render product details
            this.renderProduct();
            
            // Load related products
            await this.loadRelatedProducts();
            
            this.hideLoading();
            this.showProduct();
            
        } catch (error) {
            console.error('Failed to load product:', error);
            this.showErrorState();
        }
    }

    renderProduct() {
        if (!this.product) return;
        
        // Update page title and meta
        document.title = `${this.product.name} - Timothie & Co`;
        
        // Update breadcrumb
        this.updateBreadcrumb();
        
        // Render gallery
        this.renderGallery();
        
        // Render product info
        this.renderProductInfo();
        
        // Render pricing
        this.renderPricing();
        
        // Render description
        this.renderDescription();
        
        // Render details
        this.renderDetails();
        
        // Render options
        this.renderOptions();
        
        // Update action buttons
        this.updateActionButtons();
    }

    updateBreadcrumb() {
        if (this.elements.breadcrumbCategory) {
            this.elements.breadcrumbCategory.textContent = this.product.category || 'Jewelry';
            this.elements.breadcrumbCategory.href = `./browse.html?category=${(this.product.category || '').toLowerCase()}`;
        }
        
        if (this.elements.breadcrumbProduct) {
            this.elements.breadcrumbProduct.textContent = this.product.name;
        }
    }

    renderGallery() {
        const images = this.product.images || [this.product.image];
        const defaultImage = '/src/assets/images/ui/011A2614.jpg';
        
        // Main image
        if (this.elements.mainImage) {
            this.elements.mainImage.src = images[0] || defaultImage;
            this.elements.mainImage.alt = this.product.name;
        }
        
        // Status badges
        this.renderStatusBadges();
        
        // Thumbnails
        if (this.elements.galleryThumbnails && images.length > 1) {
            this.elements.galleryThumbnails.innerHTML = images.map((image, index) => `
                <div class="gallery-thumbnail ${index === 0 ? 'active' : ''}" data-index="${index}">
                    <img src="${image || defaultImage}" alt="${this.product.name} view ${index + 1}">
                </div>
            `).join('');
            
            // Add thumbnail click handlers
            this.elements.galleryThumbnails.addEventListener('click', (e) => {
                const thumbnail = e.target.closest('.gallery-thumbnail');
                if (thumbnail) {
                    const index = parseInt(thumbnail.dataset.index);
                    this.selectImage(index);
                }
            });
        }
    }

    renderStatusBadges() {
        if (!this.elements.galleryBadges) return;
        
        const badges = [];
        
        // Stock status
        if (this.product.stock <= 0) {
            badges.push('<div class="gallery-badge out-of-stock">Out of Stock</div>');
        } else if (this.product.stock < 5) {
            badges.push('<div class="gallery-badge low-stock">Low Stock</div>');
        } else {
            badges.push('<div class="gallery-badge in-stock">In Stock</div>');
        }
        
        // Sale badge
        if (this.product.originalPrice && this.product.originalPrice > this.product.price) {
            const discount = Math.round(((this.product.originalPrice - this.product.price) / this.product.originalPrice) * 100);
            badges.push(`<div class="gallery-badge sale">${discount}% Off</div>`);
        }
        
        this.elements.galleryBadges.innerHTML = badges.join('');
    }

    renderProductInfo() {
        if (this.elements.productCategory) {
            this.elements.productCategory.textContent = this.product.category || 'Jewelry';
        }
        
        if (this.elements.productTitle) {
            this.elements.productTitle.textContent = this.product.name;
        }
        
        // Rating
        if (this.elements.productRating && this.product.rating) {
            const rating = this.product.rating;
            const reviewCount = this.product.reviewCount || 0;
            
            this.elements.productRating.innerHTML = `
                <div class="product-stars">${'★'.repeat(Math.floor(rating))}${'☆'.repeat(5 - Math.floor(rating))}</div>
                <span class="product-rating-text">
                    ${rating.toFixed(1)} out of 5 
                    (<a href="#reviews" class="product-rating-link">${reviewCount} reviews</a>)
                </span>
            `;
        }
    }

    renderPricing() {
        if (!this.elements.productPricing) return;
        
        const hasDiscount = this.product.originalPrice && this.product.originalPrice > this.product.price;
        
        let pricingHTML = `
            <div class="product-price">
                $${this.product.price.toFixed(2)}
                ${hasDiscount ? `<span class="product-price-original">$${this.product.originalPrice.toFixed(2)}</span>` : ''}
            </div>
        `;
        
        if (hasDiscount) {
            const discount = Math.round(((this.product.originalPrice - this.product.price) / this.product.originalPrice) * 100);
            pricingHTML += `<div class="product-discount">Save ${discount}%</div>`;
        }
        
        // Add price comparison if available
        if (this.product.compareAtPrice && this.product.compareAtPrice > this.product.price) {
            pricingHTML += `
                <div class="price-comparison">
                    <p class="price-comparison-text">
                        <strong>Compare at $${this.product.compareAtPrice.toFixed(2)}</strong> - 
                        You save $${(this.product.compareAtPrice - this.product.price).toFixed(2)}!
                    </p>
                </div>
            `;
        }
        
        this.elements.productPricing.innerHTML = pricingHTML;
    }

    renderDescription() {
        if (this.elements.productDescription) {
            const description = this.product.description || 'Beautiful handcrafted jewelry piece made with premium materials and attention to detail.';
            this.elements.productDescription.innerHTML = `<p>${description}</p>`;
        }
    }

    renderDetails() {
        if (!this.elements.productDetails) return;
        
        const specs = [
            { label: 'Material', value: this.product.material || 'Sterling Silver' },
            { label: 'Dimensions', value: this.product.dimensions || 'Standard' },
            { label: 'Weight', value: this.product.weight || 'Lightweight' },
            { label: 'Care Instructions', value: 'Clean with soft cloth, store separately' },
            { label: 'SKU', value: this.product.sku || this.product.id }
        ];
        
        this.elements.productDetails.innerHTML = `
            <h3>Product Details</h3>
            <div class="product-specs">
                ${specs.map(spec => `
                    <div class="spec-item">
                        <span class="spec-label">${spec.label}</span>
                        <span class="spec-value">${spec.value}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }

    renderOptions() {
        if (!this.elements.productOptions) return;
        
        // For now, render basic options. This can be expanded based on product data
        const hasOptions = this.product.options && Object.keys(this.product.options).length > 0;
        
        if (!hasOptions) {
            this.elements.productOptions.innerHTML = '';
            return;
        }
        
        let optionsHTML = '';
        
        Object.entries(this.product.options).forEach(([optionName, optionValues]) => {
            optionsHTML += `
                <div class="option-group">
                    <label class="option-label">${optionName}</label>
                    <div class="option-buttons">
                        ${optionValues.map(value => `
                            <button class="option-btn" 
                                    data-option="${optionName}" 
                                    data-value="${value}">
                                ${value}
                            </button>
                        `).join('')}
                    </div>
                </div>
            `;
        });
        
        this.elements.productOptions.innerHTML = optionsHTML;
        
        // Add option click handlers
        this.elements.productOptions.addEventListener('click', (e) => {
            const optionBtn = e.target.closest('.option-btn');
            if (optionBtn) {
                this.selectOption(optionBtn.dataset.option, optionBtn.dataset.value, optionBtn);
            }
        });
    }

    selectOption(optionName, value, button) {
        // Update selected options
        this.selectedOptions[optionName] = value;
        
        // Update UI
        const optionGroup = button.closest('.option-group');
        const allButtons = optionGroup.querySelectorAll('.option-btn');
        allButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        
        // Update pricing if options affect price
        this.updatePricingForOptions();
    }

    updatePricingForOptions() {
        // This can be expanded to handle price variations based on options
        // For now, we'll keep the base price
    }

    selectImage(index) {
        this.currentImage = index;
        const images = this.product.images || [this.product.image];
        
        // Update main image
        if (this.elements.mainImage) {
            this.elements.mainImage.src = images[index] || '/src/assets/images/ui/011A2614.jpg';
        }
        
        // Update thumbnail active state
        const thumbnails = this.elements.galleryThumbnails?.querySelectorAll('.gallery-thumbnail');
        thumbnails?.forEach((thumb, i) => {
            thumb.classList.toggle('active', i === index);
        });
    }

    updateQuantity(newQuantity) {
        const maxStock = this.product?.stock || 10;
        this.quantity = Math.max(1, Math.min(newQuantity, maxStock));
        
        if (this.elements.quantityInput) {
            this.elements.quantityInput.value = this.quantity;
        }
        
        // Update quantity button states
        if (this.elements.quantityMinus) {
            this.elements.quantityMinus.disabled = this.quantity <= 1;
        }
        
        if (this.elements.quantityPlus) {
            this.elements.quantityPlus.disabled = this.quantity >= maxStock;
        }
    }

    updateActionButtons() {
        if (!this.product) return;
        
        const isOutOfStock = this.product.stock <= 0;
        
        if (this.elements.addToCartBtn) {
            this.elements.addToCartBtn.disabled = isOutOfStock;
            if (isOutOfStock) {
                this.elements.addToCartBtn.innerHTML = `
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10 2L3 7v11a2 2 0 002 2h10a2 2 0 002-2V7l-7-5z"/>
                        <path d="M8 11l2 2 4-4"/>
                    </svg>
                    Out of Stock
                `;
            }
        }
    }

    async handleAddToCart() {
        if (!this.product || this.product.stock <= 0) return;
        
        const button = this.elements.addToCartBtn;
        const originalHTML = button.innerHTML;
        
        // Add loading state
        button.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor" class="animate-spin">
                <circle cx="10" cy="10" r="8" stroke="currentColor" stroke-width="2" fill="none" stroke-dasharray="50.265" stroke-dashoffset="50.265">
                    <animate attributeName="stroke-dasharray" dur="2s" values="0 50.265;25.133 25.133;0 50.265" repeatCount="indefinite"/>
                    <animate attributeName="stroke-dashoffset" dur="2s" values="0;-25.133;-50.265" repeatCount="indefinite"/>
                </circle>
            </svg>
            Adding...
        `;
        button.disabled = true;

        try {
            await this.cartManager.addItem({
                id: this.product.id,
                name: this.product.name,
                price: this.product.price,
                image: this.product.image,
                category: this.product.category,
                quantity: this.quantity,
                customizations: Object.keys(this.selectedOptions).length > 0 ? this.selectedOptions : null
            });
            
            // Success state
            button.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                </svg>
                Added to Cart!
            `;
            button.style.background = '#22c55e';
            
            setTimeout(() => {
                button.innerHTML = originalHTML;
                button.disabled = false;
                button.style.background = '';
            }, 2000);
            
            this.showNotification('Added to cart successfully!', 'success');
            
        } catch (error) {
            console.error('Failed to add item to cart:', error);
            
            // Error state
            button.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"/>
                </svg>
                Error
            `;
            button.style.background = '#ef4444';
            
            setTimeout(() => {
                button.innerHTML = originalHTML;
                button.disabled = false;
                button.style.background = '';
            }, 2000);
            
            this.showNotification('Failed to add item to cart', 'error');
        }
    }

    handleCustomize() {
        if (!this.product) return;
        
        // Redirect to customizer with pre-selected product
        const customizerURL = new URL('./index.html', window.location.origin);
        customizerURL.searchParams.set('preselect', this.product.id);
        customizerURL.searchParams.set('category', this.product.category);
        
        // Include selected options
        if (Object.keys(this.selectedOptions).length > 0) {
            customizerURL.searchParams.set('options', JSON.stringify(this.selectedOptions));
        }
        
        window.location.href = customizerURL.toString();
    }

    handleWishlist() {
        const button = this.elements.wishlistBtn;
        const isActive = button.classList.contains('active');
        
        if (isActive) {
            button.classList.remove('active');
            button.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 17.5L8.75 16.3C5.5 13.36 3.5 11.55 3.5 9.3c0-1.65 1.35-3 3-3 .99 0 1.98.51 2.5 1.3.52-.79 1.51-1.3 2.5-1.3 1.65 0 3 1.35 3 3 0 2.25-2 4.06-5.25 7L10 17.5z"/>
                </svg>
                Add to Wishlist
            `;
            this.showNotification('Removed from wishlist', 'info');
        } else {
            button.classList.add('active');
            button.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 17.5L8.75 16.3C5.5 13.36 3.5 11.55 3.5 9.3c0-1.65 1.35-3 3-3 .99 0 1.98.51 2.5 1.3.52-.79 1.51-1.3 2.5-1.3 1.65 0 3 1.35 3 3 0 2.25-2 4.06-5.25 7L10 17.5z"/>
                </svg>
                Added to Wishlist
            `;
            this.showNotification('Added to wishlist', 'success');
        }
        
        // Animation effect
        button.style.transform = 'scale(1.1)';
        setTimeout(() => {
            button.style.transform = '';
        }, 150);
    }

    async handleShare() {
        const shareData = {
            title: this.product.name,
            text: `Check out this beautiful ${this.product.name} from Timothie & Co`,
            url: window.location.href
        };
        
        if (navigator.share) {
            try {
                await navigator.share(shareData);
                this.showNotification('Shared successfully!', 'success');
            } catch (error) {
                if (error.name !== 'AbortError') {
                    this.fallbackShare();
                }
            }
        } else {
            this.fallbackShare();
        }
    }

    fallbackShare() {
        // Copy URL to clipboard
        navigator.clipboard.writeText(window.location.href).then(() => {
            this.showNotification('Link copied to clipboard!', 'success');
        }).catch(() => {
            this.showNotification('Unable to share', 'error');
        });
    }

    showImageZoom() {
        if (!this.elements.zoomModal || !this.elements.zoomImage) return;
        
        const currentImage = this.product.images?.[this.currentImage] || this.product.image;
        this.elements.zoomImage.src = currentImage;
        this.elements.zoomModal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    hideImageZoom() {
        if (!this.elements.zoomModal) return;
        
        this.elements.zoomModal.classList.remove('active');
        document.body.style.overflow = '';
    }

    async loadRelatedProducts() {
        try {
            // Get related products from the same category
            const response = await this.inventoryService.getProducts({
                category: this.product.category,
                excludeIds: [this.product.id],
                limit: 4
            });
            
            this.relatedProducts = response.products || [];
            this.renderRelatedProducts();
            
        } catch (error) {
            console.error('Failed to load related products:', error);
        }
    }

    renderRelatedProducts() {
        if (!this.elements.relatedProducts || !this.elements.relatedGrid) return;
        
        if (this.relatedProducts.length === 0) {
            this.elements.relatedProducts.style.display = 'none';
            return;
        }
        
        // Initialize product grid for related products
        const relatedGrid = new ProductGrid(this.elements.relatedGrid, {
            onProductClick: (product) => {
                window.location.href = `./product.html?id=${product.id}`;
            },
            onAddToCart: async (product) => {
                try {
                    await this.cartManager.addItem({
                        id: product.id,
                        name: product.name,
                        price: product.price,
                        image: product.image,
                        category: product.category,
                        quantity: 1
                    });
                    this.showNotification('Added to cart successfully!', 'success');
                } catch (error) {
                    this.showNotification('Failed to add item to cart', 'error');
                }
            },
            onCustomize: (product) => {
                const customizerURL = new URL('./index.html', window.location.origin);
                customizerURL.searchParams.set('preselect', product.id);
                customizerURL.searchParams.set('category', product.category);
                window.location.href = customizerURL.toString();
            },
            cartManager: this.cartManager
        });
        
        relatedGrid.render(this.relatedProducts);
        this.elements.relatedProducts.style.display = 'block';
    }

    // UI State Management
    showLoading() {
        if (this.elements.loadingContainer) {
            this.elements.loadingContainer.style.display = 'flex';
        }
        if (this.elements.productDetail) {
            this.elements.productDetail.style.display = 'none';
        }
        if (this.elements.errorState) {
            this.elements.errorState.style.display = 'none';
        }
    }

    hideLoading() {
        if (this.elements.loadingContainer) {
            this.elements.loadingContainer.style.display = 'none';
        }
    }

    showProduct() {
        if (this.elements.productDetail) {
            this.elements.productDetail.style.display = 'block';
        }
    }

    showErrorState() {
        this.hideLoading();
        if (this.elements.productDetail) {
            this.elements.productDetail.style.display = 'none';
        }
        if (this.elements.errorState) {
            this.elements.errorState.style.display = 'block';
        }
    }

    showNotification(message, type = 'info') {
        // Create and show notification toast
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            position: fixed;
            top: var(--spacing-md);
            right: var(--spacing-md);
            background: ${type === 'success' ? 'var(--accent-coral)' : type === 'error' ? '#ef4444' : 'var(--neutral-charcoal)'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: var(--radius-sm);
            box-shadow: 0 8px 32px rgba(18, 18, 18, 0.15);
            z-index: 1000;
            font-family: var(--font-primary);
            font-weight: 500;
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Auto remove
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    initializeImages() {
        // Update logo
        const navLogo = document.querySelector('.nav-logo');
        if (navLogo && homeImages.logoHorizontal) {
            navLogo.src = homeImages.logoHorizontal;
        }
    }
}

// =============================================================================
// Initialize Product Page
// =============================================================================
document.addEventListener('DOMContentLoaded', () => {
    new ProductDetailManager();
});

// =============================================================================
// Export for potential use in other modules
// =============================================================================
export { ProductDetailManager };