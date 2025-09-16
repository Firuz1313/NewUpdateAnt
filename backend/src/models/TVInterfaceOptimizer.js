import { query } from "../utils/database.js";

/**
 * TV Interface Database Optimizer
 * Fixes performance issues causing timeouts
 */
class TVInterfaceOptimizer {
  /**
   * Run complete database optimization for TV interfaces
   */
  async optimizeDatabase() {
    console.log("🔧 Starting TV Interfaces Database Optimization...");

    const results = {
      indexesCreated: [],
      indexesDropped: [],
      statisticsUpdated: false,
      error: null,
    };

    try {
      // 1. Add composite index for the most common query pattern
      console.log(
        "📇 Creating composite index for device_id + is_active + created_at...",
      );
      await query(`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tv_interfaces_device_active_created 
        ON tv_interfaces(device_id, is_active, created_at DESC)
      `);
      results.indexesCreated.push("idx_tv_interfaces_device_active_created");
      console.log("✅ Composite index created");

      // 2. Drop redundant partial index (if it exists)
      console.log("🗑️ Removing redundant partial index...");
      try {
        await query("DROP INDEX IF EXISTS idx_tv_interfaces_active_only");
        results.indexesDropped.push("idx_tv_interfaces_active_only");
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
      results.indexesCreated.push("idx_tv_interfaces_id_active");
      console.log("✅ Update operations index created");

      // 4. Add monitoring index for large screenshot data (>10MB)
      console.log("📇 Creating monitoring index for large screenshots...");
      await query(`
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_tv_interfaces_screenshot_size
        ON tv_interfaces(device_id) WHERE length(screenshot_data) > 10485760
      `);
      results.indexesCreated.push("idx_tv_interfaces_screenshot_size");
      console.log("✅ Screenshot monitoring index created");

      // 5. Update table statistics
      console.log("📊 Updating table statistics...");
      await query("ANALYZE tv_interfaces");
      results.statisticsUpdated = true;
      console.log("✅ Statistics updated");

      console.log(
        "🎉 TV Interfaces database optimization completed successfully!",
      );
      return results;
    } catch (error) {
      console.error("❌ Optimization failed:", error.message);
      results.error = error.message;
      throw error;
    }
  }

  /**
   * Get optimization status and database metrics
   */
  async getOptimizationStatus() {
    try {
      // Check which indexes exist
      const indexesResult = await query(`
        SELECT 
          indexname,
          indexdef
        FROM pg_indexes 
        WHERE tablename = 'tv_interfaces' 
        AND indexname LIKE 'idx_tv_interfaces_%'
        ORDER BY indexname
      `);

      // Get table size and statistics
      const statsResult = await query(`
        SELECT 
          pg_size_pretty(pg_relation_size('tv_interfaces')) AS table_size,
          pg_size_pretty(pg_indexes_size('tv_interfaces')) AS indexes_size
      `);

      const countResult = await query(`
        SELECT 
          count(*) AS total_rows,
          count(*) FILTER (WHERE is_active = true) AS active_rows,
          count(*) FILTER (WHERE length(screenshot_data) > 10485760) AS large_screenshots,
          avg(length(screenshot_data))::int AS avg_screenshot_size
        FROM tv_interfaces
      `);

      // Check if optimization indexes exist
      const optimizationIndexes = [
        "idx_tv_interfaces_device_active_created",
        "idx_tv_interfaces_id_active",
        "idx_tv_interfaces_screenshot_size",
      ];

      const existingIndexes = indexesResult.rows.map((row) => row.indexname);
      const hasOptimization = optimizationIndexes.every((index) =>
        existingIndexes.includes(index),
      );

      return {
        isOptimized: hasOptimization,
        tableSize: statsResult.rows[0].table_size,
        indexesSize: statsResult.rows[0].indexes_size,
        totalRows: parseInt(countResult.rows[0].total_rows),
        activeRows: parseInt(countResult.rows[0].active_rows),
        largeScreenshots: parseInt(countResult.rows[0].large_screenshots),
        avgScreenshotSize: parseInt(
          countResult.rows[0].avg_screenshot_size || 0,
        ),
        indexes: indexesResult.rows,
        optimizationIndexes: optimizationIndexes,
        missingIndexes: optimizationIndexes.filter(
          (index) => !existingIndexes.includes(index),
        ),
      };
    } catch (error) {
      console.error("❌ Failed to get optimization status:", error.message);
      throw error;
    }
  }

  /**
   * Get slow query analysis
   */
  async getSlowQueryAnalysis() {
    try {
      // Analyze the most common TV interface queries
      const queries = [
        {
          name: "getByDeviceId",
          query:
            "SELECT * FROM tv_interfaces WHERE device_id = $1 AND is_active = true ORDER BY created_at DESC",
          testValue: "test_device_id",
        },
        {
          name: "updateById",
          query:
            "UPDATE tv_interfaces SET updated_at = NOW() WHERE id = $1 AND is_active = true",
          testValue: "test_interface_id",
        },
      ];

      const analysisResults = [];

      for (const queryInfo of queries) {
        try {
          const explainResult = await query(
            `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${queryInfo.query}`,
            [queryInfo.testValue],
          );

          analysisResults.push({
            name: queryInfo.name,
            query: queryInfo.query,
            plan: explainResult.rows[0]["QUERY PLAN"][0],
            executionTime:
              explainResult.rows[0]["QUERY PLAN"][0]["Execution Time"],
            planningTime:
              explainResult.rows[0]["QUERY PLAN"][0]["Planning Time"],
          });
        } catch (error) {
          analysisResults.push({
            name: queryInfo.name,
            query: queryInfo.query,
            error: error.message,
          });
        }
      }

      return analysisResults;
    } catch (error) {
      console.error("❌ Failed to analyze queries:", error.message);
      throw error;
    }
  }

  /**
   * Clean up large screenshot data (move to external storage simulation)
   */
  async cleanupLargeScreenshots(maxSizeMB = 10) {
    try {
      const maxSizeBytes = maxSizeMB * 1024 * 1024;

      // Find large screenshots
      const largeScreenshotsResult = await query(
        `
        SELECT id, length(screenshot_data) as size 
        FROM tv_interfaces 
        WHERE length(screenshot_data) > $1
        ORDER BY length(screenshot_data) DESC
        LIMIT 100
      `,
        [maxSizeBytes],
      );

      console.log(
        `Found ${largeScreenshotsResult.rows.length} screenshots larger than ${maxSizeMB}MB`,
      );

      // For now, just log them - in production you'd move to external storage
      const cleaned = [];
      for (const row of largeScreenshotsResult.rows) {
        const sizeMB = (row.size / 1024 / 1024).toFixed(2);
        console.log(`📷 Large screenshot ID: ${row.id}, Size: ${sizeMB}MB`);
        cleaned.push({
          id: row.id,
          sizeMB: parseFloat(sizeMB),
        });
      }

      return {
        totalFound: largeScreenshotsResult.rows.length,
        largeScreenshots: cleaned,
        recommendation:
          "Consider moving large screenshots to external storage (S3, etc.) and storing only URLs",
      };
    } catch (error) {
      console.error("❌ Failed to analyze large screenshots:", error.message);
      throw error;
    }
  }
}

export default TVInterfaceOptimizer;
