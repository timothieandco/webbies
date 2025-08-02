-- Storage Configuration for Timothie & Co Jewelry Customizer
-- Created: 2025-08-02
-- Description: Storage buckets and policies for image management

-- =============================================================================
-- STORAGE BUCKETS SETUP
-- =============================================================================

-- Create storage buckets if they don't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    (
        'design-images', 
        'design-images', 
        true, 
        10485760, -- 10MB limit
        ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    ),
    (
        'product-images', 
        'product-images', 
        true, 
        10485760, -- 10MB limit
        ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    ),
    (
        'inventory-images', 
        'inventory-images', 
        true, 
        10485760, -- 10MB limit
        ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    ),
    (
        'user-avatars', 
        'user-avatars', 
        true, 
        5242880, -- 5MB limit
        ARRAY['image/jpeg', 'image/png', 'image/webp']
    )
ON CONFLICT (id) DO UPDATE SET
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- =============================================================================
-- STORAGE POLICIES
-- =============================================================================

-- Drop existing policies if they exist (for re-running migration)
DROP POLICY IF EXISTS "Design images upload policy" ON storage.objects;
DROP POLICY IF EXISTS "Design images read policy" ON storage.objects;
DROP POLICY IF EXISTS "Design images update policy" ON storage.objects;
DROP POLICY IF EXISTS "Design images delete policy" ON storage.objects;

DROP POLICY IF EXISTS "Product images upload policy" ON storage.objects;
DROP POLICY IF EXISTS "Product images read policy" ON storage.objects;
DROP POLICY IF EXISTS "Product images update policy" ON storage.objects;
DROP POLICY IF EXISTS "Product images delete policy" ON storage.objects;

DROP POLICY IF EXISTS "Inventory images upload policy" ON storage.objects;
DROP POLICY IF EXISTS "Inventory images read policy" ON storage.objects;
DROP POLICY IF EXISTS "Inventory images update policy" ON storage.objects;
DROP POLICY IF EXISTS "Inventory images delete policy" ON storage.objects;

DROP POLICY IF EXISTS "User avatars upload policy" ON storage.objects;
DROP POLICY IF EXISTS "User avatars read policy" ON storage.objects;
DROP POLICY IF EXISTS "User avatars update policy" ON storage.objects;
DROP POLICY IF EXISTS "User avatars delete policy" ON storage.objects;

-- Design Images Policies
CREATE POLICY "Design images upload policy" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'design-images' AND 
        auth.role() = 'authenticated' AND
        -- File path should be user_id/design_id/filename.ext
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Design images read policy" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'design-images'
        -- Public read access for design images
    );

CREATE POLICY "Design images update policy" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'design-images' AND 
        auth.role() = 'authenticated' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Design images delete policy" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'design-images' AND 
        (
            -- Users can delete their own images
            (storage.foldername(name))[1] = auth.uid()::text OR
            -- Admins can delete any images
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE id = auth.uid() AND is_admin = true
            )
        )
    );

-- Product Images Policies
CREATE POLICY "Product images upload policy" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'product-images' AND 
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND is_admin = true
        )
    );

CREATE POLICY "Product images read policy" ON storage.objects
    FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "Product images update policy" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'product-images' AND 
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND is_admin = true
        )
    );

CREATE POLICY "Product images delete policy" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'product-images' AND 
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- Inventory Images Policies
CREATE POLICY "Inventory images upload policy" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'inventory-images' AND 
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND is_admin = true
        )
    );

CREATE POLICY "Inventory images read policy" ON storage.objects
    FOR SELECT USING (bucket_id = 'inventory-images');

CREATE POLICY "Inventory images update policy" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'inventory-images' AND 
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND is_admin = true
        )
    );

CREATE POLICY "Inventory images delete policy" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'inventory-images' AND 
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() AND is_admin = true
        )
    );

-- User Avatar Policies
CREATE POLICY "User avatars upload policy" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'user-avatars' AND 
        auth.role() = 'authenticated' AND
        -- File path should be user_id/filename.ext
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "User avatars read policy" ON storage.objects
    FOR SELECT USING (bucket_id = 'user-avatars');

CREATE POLICY "User avatars update policy" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'user-avatars' AND 
        auth.role() = 'authenticated' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "User avatars delete policy" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'user-avatars' AND 
        (
            -- Users can delete their own avatars
            (storage.foldername(name))[1] = auth.uid()::text OR
            -- Admins can delete any avatars
            EXISTS (
                SELECT 1 FROM profiles 
                WHERE id = auth.uid() AND is_admin = true
            )
        )
    );

