/**
 * @fileoverview Type definitions and interfaces for inventory management system
 * Provides TypeScript-style JSDoc types for the Timothie & Co Jewelry Customizer
 */

/**
 * @typedef {Object} InventoryItem
 * @property {string} id - Unique UUID identifier
 * @property {string} external_id - AliExpress order ID
 * @property {string} title - Product title
 * @property {string|null} description - Product description
 * @property {string} image_url - Product image URL
 * @property {number} price - Product price
 * @property {string} currency - Currency code (default: USD)
 * @property {number} quantity_available - Available quantity
 * @property {number} quantity_reserved - Reserved quantity
 * @property {Object} attributes - Flexible attributes (color, size, etc.)
 * @property {string} category - Main category
 * @property {string|null} subcategory - Subcategory
 * @property {string[]} tags - Product tags
 * @property {Object} supplier_info - Supplier information
 * @property {string} supplier_info.store_name - Store name
 * @property {string} supplier_info.product_id - Product ID
 * @property {string} supplier_info.sku_id - SKU ID
 * @property {'active'|'inactive'|'discontinued'} status - Item status
 * @property {string} created_at - Creation timestamp
 * @property {string} updated_at - Last update timestamp
 */

/**
 * @typedef {Object} InventoryFilters
 * @property {string} [category] - Filter by category
 * @property {string} [status] - Filter by status
 * @property {string[]} [tags] - Filter by tags
 * @property {number} [price_min] - Minimum price
 * @property {number} [price_max] - Maximum price
 * @property {boolean} [available_only] - Show only available items
 */

/**
 * @typedef {Object} PaginationParams
 * @property {number} [limit] - Number of results (default: 50)
 * @property {number} [offset] - Pagination offset
 * @property {string} [order] - Sort order
 */

/**
 * @typedef {Object} InventoryResponse
 * @property {InventoryItem[]} data - Array of inventory items
 * @property {number} count - Total count
 * @property {number} page - Current page
 * @property {number} total_pages - Total pages
 */

/**
 * @typedef {Object} Product
 * @property {string} id - Unique UUID identifier
 * @property {string} name - Product name
 * @property {string|null} description - Product description
 * @property {number} base_price - Base price
 * @property {string} category - Product category
 * @property {Object} customization_options - Customization options
 * @property {boolean} featured - Is featured product
 * @property {boolean} active - Is active
 * @property {string} created_at - Creation timestamp
 * @property {string} updated_at - Last update timestamp
 */

/**
 * @typedef {Object} Design
 * @property {string} id - Unique UUID identifier
 * @property {string} user_id - User ID
 * @property {string} product_id - Product ID
 * @property {string} name - Design name
 * @property {Object} design_data - Konva.js stage data
 * @property {Object[]} design_data.components - Design components
 * @property {Object} design_data.canvas_settings - Canvas settings
 * @property {string|null} thumbnail_url - Thumbnail URL
 * @property {number|null} total_price - Total price
 * @property {boolean} is_public - Is public design
 * @property {string} created_at - Creation timestamp
 * @property {string} updated_at - Last update timestamp
 */

/**
 * @typedef {Object} DesignComponent
 * @property {string} id - Component ID
 * @property {string} inventory_id - Inventory item ID
 * @property {Object} position - Position on canvas
 * @property {number} position.x - X coordinate
 * @property {number} position.y - Y coordinate
 * @property {number} scale - Scale factor
 * @property {number} rotation - Rotation in degrees
 */

/**
 * @typedef {Object} Order
 * @property {string} id - Unique UUID identifier
 * @property {string} user_id - User ID
 * @property {string|null} design_id - Design ID
 * @property {string} order_number - Order number
 * @property {'pending'|'confirmed'|'processing'|'shipped'|'delivered'|'cancelled'} status - Order status
 * @property {number} total_amount - Total amount
 * @property {string} currency - Currency code
 * @property {Object} customer_info - Customer information
 * @property {'pending'|'completed'|'failed'} payment_status - Payment status
 * @property {string} created_at - Creation timestamp
 * @property {string} updated_at - Last update timestamp
 * @property {OrderItem[]} [order_items] - Order items (when expanded)
 */

