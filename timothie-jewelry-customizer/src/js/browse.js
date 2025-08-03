// =============================================================================
// Timothie & Co Browse Page JavaScript
// Complete product browsing experience with cart integration
// =============================================================================

import '../css/browse.css';
import { homeImages } from './utils/homeImages.js';
// Temporarily disable cart and product components until dependencies are fixed
// import CartIcon from './components/CartIcon.js';
// import CartManager from './core/CartManager.js';
// import { InventoryService } from './services/InventoryService.js';
// import { ProductGrid } from './components/ProductGrid.js';
// import { ProductCard } from './components/ProductCard.js';
// import { ProductFilter } from './components/ProductFilter.js';

// =============================================================================
// Browse Page Manager
// =============================================================================
class BrowsePageManager {
    constructor() {
        // Core services
        this.cartManager = null;
        this.inventoryService = null;
        this.cartIcon = null;
        
        // Components
        this.productGrid = null;
        this.productFilter = null;
        
        // State management
        this.currentFilters = {
            category: null,
            priceMin: null,
            priceMax: null,
            materials: [],
            inStockOnly: true,
            search: '',
            sortBy: 'featured'
        };
        
        this.currentPage = 1;
        this.itemsPerPage = 12;
        this.totalItems = 0;
        this.products = [];
        this.allProducts = [];
        
        // DOM elements
        this.elements = {};
        
        this.init();
    }

    async init() {
        try {
            // Initialize services
            await this.initializeServices();
            
            // Cache DOM elements
            this.cacheElements();
            
            // Set up URL parameters
            this.handleURLParameters();
            
            // Initialize components
            this.initializeComponents();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Load initial data
            await this.loadProducts();
            
            // Initialize image manager
            this.initializeImages();
            
            console.log('Browse page initialized successfully');
        } catch (error) {
            console.error('Failed to initialize browse page:', error);
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
            // Header elements
            browseTitle: document.getElementById('browse-title'),
            browseSubtitle: document.getElementById('browse-subtitle'),
            browseStats: document.getElementById('browse-stats'),
            
            // Search elements
            searchToggle: document.getElementById('search-toggle'),
            searchOverlay: document.getElementById('search-overlay'),
            searchClose: document.getElementById('search-close'),
            searchInput: document.getElementById('search-input'),
            searchResults: document.getElementById('search-results'),
            
            // Filter elements
            filtersSidebar: document.getElementById('filters-sidebar'),
            filtersToggle: document.getElementById('filters-mobile-toggle'),
            filtersClear: document.getElementById('filters-clear'),
            categoryFilters: document.getElementById('category-filters'),
            materialFilters: document.getElementById('material-filters'),
            priceMin: document.getElementById('price-min'),
            priceMax: document.getElementById('price-max'),
            priceRangeMin: document.getElementById('price-range-min'),
            priceRangeMax: document.getElementById('price-range-max'),
            filterInStock: document.getElementById('filter-in-stock'),
            
            // Browse controls
            sortSelect: document.getElementById('sort-select'),
            viewToggles: document.querySelectorAll('.view-toggle'),
            
            // Content elements
            loadingContainer: document.getElementById('loading-container'),
            productsContainer: document.getElementById('products-container'),
            productsGrid: document.getElementById('products-grid'),
            paginationContainer: document.getElementById('pagination-container'),
            
            // Breadcrumb
            breadcrumbCurrent: document.querySelector('.breadcrumb-current')
        };
    }

    handleURLParameters() {
        const urlParams = new URLSearchParams(window.location.search);
        
        // Handle category filter from URL
        const category = urlParams.get('category');
        if (category) {
            this.currentFilters.category = category;
            this.updatePageTitle(category);
            this.updateBreadcrumb(category);
        }
        
        // Handle other URL parameters
        const search = urlParams.get('search');
        if (search) {
            this.currentFilters.search = search;
            if (this.elements.searchInput) {
                this.elements.searchInput.value = search;
            }
        }
        
        const sort = urlParams.get('sort');
        if (sort && this.elements.sortSelect) {
            this.elements.sortSelect.value = sort;
            this.currentFilters.sortBy = sort;
        }
    }

