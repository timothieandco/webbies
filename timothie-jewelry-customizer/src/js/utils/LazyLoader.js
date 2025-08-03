/**
 * LazyLoader.js
 * 
 * Dynamic import and lazy loading system for the Timothie & Co Jewelry Customizer.
 * Enables progressive enhancement by loading heavy features only when needed,
 * improving initial load performance and providing graceful degradation.
 */

import AppConfig from '../config/AppConfig.js';
import eventBus, { Events } from '../core/EventBus.js';
import errorBoundary from './ErrorBoundary.js';

class LazyLoader {
  constructor() {
    this.loadedModules = new Map();
    this.loadingPromises = new Map();
    this.preloadQueue = [];
    this.loadObserver = null;
    this.initialized = false;
  }

  /**
   * Initialize the lazy loader
   */
  initialize() {
    if (this.initialized) {
      return;
    }

    // Set up intersection observer for viewport-based loading
    if ('IntersectionObserver' in window) {
      this.loadObserver = new IntersectionObserver(
        (entries) => this.handleIntersection(entries),
        { rootMargin: '50px' }
      );
    }

    // Listen for preload requests
    eventBus.on('lazy:preload', (modules) => this.preload(modules));
    
    this.initialized = true;
  }

  /**
   * Load a module dynamically
   * @param {string} modulePath - Path to the module
   * @param {Object} options - Loading options
   * @returns {Promise<*>} Loaded module
   */
  async load(modulePath, options = {}) {
    const {
      fallback = null,
      timeout = AppConfig.get('performance.apiTimeout', 10000),
      retry = true,
      retryAttempts = AppConfig.get('performance.retryAttempts', 3),
      retryDelay = AppConfig.get('performance.retryDelay', 1000),
      preload = false,
      critical = false
    } = options;

    // Return cached module if available
    if (this.loadedModules.has(modulePath)) {
      return this.loadedModules.get(modulePath);
    }

    // Return existing loading promise if module is being loaded
    if (this.loadingPromises.has(modulePath)) {
      return this.loadingPromises.get(modulePath);
    }

    // Create loading promise
    const loadingPromise = errorBoundary.wrap(
      this.performLoad.bind(this),
      {
        name: `LazyLoader.load.${modulePath}`,
        fallback,
        retry,
        retryAttempts,
        retryDelay,
        critical
      }
    )(modulePath, { timeout, preload });

    this.loadingPromises.set(modulePath, loadingPromise);

    try {
      const module = await loadingPromise;
      this.loadedModules.set(modulePath, module);
      this.loadingPromises.delete(modulePath);
      
      // Emit success event
      eventBus.emit(Events.LOADING_END, { module: modulePath, success: true });
      
      return module;
    } catch (error) {
      this.loadingPromises.delete(modulePath);
      
      // Emit failure event
      eventBus.emit(Events.LOADING_END, { module: modulePath, success: false, error });
      
      if (fallback) {
        console.warn(`Failed to load ${modulePath}, using fallback`);
        return fallback;
      }
      
      throw error;
    }
  }