-- =============================================================================
-- STORAGE UTILITY FUNCTIONS
-- =============================================================================

-- Function to generate design image URL
CREATE OR REPLACE FUNCTION get_design_image_url(user_id UUID, design_id UUID, filename TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN format('design-images/%s/%s/%s', user_id, design_id, filename);
END;
$$ LANGUAGE plpgsql;

-- Function to generate product image URL
CREATE OR REPLACE FUNCTION get_product_image_url(product_id UUID, filename TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN format('product-images/%s/%s', product_id, filename);
END;
$$ LANGUAGE plpgsql;

-- Function to generate inventory image URL
CREATE OR REPLACE FUNCTION get_inventory_image_url(inventory_id UUID, filename TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN format('inventory-images/%s/%s', inventory_id, filename);
END;
$$ LANGUAGE plpgsql;

-- Function to generate user avatar URL
CREATE OR REPLACE FUNCTION get_user_avatar_url(user_id UUID, filename TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN format('user-avatars/%s/%s', user_id, filename);
END;
$$ LANGUAGE plpgsql;

-- Function to clean up orphaned images
CREATE OR REPLACE FUNCTION cleanup_orphaned_images()
RETURNS TABLE(
    bucket_name TEXT,
    file_path TEXT,
    action TEXT
) AS $$
DECLARE
    orphaned_design_images RECORD;
    orphaned_product_images RECORD;
    orphaned_inventory_images RECORD;
BEGIN
    -- Find orphaned design images (designs that no longer exist)
    FOR orphaned_design_images IN
        SELECT o.name, o.bucket_id
        FROM storage.objects o
        WHERE o.bucket_id = 'design-images'
        AND NOT EXISTS (
            SELECT 1 FROM designs d
            WHERE d.id::text = (string_to_array(o.name, '/'))[2]
            AND d.user_id::text = (string_to_array(o.name, '/'))[1]
        )
    LOOP
        -- Mark for deletion (actual deletion would be done by admin)
        RETURN QUERY SELECT 
            orphaned_design_images.bucket_id,
            orphaned_design_images.name,
            'ORPHANED_DESIGN_IMAGE'::TEXT;
    END LOOP;
    
    -- Find orphaned product images
    FOR orphaned_product_images IN
        SELECT o.name, o.bucket_id
        FROM storage.objects o
        WHERE o.bucket_id = 'product-images'
        AND NOT EXISTS (
            SELECT 1 FROM products p
            WHERE p.id::text = (string_to_array(o.name, '/'))[1]
        )
    LOOP
        RETURN QUERY SELECT 
            orphaned_product_images.bucket_id,
            orphaned_product_images.name,
            'ORPHANED_PRODUCT_IMAGE'::TEXT;
    END LOOP;
    
    -- Find orphaned inventory images
    FOR orphaned_inventory_images IN
        SELECT o.name, o.bucket_id
        FROM storage.objects o
        WHERE o.bucket_id = 'inventory-images'
        AND NOT EXISTS (
            SELECT 1 FROM inventory i
            WHERE i.id::text = (string_to_array(o.name, '/'))[1]
        )
    LOOP
        RETURN QUERY SELECT 
            orphaned_inventory_images.bucket_id,
            orphaned_inventory_images.name,
            'ORPHANED_INVENTORY_IMAGE'::TEXT;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to get storage usage statistics
CREATE OR REPLACE FUNCTION get_storage_usage_stats()
RETURNS TABLE(
    bucket_name TEXT,
    file_count BIGINT,
    total_size_mb NUMERIC,
    avg_file_size_kb NUMERIC,
    largest_file_mb NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        o.bucket_id as bucket_name,
        COUNT(*) as file_count,
        ROUND(SUM(o.metadata->>'size'::text)::numeric / 1024.0 / 1024.0, 2) as total_size_mb,
        ROUND(AVG(o.metadata->>'size'::text)::numeric / 1024.0, 2) as avg_file_size_kb,
        ROUND(MAX(o.metadata->>'size'::text)::numeric / 1024.0 / 1024.0, 2) as largest_file_mb
    FROM storage.objects o
    WHERE o.metadata->>'size' IS NOT NULL
    GROUP BY o.bucket_id
    ORDER BY total_size_mb DESC;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- IMAGE OPTIMIZATION TRIGGERS
-- =============================================================================

-- Function to validate image uploads
CREATE OR REPLACE FUNCTION validate_image_upload()
RETURNS TRIGGER AS $$
DECLARE
    file_size_bytes BIGINT;
    max_size_bytes BIGINT;
    mime_type TEXT;
    allowed_types TEXT[];
BEGIN
    -- Get file metadata
    file_size_bytes := (NEW.metadata->>'size')::BIGINT;
    mime_type := NEW.metadata->>'mimetype';
    
    -- Get bucket limits
    SELECT file_size_limit, allowed_mime_types
    INTO max_size_bytes, allowed_types
    FROM storage.buckets
    WHERE id = NEW.bucket_id;
    
    -- Validate file size
    IF file_size_bytes > max_size_bytes THEN
        RAISE EXCEPTION 'File size (% bytes) exceeds limit (% bytes) for bucket %', 
            file_size_bytes, max_size_bytes, NEW.bucket_id;
    END IF;
    
    -- Validate MIME type
    IF NOT (mime_type = ANY(allowed_types)) THEN
        RAISE EXCEPTION 'MIME type % not allowed for bucket %. Allowed types: %', 
            mime_type, NEW.bucket_id, array_to_string(allowed_types, ', ');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for image validation
CREATE TRIGGER validate_image_upload_trigger
    BEFORE INSERT ON storage.objects
    FOR EACH ROW
    EXECUTE FUNCTION validate_image_upload();

-- =============================================================================
-- STORAGE MAINTENANCE PROCEDURES
-- =============================================================================

-- Function to generate storage cleanup report
CREATE OR REPLACE FUNCTION generate_storage_cleanup_report()
RETURNS TABLE(
    report_section TEXT,
    item_count BIGINT,
    total_size_mb NUMERIC,
    details TEXT
) AS $$
BEGIN
    -- Overall storage usage
    RETURN QUERY
    SELECT 
        'Total Storage Usage'::TEXT,
        COUNT(*)::BIGINT,
        ROUND(SUM(metadata->>'size'::text)::numeric / 1024.0 / 1024.0, 2),
        'All files across all buckets'::TEXT
    FROM storage.objects;
    
    -- Usage by bucket
    INSERT INTO temp_storage_report
    SELECT 
        'By Bucket: ' || bucket_id,
        COUNT(*),
        ROUND(SUM(metadata->>'size'::text)::numeric / 1024.0 / 1024.0, 2),
        'Files in ' || bucket_id || ' bucket'
    FROM storage.objects
    GROUP BY bucket_id;
    
    -- Orphaned files
    RETURN QUERY
    SELECT 
        'Orphaned Files'::TEXT,
        COUNT(*)::BIGINT,
        ROUND(SUM(metadata->>'size'::text)::numeric / 1024.0 / 1024.0, 2),
        'Files that can be cleaned up'::TEXT
    FROM (SELECT * FROM cleanup_orphaned_images()) orphaned
    JOIN storage.objects o ON o.name = orphaned.file_path;
    
    -- Large files (>5MB)
    RETURN QUERY
    SELECT 
        'Large Files (>5MB)'::TEXT,
        COUNT(*)::BIGINT,
        ROUND(SUM(metadata->>'size'::text)::numeric / 1024.0 / 1024.0, 2),
        'Files larger than 5MB'::TEXT
    FROM storage.objects
    WHERE (metadata->>'size')::BIGINT > 5242880;
END;
$$ LANGUAGE plpgsql;

-- Create temporary table for reports if needed
CREATE TEMP TABLE IF NOT EXISTS temp_storage_report (
    report_section TEXT,
    item_count BIGINT,
    total_size_mb NUMERIC,
    details TEXT
);

-- =============================================================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON FUNCTION get_design_image_url(UUID, UUID, TEXT) IS 
'Generates standardized design image URL path: design-images/user_id/design_id/filename';

COMMENT ON FUNCTION cleanup_orphaned_images() IS 
'Identifies orphaned images that can be safely deleted (referenced entities no longer exist)';

COMMENT ON FUNCTION get_storage_usage_stats() IS 
'Provides storage usage statistics by bucket for monitoring and capacity planning';

COMMENT ON TRIGGER validate_image_upload_trigger ON storage.objects IS 
'Validates file size and MIME type constraints on image uploads';

-- This completes the storage configuration setup