/**
 * @typedef {Object} OrderItem
 * @property {string} id - Unique UUID identifier
 * @property {string} order_id - Order ID
 * @property {string} inventory_id - Inventory item ID
 * @property {number} quantity - Quantity
 * @property {number} unit_price - Unit price
 * @property {string} created_at - Creation timestamp
 * @property {InventoryItem} [inventory] - Inventory item (when expanded)
 */

/**
 * @typedef {Object} APIError
 * @property {Object} error - Error object
 * @property {string} error.code - Error code
 * @property {string} error.message - Error message
 * @property {Object[]} [error.details] - Error details
 * @property {string} error.timestamp - Error timestamp
 */

/**
 * Product categories used in the system (aligned with business requirements)
 */
export const CATEGORIES = {
  NECKLACES: 'necklaces',
  BRACELETS: 'bracelets', 
  CHARMS: 'charms',
  KEYCHAINS: 'keychains',
  EARRINGS: 'earrings',
  ACCESSORIES: 'accessories',
  MATERIALS: 'materials'
};

/**
 * Product subcategories (aligned with business requirements)
 */
export const SUBCATEGORIES = {
  NECKLACES: {
    CHAIN_BASES: 'chain_bases',
    PENDANTS: 'pendants'
  },
  BRACELETS: {
    CHAIN_COMPONENTS: 'chain_components',
    CLASPS: 'clasps'
  },
  CHARMS: {
    DECORATIVE: 'decorative',
    THEMED: 'themed'
  },
  KEYCHAINS: {
    COMPONENTS: 'components',
    CARABINERS: 'carabiners'
  },
  EARRINGS: {
    COMPONENTS: 'components',
    HOOKS: 'hooks'
  },
  ACCESSORIES: {
    BAG_ACCESSORIES: 'bag_accessories',
    MISCELLANEOUS: 'miscellaneous'
  },
  MATERIALS: {
    SUPPLIES: 'supplies',
    FINDINGS: 'findings'
  }
};

/**
 * Inventory item statuses
 */
export const STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  DISCONTINUED: 'discontinued'
};

/**
 * Order statuses
 */
export const ORDER_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled'
};

/**
 * Payment statuses
 */
export const PAYMENT_STATUS = {
  PENDING: 'pending',
  COMPLETED: 'completed',
  FAILED: 'failed'
};

/**
 * User roles
 */
export const USER_ROLES = {
  CUSTOMER: 'customer',
  ADMIN: 'admin'
};

/**
 * Default pagination settings
 */
export const DEFAULT_PAGINATION = {
  LIMIT: 50,
  OFFSET: 0,
  ORDER: 'created_at.desc'
};

/**
 * API response status codes
 */
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500
};

/**
 * Validation helpers
 */
export class ValidationHelpers {
  /**
   * Validate inventory item data
   * @param {Object} item - Item to validate
   * @returns {boolean} Is valid
   */
  static validateInventoryItem(item) {
    return !!(
      item.title &&
      typeof item.price === 'number' &&
      item.price > 0 &&
      typeof item.quantity_available === 'number' &&
      item.quantity_available >= 0 &&
      item.category &&
      Object.values(CATEGORIES).includes(item.category)
    );
  }

  /**
   * Validate design data
   * @param {Object} design - Design to validate
   * @returns {boolean} Is valid
   */
  static validateDesign(design) {
    return !!(
      design.name &&
      design.design_data &&
      design.design_data.components &&
      Array.isArray(design.design_data.components)
    );
  }

  /**
   * Validate price format
   * @param {number} price - Price to validate
   * @returns {boolean} Is valid
   */
  static validatePrice(price) {
    return typeof price === 'number' && price >= 0 && Number.isFinite(price);
  }

  /**
   * Validate quantity
   * @param {number} quantity - Quantity to validate
   * @returns {boolean} Is valid
   */
  static validateQuantity(quantity) {
    return Number.isInteger(quantity) && quantity >= 0;
  }
}

/**
 * Utility functions for data transformation
 */
