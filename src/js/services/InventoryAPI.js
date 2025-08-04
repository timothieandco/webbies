/**
 * @fileoverview Inventory API client for Supabase backend
 * Handles all inventory, product, design, and order operations
 */

import { createClient } from '@supabase/supabase-js';
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
    
    // Initialize Supabase client
    this.client = createClient(supabaseUrl, supabaseKey);
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
  // Order Methods
  // ===========================================

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