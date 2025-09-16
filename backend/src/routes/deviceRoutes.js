import express from "express";
import {
  getDevices,
  getDeviceById,
  createDevice,
  updateDevice,
  deleteDevice,
  restoreDevice,
  searchDevices,
  getPopularDevices,
  reorderDevices,
  getDeviceStats,
  bulkUpdateDevices,
  exportDevices,
} from "../controllers/deviceController.js";

const router = express.Router();

/**
 * @route GET /api/v1/devices
 * @desc Получение списка устройств
 * @access Public
 * @query {string} [search] - Поисковый запрос
 * @query {string} [status] - Фильтр по статусу (active, inactive, maintenance)
 * @query {boolean} [is_active] - Фильтр по активности
 * @query {number} [page=1] - Номер страницы
 * @query {number} [limit=20] - Количество элементов на странице
 * @query {string} [sort=order_index] - Поле для сортировки
 * @query {string} [order=asc] - Направление сортировки (asc, desc)
 * @query {boolean} [include_stats=false] - Включить статистику
 * @query {boolean} [admin=false] - Расширенная информация для админ панели
 */
router.get("/", getDevices);

/**
 * @route GET /api/v1/devices/search
 * @desc Поиск устройств
 * @access Public
 * @query {string} q - Поисковый запрос (минимум 2 символа)
 * @query {number} [limit=20] - Максимальное количество результатов
 * @query {number} [offset=0] - Смещение для пагинации
 */
router.get("/search", searchDevices);

/**
 * @route GET /api/v1/devices/popular
 * @desc Получение популярных устройств
 * @access Public
 * @query {number} [limit=10] - Количество устройств
 */
router.get("/popular", getPopularDevices);

/**
 * @route GET /api/v1/devices/stats
 * @desc Получение статистики устройств
 * @access Public
 */
router.get("/stats", getDeviceStats);

/**
 * @route GET /api/v1/devices/export
 * @desc Экспорт устройств
 * @access Public
 * @query {string} [format=json] - Формат экспорта
 * @query {boolean} [include_problems=false] - Включить связанные проблемы
 */
router.get("/export", exportDevices);

/**
 * @route GET /api/v1/devices/:id
 * @desc Получение устройства по ID
 * @access Public
 * @params {string} id - ID устройства
 * @query {boolean} [include_stats=false] - Включить статистику
 */
router.get("/:id", getDeviceById);

/**
 * @route POST /api/v1/devices
 * @desc Создание нового устройст��а
 * @access Admin
 * @body {object} device - Данные устройства
 * @body {string} device.name - Название устройства
 * @body {string} device.brand - Бренд устройства
 * @body {string} device.model - Модель устройства
 * @body {string} [device.description] - Описание
 * @body {string} [device.image_url] - URL изображения
 * @body {string} [device.logo_url] - URL логотипа
 * @body {string} [device.color] - Цветовая схема
 * @body {number} [device.order_index] - Порядок сортировки
 * @body {string} [device.status] - Статус устройства
 * @body {object} [device.metadata] - Дополнительные данные
 */
router.post("/", createDevice);

/**
 * @route PUT /api/v1/devices/reorder
 * @desc Обновление порядка устройств
 * @access Admin
 * @body {array} deviceIds - Массив ID устройств в новом порядке
 */
router.put("/reorder", reorderDevices);

/**
 * @route PUT /api/v1/devices/bulk
 * @desc Массовое обновление устройств
 * @access Admin
 * @body {array} updates - Массив обновлений
 * @body {string} updates[].id - ID устройства для обновле��ия
 * @body {object} updates[].data - Данные для обновления
 */
router.put("/bulk", bulkUpdateDevices);

/**
 * @route PUT /api/v1/devices/:id
 * @desc Обновление устройства
 * @access Admin
 * @params {string} id - ID устройства
 * @body {object} device - Данные для обновления
 */
router.put("/:id", updateDevice);

/**
 * @route POST /api/v1/devices/:id/restore
 * @desc Восстановление архивированного устройства
 * @access Admin
 * @params {string} id - ID устройства
 */
router.post("/:id/restore", restoreDevice);

/**
 * @route DELETE /api/v1/devices/:id
 * @desc Удаление устройства
 * @access Admin
 * @params {string} id - ID устройства
 * @query {boolean} [force=false] - Принудительное удаление
 */
router.delete("/:id", deleteDevice);

export default router;
