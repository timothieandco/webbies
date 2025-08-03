/**
 * LocalInventoryService.js
 * 
 * Fallback inventory service that uses local sample data and localStorage persistence.
 * This service provides the same interface as the real InventoryService but works
 * entirely offline with sample charm and necklace data.
 */

import { charmImages, necklaceImages } from '../utils/images.js';
import AppConfig from '../config/AppConfig.js';

class LocalInventoryService {
    constructor() {
        this.storageKey = AppConfig.get('storage.prefix') + 'local_inventory';
        this.cacheKey = AppConfig.get('storage.prefix') + 'inventory_cache';
        this.inventory = [];
        this.categories = new Set();
        this.initialized = false;
    }

    /**
     * Initialize the service with sample data
     */
    async initialize() {
        if (this.initialized) {
            return;
        }

        // Load cached inventory or create from sample data
        await this.loadInventory();
        
        this.initialized = true;
        console.log('✅ LocalInventoryService initialized with', this.inventory.length, 'items');
    }

    /**
     * Load inventory from cache or create from sample data
     */
    async loadInventory() {
        try {
            // Try to load from localStorage cache
            const cached = localStorage.getItem(this.cacheKey);
            if (cached) {
                const cachedData = JSON.parse(cached);
                if (this.isCacheValid(cachedData)) {
                    this.inventory = cachedData.inventory;
                    this.categories = new Set(cachedData.categories);
                    return;
                }
            }
        } catch (error) {
            console.warn('Failed to load cached inventory:', error);
        }

        // Create inventory from sample data
        this.createSampleInventory();
        
        // Cache the inventory
        this.cacheInventory();
    }

