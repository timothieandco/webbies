/**
 * CartManager Tests
 * Tests for the cart management functionality
 */

import CartManager from '../CartManager.js';
import { localStorageMock } from '../../utils/__tests__/setup.js';

describe('CartManager', () => {
    let cartManager;
    let mockCartAPI;

    beforeEach(() => {
        // Mock CartAPI
        mockCartAPI = {
            getCart: jest.fn().mockResolvedValue({
                items: [],
                subtotal: 0,
                tax: 0,
                shipping: 0,
                total: 0
            }),
            addToCart: jest.fn().mockResolvedValue({
                success: true,
                cartItem: {
                    id: 'test-item-1',
                    title: 'Test Item',
                    price: 10.00,
                    quantity: 1
                }
            }),
            updateQuantity: jest.fn().mockResolvedValue({ success: true }),
            removeFromCart: jest.fn().mockResolvedValue({ success: true }),
            clearCart: jest.fn().mockResolvedValue({ success: true })
        };

        // Create CartManager instance
        cartManager = new CartManager({
            enablePersistence: true,
            enableRealTimeSync: false,
            cartAPI: mockCartAPI
        });
    });

    afterEach(() => {
        cartManager.destroy();
        jest.clearAllMocks();
    });

    describe('Initialization', () => {
        test('should initialize with default options', () => {
            const manager = new CartManager();
            expect(manager.options.enablePersistence).toBe(true);
            expect(manager.options.enableRealTimeSync).toBe(false);
            expect(manager.options.autoSave).toBe(true);
        });

        test('should merge custom options with defaults', () => {
            const customOptions = {
                enablePersistence: false,
                maxItems: 50
            };
            const manager = new CartManager(customOptions);
            expect(manager.options.enablePersistence).toBe(false);
            expect(manager.options.maxItems).toBe(50);
            expect(manager.options.autoSave).toBe(true); // default preserved
        });
    });

    describe('Cart State Management', () => {
        test('should start with empty cart state', () => {
            const state = cartManager.getCartState();
            expect(state).toEqual({
                items: [],
                subtotal: 0,
                tax: 0,
                shipping: 0,
                discount: 0,
                total: 0,
                itemCount: 0
            });
        });

        test('should update cart state correctly', () => {
            const newState = {
                items: [{ id: '1', title: 'Test', price: 10, quantity: 1 }],
                subtotal: 10,
                tax: 0.8,
                shipping: 5,
                total: 15.8,
                itemCount: 1
            };

            cartManager.updateCartState(newState);
            const state = cartManager.getCartState();
            expect(state).toEqual(expect.objectContaining(newState));
        });

        test('should emit cart updated event when state changes', () => {
            const mockListener = jest.fn();
            document.addEventListener('cart-updated', mockListener);

            cartManager.updateCartState({
                items: [{ id: '1', title: 'Test', price: 10, quantity: 1 }],
                total: 10
            });

            expect(mockListener).toHaveBeenCalled();
            document.removeEventListener('cart-updated', mockListener);
        });
    });

    describe('Adding Items to Cart', () => {
        test('should add regular item to cart successfully', async () => {
            const item = {
                id: 'test-item',
                title: 'Test Item',
                price: 25.00,
                image: 'test-image.jpg'
            };

            const result = await cartManager.addToCart(item, 1);

            expect(result.success).toBe(true);
            expect(mockCartAPI.addToCart).toHaveBeenCalledWith(
                expect.objectContaining({
                    inventory_id: item.id,
                    item_name: item.title,
                    unit_price: item.price,
                    quantity: 1
                })
            );
        });

        test('should add custom design to cart successfully', async () => {
            const customDesign = {
                id: 'custom-1',
                title: 'Custom Ring',
                price: 150.00,
                designData: {
                    components: [
                        { type: 'band', material: 'gold' },
                        { type: 'stone', stone: 'diamond' }
                    ]
                },
                imageUrl: 'custom-preview.jpg'
            };

            const result = await cartManager.addCustomDesignToCart(customDesign, 1);

            expect(result.success).toBe(true);
            expect(mockCartAPI.addToCart).toHaveBeenCalledWith(
                expect.objectContaining({
                    design_id: customDesign.id,
                    item_name: customDesign.title,
                    unit_price: customDesign.price,
                    is_custom_design: true,
                    customization_data: customDesign.designData
                })
            );
        });

        test('should handle add to cart errors gracefully', async () => {
            mockCartAPI.addToCart.mockRejectedValue(new Error('API Error'));

            const item = { id: 'test', title: 'Test', price: 10 };
            const result = await cartManager.addToCart(item, 1);

            expect(result.success).toBe(false);
            expect(result.error).toBe('API Error');
        });

        test('should validate item data before adding', async () => {
            const invalidItem = {
                // Missing required fields
                title: 'Test Item'
            };

            const result = await cartManager.addToCart(invalidItem, 1);

            expect(result.success).toBe(false);
            expect(result.error).toContain('Invalid item data');
            expect(mockCartAPI.addToCart).not.toHaveBeenCalled();
        });

        test('should validate quantity constraints', async () => {
            const item = { id: 'test', title: 'Test', price: 10 };

            // Test zero quantity
            let result = await cartManager.addToCart(item, 0);
            expect(result.success).toBe(false);
            expect(result.error).toContain('quantity');

            // Test negative quantity
            result = await cartManager.addToCart(item, -1);
            expect(result.success).toBe(false);
            expect(result.error).toContain('quantity');

            // Test excessive quantity (assuming max is 99)
            result = await cartManager.addToCart(item, 100);
            expect(result.success).toBe(false);
            expect(result.error).toContain('quantity');
        });
    });

    describe('Updating Cart Items', () => {
        test('should update item quantity successfully', async () => {
            const cartItemId = 'cart-item-1';
            const newQuantity = 3;

            const result = await cartManager.updateItemQuantity(cartItemId, newQuantity);

            expect(result.success).toBe(true);
            expect(mockCartAPI.updateQuantity).toHaveBeenCalledWith(cartItemId, newQuantity);
        });

        test('should remove item when quantity is set to 0', async () => {
            const cartItemId = 'cart-item-1';

            const result = await cartManager.updateItemQuantity(cartItemId, 0);

            expect(result.success).toBe(true);
            expect(mockCartAPI.removeFromCart).toHaveBeenCalledWith(cartItemId);
        });

        test('should validate quantity before updating', async () => {
            const cartItemId = 'cart-item-1';

            const result = await cartManager.updateItemQuantity(cartItemId, -1);

            expect(result.success).toBe(false);
            expect(result.error).toContain('quantity');
            expect(mockCartAPI.updateQuantity).not.toHaveBeenCalled();
        });
    });

    describe('Removing Items from Cart', () => {
        test('should remove item successfully', async () => {
            const cartItemId = 'cart-item-1';

            const result = await cartManager.removeItem(cartItemId);

            expect(result.success).toBe(true);
            expect(mockCartAPI.removeFromCart).toHaveBeenCalledWith(cartItemId);
        });

        test('should handle remove item errors', async () => {
            mockCartAPI.removeFromCart.mockRejectedValue(new Error('Remove failed'));

            const result = await cartManager.removeItem('cart-item-1');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Remove failed');
        });
    });

    describe('Cart Persistence', () => {
        test('should save cart state to localStorage when persistence is enabled', () => {
            const cartState = {
                items: [{ id: '1', title: 'Test', price: 10, quantity: 1 }],
                total: 10
            };

            cartManager.updateCartState(cartState);

            expect(localStorageMock.setItem).toHaveBeenCalledWith(
                'timothie_cart_state',
                JSON.stringify(cartState)
            );
        });

        test('should load cart state from localStorage on initialization', () => {
            const savedState = {
                items: [{ id: '1', title: 'Saved Item', price: 15, quantity: 2 }],
                total: 30
            };

            localStorageMock.getItem.mockReturnValue(JSON.stringify(savedState));

            const manager = new CartManager({ enablePersistence: true });
            const state = manager.getCartState();

            expect(state).toEqual(expect.objectContaining(savedState));
        });

        test('should not use localStorage when persistence is disabled', () => {
            const manager = new CartManager({ enablePersistence: false });
            
            manager.updateCartState({ total: 100 });

            expect(localStorageMock.setItem).not.toHaveBeenCalled();
        });
    });

    describe('Cart Calculations', () => {
        test('should calculate totals correctly', () => {
            const cartState = {
                items: [
                    { id: '1', price: 10.00, quantity: 2 },
                    { id: '2', price: 5.50, quantity: 1 }
                ],
                subtotal: 25.50,
                tax: 2.04, // 8% tax
                shipping: 5.99,
                discount: 0
            };

            cartManager.updateCartState(cartState);

            const result = cartManager.calculateTotals();
            expect(result.total).toBeCloseTo(33.53, 2);
            expect(result.itemCount).toBe(3);
        });

        test('should apply discount correctly', () => {
            const cartState = {
                subtotal: 100,
                tax: 8,
                shipping: 10,
                discount: 15 // $15 discount
            };

            cartManager.updateCartState(cartState);

            const result = cartManager.calculateTotals();
            expect(result.total).toBe(103); // 100 - 15 + 8 + 10
        });
    });

    describe('Error Handling', () => {
        test('should handle API failures gracefully', async () => {
            mockCartAPI.getCart.mockRejectedValue(new Error('Network error'));

            await cartManager.refreshCart();

            // Should maintain current state and not crash
            const state = cartManager.getCartState();
            expect(state).toBeDefined();
        });

        test('should validate input parameters', async () => {
            // Test null item
            let result = await cartManager.addToCart(null, 1);
            expect(result.success).toBe(false);

            // Test undefined quantity
            result = await cartManager.updateItemQuantity('test-id', undefined);
            expect(result.success).toBe(false);

            // Test empty cart item ID
            result = await cartManager.removeItem('');
            expect(result.success).toBe(false);
        });
    });

    describe('Event System', () => {
        test('should emit appropriate events for cart operations', async () => {
            const mockItemAddedListener = jest.fn();
            const mockCartUpdatedListener = jest.fn();

            document.addEventListener('cart-item-added', mockItemAddedListener);
            document.addEventListener('cart-updated', mockCartUpdatedListener);

            const item = { id: 'test', title: 'Test Item', price: 10 };
            await cartManager.addToCart(item, 1);

            expect(mockItemAddedListener).toHaveBeenCalled();
            expect(mockCartUpdatedListener).toHaveBeenCalled();

            document.removeEventListener('cart-item-added', mockItemAddedListener);
            document.removeEventListener('cart-updated', mockCartUpdatedListener);
        });
    });

    describe('Cleanup', () => {
        test('should cleanup resources on destroy', () => {
            const spy = jest.spyOn(cartManager, 'stopAutoRefresh');
            
            cartManager.destroy();

            expect(spy).toHaveBeenCalled();
        });
    });
});