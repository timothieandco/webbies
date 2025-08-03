/**
 * EventBus.js
 * 
 * A lightweight event-driven communication system for decoupling components
 * in the Timothie & Co Jewelry Customizer application.
 * 
 * This module enables components to communicate without direct dependencies,
 * supporting the modular architecture and preventing cascading failures.
 */

class EventBus {
  constructor() {
    this.events = new Map();
    this.onceEvents = new Map();
    this.eventHistory = [];
    this.maxHistorySize = 100;
    this.debug = false;
  }

  /**
   * Enable or disable debug logging
   * @param {boolean} enabled
   */
  setDebug(enabled) {
    this.debug = enabled;
  }

  /**
   * Subscribe to an event
   * @param {string} eventName - Name of the event
   * @param {Function} callback - Function to call when event is emitted
   * @param {Object} context - Optional context (this) for the callback
   * @returns {Function} Unsubscribe function
   */
  on(eventName, callback, context = null) {
    if (!this.events.has(eventName)) {
      this.events.set(eventName, []);
    }

    const listener = { callback, context };
    this.events.get(eventName).push(listener);

    if (this.debug) {
      console.log(`📡 Subscribed to "${eventName}"`);
    }

    // Return unsubscribe function
    return () => this.off(eventName, callback);
  }

  /**
   * Subscribe to an event that will only fire once
   * @param {string} eventName
   * @param {Function} callback
   * @param {Object} context
   * @returns {Function} Unsubscribe function
   */
  once(eventName, callback, context = null) {
    const wrappedCallback = (...args) => {
      callback.apply(context, args);
      this.off(eventName, wrappedCallback);
    };

    return this.on(eventName, wrappedCallback, context);
  }

  /**
   * Unsubscribe from an event
   * @param {string} eventName
   * @param {Function} callback
   */
  off(eventName, callback) {
    if (!this.events.has(eventName)) {
      return;
    }

    const listeners = this.events.get(eventName);
    const filtered = listeners.filter(listener => listener.callback !== callback);
    
    if (filtered.length === 0) {
      this.events.delete(eventName);
    } else {
      this.events.set(eventName, filtered);
    }

    if (this.debug) {
      console.log(`📡 Unsubscribed from "${eventName}"`);
    }
  }

  /**
   * Emit an event
   * @param {string} eventName
   * @param {...*} args - Arguments to pass to listeners
   */
  emit(eventName, ...args) {
    // Add to history
    this.addToHistory(eventName, args);

    if (!this.events.has(eventName)) {
      if (this.debug) {
        console.log(`📡 No listeners for "${eventName}"`);
      }
      return;
    }

    const listeners = this.events.get(eventName);
    const results = [];

    if (this.debug) {
      console.log(`📡 Emitting "${eventName}" to ${listeners.length} listeners`, args);
    }

    // Execute all listeners
    for (const listener of listeners) {
      try {
        const result = listener.callback.apply(listener.context, args);
        results.push(result);
      } catch (error) {
        console.error(`Error in event listener for "${eventName}":`, error);
        // Continue with other listeners even if one fails
      }
    }

    return results;
  }

  /**
   * Emit an event asynchronously
   * @param {string} eventName
   * @param {...*} args
   * @returns {Promise<Array>} Results from all listeners
   */
  async emitAsync(eventName, ...args) {
    // Add to history
    this.addToHistory(eventName, args);

    if (!this.events.has(eventName)) {
      return [];
    }

    const listeners = this.events.get(eventName);
    const promises = [];

    if (this.debug) {
      console.log(`📡 Emitting async "${eventName}" to ${listeners.length} listeners`);
    }

    for (const listener of listeners) {
      const promise = Promise.resolve()
        .then(() => listener.callback.apply(listener.context, args))
        .catch(error => {
          console.error(`Error in async event listener for "${eventName}":`, error);
          return null;
        });
      promises.push(promise);
    }

    return Promise.all(promises);
  }

