/**
 * ErrorBoundary.js
 * 
 * Error isolation and recovery system for the Timothie & Co Jewelry Customizer.
 * Provides component-level error boundaries to prevent cascading failures
 * and maintain application stability.
 * 
 * Since we're not using React, this implements a similar pattern using
 * try-catch blocks and error handling decorators.
 */

import eventBus, { Events } from '../core/EventBus.js';

class ErrorBoundary {
  constructor() {
    this.errorHandlers = new Map();
    this.errorCount = 0;
    this.errorLog = [];
    this.maxErrorLogSize = 50;
    this.recoveryStrategies = new Map();
  }

  /**
   * Wrap a function with error boundary protection
   * @param {Function} fn - Function to protect
   * @param {Object} options - Error handling options
   * @returns {Function} Protected function
   */
  wrap(fn, options = {}) {
    const {
      name = fn.name || 'anonymous',
      fallback = null,
      onError = null,
      retry = false,
      retryAttempts = 3,
      retryDelay = 1000,
      critical = false
    } = options;

    return async (...args) => {
      let attempts = 0;
      
      while (attempts < (retry ? retryAttempts : 1)) {
        try {
          attempts++;
          return await fn.apply(this, args);
        } catch (error) {
          // Log the error
          this.logError({
            name,
            error,
            args,
            attempt: attempts,
            critical
          });

          // Call custom error handler if provided
          if (onError) {
            try {
              const handled = await onError(error, { name, args, attempt: attempts });
              if (handled !== undefined) {
                return handled;
              }
            } catch (handlerError) {
              console.error('Error in error handler:', handlerError);
            }
          }

          // Emit error event
          eventBus.emit(Events.APP_ERROR, {
            component: name,
            error,
            critical
          });

          // If this is a retry scenario and we have attempts left
          if (retry && attempts < retryAttempts) {
            console.warn(`Retrying ${name} (attempt ${attempts + 1}/${retryAttempts})...`);
            await this.delay(retryDelay * attempts); // Exponential backoff
            continue;
          }

          // If critical error, propagate it
          if (critical) {
            throw error;
          }

          // Return fallback value
          if (typeof fallback === 'function') {
            return fallback(error, args);
          }
          return fallback;
        }
      }
    };
  }

  /**
   * Create a protected class wrapper
   * @param {Class} ClassToWrap - Class to protect
   * @param {Object} options - Protection options
   * @returns {Class} Protected class
   */
  wrapClass(ClassToWrap, options = {}) {
    const boundary = this;
    
    return class ProtectedClass extends ClassToWrap {
      constructor(...args) {
        try {
          super(...args);
          this._errorBoundary = boundary;
          this._componentName = options.name || ClassToWrap.name;
        } catch (error) {
          boundary.handleClassError(error, ClassToWrap.name, 'constructor', args);
          if (options.throwOnConstructorError !== false) {
            throw error;
          }
        }
      }
    };
  }

  /**
   * Decorator for protecting class methods
   * @param {Object} options - Protection options
   */
  protect(options = {}) {
    const boundary = this;
    
    return function(target, propertyKey, descriptor) {
      const originalMethod = descriptor.value;
      
      descriptor.value = boundary.wrap(originalMethod, {
        name: `${target.constructor.name}.${propertyKey}`,
        ...options
      });
      
      return descriptor;
    };
  }

  /**
   * Create a protected zone for synchronous code
   * @param {Function} fn - Function to run in protected zone
   * @param {Object} options - Protection options
   * @returns {*} Function result or fallback
   */
  zone(fn, options = {}) {
    const {
      name = 'zone',
      fallback = null,
      onError = null
    } = options;

    try {
      return fn();
    } catch (error) {
      this.logError({ name, error });
      
      if (onError) {
        const handled = onError(error);
        if (handled !== undefined) {
          return handled;
        }
      }
      
      eventBus.emit(Events.APP_ERROR, {
        component: name,
        error,
        zone: true
      });
      
      return fallback;
    }
  }

  /**
   * Register a recovery strategy for specific error types
   * @param {string|RegExp} errorPattern - Error type or pattern
   * @param {Function} recoveryFn - Recovery function
   */
  registerRecovery(errorPattern, recoveryFn) {
    this.recoveryStrategies.set(errorPattern, recoveryFn);
  }

  /**
   * Attempt to recover from an error
   * @param {Error} error
   * @param {Object} context
   * @returns {*} Recovery result
   */
  async attemptRecovery(error, context = {}) {
    for (const [pattern, recoveryFn] of this.recoveryStrategies) {
      let matches = false;
      
      if (typeof pattern === 'string') {
        matches = error.name === pattern || error.message.includes(pattern);
      } else if (pattern instanceof RegExp) {
        matches = pattern.test(error.message);
      }
      
      if (matches) {
        try {
          return await recoveryFn(error, context);
        } catch (recoveryError) {
          console.error('Recovery failed:', recoveryError);
        }
      }
    }
    
    return null;
  }

