#!/usr/bin/env node

/**
 * AliExpress Inventory Import Script
 * Imports JSON data into Supabase database
 */

const fs = require('fs');
const path = require('path');

// Configuration
const CONFIG = {
    jsonFilePath: path.join(__dirname, '../inventory/aliexpress-orders-2025-08-02T17-54-46-302Z.json'),
    supabaseUrl: process.env.SUPABASE_URL || 'YOUR_SUPABASE_URL',
    supabaseKey: process.env.SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY',
    batchSize: 10 // Process items in batches
};

/**
 * Parse AliExpress attributes string into object
 */
function parseAttributes(attributeString) {
    if (!attributeString) return {};
    
    const attributes = {};
    const pairs = attributeString.split(',');
    
    pairs.forEach(pair => {
        const [key, value] = pair.split(':').map(s => s.trim());
        if (key && value) {
            attributes[key] = value;
        }
    });
    
    return attributes;
}

/**
 * Parse price string to decimal
 */
function parsePrice(priceString) {
    if (!priceString) return 0;
    return parseFloat(priceString.replace('$', '')) || 0;
}

/**
 * Transform AliExpress item to database format
 */
function transformItem(item) {
    return {
        aliexpress_product_id: item.productId,
        aliexpress_sku_id: item.skuId,
        aliexpress_order_id: item.orderId,
        aliexpress_order_line_id: item.orderLineId,
        title: item.title,
        image_url: item.imageUrl,
        price_usd: parsePrice(item.price),
        original_price: item.price,
        price_info: item.priceInfo,
        currency: item.currency || 'USD',
        quantity: parseInt(item.quantity) || 1,
        attributes: parseAttributes(item.attributes),
        tags: item.tags || [],
        store_name: item.storeName,
        store_page_url: item.storePageUrl,
        product_url: item.productUrl,
        order_date: item.orderDateIso ? new Date(item.orderDateIso) : null,
        order_date_iso: item.orderDateIso ? new Date(item.orderDateIso) : null,
        import_timestamp: item.timestamp,
        ignore_export: item.ignoreExport || false,
        status: 'in_stock',
        is_active: true
    };
}

/**
 * Assign category based on title keywords
 */
function assignCategory(title) {
    const titleLower = title.toLowerCase();
    
    // Chains and necklaces
    if (titleLower.includes('chain') && (titleLower.includes('necklace') || titleLower.includes('neck'))) {
        return { category: 'chains', subcategory: 'necklace_chains' };
    }
    
    // Bracelets
    if (titleLower.includes('bracelet') || titleLower.includes('bangle')) {
        return { category: 'chains', subcategory: 'bracelet_chains' };
    }
    
    // Earrings
    if (titleLower.includes('earring') || titleLower.includes('ear')) {
        return { category: 'earrings', subcategory: 'earring_components' };
    }
    
    // Charms and pendants
    if (titleLower.includes('charm') || titleLower.includes('pendant')) {
        return { category: 'charms', subcategory: 'pendants' };
    }
    
    // Beads
    if (titleLower.includes('bead')) {
        return { category: 'beads', subcategory: 'decorative_beads' };
    }
    
    // Findings and connectors
    if (titleLower.includes('finding') || titleLower.includes('connector') || 
        titleLower.includes('clasp') || titleLower.includes('hook') ||
        titleLower.includes('jump ring') || titleLower.includes('split ring')) {
        return { category: 'findings', subcategory: 'connectors' };
    }
    
    // Carabiners and keychains
    if (titleLower.includes('carabiner') || titleLower.includes('keychain') || 
        titleLower.includes('key ring')) {
        return { category: 'findings', subcategory: 'carabiners' };
    }
    
    // Wire and cord
    if (titleLower.includes('wire') || titleLower.includes('cord')) {
        return { category: 'materials', subcategory: 'wire_cord' };
    }
    
    // Bag accessories
    if (titleLower.includes('bag') || titleLower.includes('purse') || 
        titleLower.includes('handbag')) {
        return { category: 'accessories', subcategory: 'bag_accessories' };
    }
    
    // Default
    return { category: 'components', subcategory: 'miscellaneous' };
}

/**
 * Generate SQL INSERT statement for batch import
 */
function generateInsertSQL(items) {
    const values = items.map(item => {
        const categoryInfo = assignCategory(item.title);
        const transformedItem = { ...transformItem(item), ...categoryInfo };
        
        // Build VALUES clause
        const values = [
            transformedItem.aliexpress_product_id ? `'${transformedItem.aliexpress_product_id}'` : 'NULL',
            transformedItem.aliexpress_sku_id ? `'${transformedItem.aliexpress_sku_id}'` : 'NULL',
            transformedItem.aliexpress_order_id ? `'${transformedItem.aliexpress_order_id}'` : 'NULL',
            transformedItem.aliexpress_order_line_id ? `'${transformedItem.aliexpress_order_line_id}'` : 'NULL',
            `'${transformedItem.title.replace(/'/g, "''")}'`, // Escape single quotes
            transformedItem.image_url ? `'${transformedItem.image_url}'` : 'NULL',
            transformedItem.price_usd,
            transformedItem.original_price ? `'${transformedItem.original_price}'` : 'NULL',
            transformedItem.price_info ? `'${transformedItem.price_info}'` : 'NULL',
            `'${transformedItem.currency}'`,
            transformedItem.quantity,
            `'${JSON.stringify(transformedItem.attributes).replace(/'/g, "''")}'::jsonb`,
            `ARRAY[${transformedItem.tags.map(tag => `'${tag.replace(/'/g, "''")}'`).join(',')}]`,
            transformedItem.store_name ? `'${transformedItem.store_name.replace(/'/g, "''")}'` : 'NULL',
            transformedItem.store_page_url ? `'${transformedItem.store_page_url}'` : 'NULL',
            transformedItem.product_url ? `'${transformedItem.product_url}'` : 'NULL',
            transformedItem.order_date ? `'${transformedItem.order_date.toISOString().split('T')[0]}'` : 'NULL',
            transformedItem.order_date_iso ? `'${transformedItem.order_date_iso.toISOString().split('T')[0]}'` : 'NULL',
            transformedItem.import_timestamp || 'NULL',
            transformedItem.ignore_export,
            `'${transformedItem.status}'`,
            transformedItem.is_active,
            `'${categoryInfo.category}'`,
            `'${categoryInfo.subcategory}'`
        ];
        
        return `(${values.join(', ')})`;
    }).join(',\n    ');
    
    return `
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
    is_active,
    category,
    subcategory
) VALUES 
    ${values};
`;
}