  /**
   * Wait for an event to be emitted
   * @param {string} eventName
   * @param {number} timeout - Optional timeout in milliseconds
   * @returns {Promise} Resolves with event data
   */
  waitFor(eventName, timeout = null) {
    return new Promise((resolve, reject) => {
      let timeoutId;
      
      const cleanup = () => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
        this.off(eventName, handler);
      };

      const handler = (...args) => {
        cleanup();
        resolve(args);
      };

      this.once(eventName, handler);

      if (timeout) {
        timeoutId = setTimeout(() => {
          cleanup();
          reject(new Error(`Timeout waiting for event "${eventName}"`));
        }, timeout);
      }
    });
  }

  /**
   * Remove all listeners for an event
   * @param {string} eventName - Optional, if not provided clears all events
   */
  clear(eventName = null) {
    if (eventName) {
      this.events.delete(eventName);
      if (this.debug) {
        console.log(`📡 Cleared all listeners for "${eventName}"`);
      }
    } else {
      this.events.clear();
      if (this.debug) {
        console.log('📡 Cleared all event listeners');
      }
    }
  }

  /**
   * Get the number of listeners for an event
   * @param {string} eventName
   * @returns {number}
   */
  listenerCount(eventName) {
    return this.events.has(eventName) ? this.events.get(eventName).length : 0;
  }

  /**
   * Get all registered event names
   * @returns {string[]}
   */
  eventNames() {
    return Array.from(this.events.keys());
  }

  /**
   * Add event to history for debugging
   * @private
   */
  addToHistory(eventName, args) {
    this.eventHistory.push({
      eventName,
      args,
      timestamp: Date.now()
    });

    // Keep history size limited
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }
  }

  /**
   * Get event history for debugging
   * @param {string} eventName - Optional filter by event name
   * @returns {Array}
   */
  getHistory(eventName = null) {
    if (eventName) {
      return this.eventHistory.filter(entry => entry.eventName === eventName);
    }
    return [...this.eventHistory];
  }

  /**
   * Create a namespaced event bus
   * @param {string} namespace
   * @returns {Object} Namespaced event bus interface
   */
  namespace(namespace) {
    const prefix = namespace + ':';
    
    return {
      on: (eventName, callback, context) => 
        this.on(prefix + eventName, callback, context),
      
      once: (eventName, callback, context) => 
        this.once(prefix + eventName, callback, context),
      
      off: (eventName, callback) => 
        this.off(prefix + eventName, callback),
      
      emit: (eventName, ...args) => 
        this.emit(prefix + eventName, ...args),
      
      emitAsync: (eventName, ...args) => 
        this.emitAsync(prefix + eventName, ...args),
      
      clear: (eventName) => 
        this.clear(eventName ? prefix + eventName : null)
    };
  }
}

// Create singleton instance
const eventBus = new EventBus();

// Common event names as constants
export const Events = {
  // App lifecycle
  APP_INIT: 'app:init',
  APP_READY: 'app:ready',
  APP_ERROR: 'app:error',
  
  // Feature detection
  FEATURES_DETECTED: 'features:detected',
  FEATURE_ENABLED: 'feature:enabled',
  FEATURE_DISABLED: 'feature:disabled',
  
  // Service events
  SERVICE_READY: 'service:ready',
  SERVICE_ERROR: 'service:error',
  SERVICE_FALLBACK: 'service:fallback',
  
  // Cart events
  CART_ADD: 'cart:add',
  CART_REMOVE: 'cart:remove',
  CART_UPDATE: 'cart:update',
  CART_CLEAR: 'cart:clear',
  
  // Inventory events
  INVENTORY_LOADED: 'inventory:loaded',
  INVENTORY_ERROR: 'inventory:error',
  INVENTORY_SEARCH: 'inventory:search',
  
  // Customizer events
  CHARM_ADDED: 'customizer:charm:added',
  CHARM_REMOVED: 'customizer:charm:removed',
  DESIGN_SAVED: 'customizer:design:saved',
  DESIGN_LOADED: 'customizer:design:loaded',
  
  // UI events
  MODAL_OPEN: 'ui:modal:open',
  MODAL_CLOSE: 'ui:modal:close',
  LOADING_START: 'ui:loading:start',
  LOADING_END: 'ui:loading:end',
  NOTIFICATION: 'ui:notification'
};

// Export singleton
export default eventBus;