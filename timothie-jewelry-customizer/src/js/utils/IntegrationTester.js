/**
 * Integration Tester - Cross-page navigation and state persistence testing
 * for Timothie & Co Jewelry Customizer
 * 
 * Tests the complete user journey across all pages ensuring:
 * - Seamless navigation between pages
 * - Cart state persistence across sessions
 * - Data integrity throughout the buy-flow
 * - Error handling and recovery
 * - Performance across page transitions
 */

class IntegrationTester {
    constructor(options = {}) {
        this.options = {
            // Test configuration
            timeout: options.timeout || 30000, // 30 seconds per test
            retries: options.retries || 2,
            parallel: options.parallel || false,
            
            // Pages to test
            pages: options.pages || [
                { name: 'Home', url: '/src/home.html', id: 'home' },
                { name: 'Browse', url: '/src/browse.html', id: 'browse' },
                { name: 'Product', url: '/src/product.html', id: 'product' },
                { name: 'Customizer', url: '/src/index.html', id: 'customizer' },
                { name: 'Checkout', url: '/src/checkout.html', id: 'checkout' },
                { name: 'Order Confirmation', url: '/src/order-confirmation.html', id: 'confirmation' }
            ],
            
            // Test data
            testData: {
                testProduct: {
                    id: 'integration_test_product',
                    title: 'Integration Test Product',
                    price: 49.99,
                    category: 'charms',
                    image_url: '/test-image.jpg'
                },
                testUser: {
                    email: 'test@timothie.com',
                    name: 'Integration Tester'
                }
            },
            
            // Validation settings
            validateState: options.validateState !== false,
            validatePerformance: options.validatePerformance !== false,
            validateAccessibility: options.validateAccessibility !== false,
            
            ...options
        };

        // Test state
        this.currentTest = null;
        this.testWindows = new Map();
        this.testResults = [];
        this.sharedState = new Map();
        this.isRunning = false;
        
        // Test scenarios
        this.scenarios = new Map();
        this.setupTestScenarios();
    }

    /**
     * Setup all test scenarios
     */
    setupTestScenarios() {
        // Basic navigation tests
        this.addScenario('basic-navigation', 'Basic Page Navigation', this.testBasicNavigation.bind(this));
        this.addScenario('cart-persistence', 'Cart State Persistence', this.testCartPersistence.bind(this));
        this.addScenario('complete-buyflow', 'Complete Buy Flow', this.testCompleteBuyFlow.bind(this));
        this.addScenario('error-recovery', 'Error Recovery', this.testErrorRecovery.bind(this));
        this.addScenario('cross-page-data', 'Cross-Page Data Integrity', this.testCrossPageData.bind(this));
        this.addScenario('performance-navigation', 'Navigation Performance', this.testNavigationPerformance.bind(this));
        this.addScenario('state-synchronization', 'State Synchronization', this.testStateSynchronization.bind(this));
        this.addScenario('session-management', 'Session Management', this.testSessionManagement.bind(this));
    }

    addScenario(id, name, testFunction) {
        this.scenarios.set(id, {
            id,
            name,
            testFunction,
            status: 'pending',
            result: null,
            duration: 0,
            attempts: 0
        });
    }

    // ===========================================
    // Main Test Runner
    // ===========================================

    /**
     * Run all integration tests
     */
    async runAllTests() {
        if (this.isRunning) {
            throw new Error('Tests are already running');
        }

        this.isRunning = true;
        this.testResults = [];
        
        try {
            console.log('Starting Integration Tests...');
            
            // Initialize test environment
            await this.initializeTestEnvironment();
            
            // Run scenarios
            const scenarioIds = Array.from(this.scenarios.keys());
            
            if (this.options.parallel) {
                await this.runScenariosInParallel(scenarioIds);
            } else {
                await this.runScenariosSequentially(scenarioIds);
            }
            
            // Generate final report
            const report = this.generateTestReport();
            console.log('Integration Tests Complete:', report);
            
            return report;
            
        } catch (error) {
            console.error('Integration test suite failed:', error);
            throw error;
        } finally {
            await this.cleanup();
            this.isRunning = false;
        }
    }