  /**
   * Perform the actual module loading
   * @private
   */
  async performLoad(modulePath, options) {
    const { timeout, preload } = options;
    
    // Emit loading start event
    eventBus.emit(Events.LOADING_START, { module: modulePath, preload });
    
    // Create timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Timeout loading ${modulePath}`)), timeout);
    });
    
    // Use Function constructor to create dynamic import for webpack compatibility
    const dynamicImport = new Function('modulePath', 'return import(modulePath)');
    
    // Race between import and timeout
    const module = await Promise.race([
      dynamicImport(modulePath),
      timeoutPromise
    ]);
    
    return module;
  }

  /**
   * Preload modules for faster subsequent loading
   * @param {string|string[]} modules - Module path(s) to preload
   * @returns {Promise<void>}
   */
  async preload(modules) {
    const modulePaths = Array.isArray(modules) ? modules : [modules];
    
    const promises = modulePaths.map(path => 
      this.load(path, { preload: true, critical: false })
        .catch(error => console.warn(`Failed to preload ${path}:`, error))
    );
    
    await Promise.allSettled(promises);
  }

  /**
   * Load a module when an element enters the viewport
   * @param {HTMLElement} element - Element to observe
   * @param {string} modulePath - Module to load
   * @param {Function} callback - Callback after loading
   */
  loadOnVisible(element, modulePath, callback) {
    if (!this.loadObserver) {
      // Fallback for browsers without IntersectionObserver
      this.load(modulePath).then(callback).catch(console.error);
      return;
    }

    // Store loading info on element
    element._lazyModule = { modulePath, callback };
    
    // Start observing
    this.loadObserver.observe(element);
  }

  /**
   * Handle intersection observer events
   * @private
   */
  handleIntersection(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting && entry.target._lazyModule) {
        const { modulePath, callback } = entry.target._lazyModule;
        
        // Stop observing
        this.loadObserver.unobserve(entry.target);
        
        // Load module
        this.load(modulePath)
          .then(module => callback(module, entry.target))
          .catch(error => console.error('Failed to lazy load module:', error));
        
        // Clean up
        delete entry.target._lazyModule;
      }
    });
  }

  /**
   * Load multiple modules in parallel
   * @param {Array<{path: string, options?: Object}>} modules
   * @returns {Promise<Map>} Map of loaded modules
   */
  async loadMultiple(modules) {
    const results = new Map();
    
    const promises = modules.map(async ({ path, options = {} }) => {
      try {
        const module = await this.load(path, options);
        results.set(path, { success: true, module });
      } catch (error) {
        results.set(path, { success: false, error });
      }
    });
    
    await Promise.all(promises);
    return results;
  }

  /**
   * Create a lazy-loaded component
   * @param {string} modulePath - Path to component module
   * @param {Object} options - Component options
   * @returns {Object} Lazy component wrapper
   */
  createLazyComponent(modulePath, options = {}) {
    const {
      placeholder = null,
      errorComponent = null,
      loadingComponent = null,
      timeout = 10000
    } = options;

    return {
      _isLazyComponent: true,
      modulePath,
      
      render: async (container) => {
        // Show loading component
        if (loadingComponent) {
          container.innerHTML = '';
          container.appendChild(loadingComponent);
        }
        
        try {
          // Load the component module
          const module = await this.load(modulePath, { timeout });
          const Component = module.default || module[Object.keys(module)[0]];
          
          // Clear container and render component
          container.innerHTML = '';
          
          if (typeof Component === 'function') {
            // Handle class or function component
            const instance = new Component();
            if (instance.render) {
              instance.render(container);
            } else {
              container.appendChild(instance);
            }
          } else if (Component instanceof HTMLElement) {
            container.appendChild(Component);
          } else {
            throw new Error('Invalid component type');
          }
          
        } catch (error) {
          console.error(`Failed to load component ${modulePath}:`, error);
          
          // Show error component or placeholder
          container.innerHTML = '';
          if (errorComponent) {
            container.appendChild(errorComponent);
          } else if (placeholder) {
            container.appendChild(placeholder);
          } else {
            container.innerHTML = '<div class="error">Failed to load component</div>';
          }
        }
      }
    };
  }

  /**
   * Load a CSS file dynamically
   * @param {string} href - CSS file URL
   * @param {Object} options - Loading options
   * @returns {Promise<void>}
   */
  async loadCSS(href, options = {}) {
    const { timeout = 5000, attributes = {} } = options;
    
    // Check if already loaded
    const existing = document.querySelector(`link[href="${href}"]`);
    if (existing) {
      return Promise.resolve();
    }
    
    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      
      // Add custom attributes
      Object.entries(attributes).forEach(([key, value]) => {
        link.setAttribute(key, value);
      });
      
      // Set up load handlers
      let timeoutId;
      
      const cleanup = () => {
        clearTimeout(timeoutId);
        link.removeEventListener('load', handleLoad);
        link.removeEventListener('error', handleError);
      };
      
      const handleLoad = () => {
        cleanup();
        resolve();
      };
      
      const handleError = () => {
        cleanup();
        reject(new Error(`Failed to load CSS: ${href}`));
      };
      
      link.addEventListener('load', handleLoad);
      link.addEventListener('error', handleError);
      
      // Set timeout
      timeoutId = setTimeout(() => {
        cleanup();
        reject(new Error(`Timeout loading CSS: ${href}`));
      }, timeout);
      
      // Add to document
      document.head.appendChild(link);
    });
  }

  /**
   * Load a script file dynamically
   * @param {string} src - Script URL
   * @param {Object} options - Loading options
   * @returns {Promise<void>}
   */
  async loadScript(src, options = {}) {
    const { 
      timeout = 10000, 
      attributes = {},
      async = true,
      defer = false
    } = options;
    
    // Check if already loaded
    const existing = document.querySelector(`script[src="${src}"]`);
    if (existing) {
      return Promise.resolve();
    }
    
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = async;
      script.defer = defer;
      
      // Add custom attributes
      Object.entries(attributes).forEach(([key, value]) => {
        script.setAttribute(key, value);
      });
      
      // Set up load handlers
      let timeoutId;
      
      const cleanup = () => {
        clearTimeout(timeoutId);
        script.removeEventListener('load', handleLoad);
        script.removeEventListener('error', handleError);
      };
      
      const handleLoad = () => {
        cleanup();
        resolve();
      };
      
      const handleError = () => {
        cleanup();
        reject(new Error(`Failed to load script: ${src}`));
      };
      
      script.addEventListener('load', handleLoad);
      script.addEventListener('error', handleError);
      
      // Set timeout
      timeoutId = setTimeout(() => {
        cleanup();
        reject(new Error(`Timeout loading script: ${src}`));
      }, timeout);
      
      // Add to document
      document.head.appendChild(script);
    });
  }

  /**
   * Clear cached modules
   * @param {string} modulePath - Optional specific module to clear
   */
  clearCache(modulePath = null) {
    if (modulePath) {
      this.loadedModules.delete(modulePath);
    } else {
      this.loadedModules.clear();
    }
  }

  /**
   * Get loading statistics
   * @returns {Object}
   */
  getStats() {
    return {
      loadedModules: this.loadedModules.size,
      loadingInProgress: this.loadingPromises.size,
      modulesList: Array.from(this.loadedModules.keys())
    };
  }
}

// Create and export singleton instance
const lazyLoader = new LazyLoader();
lazyLoader.initialize();

export default lazyLoader;