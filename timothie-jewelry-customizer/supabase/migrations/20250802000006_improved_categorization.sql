-- Improved Category Assignment for Timothie & Co Jewelry Customizer
-- Created: 2025-08-02
-- Description: Assigns proper categories to align with business requirements

-- =============================================================================
-- IMPROVED CATEGORIZATION FUNCTION
-- =============================================================================

-- Function to assign improved categories based on comprehensive title analysis
CREATE OR REPLACE FUNCTION assign_improved_inventory_categories()
RETURNS TABLE(
    category_name TEXT,
    items_updated BIGINT,
    sample_titles TEXT[]
) AS $$
DECLARE
    necklaces_count BIGINT;
    bracelets_count BIGINT;
    charms_count BIGINT;
    keychains_count BIGINT;
    earrings_count BIGINT;
    accessories_count BIGINT;
    materials_count BIGINT;
BEGIN
    -- Reset all categories to allow re-categorization
    UPDATE inventory SET category = NULL, subcategory = NULL;
    
    -- =================================================================
    -- NECKLACES - Chain bases and necklace components
    -- =================================================================
    UPDATE inventory 
    SET category = 'necklaces', subcategory = 'chain_bases'
    WHERE LOWER(title) ~ '(necklace|neck|chain)' 
    AND NOT LOWER(title) ~ '(bracelet|keychain|key ring|bag|purse|earring)'
    AND category IS NULL;
    
    GET DIAGNOSTICS necklaces_count = ROW_COUNT;
    
    -- =================================================================
    -- BRACELETS - Bracelet chains and components
    -- =================================================================
    UPDATE inventory 
    SET category = 'bracelets', subcategory = 'chain_components'
    WHERE (
        LOWER(title) ~ '(bracelet|bangle|wrist)' OR
        (LOWER(title) ~ 'chain' AND LOWER(title) ~ '(extender|extend)') OR
        (LOWER(title) ~ 'strap' AND LOWER(title) ~ '(bag|purse|handbag)')
    )
    AND category IS NULL;
    
    GET DIAGNOSTICS bracelets_count = ROW_COUNT;
    
    -- =================================================================
    -- KEYCHAINS - Keychain components, carabiners, key rings
    -- =================================================================
    UPDATE inventory 
    SET category = 'keychains', subcategory = 'components'
    WHERE (
        LOWER(title) ~ '(keychain|key ring|carabiner|key chain)' OR
        (LOWER(title) ~ 'ring' AND LOWER(title) ~ '(split|swivel|connector)') OR
        LOWER(title) ~ 'lobster.*clasp'
    )
    AND category IS NULL;
    
    GET DIAGNOSTICS keychains_count = ROW_COUNT;
    
    -- =================================================================
    -- CHARMS - Decorative elements, pendants, charms
    -- =================================================================
    UPDATE inventory 
    SET category = 'charms', subcategory = 'decorative'
    WHERE (
        LOWER(title) ~ '(charm|pendant|decorative)' OR
        (LOWER(title) ~ '(gold|silver|rose gold|metal)' AND LOWER(title) ~ '(color|plated)') OR
        LOWER(title) ~ '(heart|star|flower|animal|letter|symbol)' OR
        LOWER(title) ~ 'natural.*pearl'
    )
    AND category IS NULL;
    
    GET DIAGNOSTICS charms_count = ROW_COUNT;
    
    -- =================================================================
    -- EARRINGS - Earring components and findings
    -- =================================================================
    UPDATE inventory 
    SET category = 'earrings', subcategory = 'components'
    WHERE (
        LOWER(title) ~ '(earring|ear hook|ear wire)' OR
        (LOWER(title) ~ 'jewelry.*making' AND LOWER(title) ~ 'earring')
    )
    AND category IS NULL;
    
    GET DIAGNOSTICS earrings_count = ROW_COUNT;
    
    -- =================================================================
    -- ACCESSORIES - Bag accessories and miscellaneous items
    -- =================================================================
    UPDATE inventory 
    SET category = 'accessories', subcategory = 'bag_accessories'
    WHERE (
        LOWER(title) ~ '(bag|purse|handbag|crossbody|shoulder)' OR
        LOWER(title) ~ '(replacement|accessories|extender)' OR
        LOWER(title) ~ 'strap.*extender'
    )
    AND category IS NULL;
    
    GET DIAGNOSTICS accessories_count = ROW_COUNT;
    
    -- =================================================================
    -- MATERIALS - Wire, beads, findings, jewelry making supplies
    -- =================================================================
    UPDATE inventory 
    SET category = 'materials', subcategory = 'supplies'
    WHERE (
        LOWER(title) ~ '(wire|cord|thread|string)' OR
        LOWER(title) ~ '(bead|crystal|stone)' OR
        LOWER(title) ~ '(finding|connector|clasp|hook)' OR
        LOWER(title) ~ '(jump ring|split ring|crimp)' OR
        LOWER(title) ~ 'jewelry.*making' OR
        LOWER(title) ~ '(stainless steel|brass|copper).*finding'
    )
    AND category IS NULL;
    
    GET DIAGNOSTICS materials_count = ROW_COUNT;
    
    -- =================================================================
    -- CATCH-ALL: Remaining items as accessories
    -- =================================================================
    UPDATE inventory 
    SET category = 'accessories', subcategory = 'miscellaneous'
    WHERE category IS NULL;
    
    -- =================================================================
    -- RETURN RESULTS
    -- =================================================================
    RETURN QUERY
    SELECT 
        'necklaces'::TEXT,
        necklaces_count,
        ARRAY(SELECT title FROM inventory WHERE category = 'necklaces' LIMIT 3)
    UNION ALL
    SELECT 
        'bracelets'::TEXT,
        bracelets_count,
        ARRAY(SELECT title FROM inventory WHERE category = 'bracelets' LIMIT 3)
    UNION ALL
    SELECT 
        'charms'::TEXT,
        charms_count,
        ARRAY(SELECT title FROM inventory WHERE category = 'charms' LIMIT 3)
    UNION ALL
    SELECT 
        'keychains'::TEXT,
        keychains_count,
        ARRAY(SELECT title FROM inventory WHERE category = 'keychains' LIMIT 3)
    UNION ALL
    SELECT 
        'earrings'::TEXT,
        earrings_count,
        ARRAY(SELECT title FROM inventory WHERE category = 'earrings' LIMIT 3)
    UNION ALL
    SELECT 
        'accessories'::TEXT,
        accessories_count,
        ARRAY(SELECT title FROM inventory WHERE category = 'accessories' LIMIT 3)
    UNION ALL
    SELECT 
        'materials'::TEXT,
        materials_count,
        ARRAY(SELECT title FROM inventory WHERE category = 'materials' LIMIT 3);
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- EXECUTE IMPROVED CATEGORIZATION
-- =============================================================================

