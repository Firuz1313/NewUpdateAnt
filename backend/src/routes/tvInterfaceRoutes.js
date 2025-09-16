import express from 'express';
import Joi from 'joi';
import {
  getAllTVInterfaces,
  getTVInterfaceById,
  getTVInterfacesByDeviceId,
  createTVInterface,
  updateTVInterface,
  deleteTVInterface,
  toggleTVInterfaceStatus,
  duplicateTVInterface,
  getTVInterfaceStats,
  exportTVInterface
} from '../controllers/tvInterfaceController.js';
import { validateRequest } from '../middleware/validateRequest.js';
import requestLogger from '../middleware/requestLogger.js';

const router = express.Router();

// Применяем middleware для логирования всех запросов
router.use(requestLogger);

// Схемы валидации Joi
const createTVInterfaceSchema = Joi.object({
  name: Joi.string().min(1).max(255).required(),
  description: Joi.string().max(1000).optional().allow(''),
  type: Joi.string().valid('home', 'settings', 'channels', 'apps', 'guide', 'no-signal', 'error', 'custom').required(),
  device_id: Joi.string().required(),
  screenshot_url: Joi.string().uri().optional(),
  screenshot_data: Joi.string().optional(),
  clickable_areas: Joi.array().optional(),
  highlight_areas: Joi.array().optional()
});

const updateTVInterfaceSchema = Joi.object({
  name: Joi.string().min(1).max(255).optional(),
  description: Joi.string().max(1000).optional().allow(''),
  type: Joi.string().valid('home', 'settings', 'channels', 'apps', 'guide', 'no-signal', 'error', 'custom').optional(),
  device_id: Joi.string().optional(),
  screenshot_url: Joi.string().uri().optional(),
  screenshot_data: Joi.string().optional(),
  clickable_areas: Joi.array().optional(),
  highlight_areas: Joi.array().optional(),
  is_active: Joi.boolean().optional()
});

const duplicateTVInterfaceSchema = Joi.object({
  name: Joi.string().min(1).max(255).optional()
});

/**
 * @route GET /api/v1/tv-interfaces
 * @desc Получить все TV интерфейсы
 * @access Public
 * @query {string} device_id - Фильтр по ID устройства
 * @query {string} type - Фильтр по типу интерфейса
 * @query {boolean} is_active - Фильтр по активности
 * @query {string} search - Поиск по названию и описанию
 * @query {number} limit - Лимит записей
 * @query {number} offset - Смещение для пагинации
 */
router.get('/', getAllTVInterfaces);

/**
 * @route GET /api/v1/tv-interfaces/stats
 * @desc Получить статистику TV интерфейсов
 * @access Public
 */
router.get('/stats', getTVInterfaceStats);

/**
 * @route GET /api/v1/tv-interfaces/device/:deviceId
 * @desc Получить TV интерфейсы по ID устройства
 * @access Public
 * @param {string} deviceId - ID устройства
 */
router.get('/device/:deviceId', getTVInterfacesByDeviceId);

/**
 * @route GET /api/v1/tv-interfaces/:id
 * @desc Получить TV интерфейс по ID
 * @access Public
 * @param {string} id - ID TV интерфейса
 */
router.get('/:id', getTVInterfaceById);

/**
 * @route GET /api/v1/tv-interfaces/:id/export
 * @desc Экспортировать TV интерфейс в JSON
 * @access Public
 * @param {string} id - ID TV интерфейса
 */
router.get('/:id/export', exportTVInterface);

/**
 * @route POST /api/v1/tv-interfaces
 * @desc Создать новый TV интерфейс
 * @access Public
 * @body {string} name - Название интерфейса
 * @body {string} description - Описание интерфейса (опционально)
 * @body {string} type - Тип интерфейса
 * @body {string} device_id - ID устройства
 * @body {string} screenshot_url - URL скриншота (опционально)
 * @body {string} screenshot_data - Base64 данные скриншота (опционально)
 * @body {array} clickable_areas - Кликабельные области (опционально)
 * @body {array} highlight_areas - Области подсветки (опционально)
 */
router.post('/', validateRequest(createTVInterfaceSchema), createTVInterface);

/**
 * @route POST /api/v1/tv-interfaces/:id/duplicate
 * @desc Дублировать TV интерфейс
 * @access Public
 * @param {string} id - ID TV интерфейса для дублирования
 * @body {string} name - Новое название (опционально)
 */
router.post('/:id/duplicate', validateRequest(duplicateTVInterfaceSchema), duplicateTVInterface);

/**
 * @route PUT /api/v1/tv-interfaces/:id
 * @desc Обновить TV интерфейс
 * @access Public
 * @param {string} id - ID TV интерфейса
 * @body {string} name - Название интерфейса (опционально)
 * @body {string} description - Описание интерфейса (опционально)
 * @body {string} type - Тип интерфейса (опционально)
 * @body {string} device_id - ID устройства (опционально)
 * @body {string} screenshot_url - URL скриншота (опционально)
 * @body {string} screenshot_data - Base64 данные скриншота (опционально)
 * @body {array} clickable_areas - Кликабельные области (опционально)
 * @body {array} highlight_areas - Области подсветки (опционально)
 * @body {boolean} is_active - Статус активности (опционально)
 */
router.put('/:id', validateRequest(updateTVInterfaceSchema), updateTVInterface);

/**
 * @route PATCH /api/v1/tv-interfaces/:id/toggle
 * @desc Переключить статус активности TV интерфейса
 * @access Public
 * @param {string} id - ID TV интерфейса
 */
router.patch('/:id/toggle', toggleTVInterfaceStatus);

/**
 * @route DELETE /api/v1/tv-interfaces/:id
 * @desc Удалить TV интерфейс
 * @access Public
 * @param {string} id - ID TV интерфейса
 */
router.delete('/:id', deleteTVInterface);

// Middleware для обработки ошибок маршрутов
router.use((error, req, res, next) => {
  console.error('TV Interface Route Error:', error);
  
  if (error.type === 'validation') {
    return res.status(400).json({
      success: false,
      error: 'Ошибка валидац��и данных',
      details: error.details,
      timestamp: new Date().toISOString()
    });
  }
  
  res.status(500).json({
    success: false,
    error: 'Внутренняя ошибка сервера в модуле TV Interface',
    details: error.message,
    timestamp: new Date().toISOString()
  });
});

export default router;