    /**
     * Create inventory from sample charm and necklace images
     */
    createSampleInventory() {
        this.inventory = [];
        this.categories.clear();

        // Add charms
        Object.entries(charmImages).forEach(([key, url], index) => {
            const charm = {
                id: `charm_${key}`,
                name: this.formatName(key),
                description: `Beautiful ${this.formatName(key)} charm for your custom jewelry`,
                image_url: url,
                category: 'charms',
                subcategory: this.getCharmSubcategory(key),
                price: this.generatePrice(15, 45),
                in_stock: true,
                stock_quantity: Math.floor(Math.random() * 20) + 5,
                type: 'charm',
                tags: this.generateTags(key),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            
            this.inventory.push(charm);
            this.categories.add('charms');
        });

        // Add necklaces
        Object.entries(necklaceImages).forEach(([key, url], index) => {
            const necklace = {
                id: `necklace_${key}`,
                name: this.formatName(key),
                description: `Elegant ${this.formatName(key)} necklace base`,
                image_url: url,
                category: 'necklaces',
                subcategory: 'chains',
                price: this.generatePrice(25, 75),
                in_stock: true,
                stock_quantity: Math.floor(Math.random() * 15) + 3,
                type: 'necklace',
                tags: this.generateTags(key),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            
            this.inventory.push(necklace);
            this.categories.add('necklaces');
        });

        // Add some additional sample categories for completeness
        this.addSampleBracelets();
        this.addSampleEarrings();
    }

    /**
     * Add sample bracelet data
     */
    addSampleBracelets() {
        const bracelets = [
            { name: 'Silver Chain Bracelet', price: 35 },
            { name: 'Gold Charm Bracelet', price: 55 },
            { name: 'Leather Cord Bracelet', price: 25 }
        ];

        bracelets.forEach((bracelet, index) => {
            const item = {
                id: `bracelet_${index}`,
                name: bracelet.name,
                description: `Stylish ${bracelet.name.toLowerCase()} for custom charm addition`,
                image_url: '/src/assets/images/placeholder-bracelet.png',
                category: 'bracelets',
                subcategory: 'chains',
                price: bracelet.price,
                in_stock: true,
                stock_quantity: Math.floor(Math.random() * 10) + 2,
                type: 'bracelet',
                tags: ['bracelet', 'chain', 'customizable'],
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            
            this.inventory.push(item);
            this.categories.add('bracelets');
        });
    }

    /**
     * Add sample earring data
     */
    addSampleEarrings() {
        const earrings = [
            { name: 'Sterling Silver Hoops', price: 28 },
            { name: 'Pearl Drop Earrings', price: 42 }
        ];

        earrings.forEach((earring, index) => {
            const item = {
                id: `earring_${index}`,
                name: earring.name,
                description: `Elegant ${earring.name.toLowerCase()}`,
                image_url: '/src/assets/images/placeholder-earring.png',
                category: 'earrings',
                subcategory: 'drops',
                price: earring.price,
                in_stock: true,
                stock_quantity: Math.floor(Math.random() * 8) + 1,
                type: 'earring',
                tags: ['earring', 'elegant'],
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };
            
            this.inventory.push(item);
            this.categories.add('earrings');
        });
    }

    /**
     * Get all inventory items
     * @param {Object} options - Query options
     * @returns {Promise<Array>}
     */
    async getInventory(options = {}) {
        const {
            category = null,
            limit = null,
            offset = 0,
            sortBy = 'name',
            sortOrder = 'asc'
        } = options;

        let items = [...this.inventory];

        // Filter by category
        if (category) {
            items = items.filter(item => item.category === category);
        }

        // Sort
        items.sort((a, b) => {
            const aVal = a[sortBy] || '';
            const bVal = b[sortBy] || '';
            
            if (sortOrder === 'desc') {
                return bVal.toString().localeCompare(aVal.toString());
            }
            return aVal.toString().localeCompare(bVal.toString());
        });

        // Apply pagination
        if (limit) {
            items = items.slice(offset, offset + limit);
        }

        return items;
    }

    /**
     * Get items by category
     * @param {string} category
     * @returns {Promise<Array>}
     */
    async getByCategory(category) {
        return this.inventory.filter(item => item.category === category);
    }

    /**
     * Get all charms
     * @returns {Promise<Array>}
     */
    async getCharms() {
        return this.getByCategory('charms');
    }

    /**
     * Get all necklaces
     * @returns {Promise<Array>}
     */
    async getNecklaces() {
        return this.getByCategory('necklaces');
    }

    /**
     * Get all bracelets
     * @returns {Promise<Array>}
     */
    async getBracelets() {
        return this.getByCategory('bracelets');
    }

    /**
     * Search inventory
     * @param {string} query - Search query
     * @param {Object} options - Search options
     * @returns {Promise<Array>}
     */
    async search(query, options = {}) {
        const {
            category = null,
            limit = 20,
            includeOutOfStock = false
        } = options;

        if (!query || query.length < 2) {
            return [];
        }

        const searchTerm = query.toLowerCase();
        
        let results = this.inventory.filter(item => {
            // Category filter
            if (category && item.category !== category) {
                return false;
            }

            // Stock filter
            if (!includeOutOfStock && !item.in_stock) {
                return false;
            }

            // Text search
            return (
                item.name.toLowerCase().includes(searchTerm) ||
                item.description.toLowerCase().includes(searchTerm) ||
                item.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
                item.category.toLowerCase().includes(searchTerm) ||
                item.subcategory.toLowerCase().includes(searchTerm)
            );
        });

        // Sort by relevance (name matches first)
        results.sort((a, b) => {
            const aNameMatch = a.name.toLowerCase().includes(searchTerm);
            const bNameMatch = b.name.toLowerCase().includes(searchTerm);
            
            if (aNameMatch && !bNameMatch) return -1;
            if (!aNameMatch && bNameMatch) return 1;
            
            return a.name.localeCompare(b.name);
        });

        return results.slice(0, limit);
    }

    /**
     * Get item by ID
     * @param {string} id
     * @returns {Promise<Object|null>}
     */
    async getItemById(id) {
        return this.inventory.find(item => item.id === id) || null;
    }

    /**
     * Get all categories
     * @returns {Promise<Array>}
     */
    async getCategories() {
        return Array.from(this.categories).map(category => ({
            name: category,
            count: this.inventory.filter(item => item.category === category).length
        }));
    }

    /**
     * Update stock quantity for an item
     * @param {string} id
     * @param {number} quantity
     * @returns {Promise<boolean>}
     */
    async updateStock(id, quantity) {
        const item = this.inventory.find(item => item.id === id);
        if (item) {
            item.stock_quantity = Math.max(0, quantity);
            item.in_stock = item.stock_quantity > 0;
            item.updated_at = new Date().toISOString();
            
            this.cacheInventory();
            return true;
        }
        return false;
    }

    /**
     * Check if an item is in stock
     * @param {string} id
     * @param {number} quantity
     * @returns {Promise<boolean>}
     */
    async checkStock(id, quantity = 1) {
        const item = await this.getItemById(id);
        return item && item.in_stock && item.stock_quantity >= quantity;
    }

    /**
     * Cache inventory to localStorage
     */
    cacheInventory() {
        try {
            const cacheData = {
                inventory: this.inventory,
                categories: Array.from(this.categories),
                timestamp: Date.now(),
                version: '1.0'
            };
            
            localStorage.setItem(this.cacheKey, JSON.stringify(cacheData));
        } catch (error) {
            console.warn('Failed to cache inventory:', error);
        }
    }

    /**
     * Check if cached data is valid
     */
    isCacheValid(cachedData) {
        const maxAge = AppConfig.get('performance.cacheExpiration', 3600000); // 1 hour
        return (
            cachedData &&
            cachedData.timestamp &&
            cachedData.inventory &&
            (Date.now() - cachedData.timestamp) < maxAge
        );
    }

    /**
     * Clear cache
     */
    clearCache() {
        localStorage.removeItem(this.cacheKey);
    }

    /**
     * Helper: Format name from camelCase to Title Case
     */
    formatName(name) {
        return name
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .trim();
    }

    /**
     * Helper: Generate random price in range
     */
    generatePrice(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * Helper: Get charm subcategory based on name
     */
    getCharmSubcategory(name) {
        const categories = {
            heart: 'symbols',
            star: 'symbols',
            moon: 'symbols',
            sun: 'symbols',
            flower: 'nature',
            leaf: 'nature',
            butterfly: 'animals',
            bird: 'animals',
            cat: 'animals',
            dog: 'animals'
        };

        const lowerName = name.toLowerCase();
        for (const [key, category] of Object.entries(categories)) {
            if (lowerName.includes(key)) {
                return category;
            }
        }
        
        return 'decorative';
    }

    /**
     * Helper: Generate tags for an item
     */
    generateTags(name) {
        const baseTags = ['custom', 'jewelry', 'handmade'];
        const nameWords = this.formatName(name).toLowerCase().split(' ');
        return [...baseTags, ...nameWords];
    }

    /**
     * Get service status
     * @returns {Object}
     */
    getStatus() {
        return {
            initialized: this.initialized,
            itemCount: this.inventory.length,
            categoryCount: this.categories.size,
            type: 'local',
            version: '1.0'
        };
    }
}

export default LocalInventoryService;