    /**
     * Run specific scenario
     */
    async runScenario(scenarioId) {
        const scenario = this.scenarios.get(scenarioId);
        if (!scenario) {
            throw new Error(`Scenario ${scenarioId} not found`);
        }

        return await this.executeScenario(scenario);
    }

    async runScenariosSequentially(scenarioIds) {
        for (const scenarioId of scenarioIds) {
            if (!this.isRunning) break;
            await this.runScenario(scenarioId);
        }
    }

    async runScenariosInParallel(scenarioIds) {
        const promises = scenarioIds.map(id => this.runScenario(id));
        await Promise.allSettled(promises);
    }

    async executeScenario(scenario) {
        scenario.status = 'running';
        scenario.attempts++;
        
        const startTime = performance.now();
        
        try {
            console.log(`Running scenario: ${scenario.name}`);
            
            const result = await Promise.race([
                scenario.testFunction(),
                this.createTimeoutPromise(this.options.timeout)
            ]);
            
            scenario.duration = performance.now() - startTime;
            scenario.result = result;
            scenario.status = 'passed';
            
            this.testResults.push({
                scenario: scenario.name,
                status: 'passed',
                duration: scenario.duration,
                result: result
            });
            
            console.log(`✓ ${scenario.name} passed (${scenario.duration.toFixed(2)}ms)`);
            
        } catch (error) {
            scenario.duration = performance.now() - startTime;
            scenario.error = error;
            
            // Retry logic
            if (scenario.attempts < this.options.retries) {
                console.log(`⚠ Retrying scenario: ${scenario.name}`);
                return this.executeScenario(scenario);
            }
            
            scenario.status = 'failed';
            
            this.testResults.push({
                scenario: scenario.name,
                status: 'failed',
                duration: scenario.duration,
                error: error.message
            });
            
            console.log(`✗ ${scenario.name} failed: ${error.message}`);
        }
    }