    updatePageTitle(category) {
        const categoryTitles = {
            chains: { title: 'Chain Collection', subtitle: 'Discover our beautiful collection of chains for your custom jewelry' },
            charms: { title: 'Charm Collection', subtitle: 'Find the perfect charms to tell your unique story' },
            collections: { title: 'Featured Collections', subtitle: 'Curated jewelry sets and themed collections' },
            necklaces: { title: 'Necklace Collection', subtitle: 'Elegant necklaces for every occasion' },
            bracelets: { title: 'Bracelet Collection', subtitle: 'Beautiful bracelets to complement your style' },
            earrings: { title: 'Earring Collection', subtitle: 'Stunning earrings to complete your look' }
        };
        
        const categoryInfo = categoryTitles[category] || { 
            title: 'Our Collection', 
            subtitle: 'Discover beautiful jewelry pieces to create your unique story' 
        };
        
        if (this.elements.browseTitle) {
            this.elements.browseTitle.textContent = categoryInfo.title;
        }
        if (this.elements.browseSubtitle) {
            this.elements.browseSubtitle.textContent = categoryInfo.subtitle;
        }
        
        // Update page title
        document.title = `${categoryInfo.title} - Timothie & Co`;
    }

    updateBreadcrumb(category) {
        if (this.elements.breadcrumbCurrent && category) {
            const categoryNames = {
                chains: 'Chains',
                charms: 'Charms',
                collections: 'Collections',
                necklaces: 'Necklaces',
                bracelets: 'Bracelets',
                earrings: 'Earrings'
            };
            this.elements.breadcrumbCurrent.textContent = categoryNames[category] || 'Browse';
        }
    }

    initializeComponents() {
        // Initialize product grid component
        this.productGrid = new ProductGrid(this.elements.productsGrid, {
            onProductClick: this.handleProductClick.bind(this),
            onAddToCart: this.handleAddToCart.bind(this),
            onCustomize: this.handleCustomize.bind(this),
            cartManager: this.cartManager
        });

        // Initialize product filter component
        this.productFilter = new ProductFilter(this.elements.filtersSidebar, {
            onFilterChange: this.handleFilterChange.bind(this),
            initialFilters: this.currentFilters
        });
    }

