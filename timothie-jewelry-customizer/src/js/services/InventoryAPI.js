/**
 * @fileoverview Inventory API client for Supabase backend
 * Handles all inventory, product, design, and order operations
 */

import { CATEGORIES, STATUS, ORDER_STATUS, DEFAULT_PAGINATION, ValidationHelpers } from '../types/inventory.js';

/**
 * Main API client for inventory management system
 */
export class InventoryAPI {
  /**
   * Initialize the API client
   * @param {string} supabaseUrl - Supabase project URL
   * @param {string} supabaseKey - Supabase public key
   */
  constructor(supabaseUrl, supabaseKey) {
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL and key are required');
    }
    
    // Initialize Supabase client (assuming supabase-js is loaded)
    this.client = supabase.createClient(supabaseUrl, supabaseKey);
    this.isAuthenticated = false;
    this.currentUser = null;
    
    // Set up auth state listener
    this.client.auth.onAuthStateChange((event, session) => {
      this.isAuthenticated = !!session;
      this.currentUser = session?.user || null;
    });
  }

  // ===========================================
  // Authentication Methods
  // ===========================================

  /**
   * Sign up a new user
   * @param {string} email - User email
   * @param {string} password - User password
   * @param {Object} profile - Additional profile data
   * @returns {Promise<Object>} Auth response
   */
  async signUp(email, password, profile = {}) {
    const { data, error } = await this.client.auth.signUp({
      email,
      password,
      options: {
        data: profile
      }
    });

    if (error) throw error;
    return data;
  }

  /**
   * Sign in user
   * @param {string} email - User email
   * @param {string} password - User password
   * @returns {Promise<Object>} Auth response
   */
  async signIn(email, password) {
    const { data, error } = await this.client.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    return data;
  }

  /**
   * Sign out current user
   * @returns {Promise<void>}
   */
  async signOut() {
    const { error } = await this.client.auth.signOut();
    if (error) throw error;
  }

  /**
   * Get current user session
   * @returns {Promise<Object|null>} User session
   */
  async getCurrentSession() {
    const { data: { session } } = await this.client.auth.getSession();
    return session;
  }

  // ===========================================
  // Inventory Methods
  // ===========================================

  /**
   * Get inventory items with filtering and pagination
   * @param {Object} filters - Filter options
   * @param {Object} pagination - Pagination options
   * @returns {Promise<Object>} Inventory response
   */
  async getInventory(filters = {}, pagination = {}) {
    try {
      const {
        category,
        status = STATUS.ACTIVE,
        tags,
        price_min,
        price_max,
        available_only = true,
        search
      } = filters;

      const {
        limit = DEFAULT_PAGINATION.LIMIT,
        offset = DEFAULT_PAGINATION.OFFSET,
        order = DEFAULT_PAGINATION.ORDER
      } = pagination;

      let query = this.client
        .from('inventory')
        .select('*', { count: 'exact' });

      // Apply filters
      if (status) {
        query = query.eq('status', status);
      }

      if (category) {
        query = query.eq('category', category);
      }

      if (available_only) {
        query = query.gt('quantity_available', 0);
      }

      if (tags && tags.length > 0) {
        query = query.contains('tags', tags);
      }

      if (price_min !== undefined) {
        query = query.gte('price', price_min);
      }

      if (price_max !== undefined) {
        query = query.lte('price', price_max);
      }

      if (search) {
        query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
      }

      // Apply pagination and ordering
      query = query
        .order(order.split('.')[0], { 
          ascending: order.includes('asc') 
        })
        .range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        data: data || [],
        count: count || 0,
        page: Math.floor(offset / limit) + 1,
        total_pages: Math.ceil((count || 0) / limit)
      };
    } catch (error) {
      console.error('Error fetching inventory:', error);
      throw error;
    }
  }

  /**
   * Get single inventory item by ID
   * @param {string} id - Item ID
   * @returns {Promise<Object>} Inventory item
   */
  async getInventoryItem(id) {
    try {
      const { data, error } = await this.client
        .from('inventory')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching inventory item:', error);
      throw error;
    }
  }

  /**
   * Create new inventory item
   * @param {Object} item - Inventory item data
   * @returns {Promise<Object>} Created item
   */
  async createInventoryItem(item) {
    try {
      if (!ValidationHelpers.validateInventoryItem(item)) {
        throw new Error('Invalid inventory item data');
      }

      const { data, error } = await this.client
        .from('inventory')
        .insert(item)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating inventory item:', error);
      throw error;
    }
  }

  /**
   * Update inventory item
   * @param {string} id - Item ID
   * @param {Object} updates - Update data
   * @returns {Promise<Object>} Updated item
   */
  async updateInventoryItem(id, updates) {
    try {
      const { data, error } = await this.client
        .from('inventory')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating inventory item:', error);
      throw error;
    }
  }

  /**
   * Delete inventory item
   * @param {string} id - Item ID
   * @returns {Promise<void>}
   */
  async deleteInventoryItem(id) {
    try {
      const { error } = await this.client
        .from('inventory')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting inventory item:', error);
      throw error;
    }
  }

  /**
   * Search inventory items
   * @param {string} query - Search query
   * @param {Object} filters - Additional filters
   * @returns {Promise<Array>} Search results
   */
  async searchInventory(query, filters = {}) {
    try {
      const searchFilters = {
        ...filters,
        search: query
      };

      const response = await this.getInventory(searchFilters);
      return response.data;
    } catch (error) {
      console.error('Error searching inventory:', error);
      throw error;
    }
  }

  // ===========================================
  // Product Methods
  // ===========================================

  /**
   * Get product catalog
   * @param {Object} filters - Filter options
   * @returns {Promise<Array>} Products
   */
  async getProducts(filters = {}) {
    try {
      const { category, featured, active = true } = filters;

      let query = this.client
        .from('products')
        .select('*, inventory(*)');

      if (active !== undefined) {
        query = query.eq('active', active);
      }

      if (category) {
        query = query.eq('category', category);
      }

      if (featured !== undefined) {
        query = query.eq('featured', featured);
      }

      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching products:', error);
      throw error;
    }
  }

  /**
   * Get single product by ID
   * @param {string} id - Product ID
   * @returns {Promise<Object>} Product
   */
  async getProduct(id) {
    try {
      const { data, error } = await this.client
        .from('products')
        .select('*, inventory(*)')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching product:', error);
      throw error;
    }
  }

  // ===========================================
  // Design Methods
  // ===========================================

  /**
   * Get user designs
   * @param {string} userId - User ID (optional, defaults to current user)
   * @returns {Promise<Array>} User designs
   */
  async getUserDesigns(userId = null) {
    try {
      const targetUserId = userId || this.currentUser?.id;
      if (!targetUserId) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await this.client
        .from('designs')
        .select('*')
        .eq('user_id', targetUserId)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user designs:', error);
      throw error;
    }
  }

  /**
   * Save design
   * @param {Object} design - Design data
   * @returns {Promise<Object>} Saved design
   */
  async saveDesign(design) {
    try {
      if (!this.currentUser) {
        throw new Error('User not authenticated');
      }

      if (!ValidationHelpers.validateDesign(design)) {
        throw new Error('Invalid design data');
      }

      const designData = {
        ...design,
        user_id: this.currentUser.id
      };

      const { data, error } = await this.client
        .from('designs')
        .insert(designData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error saving design:', error);
      throw error;
    }
  }

  /**
   * Update design
   * @param {string} id - Design ID
   * @param {Object} updates - Update data
   * @returns {Promise<Object>} Updated design
   */
  async updateDesign(id, updates) {
    try {
      const { data, error } = await this.client
        .from('designs')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating design:', error);
      throw error;
    }
  }

  /**
   * Delete design
   * @param {string} id - Design ID
   * @returns {Promise<void>}
   */
  async deleteDesign(id) {
    try {
      const { error } = await this.client
        .from('designs')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Error deleting design:', error);
      throw error;
    }
  }

  // ===========================================
  // Cart Methods
  // ===========================================

  /**
   * Save user cart to database
   * @param {Object} cartState - Cart state data
   * @param {string} userId - User ID (optional, defaults to current user)
   * @returns {Promise<Object>} Saved cart data
   */
  async saveUserCart(cartState, userId = null) {
    try {
      if (!this.isAuthenticated && !userId) {
        throw new Error('User not authenticated');
      }

      const targetUserId = userId || this.currentUser?.id;
      if (!targetUserId) {
        throw new Error('No user ID provided');
      }

      const cartData = {
        user_id: targetUserId,
        cart_data: cartState,
        item_count: cartState.items.length,
        total_value: cartState.total,
        last_updated: new Date().toISOString()
      };

      // Check if cart already exists
      const { data: existingCart } = await this.client
        .from('user_carts')
        .select('id')
        .eq('user_id', targetUserId)
        .single();

      let result;
      if (existingCart) {
        // Update existing cart
        result = await this.client
          .from('user_carts')
          .update(cartData)
          .eq('user_id', targetUserId)
          .select()
          .single();
      } else {
        // Create new cart
        result = await this.client
          .from('user_carts')
          .insert(cartData)
          .select()
          .single();
      }

      if (result.error) throw result.error;
      return result.data;
    } catch (error) {
      console.error('Error saving user cart:', error);
      throw error;
    }
  }

  /**
   * Load user cart from database
   * @param {string} userId - User ID (optional, defaults to current user)
   * @returns {Promise<Object|null>} User cart data
   */
  async getUserCart(userId = null) {
    try {
      if (!this.isAuthenticated && !userId) {
        return null;
      }

      const targetUserId = userId || this.currentUser?.id;
      if (!targetUserId) {
        return null;
      }

      const { data, error } = await this.client
        .from('user_carts')
        .select('*')
        .eq('user_id', targetUserId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No cart found
          return null;
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error loading user cart:', error);
      return null;
    }
  }

  /**
   * Delete user cart
   * @param {string} userId - User ID (optional, defaults to current user)
   * @returns {Promise<boolean>} Success status
   */
  async deleteUserCart(userId = null) {
    try {
      if (!this.isAuthenticated && !userId) {
        throw new Error('User not authenticated');
      }

      const targetUserId = userId || this.currentUser?.id;
      if (!targetUserId) {
        throw new Error('No user ID provided');
      }

      const { error } = await this.client
        .from('user_carts')
        .delete()
        .eq('user_id', targetUserId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting user cart:', error);
      throw error;
    }
  }

  /**
   * Save guest cart with session identifier
   * @param {Object} cartState - Cart state
   * @param {string} sessionId - Session identifier
   * @returns {Promise<Object>} Saved guest cart
   */
  async saveGuestCart(cartState, sessionId) {
    try {
      if (!sessionId) {
        throw new Error('Session ID required for guest cart');
      }

      const guestCartData = {
        session_id: sessionId,
        cart_data: cartState,
        item_count: cartState.items.length,
        total_value: cartState.total,
        expires_at: new Date(Date.now() + (7 * 24 * 60 * 60 * 1000)).toISOString(), // 7 days
        created_at: new Date().toISOString(),
        last_updated: new Date().toISOString()
      };

      // Check if guest cart already exists
      const { data: existingCart } = await this.client
        .from('guest_carts')
        .select('id')
        .eq('session_id', sessionId)
        .single();

      let result;
      if (existingCart) {
        // Update existing guest cart
        result = await this.client
          .from('guest_carts')
          .update(guestCartData)
          .eq('session_id', sessionId)
          .select()
          .single();
      } else {
        // Create new guest cart
        result = await this.client
          .from('guest_carts')
          .insert(guestCartData)
          .select()
          .single();
      }

      if (result.error) throw result.error;
      return result.data;
    } catch (error) {
      console.error('Error saving guest cart:', error);
      throw error;
    }
  }

  /**
   * Load guest cart
   * @param {string} sessionId - Session identifier
   * @returns {Promise<Object|null>} Guest cart data
   */
  async getGuestCart(sessionId) {
    try {
      if (!sessionId) {
        return null;
      }

      const { data, error } = await this.client
        .from('guest_carts')
        .select('*')
        .eq('session_id', sessionId)
        .gt('expires_at', new Date().toISOString()) // Only non-expired carts
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No cart found
          return null;
        }
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error loading guest cart:', error);
      return null;
    }
  }

  /**
   * Transfer guest cart to user cart
   * @param {string} sessionId - Guest session ID
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Transferred cart
   */
  async transferGuestCartToUser(sessionId, userId) {
    try {
      // Get guest cart
      const guestCart = await this.getGuestCart(sessionId);
      if (!guestCart) {
        throw new Error('Guest cart not found');
      }

      // Get existing user cart if any
      const userCart = await this.getUserCart(userId);
      
      if (userCart) {
        // Merge guest cart with user cart
        const mergedCartData = await this.mergeCartData(guestCart.cart_data, userCart.cart_data);
        await this.saveUserCart(mergedCartData, userId);
      } else {
        // Save guest cart as user cart
        await this.saveUserCart(guestCart.cart_data, userId);
      }

      // Clean up guest cart
      await this.deleteGuestCart(sessionId);

      return await this.getUserCart(userId);
    } catch (error) {
      console.error('Error transferring guest cart to user:', error);
      throw error;
    }
  }

  /**
   * Delete guest cart
   * @param {string} sessionId - Session identifier
   * @returns {Promise<boolean>} Success status
   */
  async deleteGuestCart(sessionId) {
    try {
      const { error } = await this.client
        .from('guest_carts')
        .delete()
        .eq('session_id', sessionId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting guest cart:', error);
      throw error;
    }
  }

  /**
   * Merge two cart data objects
   * @param {Object} guestCartData - Guest cart data
   * @param {Object} userCartData - User cart data
   * @returns {Promise<Object>} Merged cart data
   */
  async mergeCartData(guestCartData, userCartData) {
    try {
      const mergedItems = [...userCartData.items];
      
      // Add guest cart items, merging quantities for duplicate items
      for (const guestItem of guestCartData.items) {
        const existingItemIndex = mergedItems.findIndex(userItem => 
          this.areCartItemsEquivalent(userItem, guestItem)
        );

        if (existingItemIndex !== -1) {
          // Merge quantities
          mergedItems[existingItemIndex].quantity += guestItem.quantity;
        } else {
          // Add new item
          mergedItems.push(guestItem);
        }
      }

      // Recalculate totals (simplified)
      const subtotal = mergedItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const tax = subtotal * 0.08; // 8% tax
      const shipping = subtotal >= 75 ? 0 : 12.99; // Free shipping over $75
      const total = subtotal + tax + shipping;

      return {
        items: mergedItems,
        subtotal: Math.round(subtotal * 100) / 100,
        tax: Math.round(tax * 100) / 100,
        shipping: Math.round(shipping * 100) / 100,
        total: Math.round(total * 100) / 100,
        currency: userCartData.currency || 'USD',
        version: '1.0'
      };
    } catch (error) {
      console.error('Error merging cart data:', error);
      throw error;
    }
  }

  /**
   * Check if two cart items are equivalent (for merging)
   * @param {Object} item1 - First cart item
   * @param {Object} item2 - Second cart item
   * @returns {boolean} Are items equivalent
   */
  areCartItemsEquivalent(item1, item2) {
    // Basic comparison - can be extended for more complex scenarios
    if (item1.id !== item2.id) return false;
    
    // Custom designs are never equivalent
    if (item1.is_custom_design || item2.is_custom_design) return false;
    
    // Can add more comparison logic here (options, customizations, etc.)
    return true;
  }

  /**
   * Validate cart items against current inventory
   * @param {Array} cartItems - Cart items to validate
   * @returns {Promise<Object>} Validation result
   */
  async validateCartItems(cartItems) {
    try {
      const validation = {
        isValid: true,
        invalidItems: [],
        quantityIssues: [],
        priceChanges: []
      };

      for (const cartItem of cartItems) {
        if (cartItem.is_custom_design) {
          // Validate custom design components
          const componentValidation = await this.validateCustomDesignComponents(cartItem.design_data?.components || []);
          if (!componentValidation.isValid) {
            validation.isValid = false;
            validation.invalidItems.push({
              cartItem,
              reason: 'Custom design components unavailable',
              details: componentValidation.unavailableComponents
            });
          }
        } else {
          // Validate regular inventory item
          try {
            const currentItem = await this.getInventoryItem(cartItem.id);
            
            if (!currentItem || currentItem.status !== 'active') {
              validation.isValid = false;
              validation.invalidItems.push({
                cartItem,
                reason: 'Item no longer available'
              });
            } else {
              // Check quantity
              if (currentItem.quantity_available < cartItem.quantity) {
                validation.quantityIssues.push({
                  cartItem,
                  available: currentItem.quantity_available,
                  requested: cartItem.quantity
                });
              }

              // Check price changes
              if (Math.abs(currentItem.price - cartItem.price) > 0.01) {
                validation.priceChanges.push({
                  cartItem,
                  oldPrice: cartItem.price,
                  newPrice: currentItem.price
                });
              }
            }
          } catch (error) {
            validation.isValid = false;
            validation.invalidItems.push({
              cartItem,
              reason: 'Unable to validate item',
              error: error.message
            });
          }
        }
      }

      return validation;
    } catch (error) {
      console.error('Error validating cart items:', error);
      throw error;
    }
  }

  /**
   * Validate custom design components
   * @param {Array} components - Design components
   * @returns {Promise<Object>} Validation result
   */
  async validateCustomDesignComponents(components) {
    try {
      const validation = {
        isValid: true,
        unavailableComponents: []
      };

      for (const component of components) {
        try {
          const item = await this.getInventoryItem(component.inventory_id);
          
          if (!item || item.status !== 'active' || item.quantity_available < (component.quantity || 1)) {
            validation.isValid = false;
            validation.unavailableComponents.push(component);
          }
        } catch (error) {
          validation.isValid = false;
          validation.unavailableComponents.push(component);
        }
      }

      return validation;
    } catch (error) {
      console.error('Error validating custom design components:', error);
      throw error;
    }
  }

  /**
   * Clean up expired guest carts
   * @returns {Promise<number>} Number of carts cleaned up
   */
  async cleanupExpiredGuestCarts() {
    try {
      const { data, error } = await this.client
        .from('guest_carts')
        .delete()
        .lt('expires_at', new Date().toISOString())
        .select('id');

      if (error) throw error;

      const cleanedCount = data ? data.length : 0;
      console.log(`Cleaned up ${cleanedCount} expired guest carts`);
      
      return cleanedCount;
    } catch (error) {
      console.error('Error cleaning up expired guest carts:', error);
      throw error;
    }
  }

  /**
   * Get abandoned carts for recovery
   * @param {number} daysAgo - Days to look back
   * @returns {Promise<Array>} Abandoned carts
   */
  async getAbandonedCarts(daysAgo = 3) {
    try {
      const cutoffDate = new Date(Date.now() - (daysAgo * 24 * 60 * 60 * 1000)).toISOString();

      const { data, error } = await this.client
        .from('user_carts')
        .select(`
          *,
          profiles!inner(email, first_name, last_name)
        `)
        .lt('last_updated', cutoffDate)
        .gt('item_count', 0);

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error getting abandoned carts:', error);
      throw error;
    }
  }

  /**
   * Subscribe to cart changes for real-time updates
   * @param {string} userId - User ID to subscribe to
   * @param {Function} callback - Callback for changes
   * @returns {Object} Subscription object
   */
  subscribeToCartChanges(userId, callback) {
    if (!userId) {
      throw new Error('User ID required for cart subscription');
    }

    return this.client
      .channel('user-cart-changes')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'user_carts',
          filter: `user_id=eq.${userId}`
        },
        callback
      )
      .subscribe();
  }

  // ===========================================
  // Order Methods
  // ===========================================

  /**
   * Create order from cart
   * @param {Object} cartData - Cart data
   * @param {Object} orderDetails - Additional order details
   * @returns {Promise<Object>} Created order
   */
  async createOrderFromCart(cartData, orderDetails = {}) {
    try {
      if (!this.currentUser) {
        throw new Error('User not authenticated');
      }

      // Generate order number
      const orderNumber = `ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      const orderData = {
        user_id: this.currentUser.id,
        order_number: orderNumber,
        status: 'pending',
        subtotal: cartData.subtotal,
        tax_amount: cartData.tax,
        shipping_amount: cartData.shipping,
        total_amount: cartData.total,
        currency: cartData.currency || 'USD',
        ...orderDetails
      };

      // Create order
      const { data: order, error: orderError } = await this.client
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cartData.items.map(item => ({
        order_id: order.id,
        inventory_id: item.is_custom_design ? null : item.id,
        custom_design_data: item.is_custom_design ? item.design_data : null,
        quantity: item.quantity,
        unit_price: item.price,
        total_price: item.price * item.quantity,
        item_title: item.title,
        item_description: item.description,
        item_image_url: item.image_url
      }));

      const { error: itemsError } = await this.client
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Update inventory quantities
      await this.updateInventoryForOrder(cartData.items);

      // Clear user cart after successful order
      await this.deleteUserCart();

      console.log(`Order ${orderNumber} created successfully`);
      return order;
    } catch (error) {
      console.error('Error creating order from cart:', error);
      throw error;
    }
  }

  /**
   * Update inventory quantities after order
   * @param {Array} cartItems - Cart items
   * @returns {Promise<void>}
   */
  async updateInventoryForOrder(cartItems) {
    try {
      const updates = cartItems
        .filter(item => !item.is_custom_design) // Only update regular inventory items
        .map(async item => {
          const current = await this.getInventoryItem(item.id);
          if (current && current.quantity_available >= item.quantity) {
            return this.updateInventoryItem(item.id, {
              quantity_available: current.quantity_available - item.quantity,
              quantity_sold: current.quantity_sold + item.quantity
            });
          }
        });

      await Promise.all(updates);
    } catch (error) {
      console.error('Error updating inventory for order:', error);
      throw error;
    }
  }

  /**
   * Create order
   * @param {Object} order - Order data
   * @returns {Promise<Object>} Created order
   */
  async createOrder(order) {
    try {
      if (!this.currentUser) {
        throw new Error('User not authenticated');
      }

      // Generate order number
      const orderNumber = `ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

      const orderData = {
        ...order,
        user_id: this.currentUser.id,
        order_number: orderNumber
      };

      const { data, error } = await this.client
        .from('orders')
        .insert(orderData)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  }

  /**
   * Get user orders
   * @param {string} userId - User ID (optional, defaults to current user)
   * @returns {Promise<Array>} User orders
   */
  async getUserOrders(userId = null) {
    try {
      const targetUserId = userId || this.currentUser?.id;
      if (!targetUserId) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await this.client
        .from('orders')
        .select('*, order_items(*, inventory(*))')
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching user orders:', error);
      throw error;
    }
  }

  // ===========================================
  // Real-time Subscriptions
  // ===========================================

  /**
   * Subscribe to inventory changes
   * @param {Function} callback - Callback for changes
   * @returns {Object} Subscription object
   */
  subscribeToInventoryChanges(callback) {
    return this.client
      .channel('inventory-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'inventory' },
        callback
      )
      .subscribe();
  }

  /**
   * Subscribe to design changes for current user
   * @param {Function} callback - Callback for changes
   * @returns {Object} Subscription object
   */
  subscribeToUserDesigns(callback) {
    if (!this.currentUser) {
      throw new Error('User not authenticated');
    }

    return this.client
      .channel('user-designs')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'designs',
          filter: `user_id=eq.${this.currentUser.id}`
        },
        callback
      )
      .subscribe();
  }

  // ===========================================
  // Utility Methods
  // ===========================================

  /**
   * Upload image to Supabase storage
   * @param {File} file - Image file
   * @param {string} bucket - Storage bucket name
   * @param {string} path - File path
   * @returns {Promise<string>} Public URL
   */
  async uploadImage(file, bucket = 'designs', path = null) {
    try {
      const fileName = path || `${Date.now()}-${file.name}`;
      const filePath = this.currentUser ? 
        `${this.currentUser.id}/${fileName}` : 
        `public/${fileName}`;

      const { data, error } = await this.client.storage
        .from(bucket)
        .upload(filePath, file);

      if (error) throw error;

      const { data: { publicUrl } } = this.client.storage
        .from(bucket)
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  }

  /**
   * Get categories with item counts
   * @returns {Promise<Array>} Categories with counts
   */
  async getCategoriesWithCounts() {
    try {
      const { data, error } = await this.client
        .rpc('get_categories_with_counts');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  }

  /**
   * Get inventory statistics
   * @returns {Promise<Object>} Inventory stats
   */
  async getInventoryStats() {
    try {
      const { data, error } = await this.client
        .rpc('get_inventory_stats');

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching inventory stats:', error);
      throw error;
    }
  }
}

// Create singleton instance (will be initialized in main.js)
let apiInstance = null;

/**
 * Initialize the API client
 * @param {string} supabaseUrl - Supabase URL
 * @param {string} supabaseKey - Supabase key
 * @returns {InventoryAPI} API instance
 */
export function initializeAPI(supabaseUrl, supabaseKey) {
  apiInstance = new InventoryAPI(supabaseUrl, supabaseKey);
  return apiInstance;
}

/**
 * Get the current API instance
 * @returns {InventoryAPI} API instance
 */
export function getAPI() {
  if (!apiInstance) {
    throw new Error('API not initialized. Call initializeAPI() first.');
  }
  return apiInstance;
}

export default InventoryAPI;