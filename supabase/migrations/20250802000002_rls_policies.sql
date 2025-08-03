-- Row Level Security (RLS) Policies for Timothie & Co Jewelry Customizer
-- Created: 2025-08-02
-- Description: Comprehensive RLS policies for all tables with proper access control

-- =============================================================================
-- ENABLE RLS ON ALL TABLES
-- =============================================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE designs ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- PROFILES TABLE POLICIES
-- =============================================================================
-- Users can read their own profile
CREATE POLICY "Users can read own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

-- Users can insert their own profile (for profile creation)
CREATE POLICY "Users can insert own profile" ON profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- Admins can read all profiles
CREATE POLICY "Admins can read all profiles" ON profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- Admins can update all profiles
CREATE POLICY "Admins can update all profiles" ON profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- =============================================================================
-- INVENTORY TABLE POLICIES
-- =============================================================================
-- Everyone can read active inventory items (for browsing)
CREATE POLICY "Everyone can read active inventory" ON inventory
    FOR SELECT USING (is_active = true);

-- Authenticated users can read all inventory (including inactive)
CREATE POLICY "Authenticated users can read all inventory" ON inventory
    FOR SELECT USING (auth.role() = 'authenticated');

-- Admins can insert inventory
CREATE POLICY "Admins can insert inventory" ON inventory
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- Admins can update inventory
CREATE POLICY "Admins can update inventory" ON inventory
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- Admins can delete inventory
CREATE POLICY "Admins can delete inventory" ON inventory
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- =============================================================================
-- PRODUCTS TABLE POLICIES
-- =============================================================================
-- Everyone can read active products
CREATE POLICY "Everyone can read active products" ON products
    FOR SELECT USING (is_active = true);

-- Authenticated users can read all products
CREATE POLICY "Authenticated users can read all products" ON products
    FOR SELECT USING (auth.role() = 'authenticated');

-- Admins can insert products
CREATE POLICY "Admins can insert products" ON products
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- Admins can update products
CREATE POLICY "Admins can update products" ON products
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- Admins can delete products
CREATE POLICY "Admins can delete products" ON products
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- =============================================================================
-- DESIGNS TABLE POLICIES
-- =============================================================================
-- Users can read their own designs
CREATE POLICY "Users can read own designs" ON designs
    FOR SELECT USING (user_id = auth.uid());

-- Users can read public designs
CREATE POLICY "Users can read public designs" ON designs
    FOR SELECT USING (is_public = true);

-- Users can insert their own designs
CREATE POLICY "Users can insert own designs" ON designs
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their own designs
CREATE POLICY "Users can update own designs" ON designs
    FOR UPDATE USING (user_id = auth.uid());

-- Users can delete their own designs
CREATE POLICY "Users can delete own designs" ON designs
    FOR DELETE USING (user_id = auth.uid());

-- Admins can read all designs
CREATE POLICY "Admins can read all designs" ON designs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- Admins can update all designs
CREATE POLICY "Admins can update all designs" ON designs
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- Admins can delete all designs
CREATE POLICY "Admins can delete all designs" ON designs
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- =============================================================================
-- ORDERS TABLE POLICIES
-- =============================================================================
-- Users can read their own orders
CREATE POLICY "Users can read own orders" ON orders
    FOR SELECT USING (user_id = auth.uid());

-- Users can insert their own orders
CREATE POLICY "Users can insert own orders" ON orders
    FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their own pending orders (limited updates)
CREATE POLICY "Users can update own pending orders" ON orders
    FOR UPDATE USING (
        user_id = auth.uid() AND 
        status = 'pending'
    );

-- Admins can read all orders
CREATE POLICY "Admins can read all orders" ON orders
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- Admins can update all orders
CREATE POLICY "Admins can update all orders" ON orders
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- Admins can insert orders (for manual order creation)
CREATE POLICY "Admins can insert all orders" ON orders
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- Allow anonymous order creation (for guest checkout)
-- This policy allows inserting orders without authentication
-- but with strict validation through application logic
CREATE POLICY "Allow guest order creation" ON orders
    FOR INSERT WITH CHECK (
        user_id IS NULL AND 
        customer_email IS NOT NULL AND 
        customer_name IS NOT NULL
    );

