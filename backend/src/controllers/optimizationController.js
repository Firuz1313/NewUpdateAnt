import TVInterfaceOptimizer from "../models/TVInterfaceOptimizer.js";

const optimizer = new TVInterfaceOptimizer();

// Optimize TV interfaces database
export const optimizeTVInterfacesDatabase = async (req, res) => {
  try {
    console.log("🚀 Database optimization requested");

    const results = await optimizer.optimizeDatabase();

    res.json({
      success: true,
      message: "Database optimization completed successfully",
      data: results,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Database optimization failed:", error);
    res.status(500).json({
      success: false,
      error: "Database optimization failed",
      details: error.message,
      timestamp: new Date().toISOString(),
    });
  }
};

// Get optimization status
export const getOptimizationStatus = async (req, res) => {
  try {
    const status = await optimizer.getOptimizationStatus();

    res.json({
      success: true,
      data: status,
      message: "Optimization status retrieved successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Failed to get optimization status:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get optimization status",
      details: error.message,
      timestamp: new Date().toISOString(),
    });
  }
};

// Analyze slow queries
export const analyzeSlowQueries = async (req, res) => {
  try {
    const analysis = await optimizer.getSlowQueryAnalysis();

    res.json({
      success: true,
      data: analysis,
      message: "Query analysis completed successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Query analysis failed:", error);
    res.status(500).json({
      success: false,
      error: "Query analysis failed",
      details: error.message,
      timestamp: new Date().toISOString(),
    });
  }
};

// Clean up large screenshots
export const cleanupLargeScreenshots = async (req, res) => {
  try {
    const maxSizeMB = parseInt(req.query.maxSizeMB) || 5;
    const results = await optimizer.cleanupLargeScreenshots(maxSizeMB);

    res.json({
      success: true,
      data: results,
      message: `Screenshot cleanup analysis completed for files > ${maxSizeMB}MB`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Screenshot cleanup failed:", error);
    res.status(500).json({
      success: false,
      error: "Screenshot cleanup analysis failed",
      details: error.message,
      timestamp: new Date().toISOString(),
    });
  }
};

export default {
  optimizeTVInterfacesDatabase,
  getOptimizationStatus,
  analyzeSlowQueries,
  cleanupLargeScreenshots,
};
