/**
 * @fileoverview Supabase configuration and environment settings
 * Contains connection details and environment-specific configurations
 */

/**
 * Supabase configuration object
 * Replace with your actual Supabase project credentials
 */
export const SUPABASE_CONFIG = {
  // Replace with your Supabase project URL
  URL: (typeof process !== 'undefined' && process.env) ? process.env.SUPABASE_URL || 'https://pdymtscuudowgrcmbxoz.supabase.co' : 'https://pdymtscuudowgrcmbxoz.supabase.co',
  
  // Replace with your Supabase public anon key
  ANON_KEY: (typeof process !== 'undefined' && process.env) ? process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkeW10c2N1dWRvd2dyY21ieG96Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxNjA4NTcsImV4cCI6MjA2OTczNjg1N30.qcv9WTDqEH09rmj0Fn_kDnwdw2t26-0RtW-qKQvE3RY' : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkeW10c2N1dWRvd2dyY21ieG96Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxNjA4NTcsImV4cCI6MjA2OTczNjg1N30.qcv9WTDqEH09rmj0Fn_kDnwdw2t26-0RtW-qKQvE3RY',
  
  // Replace with your Supabase service role key (for admin operations)
  SERVICE_ROLE_KEY: (typeof process !== 'undefined' && process.env) ? process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkeW10c2N1dWRvd2dyY21ieG96Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDE2MDg1NywiZXhwIjoyMDY5NzM2ODU3fQ.HqeKRGnIOistvGyPcnoWLoIOEgYmFpgHUajho9MxfCs' : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkeW10c2N1dWRvd2dyY21ieG96Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDE2MDg1NywiZXhwIjoyMDY5NzM2ODU3fQ.HqeKRGnIOistvGyPcnoWLoIOEgYmFpgHUajho9MxfCs'
};

/**
 * Storage bucket configurations
 */
export const STORAGE_BUCKETS = {
  DESIGNS: 'designs',
  INVENTORY: 'inventory',
  PRODUCTS: 'products',
  THUMBNAILS: 'thumbnails'
};

/**
 * API configuration settings
 */
export const API_CONFIG = {
  // Default timeout for API requests (ms)
  TIMEOUT: 30000,
  
  // Default pagination settings
  DEFAULT_PAGE_SIZE: 50,
  MAX_PAGE_SIZE: 100,
  
  // Cache settings
  CACHE_TTL: 300000, // 5 minutes
  
  // Upload settings
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'],
  
  // Real-time settings
  REALTIME_ENABLED: true,
  RECONNECT_ATTEMPTS: 5
};

/**
 * Database table names
 */
export const TABLES = {
  PROFILES: 'profiles',
  INVENTORY: 'inventory',
  PRODUCTS: 'products',
  DESIGNS: 'designs',
  ORDERS: 'orders',
  ORDER_ITEMS: 'order_items',
  USER_CARTS: 'user_carts',
  GUEST_CARTS: 'guest_carts'
};

/**
 * RPC function names
 */
export const RPC_FUNCTIONS = {
  GET_CATEGORIES_WITH_COUNTS: 'get_categories_with_counts',
  GET_INVENTORY_STATS: 'get_inventory_stats',
  SEARCH_INVENTORY: 'search_inventory',
  UPDATE_INVENTORY_QUANTITY: 'update_inventory_quantity',
  CALCULATE_ORDER_TOTAL: 'calculate_order_total'
};

/**
 * Environment detection
 */
export const ENVIRONMENT = {
  isDevelopment: (typeof process !== 'undefined' && process.env) ? process.env.NODE_ENV === 'development' : window.location.hostname === 'localhost',
  isProduction: (typeof process !== 'undefined' && process.env) ? process.env.NODE_ENV === 'production' : window.location.hostname !== 'localhost',
  isTest: (typeof process !== 'undefined' && process.env) ? process.env.NODE_ENV === 'test' : false
};

/**
 * Feature flags
 */
export const FEATURES = {
  REAL_TIME_INVENTORY: true,
  USER_DESIGNS: true,
  ORDER_MANAGEMENT: true,
  ADMIN_PANEL: false, // Will be enabled later
  PAYMENT_INTEGRATION: false, // Will be enabled later
  ANALYTICS: false // Will be enabled later
};

/**
 * Error messages
 */
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  UNAUTHORIZED: 'You must be logged in to perform this action.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION_ERROR: 'The provided data is invalid.',
  SERVER_ERROR: 'An unexpected server error occurred.',
  TIMEOUT_ERROR: 'The request timed out. Please try again.',
  FILE_TOO_LARGE: 'File size exceeds the maximum limit.',
  INVALID_FILE_TYPE: 'File type is not supported.'
};

