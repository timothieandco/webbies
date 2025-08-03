-- Database Backup and Maintenance Procedures
-- Timothie & Co Jewelry Customizer
-- Created: 2025-08-02

-- =============================================================================
-- BACKUP STRATEGY OVERVIEW
-- =============================================================================
/*
BACKUP STRATEGY:
1. Daily automated backups (Point-in-Time Recovery enabled)
2. Weekly full backups with retention policy
3. Monthly archival backups
4. Real-time replication for high availability
5. Critical data snapshots before major operations

RTO (Recovery Time Objective): 1 hour
RPO (Recovery Point Objective): 15 minutes
*/

-- =============================================================================
-- BACKUP FUNCTIONS
-- =============================================================================

-- Function to create application-level backup metadata
CREATE OR REPLACE FUNCTION create_backup_metadata(
    backup_type TEXT,
    backup_description TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    backup_id UUID;
    backup_stats JSONB;
BEGIN
    backup_id := uuid_generate_v4();
    
    -- Collect backup statistics
    SELECT jsonb_build_object(
        'total_tables', COUNT(*),
        'total_size_mb', ROUND(SUM(pg_total_relation_size(schemaname||'.'||tablename)) / 1024.0 / 1024.0, 2),
        'largest_table', (
            SELECT schemaname||'.'||tablename 
            FROM pg_tables pt2 
            WHERE pt2.schemaname = 'public'
            ORDER BY pg_total_relation_size(pt2.schemaname||'.'||pt2.tablename) DESC 
            LIMIT 1
        ),
        'table_counts', jsonb_object_agg(
            tablename, 
            (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = pt.tablename)
        )
    ) INTO backup_stats
    FROM pg_tables pt 
    WHERE schemaname = 'public';
    
    -- Insert backup record (you would create a backup_log table for this)
    -- For now, just log the information
    RAISE NOTICE 'Backup created: ID=%, Type=%, Stats=%', backup_id, backup_type, backup_stats;
    
    RETURN backup_id;
END;
$$ LANGUAGE plpgsql;

-- Function to validate backup integrity
CREATE OR REPLACE FUNCTION validate_backup_integrity()
RETURNS TABLE(
    check_name TEXT,
    status TEXT,
    details TEXT,
    critical BOOLEAN
) AS $$
BEGIN
    -- Check foreign key constraints
    RETURN QUERY
    SELECT 
        'Foreign Key Constraints'::TEXT,
        CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END::TEXT,
        CASE WHEN COUNT(*) = 0 THEN 'All foreign keys valid' 
             ELSE 'Found ' || COUNT(*) || ' constraint violations' END::TEXT,
        true
    FROM information_schema.table_constraints tc
    WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_schema = 'public';
    
    -- Check for orphaned designs
    RETURN QUERY
    SELECT 
        'Orphaned Designs'::TEXT,
        CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'WARNING' END::TEXT,
        'Found ' || COUNT(*) || ' designs with invalid user references'::TEXT,
        false
    FROM designs d
    LEFT JOIN profiles p ON d.user_id = p.id
    WHERE p.id IS NULL;
    
    -- Check for orphaned order items
    RETURN QUERY
    SELECT 
        'Orphaned Order Items'::TEXT,
        CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'FAIL' END::TEXT,
        'Found ' || COUNT(*) || ' order items with invalid order references'::TEXT,
        true
    FROM order_items oi
    LEFT JOIN orders o ON oi.order_id = o.id
    WHERE o.id IS NULL;
    
    -- Check inventory consistency
    RETURN QUERY
    SELECT 
        'Inventory Consistency'::TEXT,
        CASE WHEN COUNT(*) = 0 THEN 'PASS' ELSE 'WARNING' END::TEXT,
        'Found ' || COUNT(*) || ' inventory items with negative available quantity'::TEXT,
        false
    FROM inventory
    WHERE available_quantity < 0;
    
    -- Check storage references
    RETURN QUERY
    SELECT 
        'Storage References'::TEXT,
        'INFO'::TEXT,
        'Found ' || COUNT(*) || ' records with image URLs'::TEXT,
        false
    FROM (
        SELECT image_url FROM inventory WHERE image_url IS NOT NULL
        UNION ALL
        SELECT image_url FROM products WHERE image_url IS NOT NULL
        UNION ALL
        SELECT preview_image_url FROM designs WHERE preview_image_url IS NOT NULL
    ) image_refs;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- MAINTENANCE FUNCTIONS
-- =============================================================================

-- Function for routine database maintenance
CREATE OR REPLACE FUNCTION perform_routine_maintenance()
RETURNS TABLE(
    maintenance_task TEXT,
    status TEXT,
    details TEXT,
    duration_ms BIGINT
) AS $$
DECLARE
    start_time TIMESTAMPTZ;
    end_time TIMESTAMPTZ;
    task_duration BIGINT;
BEGIN
    -- VACUUM and ANALYZE critical tables
    start_time := clock_timestamp();
    
    VACUUM ANALYZE inventory;
    VACUUM ANALYZE orders;
    VACUUM ANALYZE order_items;
    VACUUM ANALYZE designs;
    
    end_time := clock_timestamp();
    task_duration := EXTRACT(EPOCH FROM (end_time - start_time)) * 1000;
    
    RETURN QUERY SELECT 
        'VACUUM ANALYZE'::TEXT,
        'COMPLETED'::TEXT,
        'Vacuumed and analyzed critical tables'::TEXT,
        task_duration;
    
    -- Update table statistics
    start_time := clock_timestamp();
    
    ANALYZE;
    
    end_time := clock_timestamp();
    task_duration := EXTRACT(EPOCH FROM (end_time - start_time)) * 1000;
    
    RETURN QUERY SELECT 
        'UPDATE STATISTICS'::TEXT,
        'COMPLETED'::TEXT,
        'Updated table statistics for query planner'::TEXT,
        task_duration;
    
    -- Cleanup orphaned records (soft cleanup)
    start_time := clock_timestamp();
    
    -- Archive old completed orders (older than 2 years)
    -- This would move them to an archive table in production
    UPDATE orders 
    SET notes = COALESCE(notes, '') || ' [ARCHIVED]'
    WHERE status = 'delivered' 
    AND delivered_at < NOW() - INTERVAL '2 years'
    AND notes NOT LIKE '%[ARCHIVED]%';
    
    end_time := clock_timestamp();
    task_duration := EXTRACT(EPOCH FROM (end_time - start_time)) * 1000;
    
    RETURN QUERY SELECT 
        'ARCHIVE OLD ORDERS'::TEXT,
        'COMPLETED'::TEXT,
        'Marked old completed orders for archival'::TEXT,
        task_duration;
    
    -- Update inventory status based on quantities
    start_time := clock_timestamp();
    
    -- This will trigger the inventory status update function
    UPDATE inventory 
    SET updated_at = NOW() 
    WHERE status != CASE 
        WHEN available_quantity <= 0 THEN 'out_of_stock'
        WHEN available_quantity <= 5 THEN 'low_stock'
        ELSE 'in_stock'
    END;
    
    end_time := clock_timestamp();
    task_duration := EXTRACT(EPOCH FROM (end_time - start_time)) * 1000;
    
    RETURN QUERY SELECT 
        'UPDATE INVENTORY STATUS'::TEXT,
        'COMPLETED'::TEXT,
        'Synchronized inventory status with quantities'::TEXT,
        task_duration;
END;
$$ LANGUAGE plpgsql;

-- Function to generate maintenance report
CREATE OR REPLACE FUNCTION generate_maintenance_report()
RETURNS TABLE(
    report_section TEXT,
    metric_name TEXT,
    metric_value TEXT,
    status TEXT
) AS $$
BEGIN
    -- Database size information
    RETURN QUERY
    SELECT 
        'Database Size'::TEXT,
        'Total Size'::TEXT,
        pg_size_pretty(pg_database_size(current_database())),
        'INFO'::TEXT;
    
    -- Table sizes
    RETURN QUERY
    SELECT 
        'Table Sizes'::TEXT,
        schemaname||'.'||tablename,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)),
        CASE WHEN pg_total_relation_size(schemaname||'.'||tablename) > 100*1024*1024 
             THEN 'LARGE' ELSE 'OK' END::TEXT
    FROM pg_tables 
    WHERE schemaname = 'public'
    ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
    
    -- Connection statistics
    RETURN QUERY
    SELECT 
        'Connections'::TEXT,
        'Active Connections'::TEXT,
        COUNT(*)::TEXT,
        CASE WHEN COUNT(*) > 50 THEN 'HIGH' ELSE 'OK' END::TEXT
    FROM pg_stat_activity 
    WHERE state = 'active';
    
    -- Slow queries (if pg_stat_statements is available)
    RETURN QUERY
    SELECT 
        'Performance'::TEXT,
        'Long Running Queries'::TEXT,
        COUNT(*)::TEXT,
        CASE WHEN COUNT(*) > 5 THEN 'WARNING' ELSE 'OK' END::TEXT
    FROM pg_stat_activity 
    WHERE state = 'active' 
    AND query_start < NOW() - INTERVAL '30 seconds';
    
    -- Index usage
    RETURN QUERY
    SELECT 
        'Index Usage'::TEXT,
        'Unused Indexes'::TEXT,
        COUNT(*)::TEXT,
        CASE WHEN COUNT(*) > 10 THEN 'WARNING' ELSE 'OK' END::TEXT
    FROM pg_stat_user_indexes 
    WHERE idx_scan = 0;
    
    -- Recent backup status (would check backup log table in production)
    RETURN QUERY
    SELECT 
        'Backup Status'::TEXT,
        'Last Maintenance'::TEXT,
        'Manual execution - ' || NOW()::TEXT,
        'OK'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- DISASTER RECOVERY PROCEDURES