-- =============================================================================
-- ORDER_ITEMS TABLE POLICIES
-- =============================================================================
-- Users can read order items for their own orders
CREATE POLICY "Users can read own order items" ON order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.id = order_items.order_id 
            AND orders.user_id = auth.uid()
        )
    );

-- Users can insert order items for their own orders
CREATE POLICY "Users can insert own order items" ON order_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.id = order_items.order_id 
            AND orders.user_id = auth.uid()
        )
    );

-- Users can update order items for their own pending orders
CREATE POLICY "Users can update own pending order items" ON order_items
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.id = order_items.order_id 
            AND orders.user_id = auth.uid()
            AND orders.status = 'pending'
        )
    );

-- Admins can read all order items
CREATE POLICY "Admins can read all order items" ON order_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- Admins can update all order items
CREATE POLICY "Admins can update all order items" ON order_items
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- Admins can insert order items
CREATE POLICY "Admins can insert all order items" ON order_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- Allow anonymous order item creation (for guest checkout)
CREATE POLICY "Allow guest order item creation" ON order_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM orders 
            WHERE orders.id = order_items.order_id 
            AND orders.user_id IS NULL
        )
    );

-- =============================================================================
-- STORAGE POLICIES
-- =============================================================================

-- Design images storage policies
CREATE POLICY "Authenticated users can upload design images" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'design-images' AND 
        auth.role() = 'authenticated'
    );

CREATE POLICY "Users can read design images" ON storage.objects
    FOR SELECT USING (bucket_id = 'design-images');

CREATE POLICY "Users can update own design images" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'design-images' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete own design images" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'design-images' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- Product images storage policies
CREATE POLICY "Admins can upload product images" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'product-images' AND 
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND is_admin = true
        )
    );

CREATE POLICY "Everyone can read product images" ON storage.objects
    FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "Admins can update product images" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'product-images' AND 
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND is_admin = true
        )
    );

CREATE POLICY "Admins can delete product images" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'product-images' AND 
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- Inventory images storage policies
CREATE POLICY "Admins can upload inventory images" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'inventory-images' AND 
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND is_admin = true
        )
    );

CREATE POLICY "Everyone can read inventory images" ON storage.objects
    FOR SELECT USING (bucket_id = 'inventory-images');

CREATE POLICY "Admins can update inventory images" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'inventory-images' AND 
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND is_admin = true
        )
    );

CREATE POLICY "Admins can delete inventory images" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'inventory-images' AND 
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- =============================================================================
-- SECURITY FUNCTIONS
-- =============================================================================

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin(user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = user_id AND is_admin = true
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user owns a design
CREATE OR REPLACE FUNCTION owns_design(design_id UUID, user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM designs 
        WHERE id = design_id AND designs.user_id = user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user owns an order
CREATE OR REPLACE FUNCTION owns_order(order_id UUID, user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM orders 
        WHERE id = order_id AND orders.user_id = user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- REALTIME SUBSCRIPTIONS
-- =============================================================================

-- Enable realtime for inventory updates
ALTER PUBLICATION supabase_realtime ADD TABLE inventory;

-- Enable realtime for order status updates
ALTER PUBLICATION supabase_realtime ADD TABLE orders;

-- Enable realtime for order items
ALTER PUBLICATION supabase_realtime ADD TABLE order_items;

-- Enable realtime for designs (for collaboration features)
ALTER PUBLICATION supabase_realtime ADD TABLE designs;

-- =============================================================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON POLICY "Everyone can read active inventory" ON inventory IS 
'Allows public browsing of active inventory items without authentication';

COMMENT ON POLICY "Users can read public designs" ON designs IS 
'Allows users to browse and get inspiration from public community designs';

COMMENT ON POLICY "Allow guest order creation" ON orders IS 
'Enables guest checkout functionality for non-registered users';

COMMENT ON FUNCTION is_admin(UUID) IS 
'Security definer function to check admin status, used in RLS policies';

-- This completes the RLS policies setup