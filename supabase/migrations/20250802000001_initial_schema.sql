-- Initial database schema for Timothie & Co Jewelry Customizer
-- Created: 2025-08-02
-- Description: Core tables, RLS policies, indexes, triggers, and functions

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE order_status AS ENUM ('pending', 'processing', 'shipped', 'delivered', 'cancelled');
CREATE TYPE inventory_status AS ENUM ('in_stock', 'low_stock', 'out_of_stock', 'discontinued');
CREATE TYPE design_status AS ENUM ('draft', 'saved', 'published', 'archived');

-- =============================================================================
-- PROFILES TABLE
-- =============================================================================
-- User profiles linked to auth.users
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    avatar_url TEXT,
    phone TEXT,
    address_line1 TEXT,
    address_line2 TEXT,
    city TEXT,
    state TEXT,
    postal_code TEXT,
    country TEXT DEFAULT 'US',
    preferences JSONB DEFAULT '{}',
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- INVENTORY TABLE
-- =============================================================================
-- Main inventory items from AliExpress and other sources
CREATE TABLE inventory (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    -- AliExpress specific fields
    aliexpress_product_id TEXT,
    aliexpress_sku_id TEXT,
    aliexpress_order_id TEXT,
    aliexpress_order_line_id TEXT,
    -- Core product information
    title TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    price_usd DECIMAL(10,2) NOT NULL,
    original_price TEXT, -- Store original price format like "$2.91"
    price_info TEXT, -- Store price breakdown like "$2.91|2|91"
    currency TEXT DEFAULT 'USD',
    quantity INTEGER NOT NULL DEFAULT 0,
    reserved_quantity INTEGER DEFAULT 0, -- Quantity reserved for pending orders
    available_quantity INTEGER GENERATED ALWAYS AS (quantity - reserved_quantity) STORED,
    -- Product attributes and metadata
    attributes JSONB DEFAULT '{}', -- Store parsed attributes like {"Color": "Gold", "Size": "12cm"}
    tags TEXT[] DEFAULT '{}',
    category TEXT,
    subcategory TEXT,
    -- Supplier information
    store_name TEXT,
    store_page_url TEXT,
    product_url TEXT,
    supplier_info JSONB DEFAULT '{}',
    -- Order and import tracking
    order_date DATE,
    order_date_iso DATE,
    import_timestamp BIGINT, -- Original timestamp from import
    -- Status and flags
    status inventory_status DEFAULT 'in_stock',
    ignore_export BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id),
    updated_by UUID REFERENCES profiles(id)
);

-- =============================================================================
-- PRODUCTS TABLE
-- =============================================================================
-- Customizable product templates for the jewelry customizer
CREATE TABLE products (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    category TEXT NOT NULL, -- 'necklace', 'bracelet', 'earrings', etc.
    base_price DECIMAL(10,2) NOT NULL,
    image_url TEXT,
    -- Customization configuration
    customization_options JSONB DEFAULT '{}', -- Available customization options
    required_components JSONB DEFAULT '{}', -- Required inventory components
    optional_components JSONB DEFAULT '{}', -- Optional inventory components
    assembly_instructions JSONB DEFAULT '{}', -- How to assemble the product
    -- Display and ordering
    display_order INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES profiles(id),
    updated_by UUID REFERENCES profiles(id)
);

-- =============================================================================
-- DESIGNS TABLE
-- =============================================================================
-- User-created jewelry designs
CREATE TABLE designs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    -- Design data
    design_data JSONB NOT NULL, -- Complete design configuration
    preview_image_url TEXT,
    -- Pricing and components
    total_price DECIMAL(10,2),
    component_costs JSONB DEFAULT '{}', -- Breakdown of component costs
    used_inventory_items UUID[] DEFAULT '{}', -- Array of inventory item IDs used
    -- Status and sharing
    status design_status DEFAULT 'draft',
    is_public BOOLEAN DEFAULT FALSE,
    is_favorited BOOLEAN DEFAULT FALSE,
    view_count INTEGER DEFAULT 0,
    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- ORDERS TABLE