  /**
   * Log an error
   * @private
   */
  logError(errorInfo) {
    this.errorCount++;
    
    const logEntry = {
      ...errorInfo,
      timestamp: Date.now(),
      stack: errorInfo.error?.stack
    };
    
    this.errorLog.push(logEntry);
    
    // Keep log size limited
    if (this.errorLog.length > this.maxErrorLogSize) {
      this.errorLog.shift();
    }
    
    // Console logging
    console.error(`[ErrorBoundary] ${errorInfo.name}:`, errorInfo.error);
  }

  /**
   * Handle class method errors
   * @private
   */
  handleClassError(error, className, methodName, args) {
    this.logError({
      name: `${className}.${methodName}`,
      error,
      args,
      classError: true
    });
  }

  /**
   * Create a fallback UI for component errors
   * @param {HTMLElement} container
   * @param {Error} error
   * @param {Object} options
   */
  renderErrorUI(container, error, options = {}) {
    const {
      title = 'Something went wrong',
      message = 'We encountered an error. Please try refreshing the page.',
      showDetails = false,
      onRetry = null
    } = options;

    const errorUI = document.createElement('div');
    errorUI.className = 'error-boundary-ui';
    errorUI.innerHTML = `
      <div class="error-boundary-content">
        <h3>${title}</h3>
        <p>${message}</p>
        ${showDetails ? `<details>
          <summary>Error details</summary>
          <pre>${error.toString()}</pre>
        </details>` : ''}
        ${onRetry ? '<button class="error-boundary-retry">Try Again</button>' : ''}
      </div>
    `;

    // Add styles if not already present
    if (!document.getElementById('error-boundary-styles')) {
      const styles = document.createElement('style');
      styles.id = 'error-boundary-styles';
      styles.textContent = `
        .error-boundary-ui {
          padding: 20px;
          background: #fff5f5;
          border: 1px solid #feb2b2;
          border-radius: 8px;
          margin: 20px;
          text-align: center;
        }
        .error-boundary-content h3 {
          color: #c53030;
          margin: 0 0 10px;
        }
        .error-boundary-content p {
          color: #742a2a;
          margin: 0 0 15px;
        }
        .error-boundary-content details {
          text-align: left;
          margin: 15px 0;
        }
        .error-boundary-content pre {
          background: #fff;
          padding: 10px;
          border-radius: 4px;
          overflow-x: auto;
          font-size: 12px;
        }
        .error-boundary-retry {
          background: #e53e3e;
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 14px;
        }
        .error-boundary-retry:hover {
          background: #c53030;
        }
      `;
      document.head.appendChild(styles);
    }

    // Add retry handler
    if (onRetry) {
      errorUI.querySelector('.error-boundary-retry')?.addEventListener('click', onRetry);
    }

    // Clear container and add error UI
    container.innerHTML = '';
    container.appendChild(errorUI);
  }

  /**
   * Get error statistics
   * @returns {Object}
   */
  getStats() {
    const stats = {
      totalErrors: this.errorCount,
      recentErrors: this.errorLog.length,
      errorsByComponent: {},
      criticalErrors: 0
    };

    this.errorLog.forEach(entry => {
      if (!stats.errorsByComponent[entry.name]) {
        stats.errorsByComponent[entry.name] = 0;
      }
      stats.errorsByComponent[entry.name]++;
      
      if (entry.critical) {
        stats.criticalErrors++;
      }
    });

    return stats;
  }

  /**
   * Clear error log
   */
  clearErrorLog() {
    this.errorLog = [];
    this.errorCount = 0;
  }

  /**
   * Utility delay function
   * @private
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Create singleton instance
const errorBoundary = new ErrorBoundary();

// Register default recovery strategies
errorBoundary.registerRecovery('NetworkError', async (error, context) => {
  console.log('Attempting network error recovery...');
  // Could implement offline mode activation here
  eventBus.emit(Events.SERVICE_FALLBACK, { service: 'network', error });
  return null;
});

errorBoundary.registerRecovery(/supabase/i, async (error, context) => {
  console.log('Supabase error detected, falling back to local mode...');
  eventBus.emit(Events.SERVICE_FALLBACK, { service: 'supabase', error });
  return null;
});

// Export singleton and decorator
export default errorBoundary;
export const protect = errorBoundary.protect.bind(errorBoundary);