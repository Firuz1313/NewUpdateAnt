import express from "express";
import Joi from "joi";
import {
  getMarksByTVInterfaceId,
  getMarksByStepId,
  getMarkById,
  createMark,
  updateMark,
  deleteMark,
  deleteMarksByTVInterfaceId,
  deleteMarksByStepId,
  reorderMarks,
  getMarksStats,
} from "../controllers/tvInterfaceMarkController.js";
import { validateRequest } from "../middleware/validateRequest.js";
import requestLogger from "../middleware/requestLogger.js";

const router = express.Router();

// Применяем middleware для логирования всех запросов
router.use(requestLogger);

// Схемы валидации Joi
const createMarkSchema = Joi.object({
  tv_interface_id: Joi.string().required(),
  step_id: Joi.string().optional(),
  name: Joi.string().min(1).max(255).required(),
  description: Joi.string().max(1000).optional().allow(""),
  mark_type: Joi.string().valid("point", "zone", "area").optional(),
  shape: Joi.string().valid("circle", "rectangle", "polygon", "ellipse").optional(),
  position: Joi.object({
    x: Joi.number().required(),
    y: Joi.number().required(),
  }).required(),
  size: Joi.object({
    width: Joi.number().positive().optional(),
    height: Joi.number().positive().optional(),
  }).optional(),
  coordinates: Joi.array().items(
    Joi.object({
      x: Joi.number().required(),
      y: Joi.number().required(),
    })
  ).optional(),
  color: Joi.string().optional(),
  background_color: Joi.string().optional(),
  border_color: Joi.string().optional(),
  border_width: Joi.number().min(0).optional(),
  opacity: Joi.number().min(0).max(1).optional(),
  is_clickable: Joi.boolean().optional(),
  is_highlightable: Joi.boolean().optional(),
  click_action: Joi.string().optional(),
  hover_action: Joi.string().optional(),
  action_value: Joi.string().max(500).optional(),
  action_description: Joi.string().optional(),
  expected_result: Joi.string().optional(),
  hint_text: Joi.string().optional(),
  tooltip_text: Joi.string().optional(),
  warning_text: Joi.string().optional(),
  animation: Joi.string().valid("pulse", "glow", "bounce", "shake", "fade", "blink", "none").optional(),
  animation_duration: Joi.number().positive().optional(),
  animation_delay: Joi.number().min(0).optional(),
  display_order: Joi.number().min(0).optional(),
  priority: Joi.string().valid("low", "normal", "high", "critical").optional(),
  metadata: Joi.object().optional(),
  tags: Joi.array().items(Joi.string()).optional(),
});

const updateMarkSchema = Joi.object({
  name: Joi.string().min(1).max(255).optional(),
  description: Joi.string().max(1000).optional().allow(""),
  mark_type: Joi.string().valid("point", "zone", "area").optional(),
  shape: Joi.string().valid("circle", "rectangle", "polygon", "ellipse").optional(),
  position: Joi.object({
    x: Joi.number().required(),
    y: Joi.number().required(),
  }).optional(),
  size: Joi.object({
    width: Joi.number().positive().optional(),
    height: Joi.number().positive().optional(),
  }).optional(),
  coordinates: Joi.array().items(
    Joi.object({
      x: Joi.number().required(),
      y: Joi.number().required(),
    })
  ).optional(),
  color: Joi.string().optional(),
  background_color: Joi.string().optional(),
  border_color: Joi.string().optional(),
  border_width: Joi.number().min(0).optional(),
  opacity: Joi.number().min(0).max(1).optional(),
  is_clickable: Joi.boolean().optional(),
  is_highlightable: Joi.boolean().optional(),
  click_action: Joi.string().optional(),
  hover_action: Joi.string().optional(),
  action_value: Joi.string().max(500).optional(),
  action_description: Joi.string().optional(),
  expected_result: Joi.string().optional(),
  hint_text: Joi.string().optional(),
  tooltip_text: Joi.string().optional(),
  warning_text: Joi.string().optional(),
  animation: Joi.string().valid("pulse", "glow", "bounce", "shake", "fade", "blink", "none").optional(),
  animation_duration: Joi.number().positive().optional(),
  animation_delay: Joi.number().min(0).optional(),
  display_order: Joi.number().min(0).optional(),
  priority: Joi.string().valid("low", "normal", "high", "critical").optional(),
  is_active: Joi.boolean().optional(),
  is_visible: Joi.boolean().optional(),
  metadata: Joi.object().optional(),
  tags: Joi.array().items(Joi.string()).optional(),
});

