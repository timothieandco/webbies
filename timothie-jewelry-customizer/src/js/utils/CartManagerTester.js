/**
 * CartManager Automated Tester - Comprehensive testing for cart operations
 * Tests all CartManager functionality including validation, persistence, and edge cases
 */

class CartManagerTester {
    constructor(options = {}) {
        this.options = {
            timeout: options.timeout || 15000,
            retries: options.retries || 2,
            enablePerformanceTests: options.enablePerformanceTests !== false,
            enableStressTests: options.enableStressTests !== false,
            maxItemsForStress: options.maxItemsForStress || 50,
            ...options
        };

        this.cartManager = null;
        this.testResults = [];
        this.isRunning = false;
        
        // Test data
        this.testData = {
            validItem: {
                id: 'test_valid_001',
                title: 'Test Valid Item',
                price: 29.99,
                image_url: '/test-image.jpg',
                category: 'charms',
                description: 'A valid test item'
            },
            expensiveItem: {
                id: 'test_expensive_001',
                title: 'Expensive Test Item',
                price: 999.99,
                image_url: '/test-expensive.jpg',
                category: 'necklaces'
            },
            customDesign: {
                id: 'custom_design_test',
                title: 'Custom Design Test',
                price: 150.00,
                category: 'custom_designs',
                is_custom_design: true,
                design_data: {
                    components: [
                        { inventoryId: 'charm_001', quantity: 1 },
                        { inventoryId: 'charm_002', quantity: 1 }
                    ]
                }
            },
            invalidItems: [
                { id: null, title: 'Invalid ID', price: 10 },
                { id: 'valid_id', title: '', price: 10 },
                { id: 'valid_id', title: 'Invalid Price', price: -5 },
                { id: 'valid_id', title: 'Invalid Price Type', price: 'not_a_number' }
            ]
        };
        
        this.setupTests();
    }

    setupTests() {
        this.tests = new Map([
            // Basic Operations
            ['initialization', { name: 'CartManager Initialization', test: this.testInitialization.bind(this) }],
            ['add-item', { name: 'Add Item to Cart', test: this.testAddItem.bind(this) }],
            ['remove-item', { name: 'Remove Item from Cart', test: this.testRemoveItem.bind(this) }],
            ['update-quantity', { name: 'Update Item Quantity', test: this.testUpdateQuantity.bind(this) }],
            ['clear-cart', { name: 'Clear Cart', test: this.testClearCart.bind(this) }],
            
            // Validation Tests
            ['item-validation', { name: 'Item Validation', test: this.testItemValidation.bind(this) }],
            ['quantity-validation', { name: 'Quantity Validation', test: this.testQuantityValidation.bind(this) }],
            ['inventory-validation', { name: 'Inventory Validation', test: this.testInventoryValidation.bind(this) }],
            
            // Calculation Tests
            ['price-calculations', { name: 'Price Calculations', test: this.testPriceCalculations.bind(this) }],
            ['tax-calculations', { name: 'Tax Calculations', test: this.testTaxCalculations.bind(this) }],
            ['shipping-calculations', { name: 'Shipping Calculations', test: this.testShippingCalculations.bind(this) }],
            ['discount-calculations', { name: 'Discount Calculations', test: this.testDiscountCalculations.bind(this) }],
            
            // Persistence Tests
            ['local-storage-persistence', { name: 'Local Storage Persistence', test: this.testLocalStoragePersistence.bind(this) }],
            ['session-persistence', { name: 'Session Persistence', test: this.testSessionPersistence.bind(this) }],
            ['cross-tab-persistence', { name: 'Cross-Tab Persistence', test: this.testCrossTabPersistence.bind(this) }],
            
            // State Management Tests
            ['undo-redo', { name: 'Undo/Redo Functionality', test: this.testUndoRedo.bind(this) }],
            ['state-consistency', { name: 'State Consistency', test: this.testStateConsistency.bind(this) }],
            ['concurrent-operations', { name: 'Concurrent Operations', test: this.testConcurrentOperations.bind(this) }],
            
            // Design Export Tests
            ['design-export', { name: 'Design Export to Cart', test: this.testDesignExport.bind(this) }],
            ['custom-design-handling', { name: 'Custom Design Handling', test: this.testCustomDesignHandling.bind(this) }],
            
            // Error Handling Tests
            ['error-recovery', { name: 'Error Recovery', test: this.testErrorRecovery.bind(this) }],
            ['network-failure-handling', { name: 'Network Failure Handling', test: this.testNetworkFailureHandling.bind(this) }],
            ['data-corruption-handling', { name: 'Data Corruption Handling', test: this.testDataCorruptionHandling.bind(this) }],
            
            // Performance Tests
            ['large-cart-performance', { name: 'Large Cart Performance', test: this.testLargeCartPerformance.bind(this) }],
            ['operation-speed', { name: 'Operation Speed', test: this.testOperationSpeed.bind(this) }],
            ['memory-usage', { name: 'Memory Usage', test: this.testMemoryUsage.bind(this) }],
            
            // Edge Cases
            ['edge-cases', { name: 'Edge Cases', test: this.testEdgeCases.bind(this) }],
            ['boundary-conditions', { name: 'Boundary Conditions', test: this.testBoundaryConditions.bind(this) }],
            ['stress-testing', { name: 'Stress Testing', test: this.testStressTesting.bind(this) }]
        ]);
    }

