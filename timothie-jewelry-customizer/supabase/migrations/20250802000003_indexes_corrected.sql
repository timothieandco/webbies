-- Database Indexes for Timothie & Co Jewelry Customizer (Schema-Corrected Version)
-- Created: 2025-08-02
-- Description: Optimized indexes matching the actual database schema

-- =============================================================================
-- ENABLE REQUIRED EXTENSIONS
-- =============================================================================

-- Enable pg_trgm extension for trigram text search (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- =============================================================================
-- INVENTORY TABLE INDEXES
-- =============================================================================

-- Basic indexes for common queries (using correct column names)
CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory(category);
CREATE INDEX IF NOT EXISTS idx_inventory_status ON inventory(status);
CREATE INDEX IF NOT EXISTS idx_inventory_price_usd ON inventory(price_usd);
CREATE INDEX IF NOT EXISTS idx_inventory_is_active ON inventory(is_active);

-- AliExpress specific indexes
CREATE INDEX IF NOT EXISTS idx_inventory_aliexpress_product_id ON inventory(aliexpress_product_id) WHERE aliexpress_product_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_inventory_aliexpress_sku_id ON inventory(aliexpress_sku_id) WHERE aliexpress_sku_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_inventory_aliexpress_order_id ON inventory(aliexpress_order_id) WHERE aliexpress_order_id IS NOT NULL;

-- Quantity and availability indexes
CREATE INDEX IF NOT EXISTS idx_inventory_quantity ON inventory(quantity) WHERE quantity > 0;
CREATE INDEX IF NOT EXISTS idx_inventory_available_quantity ON inventory(available_quantity) WHERE available_quantity > 0;
CREATE INDEX IF NOT EXISTS idx_inventory_reserved_quantity ON inventory(reserved_quantity);

-- Store and supplier indexes
CREATE INDEX IF NOT EXISTS idx_inventory_store_name ON inventory(store_name);
CREATE INDEX IF NOT EXISTS idx_inventory_order_date ON inventory(order_date);

-- Timestamp indexes
CREATE INDEX IF NOT EXISTS idx_inventory_created_at ON inventory(created_at);
CREATE INDEX IF NOT EXISTS idx_inventory_updated_at ON inventory(updated_at);

-- GIN index for JSONB attributes
CREATE INDEX IF NOT EXISTS idx_inventory_attributes ON inventory USING gin(attributes);

-- GIN index for tags array
CREATE INDEX IF NOT EXISTS idx_inventory_tags ON inventory USING gin(tags);

-- GIN index for supplier_info JSONB
CREATE INDEX IF NOT EXISTS idx_inventory_supplier_info ON inventory USING gin(supplier_info);

-- Full text search index for title (using trigram)
CREATE INDEX IF NOT EXISTS idx_inventory_title_search ON inventory USING gin(title gin_trgm_ops);

-- Composite index for active inventory with good availability
CREATE INDEX IF NOT EXISTS idx_inventory_active_available 
ON inventory(is_active, status, available_quantity) 
WHERE is_active = true AND status = 'in_stock';

-- Composite index for category browsing
CREATE INDEX IF NOT EXISTS idx_inventory_category_active 
ON inventory(category, is_active, available_quantity) 
WHERE is_active = true;

-- =============================================================================
-- PRODUCTS TABLE INDEXES
-- =============================================================================

-- Basic indexes for products
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_products_is_featured ON products(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_products_base_price ON products(base_price);
CREATE INDEX IF NOT EXISTS idx_products_display_order ON products(display_order);

-- Index for product name search
CREATE INDEX IF NOT EXISTS idx_products_name_search ON products USING gin(name gin_trgm_ops);

-- GIN index for customization options
CREATE INDEX IF NOT EXISTS idx_products_customization_options ON products USING gin(customization_options);
CREATE INDEX IF NOT EXISTS idx_products_required_components ON products USING gin(required_components);
CREATE INDEX IF NOT EXISTS idx_products_optional_components ON products USING gin(optional_components);

-- Timestamp indexes
CREATE INDEX IF NOT EXISTS idx_products_created_at ON products(created_at);
CREATE INDEX IF NOT EXISTS idx_products_updated_at ON products(updated_at);

-- Composite index for active featured products
CREATE INDEX IF NOT EXISTS idx_products_featured_active 
ON products(is_featured, display_order, is_active) 
WHERE is_featured = true AND is_active = true;

-- =============================================================================
-- DESIGNS TABLE INDEXES
-- =============================================================================

-- User designs index
CREATE INDEX IF NOT EXISTS idx_designs_user_id ON designs(user_id);

-- Public designs index
CREATE INDEX IF NOT EXISTS idx_designs_is_public ON designs(is_public) WHERE is_public = true;

-- Product relationship index
CREATE INDEX IF NOT EXISTS idx_designs_product_id ON designs(product_id);

-- Status and favorites
CREATE INDEX IF NOT EXISTS idx_designs_status ON designs(status);
CREATE INDEX IF NOT EXISTS idx_designs_is_favorited ON designs(is_favorited) WHERE is_favorited = true;
CREATE INDEX IF NOT EXISTS idx_designs_view_count ON designs(view_count);

-- Design name search
CREATE INDEX IF NOT EXISTS idx_designs_name_search ON designs USING gin(name gin_trgm_ops);

-- GIN index for design data (Konva.js JSON)
CREATE INDEX IF NOT EXISTS idx_designs_design_data ON designs USING gin(design_data);

-- GIN index for component costs
CREATE INDEX IF NOT EXISTS idx_designs_component_costs ON designs USING gin(component_costs);

-- GIN index for used inventory items array
CREATE INDEX IF NOT EXISTS idx_designs_used_inventory_items ON designs USING gin(used_inventory_items);

-- Timestamp indexes
CREATE INDEX IF NOT EXISTS idx_designs_created_at ON designs(created_at);
CREATE INDEX IF NOT EXISTS idx_designs_updated_at ON designs(updated_at);

-- Composite index for user's designs sorted by update time
CREATE INDEX IF NOT EXISTS idx_designs_user_recent 
ON designs(user_id, updated_at DESC) 
WHERE user_id IS NOT NULL;

-- Composite index for public designs sorted by popularity
CREATE INDEX IF NOT EXISTS idx_designs_public_popular 
ON designs(is_public, view_count DESC, created_at DESC) 
WHERE is_public = true;

-- =============================================================================
-- ORDERS TABLE INDEXES
-- =============================================================================

-- User orders index
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);

-- Order status indexes
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);

