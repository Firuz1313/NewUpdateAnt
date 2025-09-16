import express from "express";
import {
  optimizeTVInterfacesDatabase,
  getOptimizationStatus,
  analyzeSlowQueries,
  cleanupLargeScreenshots,
} from "../controllers/optimizationController.js";
import {
  diagnoseTVInterfaceMarksTable,
  createMinimalTVInterfaceMarksTable,
} from "../controllers/tvInterfaceMarkDiagnosticController.js";
import { fixTVInterfaceIdFormat } from "../controllers/tvInterfaceMarkFixController.js";
import {
  fullTableDiagnosis,
  fixAllUuidColumns,
} from "../controllers/tvInterfaceMarkTableFixController.js";
import requestLogger from "../middleware/requestLogger.js";

const router = express.Router();

// Применяем middleware для логирования всех запросов
router.use(requestLogger);

/**
 * @route POST /api/v1/optimization/tv-interfaces/optimize
 * @desc Optimize TV interfaces database (add indexes, update statistics)
 * @access Admin
 */
router.post("/tv-interfaces/optimize", optimizeTVInterfacesDatabase);

/**
 * @route GET /api/v1/optimization/tv-interfaces/status
 * @desc Get TV interfaces optimization status
 * @access Admin
 */
router.get("/tv-interfaces/status", getOptimizationStatus);

/**
 * @route GET /api/v1/optimization/tv-interfaces/analyze-queries
 * @desc Analyze slow TV interface queries
 * @access Admin
 */
router.get("/tv-interfaces/analyze-queries", analyzeSlowQueries);

/**
 * @route GET /api/v1/optimization/tv-interfaces/cleanup-screenshots
 * @desc Analyze large screenshots for cleanup
 * @access Admin
 * @query {number} maxSizeMB - Maximum screenshot size in MB (default: 5)
 */
router.get("/tv-interfaces/cleanup-screenshots", cleanupLargeScreenshots);

/**
 * @route GET /api/v1/optimization/tv-interface-marks/diagnose
 * @desc Diagnose TV interface marks table structure
 * @access Admin
 */
router.get("/tv-interface-marks/diagnose", diagnoseTVInterfaceMarksTable);

/**
 * @route POST /api/v1/optimization/tv-interface-marks/create-minimal
 * @desc Create minimal TV interface marks table structure
 * @access Admin
 */
router.post(
  "/tv-interface-marks/create-minimal",
  createMinimalTVInterfaceMarksTable,
);

/**
 * @route POST /api/v1/optimization/tv-interface-marks/fix-id-format
 * @desc Fix TV interface ID format from UUID to VARCHAR
 * @access Admin
 */
router.post("/tv-interface-marks/fix-id-format", fixTVInterfaceIdFormat);

/**
 * @route GET /api/v1/optimization/tv-interface-marks/full-diagnosis
 * @desc Full diagnosis of tv_interface_marks table structure
 * @access Admin
 */
router.get("/tv-interface-marks/full-diagnosis", fullTableDiagnosis);

/**
 * @route POST /api/v1/optimization/tv-interface-marks/fix-all-uuid
 * @desc Fix all UUID columns to VARCHAR format
 * @access Admin
 */
router.post("/tv-interface-marks/fix-all-uuid", fixAllUuidColumns);

// Middleware для обработки ошибок маршрутов
router.use((error, req, res, next) => {
  console.error("Optimization Route Error:", error);

  res.status(500).json({
    success: false,
    error: "Внутренняя ошибка сервера в модуле оптимизации",
    details: error.message,
    timestamp: new Date().toISOString(),
  });
});

export default router;
