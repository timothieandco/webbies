/**
 * ServiceFactory.js
 * 
 * Factory pattern implementation for creating services with automatic fallback support.
 * This module ensures the application always has working services, either real or mock,
 * preventing complete failure when dependencies are unavailable.
 */

import AppConfig from '../config/AppConfig.js';
import FeatureDetector from '../core/FeatureDetector.js';
import eventBus, { Events } from '../core/EventBus.js';
import errorBoundary from '../utils/ErrorBoundary.js';

class ServiceFactory {
  constructor() {
    this.services = new Map();
    this.serviceImplementations = new Map();
    this.mockImplementations = new Map();
    this.initialized = false;
  }

  /**
   * Initialize the service factory
   * @returns {Promise<void>}
   */
  async initialize() {
    if (this.initialized) {
      return;
    }

    // Register service implementations
    this.registerServiceImplementations();
    
    // Detect available features
    const features = await FeatureDetector.detectFeatures();
    AppConfig.updateFeatures(Object.fromEntries(features));
    
    this.initialized = true;
    eventBus.emit(Events.SERVICE_READY, { service: 'ServiceFactory' });
  }

  /**
   * Register all available service implementations
   * @private
   */
  registerServiceImplementations() {
    // Cart service implementations
    this.serviceImplementations.set('cart', {
      primary: () => import('../core/CartManager.js'),
      fallback: () => import('./MockCartManager.js'),
      interface: 'ICartService'
    });

    // Inventory service implementations
    this.serviceImplementations.set('inventory', {
      primary: () => import('./InventoryService.js'),
      fallback: () => import('./LocalInventoryService.js'),
      interface: 'IInventoryService'
    });

    // Storage service implementations
    this.serviceImplementations.set('storage', {
      primary: () => import('./LocalStorageService.js'), // Use local storage as primary for now
      fallback: () => import('./LocalStorageService.js'),
      interface: 'IStorageService'
    });

    // Analytics service implementations
    this.serviceImplementations.set('analytics', {
      primary: () => import('./MockAnalyticsService.js'), // Use mock analytics as primary for now
      fallback: () => import('./MockAnalyticsService.js'),
      interface: 'IAnalyticsService'
    });
  }

  /**
   * Get or create a service instance
   * @param {string} serviceName - Name of the service
   * @param {Object} options - Service creation options
   * @returns {Promise<Object>} Service instance
   */
  async getService(serviceName, options = {}) {
    // Check if service already exists
    if (this.services.has(serviceName) && !options.forceNew) {
      return this.services.get(serviceName);
    }

    // Get service implementation configuration
    const serviceConfig = this.serviceImplementations.get(serviceName);
    if (!serviceConfig) {
      throw new Error(`Unknown service: ${serviceName}`);
    }

    // Try to create service with error boundary
    const service = await errorBoundary.wrap(
      this.createService.bind(this),
      {
        name: `ServiceFactory.getService.${serviceName}`,
        fallback: null,
        retry: true,
        retryAttempts: 2,
        retryDelay: 500
      }
    )(serviceName, serviceConfig, options);

    if (service) {
      this.services.set(serviceName, service);
      return service;
    }

    throw new Error(`Failed to create service: ${serviceName}`);
  }

