#!/usr/bin/env node

/**
 * TV Interfaces Database Performance Optimization Script
 *
 * This script fixes the timeout issues by:
 * 1. Adding proper composite indexes for common query patterns
 * 2. Removing redundant indexes
 * 3. Updating table statistics
 *
 * Run with: node optimize_tv_interfaces_db.js
 */

import { query, testConnection } from "./src/utils/database.js";

async function optimizeTVInterfacesDatabase() {
  console.log("🔧 Starting TV Interfaces Database Optimization...");

  try {
    // Test connection first
    console.log("📊 Testing database connection...");
    const connectionTest = await testConnection();
    if (!connectionTest.success) {
      throw new Error("Database connection failed: " + connectionTest.error);
    }
    console.log("✅ Database connection successful");

    // 1. Add composite index for the most common query pattern
    console.log(
      "📇 Creating composite index for device_id + is_active + created_at...",
    );
    await query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tv_interfaces_device_active_created 
      ON tv_interfaces(device_id, is_active, created_at DESC)
    `);
    console.log("✅ Composite index created");

    // 2. Drop redundant partial index (if it exists)
    console.log("🗑️ Removing redundant partial index...");
    try {
      await query("DROP INDEX IF EXISTS idx_tv_interfaces_active_only");
      console.log("✅ Redundant index removed");
    } catch (error) {
      console.log("ℹ️ Redundant index not found (already optimized)");
    }

    // 3. Add index for update operations
    console.log("📇 Creating index for update operations...");
    await query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tv_interfaces_id_active 
      ON tv_interfaces(id, is_active) WHERE is_active = true
    `);
    console.log("✅ Update operations index created");

    // 4. Add monitoring index for large screenshot data
    console.log("📇 Creating monitoring index for large screenshots...");
    await query(`
      CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tv_interfaces_screenshot_size 
      ON tv_interfaces(device_id) WHERE length(screenshot_data) > 1048576
    `);
    console.log("✅ Screenshot monitoring index created");

    // 5. Update table statistics
    console.log("📊 Updating table statistics...");
    await query("ANALYZE tv_interfaces");
    console.log("✅ Statistics updated");

    // 6. Show optimization results
    console.log("📈 Getting optimization results...");

    const sizeResult = await query(`
      SELECT 
        pg_size_pretty(pg_relation_size('tv_interfaces')) AS table_size,
        pg_size_pretty(pg_indexes_size('tv_interfaces')) AS indexes_size
    `);

    const countResult = await query(`
      SELECT 
        count(*) AS total_rows,
        count(*) FILTER (WHERE is_active = true) AS active_rows,
        count(*) FILTER (WHERE length(screenshot_data) > 1048576) AS large_screenshots
      FROM tv_interfaces
    `);

    const indexesResult = await query(`
      SELECT 
        indexname,
        indexdef
      FROM pg_indexes 
      WHERE tablename = 'tv_interfaces' 
      AND indexname LIKE 'idx_tv_interfaces_%'
      ORDER BY indexname
    `);

    console.log("\n📊 Optimization Results:");
    console.log("========================");
    console.log("Table size:", sizeResult.rows[0].table_size);
    console.log("Indexes size:", sizeResult.rows[0].indexes_size);
    console.log("Total rows:", countResult.rows[0].total_rows);
    console.log("Active rows:", countResult.rows[0].active_rows);
    console.log(
      "Large screenshots (>1MB):",
      countResult.rows[0].large_screenshots,
    );

    console.log("\n📇 Available Indexes:");
    indexesResult.rows.forEach((index) => {
      console.log(`  ${index.indexname}`);
    });

    console.log(
      "\n🎉 TV Interfaces database optimization completed successfully!",
    );
    console.log("💡 The timeout issues should now be resolved.");
  } catch (error) {
    console.error("❌ Optimization failed:", error.message);
    console.error("Stack:", error.stack);
    process.exit(1);
  }
}

// Run the optimization
optimizeTVInterfacesDatabase()
  .then(() => {
    console.log("✅ Script completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Script failed:", error.message);
    process.exit(1);
  });
