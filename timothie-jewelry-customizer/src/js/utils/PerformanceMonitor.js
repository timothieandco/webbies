/**
 * Performance Monitor - Real-time performance tracking and optimization
 * for Timothie & Co Jewelry Customizer
 * 
 * Features:
 * - Page load time monitoring
 * - Cart operation performance tracking
 * - Memory usage monitoring
 * - Network request timing
 * - Core Web Vitals tracking
 * - Real-time performance alerts
 * - Performance data collection and reporting
 */

class PerformanceMonitor {
    constructor(options = {}) {
        this.options = {
            // Performance thresholds
            pageLoadThreshold: options.pageLoadThreshold || 3000, // 3 seconds
            cartOperationThreshold: options.cartOperationThreshold || 100, // 100ms
            memoryThreshold: options.memoryThreshold || 50 * 1024 * 1024, // 50MB
            networkThreshold: options.networkThreshold || 2000, // 2 seconds
            
            // Monitoring settings
            enableRealTimeMonitoring: options.enableRealTimeMonitoring !== false,
            enableMemoryMonitoring: options.enableMemoryMonitoring !== false,
            enableNetworkMonitoring: options.enableNetworkMonitoring !== false,
            enableCoreWebVitals: options.enableCoreWebVitals !== false,
            
            // Data collection
            maxDataPoints: options.maxDataPoints || 1000,
            reportingInterval: options.reportingInterval || 30000, // 30 seconds
            
            // Alerts
            enableAlerts: options.enableAlerts !== false,
            alertThresholds: {
                slowPageLoad: 5000, // 5 seconds
                slowCartOperation: 500, // 500ms
                highMemoryUsage: 100 * 1024 * 1024, // 100MB
                slowNetworkRequest: 5000 // 5 seconds
            },
            
            ...options
        };

        // Performance data storage
        this.metrics = {
            pageLoads: [],
            cartOperations: [],
            networkRequests: [],
            memoryUsage: [],
            coreWebVitals: {},
            userInteractions: []
        };

        // Real-time monitoring state
        this.isMonitoring = false;
        this.startTime = performance.now();
        this.observers = new Map();
        this.intervals = new Map();
        
        // Performance API support
        this.supportsPerformanceAPI = 'performance' in window;
        this.supportsMemoryAPI = 'memory' in performance;
        this.supportsObserver = 'PerformanceObserver' in window;
        
        // Event listeners
        this.eventListeners = new Map();
        
        // Initialize if auto-start is enabled
        if (options.autoStart !== false) {
            this.initialize();
        }
    }

    /**
     * Initialize the performance monitor
     */
    async initialize() {
        try {
            console.log('Initializing Performance Monitor...');
            
            // Setup core monitoring
            this.setupPageLoadMonitoring();
            this.setupNetworkMonitoring();
            this.setupUserInteractionMonitoring();
            
            // Setup Core Web Vitals if supported
            if (this.options.enableCoreWebVitals && this.supportsObserver) {
                this.setupCoreWebVitalsMonitoring();
            }
            
            // Setup memory monitoring if supported
            if (this.options.enableMemoryMonitoring && this.supportsMemoryAPI) {
                this.setupMemoryMonitoring();
            }
            
            // Setup real-time monitoring
            if (this.options.enableRealTimeMonitoring) {
                this.startRealTimeMonitoring();
            }
            
            // Setup reporting
            this.setupPeriodicReporting();
            
            // Setup cart operation monitoring
            this.setupCartMonitoring();
            
            this.isMonitoring = true;
            console.log('Performance Monitor initialized successfully');
            
            // Initial performance snapshot
            this.captureInitialMetrics();
            
        } catch (error) {
            console.error('Failed to initialize Performance Monitor:', error);
            throw error;
        }
    }

    // ===========================================
    // Page Load Monitoring
    // ===========================================

    setupPageLoadMonitoring() {
        // Monitor initial page load
        window.addEventListener('load', () => {
            this.measurePageLoad();
        });

        // Monitor navigation timing
        if (this.supportsPerformanceAPI) {
            this.captureNavigationTiming();
        }
    }

