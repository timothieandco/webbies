-- Inventory Data Migration for Timothie & Co Jewelry Customizer
-- Created: 2025-08-02
-- Description: Imports 135 inventory items from AliExpress JSON data

-- =============================================================================
-- DATA MIGRATION PREPARATION
-- =============================================================================

-- Create temporary table for raw import data
CREATE TEMP TABLE temp_aliexpress_import (
    raw_data JSONB
);

-- Note: This migration assumes the JSON data will be imported via application code
-- The following functions provide the structure for processing the data

-- =============================================================================
-- DATA PROCESSING FUNCTIONS
-- =============================================================================

-- Function to import a single AliExpress item
CREATE OR REPLACE FUNCTION import_aliexpress_item(item_data JSONB)
RETURNS UUID AS $$
DECLARE
    new_id UUID;
    parsed_price DECIMAL(10,2);
    parsed_attributes JSONB;
    item_tags TEXT[];
    parsed_date DATE;
BEGIN
    -- Parse price from string format like "$2.91"
    BEGIN
        parsed_price := REPLACE(item_data->>'price', '$', '')::DECIMAL(10,2);
    EXCEPTION WHEN OTHERS THEN
        parsed_price := 0.00;
    END;
    
    -- Parse attributes from string format like "Color: C, Ships From: CHINA"
    parsed_attributes := parse_attributes(item_data->>'attributes');
    
    -- Parse tags array (currently empty in source data, but prepared for future)
    SELECT ARRAY(SELECT jsonb_array_elements_text(item_data->'tags')) INTO item_tags;
    IF item_tags IS NULL THEN
        item_tags := '{}';
    END IF;
    
    -- Parse order date
    BEGIN
        parsed_date := (item_data->>'orderDateIso')::DATE;
    EXCEPTION WHEN OTHERS THEN
        -- Fallback to parsing from orderDate string if ISO format fails
        BEGIN
            -- This would need more sophisticated date parsing for non-ISO formats
            parsed_date := NULL;
        EXCEPTION WHEN OTHERS THEN
            parsed_date := NULL;
        END;
    END;
    
    -- Insert the inventory item
    INSERT INTO inventory (
        aliexpress_product_id,
        aliexpress_sku_id,
        aliexpress_order_id,
        aliexpress_order_line_id,
        title,
        image_url,
        price_usd,
        original_price,
        price_info,
        currency,
        quantity,
        attributes,
        tags,
        store_name,
        store_page_url,
        product_url,
        order_date,
        order_date_iso,
        import_timestamp,
        ignore_export,
        status,
        is_active
    ) VALUES (
        item_data->>'productId',
        item_data->>'skuId',
        item_data->>'orderId',
        item_data->>'orderLineId',
        item_data->>'title',
        item_data->>'imageUrl',
        parsed_price,
        item_data->>'price',
        item_data->>'priceInfo',
        COALESCE(item_data->>'currency', 'USD'),
        COALESCE((item_data->>'quantity')::INTEGER, 1),
        parsed_attributes,
        item_tags,
        item_data->>'storeName',
        item_data->>'storePageUrl',
        item_data->>'productUrl',
        parsed_date,
        parsed_date,
        (item_data->>'timestamp')::BIGINT,
        COALESCE((item_data->>'ignoreExport')::BOOLEAN, false),
        'in_stock',
        true
    ) RETURNING id INTO new_id;
    
    RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- Function to process all items from JSON array
CREATE OR REPLACE FUNCTION import_all_aliexpress_items(json_data JSONB)
RETURNS TABLE(
    imported_count INTEGER,
    failed_count INTEGER,
    failed_items JSONB[]
) AS $$
DECLARE
    item JSONB;
    success_count INTEGER := 0;
    failure_count INTEGER := 0;
    failed_list JSONB[] := '{}';
    item_id UUID;