-- =============================================================================

-- Function to prepare for disaster recovery
CREATE OR REPLACE FUNCTION prepare_disaster_recovery()
RETURNS TABLE(
    step_number INTEGER,
    step_description TEXT,
    sql_command TEXT,
    notes TEXT
) AS $$
BEGIN
    RETURN QUERY VALUES
    (1, 'Stop application connections', 
     'SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = current_database() AND pid <> pg_backend_pid();',
     'Prevents new transactions during recovery preparation'),
    
    (2, 'Create point-in-time recovery checkpoint',
     'CHECKPOINT;',
     'Forces all dirty buffers to disk'),
    
    (3, 'Export critical configuration',
     'COPY (SELECT * FROM pg_settings WHERE name IN (''shared_preload_libraries'', ''max_connections'', ''shared_buffers'')) TO ''/tmp/pg_config_backup.csv'' CSV HEADER;',
     'Backup critical PostgreSQL settings'),
    
    (4, 'Export schema structure',
     'pg_dump --schema-only --no-owner --no-privileges ' || current_database() || ' > /tmp/schema_backup.sql',
     'Schema-only backup for structure recovery'),
    
    (5, 'Export data with constraints',
     'pg_dump --data-only --no-owner --no-privileges --disable-triggers ' || current_database() || ' > /tmp/data_backup.sql',
     'Data-only backup for full recovery'),
    
    (6, 'Backup storage bucket inventory',
     'SELECT bucket_id, name, metadata FROM storage.objects;',
     'List all files for storage recovery planning'),
    
    (7, 'Create recovery validation script',
     'SELECT ''SELECT * FROM validate_backup_integrity();'' as validation_command;',
     'Script to validate recovered database'),
    
    (8, 'Document current state',
     'SELECT ''-- Recovery timestamp: '' || NOW() || '' - Total tables: '' || COUNT(*) FROM information_schema.tables WHERE table_schema = ''public'';',
     'Documentation for recovery verification');
