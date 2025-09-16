import express from "express";
import {
  getProblems,
  getProblemById,
  createProblem,
  updateProblem,
  deleteProblem,
  restoreProblem,
  searchProblems,
  getPopularProblems,
  getProblemsByDevice,
  getProblemsByCategory,
  duplicateProblem,
  publishProblem,
  unpublishProblem,
  getProblemStats,
  updateProblemStats,
  exportProblems,
} from "../controllers/problemController.js";

const router = express.Router();

/**
 * @route GET /api/v1/problems
 * @desc Получение списка проблем
 * @access Public
 * @query {string} [search] - Поисковый запрос
 * @query {string} [device_id] - Фильтр по устройству
 * @query {string} [category] - Фильтр по категории (critical, moderate, minor, other)
 * @query {string} [status] - Фильтр по статусу (draft, published, archived)
 * @query {boolean} [is_active] - Фильтр по активности
 * @query {number} [page=1] - Номер страницы
 * @query {number} [limit=20] - Количество элементов на странице
 * @query {string} [sort=priority] - Поле для сортировки
 * @query {string} [order=desc] - Направление сортировки (asc, desc)
 * @query {boolean} [include_details=false] - Включить детальную информацию
 * @query {boolean} [admin=false] - Расширенная информация для админ панели
 */
router.get("/", getProblems);

/**
 * @route GET /api/v1/problems/search
 * @desc Поиск проблем
 * @access Public
 * @query {string} q - Поисковый запрос (минимум 2 символа)
 * @query {number} [limit=20] - Максимальное количество результатов
 * @query {number} [offset=0] - Смещение для пагинации
 */
router.get("/search", searchProblems);

/**
 * @route GET /api/v1/problems/popular
 * @desc Получение популярных проблем
 * @access Public
 * @query {number} [limit=10] - Количество проблем
 */
router.get("/popular", getPopularProblems);

/**
 * @route GET /api/v1/problems/stats
 * @desc Получение статистики проблем
 * @access Public
 */
router.get("/stats", getProblemStats);

/**
 * @route GET /api/v1/problems/export
 * @desc Экспорт проблем
 * @access Public
 * @query {string} [format=json] - Формат экспорта
 * @query {string} [device_id] - Фильтр по устройству
 * @query {boolean} [include_steps=false] - Включить связанные шаги
 */
router.get("/export", exportProblems);

/**
 * @route GET /api/v1/problems/device/:deviceId
 * @desc Получение проблем по устройству
 * @access Public
 * @params {string} deviceId - ID устройства
 * @query {string} [status] - Фильтр по статусу
 * @query {number} [limit=20] - Максимальное количество результатов
 * @query {number} [offset=0] - Смещение для пагинации
 */
router.get("/device/:deviceId", getProblemsByDevice);

/**
 * @route GET /api/v1/problems/category/:category
 * @desc Получение проблем по категории
 * @access Public
 * @params {string} category - Категория проблемы
 * @query {string} [device_id] - Фильтр по устройству
 * @query {number} [limit=20] - Максимальное количество результатов
 * @query {number} [offset=0] - Смещение для пагинации
 */
router.get("/category/:category", getProblemsByCategory);

/**
 * @route GET /api/v1/problems/:id
 * @desc Получение проблемы по ID
 * @access Public
 * @params {string} id - ID проблемы
 * @query {boolean} [include_details=false] - Включить детальную информацию
 */
router.get("/:id", getProblemById);

/**
 * @route POST /api/v1/problems
 * @desc Создание новой проблемы
 * @access Admin
 * @body {object} problem - Данные проблемы
 * @body {string} problem.device_id - ID устройства
 * @body {string} problem.title - Название проблемы
 * @body {string} [problem.description] - Описание проблемы
 * @body {string} [problem.category] - Категория проблемы
 * @body {string} [problem.icon] - Иконка проблемы
 * @body {string} [problem.color] - Цветовая схема
 * @body {array} [problem.tags] - Теги
 * @body {number} [problem.priority] - Приоритет
 * @body {number} [problem.estimated_time] - Ожидаемое время решения
 * @body {string} [problem.difficulty] - Сложность
 * @body {number} [problem.success_rate] - Ожидаемый процент успеха
 * @body {string} [problem.status] - Статус проблемы
 * @body {object} [problem.metadata] - Дополнительные данные
 */
router.post("/", createProblem);

/**
 * @route POST /api/v1/problems/:id/duplicate
 * @desc Дублирование проблемы
 * @access Admin
 * @params {string} id - ID проблемы для дублирования
 * @body {string} [target_device_id] - ID целевого устройства
 */
router.post("/:id/duplicate", duplicateProblem);

/**
 * @route POST /api/v1/problems/:id/publish
 * @desc Публикация проблемы
 * @access Admin
 * @params {string} id - ID проблемы
 */
router.post("/:id/publish", publishProblem);

/**
 * @route POST /api/v1/problems/:id/unpublish
 * @desc Снятие проблемы с публикации
 * @access Admin
 * @params {string} id - ID проблемы
 */
router.post("/:id/unpublish", unpublishProblem);

/**
 * @route POST /api/v1/problems/:id/update-stats
 * @desc Обновление статистики проблемы
 * @access System
 * @params {string} id - ID проблемы
 * @body {string} session_result - Результат сессии (success/failure)
 */
router.post("/:id/update-stats", updateProblemStats);

/**
 * @route POST /api/v1/problems/:id/restore
 * @desc Восстановление архивированной проблемы
 * @access Admin
 * @params {string} id - ID проблемы
 */
router.post("/:id/restore", restoreProblem);

/**
 * @route PUT /api/v1/problems/:id
 * @desc Обновление проблемы
 * @access Admin
 * @params {string} id - ID проблемы
 * @body {object} problem - Данные для обновления
 */
router.put("/:id", updateProblem);

/**
 * @route DELETE /api/v1/problems/:id
 * @desc Удаление проблемы
 * @access Admin
 * @params {string} id - ID проблемы
 * @query {boolean} [force=false] - Принудительное удаление
 */
router.delete("/:id", deleteProblem);

export default router;
