# Connection Pooling Setup
## Timothie & Co Jewelry Customizer

### Overview

Connection pooling is crucial for managing database connections efficiently and preventing connection exhaustion. This document outlines the recommended connection pooling setup for the Timothie & Co Jewelry Customizer application.

---

## Supabase Built-in Pooling

Supabase provides built-in connection pooling using PgBouncer. Here's how to configure it:

### Configuration Options

1. **Session Pooling (Default)**
   - Best for most applications
   - Connections are pooled at the session level
   - Use for: General application queries

2. **Transaction Pooling**
   - More aggressive pooling
   - Connections are returned to pool after each transaction
   - Use for: High-traffic, short transactions

### Supabase Pool Settings

```javascript
// Environment variables for connection pooling
const supabaseConfig = {
  url: process.env.SUPABASE_URL,
  key: process.env.SUPABASE_ANON_KEY,
  db: {
    schema: 'public',
    // Connection pooling settings
    pool: {
      max: 20,        // Maximum connections in pool
      min: 5,         // Minimum connections to maintain
      idleTimeoutMillis: 30000,  // 30 seconds
      connectionTimeoutMillis: 2000,  // 2 seconds
      maxUses: 7500,  // Maximum uses per connection
      maxLifetimeSeconds: 3600  // 1 hour max lifetime
    }
  }
};
```

---

## Application-Level Connection Management

### Node.js/Express Configuration

```javascript
// config/database.js
const { createClient } = require('@supabase/supabase-js');

class DatabaseManager {
  constructor() {
    this.supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY,
      {
        db: {
          schema: 'public'
        },
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false
        }
      }
    );
    
    // Connection pool monitoring
    this.connectionStats = {
      totalConnections: 0,
      activeConnections: 0,
      pooledConnections: 0
    };
  }

  // Get connection with automatic pooling
  async getConnection() {
    try {
      this.connectionStats.activeConnections++;
      return this.supabase;
    } catch (error) {
      console.error('Database connection error:', error);
      throw error;
    }
  }

  // Release connection back to pool
  async releaseConnection() {
    this.connectionStats.activeConnections--;
  }

  // Health check for connection pool
  async checkConnectionHealth() {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('count')
        .limit(1);
      
      if (error) throw error;
      
      return {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        stats: this.connectionStats
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}

module.exports = new DatabaseManager();
```

### Connection Pool Monitoring

```javascript
// middleware/connectionMonitor.js
const databaseManager = require('../config/database');

const connectionMonitor = async (req, res, next) => {
  const startTime = Date.now();
  
  // Monitor connection usage
  req.on('close', () => {
    const duration = Date.now() - startTime;
    console.log(`Request completed in ${duration}ms`);
    
    // Log slow requests
    if (duration > 5000) {
      console.warn(`Slow request detected: ${req.url} took ${duration}ms`);
    }
  });
  
  next();
};

// Health check endpoint
const healthCheck = async (req, res) => {
  try {
    const health = await databaseManager.checkConnectionHealth();
    
    res.status(health.status === 'healthy' ? 200 : 500).json({
      database: health,
      pool: {
        active: databaseManager.connectionStats.activeConnections,
        total: databaseManager.connectionStats.totalConnections
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Health check failed',
      message: error.message
    });
  }
};

module.exports = { connectionMonitor, healthCheck };
```

---

## Frontend Connection Management

### React/JavaScript Configuration

```javascript
// utils/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10  // Limit realtime events
    }
  }
});

// Connection wrapper with retry logic
export class DatabaseConnection {
  static async executeQuery(queryFn, retries = 3) {
    for (let i = 0; i < retries; i++) {
      try {
        return await queryFn();
      } catch (error) {
        console.error(`Query attempt ${i + 1} failed:`, error);
        
        if (i === retries - 1) throw error;
        
        // Exponential backoff
        await new Promise(resolve => 
          setTimeout(resolve, Math.pow(2, i) * 1000)
        );
      }
    }
  }

  static async withConnection(callback) {
    try {
      return await this.executeQuery(callback);
    } catch (error) {
      console.error('Database operation failed:', error);
      throw error;
    }
  }
}
```

### React Hook for Database Operations

```javascript
// hooks/useDatabase.js
import { useState, useCallback } from 'react';
import { DatabaseConnection } from '../utils/supabaseClient';

export const useDatabase = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const executeQuery = useCallback(async (queryFn) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await DatabaseConnection.withConnection(queryFn);
      return result;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { executeQuery, loading, error };
};
```

---

## Monitoring and Alerting

### Connection Pool Metrics

```sql
-- Database-level connection monitoring
CREATE OR REPLACE FUNCTION get_connection_stats()
RETURNS TABLE(
    metric_name TEXT,
    current_value INTEGER,
    max_value INTEGER,
    status TEXT
) AS $$
BEGIN
    -- Active connections
    RETURN QUERY
    SELECT 
        'active_connections'::TEXT,
        COUNT(*)::INTEGER,
        100::INTEGER,  -- Assumed max connections
        CASE WHEN COUNT(*) < 80 THEN 'OK' 
             WHEN COUNT(*) < 95 THEN 'WARNING' 
             ELSE 'CRITICAL' END::TEXT
    FROM pg_stat_activity 
    WHERE state = 'active';
    
    -- Idle connections
    RETURN QUERY
    SELECT 
        'idle_connections'::TEXT,
        COUNT(*)::INTEGER,
        50::INTEGER,
        CASE WHEN COUNT(*) < 40 THEN 'OK' ELSE 'WARNING' END::TEXT
    FROM pg_stat_activity 
    WHERE state = 'idle';
    
    -- Long-running transactions
    RETURN QUERY
    SELECT 
        'long_transactions'::TEXT,
        COUNT(*)::INTEGER,
        5::INTEGER,
        CASE WHEN COUNT(*) = 0 THEN 'OK' 
             WHEN COUNT(*) < 3 THEN 'WARNING' 
             ELSE 'CRITICAL' END::TEXT
    FROM pg_stat_activity 
    WHERE state = 'active' 
    AND query_start < NOW() - INTERVAL '30 seconds';
END;
$$ LANGUAGE plpgsql;
```