-- =============================================================================
-- Customer orders
CREATE TABLE orders (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_number TEXT UNIQUE NOT NULL, -- Human-readable order number
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    -- Order totals
    subtotal DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    shipping_amount DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    -- Customer information
    customer_email TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    customer_phone TEXT,
    -- Shipping address
    shipping_address_line1 TEXT NOT NULL,
    shipping_address_line2 TEXT,
    shipping_city TEXT NOT NULL,
    shipping_state TEXT NOT NULL,
    shipping_postal_code TEXT NOT NULL,
    shipping_country TEXT DEFAULT 'US',
    -- Billing address (if different)
    billing_address_line1 TEXT,
    billing_address_line2 TEXT,
    billing_city TEXT,
    billing_state TEXT,
    billing_postal_code TEXT,
    billing_country TEXT,
    -- Order status and tracking
    status order_status DEFAULT 'pending',
    payment_status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'failed', 'refunded'
    payment_intent_id TEXT, -- Stripe payment intent ID
    tracking_number TEXT,
    estimated_delivery_date DATE,
    -- Special instructions
    notes TEXT,
    special_instructions TEXT,
    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    shipped_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ
);

-- =============================================================================
-- ORDER_ITEMS TABLE
-- =============================================================================
-- Individual items within orders
CREATE TABLE order_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
    design_id UUID REFERENCES designs(id) ON DELETE SET NULL, -- If ordered from a saved design
    product_id UUID REFERENCES products(id) ON DELETE SET NULL NOT NULL,
    -- Item details
    item_name TEXT NOT NULL,
    item_description TEXT,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    -- Customization data
    customization_data JSONB DEFAULT '{}', -- Complete customization for this item
    used_inventory_items UUID[] DEFAULT '{}', -- Inventory items used for this order item
    preview_image_url TEXT,
    -- Production tracking
    production_status TEXT DEFAULT 'pending', -- 'pending', 'in_production', 'completed'
    production_notes TEXT,
    -- Audit fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- STORAGE BUCKETS CONFIGURATION
-- =============================================================================
-- Configure storage buckets for images
INSERT INTO storage.buckets (id, name, public) VALUES 
    ('design-images', 'design-images', true),
    ('product-images', 'product-images', true),
    ('inventory-images', 'inventory-images', true);

-- =============================================================================
-- TRIGGERS FOR UPDATED_AT TIMESTAMPS
-- =============================================================================
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for all tables with updated_at
CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_updated_at 
    BEFORE UPDATE ON inventory 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at 
    BEFORE UPDATE ON products 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_designs_updated_at 
    BEFORE UPDATE ON designs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at 
    BEFORE UPDATE ON orders 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_order_items_updated_at 
    BEFORE UPDATE ON order_items 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Function to generate unique order numbers
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS TEXT AS $$
DECLARE
    new_number TEXT;
    exists_check BOOLEAN;
BEGIN
    LOOP
        -- Generate format: TJC-YYYYMMDD-XXXX (TJC = Timothie Jewelry Customizer)
        new_number := 'TJC-' || to_char(NOW(), 'YYYYMMDD') || '-' || 
                     LPAD(floor(random() * 10000)::TEXT, 4, '0');
        
        -- Check if this number already exists
        SELECT EXISTS(SELECT 1 FROM orders WHERE order_number = new_number) INTO exists_check;
        
        -- If it doesn't exist, we can use it
        IF NOT exists_check THEN
            EXIT;
        END IF;
    END LOOP;
    
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- Function to parse AliExpress price info
CREATE OR REPLACE FUNCTION parse_price_info(price_text TEXT)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
    clean_price TEXT;
    price_numeric DECIMAL;
BEGIN
    -- Remove $ and convert to numeric
    clean_price := REPLACE(price_text, '$', '');
    
    BEGIN
        price_numeric := clean_price::DECIMAL;
        result := jsonb_build_object(
            'amount', price_numeric,
            'currency', 'USD',
            'formatted', price_text
        );
    EXCEPTION WHEN OTHERS THEN
        -- If parsing fails, return original text
        result := jsonb_build_object(
            'amount', 0,
            'currency', 'USD',
            'formatted', price_text,
            'parse_error', true
        );
    END;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to parse AliExpress attributes
CREATE OR REPLACE FUNCTION parse_attributes(attr_text TEXT)
RETURNS JSONB AS $$
DECLARE
    result JSONB := '{}';
    attr_pairs TEXT[];
    pair TEXT;
    key_val TEXT[];
BEGIN
    IF attr_text IS NULL OR attr_text = '' THEN
        RETURN result;
    END IF;
    
    -- Split by comma and process each attribute
    attr_pairs := string_to_array(attr_text, ',');
    
    FOREACH pair IN ARRAY attr_pairs
    LOOP
        -- Split by colon
        key_val := string_to_array(trim(pair), ':');
        
        IF array_length(key_val, 1) = 2 THEN
            result := result || jsonb_build_object(
                trim(key_val[1]), 
                trim(key_val[2])
            );
        END IF;
    END LOOP;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to check inventory availability
