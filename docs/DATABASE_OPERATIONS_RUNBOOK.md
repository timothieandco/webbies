# Database Operations Runbook
## Timothie & Co Jewelry Customizer

### Table of Contents
1. [Emergency Procedures](#emergency-procedures)
2. [Daily Operations](#daily-operations)
3. [Backup Procedures](#backup-procedures)
4. [Disaster Recovery](#disaster-recovery)
5. [Performance Monitoring](#performance-monitoring)
6. [Troubleshooting Guide](#troubleshooting-guide)

---

## Emergency Procedures

### 🚨 Database Down (3AM Alert)

**Immediate Actions (RTO: 15 minutes)**

1. **Check Supabase Dashboard**
   - Login to Supabase console
   - Check project status and health metrics
   - Verify database connectivity

2. **Quick Diagnostics**
   ```sql
   -- Check active connections
   SELECT COUNT(*) FROM pg_stat_activity;
   
   -- Check for blocking queries
   SELECT * FROM pg_stat_activity WHERE wait_event_type = 'Lock';
   
   -- Check database size
   SELECT pg_size_pretty(pg_database_size(current_database()));
   ```

3. **Connection Pool Issues**
   ```sql
   -- Kill problematic connections
   SELECT pg_terminate_backend(pid) 
   FROM pg_stat_activity 
   WHERE state = 'idle in transaction' 
   AND query_start < NOW() - INTERVAL '10 minutes';
   ```

4. **Escalation Path**
   - Supabase Support (if platform issue)
   - Dev Team Lead
   - System Administrator

### 🔥 High CPU/Memory Usage

**Immediate Actions**

1. **Identify Resource Hogs**
   ```sql
   -- Find long-running queries
   SELECT query, state, query_start, 
          NOW() - query_start AS duration
   FROM pg_stat_activity 
   WHERE state = 'active' 
   ORDER BY query_start;
   ```

2. **Kill Problem Queries**
   ```sql
   -- Terminate specific query
   SELECT pg_cancel_backend(pid) FROM pg_stat_activity WHERE pid = [PID];
   
   -- If cancel doesn't work, force terminate
   SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE pid = [PID];
   ```

3. **Emergency Maintenance**
   ```sql
   SELECT * FROM perform_routine_maintenance();
   ```

### 💾 Storage Space Critical

**Immediate Actions**

1. **Check Storage Usage**
   ```sql
   SELECT * FROM get_storage_usage_stats();
   ```

2. **Clean Up Orphaned Files**
   ```sql
   SELECT * FROM cleanup_orphaned_images();
   ```

3. **Archive Old Data**
   ```sql
   -- Archive orders older than 2 years
   UPDATE orders 
   SET notes = COALESCE(notes, '') || ' [ARCHIVED]'
   WHERE status = 'delivered' 
   AND delivered_at < NOW() - INTERVAL '2 years';
   ```

---

## Daily Operations

### Morning Checklist (9 AM)

1. **Health Check**
   ```sql
   SELECT * FROM check_system_health();
   ```

2. **Inventory Alerts**
   ```sql
   -- Check low stock items
   SELECT title, available_quantity, store_name 
   FROM inventory 
   WHERE status = 'low_stock' AND is_active = true;
   
   -- Check out of stock items
   SELECT title, quantity, reserved_quantity 
   FROM inventory 
   WHERE status = 'out_of_stock' AND is_active = true;
   ```

3. **Order Processing Status**
   ```sql
   -- Pending orders needing attention
   SELECT order_number, created_at, total_amount, customer_email
   FROM orders 
   WHERE status = 'pending' AND payment_status = 'paid'
   ORDER BY created_at;
   
   -- Orders ready to ship
   SELECT order_number, customer_name, shipping_city, shipping_state
   FROM orders 
   WHERE status = 'processing' AND shipped_at IS NULL;
   ```

4. **Performance Metrics**
   ```sql
   SELECT * FROM analyze_index_usage() LIMIT 10;
   SELECT * FROM find_unused_indexes();
   ```

### Evening Checklist (6 PM)

1. **Backup Verification**
   ```sql
   SELECT * FROM validate_backup_integrity();
   ```

2. **Daily Summary**
   ```sql
   -- Today's activity summary
   SELECT 
       COUNT(CASE WHEN created_at::date = CURRENT_DATE THEN 1 END) as new_orders,
       COUNT(CASE WHEN status = 'shipped' AND shipped_at::date = CURRENT_DATE THEN 1 END) as shipped_orders,
       SUM(CASE WHEN created_at::date = CURRENT_DATE THEN total_amount ELSE 0 END) as daily_revenue
   FROM orders;
   
   -- New designs created today
   SELECT COUNT(*) as new_designs 
   FROM designs 
   WHERE created_at::date = CURRENT_DATE;
   ```

3. **Maintenance Tasks**
   ```sql
   SELECT * FROM perform_routine_maintenance();
   ```

---

## Backup Procedures

### Automated Backups

**Supabase handles automated backups, but verify:**

1. **Check Backup Status**
   - Login to Supabase Dashboard
   - Navigate to Settings > Database
   - Verify Point-in-Time Recovery is enabled
   - Check last backup timestamp

2. **Manual Backup Triggers**
   ```sql
   -- Before major operations
   SELECT create_backup_metadata('pre_operation', 'Before inventory import');
   
   -- Weekly full backup validation
   SELECT * FROM validate_backup_integrity();
   ```

### Manual Backup Process

1. **Schema Backup**
   ```bash
   pg_dump --schema-only --no-owner --no-privileges \
     postgresql://[connection_string] > schema_backup_$(date +%Y%m%d).sql
   ```

2. **Data Backup**
   ```bash
   pg_dump --data-only --no-owner --no-privileges \
     postgresql://[connection_string] > data_backup_$(date +%Y%m%d).sql
   ```

3. **Storage Backup**
   - Use Supabase Storage API or dashboard to download files
   - Backup critical design images and product photos

### Backup Validation

**Monthly Validation Process:**

1. **Integrity Check**
   ```sql
   SELECT * FROM validate_backup_integrity();
   ```

2. **Test Restore (Staging Environment)**
   - Create staging database
   - Restore from backup
   - Run validation scripts
   - Test application functionality

---

## Disaster Recovery

### Recovery Scenarios

#### Scenario 1: Database Corruption
**RTO: 2 hours, RPO: 15 minutes**

1. **Assessment**
   ```sql
   SELECT * FROM validate_recovery();
   ```

2. **Point-in-Time Recovery**
   - Use Supabase Dashboard
   - Select recovery point (within last 7 days)
   - Initiate restore process

3. **Post-Recovery Validation**
   ```sql
   SELECT * FROM validate_recovery();
   SELECT * FROM check_system_health();
   ```

#### Scenario 2: Complete Platform Failure
**RTO: 4 hours, RPO: 1 hour**

1. **Emergency Setup**
   - Provision new Supabase project
   - Configure connection strings
   - Update DNS if needed

2. **Data Recovery**
   ```bash
   # Restore schema
   psql postgresql://[new_connection] < schema_backup.sql
   
   # Restore data
   psql postgresql://[new_connection] < data_backup.sql
   ```

3. **Application Reconfiguration**
   - Update environment variables
   - Test all endpoints
   - Verify user authentication

### Recovery Testing

**Quarterly DR Drill:**

1. **Preparation**
   ```sql
   SELECT * FROM prepare_disaster_recovery();
   ```

2. **Execution**
   - Follow scenario-specific procedures
   - Document timing and issues
   - Validate recovery completeness

3. **Post-Drill Review**
   - Update procedures based on learnings
   - Improve automation where possible
   - Train team on any changes

---

## Performance Monitoring

### Key Metrics to Monitor

1. **Database Performance**
   ```sql
   -- Query performance
   SELECT query, calls, total_time, mean_time
   FROM pg_stat_statements 
   ORDER BY total_time DESC LIMIT 10;
   
   -- Index usage
   SELECT * FROM analyze_index_usage() 
   WHERE idx_scan < 100;
   ```

2. **Application Metrics**
   ```sql
   -- Active users
   SELECT COUNT(DISTINCT user_id) as active_users
   FROM designs 
   WHERE created_at > NOW() - INTERVAL '24 hours';
   
   -- Order conversion rate
   SELECT 
       COUNT(CASE WHEN status != 'pending' THEN 1 END)::float / 
       COUNT(*)::float * 100 as conversion_rate
   FROM orders 
   WHERE created_at > NOW() - INTERVAL '7 days';
   ```

3. **Resource Utilization**
   ```sql
   SELECT * FROM get_storage_usage_stats();
   SELECT * FROM check_system_health();
   ```

### Alert Thresholds

| Metric | Warning | Critical | Action |
|--------|---------|----------|--------|
| DB Size | > 8GB | > 10GB | Clean up archives |
| Connections | > 60 | > 80 | Kill idle connections |
| Query Time | > 5s | > 10s | Investigate and optimize |
| Low Stock | > 5 items | > 10 items | Reorder inventory |
| Failed Queries | > 5/hour | > 20/hour | Check application logs |

---

## Troubleshooting Guide

### Common Issues

#### Slow Query Performance

**Symptoms:** High response times, CPU usage

**Diagnosis:**
```sql
-- Find slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
WHERE mean_time > 1000 
ORDER BY mean_time DESC;

-- Check for missing indexes
SELECT * FROM find_unused_indexes();
```

**Resolution:**
- Add appropriate indexes
- Optimize query structure
- Consider query caching

#### Connection Pool Exhaustion

**Symptoms:** "Too many connections" errors

**Diagnosis:**
```sql
SELECT state, COUNT(*) 
FROM pg_stat_activity 
GROUP BY state;
```

**Resolution:**
```sql
-- Kill idle connections
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE state = 'idle' 
AND query_start < NOW() - INTERVAL '1 hour';
```

#### Inventory Synchronization Issues

**Symptoms:** Negative available quantities

**Diagnosis:**
```sql
SELECT id, title, quantity, reserved_quantity, available_quantity
FROM inventory 
WHERE available_quantity < 0;
```

**Resolution:**
```sql
-- Reset reserved quantities
UPDATE inventory 
SET reserved_quantity = 0 
WHERE available_quantity < 0;

-- Audit order items for consistency
SELECT oi.order_id, oi.used_inventory_items
FROM order_items oi
JOIN orders o ON oi.order_id = o.id
WHERE o.status = 'cancelled';
```

### Emergency Contacts

| Role | Contact | Availability |
|------|---------|-------------|
| Database Admin | [Your contact] | 24/7 |
| Dev Team Lead | [Contact] | Business hours |
| Supabase Support | support@supabase.io | 24/7 (Enterprise) |
| System Admin | [Contact] | On-call rotation |

### Escalation Matrix

1. **Level 1:** Application errors, minor performance issues
2. **Level 2:** Database connectivity issues, moderate performance degradation
3. **Level 3:** Complete service outage, data corruption, security breach

---

## Maintenance Calendar

### Daily
- [ ] Health check monitoring
- [ ] Inventory status review
- [ ] Order processing queue
- [ ] Basic performance metrics

### Weekly
- [ ] Full VACUUM on large tables
- [ ] Storage cleanup
- [ ] Performance analysis
- [ ] Backup validation

### Monthly
- [ ] Complete backup testing
- [ ] Capacity planning review
- [ ] Security audit
- [ ] Index optimization review

### Quarterly
- [ ] Disaster recovery drill
- [ ] Full performance optimization
- [ ] Database upgrade planning
- [ ] Documentation review

---

## Contact Information

- **Database Administrator:** [Your Name] - [Contact]
- **Supabase Project URL:** [Your Supabase URL]
- **Emergency Escalation:** [Emergency contact]
- **Documentation Repository:** [Repo URL]

---

*Last Updated: 2025-08-02*
*Next Review: 2025-11-02*