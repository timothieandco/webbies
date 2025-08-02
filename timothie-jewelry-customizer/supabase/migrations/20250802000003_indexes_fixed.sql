-- Database Indexes for Timothie & Co Jewelry Customizer (Fixed Version)
-- Created: 2025-08-02
-- Description: Optimized indexes for query performance, with proper extension setup

-- =============================================================================
-- ENABLE REQUIRED EXTENSIONS
-- =============================================================================

-- Enable pg_trgm extension for trigram text search (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- =============================================================================
-- INVENTORY TABLE INDEXES
-- =============================================================================

-- Basic indexes for common queries
CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory(category);
CREATE INDEX IF NOT EXISTS idx_inventory_status ON inventory(status);
CREATE INDEX IF NOT EXISTS idx_inventory_price ON inventory(price);
CREATE INDEX IF NOT EXISTS idx_inventory_external_id ON inventory(external_id);

-- Index for quantity and availability
CREATE INDEX IF NOT EXISTS idx_inventory_quantity_available ON inventory(quantity_available) WHERE quantity_available > 0;

-- Index for created/updated timestamps
CREATE INDEX IF NOT EXISTS idx_inventory_created_at ON inventory(created_at);
CREATE INDEX IF NOT EXISTS idx_inventory_updated_at ON inventory(updated_at);

-- GIN index for JSONB attributes
CREATE INDEX IF NOT EXISTS idx_inventory_attributes ON inventory USING gin(attributes);

-- GIN index for tags array
CREATE INDEX IF NOT EXISTS idx_inventory_tags ON inventory USING gin(tags);

-- Full text search index for title (using trigram)
CREATE INDEX IF NOT EXISTS idx_inventory_title_search ON inventory USING gin(title gin_trgm_ops);

-- Composite index for active inventory with status
CREATE INDEX IF NOT EXISTS idx_inventory_active_status 
ON inventory(status, quantity_available) 
WHERE status = 'active' AND quantity_available > 0;

-- Index for supplier information
CREATE INDEX IF NOT EXISTS idx_inventory_supplier_store ON inventory((supplier_info->>'store_name'));
CREATE INDEX IF NOT EXISTS idx_inventory_supplier_product_id ON inventory((supplier_info->>'product_id'));

-- =============================================================================
-- PRODUCTS TABLE INDEXES
-- =============================================================================

-- Basic indexes for products
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_active ON products(active) WHERE active = true;
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_products_base_price ON products(base_price);

-- Index for product name search
CREATE INDEX IF NOT EXISTS idx_products_name_search ON products USING gin(name gin_trgm_ops);

-- GIN index for customization options
CREATE INDEX IF NOT EXISTS idx_products_customization_options ON products USING gin(customization_options);

-- Timestamp indexes
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at);
CREATE INDEX IF NOT EXISTS idx_products_updated_at ON products(updated_at);

-- =============================================================================
-- DESIGNS TABLE INDEXES
-- =============================================================================

-- User designs index
CREATE INDEX IF NOT EXISTS idx_designs_user_id ON designs(user_id);

-- Public designs index
CREATE INDEX IF NOT EXISTS idx_designs_public ON designs(is_public) WHERE is_public = true;

-- Product relationship index
CREATE INDEX IF NOT EXISTS idx_designs_product_id ON designs(product_id);

-- Design name search
CREATE INDEX IF NOT EXISTS idx_designs_name_search ON designs USING gin(name gin_trgm_ops);

-- GIN index for design data (Konva.js JSON)
CREATE INDEX IF NOT EXISTS idx_designs_design_data ON designs USING gin(design_data);

-- Timestamp indexes
CREATE INDEX IF NOT EXISTS idx_designs_created_at ON designs(created_at);
CREATE INDEX IF NOT EXISTS idx_designs_updated_at ON designs(updated_at);

-- =============================================================================
-- ORDERS TABLE INDEXES
-- =============================================================================

-- User orders index
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);

-- Order status index
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- Payment status index
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);

