// =============================================================================
// Timothie & Co Browse Page JavaScript - Simplified Version
// Temporary version without cart/product dependencies
// =============================================================================

import '../css/browse.css';
import { homeImages } from './utils/homeImages.js';

// =============================================================================
// Simple Logo Loader
// =============================================================================
class SimpleImageLoader {
    constructor() {
        this.images = homeImages;
        this.init();
    }

    init() {
        // Load logo
        const navLogo = document.querySelector('.nav-logo');
        if (navLogo && this.images.logoHorizontal) {
            navLogo.src = this.images.logoHorizontal;
        }

        // Simple products display
        this.displaySampleProducts();
    }

    displaySampleProducts() {
        const productsGrid = document.getElementById('products-grid');
        const loadingContainer = document.getElementById('loading-container');
        
        if (!productsGrid) return;

        // Hide loading
        if (loadingContainer) {
            loadingContainer.style.display = 'none';
        }

        // Show sample products
        const sampleProducts = [
            {
                name: 'Gold Chain Necklace',
                price: '$89.99',
                image: this.images.artisanCraftsmanship
            },
            {
                name: 'Silver Charm',
                price: '$29.99',
                image: this.images.premiumMaterials
            },
            {
                name: 'Custom Bracelet',
                price: '$59.99',
                image: this.images.meaningfulDesigns
            }
        ];

        productsGrid.innerHTML = sampleProducts.map(product => `
            <div class="product-card">
                <div class="product-image-container">
                    <img src="${product.image || ''}" alt="${product.name}" class="product-image">
                    <button class="quick-add-btn">Quick Add</button>
                </div>
                <div class="product-info">
                    <h3 class="product-title">${product.name}</h3>
                    <p class="product-price">${product.price}</p>
                </div>
            </div>
        `).join('');
    }
}

// =============================================================================
// Initialize on DOM Ready
// =============================================================================
document.addEventListener('DOMContentLoaded', () => {
    new SimpleImageLoader();
    console.log('Browse page initialized (simplified version)');
});