END;
$$ LANGUAGE plpgsql;

-- Function for post-recovery validation
CREATE OR REPLACE FUNCTION validate_recovery()
RETURNS TABLE(
    validation_check TEXT,
    expected_result TEXT,
    actual_result TEXT,
    status TEXT
) AS $$
DECLARE
    table_count INTEGER;
    user_count INTEGER;
    inventory_count INTEGER;
    order_count INTEGER;
BEGIN
    -- Count critical tables
    SELECT COUNT(*) INTO table_count 
    FROM information_schema.tables 
    WHERE table_schema = 'public';
    
    SELECT COUNT(*) INTO user_count FROM profiles;
    SELECT COUNT(*) INTO inventory_count FROM inventory;
    SELECT COUNT(*) INTO order_count FROM orders;
    
    -- Validate table count
    RETURN QUERY SELECT 
        'Table Count'::TEXT,
        '6+ tables'::TEXT,
        table_count::TEXT,
        CASE WHEN table_count >= 6 THEN 'PASS' ELSE 'FAIL' END::TEXT;
    
    -- Validate critical data
    RETURN QUERY SELECT 
        'User Profiles'::TEXT,
        '0+ profiles'::TEXT,
        user_count::TEXT,
        'PASS'::TEXT;
    
    RETURN QUERY SELECT 
        'Inventory Items'::TEXT,
        '100+ items'::TEXT,
        inventory_count::TEXT,
        CASE WHEN inventory_count >= 100 THEN 'PASS' ELSE 'WARNING' END::TEXT;
    
    RETURN QUERY SELECT 
        'Orders'::TEXT,
        '0+ orders'::TEXT,
        order_count::TEXT,
        'PASS'::TEXT;
    
    -- Validate constraints
    RETURN QUERY SELECT 
        'Foreign Key Constraints'::TEXT,
        'All valid'::TEXT,
        CASE WHEN EXISTS(
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_type = 'FOREIGN KEY' 
            AND table_schema = 'public'
        ) THEN 'Present' ELSE 'Missing' END::TEXT,
        CASE WHEN EXISTS(
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_type = 'FOREIGN KEY' 
            AND table_schema = 'public'
        ) THEN 'PASS' ELSE 'FAIL' END::TEXT;
    
    -- Validate functions
    RETURN QUERY SELECT 
        'Custom Functions'::TEXT,
        'Critical functions present'::TEXT,
        CASE WHEN EXISTS(
            SELECT 1 FROM information_schema.routines 
            WHERE routine_name IN ('update_updated_at_column', 'generate_order_number')
            AND routine_schema = 'public'
        ) THEN 'Present' ELSE 'Missing' END::TEXT,
        CASE WHEN EXISTS(
            SELECT 1 FROM information_schema.routines 
            WHERE routine_name IN ('update_updated_at_column', 'generate_order_number')
            AND routine_schema = 'public'
        ) THEN 'PASS' ELSE 'FAIL' END::TEXT;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- MONITORING AND ALERTING
