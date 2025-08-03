/**
 * @fileoverview Inventory Service for frontend integration
 * High-level service that integrates with the existing jewelry customizer
 */

import { getAPI } from './InventoryAPI.js';
import { CATEGORIES, STATUS, DataTransformers } from '../types/inventory.js';
import { EVENTS } from '../config/events.js';
import { STORAGE_KEYS, CSS_CLASSES } from '../config/supabase.js';

/**
 * Service class for inventory management in the jewelry customizer
 */
export class InventoryService {
  constructor() {
    this.api = null;
    this.cache = new Map();
    this.subscribers = new Map();
    this.isInitialized = false;
  }

  /**
   * Initialize the service
   * @param {Object} config - Configuration object
   * @returns {Promise<void>}
   */
  async initialize(config = {}) {
    try {
      this.api = getAPI();
      this.isInitialized = true;
      
      // Set up real-time subscriptions if enabled
      if (config.enableRealTime !== false) {
        this.setupRealTimeSubscriptions();
      }
      
      console.log('InventoryService initialized successfully');
    } catch (error) {
      console.error('Failed to initialize InventoryService:', error);
      throw error;
    }
  }

  /**
   * Check if service is ready
   * @returns {boolean} Is ready
   */
  isReady() {
    return this.isInitialized && this.api;
  }

  // ===========================================
  // Inventory Management for Customizer
  // ===========================================

  /**
   * Get charm inventory for the customizer sidebar
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} Charm items formatted for sidebar
   */
  async getCharmInventory(filters = {}) {
    try {
      const charmFilters = {
        ...filters,
        category: CATEGORIES.CHARMS,
        status: STATUS.ACTIVE,
        available_only: true
      };

      const response = await this.api.getInventory(charmFilters);
      
      // Transform for sidebar display
      return response.data.map(item => this.transformForSidebar(item));
    } catch (error) {
      console.error('Error fetching charm inventory:', error);
      return [];
    }
  }