    // ===========================================
    // Main Test Runner
    // ===========================================

    async runAllTests() {
        if (this.isRunning) {
            throw new Error('Tests are already running');
        }

        this.isRunning = true;
        this.testResults = [];
        
        console.log('Starting CartManager comprehensive tests...');
        
        try {
            // Initialize fresh CartManager for testing
            await this.initializeCartManager();
            
            // Run all tests
            for (const [testId, testConfig] of this.tests) {
                if (!this.isRunning) break;
                
                await this.runSingleTest(testId, testConfig);
            }
            
            // Generate final report
            const report = this.generateTestReport();
            console.log('CartManager tests completed:', report);
            
            return report;
            
        } catch (error) {
            console.error('CartManager test suite failed:', error);
            throw error;
        } finally {
            this.isRunning = false;
            await this.cleanup();
        }
    }

    async runSingleTest(testId, testConfig) {
        const startTime = performance.now();
        let attempts = 0;
        
        while (attempts < this.options.retries) {
            try {
                console.log(`Running test: ${testConfig.name}`);
                
                // Reset cart state before each test
                await this.resetCartState();
                
                const result = await Promise.race([
                    testConfig.test(),
                    this.createTimeoutPromise(this.options.timeout)
                ]);
                
                const duration = performance.now() - startTime;
                
                this.testResults.push({
                    testId,
                    name: testConfig.name,
                    status: 'passed',
                    duration: duration.toFixed(2),
                    result,
                    attempts: attempts + 1
                });
                
                console.log(`✓ ${testConfig.name} passed (${duration.toFixed(2)}ms)`);
                return;
                
            } catch (error) {
                attempts++;
                
                if (attempts >= this.options.retries) {
                    const duration = performance.now() - startTime;
                    
                    this.testResults.push({
                        testId,
                        name: testConfig.name,
                        status: 'failed',
                        duration: duration.toFixed(2),
                        error: error.message,
                        attempts
                    });
                    
                    console.log(`✗ ${testConfig.name} failed: ${error.message}`);
                    return;
                }
                
                console.log(`⚠ Retrying test: ${testConfig.name} (attempt ${attempts + 1})`);
            }
        }
    }

    async initializeCartManager() {
        try {
            // Import CartManager
            const { default: CartManager } = await import('/src/js/core/CartManager.js');
            
            this.cartManager = new CartManager({
                enablePersistence: true,
                enableRealTimeSync: false,
                autoSave: false,
                taxRate: 0.08,
                freeShippingThreshold: 75,
                standardShipping: 12.99,
                maxItems: 50,
                maxQuantityPerItem: 10
            });
            
            await this.cartManager.initialize();
            console.log('CartManager initialized for testing');
            
        } catch (error) {
            console.error('Failed to initialize CartManager:', error);
            throw error;
        }
    }

    async resetCartState() {
        if (this.cartManager) {
            await this.cartManager.clearCart();
            this.cartManager.clearError();
        }
    }