/**
 * Success messages
 */
export const SUCCESS_MESSAGES = {
  DESIGN_SAVED: 'Design saved successfully!',
  INVENTORY_UPDATED: 'Inventory updated successfully!',
  ORDER_CREATED: 'Order created successfully!',
  PROFILE_UPDATED: 'Profile updated successfully!',
  FILE_UPLOADED: 'File uploaded successfully!'
};

/**
 * Validation rules
 */
export const VALIDATION_RULES = {
  PASSWORD_MIN_LENGTH: 8,
  DESIGN_NAME_MAX_LENGTH: 100,
  INVENTORY_TITLE_MAX_LENGTH: 200,
  PRODUCT_NAME_MAX_LENGTH: 100,
  MAX_DESIGN_COMPONENTS: 50,
  MIN_PRICE: 0.01,
  MAX_PRICE: 10000,
  MIN_QUANTITY: 0,
  MAX_QUANTITY: 9999
};

/**
 * Local storage keys
 */
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'timothie_auth_token',
  USER_PREFERENCES: 'timothie_user_preferences',
  DESIGN_DRAFTS: 'timothie_design_drafts',
  RECENT_SEARCHES: 'timothie_recent_searches',
  SHOPPING_CART: 'timothie_shopping_cart',
  GUEST_SESSION_ID: 'timothie_guest_session_id'
};

// EVENTS moved to separate file to avoid circular dependencies
// Import from '../config/events.js' instead

/**
 * CSS class names for styling
 */
export const CSS_CLASSES = {
  LOADING: 'loading',
  ERROR: 'error',
  SUCCESS: 'success',
  WARNING: 'warning',
  DISABLED: 'disabled',
  ACTIVE: 'active',
  SELECTED: 'selected',
  UPDATED: 'updated',
  CART_TRIGGER: 'cart-trigger'
};

/**
 * Utility functions for configuration
 */
export class ConfigUtils {
  /**
   * Validate Supabase configuration
   * @returns {boolean} Is configuration valid
   */
  static validateSupabaseConfig() {
    const { URL, ANON_KEY } = SUPABASE_CONFIG;
    
    if (!URL || URL === 'https://your-project.supabase.co') {
      console.error('Supabase URL not configured');
      return false;
    }
    
    if (!ANON_KEY || ANON_KEY === 'your-supabase-anon-key') {
      console.error('Supabase anon key not configured');
      return false;
    }
    
    return true;
  }

  /**
   * Get environment-specific configuration
   * @returns {Object} Environment config
   */
  static getEnvironmentConfig() {
    if (ENVIRONMENT.isDevelopment) {
      return {
        ...API_CONFIG,
        TIMEOUT: 60000, // Longer timeout for development
        CACHE_TTL: 0 // No caching in development
      };
    }
    
    if (ENVIRONMENT.isProduction) {
      return {
        ...API_CONFIG,
        TIMEOUT: 15000, // Shorter timeout for production
        CACHE_TTL: 600000 // 10 minutes cache in production
      };
    }
    
    return API_CONFIG;
  }

  /**
   * Check if feature is enabled
   * @param {string} featureName - Feature name
   * @returns {boolean} Is feature enabled
   */
  static isFeatureEnabled(featureName) {
    return FEATURES[featureName] || false;
  }

  /**
   * Get storage key with prefix
   * @param {string} key - Key name
   * @returns {string} Prefixed key
   */
  static getStorageKey(key) {
    return STORAGE_KEYS[key] || key;
  }

  /**
   * Validate file upload
   * @param {File} file - File to validate
   * @returns {Object} Validation result
   */
  static validateFileUpload(file) {
    const errors = [];
    
    if (file.size > API_CONFIG.MAX_FILE_SIZE) {
      errors.push(ERROR_MESSAGES.FILE_TOO_LARGE);
    }
    
    if (!API_CONFIG.ALLOWED_IMAGE_TYPES.includes(file.type)) {
      errors.push(ERROR_MESSAGES.INVALID_FILE_TYPE);
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

/**
 * Default export with all configuration
 */
export default {
  SUPABASE_CONFIG,
  STORAGE_BUCKETS,
  API_CONFIG,
  TABLES,
  RPC_FUNCTIONS,
  ENVIRONMENT,
  FEATURES,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  VALIDATION_RULES,
  STORAGE_KEYS,
  CSS_CLASSES,
  ConfigUtils
};