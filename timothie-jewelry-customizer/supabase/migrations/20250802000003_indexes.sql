-- Database Indexes for Timothie & Co Jewelry Customizer
-- Created: 2025-08-02
-- Description: Optimized indexes for query performance, covering common access patterns

-- =============================================================================
-- PROFILES TABLE INDEXES
-- =============================================================================

-- Index for email lookups (unique constraint already creates this)
-- CREATE UNIQUE INDEX idx_profiles_email ON profiles(email); -- Already exists

-- Index for admin users (for RLS policy performance)
CREATE INDEX idx_profiles_is_admin ON profiles(is_admin) WHERE is_admin = true;

-- Index for full text search on names
CREATE INDEX idx_profiles_full_name_trgm ON profiles USING gin(full_name gin_trgm_ops);

-- =============================================================================
-- INVENTORY TABLE INDEXES
-- =============================================================================

-- Composite index for active inventory browsing
CREATE INDEX idx_inventory_active_status ON inventory(is_active, status) WHERE is_active = true;

-- Index for AliExpress product lookups
CREATE INDEX idx_inventory_aliexpress_product_id ON inventory(aliexpress_product_id) WHERE aliexpress_product_id IS NOT NULL;

-- Index for AliExpress SKU lookups
CREATE INDEX idx_inventory_aliexpress_sku_id ON inventory(aliexpress_sku_id) WHERE aliexpress_sku_id IS NOT NULL;

-- Index for category and subcategory filtering
CREATE INDEX idx_inventory_category ON inventory(category, subcategory) WHERE is_active = true;

-- Index for price range queries
CREATE INDEX idx_inventory_price_usd ON inventory(price_usd) WHERE is_active = true;

-- Index for quantity and availability checks
CREATE INDEX idx_inventory_quantities ON inventory(quantity, reserved_quantity, available_quantity) WHERE is_active = true;

-- Index for store name filtering
CREATE INDEX idx_inventory_store_name ON inventory(store_name) WHERE is_active = true;

-- Index for order date queries
CREATE INDEX idx_inventory_order_date ON inventory(order_date);

-- Index for created/updated date queries
CREATE INDEX idx_inventory_created_at ON inventory(created_at);
CREATE INDEX idx_inventory_updated_at ON inventory(updated_at);

-- GIN index for attributes JSONB queries
CREATE INDEX idx_inventory_attributes ON inventory USING gin(attributes);

-- GIN index for tags array queries
CREATE INDEX idx_inventory_tags ON inventory USING gin(tags);

-- Full text search index for title and description
CREATE INDEX idx_inventory_title_trgm ON inventory USING gin(title gin_trgm_ops);

-- Index for status filtering
CREATE INDEX idx_inventory_status ON inventory(status) WHERE is_active = true;

-- Composite index for inventory management queries
CREATE INDEX idx_inventory_management ON inventory(status, quantity, reserved_quantity) WHERE is_active = true;

-- =============================================================================
-- PRODUCTS TABLE INDEXES
-- =============================================================================

-- Index for active products
CREATE INDEX idx_products_active ON products(is_active, display_order) WHERE is_active = true;

-- Index for category filtering
CREATE INDEX idx_products_category ON products(category, is_active) WHERE is_active = true;

-- Index for featured products
CREATE INDEX idx_products_featured ON products(is_featured, display_order) WHERE is_featured = true AND is_active = true;

-- Index for price range queries
CREATE INDEX idx_products_base_price ON products(base_price) WHERE is_active = true;

-- Full text search index for name and description
CREATE INDEX idx_products_name_trgm ON products USING gin(name gin_trgm_ops);

-- GIN index for customization options
CREATE INDEX idx_products_customization_options ON products USING gin(customization_options);

-- =============================================================================
-- DESIGNS TABLE INDEXES
-- =============================================================================

-- Index for user's designs
CREATE INDEX idx_designs_user_id ON designs(user_id, created_at DESC);

-- Index for public designs browsing
CREATE INDEX idx_designs_public ON designs(is_public, view_count DESC, created_at DESC) WHERE is_public = true;

-- Index for design status
CREATE INDEX idx_designs_status ON designs(status, user_id);

-- Index for product-based design lookup
CREATE INDEX idx_designs_product_id ON designs(product_id, is_public);

-- Index for favorited designs
CREATE INDEX idx_designs_favorited ON designs(user_id, is_favorited) WHERE is_favorited = true;