### Application Monitoring

```javascript
// monitoring/connectionMetrics.js
class ConnectionMetrics {
  constructor() {
    this.metrics = {
      totalQueries: 0,
      successfulQueries: 0,
      failedQueries: 0,
      avgResponseTime: 0,
      activeConnections: 0
    };
    
    // Start monitoring
    this.startMonitoring();
  }

  recordQuery(duration, success = true) {
    this.metrics.totalQueries++;
    
    if (success) {
      this.metrics.successfulQueries++;
    } else {
      this.metrics.failedQueries++;
    }
    
    // Update average response time
    this.metrics.avgResponseTime = 
      (this.metrics.avgResponseTime + duration) / 2;
  }

  getMetrics() {
    return {
      ...this.metrics,
      successRate: this.metrics.successfulQueries / this.metrics.totalQueries,
      timestamp: new Date().toISOString()
    };
  }

  startMonitoring() {
    setInterval(() => {
      const metrics = this.getMetrics();
      
      // Log warnings
      if (metrics.successRate < 0.95) {
        console.warn('Low success rate:', metrics.successRate);
      }
      
      if (metrics.avgResponseTime > 2000) {
        console.warn('High response time:', metrics.avgResponseTime);
      }
      
      // Reset counters every hour
      if (new Date().getMinutes() === 0) {
        this.resetMetrics();
      }
    }, 60000); // Check every minute
  }

  resetMetrics() {
    this.metrics = {
      totalQueries: 0,
      successfulQueries: 0,
      failedQueries: 0,
      avgResponseTime: 0,
      activeConnections: 0
    };
  }
}

module.exports = new ConnectionMetrics();
```

---

## Performance Optimization

### Query Optimization

```javascript
// utils/queryOptimizer.js
export class QueryOptimizer {
  static async batchQueries(queries, batchSize = 10) {
    const results = [];
    
    for (let i = 0; i < queries.length; i += batchSize) {
      const batch = queries.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(query => this.executeWithRetry(query))
      );
      results.push(...batchResults);
    }
    
    return results;
  }

  static async executeWithRetry(queryFn, maxRetries = 3) {
    let lastError;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await queryFn();
      } catch (error) {
        lastError = error;
        
        // Don't retry on authentication errors
        if (error.code === '401') throw error;
        
        await this.delay(Math.pow(2, i) * 1000);
      }
    }
    
    throw lastError;
  }

  static delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### Caching Strategy

```javascript
// utils/cache.js
class QueryCache {
  constructor(ttl = 300000) { // 5 minutes default TTL
    this.cache = new Map();
    this.ttl = ttl;
  }

  get(key) {
    const item = this.cache.get(key);
    
    if (!item) return null;
    
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  set(key, data) {
    this.cache.set(key, {
      data,
      expiry: Date.now() + this.ttl
    });
  }

  clear() {
    this.cache.clear();
  }

  // Automatic cleanup
  startCleanup() {
    setInterval(() => {
      const now = Date.now();
      for (const [key, item] of this.cache.entries()) {
        if (now > item.expiry) {
          this.cache.delete(key);
        }
      }
    }, 60000); // Cleanup every minute
  }
}

export const queryCache = new QueryCache();
queryCache.startCleanup();
```

---

## Troubleshooting

### Common Connection Issues

1. **Connection Pool Exhaustion**
   ```javascript
   // Error: Too many connections
   // Solution: Implement connection limits
   const pool = {
     max: 20,
     min: 5,
     acquire: 30000,
     idle: 10000
   };
   ```

2. **Slow Query Detection**
   ```sql
   -- Find slow queries
   SELECT query, mean_time, calls
   FROM pg_stat_statements
   WHERE mean_time > 1000
   ORDER BY mean_time DESC;
   ```

3. **Connection Leaks**
   ```javascript
   // Always handle connections in try-finally
   let connection;
   try {
     connection = await getConnection();
     // Use connection
   } finally {
     if (connection) await releaseConnection(connection);
   }
   ```

### Monitoring Commands

```bash
# Check connection pool status
curl http://localhost:3000/health/database

# Monitor active connections
psql -c "SELECT state, COUNT(*) FROM pg_stat_activity GROUP BY state;"

# Check for blocking queries
psql -c "SELECT * FROM pg_stat_activity WHERE wait_event_type = 'Lock';"
```

---

## Best Practices

1. **Always Use Connection Pooling**: Never create direct connections
2. **Implement Retries**: Handle temporary connection failures
3. **Monitor Metrics**: Track connection usage and performance
4. **Set Timeouts**: Prevent hanging connections
5. **Cache Frequently Used Data**: Reduce database load
6. **Batch Operations**: Group multiple queries when possible
7. **Clean Up Resources**: Always release connections

---

*Last Updated: 2025-08-02*