/**
 * AppConfig.js
 * 
 * Centralized configuration management for the Timothie & Co Jewelry Customizer.
 * Manages feature flags, environment settings, and runtime configuration.
 * 
 * This module provides a single source of truth for application configuration
 * and enables different behavior based on environment and feature availability.
 */

class AppConfig {
  constructor() {
    // Default configuration
    this.config = {
      // Environment
      env: this.detectEnvironment(),
      debug: this.isDebugMode(),
      
      // Feature flags (will be updated by FeatureDetector)
      features: {
        cart: true,              // Enable cart functionality
        inventory: true,         // Enable inventory service
        backend: true,           // Enable backend connectivity
        analytics: false,        // Analytics tracking
        errorReporting: true,    // Error reporting service
        lazyLoading: true,       // Lazy load optional features
        offlineMode: true,       // Enable offline fallbacks
        animations: true,        // UI animations
        advancedCustomization: false  // Future feature
      },
      
      // API endpoints
      api: {
        supabaseUrl: (typeof process !== 'undefined' && process.env) ? process.env.SUPABASE_URL || '' : '',
        supabaseAnonKey: (typeof process !== 'undefined' && process.env) ? process.env.SUPABASE_ANON_KEY || '' : '',
        cdnUrl: 'https://cdn.jsdelivr.net',
        imageBaseUrl: '/src/assets/images'
      },
      
      // Performance settings
      performance: {
        imageLoadingTimeout: 5000,      // 5 seconds
        apiTimeout: 10000,              // 10 seconds
        retryAttempts: 3,
        retryDelay: 1000,               // 1 second
        maxConcurrentRequests: 6,
        cacheExpiration: 3600000        // 1 hour
      },
      
      // UI settings
      ui: {
        animationDuration: 300,         // milliseconds
        debounceDelay: 250,            // milliseconds
        maxCharmsOnNecklace: 10,
        charmSize: 80,                 // pixels
        necklaceScale: 2,
        tooltipDelay: 500,             // milliseconds
        gridColumns: 3,
        itemsPerPage: 12
      },
      
      // Error handling
      errorHandling: {
        showUserErrors: true,
        logToConsole: true,
        reportToService: false,
        fallbackToOffline: true,
        retryFailedRequests: true
      },
      
      // Storage keys
      storage: {
        prefix: 'timothie_',
        designsKey: 'saved_designs',
        cartKey: 'cart_items',
        preferencesKey: 'user_preferences',
        cacheKey: 'api_cache',
        sessionKey: 'session_data'
      }
    };
    
    // Load saved preferences
    this.loadSavedConfig();
  }
  
  /**
   * Detect current environment
   * @returns {string} 'development', 'staging', or 'production'
   */
  detectEnvironment() {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'development';
    } else if (hostname.includes('staging') || hostname.includes('test')) {
      return 'staging';
    }
    return 'production';
  }
  
  /**
   * Check if debug mode is enabled
   * @returns {boolean}
   */
  isDebugMode() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.has('debug') || 
           localStorage.getItem('debug') === 'true' ||
           this.detectEnvironment() === 'development';
  }
  
  /**
   * Get a configuration value
   * @param {string} path - Dot notation path (e.g., 'features.cart')
   * @param {*} defaultValue - Default value if not found
   * @returns {*}
   */
  get(path, defaultValue = null) {
    const keys = path.split('.');
    let value = this.config;
    
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return defaultValue;
      }
    }
    
    return value;
  }
  
  /**
   * Set a configuration value
   * @param {string} path - Dot notation path
   * @param {*} value - Value to set
   */
  set(path, value) {
    const keys = path.split('.');
    let current = this.config;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current)) {
        current[key] = {};
      }
      current = current[key];
    }
    
    current[keys[keys.length - 1]] = value;
    
    // Save to localStorage if it's a preference
    if (path.startsWith('features.') || path.startsWith('ui.')) {
      this.saveConfig();
    }
  }
  
  /**
   * Update feature flags based on detection results
   * @param {Object} detectedFeatures - Features detected by FeatureDetector
   */
  updateFeatures(detectedFeatures) {
    Object.entries(detectedFeatures).forEach(([feature, available]) => {
      if (this.config.features.hasOwnProperty(feature)) {
        this.config.features[feature] = available && this.config.features[feature];
      }
    });
    
    // Log updated features in debug mode
    if (this.config.debug) {
      console.log('🔧 Updated feature flags:', this.config.features);
    }
  }
  
  /**
   * Check if a feature is enabled
   * @param {string} featureName
   * @returns {boolean}
   */
  isFeatureEnabled(featureName) {
    return this.config.features[featureName] || false;
  }
  
  /**
   * Get all enabled features
   * @returns {string[]}
   */
  getEnabledFeatures() {
    return Object.entries(this.config.features)
      .filter(([_, enabled]) => enabled)
      .map(([feature]) => feature);
  }
  
  /**
   * Save configuration to localStorage
   */
  saveConfig() {
    try {
      const saveableConfig = {
        features: this.config.features,
        ui: this.config.ui,
        errorHandling: this.config.errorHandling
      };
      localStorage.setItem(
        this.config.storage.prefix + 'config',
        JSON.stringify(saveableConfig)
      );
    } catch (error) {
      console.warn('Failed to save config:', error);
    }
  }
  
  /**
   * Load saved configuration from localStorage
   */
  loadSavedConfig() {
    try {
      const saved = localStorage.getItem(this.config.storage.prefix + 'config');
      if (saved) {
        const savedConfig = JSON.parse(saved);
        // Merge saved config with defaults
        Object.assign(this.config.features, savedConfig.features || {});
        Object.assign(this.config.ui, savedConfig.ui || {});
        Object.assign(this.config.errorHandling, savedConfig.errorHandling || {});
      }
    } catch (error) {
      console.warn('Failed to load saved config:', error);
    }
  }
  
  /**
   * Reset configuration to defaults
   */
  reset() {
    localStorage.removeItem(this.config.storage.prefix + 'config');
    window.location.reload();
  }
  
  /**
   * Get configuration for a specific module
   * @param {string} moduleName
   * @returns {Object}
   */
  getModuleConfig(moduleName) {
    const moduleConfigs = {
      cart: {
        enabled: this.isFeatureEnabled('cart'),
        maxItems: 50,
        autoSave: true,
        saveInterval: 30000 // 30 seconds
      },
      inventory: {
        enabled: this.isFeatureEnabled('inventory'),
        cacheEnabled: true,
        cacheDuration: this.config.performance.cacheExpiration,
        fallbackToLocal: this.config.errorHandling.fallbackToOffline
      },
      customizer: {
        canvas: {
          width: 800,
          height: 600,
          backgroundColor: '#ffffff'
        },
        maxCharms: this.config.ui.maxCharmsOnNecklace,
        charmSize: this.config.ui.charmSize,
        enableAnimations: this.config.features.animations
      }
    };
    
    return moduleConfigs[moduleName] || {};
  }
  
  /**
   * Get environment-specific configuration
   * @returns {Object}
   */
  getEnvironmentConfig() {
    const configs = {
      development: {
        apiUrl: 'http://localhost:3000',
        logLevel: 'debug',
        enableMocks: true
      },
      staging: {
        apiUrl: 'https://staging.timothieandco.com',
        logLevel: 'info',
        enableMocks: false
      },
      production: {
        apiUrl: 'https://api.timothieandco.com',
        logLevel: 'error',
        enableMocks: false
      }
    };
    
    return configs[this.config.env] || configs.production;
  }
}

// Export singleton instance
export default new AppConfig();