BEGIN
    -- Process each item in the JSON array
    FOR item IN SELECT jsonb_array_elements(json_data)
    LOOP
        BEGIN
            -- Attempt to import the item
            SELECT import_aliexpress_item(item) INTO item_id;
            success_count := success_count + 1;
            
            -- Log successful import
            RAISE NOTICE 'Successfully imported item: % (ID: %)', 
                item->>'title', item_id;
                
        EXCEPTION WHEN OTHERS THEN
            -- Log failed import
            failure_count := failure_count + 1;
            failed_list := failed_list || item;
            
            RAISE WARNING 'Failed to import item: % - Error: %', 
                item->>'title', SQLERRM;
        END;
    END LOOP;
    
    -- Return summary
    RETURN QUERY SELECT success_count, failure_count, failed_list;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- CATEGORY ASSIGNMENT FUNCTION
-- =============================================================================

-- Function to automatically assign categories based on title keywords
CREATE OR REPLACE FUNCTION assign_inventory_categories()
RETURNS INTEGER AS $$
DECLARE
    updated_count INTEGER := 0;
BEGIN
    -- Update categories based on title keywords
    
    -- Chains and necklaces
    UPDATE inventory 
    SET category = 'chains', subcategory = 'necklace_chains'
    WHERE LOWER(title) LIKE '%chain%' 
    AND (LOWER(title) LIKE '%necklace%' OR LOWER(title) LIKE '%neck%')
    AND category IS NULL;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    
    -- Bracelets and bangles
    UPDATE inventory 
    SET category = 'chains', subcategory = 'bracelet_chains'
    WHERE (LOWER(title) LIKE '%bracelet%' OR LOWER(title) LIKE '%bangle%')
    AND category IS NULL;
    
    -- Earring components
    UPDATE inventory 
    SET category = 'earrings', subcategory = 'earring_components'
    WHERE (LOWER(title) LIKE '%earring%' OR LOWER(title) LIKE '%ear%')
    AND category IS NULL;
    
    -- Charms and pendants
    UPDATE inventory 
    SET category = 'charms', subcategory = 'pendants'
    WHERE (LOWER(title) LIKE '%charm%' OR LOWER(title) LIKE '%pendant%')
    AND category IS NULL;
    
    -- Beads
    UPDATE inventory 
    SET category = 'beads', subcategory = 'decorative_beads'
    WHERE LOWER(title) LIKE '%bead%'
    AND category IS NULL;
    
    -- Findings and connectors
    UPDATE inventory 
    SET category = 'findings', subcategory = 'connectors'
    WHERE (LOWER(title) LIKE '%finding%' OR LOWER(title) LIKE '%connector%' 
           OR LOWER(title) LIKE '%clasp%' OR LOWER(title) LIKE '%hook%'
           OR LOWER(title) LIKE '%jump ring%' OR LOWER(title) LIKE '%split ring%')
    AND category IS NULL;
    
    -- Carabiners and keychains
    UPDATE inventory 
    SET category = 'findings', subcategory = 'carabiners'
    WHERE (LOWER(title) LIKE '%carabiner%' OR LOWER(title) LIKE '%keychain%' 
           OR LOWER(title) LIKE '%key ring%')
    AND category IS NULL;
    
    -- Wire and cord
    UPDATE inventory 
    SET category = 'materials', subcategory = 'wire_cord'
    WHERE (LOWER(title) LIKE '%wire%' OR LOWER(title) LIKE '%cord%')
    AND category IS NULL;
    
    -- Bag and purse accessories
    UPDATE inventory 
    SET category = 'accessories', subcategory = 'bag_accessories'
    WHERE (LOWER(title) LIKE '%bag%' OR LOWER(title) LIKE '%purse%' 
           OR LOWER(title) LIKE '%handbag%')
    AND category IS NULL;
    
    -- Default to 'components' for unclassified items
    UPDATE inventory 
    SET category = 'components', subcategory = 'miscellaneous'
    WHERE category IS NULL;
    
    RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- DATA VALIDATION FUNCTIONS