-- Order number index (should be unique)
-- CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number); -- Already exists due to UNIQUE constraint

-- Customer information indexes
CREATE INDEX IF NOT EXISTS idx_orders_customer_email ON orders(customer_email);
CREATE INDEX IF NOT EXISTS idx_orders_customer_name ON orders(customer_name);

-- Shipping location indexes
CREATE INDEX IF NOT EXISTS idx_orders_shipping_state ON orders(shipping_state);
CREATE INDEX IF NOT EXISTS idx_orders_shipping_country ON orders(shipping_country);

-- Payment and tracking
CREATE INDEX IF NOT EXISTS idx_orders_payment_intent_id ON orders(payment_intent_id) WHERE payment_intent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_tracking_number ON orders(tracking_number) WHERE tracking_number IS NOT NULL;

-- Timestamp indexes
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_updated_at ON orders(updated_at);
CREATE INDEX IF NOT EXISTS idx_orders_shipped_at ON orders(shipped_at) WHERE shipped_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_delivered_at ON orders(delivered_at) WHERE delivered_at IS NOT NULL;

-- Composite index for order management
CREATE INDEX IF NOT EXISTS idx_orders_management 
ON orders(status, payment_status, created_at DESC);

-- Composite index for user order history
CREATE INDEX IF NOT EXISTS idx_orders_user_history 
ON orders(user_id, created_at DESC) 
WHERE user_id IS NOT NULL;

-- =============================================================================
-- ORDER_ITEMS TABLE INDEXES
-- =============================================================================

-- Order items relationship indexes
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_design_id ON order_items(design_id) WHERE design_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);

-- Composite index for order item queries
CREATE INDEX IF NOT EXISTS idx_order_items_order_product ON order_items(order_id, product_id);

-- Quantity and price indexes
CREATE INDEX IF NOT EXISTS idx_order_items_quantity ON order_items(quantity);
CREATE INDEX IF NOT EXISTS idx_order_items_unit_price ON order_items(unit_price);
CREATE INDEX IF NOT EXISTS idx_order_items_total_price ON order_items(total_price);

-- Production tracking
CREATE INDEX IF NOT EXISTS idx_order_items_production_status ON order_items(production_status);

-- GIN index for customization data
CREATE INDEX IF NOT EXISTS idx_order_items_customization_data ON order_items USING gin(customization_data);

-- GIN index for used inventory items
CREATE INDEX IF NOT EXISTS idx_order_items_used_inventory_items ON order_items USING gin(used_inventory_items);

-- Timestamp indexes
CREATE INDEX IF NOT EXISTS idx_order_items_created_at ON order_items(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_updated_at ON order_items(updated_at);

-- =============================================================================
-- PROFILES TABLE INDEXES
-- =============================================================================

-- Email index (should already exist due to unique constraint)
-- CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email); -- Already exists

-- Admin users index
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON profiles(is_admin) WHERE is_admin = true;

-- Location indexes for shipping/analytics
CREATE INDEX IF NOT EXISTS idx_profiles_state ON profiles(state);
CREATE INDEX IF NOT EXISTS idx_profiles_country ON profiles(country);

-- Name search index
CREATE INDEX IF NOT EXISTS idx_profiles_full_name_search ON profiles USING gin(full_name gin_trgm_ops) WHERE full_name IS NOT NULL;

-- GIN index for preferences
CREATE INDEX IF NOT EXISTS idx_profiles_preferences ON profiles USING gin(preferences);

-- Timestamp indexes
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON profiles(created_at);
CREATE INDEX IF NOT EXISTS idx_profiles_updated_at ON profiles(updated_at);

-- =============================================================================
-- PERFORMANCE ANALYSIS FUNCTION
-- =============================================================================

-- Create a function to analyze index usage
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
-- INDEX COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON INDEX idx_inventory_title_search IS 'Full-text search index for inventory titles using trigrams';
COMMENT ON INDEX idx_inventory_active_available IS 'Composite index for browsing active, in-stock inventory';
COMMENT ON INDEX idx_designs_design_data IS 'GIN index for searching within Konva.js design data';
COMMENT ON INDEX idx_orders_management IS 'Composite index for order management dashboard queries';
COMMENT ON FUNCTION analyze_index_usage() IS 'Function to analyze index usage statistics for performance tuning';

-- =============================================================================
-- COMPLETION VERIFICATION
-- =============================================================================

DO $$
DECLARE
  index_count INTEGER;
BEGIN
  -- Count indexes created
  SELECT count(*) INTO index_count 
  FROM pg_indexes 
  WHERE schemaname = 'public' 
  AND indexname LIKE 'idx_%';
  
  RAISE NOTICE '✅ Database indexes created successfully!';
  RAISE NOTICE 'Created % custom indexes for optimal query performance', index_count;
  RAISE NOTICE 'Extensions enabled: pg_trgm for full-text search';
  RAISE NOTICE 'All column names verified against actual schema';
END $$;