/**
 * Main import function
 */
async function importInventory() {
    try {
        console.log('🚀 Starting AliExpress inventory import...');
        
        // Read and parse JSON file
        console.log(`📄 Reading JSON file: ${CONFIG.jsonFilePath}`);
        if (!fs.existsSync(CONFIG.jsonFilePath)) {
            throw new Error(`JSON file not found: ${CONFIG.jsonFilePath}`);
        }
        
        const jsonData = JSON.parse(fs.readFileSync(CONFIG.jsonFilePath, 'utf8'));
        console.log(`📊 Found ${jsonData.length} items to import`);
        
        // Process items in batches
        const batches = [];
        for (let i = 0; i < jsonData.length; i += CONFIG.batchSize) {
            batches.push(jsonData.slice(i, i + CONFIG.batchSize));
        }
        
        console.log(`📦 Processing ${batches.length} batches of ${CONFIG.batchSize} items each`);
        
        // Generate SQL files for each batch
        const sqlOutputDir = path.join(__dirname, '../supabase/data');
        if (!fs.existsSync(sqlOutputDir)) {
            fs.mkdirSync(sqlOutputDir, { recursive: true });
        }
        
        let totalProcessed = 0;
        const allSQL = [];
        
        for (let i = 0; i < batches.length; i++) {
            const batch = batches[i];
            const sql = generateInsertSQL(batch);
            allSQL.push(sql);
            
            // Write individual batch file
            const batchFile = path.join(sqlOutputDir, `inventory_batch_${i + 1}.sql`);
            fs.writeFileSync(batchFile, sql);
            
            totalProcessed += batch.length;
            console.log(`✅ Batch ${i + 1}/${batches.length} processed (${batch.length} items) -> ${batchFile}`);
        }
        
        // Write complete SQL file
        const completeSQL = `-- Complete inventory import for ${jsonData.length} items
-- Generated on ${new Date().toISOString()}

BEGIN;

${allSQL.join('\n\n')}

-- Validate the import
SELECT 
    'Import Summary' as report_type,
    COUNT(*) as total_items,
    COUNT(DISTINCT category) as categories,
    COUNT(DISTINCT store_name) as stores,
    ROUND(AVG(price_usd), 2) as avg_price,
    SUM(quantity) as total_quantity
FROM inventory
WHERE created_at >= NOW() - INTERVAL '1 hour';

-- Category breakdown
SELECT 
    'Category Breakdown' as report_type,
    category,
    subcategory,
    COUNT(*) as item_count,
    ROUND(AVG(price_usd), 2) as avg_price,
    SUM(quantity) as total_quantity
FROM inventory
WHERE created_at >= NOW() - INTERVAL '1 hour'
GROUP BY category, subcategory
ORDER BY category, subcategory;

COMMIT;
`;
        
        const completeFile = path.join(sqlOutputDir, 'complete_inventory_import.sql');
        fs.writeFileSync(completeFile, completeSQL);
        
        console.log(`🎉 Import preparation complete!`);
        console.log(`📁 SQL files generated in: ${sqlOutputDir}`);
        console.log(`🗂️  Complete import file: ${completeFile}`);
        console.log(`📈 Total items processed: ${totalProcessed}`);
        
        // Generate summary report
        const categories = {};
        jsonData.forEach(item => {
            const categoryInfo = assignCategory(item.title);
            const key = `${categoryInfo.category}/${categoryInfo.subcategory}`;
            if (!categories[key]) {
                categories[key] = { count: 0, totalValue: 0 };
            }
            categories[key].count++;
            categories[key].totalValue += parsePrice(item.price) * (parseInt(item.quantity) || 1);
        });
        
        console.log('\n📊 Category Summary:');
        Object.entries(categories).forEach(([category, stats]) => {
            console.log(`   ${category}: ${stats.count} items, $${stats.totalValue.toFixed(2)} total value`);
        });
        
        console.log('\n🔧 Next steps:');
        console.log('1. Review the generated SQL files');
        console.log('2. Execute the migration in your Supabase dashboard or via psql');
        console.log('3. Run validation queries to ensure data integrity');
        
    } catch (error) {
        console.error('❌ Import failed:', error.message);
        process.exit(1);
    }
}

// Run the import if this script is executed directly
if (require.main === module) {
    importInventory();
}

module.exports = { importInventory, transformItem, assignCategory, parseAttributes, parsePrice };