-- =============================================================================

-- Function to validate imported data
CREATE OR REPLACE FUNCTION validate_inventory_data()
RETURNS TABLE(
    check_name TEXT,
    status TEXT,
    count_value BIGINT,
    details TEXT
) AS $$
BEGIN
    -- Check total count
    RETURN QUERY
    SELECT 
        'Total Items'::TEXT,
        'INFO'::TEXT,
        COUNT(*)::BIGINT,
        'Total inventory items imported'::TEXT
    FROM inventory;
    
    -- Check items without images
    RETURN QUERY
    SELECT 
        'Missing Images'::TEXT,
        CASE WHEN COUNT(*) > 0 THEN 'WARNING' ELSE 'OK' END::TEXT,
        COUNT(*)::BIGINT,
        'Items without image URLs'::TEXT
    FROM inventory 
    WHERE image_url IS NULL OR image_url = '';
    
    -- Check items with zero price
    RETURN QUERY
    SELECT 
        'Zero Price Items'::TEXT,
        CASE WHEN COUNT(*) > 0 THEN 'WARNING' ELSE 'OK' END::TEXT,
        COUNT(*)::BIGINT,
        'Items with zero or invalid pricing'::TEXT
    FROM inventory 
    WHERE price_usd <= 0;
    
    -- Check items without categories
    RETURN QUERY
    SELECT 
        'Uncategorized Items'::TEXT,
        CASE WHEN COUNT(*) > 0 THEN 'WARNING' ELSE 'OK' END::TEXT,
        COUNT(*)::BIGINT,
        'Items without assigned categories'::TEXT
    FROM inventory 
    WHERE category IS NULL;
    
    -- Check duplicate AliExpress product IDs
    RETURN QUERY
    SELECT 
        'Duplicate Product IDs'::TEXT,
        CASE WHEN COUNT(*) > 0 THEN 'ERROR' ELSE 'OK' END::TEXT,
        COUNT(*)::BIGINT,
        'Duplicate AliExpress product IDs found'::TEXT
    FROM (
        SELECT aliexpress_product_id, COUNT(*) as cnt
        FROM inventory 
        WHERE aliexpress_product_id IS NOT NULL
        GROUP BY aliexpress_product_id
        HAVING COUNT(*) > 1
    ) dups;
    
    -- Check quantity distribution
    RETURN QUERY
    SELECT 
        'Quantity Distribution'::TEXT,
        'INFO'::TEXT,
        COUNT(*)::BIGINT,
        'Average quantity: ' || ROUND(AVG(quantity), 2)::TEXT
    FROM inventory;
    
    -- Check price distribution
    RETURN QUERY
    SELECT 
        'Price Distribution'::TEXT,
        'INFO'::TEXT,
        COUNT(*)::BIGINT,
        'Average price: $' || ROUND(AVG(price_usd), 2)::TEXT || 
        ', Min: $' || ROUND(MIN(price_usd), 2)::TEXT ||
        ', Max: $' || ROUND(MAX(price_usd), 2)::TEXT
    FROM inventory;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- SAMPLE DATA FOR TESTING (if no JSON file available)
-- =============================================================================

-- Function to create sample inventory data for testing
CREATE OR REPLACE FUNCTION create_sample_inventory_data()
RETURNS INTEGER AS $$
DECLARE
    inserted_count INTEGER := 0;