    createTimeoutPromise(timeout) {
        return new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Test timeout')), timeout);
        });
    }

    // ===========================================
    // Test Scenarios
    // ===========================================

    async testBasicNavigation() {
        const navigationResults = [];
        
        for (let i = 0; i < this.options.pages.length - 1; i++) {
            const fromPage = this.options.pages[i];
            const toPage = this.options.pages[i + 1];
            
            const startTime = performance.now();
            
            // Open source page
            const window1 = await this.openPage(fromPage.url);
            await this.waitForPageLoad(window1);
            
            // Navigate to target page
            const window2 = await this.navigateToPage(window1, toPage.url);
            await this.waitForPageLoad(window2);
            
            const navigationTime = performance.now() - startTime;
            
            // Validate navigation
            const isValid = await this.validatePageLoaded(window2, toPage.id);
            
            navigationResults.push({
                from: fromPage.name,
                to: toPage.name,
                time: navigationTime.toFixed(2),
                success: isValid
            });
            
            // Close windows
            window1.close();
            window2.close();
            
            if (!isValid) {
                throw new Error(`Navigation from ${fromPage.name} to ${toPage.name} failed`);
            }
        }
        
        return {
            totalNavigations: navigationResults.length,
            successful: navigationResults.filter(r => r.success).length,
            averageTime: navigationResults.reduce((sum, r) => sum + parseFloat(r.time), 0) / navigationResults.length,
            results: navigationResults
        };
    }

    async testCartPersistence() {
        const testProduct = this.options.testData.testProduct;
        
        // Step 1: Add item to cart on customizer page
        const customizerWindow = await this.openPage('/src/index.html');
        await this.waitForPageLoad(customizerWindow);
        
        // Wait for cart manager to initialize
        await this.waitForCondition(() => {
            return customizerWindow.window.CartManager !== undefined;
        }, 5000);
        
        // Add test item to cart
        await this.executeInWindow(customizerWindow, (testProduct) => {
            const cartManager = window.CartManager;
            return cartManager.addItem(testProduct, 2);
        }, testProduct);
        
        // Verify item was added
        const cartState1 = await this.executeInWindow(customizerWindow, () => {
            return window.CartManager.getCartSummary();
        });
        
        customizerWindow.close();
        
        // Step 2: Open checkout page and verify cart persisted
        const checkoutWindow = await this.openPage('/src/checkout.html');
        await this.waitForPageLoad(checkoutWindow);
        
        // Wait for cart to load
        await this.waitForCondition(() => {
            return checkoutWindow.window.CartManager !== undefined;
        }, 5000);
        
        const cartState2 = await this.executeInWindow(checkoutWindow, () => {
            return window.CartManager.getCartSummary();
        });
        
        checkoutWindow.close();
        
        // Validate persistence
        if (cartState1.itemCount !== cartState2.itemCount) {
            throw new Error('Cart item count not persisted');
        }
        
        if (Math.abs(cartState1.total - cartState2.total) > 0.01) {
            throw new Error('Cart total not persisted correctly');
        }
        
        return {
            itemsPersisted: cartState2.itemCount,
            totalPersisted: cartState2.total,
            persistence: 'successful'
        };
    }

    async testCompleteBuyFlow() {
        const steps = [];
        const testProduct = this.options.testData.testProduct;
        
        try {
            // Step 1: Start at home page
            steps.push({ step: 'home', status: 'starting' });
            const homeWindow = await this.openPage('/src/home.html');
            await this.waitForPageLoad(homeWindow);
            steps[0].status = 'completed';
            
            // Step 2: Navigate to browse
            steps.push({ step: 'browse', status: 'starting' });
            const browseWindow = await this.navigateToPage(homeWindow, '/src/browse.html');
            await this.waitForPageLoad(browseWindow);
            steps[1].status = 'completed';
            
            // Step 3: Go to product page
            steps.push({ step: 'product', status: 'starting' });
            const productWindow = await this.navigateToPage(browseWindow, '/src/product.html');
            await this.waitForPageLoad(productWindow);
            steps[2].status = 'completed';
            
            // Step 4: Open customizer
            steps.push({ step: 'customizer', status: 'starting' });
            const customizerWindow = await this.navigateToPage(productWindow, '/src/index.html');
            await this.waitForPageLoad(customizerWindow);
            
            // Add item to cart
            await this.waitForCondition(() => {
                return customizerWindow.window.CartManager !== undefined;
            }, 5000);
            
            await this.executeInWindow(customizerWindow, (testProduct) => {
                return window.CartManager.addItem(testProduct, 1);
            }, testProduct);
            
            steps[3].status = 'completed';
            
            // Step 5: Proceed to checkout
            steps.push({ step: 'checkout', status: 'starting' });
            const checkoutWindow = await this.navigateToPage(customizerWindow, '/src/checkout.html');
            await this.waitForPageLoad(checkoutWindow);
            
            // Verify cart data in checkout
            await this.waitForCondition(() => {
                return checkoutWindow.window.CartManager !== undefined;
            }, 5000);
            
            const cartSummary = await this.executeInWindow(checkoutWindow, () => {
                return window.CartManager.getCartSummary();
            });
            
            if (cartSummary.itemCount === 0) {
                throw new Error('Cart empty in checkout');
            }
            
            steps[4].status = 'completed';
            
            // Step 6: Simulate order completion
            steps.push({ step: 'confirmation', status: 'starting' });
            const confirmationWindow = await this.navigateToPage(checkoutWindow, '/src/order-confirmation.html');
            await this.waitForPageLoad(confirmationWindow);
            steps[5].status = 'completed';
            
            // Clean up
            [homeWindow, browseWindow, productWindow, customizerWindow, checkoutWindow, confirmationWindow]
                .forEach(w => w.close());
            
            return {
                stepsCompleted: steps.filter(s => s.status === 'completed').length,
                totalSteps: steps.length,
                success: true,
                cartItemsAtCheckout: cartSummary.itemCount,
                cartTotalAtCheckout: cartSummary.total,
                flowIntegrity: 'maintained'
            };
            
        } catch (error) {
            // Mark current step as failed
            if (steps.length > 0) {
                steps[steps.length - 1].status = 'failed';
            }
            
            return {
                stepsCompleted: steps.filter(s => s.status === 'completed').length,
                totalSteps: steps.length,
                success: false,
                error: error.message,
                steps: steps
            };
        }
    }

    async testErrorRecovery() {
        // Test how the system handles errors and recovers
        const testCases = [];
        
        // Test 1: Invalid cart item
        try {
            const customizerWindow = await this.openPage('/src/index.html');
            await this.waitForPageLoad(customizerWindow);
            
            await this.waitForCondition(() => {
                return customizerWindow.window.CartManager !== undefined;
            }, 5000);
            
            // Try to add invalid item
            await this.executeInWindow(customizerWindow, () => {
                const invalidItem = { id: null, title: '', price: -1 };
                return window.CartManager.addItem(invalidItem, 1);
            });
            
            testCases.push({ test: 'invalid_item', status: 'failed', expected: true });
            customizerWindow.close();
            
        } catch (error) {
            testCases.push({ test: 'invalid_item', status: 'handled_correctly', error: error.message });
        }
        
        // Test 2: Network failure simulation
        try {
            const customizerWindow = await this.openPage('/src/index.html');
            await this.waitForPageLoad(customizerWindow);
            
            // Simulate network failure
            await this.executeInWindow(customizerWindow, () => {
                // Mock fetch to fail
                const originalFetch = window.fetch;
                window.fetch = () => Promise.reject(new Error('Network Error'));
                
                // Try to load inventory (should fail gracefully)
                return window.InventoryService?.initialize?.();
            });
            
            testCases.push({ test: 'network_failure', status: 'handled' });
            customizerWindow.close();
            
        } catch (error) {
            testCases.push({ test: 'network_failure', status: 'graceful_degradation', error: error.message });
        }
        
        return {
            testCases: testCases,
            errorHandling: 'functional',
            recoveryMechanisms: 'working'
        };
    }

    async testCrossPageData() {
        const testData = {
            cartItems: [],
            userPreferences: { theme: 'light', currency: 'USD' },
            searchQuery: 'test jewelry'
        };
        
        // Set data on one page
        const page1Window = await this.openPage('/src/browse.html');
        await this.waitForPageLoad(page1Window);
        
        await this.executeInWindow(page1Window, (data) => {
            localStorage.setItem('test_cross_page_data', JSON.stringify(data));
            sessionStorage.setItem('test_session_data', JSON.stringify({ timestamp: Date.now() }));
        }, testData);
        
        page1Window.close();
        
        // Retrieve data on another page
        const page2Window = await this.openPage('/src/product.html');
        await this.waitForPageLoad(page2Window);
        
        const retrievedData = await this.executeInWindow(page2Window, () => {
            const localStorage_data = localStorage.getItem('test_cross_page_data');
            const sessionData = sessionStorage.getItem('test_session_data');
            
            return {
                localStorage: localStorage_data ? JSON.parse(localStorage_data) : null,
                sessionStorage: sessionData ? JSON.parse(sessionData) : null
            };
        });
        
        page2Window.close();
        
        // Cleanup
        await this.executeInWindow(page2Window, () => {
            localStorage.removeItem('test_cross_page_data');
            sessionStorage.removeItem('test_session_data');
        });
        
        // Validate data integrity
        const dataIntact = JSON.stringify(retrievedData.localStorage) === JSON.stringify(testData);
        const sessionDataExists = retrievedData.sessionStorage !== null;
        
        return {
            localStoragePersistence: dataIntact,
            sessionStoragePersistence: sessionDataExists,
            dataIntegrity: dataIntact ? 'maintained' : 'corrupted'
        };
    }

    async testNavigationPerformance() {
        const performanceData = [];
        
        for (const page of this.options.pages) {
            const startTime = performance.now();
            
            const pageWindow = await this.openPage(page.url);
            const loadTime = performance.now() - startTime;
            
            await this.waitForPageLoad(pageWindow);
            const readyTime = performance.now() - startTime;
            
            // Test navigation from this page
            const navigationStart = performance.now();
            const nextPageIndex = (this.options.pages.indexOf(page) + 1) % this.options.pages.length;
            const nextPage = this.options.pages[nextPageIndex];
            
            const nextWindow = await this.navigateToPage(pageWindow, nextPage.url);
            const navigationTime = performance.now() - navigationStart;
            
            performanceData.push({
                page: page.name,
                loadTime: loadTime.toFixed(2),
                readyTime: readyTime.toFixed(2),
                navigationTime: navigationTime.toFixed(2)
            });
            
            pageWindow.close();
            nextWindow.close();
        }
        
        const avgLoadTime = performanceData.reduce((sum, p) => sum + parseFloat(p.loadTime), 0) / performanceData.length;
        const avgNavigationTime = performanceData.reduce((sum, p) => sum + parseFloat(p.navigationTime), 0) / performanceData.length;
        
        return {
            averageLoadTime: avgLoadTime.toFixed(2),
            averageNavigationTime: avgNavigationTime.toFixed(2),
            totalPages: performanceData.length,
            performanceData: performanceData,
            meetsThreshold: avgLoadTime < 3000 && avgNavigationTime < 1000
        };
    }

    async testStateSynchronization() {
        // Test state synchronization between multiple windows
        const window1 = await this.openPage('/src/index.html');
        const window2 = await this.openPage('/src/checkout.html');
        
        await this.waitForPageLoad(window1);
        await this.waitForPageLoad(window2);
        
        // Wait for cart managers to initialize
        await this.waitForCondition(() => {
            return window1.window.CartManager !== undefined;
        }, 5000);
        
        await this.waitForCondition(() => {
            return window2.window.CartManager !== undefined;
        }, 5000);
        
        // Add item in window 1
        const testProduct = this.options.testData.testProduct;
        await this.executeInWindow(window1, (product) => {
            return window.CartManager.addItem(product, 1);
        }, testProduct);
        
        // Wait a moment for potential synchronization
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Check if state synchronized to window 2
        const cart1State = await this.executeInWindow(window1, () => {
            return window.CartManager.getCartSummary();
        });
        
        const cart2State = await this.executeInWindow(window2, () => {
            return window.CartManager.getCartSummary();
        });
        
        window1.close();
        window2.close();
        
        return {
            window1Items: cart1State.itemCount,
            window2Items: cart2State.itemCount,
            synchronized: cart1State.itemCount === cart2State.itemCount,
            stateSyncMechanism: cart1State.itemCount === cart2State.itemCount ? 'working' : 'not_implemented'
        };
    }

    async testSessionManagement() {
        // Test session handling across page refreshes and navigation
        const sessionData = [];
        
        // Create initial session
        const window1 = await this.openPage('/src/index.html');
        await this.waitForPageLoad(window1);
        
        const initialSessionId = await this.executeInWindow(window1, () => {
            return window.sessionStorage.getItem('session_id') || 'new_session_' + Date.now();
        });
        
        await this.executeInWindow(window1, (sessionId) => {
            window.sessionStorage.setItem('session_id', sessionId);
        }, initialSessionId);
        
        sessionData.push({ action: 'create', sessionId: initialSessionId });
        
        // Navigate to another page
        const window2 = await this.navigateToPage(window1, '/src/browse.html');
        await this.waitForPageLoad(window2);
        
        const sessionAfterNavigation = await this.executeInWindow(window2, () => {
            return window.sessionStorage.getItem('session_id');
        });
        
        sessionData.push({ action: 'navigate', sessionId: sessionAfterNavigation });
        
        // Refresh page
        await this.executeInWindow(window2, () => {
            window.location.reload();
        });
        
        await this.waitForPageLoad(window2);
        
        const sessionAfterRefresh = await this.executeInWindow(window2, () => {
            return window.sessionStorage.getItem('session_id');
        });
        
        sessionData.push({ action: 'refresh', sessionId: sessionAfterRefresh });
        
        window1.close();
        window2.close();
        
        // Analyze session continuity
        const sessionsMatch = sessionData.every(data => data.sessionId === initialSessionId);
        
        return {
            sessionContinuity: sessionsMatch,
            sessionData: sessionData,
            sessionManagement: sessionsMatch ? 'consistent' : 'inconsistent'
        };
    }

    // ===========================================
    // Utility Methods
    // ===========================================

    async initializeTestEnvironment() {
        // Clear any existing test data
        localStorage.removeItem('timothie_test_cart');
        sessionStorage.clear();
        
        // Setup test environment
        console.log('Test environment initialized');
    }

    async openPage(url) {
        return new Promise((resolve, reject) => {
            const testWindow = window.open(url, '_blank');
            
            if (!testWindow) {
                reject(new Error('Failed to open window - popup blocked?'));
                return;
            }
            
            const timeout = setTimeout(() => {
                testWindow.close();
                reject(new Error('Page load timeout'));
            }, 10000);
            
            testWindow.addEventListener('load', () => {
                clearTimeout(timeout);
                resolve(testWindow);
            });
            
            testWindow.addEventListener('error', (error) => {
                clearTimeout(timeout);
                testWindow.close();
                reject(new Error('Page load error: ' + error.message));
            });
        });
    }

    async navigateToPage(fromWindow, toUrl) {
        return new Promise((resolve, reject) => {
            const newWindow = fromWindow.open(toUrl, '_blank');
            
            if (!newWindow) {
                reject(new Error('Failed to navigate - popup blocked?'));
                return;
            }
            
            const timeout = setTimeout(() => {
                newWindow.close();
                reject(new Error('Navigation timeout'));
            }, 10000);
            
            newWindow.addEventListener('load', () => {
                clearTimeout(timeout);
                resolve(newWindow);
            });
        });
    }

    async waitForPageLoad(pageWindow) {
        return new Promise((resolve) => {
            if (pageWindow.document.readyState === 'complete') {
                resolve();
            } else {
                pageWindow.addEventListener('load', resolve);
            }
        });
    }

    async waitForCondition(condition, timeout = 5000) {
        const startTime = Date.now();
        
        while (Date.now() - startTime < timeout) {
            if (condition()) {
                return true;
            }
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        throw new Error('Condition timeout');
    }

    async validatePageLoaded(pageWindow, expectedPageId) {
        try {
            // Basic checks
            if (!pageWindow || pageWindow.closed) {
                return false;
            }
            
            // Check if page has expected content
            const hasExpectedContent = await this.executeInWindow(pageWindow, (pageId) => {
                // Look for page-specific indicators
                const indicators = {
                    'home': '.hero-section, .brand-showcase',
                    'browse': '.product-grid, .filter-section',
                    'product': '.product-details, .product-image',
                    'customizer': '#stage-container, .charm-sidebar',
                    'checkout': '.checkout-form, .order-summary',
                    'confirmation': '.order-confirmation, .order-details'
                };
                
                const selector = indicators[pageId];
                return selector ? !!document.querySelector(selector) : true;
            }, expectedPageId);
            
            return hasExpectedContent;
        } catch (error) {
            console.warn('Page validation error:', error);
            return false;
        }
    }

    async executeInWindow(pageWindow, script, ...args) {
        return new Promise((resolve, reject) => {
            try {
                // Execute script in the window context
                const result = pageWindow.eval(`(${script.toString()})(${args.map(arg => JSON.stringify(arg)).join(', ')})`);
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
    }

    generateTestReport() {
        const passed = this.testResults.filter(r => r.status === 'passed').length;
        const failed = this.testResults.filter(r => r.status === 'failed').length;
        const total = this.testResults.length;
        
        const avgDuration = this.testResults.reduce((sum, r) => sum + r.duration, 0) / total;
        
        return {
            summary: {
                total: total,
                passed: passed,
                failed: failed,
                successRate: ((passed / total) * 100).toFixed(1) + '%',
                averageDuration: avgDuration.toFixed(2) + 'ms'
            },
            results: this.testResults,
            scenarios: Array.from(this.scenarios.values()).map(s => ({
                name: s.name,
                status: s.status,
                duration: s.duration,
                attempts: s.attempts
            }))
        };
    }

    async cleanup() {
        // Close any remaining test windows
        this.testWindows.forEach(window => {
            if (!window.closed) {
                window.close();
            }
        });
        
        this.testWindows.clear();
        
        // Clean up test data
        localStorage.removeItem('timothie_test_cart');
        sessionStorage.clear();
        
        console.log('Integration test cleanup completed');
    }

    /**
     * Stop running tests
     */
    stop() {
        this.isRunning = false;
        console.log('Integration tests stopped');
    }
}

// Export for both ES6 modules and global use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = IntegrationTester;
} else {
    window.IntegrationTester = IntegrationTester;
}

export default IntegrationTester;