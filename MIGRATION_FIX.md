# Migration Fix: pg_trgm Extension Error

## 🚨 Issue
When running the indexes migration, you encountered:
```
ERROR: 42704: operator class "gin_trgm_ops" does not exist for access method "gin"
```

## 🔧 Solution

The issue has two parts:
1. The `pg_trgm` extension wasn't enabled before creating trigram indexes
2. **Column names in the indexes don't match the actual schema** (e.g., `price` vs `price_usd`)

### Option 1: Use the Schema-Corrected Migration File ⭐ **RECOMMENDED**

Instead of running the original `20250802000003_indexes.sql`, use the corrected version:

```sql
-- Run this file instead:
-- supabase/migrations/20250802000003_indexes_corrected.sql
```

The corrected file:
1. ✅ Enables `pg_trgm` extension first
2. ✅ Uses correct column names that match your actual schema
3. ✅ Uses `CREATE INDEX IF NOT EXISTS` to avoid conflicts
4. ✅ Includes proper error handling
5. ✅ Has better organized, more focused indexes

### Option 2: Quick Manual Fix

If you want to fix the original file, run this first in your Supabase SQL Editor:

```sql
-- Enable the required extension
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Then run the original indexes migration
```

### Option 3: Essential Indexes Only

If you want to start with just the essential indexes, run this minimal script with **corrected column names**:

```sql
-- Essential indexes for basic functionality (with correct column names)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Inventory indexes (using correct column names from schema)
CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory(category);
CREATE INDEX IF NOT EXISTS idx_inventory_status ON inventory(status);
CREATE INDEX IF NOT EXISTS idx_inventory_price_usd ON inventory(price_usd);  -- Corrected column name
CREATE INDEX IF NOT EXISTS idx_inventory_is_active ON inventory(is_active);  -- Corrected column name
CREATE INDEX IF NOT EXISTS idx_inventory_available_quantity ON inventory(available_quantity);  -- Corrected column name
CREATE INDEX IF NOT EXISTS idx_inventory_tags ON inventory USING gin(tags);
CREATE INDEX IF NOT EXISTS idx_inventory_attributes ON inventory USING gin(attributes);

-- Design indexes
CREATE INDEX IF NOT EXISTS idx_designs_user_id ON designs(user_id);
CREATE INDEX IF NOT EXISTS idx_designs_is_public ON designs(is_public);  -- Corrected column name

-- Order indexes
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
-- Order number unique index already exists due to UNIQUE constraint

-- Order items indexes
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);  -- Corrected column name
```

## 🎯 Recommended Approach

**Use the schema-corrected migration file** (`20250802000003_indexes_corrected.sql`) as it:

- Properly enables required extensions
- Creates comprehensive indexes for optimal performance
- Uses safe `IF NOT EXISTS` syntax
- Includes helpful comments and documentation
- Has better error handling

## ✅ Verification

After running the fixed migration, verify it worked:

```sql
-- Check that the extension is enabled
SELECT * FROM pg_extension WHERE extname = 'pg_trgm';

-- Check that indexes were created
SELECT schemaname, tablename, indexname 
FROM pg_indexes 
WHERE schemaname = 'public' 
ORDER BY tablename, indexname;

-- Test a trigram search (should work now)
SELECT title FROM inventory 
WHERE title % 'charm' 
LIMIT 5;
```

## 🚀 Next Steps

After fixing the indexes:

1. ✅ Continue with the remaining migrations:
   - `20250802000004_inventory_data_migration.sql`
   - `20250802000005_storage_setup.sql`

2. ✅ Import your inventory data:
   - `supabase/data/complete_inventory_import.sql`

3. ✅ Test the application with the backend integration

The system will now have optimized query performance with all the necessary indexes in place! 💎