export class DataTransformers {
  /**
   * Transform AliExpress data to inventory item
   * @param {Object} aliexpressItem - AliExpress item data
   * @returns {Object} Transformed inventory item
   */
  static transformAliExpressToInventory(aliexpressItem) {
    // Parse price from string format "$2.91" to number 2.91
    const price = parseFloat(aliexpressItem.price.replace('$', ''));
    
    // Parse attributes from string to object
    const attributes = {};
    if (aliexpressItem.attributes) {
      const pairs = aliexpressItem.attributes.split(', ');
      pairs.forEach(pair => {
        const [key, value] = pair.split(': ');
        if (key && value) {
          attributes[key.toLowerCase().replace(/\s+/g, '_')] = value;
        }
      });
    }

    // Categorize based on title keywords
    const category = this.categorizeByTitle(aliexpressItem.title);

    return {
      external_id: aliexpressItem.id,
      title: aliexpressItem.title,
      description: null,
      image_url: aliexpressItem.imageUrl,
      price: price,
      currency: aliexpressItem.currency || 'USD',
      quantity_available: aliexpressItem.quantity || 0,
      quantity_reserved: 0,
      attributes: attributes,
      category: category,
      subcategory: null,
      tags: aliexpressItem.tags || [],
      supplier_info: {
        store_name: aliexpressItem.storeName,
        product_id: aliexpressItem.productId,
        sku_id: aliexpressItem.skuId
      },
      status: STATUS.ACTIVE
    };
  }

  /**
   * Categorize item by title keywords (aligned with business requirements)
   * @param {string} title - Item title
   * @returns {string} Category
   */
  static categorizeByTitle(title) {
    const titleLower = title.toLowerCase();
    
    // Necklaces - Chain bases and necklace components
    if ((titleLower.includes('necklace') || titleLower.includes('neck')) || 
        (titleLower.includes('chain') && !titleLower.includes('bracelet') && !titleLower.includes('keychain') && !titleLower.includes('bag'))) {
      return CATEGORIES.NECKLACES;
    }
    
    // Bracelets - Bracelet chains and components
    if (titleLower.includes('bracelet') || titleLower.includes('bangle') || titleLower.includes('wrist') ||
        (titleLower.includes('chain') && titleLower.includes('extender')) ||
        (titleLower.includes('strap') && (titleLower.includes('bag') || titleLower.includes('purse')))) {
      return CATEGORIES.BRACELETS;
    }
    
    // Keychains - Keychain components, carabiners, key rings
    if (titleLower.includes('keychain') || titleLower.includes('key ring') || titleLower.includes('carabiner') ||
        titleLower.includes('key chain') || (titleLower.includes('ring') && titleLower.includes('split')) ||
        (titleLower.includes('lobster') && titleLower.includes('clasp'))) {
      return CATEGORIES.KEYCHAINS;
    }
    
    // Charms - Decorative elements, pendants, charms
    if (titleLower.includes('charm') || titleLower.includes('pendant') || titleLower.includes('decorative') ||
        (titleLower.includes('gold') || titleLower.includes('silver')) && titleLower.includes('color') ||
        titleLower.includes('heart') || titleLower.includes('star') || titleLower.includes('pearl')) {
      return CATEGORIES.CHARMS;
    }
    
    // Earrings - Earring components and findings  
    if (titleLower.includes('earring') || titleLower.includes('ear hook') || titleLower.includes('ear wire')) {
      return CATEGORIES.EARRINGS;
    }
    
    // Accessories - Bag accessories and miscellaneous
    if (titleLower.includes('bag') || titleLower.includes('purse') || titleLower.includes('handbag') ||
        titleLower.includes('crossbody') || titleLower.includes('shoulder') || titleLower.includes('replacement')) {
      return CATEGORIES.ACCESSORIES;
    }
    
    // Materials - Wire, beads, findings, jewelry making supplies
    if (titleLower.includes('wire') || titleLower.includes('cord') || titleLower.includes('bead') ||
        titleLower.includes('finding') || titleLower.includes('connector') || titleLower.includes('clasp') ||
        titleLower.includes('jump ring') || titleLower.includes('jewelry making') || titleLower.includes('stainless steel')) {
      return CATEGORIES.MATERIALS;
    }
    
    // Default to accessories for unclassified items
    return CATEGORIES.ACCESSORIES;
  }

  /**
   * Format price for display
   * @param {number} price - Price number
   * @param {string} currency - Currency code
   * @returns {string} Formatted price
   */
  static formatPrice(price, currency = 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(price);
  }

  /**
   * Format date for display
   * @param {string} dateString - ISO date string
   * @returns {string} Formatted date
   */
  static formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}