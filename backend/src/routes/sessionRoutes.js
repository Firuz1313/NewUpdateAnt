import express from 'express';
import {
  getSessions,
  getSessionById,
  createSession,
  updateSession,
  completeSession,
  updateProgress,
  getActiveSessions,
  getSessionStats,
  getPopularProblems,
  getTimeAnalytics,
  deleteSession,
  restoreSession,
  cleanupOldSessions,
  exportSessions
} from '../controllers/sessionController.js';

const router = express.Router();

/**
 * @route GET /api/v1/sessions
 * @desc Получение списка диагностических сессий
 * @access Public
 * @query {string} [device_id] - Фильтр по устройству
 * @query {string} [problem_id] - Фильтр по проблеме
 * @query {string} [session_id] - Фильтр по идентификатору сессии
 * @query {boolean} [success] - Фильтр по результату (true/false)
 * @query {boolean} [is_active] - Фильтр по активности
 * @query {string} [date_from] - Дата начала (ISO формат)
 * @query {string} [date_to] - Дата окончания (ISO формат)
 * @query {number} [page=1] - Номер страницы
 * @query {number} [limit=20] - Количество элементов на странице
 * @query {string} [sort=start_time] - Поле для сортировки
 * @query {string} [order=desc] - Направление сортировки (asc, desc)
 * @query {boolean} [include_progress=false] - Включить детальный прогресс
 */
router.get('/', getSessions);

/**
 * @route GET /api/v1/sessions/active
 * @desc Получение активных сессий
 * @access Public
 * @query {number} [limit=50] - Максимальное количество результатов
 * @query {number} [offset=0] - Смещение для пагинации
 */
router.get('/active', getActiveSessions);

/**
 * @route GET /api/v1/sessions/stats
 * @desc Получение статистики сессий
 * @access Public
 * @query {string} [device_id] - Фильтр по устройству
 * @query {string} [problem_id] - Фильтр по проблеме
 * @query {string} [date_from] - Дата начала (ISO формат)
 * @query {string} [date_to] - Дата окончания (ISO формат)
 */
router.get('/stats', getSessionStats);

/**
 * @route GET /api/v1/sessions/popular-problems
 * @desc Получение популярных проблем на основе сессий
 * @access Public
 * @query {number} [limit=10] - Количество проблем
 * @query {string} [timeframe=30 days] - Временной период
 */
router.get('/popular-problems', getPopularProblems);

/**
 * @route GET /api/v1/sessions/analytics
 * @desc Получение аналитики по времени
 * @access Public
 * @query {string} [period=day] - Период группировки (hour, day, week, month)
 * @query {number} [limit=30] - Количество периодов
 */
router.get('/analytics', getTimeAnalytics);

/**
 * @route GET /api/v1/sessions/export
 * @desc Экспорт сессий
 * @access Admin
 * @query {string} [format=json] - Формат экспорта
 * @query {string} [device_id] - Фильтр по устройству
 * @query {string} [problem_id] - Фильтр по проблеме
 * @query {string} [date_from] - Дата начала (ISO формат)
 * @query {string} [date_to] - Дата окончания (ISO формат)
 * @query {boolean} [include_progress=false] - Включить прогресс шагов
 */
router.get('/export', exportSessions);

/**
 * @route GET /api/v1/sessions/:id
 * @desc Получение сессии по ID
 * @access Public
 * @params {string} id - ID сессии
 * @query {boolean} [include_progress=false] - Включить детальный прогресс
 */
router.get('/:id', getSessionById);

/**
 * @route POST /api/v1/sessions
 * @desc Создание новой диагностической сессии
 * @access Public
 * @body {object} session - Данные сессии
 * @body {string} session.device_id - ID устройства
 * @body {string} session.problem_id - ID проблемы
 * @body {string} [session.user_id] - ID пользователя
 * @body {string} session.session_id - Уникальный идентификатор сессии
 * @body {string} [session.user_agent] - User Agent браузера
 * @body {string} [session.ip_address] - IP адрес пользователя
 * @body {object} [session.metadata] - Дополнительные данные
 */
router.post('/', createSession);

/**
 * @route POST /api/v1/sessions/cleanup
 * @desc Очистка старых сессий
 * @access Admin
 * @body {number} [days_to_keep=90] - Количество дней для хранения
 */
router.post('/cleanup', cleanupOldSessions);

/**
 * @route POST /api/v1/sessions/:id/complete
 * @desc Завершение сессии диагностики
 * @access Public
 * @params {string} id - ID сессии
 * @body {boolean} [success=false] - Успешность завершения диагностики
 * @body {object} [feedback] - Отзыв пользователя
 * @body {array} [error_steps] - Массив ID шагов с ошибками
 * @body {object} [metadata] - Дополнительные данные
 */
router.post('/:id/complete', completeSession);

/**
 * @route POST /api/v1/sessions/:id/progress
 * @desc Обновление прогресса сессии
 * @access Public
 * @params {string} id - ID сессии
 * @body {string} step_id - ID выполняемого шага
 * @body {number} [step_number] - Номер шага
 * @body {boolean} [completed=false] - Завершен ли шаг
 * @body {string} [result=success] - Результат выполнения (success, failure, skipped)
 * @body {number} [time_spent] - Время выполнения в секундах
 * @body {string} [user_input] - Ввод пользователя
 * @body {array} [errors] - Массив ошибок
 * @body {object} [metadata] - Дополнительные данные
 */
router.post('/:id/progress', updateProgress);

/**
 * @route POST /api/v1/sessions/:id/restore
 * @desc Восстановление архивированной сессии
 * @access Admin
 * @params {string} id - ID сессии
 */
router.post('/:id/restore', restoreSession);

/**
 * @route PUT /api/v1/sessions/:id
 * @desc Обновление сессии
 * @access Admin
 * @params {string} id - ID сессии
 * @body {object} session - Данные для обновления
 * @body {boolean} [force_update=false] - Принудительное обновление завершенной сессии
 */
router.put('/:id', updateSession);

/**
 * @route DELETE /api/v1/sessions/:id
 * @desc Удаление сессии
 * @access Admin
 * @params {string} id - ID сессии
 * @query {boolean} [force=false] - Принудительное удаление активной сессии
 */
router.delete('/:id', deleteSession);

export default router;