-- Order number index (should be unique)
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);

-- Customer info search
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders((customer_info->>'email'));

-- Timestamp indexes
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_updated_at ON orders(updated_at);

-- =============================================================================
-- ORDER_ITEMS TABLE INDEXES
-- =============================================================================

-- Order items relationship indexes
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_inventory_id ON order_items(inventory_id);

-- Composite index for order item queries
CREATE INDEX IF NOT EXISTS idx_order_items_order_inventory ON order_items(order_id, inventory_id);

-- Quantity and price indexes
CREATE INDEX IF NOT EXISTS idx_order_items_quantity ON order_items(quantity);
CREATE INDEX IF NOT EXISTS idx_order_items_unit_price ON order_items(unit_price);

-- =============================================================================
-- PROFILES TABLE INDEXES
-- =============================================================================

-- Email index (should already exist due to unique constraint)
-- CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);

-- Role index for admin operations
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);

-- Name search index
CREATE INDEX IF NOT EXISTS idx_profiles_name_search ON profiles USING gin((first_name || ' ' || last_name) gin_trgm_ops);

-- Timestamp indexes
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at);
CREATE INDEX IF NOT EXISTS idx_profiles_updated_at ON profiles(updated_at);

-- =============================================================================
-- COMPOSITE INDEXES FOR COMMON QUERIES
-- =============================================================================

-- Inventory browsing with category and status
CREATE INDEX IF NOT EXISTS idx_inventory_browse 
ON inventory(category, status, quantity_available) 
WHERE status = 'active';

-- Inventory search with category filter
CREATE INDEX IF NOT EXISTS idx_inventory_category_search 
ON inventory(category, status) 
WHERE status = 'active' AND quantity_available > 0;

-- Design browsing for users
CREATE INDEX IF NOT EXISTS idx_designs_user_browse 
ON designs(user_id, updated_at DESC) 
WHERE user_id IS NOT NULL;

-- Public design browsing
CREATE INDEX IF NOT EXISTS idx_designs_public_browse 
ON designs(is_public, created_at DESC) 
WHERE is_public = true;

-- Order management queries
CREATE INDEX IF NOT EXISTS idx_orders_management 
ON orders(status, created_at DESC);

-- User order history
CREATE INDEX IF NOT EXISTS idx_orders_user_history 
ON orders(user_id, created_at DESC) 
WHERE user_id IS NOT NULL;

-- =============================================================================
-- PERFORMANCE ANALYSIS QUERIES
-- =============================================================================

-- Create a function to analyze index usage (optional)
CREATE OR REPLACE FUNCTION analyze_index_usage()
RETURNS TABLE(
  schemaname text,
  tablename text,
  indexname text,
  idx_scan bigint,
  idx_tup_read bigint,
  idx_tup_fetch bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    schemaname::text,
    tablename::text,
    indexname::text,
    idx_scan,
    idx_tup_read,
    idx_tup_fetch
  FROM pg_stat_user_indexes
  WHERE schemaname = 'public'
  ORDER BY idx_scan DESC;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- INDEX MAINTENANCE
-- =============================================================================

-- Comment explaining index maintenance
COMMENT ON FUNCTION analyze_index_usage() IS 'Function to analyze index usage statistics for performance tuning';

-- Add comments to important indexes
COMMENT ON INDEX idx_inventory_title_search IS 'Full-text search index for inventory titles using trigrams';
COMMENT ON INDEX idx_inventory_browse IS 'Composite index for common inventory browsing queries';
COMMENT ON INDEX idx_designs_design_data IS 'GIN index for searching within Konva.js design data';

-- =============================================================================
-- COMPLETION MESSAGE
-- =============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Database indexes created successfully!';
  RAISE NOTICE 'Created % indexes for optimal query performance', 
    (SELECT count(*) FROM pg_indexes WHERE schemaname = 'public');
  RAISE NOTICE 'Extensions enabled: pg_trgm for full-text search';
END $$;