    setupEventListeners() {
        // Search functionality
        if (this.elements.searchToggle) {
            this.elements.searchToggle.addEventListener('click', (e) => {
                e.preventDefault();
                this.toggleSearch();
            });
        }
        
        if (this.elements.searchClose) {
            this.elements.searchClose.addEventListener('click', () => {
                this.closeSearch();
            });
        }
        
        if (this.elements.searchInput) {
            this.elements.searchInput.addEventListener('input', this.debounce((e) => {
                this.handleSearch(e.target.value);
            }, 300));
        }
        
        // Filter controls
        if (this.elements.filtersClear) {
            this.elements.filtersClear.addEventListener('click', () => {
                this.clearAllFilters();
            });
        }
        
        if (this.elements.filtersToggle) {
            this.elements.filtersToggle.addEventListener('click', () => {
                this.toggleMobileFilters();
            });
        }
        
        // Sort controls
        if (this.elements.sortSelect) {
            this.elements.sortSelect.addEventListener('change', (e) => {
                this.handleSortChange(e.target.value);
            });
        }
        
        // View toggles
        this.elements.viewToggles.forEach(toggle => {
            toggle.addEventListener('click', (e) => {
                this.handleViewChange(e.target.dataset.view);
            });
        });
        
        // Price range inputs
        if (this.elements.priceMin) {
            this.elements.priceMin.addEventListener('change', (e) => {
                this.handlePriceChange('min', e.target.value);
            });
        }
        
        if (this.elements.priceMax) {
            this.elements.priceMax.addEventListener('change', (e) => {
                this.handlePriceChange('max', e.target.value);
            });
        }
        
        // Stock filter
        if (this.elements.filterInStock) {
            this.elements.filterInStock.addEventListener('change', (e) => {
                this.currentFilters.inStockOnly = e.target.checked;
                this.applyFilters();
            });
        }
        
        // Close search overlay on outside click
        if (this.elements.searchOverlay) {
            this.elements.searchOverlay.addEventListener('click', (e) => {
                if (e.target === this.elements.searchOverlay) {
                    this.closeSearch();
                }
            });
        }
        
        // Close mobile filters on outside click
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 1024 && 
                this.elements.filtersSidebar && 
                this.elements.filtersSidebar.classList.contains('mobile-active') &&
                !this.elements.filtersSidebar.contains(e.target) &&
                !this.elements.filtersToggle.contains(e.target)) {
                this.closeMobileFilters();
            }
        });
    }

    async loadProducts() {
        try {
            this.showLoading();
            
            // Fetch products from inventory service
            const response = await this.inventoryService.getProducts({
                includeOutOfStock: !this.currentFilters.inStockOnly,
                category: this.currentFilters.category
            });
            
            this.allProducts = response.products || [];
            this.applyFilters();
            
        } catch (error) {
            console.error('Failed to load products:', error);
            this.showErrorState();
        }
    }

    applyFilters() {
        let filtered = [...this.allProducts];
        
        // Apply category filter
        if (this.currentFilters.category) {
            filtered = filtered.filter(product => 
                product.category?.toLowerCase() === this.currentFilters.category.toLowerCase()
            );
        }
        
        // Apply search filter
        if (this.currentFilters.search) {
            const searchTerm = this.currentFilters.search.toLowerCase();
            filtered = filtered.filter(product =>
                product.name?.toLowerCase().includes(searchTerm) ||
                product.description?.toLowerCase().includes(searchTerm) ||
                product.category?.toLowerCase().includes(searchTerm) ||
                product.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
            );
        }
        
        // Apply price filters
        if (this.currentFilters.priceMin !== null) {
            filtered = filtered.filter(product => product.price >= this.currentFilters.priceMin);
        }
        
        if (this.currentFilters.priceMax !== null) {
            filtered = filtered.filter(product => product.price <= this.currentFilters.priceMax);
        }
        
        // Apply material filters
        if (this.currentFilters.materials.length > 0) {
            filtered = filtered.filter(product =>
                this.currentFilters.materials.some(material =>
                    product.material?.toLowerCase().includes(material.toLowerCase()) ||
                    product.tags?.some(tag => tag.toLowerCase().includes(material.toLowerCase()))
                )
            );
        }
        
        // Apply stock filter
        if (this.currentFilters.inStockOnly) {
            filtered = filtered.filter(product => product.stock > 0);
        }
        
        // Apply sorting
        this.sortProducts(filtered);
        
        this.products = filtered;
        this.totalItems = filtered.length;
        this.currentPage = 1;
        
        this.updateStats();
        this.renderProducts();
        this.renderPagination();
        this.hideLoading();
    }

    sortProducts(products) {
        switch (this.currentFilters.sortBy) {
            case 'price-low':
                products.sort((a, b) => a.price - b.price);
                break;
            case 'price-high':
                products.sort((a, b) => b.price - a.price);
                break;
            case 'name':
                products.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'newest':
                products.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                break;
            default: // featured
                // Keep original order or apply featured logic
                break;
        }
    }

    renderProducts() {
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageProducts = this.products.slice(startIndex, endIndex);
        
        if (this.productGrid) {
            this.productGrid.render(pageProducts);
        }
    }

    renderPagination() {
        if (!this.elements.paginationContainer) return;
        
        const totalPages = Math.ceil(this.totalItems / this.itemsPerPage);
        
        if (totalPages <= 1) {
            this.elements.paginationContainer.innerHTML = '';
            return;
        }
        
        let paginationHTML = '';
        
        // Previous button
        paginationHTML += `
            <button class="pagination-btn" ${this.currentPage === 1 ? 'disabled' : ''} 
                    onclick="browseManager.goToPage(${this.currentPage - 1})">
                ← Previous
            </button>
        `;
        
        // Page numbers
        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(totalPages, this.currentPage + 2);
        
        if (startPage > 1) {
            paginationHTML += `<button class="pagination-btn" onclick="browseManager.goToPage(1)">1</button>`;
            if (startPage > 2) {
                paginationHTML += `<span class="pagination-info">...</span>`;
            }
        }
        
        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <button class="pagination-btn ${i === this.currentPage ? 'active' : ''}" 
                        onclick="browseManager.goToPage(${i})">
                    ${i}
                </button>
            `;
        }
        
        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                paginationHTML += `<span class="pagination-info">...</span>`;
            }
            paginationHTML += `<button class="pagination-btn" onclick="browseManager.goToPage(${totalPages})">${totalPages}</button>`;
        }
        
        // Next button
        paginationHTML += `
            <button class="pagination-btn" ${this.currentPage === totalPages ? 'disabled' : ''} 
                    onclick="browseManager.goToPage(${this.currentPage + 1})">
                Next →
            </button>
        `;
        
        // Page info
        const startItem = (this.currentPage - 1) * this.itemsPerPage + 1;
        const endItem = Math.min(this.currentPage * this.itemsPerPage, this.totalItems);
        paginationHTML += `
            <div class="pagination-info">
                Showing ${startItem}-${endItem} of ${this.totalItems} products
            </div>
        `;
        
        this.elements.paginationContainer.innerHTML = paginationHTML;
    }

    goToPage(page) {
        if (page < 1 || page > Math.ceil(this.totalItems / this.itemsPerPage)) return;
        
        this.currentPage = page;
        this.renderProducts();
        this.renderPagination();
        
        // Scroll to top of products
        this.elements.productsContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    updateStats() {
        if (this.elements.browseStats) {
            const statsText = this.totalItems === 1 
                ? '1 product found' 
                : `${this.totalItems} products found`;
            this.elements.browseStats.innerHTML = `<span class="stats-text">${statsText}</span>`;
        }
    }

    // Event Handlers
    handleProductClick(product) {
        // Navigate to product detail page
        window.location.href = `./product.html?id=${product.id}`;
    }

    async handleAddToCart(product, options = {}) {
        try {
            await this.cartManager.addItem({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image,
                category: product.category,
                quantity: options.quantity || 1,
                customizations: options.customizations || null
            });
            
            // Show success feedback
            this.showNotification('Added to cart successfully!', 'success');
            
        } catch (error) {
            console.error('Failed to add item to cart:', error);
            this.showNotification('Failed to add item to cart', 'error');
        }
    }

    handleCustomize(product) {
        // Redirect to customizer with pre-selected product
        const customizerURL = new URL('./index.html', window.location.origin);
        customizerURL.searchParams.set('preselect', product.id);
        customizerURL.searchParams.set('category', product.category);
        window.location.href = customizerURL.toString();
    }

    handleFilterChange(filters) {
        this.currentFilters = { ...this.currentFilters, ...filters };
        this.applyFilters();
        this.updateURL();
    }

    handleSearch(searchTerm) {
        this.currentFilters.search = searchTerm;
        this.applyFilters();
        this.updateURL();
    }

    handleSortChange(sortBy) {
        this.currentFilters.sortBy = sortBy;
        this.applyFilters();
        this.updateURL();
    }

    handleViewChange(view) {
        // Update active view toggle
        this.elements.viewToggles.forEach(toggle => {
            toggle.classList.toggle('active', toggle.dataset.view === view);
        });
        
        // Update grid class
        if (this.elements.productsGrid) {
            this.elements.productsGrid.classList.toggle('list-view', view === 'list');
        }
    }

    handlePriceChange(type, value) {
        const numValue = value ? parseFloat(value) : null;
        
        if (type === 'min') {
            this.currentFilters.priceMin = numValue;
        } else {
            this.currentFilters.priceMax = numValue;
        }
        
        this.applyFilters();
        this.updateURL();
    }

    // Search functionality
    toggleSearch() {
        if (this.elements.searchOverlay) {
            this.elements.searchOverlay.classList.add('active');
            setTimeout(() => {
                if (this.elements.searchInput) {
                    this.elements.searchInput.focus();
                }
            }, 100);
        }
    }

    closeSearch() {
        if (this.elements.searchOverlay) {
            this.elements.searchOverlay.classList.remove('active');
        }
    }

    // Mobile filters
    toggleMobileFilters() {
        if (this.elements.filtersSidebar) {
            this.elements.filtersSidebar.classList.toggle('mobile-active');
        }
    }

    closeMobileFilters() {
        if (this.elements.filtersSidebar) {
            this.elements.filtersSidebar.classList.remove('mobile-active');
        }
    }

    clearAllFilters() {
        this.currentFilters = {
            category: this.currentFilters.category, // Keep category from URL
            priceMin: null,
            priceMax: null,
            materials: [],
            inStockOnly: true,
            search: '',
            sortBy: 'featured'
        };
        
        // Reset form inputs
        if (this.elements.searchInput) this.elements.searchInput.value = '';
        if (this.elements.priceMin) this.elements.priceMin.value = '';
        if (this.elements.priceMax) this.elements.priceMax.value = '';
        if (this.elements.sortSelect) this.elements.sortSelect.value = 'featured';
        if (this.elements.filterInStock) this.elements.filterInStock.checked = true;
        
        // Clear material filters
        const materialCheckboxes = this.elements.materialFilters?.querySelectorAll('input[type="checkbox"]');
        materialCheckboxes?.forEach(checkbox => checkbox.checked = false);
        
        this.applyFilters();
        this.updateURL();
    }

    updateURL() {
        const url = new URL(window.location);
        
        // Update URL parameters
        if (this.currentFilters.category) {
            url.searchParams.set('category', this.currentFilters.category);
        } else {
            url.searchParams.delete('category');
        }
        
        if (this.currentFilters.search) {
            url.searchParams.set('search', this.currentFilters.search);
        } else {
            url.searchParams.delete('search');
        }
        
        if (this.currentFilters.sortBy !== 'featured') {
            url.searchParams.set('sort', this.currentFilters.sortBy);
        } else {
            url.searchParams.delete('sort');
        }
        
        window.history.replaceState({}, '', url);
    }

    // UI State Management
    showLoading() {
        if (this.elements.loadingContainer) {
            this.elements.loadingContainer.style.display = 'flex';
        }
        if (this.elements.productsContainer) {
            this.elements.productsContainer.style.display = 'none';
        }
    }

    hideLoading() {
        if (this.elements.loadingContainer) {
            this.elements.loadingContainer.style.display = 'none';
        }
        if (this.elements.productsContainer) {
            this.elements.productsContainer.style.display = 'block';
        }
    }

    showErrorState() {
        this.hideLoading();
        if (this.elements.productsGrid) {
            this.elements.productsGrid.innerHTML = `
                <div class="error-state" style="
                    grid-column: 1 / -1;
                    text-align: center;
                    padding: var(--spacing-xl);
                    color: var(--warm-gray);
                ">
                    <h3>Oops! Something went wrong</h3>
                    <p>We're having trouble loading our products. Please try refreshing the page.</p>
                    <button onclick="window.location.reload()" class="btn-add-to-cart" style="margin-top: 1rem;">
                        Refresh Page
                    </button>
                </div>
            `;
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
            background: ${type === 'success' ? 'var(--accent-coral)' : '#ef4444'};
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

    // Utility function for debouncing
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// =============================================================================
// Initialize Browse Page
// =============================================================================
let browseManager;

document.addEventListener('DOMContentLoaded', () => {
    browseManager = new BrowsePageManager();
    
    // Make browseManager globally available for pagination
    window.browseManager = browseManager;
});

// =============================================================================
// Export for potential use in other modules
// =============================================================================
export { BrowsePageManager };