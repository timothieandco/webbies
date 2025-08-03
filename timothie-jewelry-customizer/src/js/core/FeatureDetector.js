/**
 * FeatureDetector.js
 * 
 * Detects available features and dependencies at runtime to enable
 * progressive enhancement and graceful degradation.
 * 
 * This module checks for the availability of optional dependencies
 * and provides feature flags that the application can use to 
 * conditionally enable functionality.
 */

class FeatureDetector {
  constructor() {
    this.features = new Map();
    this.detectionPromises = new Map();
    this.detectionComplete = false;
  }

  /**
   * Initialize feature detection
   * @returns {Promise<Map>} Map of feature flags
   */
  async detectFeatures() {
    if (this.detectionComplete) {
      return this.features;
    }

    // Core features (always available)
    this.features.set('canvas', this.detectCanvas());
    this.features.set('localStorage', this.detectLocalStorage());
    this.features.set('webWorkers', this.detectWebWorkers());
    
    // Optional features (may fail)
    await Promise.allSettled([
      this.detectSupabase(),
      this.detectCartManager(),
      this.detectInventoryService(),
      this.detectNetworkConnectivity()
    ]);

    this.detectionComplete = true;
    return this.features;
  }

  /**
   * Check if a specific feature is available
   * @param {string} featureName 
   * @returns {boolean}
   */
  isAvailable(featureName) {
    return this.features.get(featureName) || false;
  }

  /**
   * Get all detected features
   * @returns {Object} Feature flags object
   */
  getFeatures() {
    return Object.fromEntries(this.features);
  }

  // Core feature detections
  detectCanvas() {
    try {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      return !!context;
    } catch (e) {
      return false;
    }
  }

  detectLocalStorage() {
    try {
      const test = '__localStorage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  }

  detectWebWorkers() {
    return typeof Worker !== 'undefined';
  }

  // Optional feature detections
  async detectSupabase() {
    try {
      // Check if Supabase config exists
      const { supabase } = await import('../config/supabase.js');
      const testConnection = await supabase.from('inventory').select('count').limit(1);
      this.features.set('supabase', !testConnection.error);
      this.features.set('backend', !testConnection.error);
    } catch (error) {
      console.warn('Supabase not available:', error.message);
      this.features.set('supabase', false);
      this.features.set('backend', false);
    }
  }

  async detectCartManager() {
    try {
      // Try to dynamically import CartManager
      const { default: CartManager } = await import('./CartManager.js');
      const cartManager = new CartManager();
      this.features.set('cart', true);
      this.features.set('cartManager', cartManager);
    } catch (error) {
      console.warn('CartManager not available:', error.message);
      this.features.set('cart', false);
      this.features.set('cartManager', null);
    }
  }

  async detectInventoryService() {
    try {
      // Try to dynamically import InventoryService
      const { default: InventoryService } = await import('../services/InventoryService.js');
      const inventoryService = new InventoryService();
      this.features.set('inventory', true);
      this.features.set('inventoryService', inventoryService);
    } catch (error) {
      console.warn('InventoryService not available:', error.message);
      this.features.set('inventory', false);
      this.features.set('inventoryService', null);
    }
  }

  async detectNetworkConnectivity() {
    try {
      // Check if we can reach a known endpoint
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch('https://cdn.jsdelivr.net/npm/konva@9/konva.min.js', {
        method: 'HEAD',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      this.features.set('network', response.ok);
    } catch (error) {
      this.features.set('network', false);
    }
  }

  /**
   * Get a summary of available features for logging
   * @returns {Object}
   */
  getSummary() {
    const summary = {
      core: {
        canvas: this.isAvailable('canvas'),
        localStorage: this.isAvailable('localStorage'),
        webWorkers: this.isAvailable('webWorkers')
      },
      optional: {
        backend: this.isAvailable('backend'),
        cart: this.isAvailable('cart'),
        inventory: this.isAvailable('inventory'),
        network: this.isAvailable('network')
      }
    };
    return summary;
  }

  /**
   * Log feature detection results
   */
  logResults() {
    const summary = this.getSummary();
    console.group('🔍 Feature Detection Results');
    console.log('Core Features:', summary.core);
    console.log('Optional Features:', summary.optional);
    console.groupEnd();
  }
}

// Export singleton instance
export default new FeatureDetector();