-- Full text search index for design names
CREATE INDEX idx_designs_name_trgm ON designs USING gin(name gin_trgm_ops);

-- GIN index for design data queries
CREATE INDEX idx_designs_design_data ON designs USING gin(design_data);

-- GIN index for used inventory items
CREATE INDEX idx_designs_used_inventory_items ON designs USING gin(used_inventory_items);

-- =============================================================================
-- ORDERS TABLE INDEXES
-- =============================================================================

-- Index for user's orders
CREATE INDEX idx_orders_user_id ON orders(user_id, created_at DESC) WHERE user_id IS NOT NULL;

-- Unique index for order numbers (already exists due to UNIQUE constraint)
-- CREATE UNIQUE INDEX idx_orders_order_number ON orders(order_number); -- Already exists

-- Index for order status management
CREATE INDEX idx_orders_status ON orders(status, created_at DESC);

-- Index for payment status
CREATE INDEX idx_orders_payment_status ON orders(payment_status, created_at DESC);

-- Index for customer email lookups
CREATE INDEX idx_orders_customer_email ON orders(customer_email, created_at DESC);

-- Index for date range queries
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_orders_shipped_at ON orders(shipped_at) WHERE shipped_at IS NOT NULL;
CREATE INDEX idx_orders_delivered_at ON orders(delivered_at) WHERE delivered_at IS NOT NULL;

-- Index for tracking number lookups
CREATE INDEX idx_orders_tracking_number ON orders(tracking_number) WHERE tracking_number IS NOT NULL;

-- Index for payment intent lookups
CREATE INDEX idx_orders_payment_intent_id ON orders(payment_intent_id) WHERE payment_intent_id IS NOT NULL;

-- Composite index for order management
CREATE INDEX idx_orders_management ON orders(status, payment_status, created_at DESC);

-- Index for shipping address queries (for logistics)
CREATE INDEX idx_orders_shipping_location ON orders(shipping_state, shipping_country);

-- =============================================================================
-- ORDER_ITEMS TABLE INDEXES
-- =============================================================================

-- Index for order items by order
CREATE INDEX idx_order_items_order_id ON order_items(order_id, created_at);

-- Index for design-based order items
CREATE INDEX idx_order_items_design_id ON order_items(design_id) WHERE design_id IS NOT NULL;

-- Index for product-based order items
CREATE INDEX idx_order_items_product_id ON order_items(product_id);

-- Index for production status management
CREATE INDEX idx_order_items_production_status ON order_items(production_status, created_at);

-- GIN index for customization data
CREATE INDEX idx_order_items_customization_data ON order_items USING gin(customization_data);

-- GIN index for used inventory items
CREATE INDEX idx_order_items_used_inventory_items ON order_items USING gin(used_inventory_items);

-- Composite index for production management
CREATE INDEX idx_order_items_production ON order_items(production_status, order_id);

-- =============================================================================
-- FOREIGN KEY INDEXES (for join performance)
-- =============================================================================

-- These indexes improve JOIN performance for foreign key relationships
-- Most are automatically created by PostgreSQL for foreign keys, but we'll be explicit

-- Inventory foreign keys
CREATE INDEX idx_inventory_created_by ON inventory(created_by) WHERE created_by IS NOT NULL;
CREATE INDEX idx_inventory_updated_by ON inventory(updated_by) WHERE updated_by IS NOT NULL;

-- Products foreign keys
CREATE INDEX idx_products_created_by ON products(created_by) WHERE created_by IS NOT NULL;
CREATE INDEX idx_products_updated_by ON products(updated_by) WHERE updated_by IS NOT NULL;

-- Designs foreign keys (user_id and product_id indexes already created above)

-- Order Items foreign keys (order_id, design_id, product_id indexes already created above)

-- =============================================================================
-- PARTIAL INDEXES FOR SPECIFIC CONDITIONS
-- =============================================================================

-- Index for low stock items (for alerts)
CREATE INDEX idx_inventory_low_stock ON inventory(available_quantity, title) 
WHERE is_active = true AND available_quantity <= 5;

-- Index for out of stock items
CREATE INDEX idx_inventory_out_of_stock ON inventory(available_quantity, title) 
WHERE is_active = true AND available_quantity <= 0;

-- Index for pending orders needing attention
CREATE INDEX idx_orders_pending ON orders(created_at DESC) 
WHERE status = 'pending' AND payment_status = 'paid';