  /**
   * Create a service instance
   * @private
   */
  async createService(serviceName, serviceConfig, options) {
    const { primary, fallback, interface: serviceInterface } = serviceConfig;
    const { useFallback = false, config = {} } = options;

    let ServiceClass = null;
    let isFallback = false;

    // Determine if we should use fallback
    const shouldUseFallback = useFallback || 
                             !AppConfig.isFeatureEnabled(serviceName) ||
                             !FeatureDetector.isAvailable(serviceName);

    if (!shouldUseFallback) {
      // Try to load primary implementation
      try {
        const module = await primary();
        ServiceClass = module.default || module[Object.keys(module)[0]];
        console.log(`✅ Loaded primary ${serviceName} service`);
      } catch (error) {
        console.warn(`Failed to load primary ${serviceName} service:`, error.message);
        isFallback = true;
      }
    } else {
      isFallback = true;
    }

    // Load fallback if needed
    if (isFallback && fallback) {
      try {
        const module = await fallback();
        ServiceClass = module.default || module[Object.keys(module)[0]];
        console.log(`📦 Loaded fallback ${serviceName} service`);
        eventBus.emit(Events.SERVICE_FALLBACK, { service: serviceName });
      } catch (error) {
        console.error(`Failed to load fallback ${serviceName} service:`, error);
        return null;
      }
    }

    if (!ServiceClass) {
      return null;
    }

    // Create service instance
    try {
      const service = new ServiceClass(config);
      
      // Initialize if method exists
      if (typeof service.initialize === 'function') {
        await service.initialize();
      }

      // Wrap service methods with error boundaries
      const protectedService = this.wrapServiceMethods(service, serviceName);
      
      // Add metadata
      protectedService._serviceName = serviceName;
      protectedService._isFallback = isFallback;
      protectedService._interface = serviceInterface;

      return protectedService;
    } catch (error) {
      console.error(`Failed to instantiate ${serviceName} service:`, error);
      return null;
    }
  }

  /**
   * Wrap service methods with error boundaries
   * @private
   */
  wrapServiceMethods(service, serviceName) {
    const protectedService = Object.create(service);
    
    // Get all methods from the prototype chain
    const methods = this.getAllMethods(service);
    
    methods.forEach(method => {
      if (typeof service[method] === 'function' && 
          !method.startsWith('_') && 
          method !== 'constructor') {
        protectedService[method] = errorBoundary.wrap(
          service[method].bind(service),
          {
            name: `${serviceName}.${method}`,
            fallback: null,
            critical: false
          }
        );
      }
    });

    return protectedService;
  }

  /**
   * Get all methods from an object including prototype chain
   * @private
   */
  getAllMethods(obj) {
    const methods = new Set();
    
    while (obj && obj !== Object.prototype) {
      Object.getOwnPropertyNames(obj).forEach(name => {
        if (typeof obj[name] === 'function') {
          methods.add(name);
        }
      });
      obj = Object.getPrototypeOf(obj);
    }
    
    return Array.from(methods);
  }

  /**
   * Create multiple services at once
   * @param {string[]} serviceNames - Array of service names
   * @param {Object} options - Options for all services
   * @returns {Promise<Map>} Map of service instances
   */
  async createServices(serviceNames, options = {}) {
    const services = new Map();
    
    const promises = serviceNames.map(async name => {
      try {
        const service = await this.getService(name, options);
        services.set(name, service);
      } catch (error) {
        console.error(`Failed to create service ${name}:`, error);
        services.set(name, null);
      }
    });
    
    await Promise.all(promises);
    return services;
  }

  /**
   * Register a custom service implementation
   * @param {string} serviceName
   * @param {Object} implementation
   */
  registerService(serviceName, implementation) {
    this.serviceImplementations.set(serviceName, implementation);
  }

  /**
   * Check if a service is available
   * @param {string} serviceName
   * @returns {boolean}
   */
  isServiceAvailable(serviceName) {
    return this.services.has(serviceName) || 
           this.serviceImplementations.has(serviceName);
  }

  /**
   * Get service status information
   * @returns {Object}
   */
  getStatus() {
    const status = {
      initialized: this.initialized,
      services: {}
    };
    
    this.services.forEach((service, name) => {
      status.services[name] = {
        loaded: true,
        fallback: service._isFallback || false,
        interface: service._interface || 'unknown'
      };
    });
    
    this.serviceImplementations.forEach((config, name) => {
      if (!status.services[name]) {
        status.services[name] = {
          loaded: false,
          available: true
        };
      }
    });
    
    return status;
  }

  /**
   * Clear all cached services
   */
  clearServices() {
    this.services.clear();
  }

  /**
   * Reload a specific service
   * @param {string} serviceName
   * @returns {Promise<Object>}
   */
  async reloadService(serviceName) {
    this.services.delete(serviceName);
    return this.getService(serviceName, { forceNew: true });
  }
}

// Create and export singleton instance
const serviceFactory = new ServiceFactory();

// Auto-initialize on first import
serviceFactory.initialize().catch(error => {
  console.error('Failed to initialize ServiceFactory:', error);
});

export default serviceFactory;