    measurePageLoad() {
        if (!this.supportsPerformanceAPI) return;

        const navigation = performance.getEntriesByType('navigation')[0];
        if (!navigation) return;

        const metrics = {
            timestamp: Date.now(),
            page: window.location.pathname,
            domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
            loadComplete: navigation.loadEventEnd - navigation.navigationStart,
            domInteractive: navigation.domInteractive - navigation.navigationStart,
            firstByte: navigation.responseStart - navigation.navigationStart,
            dnsLookup: navigation.domainLookupEnd - navigation.domainLookupStart,
            tcpConnect: navigation.connectEnd - navigation.connectStart,
            serverResponse: navigation.responseEnd - navigation.responseStart,
            domProcessing: navigation.domComplete - navigation.domLoading,
            resourceLoad: navigation.loadEventEnd - navigation.domContentLoadedEventEnd
        };

        this.addMetric('pageLoads', metrics);

        // Check for performance issues
        if (metrics.loadComplete > this.options.alertThresholds.slowPageLoad) {
            this.triggerAlert('slow_page_load', {
                page: metrics.page,
                loadTime: metrics.loadComplete,
                threshold: this.options.alertThresholds.slowPageLoad
            });
        }

        console.log('Page Load Metrics:', metrics);
    }

    captureNavigationTiming() {
        if ('getEntriesByType' in performance) {
            const entries = performance.getEntriesByType('navigation');
            if (entries.length > 0) {
                const navigation = entries[0];
                this.metrics.navigationTiming = {
                    redirectTime: navigation.redirectEnd - navigation.redirectStart,
                    dnsTime: navigation.domainLookupEnd - navigation.domainLookupStart,
                    tcpTime: navigation.connectEnd - navigation.connectStart,
                    requestTime: navigation.responseEnd - navigation.requestStart,
                    responseTime: navigation.responseEnd - navigation.responseStart,
                    domProcessingTime: navigation.domComplete - navigation.domLoading,
                    loadEventTime: navigation.loadEventEnd - navigation.loadEventStart
                };
            }
        }
    }

    // ===========================================
    // Network Monitoring
    // ===========================================

    setupNetworkMonitoring() {
        if (!this.supportsObserver) return;

        try {
            const observer = new PerformanceObserver((list) => {
                list.getEntries().forEach(entry => {
                    if (entry.entryType === 'resource') {
                        this.processResourceEntry(entry);
                    }
                });
            });

            observer.observe({ entryTypes: ['resource'] });
            this.observers.set('network', observer);
        } catch (error) {
            console.warn('Failed to setup network monitoring:', error);
        }
    }

    processResourceEntry(entry) {
        const resourceMetrics = {
            timestamp: Date.now(),
            name: entry.name,
            type: this.getResourceType(entry.name),
            duration: entry.duration,
            size: entry.transferSize || entry.encodedBodySize || 0,
            startTime: entry.startTime,
            fetchStart: entry.fetchStart,
            dnsLookup: entry.domainLookupEnd - entry.domainLookupStart,
            tcpConnect: entry.connectEnd - entry.connectStart,
            requestTime: entry.responseStart - entry.requestStart,
            responseTime: entry.responseEnd - entry.responseStart,
            cached: entry.transferSize === 0 && entry.encodedBodySize > 0
        };

        this.addMetric('networkRequests', resourceMetrics);

        // Check for slow network requests
        if (resourceMetrics.duration > this.options.alertThresholds.slowNetworkRequest) {
            this.triggerAlert('slow_network_request', {
                resource: resourceMetrics.name,
                duration: resourceMetrics.duration,
                type: resourceMetrics.type
            });
        }
    }

    getResourceType(url) {
        if (url.includes('.js')) return 'script';
        if (url.includes('.css')) return 'stylesheet';
        if (url.match(/\.(jpg|jpeg|png|gif|svg|webp)$/i)) return 'image';
        if (url.includes('/api/') || url.includes('supabase')) return 'xhr';
        return 'other';
    }

    // ===========================================
    // Memory Monitoring
    // ===========================================