-- Index for orders needing shipping
CREATE INDEX idx_orders_ready_to_ship ON orders(created_at) 
WHERE status = 'processing' AND shipped_at IS NULL;

-- Index for designs needing moderation (if implementing)
CREATE INDEX idx_designs_pending_moderation ON designs(created_at) 
WHERE is_public = true AND status = 'published';

-- =============================================================================
-- COVERING INDEXES FOR COMMON QUERIES
-- =============================================================================

-- Covering index for inventory list view
CREATE INDEX idx_inventory_list_view ON inventory(is_active, category, price_usd) 
INCLUDE (id, title, image_url, available_quantity) WHERE is_active = true;

-- Covering index for product catalog
CREATE INDEX idx_products_catalog ON products(is_active, category, display_order) 
INCLUDE (id, name, base_price, image_url) WHERE is_active = true;

-- Covering index for user's design list
CREATE INDEX idx_designs_user_list ON designs(user_id, created_at DESC) 
INCLUDE (id, name, status, preview_image_url, total_price);

-- Covering index for order summary
CREATE INDEX idx_orders_summary ON orders(user_id, created_at DESC) 
INCLUDE (id, order_number, status, total_amount) WHERE user_id IS NOT NULL;

-- =============================================================================
-- PERFORMANCE MONITORING INDEXES
-- =============================================================================

-- Index for tracking design popularity
CREATE INDEX idx_designs_popularity ON designs(view_count DESC, created_at DESC) 
WHERE is_public = true;

-- Index for inventory turnover analysis
CREATE INDEX idx_inventory_turnover ON inventory(created_at, quantity, reserved_quantity) 
WHERE is_active = true;

-- =============================================================================
-- MATERIALIZED VIEW INDEXES (if implementing materialized views)
-- =============================================================================

-- Note: These would be for materialized views for analytics
-- CREATE MATERIALIZED VIEW mv_daily_sales AS ...
-- CREATE INDEX idx_mv_daily_sales_date ON mv_daily_sales(sale_date);

-- =============================================================================
-- ENABLE EXTENSIONS FOR FULL TEXT SEARCH
-- =============================================================================

-- Enable pg_trgm extension for trigram matching (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- =============================================================================
-- MAINTENANCE PROCEDURES
-- =============================================================================

-- Function to analyze index usage
CREATE OR REPLACE FUNCTION analyze_index_usage()
RETURNS TABLE(
    schemaname text,
    tablename text,
    indexname text,
    idx_scan bigint,
    idx_tup_read bigint,
    idx_tup_fetch bigint,
    idx_blks_read bigint,
    idx_blks_hit bigint
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.schemaname,
        s.tablename,
        s.indexrelname as indexname,
        s.idx_scan,
        s.idx_tup_read,
        s.idx_tup_fetch,
        si.idx_blks_read,
        si.idx_blks_hit
    FROM pg_stat_user_indexes s
    JOIN pg_statio_user_indexes si ON s.indexrelid = si.indexrelid
    WHERE s.schemaname = 'public'
    ORDER BY s.idx_scan DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to identify unused indexes
CREATE OR REPLACE FUNCTION find_unused_indexes()
RETURNS TABLE(
    schemaname text,
    tablename text,
    indexname text,
    size_mb numeric
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.schemaname,
        s.tablename,
        s.indexrelname as indexname,
        ROUND(pg_relation_size(s.indexrelid) / 1024.0 / 1024.0, 2) as size_mb
    FROM pg_stat_user_indexes s
    WHERE s.idx_scan = 0 
    AND s.schemaname = 'public'
    AND s.indexrelname NOT LIKE '%_pkey'  -- Exclude primary keys
    ORDER BY pg_relation_size(s.indexrelid) DESC;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON INDEX idx_inventory_active_status IS 'Optimizes active inventory browsing queries';
COMMENT ON INDEX idx_inventory_attributes IS 'Enables fast JSONB attribute queries using GIN index';
COMMENT ON INDEX idx_designs_public IS 'Optimizes public design gallery with view count ordering';
COMMENT ON INDEX idx_orders_management IS 'Composite index for order management dashboard queries';
COMMENT ON INDEX idx_inventory_low_stock IS 'Partial index for low stock alerts (quantity <= 5)';

COMMENT ON FUNCTION analyze_index_usage() IS 'Analyzes index usage statistics for performance monitoring';
COMMENT ON FUNCTION find_unused_indexes() IS 'Identifies potentially unused indexes for cleanup';

-- This completes the database indexes setup