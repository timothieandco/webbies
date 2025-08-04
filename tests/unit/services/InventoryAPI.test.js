/**
 * InventoryAPI Unit Tests
 * Tests backend API integration and data management
 */

import { InventoryAPI, initializeAPI, getAPI } from '../../../src/js/services/InventoryAPI.js';
import { mockAPIResponses, mockUsers, mockCharms, mockDesigns } from '../../fixtures/testData.js';

// Mock Supabase
jest.mock('@supabase/supabase-js', () => require('../../mocks/supabaseMock.js'));

describe('InventoryAPI', () => {
  let api;
  let mockClient;

  beforeEach(() => {
    // Reset singleton
    jest.resetModules();
    
    // Create API instance
    api = new InventoryAPI('mock-url', 'mock-key');
    mockClient = api.client;
    
    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('Constructor', () => {
    test('should initialize with URL and key', () => {
      expect(api.client).toBeDefined();
      expect(api.isAuthenticated).toBe(false);
      expect(api.currentUser).toBeNull();
    });

    test('should throw error without required parameters', () => {
      expect(() => new InventoryAPI()).toThrow('Supabase URL and key are required');
      expect(() => new InventoryAPI('url')).toThrow('Supabase URL and key are required');
    });

    test('should set up auth state listener', () => {
      expect(mockClient.auth.onAuthStateChange).toHaveBeenCalled();
    });
  });

  describe('Authentication', () => {
    describe('Sign Up', () => {
      test('should sign up user successfully', async () => {
        const mockResponse = mockAPIResponses.authSuccess;
        mockClient.auth.signUp.mockResolvedValue(mockResponse);

        const result = await api.signUp('test@example.com', 'password123', { name: 'Test User' });

        expect(mockClient.auth.signUp).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
          options: {
            data: { name: 'Test User' }
          }
        });
        expect(result).toEqual(mockResponse.data);
      });

      test('should handle sign up errors', async () => {
        const mockError = new Error('Sign up failed');
        mockClient.auth.signUp.mockResolvedValue({ data: null, error: mockError });

        await expect(api.signUp('test@example.com', 'password123')).rejects.toThrow('Sign up failed');
      });
    });

    describe('Sign In', () => {
      test('should sign in user successfully', async () => {
        const mockResponse = mockAPIResponses.authSuccess;
        mockClient.auth.signInWithPassword.mockResolvedValue(mockResponse);

        const result = await api.signIn('test@example.com', 'password123');

        expect(mockClient.auth.signInWithPassword).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123'
        });
        expect(result).toEqual(mockResponse.data);
      });

      test('should handle sign in errors', async () => {
        const mockError = new Error('Invalid credentials');
        mockClient.auth.signInWithPassword.mockResolvedValue({ data: null, error: mockError });

        await expect(api.signIn('test@example.com', 'wrong-password')).rejects.toThrow('Invalid credentials');
      });
    });

    describe('Sign Out', () => {
      test('should sign out successfully', async () => {
        mockClient.auth.signOut.mockResolvedValue({ error: null });

        await expect(api.signOut()).resolves.not.toThrow();
        expect(mockClient.auth.signOut).toHaveBeenCalled();
      });

      test('should handle sign out errors', async () => {
        const mockError = new Error('Sign out failed');
        mockClient.auth.signOut.mockResolvedValue({ error: mockError });

        await expect(api.signOut()).rejects.toThrow('Sign out failed');
      });
    });

    describe('Session Management', () => {
      test('should get current session', async () => {
        const mockSession = { user: mockUsers.testUser, access_token: 'token' };
        mockClient.auth.getSession.mockResolvedValue({ data: { session: mockSession } });

        const result = await api.getCurrentSession();

        expect(result).toEqual(mockSession);
      });
    });
  });

  describe('Inventory Management', () => {
    describe('Get Inventory', () => {
      test('should fetch inventory with default parameters', async () => {
        const mockResponse = mockAPIResponses.inventorySuccess;
        mockClient.from().then.mockImplementation((resolve) => {
          resolve(mockResponse);
          return Promise.resolve(mockResponse);
        });

        const result = await api.getInventory();

        expect(mockClient.from).toHaveBeenCalledWith('inventory');
        expect(result).toEqual({
          data: mockResponse.data,
          count: mockResponse.count,
          page: 1,
          total_pages: 1
        });
      });

      test('should apply filters correctly', async () => {
        const filters = {
          category: 'Charms',
          status: 'active',
          price_min: 10,
          price_max: 50,
          search: 'heart',
          tags: ['romantic']
        };

        await api.getInventory(filters);

        const queryBuilder = mockClient.from();
        expect(queryBuilder.eq).toHaveBeenCalledWith('status', 'active');
        expect(queryBuilder.eq).toHaveBeenCalledWith('category', 'Charms');
        expect(queryBuilder.gte).toHaveBeenCalledWith('price', 10);
        expect(queryBuilder.lte).toHaveBeenCalledWith('price', 50);
        expect(queryBuilder.contains).toHaveBeenCalledWith('tags', ['romantic']);
        expect(queryBuilder.or).toHaveBeenCalledWith('title.ilike.%heart%,description.ilike.%heart%');
      });

      test('should apply pagination correctly', async () => {
        const pagination = {
          limit: 20,
          offset: 40,
          order: 'title.asc'
        };

        await api.getInventory({}, pagination);

        const queryBuilder = mockClient.from();
        expect(queryBuilder.order).toHaveBeenCalledWith('title', { ascending: true });
        expect(queryBuilder.range).toHaveBeenCalledWith(40, 59); // offset to offset + limit - 1
      });

      test('should handle errors gracefully', async () => {
        const mockError = new Error('Database error');
        mockClient.from().then.mockImplementation(() => {
          throw mockError;
        });

        await expect(api.getInventory()).rejects.toThrow('Database error');
      });
    });

    describe('Get Single Item', () => {
      test('should fetch single inventory item', async () => {
        const mockItem = mockCharms.charmOne;
        mockClient.from().then.mockImplementation((resolve) => {
          resolve({ data: mockItem, error: null });
          return Promise.resolve({ data: mockItem, error: null });
        });

        const result = await api.getInventoryItem('charm-1');

        expect(mockClient.from).toHaveBeenCalledWith('inventory');
        const queryBuilder = mockClient.from();
        expect(queryBuilder.eq).toHaveBeenCalledWith('id', 'charm-1');
        expect(queryBuilder.single).toHaveBeenCalled();
        expect(result).toEqual(mockItem);
      });
    });

    describe('Create Item', () => {
      test('should create inventory item successfully', async () => {
        const newItem = {
          title: 'New Charm',
          description: 'A brand new charm',
          category: 'Charms',
          price: 25.99
        };

        const createdItem = { ...newItem, id: 'new-charm-id' };
        mockClient.from().then.mockImplementation((resolve) => {
          resolve({ data: createdItem, error: null });
          return Promise.resolve({ data: createdItem, error: null });
        });

        const result = await api.createInventoryItem(newItem);

        expect(mockClient.from).toHaveBeenCalledWith('inventory');
        const queryBuilder = mockClient.from();
        expect(queryBuilder.insert).toHaveBeenCalledWith(newItem);
        expect(result).toEqual(createdItem);
      });

      test('should validate item data before creation', async () => {
        const invalidItem = {}; // Missing required fields

        await expect(api.createInventoryItem(invalidItem)).rejects.toThrow('Invalid inventory item data');
      });
    });

    describe('Update Item', () => {
      test('should update inventory item successfully', async () => {
        const updates = { price: 30.99, quantity_available: 15 };
        const updatedItem = { ...mockCharms.charmOne, ...updates };

        mockClient.from().then.mockImplementation((resolve) => {
          resolve({ data: updatedItem, error: null });
          return Promise.resolve({ data: updatedItem, error: null });
        });

        const result = await api.updateInventoryItem('charm-1', updates);

        expect(mockClient.from).toHaveBeenCalledWith('inventory');
        const queryBuilder = mockClient.from();
        expect(queryBuilder.update).toHaveBeenCalledWith(updates);
        expect(queryBuilder.eq).toHaveBeenCalledWith('id', 'charm-1');
        expect(result).toEqual(updatedItem);
      });
    });

    describe('Delete Item', () => {
      test('should delete inventory item successfully', async () => {
        mockClient.from().then.mockImplementation((resolve) => {
          resolve({ error: null });
          return Promise.resolve({ error: null });
        });

        await expect(api.deleteInventoryItem('charm-1')).resolves.not.toThrow();

        const queryBuilder = mockClient.from();
        expect(queryBuilder.delete).toHaveBeenCalled();
        expect(queryBuilder.eq).toHaveBeenCalledWith('id', 'charm-1');
      });
    });

    describe('Search Inventory', () => {
      test('should search inventory items', async () => {
        const mockResponse = mockAPIResponses.inventorySuccess;
        mockClient.from().then.mockImplementation((resolve) => {
          resolve(mockResponse);
          return Promise.resolve(mockResponse);
        });

        const result = await api.searchInventory('heart', { category: 'Charms' });

        expect(result).toEqual(mockResponse.data);
      });
    });
  });

  describe('Design Management', () => {
    beforeEach(() => {
      api.currentUser = mockUsers.testUser;
    });

    describe('Get User Designs', () => {
      test('should fetch designs for authenticated user', async () => {
        const mockResponse = { data: [mockDesigns.simpleDesign], error: null };
        mockClient.from().then.mockImplementation((resolve) => {
          resolve(mockResponse);
          return Promise.resolve(mockResponse);
        });

        const result = await api.getUserDesigns();

        expect(mockClient.from).toHaveBeenCalledWith('designs');
        const queryBuilder = mockClient.from();
        expect(queryBuilder.eq).toHaveBeenCalledWith('user_id', mockUsers.testUser.id);
        expect(result).toEqual([mockDesigns.simpleDesign]);
      });

      test('should throw error for unauthenticated user', async () => {
        api.currentUser = null;

        await expect(api.getUserDesigns()).rejects.toThrow('User not authenticated');
      });
    });

    describe('Save Design', () => {
      test('should save design for authenticated user', async () => {
        const designData = {
          title: 'My Design',
          description: 'A beautiful custom design',
          design_data: { charms: [], necklace: null }
        };

        const savedDesign = { ...designData, id: 'design-id', user_id: mockUsers.testUser.id };
        mockClient.from().then.mockImplementation((resolve) => {
          resolve({ data: savedDesign, error: null });
          return Promise.resolve({ data: savedDesign, error: null });
        });

        const result = await api.saveDesign(designData);

        expect(mockClient.from).toHaveBeenCalledWith('designs');
        const queryBuilder = mockClient.from();
        expect(queryBuilder.insert).toHaveBeenCalledWith({
          ...designData,
          user_id: mockUsers.testUser.id
        });
        expect(result).toEqual(savedDesign);
      });

      test('should validate design data', async () => {
        const invalidDesign = {}; // Missing required fields

        await expect(api.saveDesign(invalidDesign)).rejects.toThrow('Invalid design data');
      });

      test('should throw error for unauthenticated user', async () => {
        api.currentUser = null;

        await expect(api.saveDesign({})).rejects.toThrow('User not authenticated');
      });
    });

    describe('Update Design', () => {
      test('should update design successfully', async () => {
        const updates = { title: 'Updated Design' };
        const updatedDesign = { ...mockDesigns.simpleDesign, ...updates };

        mockClient.from().then.mockImplementation((resolve) => {
          resolve({ data: updatedDesign, error: null });
          return Promise.resolve({ data: updatedDesign, error: null });
        });

        const result = await api.updateDesign('design-1', updates);

        expect(result).toEqual(updatedDesign);
      });
    });

    describe('Delete Design', () => {
      test('should delete design successfully', async () => {
        mockClient.from().then.mockImplementation((resolve) => {
          resolve({ error: null });
          return Promise.resolve({ error: null });
        });

        await expect(api.deleteDesign('design-1')).resolves.not.toThrow();
      });
    });
  });

  describe('Real-time Subscriptions', () => {
    test('should subscribe to inventory changes', () => {
      const callback = jest.fn();
      
      api.subscribeToInventoryChanges(callback);

      expect(mockClient.channel).toHaveBeenCalledWith('inventory-changes');
    });

    test('should subscribe to user designs', () => {
      api.currentUser = mockUsers.testUser;
      const callback = jest.fn();
      
      api.subscribeToUserDesigns(callback);

      expect(mockClient.channel).toHaveBeenCalledWith('user-designs');
    });

    test('should throw error for unauthenticated user design subscription', () => {
      api.currentUser = null;
      const callback = jest.fn();

      expect(() => api.subscribeToUserDesigns(callback)).toThrow('User not authenticated');
    });
  });

  describe('Utility Methods', () => {
    describe('Image Upload', () => {
      test('should upload image successfully', async () => {
        const mockFile = new File(['image data'], 'test.jpg', { type: 'image/jpeg' });
        const mockUploadResponse = { data: { path: 'uploads/test.jpg' }, error: null };
        const mockUrlResponse = { data: { publicUrl: 'https://example.com/test.jpg' } };

        mockClient.storage.from().upload.mockResolvedValue(mockUploadResponse);
        mockClient.storage.from().getPublicUrl.mockReturnValue(mockUrlResponse);

        api.currentUser = mockUsers.testUser;

        const result = await api.uploadImage(mockFile, 'designs');

        expect(mockClient.storage.from).toHaveBeenCalledWith('designs');
        expect(result).toBe('https://example.com/test.jpg');
      });

      test('should handle upload errors', async () => {
        const mockFile = new File(['image data'], 'test.jpg', { type: 'image/jpeg' });
        const mockError = new Error('Upload failed');

        mockClient.storage.from().upload.mockResolvedValue({ data: null, error: mockError });

        await expect(api.uploadImage(mockFile)).rejects.toThrow('Upload failed');
      });
    });

    describe('Categories with Counts', () => {
      test('should get categories with item counts', async () => {
        const mockCategories = [
          { category: 'Charms', count: 25 },
          { category: 'Necklaces', count: 10 }
        ];

        mockClient.rpc.mockImplementation(() => ({
          then: (resolve) => {
            resolve({ data: mockCategories, error: null });
            return Promise.resolve({ data: mockCategories, error: null });
          }
        }));

        const result = await api.getCategoriesWithCounts();

        expect(mockClient.rpc).toHaveBeenCalledWith('get_categories_with_counts');
        expect(result).toEqual(mockCategories);
      });
    });

    describe('Inventory Statistics', () => {
      test('should get inventory statistics', async () => {
        const mockStats = {
          total_items: 135,
          active_items: 120,
          categories: 6,
          total_value: 2500.00
        };

        mockClient.rpc.mockImplementation(() => ({
          then: (resolve) => {
            resolve({ data: mockStats, error: null });
            return Promise.resolve({ data: mockStats, error: null });
          }
        }));

        const result = await api.getInventoryStats();

        expect(mockClient.rpc).toHaveBeenCalledWith('get_inventory_stats');
        expect(result).toEqual(mockStats);
      });
    });
  });

  describe('Order Management', () => {
    beforeEach(() => {
      api.currentUser = mockUsers.testUser;
    });

    describe('Create Order', () => {
      test('should create order with generated order number', async () => {
        const orderData = {
          design_id: 'design-1',
          total_amount: 99.99,
          shipping_address: '123 Test St'
        };

        const createdOrder = {
          ...orderData,
          id: 'order-id',
          user_id: mockUsers.testUser.id,
          order_number: expect.stringMatching(/^ORDER-\d+-[A-Z0-9]+$/)
        };

        mockClient.from().then.mockImplementation((resolve) => {
          resolve({ data: createdOrder, error: null });
          return Promise.resolve({ data: createdOrder, error: null });
        });

        const result = await api.createOrder(orderData);

        expect(result).toEqual(expect.objectContaining({
          ...orderData,
          user_id: mockUsers.testUser.id,
          order_number: expect.any(String)
        }));
      });

      test('should throw error for unauthenticated user', async () => {
        api.currentUser = null;

        await expect(api.createOrder({})).rejects.toThrow('User not authenticated');
      });
    });

    describe('Get User Orders', () => {
      test('should fetch orders for authenticated user', async () => {
        const mockOrders = [
          {
            id: 'order-1',
            user_id: mockUsers.testUser.id,
            order_number: 'ORDER-123',
            total_amount: 99.99
          }
        ];

        mockClient.from().then.mockImplementation((resolve) => {
          resolve({ data: mockOrders, error: null });
          return Promise.resolve({ data: mockOrders, error: null });
        });

        const result = await api.getUserOrders();

        expect(mockClient.from).toHaveBeenCalledWith('orders');
        const queryBuilder = mockClient.from();
        expect(queryBuilder.eq).toHaveBeenCalledWith('user_id', mockUsers.testUser.id);
        expect(result).toEqual(mockOrders);
      });
    });
  });

  describe('API Factory Functions', () => {
    test('should initialize API instance', () => {
      const instance = initializeAPI('test-url', 'test-key');
      
      expect(instance).toBeInstanceOf(InventoryAPI);
    });

    test('should get initialized API instance', () => {
      initializeAPI('test-url', 'test-key');
      const instance = getAPI();
      
      expect(instance).toBeInstanceOf(InventoryAPI);
    });

    test('should throw error when getting uninitialized API', () => {
      // Reset the module to clear singleton
      jest.resetModules();
      
      const { getAPI: freshGetAPI } = require('../../../src/js/services/InventoryAPI.js');
      
      expect(() => freshGetAPI()).toThrow('API not initialized. Call initializeAPI() first.');
    });
  });
});