    setupMemoryMonitoring() {
        if (!this.supportsMemoryAPI) return;

        const monitorMemory = () => {
            const memoryInfo = performance.memory;
            const memoryMetrics = {
                timestamp: Date.now(),
                used: memoryInfo.usedJSHeapSize,
                total: memoryInfo.totalJSHeapSize,
                limit: memoryInfo.jsHeapSizeLimit,
                usedMB: (memoryInfo.usedJSHeapSize / 1024 / 1024).toFixed(2),
                totalMB: (memoryInfo.totalJSHeapSize / 1024 / 1024).toFixed(2),
                usagePercent: ((memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100).toFixed(2)
            };

            this.addMetric('memoryUsage', memoryMetrics);

            // Check for high memory usage
            if (memoryInfo.usedJSHeapSize > this.options.alertThresholds.highMemoryUsage) {
                this.triggerAlert('high_memory_usage', {
                    used: memoryMetrics.usedMB,
                    percent: memoryMetrics.usagePercent
                });
            }
        };

        // Monitor memory every 5 seconds
        const memoryInterval = setInterval(monitorMemory, 5000);
        this.intervals.set('memory', memoryInterval);

        // Initial measurement
        monitorMemory();
    }

    // ===========================================
    // Core Web Vitals Monitoring
    // ===========================================

    setupCoreWebVitalsMonitoring() {
        // Largest Contentful Paint (LCP)
        this.observeWebVital('largest-contentful-paint', (entry) => {
            this.metrics.coreWebVitals.lcp = {
                value: entry.startTime,
                rating: entry.startTime <= 2500 ? 'good' : entry.startTime <= 4000 ? 'needs-improvement' : 'poor',
                element: entry.element
            };
        });

        // First Input Delay (FID)
        this.observeWebVital('first-input', (entry) => {
            this.metrics.coreWebVitals.fid = {
                value: entry.processingStart - entry.startTime,
                rating: (entry.processingStart - entry.startTime) <= 100 ? 'good' : 
                       (entry.processingStart - entry.startTime) <= 300 ? 'needs-improvement' : 'poor',
                inputType: entry.name
            };
        });

        // Cumulative Layout Shift (CLS)
        this.observeWebVital('layout-shift', (entry) => {
            if (!entry.hadRecentInput) {
                this.metrics.coreWebVitals.cls = this.metrics.coreWebVitals.cls || 0;
                this.metrics.coreWebVitals.cls += entry.value;
                this.metrics.coreWebVitals.clsRating = this.metrics.coreWebVitals.cls <= 0.1 ? 'good' : 
                                                      this.metrics.coreWebVitals.cls <= 0.25 ? 'needs-improvement' : 'poor';
            }
        });
    }

    observeWebVital(type, callback) {
        try {
            const observer = new PerformanceObserver((list) => {
                list.getEntries().forEach(callback);
            });
            observer.observe({ type, buffered: true });
            this.observers.set(type, observer);
        } catch (error) {
            console.warn(`Failed to observe ${type}:`, error);
        }
    }

    // ===========================================
    // Cart Operation Monitoring
    // ===========================================

    setupCartMonitoring() {
        // Listen for cart events
        const cartEvents = [
            'cart-item-added',
            'cart-item-removed',
            'cart-item-updated',
            'cart-cleared',
            'cart-calculated'
        ];

        cartEvents.forEach(eventType => {
            document.addEventListener(eventType, (event) => {
                this.monitorCartOperation(eventType, event.detail);
            });
        });
    }

    monitorCartOperation(operation, data) {
        const operationMetrics = {
            timestamp: Date.now(),
            operation: operation,
            duration: data.duration || 0,
            itemCount: data.summary?.itemCount || 0,
            cartTotal: data.summary?.total || 0,
            success: true
        };

        this.addMetric('cartOperations', operationMetrics);

        // Check for slow cart operations
        if (operationMetrics.duration > this.options.alertThresholds.slowCartOperation) {
            this.triggerAlert('slow_cart_operation', {
                operation: operation,
                duration: operationMetrics.duration
            });
        }
    }

    /**
     * Measure cart operation performance
     */
    measureCartOperation(operationName, operation) {
        return async (...args) => {
            const startTime = performance.now();
            
            try {
                const result = await operation(...args);
                const duration = performance.now() - startTime;
                
                this.monitorCartOperation(operationName, { duration, success: true });
                
                return result;
            } catch (error) {
                const duration = performance.now() - startTime;
                
                this.monitorCartOperation(operationName, { duration, success: false, error: error.message });
                
                throw error;
            }
        };
    }

    // ===========================================
    // User Interaction Monitoring
    // ===========================================

    setupUserInteractionMonitoring() {
        const interactionEvents = ['click', 'scroll', 'keydown', 'touchstart'];
        
        interactionEvents.forEach(eventType => {
            const handler = (event) => {
                this.trackUserInteraction(eventType, event);
            };
            
            document.addEventListener(eventType, handler, { passive: true });
            this.eventListeners.set(eventType, handler);
        });
    }

    trackUserInteraction(type, event) {
        const interaction = {
            timestamp: Date.now(),
            type: type,
            target: event.target.tagName.toLowerCase(),
            targetId: event.target.id,
            targetClass: event.target.className,
            page: window.location.pathname
        };

        this.addMetric('userInteractions', interaction);
    }

    // ===========================================
    // Real-time Monitoring
    // ===========================================

    startRealTimeMonitoring() {
        const monitor = () => {
            this.captureRealTimeMetrics();
        };

        // Monitor every 10 seconds
        const monitoringInterval = setInterval(monitor, 10000);
        this.intervals.set('realtime', monitoringInterval);

        // Initial capture
        monitor();
    }

    captureRealTimeMetrics() {
        const metrics = {
            timestamp: Date.now(),
            performance: {
                now: performance.now(),
                timeOrigin: performance.timeOrigin
            }
        };

        // Add memory info if available
        if (this.supportsMemoryAPI) {
            metrics.memory = {
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize
            };
        }

        // Add connection info if available
        if ('connection' in navigator) {
            metrics.network = {
                effectiveType: navigator.connection.effectiveType,
                downlink: navigator.connection.downlink,
                rtt: navigator.connection.rtt
            };
        }

        this.addMetric('realtime', metrics);
    }

    // ===========================================
    // Performance Analysis Methods
    // ===========================================

    /**
     * Get performance summary
     */
    getPerformanceSummary() {
        const summary = {
            monitoring: {
                isActive: this.isMonitoring,
                startTime: this.startTime,
                duration: performance.now() - this.startTime
            },
            pageLoads: this.analyzePageLoads(),
            cartOperations: this.analyzeCartOperations(),
            networkRequests: this.analyzeNetworkRequests(),
            memoryUsage: this.analyzeMemoryUsage(),
            coreWebVitals: this.metrics.coreWebVitals,
            userInteractions: this.analyzeUserInteractions()
        };

        return summary;
    }

    analyzePageLoads() {
        const loads = this.metrics.pageLoads;
        if (loads.length === 0) return null;

        const latest = loads[loads.length - 1];
        const average = loads.reduce((sum, load) => sum + load.loadComplete, 0) / loads.length;

        return {
            total: loads.length,
            latest: latest.loadComplete,
            average: average.toFixed(2),
            slowLoads: loads.filter(load => load.loadComplete > this.options.pageLoadThreshold).length
        };
    }

    analyzeCartOperations() {
        const operations = this.metrics.cartOperations;
        if (operations.length === 0) return null;

        const successful = operations.filter(op => op.success);
        const failed = operations.filter(op => !op.success);
        const avgDuration = successful.length > 0 ? 
            successful.reduce((sum, op) => sum + op.duration, 0) / successful.length : 0;

        return {
            total: operations.length,
            successful: successful.length,
            failed: failed.length,
            averageDuration: avgDuration.toFixed(2),
            slowOperations: operations.filter(op => op.duration > this.options.cartOperationThreshold).length
        };
    }

    analyzeNetworkRequests() {
        const requests = this.metrics.networkRequests;
        if (requests.length === 0) return null;

        const byType = requests.reduce((acc, req) => {
            acc[req.type] = (acc[req.type] || 0) + 1;
            return acc;
        }, {});

        const totalSize = requests.reduce((sum, req) => sum + (req.size || 0), 0);
        const avgDuration = requests.reduce((sum, req) => sum + req.duration, 0) / requests.length;

        return {
            total: requests.length,
            byType: byType,
            totalSize: (totalSize / 1024).toFixed(2) + ' KB',
            averageDuration: avgDuration.toFixed(2),
            cached: requests.filter(req => req.cached).length
        };
    }

    analyzeMemoryUsage() {
        const usage = this.metrics.memoryUsage;
        if (usage.length === 0) return null;

        const latest = usage[usage.length - 1];
        const peak = Math.max(...usage.map(u => u.used));

        return {
            current: latest.usedMB + ' MB',
            peak: (peak / 1024 / 1024).toFixed(2) + ' MB',
            currentPercent: latest.usagePercent + '%',
            samples: usage.length
        };
    }

    analyzeUserInteractions() {
        const interactions = this.metrics.userInteractions;
        if (interactions.length === 0) return null;

        const byType = interactions.reduce((acc, interaction) => {
            acc[interaction.type] = (acc[interaction.type] || 0) + 1;
            return acc;
        }, {});

        return {
            total: interactions.length,
            byType: byType,
            timeRange: interactions.length > 0 ? {
                start: new Date(interactions[0].timestamp).toLocaleTimeString(),
                end: new Date(interactions[interactions.length - 1].timestamp).toLocaleTimeString()
            } : null
        };
    }

    // ===========================================
    // Performance Optimization Suggestions
    // ===========================================

    getOptimizationSuggestions() {
        const suggestions = [];
        const summary = this.getPerformanceSummary();

        // Page load suggestions
        if (summary.pageLoads && parseFloat(summary.pageLoads.average) > 3000) {
            suggestions.push({
                type: 'page_load',
                priority: 'high',
                issue: 'Slow page load times',
                suggestion: 'Consider implementing code splitting, lazy loading, or optimizing bundle size',
                currentValue: summary.pageLoads.average + 'ms',
                targetValue: '< 3000ms'
            });
        }

        // Cart operation suggestions
        if (summary.cartOperations && parseFloat(summary.cartOperations.averageDuration) > 100) {
            suggestions.push({
                type: 'cart_performance',
                priority: 'medium',
                issue: 'Slow cart operations',
                suggestion: 'Optimize cart calculations and consider caching frequently accessed data',
                currentValue: summary.cartOperations.averageDuration + 'ms',
                targetValue: '< 100ms'
            });
        }

        // Memory usage suggestions
        if (summary.memoryUsage && parseFloat(summary.memoryUsage.currentPercent) > 70) {
            suggestions.push({
                type: 'memory_usage',
                priority: 'high',
                issue: 'High memory usage',
                suggestion: 'Implement memory optimization, cleanup unused objects, and consider lazy loading',
                currentValue: summary.memoryUsage.currentPercent,
                targetValue: '< 70%'
            });
        }

        // Core Web Vitals suggestions
        if (summary.coreWebVitals.lcp && summary.coreWebVitals.lcp.rating !== 'good') {
            suggestions.push({
                type: 'core_web_vitals',
                priority: 'high',
                issue: 'Poor Largest Contentful Paint (LCP)',
                suggestion: 'Optimize largest content element loading, consider image optimization and preloading',
                currentValue: summary.coreWebVitals.lcp.value.toFixed(2) + 'ms',
                targetValue: '< 2500ms'
            });
        }

        return suggestions;
    }

    // ===========================================
    // Utility Methods
    // ===========================================

    addMetric(type, data) {
        if (!this.metrics[type]) {
            this.metrics[type] = [];
        }

        this.metrics[type].push(data);

        // Limit data points to prevent memory issues
        if (this.metrics[type].length > this.options.maxDataPoints) {
            this.metrics[type].shift();
        }
    }

    triggerAlert(type, data) {
        if (!this.options.enableAlerts) return;

        console.warn(`Performance Alert [${type}]:`, data);

        // Emit custom event
        const alertEvent = new CustomEvent('performance-alert', {
            detail: { type, data, timestamp: Date.now() }
        });
        document.dispatchEvent(alertEvent);
    }

    captureInitialMetrics() {
        // Capture initial state
        const initialMetrics = {
            timestamp: Date.now(),
            userAgent: navigator.userAgent,
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            url: window.location.href,
            supports: {
                performanceAPI: this.supportsPerformanceAPI,
                memoryAPI: this.supportsMemoryAPI,
                performanceObserver: this.supportsObserver
            }
        };

        this.metrics.initial = initialMetrics;
    }

    setupPeriodicReporting() {
        const report = () => {
            if (this.options.enableReporting) {
                const summary = this.getPerformanceSummary();
                console.log('Performance Report:', summary);
                
                // Emit reporting event
                const reportEvent = new CustomEvent('performance-report', {
                    detail: summary
                });
                document.dispatchEvent(reportEvent);
            }
        };

        const reportingInterval = setInterval(report, this.options.reportingInterval);
        this.intervals.set('reporting', reportingInterval);
    }

    /**
     * Export performance data
     */
    exportData() {
        return {
            metadata: {
                exportTime: Date.now(),
                monitoringDuration: performance.now() - this.startTime,
                options: this.options
            },
            metrics: this.metrics,
            summary: this.getPerformanceSummary(),
            suggestions: this.getOptimizationSuggestions()
        };
    }

    /**
     * Reset all metrics
     */
    reset() {
        this.metrics = {
            pageLoads: [],
            cartOperations: [],
            networkRequests: [],
            memoryUsage: [],
            coreWebVitals: {},
            userInteractions: []
        };
        
        this.startTime = performance.now();
        console.log('Performance metrics reset');
    }

    /**
     * Stop monitoring and cleanup
     */
    destroy() {
        this.isMonitoring = false;

        // Clear all intervals
        this.intervals.forEach(interval => clearInterval(interval));
        this.intervals.clear();

        // Disconnect all observers
        this.observers.forEach(observer => observer.disconnect());
        this.observers.clear();

        // Remove event listeners
        this.eventListeners.forEach((handler, eventType) => {
            document.removeEventListener(eventType, handler);
        });
        this.eventListeners.clear();

        console.log('Performance Monitor destroyed');
    }
}

// Export for both ES6 modules and global use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerformanceMonitor;
} else {
    window.PerformanceMonitor = PerformanceMonitor;
}

export default PerformanceMonitor;