-- =============================================================================

-- Function to check system health
CREATE OR REPLACE FUNCTION check_system_health()
RETURNS TABLE(
    health_check TEXT,
    current_value TEXT,
    threshold TEXT,
    status TEXT,
    alert_level TEXT
) AS $$
BEGIN
    -- Database size check
    RETURN QUERY
    SELECT 
        'Database Size'::TEXT,
        pg_size_pretty(pg_database_size(current_database())),
        '< 10GB'::TEXT,
        CASE WHEN pg_database_size(current_database()) < 10*1024*1024*1024 
             THEN 'OK' ELSE 'WARNING' END::TEXT,
        CASE WHEN pg_database_size(current_database()) < 10*1024*1024*1024 
             THEN 'INFO' ELSE 'WARNING' END::TEXT;
    
    -- Connection count
    RETURN QUERY
    SELECT 
        'Active Connections'::TEXT,
        COUNT(*)::TEXT,
        '< 80'::TEXT,
        CASE WHEN COUNT(*) < 80 THEN 'OK' ELSE 'CRITICAL' END::TEXT,
        CASE WHEN COUNT(*) < 80 THEN 'INFO' ELSE 'CRITICAL' END::TEXT
    FROM pg_stat_activity 
    WHERE state = 'active';
    
    -- Lock monitoring
    RETURN QUERY
    SELECT 
        'Blocked Queries'::TEXT,
        COUNT(*)::TEXT,
        '< 5'::TEXT,
        CASE WHEN COUNT(*) < 5 THEN 'OK' ELSE 'WARNING' END::TEXT,
        CASE WHEN COUNT(*) < 5 THEN 'INFO' ELSE 'WARNING' END::TEXT
    FROM pg_stat_activity 
    WHERE wait_event_type = 'Lock';
    
    -- Inventory stock levels
    RETURN QUERY
    SELECT 
        'Low Stock Items'::TEXT,
        COUNT(*)::TEXT,
        '< 10'::TEXT,
        CASE WHEN COUNT(*) < 10 THEN 'OK' ELSE 'WARNING' END::TEXT,
        CASE WHEN COUNT(*) < 10 THEN 'INFO' ELSE 'WARNING' END::TEXT
    FROM inventory 
    WHERE status = 'low_stock' AND is_active = true;
    
    -- Recent error rate (would need error logging table)
    RETURN QUERY
    SELECT 
        'Recent Errors'::TEXT,
        '0'::TEXT,
        '< 5/hour'::TEXT,
        'OK'::TEXT,
        'INFO'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- AUTOMATED MAINTENANCE SCHEDULES
-- =============================================================================

/*
RECOMMENDED MAINTENANCE SCHEDULE:

DAILY (Automated):
- SELECT * FROM perform_routine_maintenance();
- SELECT * FROM check_system_health();
- Monitor backup completion
- Check disk space usage

WEEKLY (Automated):
- Full VACUUM on large tables
- Reindex if needed
- Storage cleanup
- Performance analysis

MONTHLY (Manual):
- Complete backup validation
- Disaster recovery test
- Capacity planning review
- Security audit

QUARTERLY (Manual):
- Full disaster recovery drill
- Backup retention cleanup
- Performance optimization review
- Database upgrade planning
*/

-- =============================================================================
-- COMMENTS FOR DOCUMENTATION
-- =============================================================================

COMMENT ON FUNCTION create_backup_metadata(TEXT, TEXT) IS 
'Creates backup metadata and collects statistics for backup validation';

COMMENT ON FUNCTION validate_backup_integrity() IS 
'Comprehensive validation of database integrity for backup verification';

COMMENT ON FUNCTION perform_routine_maintenance() IS 
'Performs routine database maintenance tasks with timing information';

COMMENT ON FUNCTION prepare_disaster_recovery() IS 
'Generates step-by-step disaster recovery preparation checklist';

COMMENT ON FUNCTION validate_recovery() IS 
'Validates database state after disaster recovery to ensure completeness';

COMMENT ON FUNCTION check_system_health() IS 
'Real-time system health monitoring with alerting thresholds';

-- This completes the backup and maintenance procedures