BEGIN
    -- Insert sample inventory items for testing
    INSERT INTO inventory (
        title, price_usd, quantity, category, subcategory, 
        image_url, status, is_active
    ) VALUES 
    ('Gold Plated Chain Necklace - 18 inch', 15.99, 50, 'chains', 'necklace_chains', 
     'https://example.com/gold-chain.jpg', 'in_stock', true),
    ('Silver Charm Bracelet Base', 12.50, 30, 'chains', 'bracelet_chains', 
     'https://example.com/silver-bracelet.jpg', 'in_stock', true),
    ('Heart Pendant Charm - Rose Gold', 8.75, 25, 'charms', 'pendants', 
     'https://example.com/heart-pendant.jpg', 'in_stock', true),
    ('Crystal Beads - Mixed Colors (10 pack)', 6.99, 100, 'beads', 'decorative_beads', 
     'https://example.com/crystal-beads.jpg', 'in_stock', true),
    ('Jewelry Wire - Silver Plated (20 gauge)', 4.50, 75, 'materials', 'wire_cord', 
     'https://example.com/silver-wire.jpg', 'in_stock', true),
    ('Lobster Clasp - Gold (5 pack)', 3.25, 200, 'findings', 'connectors', 
     'https://example.com/lobster-clasp.jpg', 'in_stock', true);
    
    GET DIAGNOSTICS inserted_count = ROW_COUNT;
    
    RETURN inserted_count;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- CLEANUP FUNCTIONS
-- =============================================================================

-- Function to clean up inventory data
CREATE OR REPLACE FUNCTION cleanup_inventory_data()
RETURNS TABLE(
    action TEXT,
    affected_rows INTEGER
) AS $$
DECLARE
    cleaned_count INTEGER;
BEGIN
    -- Remove items with invalid titles
    DELETE FROM inventory WHERE title IS NULL OR trim(title) = '';
    GET DIAGNOSTICS cleaned_count = ROW_COUNT;
    RETURN QUERY SELECT 'Removed items with empty titles'::TEXT, cleaned_count;
    
    -- Update empty image URLs to NULL
    UPDATE inventory SET image_url = NULL WHERE trim(image_url) = '';
    GET DIAGNOSTICS cleaned_count = ROW_COUNT;
    RETURN QUERY SELECT 'Cleaned empty image URLs'::TEXT, cleaned_count;
    
    -- Fix negative quantities
    UPDATE inventory SET quantity = 0 WHERE quantity < 0;
    GET DIAGNOSTICS cleaned_count = ROW_COUNT;
    RETURN QUERY SELECT 'Fixed negative quantities'::TEXT, cleaned_count;
    
    -- Fix negative prices
    UPDATE inventory SET price_usd = 0 WHERE price_usd < 0;
    GET DIAGNOSTICS cleaned_count = ROW_COUNT;
    RETURN QUERY SELECT 'Fixed negative prices'::TEXT, cleaned_count;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- MIGRATION EXECUTION NOTES
-- =============================================================================

/*
To execute this migration with actual data:

1. Load the JSON file into a variable or temporary table
2. Execute the import function:
   
   SELECT * FROM import_all_aliexpress_items('[JSON_DATA_HERE]'::jsonb);

3. Assign categories:
   
   SELECT assign_inventory_categories();

4. Validate the imported data:
   
   SELECT * FROM validate_inventory_data();

5. Clean up any issues:
   
   SELECT * FROM cleanup_inventory_data();

For testing without actual data:
   
   SELECT create_sample_inventory_data();

Example SQL to import from a JSON file (if loaded via COPY or application):

-- Assuming JSON data is in a file or variable
\set json_content `cat /path/to/aliexpress-orders.json`
SELECT * FROM import_all_aliexpress_items(:'json_content'::jsonb);

*/

-- =============================================================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON FUNCTION import_aliexpress_item(JSONB) IS 
'Imports a single AliExpress item from JSON format with data validation and parsing';

COMMENT ON FUNCTION import_all_aliexpress_items(JSONB) IS 
'Bulk imports all AliExpress items from JSON array with error handling and reporting';

COMMENT ON FUNCTION assign_inventory_categories() IS 
'Automatically assigns categories and subcategories based on title keywords';

COMMENT ON FUNCTION validate_inventory_data() IS 
'Validates imported inventory data and returns summary statistics and warnings';

-- This completes the inventory data migration setup