-- Run the improved categorization
SELECT * FROM assign_improved_inventory_categories();

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================

-- Show final category distribution
SELECT 
    category,
    subcategory,
    COUNT(*) as item_count,
    ROUND(AVG(price_usd), 2) as avg_price,
    MIN(price_usd) as min_price,
    MAX(price_usd) as max_price
FROM inventory 
GROUP BY category, subcategory 
ORDER BY category, item_count DESC;

-- Show total items categorized
SELECT 
    COUNT(*) as total_items,
    COUNT(CASE WHEN category IS NOT NULL THEN 1 END) as categorized_items,
    COUNT(CASE WHEN category IS NULL THEN 1 END) as uncategorized_items
FROM inventory;

-- =============================================================================
-- CREATE VIEW FOR CATEGORY SUMMARY
-- =============================================================================

-- Create a view for easy category access
CREATE OR REPLACE VIEW category_summary AS
SELECT 
    category,
    COUNT(*) as item_count,
    ROUND(AVG(price_usd), 2) as avg_price,
    SUM(quantity) as total_quantity,
    STRING_AGG(DISTINCT subcategory, ', ') as subcategories
FROM inventory 
WHERE is_active = true AND status = 'in_stock'
GROUP BY category 
ORDER BY item_count DESC;

-- =============================================================================
-- COMPLETION MESSAGE
-- =============================================================================

DO $$
DECLARE
    total_count INTEGER;
    categorized_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_count FROM inventory;
    SELECT COUNT(*) INTO categorized_count FROM inventory WHERE category IS NOT NULL;
    
    RAISE NOTICE '✅ Improved categorization completed!';
    RAISE NOTICE 'Total items: %, Categorized: %', total_count, categorized_count;
    RAISE NOTICE 'Categories aligned with business requirements:';
    RAISE NOTICE '  - Necklaces (chain bases)';
    RAISE NOTICE '  - Bracelets (chains & components)';  
    RAISE NOTICE '  - Charms (decorative elements)';
    RAISE NOTICE '  - Keychains (carabiners & key rings)';
    RAISE NOTICE '  - Earrings (components & findings)';
    RAISE NOTICE '  - Accessories (bag accessories & misc)';
    RAISE NOTICE '  - Materials (supplies & findings)';
END $$;