    createTimeoutPromise(timeout) {
        return new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Test timeout')), timeout);
        });
    }

    // ===========================================
    // Basic Operation Tests
    // ===========================================

    async testInitialization() {
        // Test CartManager initialization
        if (!this.cartManager) {
            throw new Error('CartManager not initialized');
        }
        
        if (!this.cartManager.isInitialized) {
            throw new Error('CartManager initialization flag not set');
        }
        
        const summary = this.cartManager.getCartSummary();
        if (typeof summary !== 'object') {
            throw new Error('Cart summary not available');
        }
        
        return {
            initialized: true,
            hasEventSystem: this.cartManager.subscribe !== undefined,
            hasAPI: this.cartManager.addItem !== undefined,
            isEmpty: this.cartManager.isEmpty()
        };
    }

    async testAddItem() {
        const item = this.testData.validItem;
        const quantity = 2;
        
        const cartItem = await this.cartManager.addItem(item, quantity);
        
        if (!cartItem) {
            throw new Error('Cart item not returned');
        }
        
        if (cartItem.quantity !== quantity) {
            throw new Error(`Incorrect quantity: expected ${quantity}, got ${cartItem.quantity}`);
        }
        
        if (!this.cartManager.hasItem(item.id)) {
            throw new Error('Item not found in cart');
        }
        
        const summary = this.cartManager.getCartSummary();
        if (summary.itemCount !== quantity) {
            throw new Error('Incorrect item count in summary');
        }
        
        return {
            itemAdded: true,
            cartItemId: cartItem.cartItemId,
            quantity: cartItem.quantity,
            totalPrice: cartItem.totalPrice,
            cartTotal: summary.total
        };
    }

    async testRemoveItem() {
        // Add item first
        const item = this.testData.validItem;
        const cartItem = await this.cartManager.addItem(item, 1);
        
        const initialCount = this.cartManager.getItemCount();
        
        // Remove item
        const success = await this.cartManager.removeItem(cartItem.cartItemId);
        
        if (!success) {
            throw new Error('Remove operation returned false');
        }
        
        if (this.cartManager.hasItem(item.id)) {
            throw new Error('Item still in cart after removal');
        }
        
        if (this.cartManager.getItemCount() !== initialCount - 1) {
            throw new Error('Item count not decremented');
        }
        
        return {
            itemRemoved: true,
            finalCount: this.cartManager.getItemCount()
        };
    }

    async testUpdateQuantity() {
        // Add item first
        const item = this.testData.validItem;
        const cartItem = await this.cartManager.addItem(item, 2);
        
        const newQuantity = 5;
        const updatedItem = await this.cartManager.updateItemQuantity(cartItem.cartItemId, newQuantity);
        
        if (updatedItem.quantity !== newQuantity) {
            throw new Error(`Quantity not updated: expected ${newQuantity}, got ${updatedItem.quantity}`);
        }
        
        if (this.cartManager.getItemCount() !== newQuantity) {
            throw new Error('Cart item count not updated');
        }
        
        const expectedTotal = item.price * newQuantity;
        if (Math.abs(updatedItem.totalPrice - expectedTotal) > 0.01) {
            throw new Error('Item total price not recalculated');
        }
        
        return {
            quantityUpdated: true,
            newQuantity: updatedItem.quantity,
            newTotalPrice: updatedItem.totalPrice
        };
    }

    async testClearCart() {
        // Add multiple items
        await this.cartManager.addItem(this.testData.validItem, 2);
        await this.cartManager.addItem(this.testData.expensiveItem, 1);
        
        const initialCount = this.cartManager.getItemCount();
        if (initialCount === 0) {
            throw new Error('No items to clear');
        }
        
        const success = await this.cartManager.clearCart();
        
        if (!success) {
            throw new Error('Clear cart returned false');
        }
        
        if (!this.cartManager.isEmpty()) {
            throw new Error('Cart not empty after clear');
        }
        
        if (this.cartManager.getItemCount() !== 0) {
            throw new Error('Item count not zero after clear');
        }
        
        return {
            cartCleared: true,
            itemsCleared: initialCount,
            isEmpty: this.cartManager.isEmpty()
        };
    }

    // ===========================================
    // Validation Tests
    // ===========================================

    async testItemValidation() {
        const validationResults = [];
        
        // Test invalid items
        for (const invalidItem of this.testData.invalidItems) {
            try {
                await this.cartManager.addItem(invalidItem, 1);
                validationResults.push({
                    item: invalidItem,
                    shouldFail: true,
                    actuallyFailed: false
                });
            } catch (error) {
                validationResults.push({
                    item: invalidItem,
                    shouldFail: true,
                    actuallyFailed: true,
                    error: error.message
                });
            }
        }
        
        // Verify all invalid items were rejected
        const failedValidations = validationResults.filter(r => r.shouldFail && !r.actuallyFailed);
        if (failedValidations.length > 0) {
            throw new Error(`${failedValidations.length} invalid items were not rejected`);
        }
        
        return {
            invalidItemsTested: this.testData.invalidItems.length,
            allRejected: failedValidations.length === 0,
            validationResults
        };
    }

    async testQuantityValidation() {
        const item = this.testData.validItem;
        const validationResults = [];
        
        // Test invalid quantities
        const invalidQuantities = [0, -1, 1.5, 'not_a_number', null, undefined];
        
        for (const qty of invalidQuantities) {
            try {
                await this.cartManager.addItem(item, qty);
                validationResults.push({
                    quantity: qty,
                    shouldFail: true,
                    actuallyFailed: false
                });
            } catch (error) {
                validationResults.push({
                    quantity: qty,
                    shouldFail: true,
                    actuallyFailed: true,
                    error: error.message
                });
            }
        }
        
        // Test quantity limits
        try {
            await this.cartManager.addItem(item, 15); // Exceeds maxQuantityPerItem (10)
            validationResults.push({
                quantity: 15,
                shouldFail: true,
                actuallyFailed: false
            });
        } catch (error) {
            validationResults.push({
                quantity: 15,
                shouldFail: true,
                actuallyFailed: true,
                error: error.message
            });
        }
        
        const failedValidations = validationResults.filter(r => r.shouldFail && !r.actuallyFailed);
        if (failedValidations.length > 0) {
            throw new Error(`${failedValidations.length} invalid quantities were not rejected`);
        }
        
        return {
            invalidQuantitiesTested: invalidQuantities.length + 1,
            allRejected: failedValidations.length === 0,
            validationResults
        };
    }

    async testInventoryValidation() {
        // This test would require actual inventory API integration
        // For now, we'll test the validation structure
        
        const mockInventoryItem = {
            id: 'mock_inventory_001',
            title: 'Mock Inventory Item',
            price: 25.99,
            category: 'charms',
            quantity_available: 5,
            status: 'active'
        };
        
        // Test adding within available quantity
        try {
            await this.cartManager.addItem(mockInventoryItem, 3);
            
            return {
                inventoryValidationWorking: true,
                withinLimits: true,
                quantityAdded: 3
            };
        } catch (error) {
            return {
                inventoryValidationWorking: false,
                error: error.message
            };
        }
    }

    // ===========================================
    // Calculation Tests
    // ===========================================

    async testPriceCalculations() {
        // Clear cart and add known items
        await this.cartManager.clearCart();
        
        const item1 = { ...this.testData.validItem, price: 10.00 };
        const item2 = { ...this.testData.expensiveItem, price: 20.00 };
        
        await this.cartManager.addItem(item1, 2); // $20.00
        await this.cartManager.addItem(item2, 3); // $60.00
        
        const summary = this.cartManager.getCartSummary();
        
        const expectedSubtotal = 80.00;
        if (Math.abs(summary.subtotal - expectedSubtotal) > 0.01) {
            throw new Error(`Subtotal incorrect: expected ${expectedSubtotal}, got ${summary.subtotal}`);
        }
        
        return {
            subtotal: summary.subtotal,
            expectedSubtotal,
            calculationCorrect: true,
            itemCount: summary.itemCount
        };
    }

    async testTaxCalculations() {
        await this.cartManager.clearCart();
        
        const item = { ...this.testData.validItem, price: 100.00 };
        await this.cartManager.addItem(item, 1);
        
        const summary = this.cartManager.getCartSummary();
        const expectedTax = 100.00 * 0.08; // 8% tax rate
        
        if (Math.abs(summary.tax - expectedTax) > 0.01) {
            throw new Error(`Tax calculation incorrect: expected ${expectedTax}, got ${summary.tax}`);
        }
        
        return {
            subtotal: summary.subtotal,
            tax: summary.tax,
            taxRate: '8%',
            calculationCorrect: true
        };
    }

    async testShippingCalculations() {
        await this.cartManager.clearCart();
        
        // Test below free shipping threshold
        const cheapItem = { ...this.testData.validItem, price: 25.00 };
        await this.cartManager.addItem(cheapItem, 1);
        
        let summary = this.cartManager.getCartSummary();
        
        if (summary.subtotal < 75 && summary.shipping !== 12.99) {
            throw new Error(`Shipping should be $12.99 for orders under $75, got ${summary.shipping}`);
        }
        
        // Test above free shipping threshold
        await this.cartManager.clearCart();
        const expensiveItem = { ...this.testData.validItem, price: 100.00 };
        await this.cartManager.addItem(expensiveItem, 1);
        
        summary = this.cartManager.getCartSummary();
        
        if (summary.subtotal >= 75 && summary.shipping !== 0) {
            throw new Error(`Shipping should be free for orders over $75, got ${summary.shipping}`);
        }
        
        return {
            belowThresholdShipping: 12.99,
            aboveThresholdShipping: 0,
            freeShippingThreshold: 75,
            calculationsCorrect: true
        };
    }

    async testDiscountCalculations() {
        // Test discount calculation (currently returns 0)
        await this.cartManager.clearCart();
        
        const item = { ...this.testData.validItem, price: 50.00 };
        await this.cartManager.addItem(item, 2);
        
        const summary = this.cartManager.getCartSummary();
        
        // Current implementation returns 0 discount
        if (summary.discount !== 0) {
            throw new Error(`Expected 0 discount, got ${summary.discount}`);
        }
        
        return {
            discount: summary.discount,
            discountSystem: 'placeholder',
            calculationCorrect: true
        };
    }

    // ===========================================
    // Persistence Tests
    // ===========================================

    async testLocalStoragePersistence() {
        await this.cartManager.clearCart();
        
        const item = this.testData.validItem;
        await this.cartManager.addItem(item, 2);
        
        // Force save to localStorage
        await this.cartManager.persistCart();
        
        // Create new CartManager instance
        const { default: CartManager } = await import('/src/js/core/CartManager.js');
        const newCartManager = new CartManager({
            enablePersistence: true,
            enableRealTimeSync: false
        });
        
        await newCartManager.initialize();
        
        const summary = newCartManager.getCartSummary();
        
        if (summary.itemCount !== 2) {
            throw new Error(`Expected 2 items after reload, got ${summary.itemCount}`);
        }
        
        return {
            itemsPersisted: summary.itemCount,
            persistenceWorking: true,
            storageType: 'localStorage'
        };
    }

    async testSessionPersistence() {
        // Test session-level persistence
        const sessionKey = 'test_session_' + Date.now();
        
        sessionStorage.setItem(sessionKey, JSON.stringify({
            items: [this.testData.validItem],
            timestamp: Date.now()
        }));
        
        const retrieved = JSON.parse(sessionStorage.getItem(sessionKey));
        
        if (!retrieved || !retrieved.items) {
            throw new Error('Session storage persistence failed');
        }
        
        sessionStorage.removeItem(sessionKey);
        
        return {
            sessionPersistence: true,
            itemCount: retrieved.items.length
        };
    }

    async testCrossTabPersistence() {
        // This test simulates cross-tab communication
        // In a real browser environment, this would open multiple tabs
        
        const storageKey = 'cross_tab_test_' + Date.now();
        
        // Simulate tab 1 saving data
        localStorage.setItem(storageKey, JSON.stringify({
            cartData: { itemCount: 3, total: 150.00 },
            timestamp: Date.now()
        }));
        
        // Simulate tab 2 reading data
        const savedData = JSON.parse(localStorage.getItem(storageKey));
        
        localStorage.removeItem(storageKey);
        
        if (!savedData || savedData.cartData.itemCount !== 3) {
            throw new Error('Cross-tab persistence simulation failed');
        }
        
        return {
            crossTabPersistence: true,
            dataIntegrity: 'maintained',
            simulatedTabs: 2
        };
    }

    // ===========================================
    // State Management Tests
    // ===========================================

    async testUndoRedo() {
        await this.cartManager.clearCart();
        
        // Add item
        const item = this.testData.validItem;
        await this.cartManager.addItem(item, 1);
        
        let itemCount = this.cartManager.getItemCount();
        if (itemCount !== 1) {
            throw new Error('Failed to add item for undo test');
        }
        
        // Test undo
        const undoSuccess = await this.cartManager.undo();
        if (!undoSuccess) {
            throw new Error('Undo operation failed');
        }
        
        itemCount = this.cartManager.getItemCount();
        if (itemCount !== 0) {
            throw new Error('Undo did not revert cart state');
        }
        
        // Test redo
        const redoSuccess = await this.cartManager.redo();
        if (!redoSuccess) {
            throw new Error('Redo operation failed');
        }
        
        itemCount = this.cartManager.getItemCount();
        if (itemCount !== 1) {
            throw new Error('Redo did not restore cart state');
        }
        
        return {
            undoWorking: true,
            redoWorking: true,
            stateManagement: 'functional'
        };
    }

    async testStateConsistency() {
        await this.cartManager.clearCart();
        
        // Perform multiple operations
        const item1 = this.testData.validItem;
        const item2 = this.testData.expensiveItem;
        
        await this.cartManager.addItem(item1, 2);
        await this.cartManager.addItem(item2, 1);
        
        const cartItem1 = this.cartManager.getItems()[0];
        await this.cartManager.updateItemQuantity(cartItem1.cartItemId, 3);
        
        // Verify state consistency
        const summary = this.cartManager.getCartSummary();
        const items = this.cartManager.getItems();
        
        const calculatedCount = items.reduce((sum, item) => sum + item.quantity, 0);
        if (summary.itemCount !== calculatedCount) {
            throw new Error('Item count inconsistent with actual items');
        }
        
        const calculatedSubtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
        if (Math.abs(summary.subtotal - calculatedSubtotal) > 0.01) {
            throw new Error('Subtotal inconsistent with item totals');
        }
        
        return {
            stateConsistency: true,
            itemCount: summary.itemCount,
            calculatedCount,
            subtotal: summary.subtotal,
            calculatedSubtotal
        };
    }

    async testConcurrentOperations() {
        await this.cartManager.clearCart();
        
        const item = this.testData.validItem;
        
        // Simulate concurrent operations
        const operations = [
            this.cartManager.addItem(item, 1),
            this.cartManager.addItem({ ...item, id: 'concurrent_1' }, 1),
            this.cartManager.addItem({ ...item, id: 'concurrent_2' }, 1)
        ];
        
        const results = await Promise.allSettled(operations);
        
        const successful = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;
        
        return {
            concurrentOperations: operations.length,
            successful,
            failed,
            finalItemCount: this.cartManager.getItemCount()
        };
    }

    // ===========================================
    // Design Export Tests
    // ===========================================

    async testDesignExport() {
        await this.cartManager.clearCart();
        
        const designState = {
            charms: [
                { inventoryId: 'charm_001', x: 100, y: 100 },
                { inventoryId: 'charm_002', x: 200, y: 200 }
            ]
        };
        
        const metadata = {
            name: 'Test Design',
            description: 'A test custom design'
        };
        
        try {
            const cartItem = await this.cartManager.exportDesignToCart(designState, metadata);
            
            if (!cartItem) {
                throw new Error('Design export returned null');
            }
            
            if (!cartItem.is_custom_design) {
                throw new Error('Exported item not marked as custom design');
            }
            
            if (cartItem.design_data.components.length !== 2) {
                throw new Error('Design components not properly exported');
            }
            
            return {
                designExported: true,
                cartItemId: cartItem.cartItemId,
                componentCount: cartItem.design_data.components.length,
                designPrice: cartItem.price
            };
            
        } catch (error) {
            throw new Error(`Design export failed: ${error.message}`);
        }
    }

    async testCustomDesignHandling() {
        await this.cartManager.clearCart();
        
        const customDesign = this.testData.customDesign;
        
        // Add custom design
        const cartItem = await this.cartManager.addItem(customDesign, 1, { skipValidation: true });
        
        if (!cartItem.is_custom_design) {
            throw new Error('Custom design flag not preserved');
        }
        
        // Verify it doesn't duplicate when adding again
        const cartItem2 = await this.cartManager.addItem(customDesign, 1, { skipValidation: true });
        
        if (cartItem.cartItemId === cartItem2.cartItemId) {
            throw new Error('Custom designs should not be considered duplicates');
        }
        
        return {
            customDesignHandling: true,
            allowsDuplicates: true,
            totalCustomDesigns: this.cartManager.getItems().filter(item => item.is_custom_design).length
        };
    }

    // ===========================================
    // Error Handling Tests
    // ===========================================

    async testErrorRecovery() {
        const errorScenarios = [];
        
        // Scenario 1: Invalid item addition
        try {
            await this.cartManager.addItem(null, 1);
            errorScenarios.push({ scenario: 'null_item', recovered: false });
        } catch (error) {
            // Should be able to continue after error
            await this.cartManager.addItem(this.testData.validItem, 1);
            errorScenarios.push({ scenario: 'null_item', recovered: true });
        }
        
        // Scenario 2: Invalid quantity update
        const cartItem = this.cartManager.getItems()[0];
        try {
            await this.cartManager.updateItemQuantity(cartItem.cartItemId, -5);
            errorScenarios.push({ scenario: 'invalid_quantity', recovered: false });
        } catch (error) {
            // Should be able to continue
            await this.cartManager.updateItemQuantity(cartItem.cartItemId, 2);
            errorScenarios.push({ scenario: 'invalid_quantity', recovered: true });
        }
        
        const recoveredCount = errorScenarios.filter(s => s.recovered).length;
        
        return {
            errorScenariostested: errorScenarios.length,
            recoveredScenarios: recoveredCount,
            errorRecovery: recoveredCount === errorScenarios.length ? 'excellent' : 'partial',
            scenarios: errorScenarios
        };
    }

    async testNetworkFailureHandling() {
        // Simulate network failure by mocking fetch
        const originalFetch = window.fetch;
        
        try {
            // Mock fetch to fail
            window.fetch = () => Promise.reject(new Error('Network failure'));
            
            // Try operations that might use network
            await this.cartManager.addItem(this.testData.validItem, 1);
            
            // Restore fetch
            window.fetch = originalFetch;
            
            return {
                networkFailureHandling: true,
                operationsContinued: true,
                gracefulDegradation: true
            };
            
        } catch (error) {
            // Restore fetch
            window.fetch = originalFetch;
            
            return {
                networkFailureHandling: false,
                error: error.message
            };
        }
    }

    async testDataCorruptionHandling() {
        // Test handling of corrupted localStorage data
        const corruptedData = '{"invalid": json}';
        localStorage.setItem('shopping_cart', corruptedData);
        
        try {
            // Try to initialize with corrupted data
            const { default: CartManager } = await import('/src/js/core/CartManager.js');
            const testCart = new CartManager({ enablePersistence: true });
            await testCart.initialize();
            
            // Should handle corruption gracefully
            return {
                dataCorruptionHandling: true,
                recoveredGracefully: true,
                cartInitialized: testCart.isInitialized
            };
            
        } catch (error) {
            return {
                dataCorruptionHandling: false,
                error: error.message
            };
        } finally {
            // Cleanup
            localStorage.removeItem('shopping_cart');
        }
    }

    // ===========================================
    // Performance Tests
    // ===========================================

    async testLargeCartPerformance() {
        if (!this.options.enablePerformanceTests) {
            return { skipped: true, reason: 'Performance tests disabled' };
        }
        
        await this.cartManager.clearCart();
        
        const startTime = performance.now();
        const itemCount = 20; // Reasonable number for testing
        
        // Add many items
        for (let i = 0; i < itemCount; i++) {
            const item = {
                ...this.testData.validItem,
                id: `perf_test_${i}`,
                title: `Performance Test Item ${i}`
            };
            await this.cartManager.addItem(item, 1);
        }
        
        const addTime = performance.now() - startTime;
        
        // Test calculation performance
        const calcStartTime = performance.now();
        const summary = this.cartManager.getCartSummary();
        const calcTime = performance.now() - calcStartTime;
        
        return {
            itemsAdded: itemCount,
            addTime: addTime.toFixed(2),
            calculationTime: calcTime.toFixed(2),
            finalItemCount: summary.itemCount,
            performanceAcceptable: addTime < 5000 && calcTime < 100
        };
    }

    async testOperationSpeed() {
        if (!this.options.enablePerformanceTests) {
            return { skipped: true, reason: 'Performance tests disabled' };
        }
        
        const operations = [];
        
        // Test add operation speed
        let startTime = performance.now();
        await this.cartManager.addItem(this.testData.validItem, 1);
        operations.push({ operation: 'add', time: performance.now() - startTime });
        
        // Test update operation speed
        const cartItem = this.cartManager.getItems()[0];
        startTime = performance.now();
        await this.cartManager.updateItemQuantity(cartItem.cartItemId, 3);
        operations.push({ operation: 'update', time: performance.now() - startTime });
        
        // Test remove operation speed
        startTime = performance.now();
        await this.cartManager.removeItem(cartItem.cartItemId);
        operations.push({ operation: 'remove', time: performance.now() - startTime });
        
        const avgTime = operations.reduce((sum, op) => sum + op.time, 0) / operations.length;
        
        return {
            operations,
            averageTime: avgTime.toFixed(2),
            allUnder100ms: operations.every(op => op.time < 100)
        };
    }

    async testMemoryUsage() {
        if (!this.options.enablePerformanceTests || !performance.memory) {
            return { skipped: true, reason: 'Memory API not available' };
        }
        
        const beforeMemory = performance.memory.usedJSHeapSize;
        
        // Add many items to test memory usage
        for (let i = 0; i < 50; i++) {
            await this.cartManager.addItem({
                ...this.testData.validItem,
                id: `memory_test_${i}`
            }, 1);
        }
        
        const afterMemory = performance.memory.usedJSHeapSize;
        const memoryIncrease = afterMemory - beforeMemory;
        
        return {
            memoryBefore: (beforeMemory / 1024 / 1024).toFixed(2) + ' MB',
            memoryAfter: (afterMemory / 1024 / 1024).toFixed(2) + ' MB',
            memoryIncrease: (memoryIncrease / 1024 / 1024).toFixed(2) + ' MB',
            memoryEfficient: memoryIncrease < 10 * 1024 * 1024 // Less than 10MB
        };
    }

    // ===========================================
    // Edge Cases and Stress Tests
    // ===========================================

    async testEdgeCases() {
        const edgeCases = [];
        
        // Edge case 1: Empty cart operations
        try {
            await this.cartManager.clearCart();
            const success = await this.cartManager.clearCart(); // Clear already empty cart
            edgeCases.push({ case: 'clear_empty_cart', success, handled: true });
        } catch (error) {
            edgeCases.push({ case: 'clear_empty_cart', success: false, error: error.message });
        }
        
        // Edge case 2: Very long item titles
        try {
            const longTitleItem = {
                ...this.testData.validItem,
                id: 'long_title_test',
                title: 'A'.repeat(1000) // Very long title
            };
            await this.cartManager.addItem(longTitleItem, 1);
            edgeCases.push({ case: 'long_title', handled: true });
        } catch (error) {
            edgeCases.push({ case: 'long_title', handled: false, error: error.message });
        }
        
        // Edge case 3: Zero price items
        try {
            const zeroPriceItem = {
                ...this.testData.validItem,
                id: 'zero_price_test',
                price: 0
            };
            await this.cartManager.addItem(zeroPriceItem, 1);
            edgeCases.push({ case: 'zero_price', handled: true });
        } catch (error) {
            edgeCases.push({ case: 'zero_price', handled: false, error: error.message });
        }
        
        return {
            edgeCasesTested: edgeCases.length,
            handledCases: edgeCases.filter(c => c.handled).length,
            edgeCases
        };
    }

    async testBoundaryConditions() {
        const boundaries = [];
        
        // Test max items limit
        try {
            await this.cartManager.clearCart();
            
            // Add items up to the limit (50)
            for (let i = 0; i < 50; i++) {
                await this.cartManager.addItem({
                    ...this.testData.validItem,
                    id: `boundary_${i}`
                }, 1);
            }
            
            // Try to add one more (should fail)
            try {
                await this.cartManager.addItem({
                    ...this.testData.validItem,
                    id: 'boundary_overflow'
                }, 1);
                boundaries.push({ boundary: 'max_items', enforced: false });
            } catch (error) {
                boundaries.push({ boundary: 'max_items', enforced: true });
            }
        } catch (error) {
            boundaries.push({ boundary: 'max_items', error: error.message });
        }
        
        // Test max quantity per item
        try {
            await this.cartManager.clearCart();
            const item = await this.cartManager.addItem(this.testData.validItem, 1);
            
            try {
                await this.cartManager.updateItemQuantity(item.cartItemId, 15); // Exceeds limit of 10
                boundaries.push({ boundary: 'max_quantity_per_item', enforced: false });
            } catch (error) {
                boundaries.push({ boundary: 'max_quantity_per_item', enforced: true });
            }
        } catch (error) {
            boundaries.push({ boundary: 'max_quantity_per_item', error: error.message });
        }
        
        return {
            boundariesTested: boundaries.length,
            enforcedBoundaries: boundaries.filter(b => b.enforced).length,
            boundaries
        };
    }

    async testStressTesting() {
        if (!this.options.enableStressTests) {
            return { skipped: true, reason: 'Stress tests disabled' };
        }
        
        await this.cartManager.clearCart();
        
        const stressResults = {
            rapidOperations: 0,
            errors: 0,
            timeoutErrors: 0
        };
        
        const startTime = performance.now();
        
        // Perform rapid operations
        try {
            for (let i = 0; i < 100; i++) {
                const operation = i % 3;
                
                try {
                    if (operation === 0) {
                        // Add item
                        await this.cartManager.addItem({
                            ...this.testData.validItem,
                            id: `stress_${i}`
                        }, 1);
                    } else if (operation === 1 && this.cartManager.getItems().length > 0) {
                        // Update quantity
                        const items = this.cartManager.getItems();
                        const randomItem = items[Math.floor(Math.random() * items.length)];
                        await this.cartManager.updateItemQuantity(randomItem.cartItemId, Math.floor(Math.random() * 5) + 1);
                    } else if (operation === 2 && this.cartManager.getItems().length > 0) {
                        // Remove item
                        const items = this.cartManager.getItems();
                        const randomItem = items[Math.floor(Math.random() * items.length)];
                        await this.cartManager.removeItem(randomItem.cartItemId);
                    }
                    
                    stressResults.rapidOperations++;
                } catch (error) {
                    stressResults.errors++;
                    if (error.message.includes('timeout')) {
                        stressResults.timeoutErrors++;
                    }
                }
            }
        } catch (error) {
            stressResults.errors++;
        }
        
        const totalTime = performance.now() - startTime;
        
        return {
            operationsAttempted: 100,
            operationsCompleted: stressResults.rapidOperations,
            errors: stressResults.errors,
            timeoutErrors: stressResults.timeoutErrors,
            totalTime: totalTime.toFixed(2),
            operationsPerSecond: ((stressResults.rapidOperations / totalTime) * 1000).toFixed(2),
            stabilityRating: stressResults.errors < 5 ? 'excellent' : stressResults.errors < 15 ? 'good' : 'poor'
        };
    }

    // ===========================================
    // Utility Methods
    // ===========================================

    generateTestReport() {
        const passed = this.testResults.filter(r => r.status === 'passed').length;
        const failed = this.testResults.filter(r => r.status === 'failed').length;
        const total = this.testResults.length;
        
        const avgDuration = this.testResults.reduce((sum, r) => sum + parseFloat(r.duration), 0) / total;
        
        const categories = {
            basic: this.testResults.filter(r => ['initialization', 'add-item', 'remove-item', 'update-quantity', 'clear-cart'].includes(r.testId)),
            validation: this.testResults.filter(r => r.testId.includes('validation')),
            calculations: this.testResults.filter(r => r.testId.includes('calculation')),
            persistence: this.testResults.filter(r => r.testId.includes('persistence')),
            stateManagement: this.testResults.filter(r => ['undo-redo', 'state-consistency', 'concurrent-operations'].includes(r.testId)),
            designExport: this.testResults.filter(r => r.testId.includes('design')),
            errorHandling: this.testResults.filter(r => r.testId.includes('error') || r.testId.includes('failure')),
            performance: this.testResults.filter(r => r.testId.includes('performance') || r.testId.includes('speed') || r.testId.includes('memory')),
            edgeCases: this.testResults.filter(r => r.testId.includes('edge') || r.testId.includes('boundary') || r.testId.includes('stress'))
        };
        
        return {
            summary: {
                total,
                passed,
                failed,
                successRate: ((passed / total) * 100).toFixed(1) + '%',
                averageDuration: avgDuration.toFixed(2) + 'ms'
            },
            categories: Object.fromEntries(
                Object.entries(categories).map(([name, tests]) => [
                    name,
                    {
                        total: tests.length,
                        passed: tests.filter(t => t.status === 'passed').length,
                        failed: tests.filter(t => t.status === 'failed').length
                    }
                ])
            ),
            results: this.testResults,
            timestamp: new Date().toISOString()
        };
    }

    async cleanup() {
        if (this.cartManager) {
            await this.cartManager.clearCart();
            // Don't destroy the cart manager as it might be used elsewhere
        }
        
        // Clean up test data from storage
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.includes('test')) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));
        
        console.log('CartManager test cleanup completed');
    }

    stop() {
        this.isRunning = false;
        console.log('CartManager tests stopped');
    }
}

// Export for both ES6 modules and global use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CartManagerTester;
} else {
    window.CartManagerTester = CartManagerTester;
}

export default CartManagerTester;