CREATE OR REPLACE FUNCTION check_inventory_availability(inventory_ids UUID[], required_quantities INTEGER[])
RETURNS JSONB AS $$
DECLARE
    result JSONB := '{"available": true, "issues": []}';
    i INTEGER;
    current_id UUID;
    required_qty INTEGER;
    available_qty INTEGER;
    issues JSONB := '[]';
BEGIN
    -- Check if arrays have same length
    IF array_length(inventory_ids, 1) != array_length(required_quantities, 1) THEN
        RETURN '{"available": false, "error": "Mismatched array lengths"}';
    END IF;
    
    -- Check each inventory item
    FOR i IN 1..array_length(inventory_ids, 1)
    LOOP
        current_id := inventory_ids[i];
        required_qty := required_quantities[i];
        
        -- Get available quantity
        SELECT available_quantity INTO available_qty 
        FROM inventory 
        WHERE id = current_id AND is_active = true;
        
        -- Check availability
        IF available_qty IS NULL THEN
            issues := issues || jsonb_build_object(
                'inventory_id', current_id,
                'issue', 'Item not found or inactive'
            );
        ELSIF available_qty < required_qty THEN
            issues := issues || jsonb_build_object(
                'inventory_id', current_id,
                'issue', 'Insufficient quantity',
                'available', available_qty,
                'required', required_qty
            );
        END IF;
    END LOOP;
    
    -- Update result
    IF jsonb_array_length(issues) > 0 THEN
        result := jsonb_build_object(
            'available', false,
            'issues', issues
        );
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to reserve inventory for orders
CREATE OR REPLACE FUNCTION reserve_inventory(inventory_ids UUID[], quantities INTEGER[])
RETURNS BOOLEAN AS $$
DECLARE
    i INTEGER;
BEGIN
    -- Check availability first
    IF NOT (SELECT (check_inventory_availability(inventory_ids, quantities)->>'available')::BOOLEAN) THEN
        RETURN FALSE;
    END IF;
    
    -- Reserve inventory
    FOR i IN 1..array_length(inventory_ids, 1)
    LOOP
        UPDATE inventory 
        SET reserved_quantity = reserved_quantity + quantities[i]
        WHERE id = inventory_ids[i];
    END LOOP;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to release inventory reservations
CREATE OR REPLACE FUNCTION release_inventory(inventory_ids UUID[], quantities INTEGER[])
RETURNS BOOLEAN AS $$
DECLARE
    i INTEGER;
BEGIN
    FOR i IN 1..array_length(inventory_ids, 1)
    LOOP
        UPDATE inventory 
        SET reserved_quantity = GREATEST(0, reserved_quantity - quantities[i])
        WHERE id = inventory_ids[i];
    END LOOP;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to update inventory status based on quantity
CREATE OR REPLACE FUNCTION update_inventory_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Update status based on available quantity
    IF NEW.available_quantity <= 0 THEN
        NEW.status := 'out_of_stock';
    ELSIF NEW.available_quantity <= 5 THEN -- Low stock threshold
        NEW.status := 'low_stock';
    ELSE
        NEW.status := 'in_stock';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update inventory status
CREATE TRIGGER update_inventory_status_trigger
    BEFORE INSERT OR UPDATE ON inventory
    FOR EACH ROW
    EXECUTE FUNCTION update_inventory_status();

-- =============================================================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================================================
COMMENT ON TABLE profiles IS 'User profiles linked to Supabase auth.users';
COMMENT ON TABLE inventory IS 'Main inventory items from AliExpress and other suppliers';
COMMENT ON TABLE products IS 'Customizable product templates for the jewelry customizer';
COMMENT ON TABLE designs IS 'User-created jewelry designs with customization data';
COMMENT ON TABLE orders IS 'Customer orders with shipping and billing information';
COMMENT ON TABLE order_items IS 'Individual items within orders with customization details';

COMMENT ON COLUMN inventory.available_quantity IS 'Computed as quantity - reserved_quantity';
COMMENT ON COLUMN inventory.attributes IS 'JSON object with parsed attributes like {"Color": "Gold", "Size": "12cm"}';
COMMENT ON COLUMN designs.design_data IS 'Complete design configuration including component selections';
COMMENT ON COLUMN order_items.customization_data IS 'Complete customization data for this specific order item';

-- This completes the initial database schema