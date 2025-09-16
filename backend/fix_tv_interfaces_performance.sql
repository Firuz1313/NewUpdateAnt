-- TV Interfaces Performance Optimization
-- Fixes timeout issues by adding proper composite indexes

-- 1. Add composite index for the most common query pattern
-- This query: WHERE device_id = ? AND is_active = true ORDER BY created_at DESC
-- Currently uses only single-column index on device_id, then scans/sorts
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tv_interfaces_device_active_created 
ON tv_interfaces(device_id, is_active, created_at DESC);

-- 2. Drop redundant partial index (id is already PK)
-- This partial index doesn't help and wastes space
DROP INDEX IF EXISTS idx_tv_interfaces_active_only;

-- 3. Add composite index for update operations
-- For queries: WHERE id = ? AND is_active = true
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tv_interfaces_id_active 
ON tv_interfaces(id, is_active) WHERE is_active = true;

-- 4. Add index on screenshot data size for monitoring large updates
-- This helps identify which records have large screenshot_data
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tv_interfaces_screenshot_size 
ON tv_interfaces(device_id) WHERE length(screenshot_data) > 1048576; -- 1MB+

-- 5. Update table statistics after index creation
ANALYZE tv_interfaces;

-- 6. Display optimization results
SELECT 
    'Before Optimization' as status,
    pg_size_pretty(pg_relation_size('tv_interfaces')) AS table_size,
    pg_size_pretty(pg_indexes_size('tv_interfaces')) AS indexes_size,
    (SELECT count(*) FROM tv_interfaces) AS total_rows,
    (SELECT count(*) FROM tv_interfaces WHERE is_active = true) AS active_rows;

-- Show new indexes
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'tv_interfaces' 
AND indexname LIKE 'idx_tv_interfaces_%'
ORDER BY indexname;