const reorderMarksSchema = Joi.object({
  mark_ids: Joi.array().items(Joi.string()).required(),
});

/**
 * @route GET /api/v1/tv-interface-marks/stats
 * @desc Получить статистику отметок
 * @access Public
 */
router.get("/stats", getMarksStats);

/**
 * @route GET /api/v1/tv-interface-marks/tv-interface/:tvInterfaceId
 * @desc Получить отметки для TV интерфейса
 * @access Public
 * @param {string} tvInterfaceId - ID TV интерфейса
 * @query {boolean} is_active - Фильтр по активности
 * @query {boolean} is_visible - Фильтр по видимости
 * @query {string} mark_type - Фильтр по типу отметки
 * @query {string} step_id - Фильтр по шагу
 */
router.get("/tv-interface/:tvInterfaceId", getMarksByTVInterfaceId);

/**
 * @route GET /api/v1/tv-interface-marks/step/:stepId
 * @desc Получить отметки для шага
 * @access Public
 * @param {string} stepId - ID шага
 */
router.get("/step/:stepId", getMarksByStepId);

/**
 * @route GET /api/v1/tv-interface-marks/:id
 * @desc Получить отметку по ID
 * @access Public
 * @param {string} id - ID отметки
 */
router.get("/:id", getMarkById);

/**
 * @route POST /api/v1/tv-interface-marks
 * @desc Создать новую отметку
 * @access Public
 * @body {string} tv_interface_id - ID TV интерфейса
 * @body {string} step_id - ID шага (опционально)
 * @body {string} name - Название отметки
 * @body {string} description - Опис��ние отметки (опционально)
 * @body {string} mark_type - Тип отметки
 * @body {string} shape - Форма отметки
 * @body {object} position - Позиция отметки {x, y}
 * @body {object} size - Размер отметки {width, height} (опционально)
 * @body {array} coordinates - Координаты для polygon (опционально)
 * @body {string} color - Цвет отметки (опционально)
 * @body {string} action_value - Значение действия (опционально)
 * @body {string} action_description - Описание действия (опционально)
 * @body {string} hint_text - Текст подсказки (опционально)
 */
router.post("/", validateRequest(createMarkSchema), createMark);

/**
 * @route PUT /api/v1/tv-interface-marks/:id
 * @desc Обновить отметку
 * @access Public
 * @param {string} id - ID отметки
 * @body {string} name - Название отметки (опционально)
 * @body {string} description - Описание отметки (опционально)
 * @body {object} position - Позиция отметки (опционально)
 * @body {boolean} is_active - Статус активности (опционально)
 */
router.put("/:id", validateRequest(updateMarkSchema), updateMark);

/**
 * @route DELETE /api/v1/tv-interface-marks/:id
 * @desc Удалить отметку
 * @access Public
 * @param {string} id - ID отметки
 */
router.delete("/:id", deleteMark);

/**
 * @route DELETE /api/v1/tv-interface-marks/tv-interface/:tvInterfaceId
 * @desc Удалить все отметки TV интерфейса
 * @access Public
 * @param {string} tvInterfaceId - ID TV интерфейса
 */
router.delete("/tv-interface/:tvInterfaceId", deleteMarksByTVInterfaceId);

/**
 * @route DELETE /api/v1/tv-interface-marks/step/:stepId
 * @desc Удалить все отметки шага
 * @access Public
 * @param {string} stepId - ID шага
 */
router.delete("/step/:stepId", deleteMarksByStepId);

/**
 * @route PUT /api/v1/tv-interface-marks/tv-interface/:tvInterfaceId/reorder
 * @desc Изменить порядок отметок
 * @access Public
 * @param {string} tvInterfaceId - ID TV интерфейса
 * @body {array} mark_ids - Массив ID отметок в новом порядке
 */
router.put("/tv-interface/:tvInterfaceId/reorder", validateRequest(reorderMarksSchema), reorderMarks);

// Middleware для обработки ошибок маршрутов
router.use((error, req, res, next) => {
  console.error("TV Interface Mark Route Error:", error);

  if (error.type === "validation") {
    return res.status(400).json({
      success: false,
      error: "Ошибка валидации данных",
      details: error.details,
      timestamp: new Date().toISOString(),
    });
  }

  res.status(500).json({
    success: false,
    error: "Внутренняя ошибка сервера в модуле TV Interface Marks",
    details: error.message,
    timestamp: new Date().toISOString(),
  });
});

export default router;
