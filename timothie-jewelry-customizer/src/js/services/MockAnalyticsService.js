/**
 * MockAnalyticsService.js
 * 
 * Mock analytics service for development and fallback scenarios.
 * Provides the same interface as real analytics services but only logs
 * events to the console instead of sending them to external services.
 */

class MockAnalyticsService {
    constructor() {
        this.events = [];
        this.sessionId = this.generateSessionId();
        this.userId = null;
        this.initialized = false;
        this.maxEvents = 1000; // Limit stored events
    }

    /**
     * Initialize the analytics service
     */
    async initialize() {
        if (this.initialized) {
            return;
        }

        this.initialized = true;
        console.log('📊 MockAnalyticsService initialized (events will be logged to console)');
        
        // Track session start
        this.track('session_start', {
            sessionId: this.sessionId,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Track an event
     * @param {string} eventName - Name of the event
     * @param {Object} properties - Event properties
     */
    track(eventName, properties = {}) {
        const event = {
            event: eventName,
            properties: {
                ...properties,
                sessionId: this.sessionId,
                userId: this.userId,
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent,
                url: window.location.href
            }
        };

        // Add to events array
        this.events.push(event);
        
        // Limit stored events
        if (this.events.length > this.maxEvents) {
            this.events.shift();
        }

        // Log to console
        console.log('📊 Analytics Event:', eventName, properties);
    }

    /**
     * Track page view
     * @param {string} page - Page name or path
     * @param {Object} properties - Additional properties
     */
    page(page, properties = {}) {
        this.track('page_view', {
            page,
            ...properties
        });
    }

    /**
     * Identify a user
     * @param {string} userId - User ID
     * @param {Object} traits - User traits
     */
    identify(userId, traits = {}) {
        this.userId = userId;
        this.track('identify', {
            userId,
            traits
        });
    }

    /**
     * Track user action
     * @param {string} action - Action name
     * @param {Object} properties - Action properties
     */
    action(action, properties = {}) {
        this.track('user_action', {
            action,
            ...properties
        });
    }

    /**
     * Track e-commerce events
     * @param {string} event - E-commerce event type
     * @param {Object} properties - Event properties
     */
    ecommerce(event, properties = {}) {
        this.track(`ecommerce_${event}`, properties);
    }

    /**
     * Track custom jewelry events
     * @param {string} event - Jewelry event type
     * @param {Object} properties - Event properties
     */
    jewelry(event, properties = {}) {
        this.track(`jewelry_${event}`, properties);
    }

    /**
     * Track errors
     * @param {Error} error - Error object
     * @param {Object} context - Error context
     */
    error(error, context = {}) {
        this.track('error', {
            errorName: error.name,
            errorMessage: error.message,
            errorStack: error.stack,
            context
        });
    }

    /**
     * Track performance metrics
     * @param {string} metric - Metric name
     * @param {number} value - Metric value
     * @param {Object} properties - Additional properties
     */
    performance(metric, value, properties = {}) {
        this.track('performance', {
            metric,
            value,
            ...properties
        });
    }

    /**
     * Track timing events
     * @param {string} category - Timing category
     * @param {string} variable - Timing variable
     * @param {number} time - Time in milliseconds
     * @param {string} label - Optional label
     */
    timing(category, variable, time, label = null) {
        this.track('timing', {
            category,
            variable,
            time,
            label
        });
    }

    /**
     * Set user properties
     * @param {Object} properties - User properties
     */
    setUserProperties(properties) {
        this.track('user_properties_set', {
            properties
        });
    }

    /**
     * Start a timer for measuring duration
     * @param {string} name - Timer name
     */
    startTimer(name) {
        if (!this.timers) {
            this.timers = new Map();
        }
        this.timers.set(name, Date.now());
    }

    /**
     * End a timer and track the duration
     * @param {string} name - Timer name
     * @param {Object} properties - Additional properties
     */
    endTimer(name, properties = {}) {
        if (!this.timers || !this.timers.has(name)) {
            console.warn(`Timer '${name}' was not started`);
            return;
        }

        const startTime = this.timers.get(name);
        const duration = Date.now() - startTime;
        this.timers.delete(name);

        this.timing('user_action', name, duration);
        this.track('timer_end', {
            timerName: name,
            duration,
            ...properties
        });
    }

    /**
     * Get all tracked events
     * @param {Object} filters - Event filters
     * @returns {Array} Filtered events
     */
    getEvents(filters = {}) {
        let events = [...this.events];

        if (filters.eventName) {
            events = events.filter(e => e.event === filters.eventName);
        }

        if (filters.since) {
            const since = new Date(filters.since);
            events = events.filter(e => new Date(e.properties.timestamp) >= since);
        }

        if (filters.limit) {
            events = events.slice(-filters.limit);
        }

        return events;
    }

    /**
     * Get analytics summary
     * @returns {Object} Analytics summary
     */
    getSummary() {
        const summary = {
            totalEvents: this.events.length,
            sessionId: this.sessionId,
            userId: this.userId,
            eventsByType: {},
            timeRange: {
                first: null,
                last: null
            }
        };

        if (this.events.length > 0) {
            // Count events by type
            this.events.forEach(event => {
                summary.eventsByType[event.event] = (summary.eventsByType[event.event] || 0) + 1;
            });

            // Time range
            summary.timeRange.first = this.events[0].properties.timestamp;
            summary.timeRange.last = this.events[this.events.length - 1].properties.timestamp;
        }

        return summary;
    }

    /**
     * Export events for analysis
     * @param {string} format - Export format ('json' or 'csv')
     * @returns {string} Exported data
     */
    export(format = 'json') {
        if (format === 'json') {
            return JSON.stringify(this.events, null, 2);
        } else if (format === 'csv') {
            if (this.events.length === 0) {
                return '';
            }

            // Get all unique property keys
            const allKeys = new Set();
            this.events.forEach(event => {
                allKeys.add('event');
                Object.keys(event.properties).forEach(key => allKeys.add(key));
            });

            const headers = Array.from(allKeys);
            const csv = [headers.join(',')];

            this.events.forEach(event => {
                const row = headers.map(header => {
                    if (header === 'event') {
                        return `"${event.event}"`;
                    }
                    const value = event.properties[header];
                    return value !== undefined ? `"${value}"` : '';
                });
                csv.push(row.join(','));
            });

            return csv.join('\n');
        }

        throw new Error(`Unsupported export format: ${format}`);
    }

    /**
     * Clear all events
     */
    clear() {
        this.events = [];
        console.log('📊 Analytics events cleared');
    }

    /**
     * Generate unique session ID
     * @private
     */
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Get service status
     * @returns {Object}
     */
    getStatus() {
        return {
            initialized: this.initialized,
            eventCount: this.events.length,
            sessionId: this.sessionId,
            userId: this.userId,
            type: 'mock',
            version: '1.0'
        };
    }
}

export default MockAnalyticsService;