  /**
   * Get all available inventory for browsing
   * @param {Object} filters - Filter options
   * @param {Object} pagination - Pagination options
   * @returns {Promise<Object>} Inventory response
   */
  async getBrowseInventory(filters = {}, pagination = {}) {
    try {
      const cacheKey = `browse_${JSON.stringify(filters)}_${JSON.stringify(pagination)}`;
      
      // Check cache first
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (Date.now() - cached.timestamp < 300000) { // 5 minutes
          return cached.data;
        }
      }

      const response = await this.api.getInventory(filters, pagination);
      
      // Transform items for display
      response.data = response.data.map(item => this.transformForDisplay(item));
      
      // Cache the result
      this.cache.set(cacheKey, {
        data: response,
        timestamp: Date.now()
      });

      return response;
    } catch (error) {
      console.error('Error fetching browse inventory:', error);
      throw error;
    }
  }

  /**
   * Search inventory items
   * @param {string} query - Search query
   * @param {Object} filters - Additional filters
   * @returns {Promise<Array>} Search results
   */
  async searchInventory(query, filters = {}) {
    try {
      if (!query || query.trim().length < 2) {
        return [];
      }

      const results = await this.api.searchInventory(query.trim(), filters);
      return results.map(item => this.transformForDisplay(item));
    } catch (error) {
      console.error('Error searching inventory:', error);
      return [];
    }
  }

  /**
   * Get inventory item details for the customizer
   * @param {string} itemId - Item ID
   * @returns {Promise<Object>} Item details
   */
  async getItemDetails(itemId) {
    try {
      const item = await this.api.getInventoryItem(itemId);
      return this.transformForCustomizer(item);
    } catch (error) {
      console.error('Error fetching item details:', error);
      throw error;
    }
  }

  /**
   * Reserve inventory items for a design
   * @param {Array} items - Items to reserve
   * @returns {Promise<boolean>} Success status
   */
  async reserveItems(items) {
    try {
      const updates = items.map(async item => {
        const current = await this.api.getInventoryItem(item.id);
        if (current.quantity_available < item.quantity) {
          throw new Error(`Insufficient quantity for ${current.title}`);
        }
        
        return this.api.updateInventoryItem(item.id, {
          quantity_available: current.quantity_available - item.quantity,
          quantity_reserved: current.quantity_reserved + item.quantity
        });
      });

      await Promise.all(updates);
      return true;
    } catch (error) {
      console.error('Error reserving items:', error);
      throw error;
    }
  }

  // ===========================================
  // Data Transformation
  // ===========================================

  /**
   * Transform inventory item for sidebar display
   * @param {Object} item - Raw inventory item
   * @returns {Object} Transformed item
   */
  transformForSidebar(item) {
    return {
      id: item.id,
      name: this.extractShortName(item.title),
      title: item.title,
      imageUrl: item.image_url,
      price: DataTransformers.formatPrice(item.price, item.currency),
      priceValue: item.price,
      category: item.category,
      tags: item.tags,
      available: item.quantity_available > 0,
      quantity: item.quantity_available,
      attributes: item.attributes,
      // For backward compatibility with existing customizer
      src: item.image_url,
      alt: item.title
    };
  }

  /**
   * Transform inventory item for display in catalog
   * @param {Object} item - Raw inventory item
   * @returns {Object} Transformed item
   */
  transformForDisplay(item) {
    return {
      ...this.transformForSidebar(item),
      description: item.description,
      supplier: item.supplier_info?.store_name,
      lastUpdated: DataTransformers.formatDate(item.updated_at),
      status: item.status,
      fullDetails: true
    };
  }

  /**
   * Transform inventory item for customizer use
   * @param {Object} item - Raw inventory item
   * @returns {Object} Transformed item
   */
  transformForCustomizer(item) {
    return {
      ...this.transformForDisplay(item),
      // Additional customizer-specific properties
      dimensions: this.extractDimensions(item.attributes),
      material: this.extractMaterial(item.attributes),
      color: this.extractColor(item.attributes),
      weight: this.extractWeight(item.attributes)
    };
  }

  // ===========================================
  // Browse Page Integration
  // ===========================================

  /**
   * Get products for browsing with filtering and pagination
   * @param {Object} options - Options for fetching products
   * @returns {Promise<Object>} Products response
   */
  async getProducts(options = {}) {
    try {
      const {
        category,
        search,
        priceMin,
        priceMax,
        materials,
        inStockOnly = true,
        sortBy = 'featured',
        page = 1,
        limit = 12,
        includeOutOfStock = false,
        excludeIds = []
      } = options;

      // Build filters for API
      const filters = {
        status: STATUS.ACTIVE
      };

      if (category) {
        filters.category = category;
      }

      if (search) {
        filters.search = search;
      }

      if (priceMin !== null && priceMin !== undefined) {
        filters.price_min = priceMin;
      }

      if (priceMax !== null && priceMax !== undefined) {
        filters.price_max = priceMax;
      }

      if (materials && materials.length > 0) {
        filters.materials = materials;
      }

      if (inStockOnly && !includeOutOfStock) {
        filters.in_stock_only = true;
      }

      if (excludeIds && excludeIds.length > 0) {
        filters.exclude_ids = excludeIds;
      }

      // Add pagination
      const pagination = {
        page,
        limit,
        sort_by: this.mapSortOption(sortBy)
      };

      const response = await this.api.getInventory(filters, pagination);
      
      return {
        products: response.data.map(item => this.transformForBrowse(item)),
        total: response.total || response.data.length,
        page: response.page || 1,
        totalPages: Math.ceil((response.total || response.data.length) / limit)
      };
    } catch (error) {
      console.error('Error fetching products:', error);
      return {
        products: [],
        total: 0,
        page: 1,
        totalPages: 0
      };
    }
  }

  /**
   * Get a single product by ID
   * @param {string} productId - Product ID
   * @returns {Promise<Object|null>} Product data
   */
  async getProduct(productId) {
    try {
      const response = await this.api.getItem(productId);
      return response ? this.transformForBrowse(response) : null;
    } catch (error) {
      console.error('Error fetching product:', error);
      return null;
    }
  }

  /**
   * Transform inventory item for browse/product pages
   * @param {Object} item - Raw inventory item
   * @returns {Object} Transformed item for browse
   */
  transformForBrowse(item) {
    return {
      id: item.id,
      name: item.title,
      description: item.description || 'Beautiful handcrafted jewelry piece',
      price: parseFloat(item.price),
      originalPrice: item.compare_at_price ? parseFloat(item.compare_at_price) : null,
      compareAtPrice: item.compare_at_price ? parseFloat(item.compare_at_price) : null,
      image: item.image_url || '/src/assets/images/ui/011A2614.jpg',
      images: item.additional_images ? [item.image_url, ...item.additional_images] : [item.image_url],
      category: item.category || 'Jewelry',
      stock: parseInt(item.quantity_available) || 0,
      sku: item.sku,
      material: this.extractMaterial(item.attributes),
      dimensions: this.extractDimensions(item.attributes),
      weight: this.extractWeight(item.attributes),
      tags: item.tags || [],
      rating: item.rating || 0,
      reviewCount: item.review_count || 0,
      created_at: item.created_at,
      updated_at: item.updated_at,
      supplier: item.supplier_info?.store_name,
      options: this.extractProductOptions(item.variants),
      // Additional computed properties
      isOutOfStock: parseInt(item.quantity_available) <= 0,
      isLowStock: parseInt(item.quantity_available) > 0 && parseInt(item.quantity_available) < 5,
      hasDiscount: item.compare_at_price && parseFloat(item.compare_at_price) > parseFloat(item.price),
      discountPercentage: item.compare_at_price ? 
        Math.round(((parseFloat(item.compare_at_price) - parseFloat(item.price)) / parseFloat(item.compare_at_price)) * 100) : 0
    };
  }

  /**
   * Extract product options from variants
   * @param {Array} variants - Product variants
   * @returns {Object} Product options
   */
  extractProductOptions(variants) {
    if (!variants || !Array.isArray(variants)) return {};

    const options = {};
    variants.forEach(variant => {
      if (variant.options) {
        Object.entries(variant.options).forEach(([key, value]) => {
          if (!options[key]) {
            options[key] = [];
          }
          if (!options[key].includes(value)) {
            options[key].push(value);
          }
        });
      }
    });

    return options;
  }

  /**
   * Map sort options to API format
   * @param {string} sortBy - Sort option
   * @returns {string} API sort format
   */
  mapSortOption(sortBy) {
    const sortMap = {
      featured: 'featured',
      'price-low': 'price_asc',
      'price-high': 'price_desc',
      name: 'title_asc',
      newest: 'created_desc'
    };
    return sortMap[sortBy] || 'featured';
  }

  // ===========================================
  // Design Integration
  // ===========================================

  /**
   * Save a jewelry design with inventory references
   * @param {Object} designData - Design data from Konva.js
   * @param {Object} metadata - Design metadata
   * @returns {Promise<Object>} Saved design
   */
  async saveDesign(designData, metadata = {}) {
    try {
      // Extract inventory items used in the design
      const usedItems = this.extractInventoryFromDesign(designData);
      
      // Calculate total price
      const totalPrice = await this.calculateDesignPrice(usedItems);
      
      const design = {
        name: metadata.name || `Design ${new Date().toLocaleDateString()}`,
        product_id: metadata.productId,
        design_data: {
          stage: designData,
          components: usedItems,
          canvas_settings: metadata.canvasSettings || {}
        },
        thumbnail_url: metadata.thumbnailUrl,
        total_price: totalPrice,
        is_public: metadata.isPublic || false
      };

      const savedDesign = await this.api.saveDesign(design);
      
      // Emit event for UI updates
      this.emitEvent(EVENTS.DESIGN_SAVED, savedDesign);
      
      return savedDesign;
    } catch (error) {
      console.error('Error saving design:', error);
      throw error;
    }
  }

  /**
   * Load a saved design into the customizer
   * @param {string} designId - Design ID
   * @returns {Promise<Object>} Design data for Konva.js
   */
  async loadDesign(designId) {
    try {
      const design = await this.api.getDesign(designId);
      
      // Validate that all inventory items are still available
      const components = design.design_data.components || [];
      const validatedComponents = await this.validateDesignComponents(components);
      
      return {
        ...design.design_data,
        components: validatedComponents,
        metadata: {
          id: design.id,
          name: design.name,
          totalPrice: design.total_price,
          lastUpdated: design.updated_at
        }
      };
    } catch (error) {
      console.error('Error loading design:', error);
      throw error;
    }
  }

  // ===========================================
  // Categories and Filtering
  // ===========================================

  /**
   * Get available categories with item counts
   * @returns {Promise<Array>} Categories with counts
   */
  async getCategories() {
    try {
      const cacheKey = 'categories_with_counts';
      
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (Date.now() - cached.timestamp < 600000) { // 10 minutes
          return cached.data;
        }
      }

      const categories = await this.api.getCategoriesWithCounts();
      
      this.cache.set(cacheKey, {
        data: categories,
        timestamp: Date.now()
      });

      return categories;
    } catch (error) {
      console.error('Error fetching categories:', error);
      return Object.values(CATEGORIES).map(cat => ({ name: cat, count: 0 }));
    }
  }

  /**
   * Get inventory statistics
   * @returns {Promise<Object>} Inventory stats
   */
  async getInventoryStats() {
    try {
      return await this.api.getInventoryStats();
    } catch (error) {
      console.error('Error fetching inventory stats:', error);
      return {};
    }
  }

  // ===========================================
  // Real-time Updates
  // ===========================================

  /**
   * Set up real-time subscriptions
   */
  setupRealTimeSubscriptions() {
    if (!this.api) return;

    // Subscribe to inventory changes
    this.api.subscribeToInventoryChanges((payload) => {
      this.handleInventoryChange(payload);
    });
  }

  /**
   * Handle inventory change events
   * @param {Object} payload - Change payload
   */
  handleInventoryChange(payload) {
    // Clear relevant cache entries
    this.clearInventoryCache();
    
    // Emit event for UI updates
    this.emitEvent(EVENTS.INVENTORY_UPDATED, payload);
    
    // Update specific UI elements
    this.updateInventoryUI(payload);
  }

  /**
   * Subscribe to service events
   * @param {string} eventName - Event name
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  subscribe(eventName, callback) {
    if (!this.subscribers.has(eventName)) {
      this.subscribers.set(eventName, new Set());
    }
    
    this.subscribers.get(eventName).add(callback);
    
    // Return unsubscribe function
    return () => {
      this.subscribers.get(eventName)?.delete(callback);
    };
  }

  // ===========================================
  // Utility Methods
  // ===========================================

  /**
   * Extract short name from full title
   * @param {string} title - Full title
   * @returns {string} Short name
   */
  extractShortName(title) {
    // Take first few words or up to 30 characters
    const words = title.split(' ');
    if (words.length <= 3) return title;
    
    const shortName = words.slice(0, 3).join(' ');
    return shortName.length > 30 ? `${shortName.substring(0, 27)}...` : shortName;
  }

  /**
   * Extract dimensions from attributes
   * @param {Object} attributes - Item attributes
   * @returns {Object} Dimensions
   */
  extractDimensions(attributes) {
    const size = attributes.size || attributes.dimensions || '';
    return { raw: size };
  }

  /**
   * Extract material from attributes
   * @param {Object} attributes - Item attributes
   * @returns {string} Material
   */
  extractMaterial(attributes) {
    return attributes.material || attributes.metal || 'Unknown';
  }

  /**
   * Extract color from attributes
   * @param {Object} attributes - Item attributes
   * @returns {string} Color
   */
  extractColor(attributes) {
    return attributes.color || attributes.finish || 'Default';
  }

  /**
   * Extract weight from attributes
   * @param {Object} attributes - Item attributes
   * @returns {string} Weight
   */
  extractWeight(attributes) {
    return attributes.weight || '';
  }

  /**
   * Extract inventory items from design data
   * @param {Object} designData - Konva.js design data
   * @returns {Array} Used inventory items
   */
  extractInventoryFromDesign(designData) {
    // This would be customized based on how you store inventory references in Konva
    const components = [];
    
    if (designData.children) {
      designData.children.forEach(child => {
        if (child.attrs && child.attrs.inventoryId) {
          components.push({
            inventory_id: child.attrs.inventoryId,
            position: { x: child.attrs.x, y: child.attrs.y },
            scale: child.attrs.scaleX || 1,
            rotation: child.attrs.rotation || 0,
            quantity: 1
          });
        }
      });
    }
    
    return components;
  }

  /**
   * Calculate design total price
   * @param {Array} components - Design components
   * @returns {Promise<number>} Total price
   */
  async calculateDesignPrice(components) {
    let total = 0;
    
    for (const component of components) {
      try {
        const item = await this.api.getInventoryItem(component.inventory_id);
        total += item.price * (component.quantity || 1);
      } catch (error) {
        console.warn(`Could not fetch price for item ${component.inventory_id}`);
      }
    }
    
    return total;
  }

  /**
   * Validate design components
   * @param {Array} components - Design components
   * @returns {Promise<Array>} Validated components
   */
  async validateDesignComponents(components) {
    const validated = [];
    
    for (const component of components) {
      try {
        const item = await this.api.getInventoryItem(component.inventory_id);
        if (item.status === STATUS.ACTIVE && item.quantity_available > 0) {
          validated.push(component);
        }
      } catch (error) {
        console.warn(`Component ${component.inventory_id} no longer available`);
      }
    }
    
    return validated;
  }

  /**
   * Clear inventory cache
   */
  clearInventoryCache() {
    const keysToDelete = [];
    for (const key of this.cache.keys()) {
      if (key.startsWith('browse_') || key.startsWith('categories_')) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Emit custom event
   * @param {string} eventName - Event name
   * @param {*} data - Event data
   */
  emitEvent(eventName, data) {
    const subscribers = this.subscribers.get(eventName);
    if (subscribers) {
      subscribers.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event subscriber for ${eventName}:`, error);
        }
      });
    }

    // Also emit as DOM event
    const event = new CustomEvent(eventName, { detail: data });
    document.dispatchEvent(event);
  }

  /**
   * Update inventory UI elements
   * @param {Object} payload - Change payload
   */
  updateInventoryUI(payload) {
    // Update sidebar if visible
    const sidebar = document.querySelector('.charm-sidebar');
    if (sidebar) {
      // Add visual indicator for updated items
      const itemElement = sidebar.querySelector(`[data-inventory-id="${payload.new?.id}"]`);
      if (itemElement) {
        itemElement.classList.add(CSS_CLASSES.UPDATED);
        setTimeout(() => {
          itemElement.classList.remove(CSS_CLASSES.UPDATED);
        }, 3000);
      }
    }
  }
}

// Create singleton instance
const inventoryService = new InventoryService();

export default inventoryService;