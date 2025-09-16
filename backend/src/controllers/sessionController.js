import DiagnosticSession from '../models/DiagnosticSession.js';
import Problem from '../models/Problem.js';
import Device from '../models/Device.js';
import { sessionValidation, validateRequest } from '../middleware/validateRequest.js';

const sessionModel = new DiagnosticSession();
const problemModel = new Problem();
const deviceModel = new Device();

/**
 * Контроллер для управления диагностическими сессиями
 */
class SessionController {
  /**
   * Получение списка сессий
   * GET /api/v1/sessions
   */
  async getSessions(req, res, next) {
    try {
      const { 
        device_id,
        problem_id,
        session_id,
        success,
        is_active,
        date_from,
        date_to,
        page = 1, 
        limit = 20, 
        sort = 'start_time', 
        order = 'desc',
        include_progress = false
      } = req.query;

      const filters = {};
      if (device_id) filters.device_id = device_id;
      if (problem_id) filters.problem_id = problem_id;
      if (session_id) filters.session_id = session_id;
      if (success !== undefined) filters.success = success === 'true';
      if (is_active !== undefined) filters.is_active = is_active === 'true';
      if (date_from) filters.date_from = date_from;
      if (date_to) filters.date_to = date_to;

      const options = {
        limit: Math.min(parseInt(limit), 100),
        offset: (parseInt(page) - 1) * Math.min(parseInt(limit), 100),
        sortBy: sort,
        sortOrder: order.toUpperCase()
      };

      let sessions;
      if (include_progress === 'true') {
        // Получаем сессии с детальным прогрессом (медленнее)
        sessions = await sessionModel.findAll(filters, options);
        // Для каждой сессии добавляем прогресс
        for (let session of sessions) {
          const detailedSession = await sessionModel.findByIdWithProgress(session.id);
          if (detailedSession) {
            session.steps_progress = detailedSession.steps_progress;
            session.completion_percentage = detailedSession.completion_percentage;
          }
        }
      } else {
        sessions = await sessionModel.findAll(filters, options);
      }

      // Подсчет общего количества для пагинации
      const total = await sessionModel.count(filters);
      const totalPages = Math.ceil(total / options.limit);

      res.json({
        success: true,
        data: sessions,
        pagination: {
          page: parseInt(page),
          limit: options.limit,
          total,
          totalPages,
          hasNext: parseInt(page) < totalPages,
          hasPrev: parseInt(page) > 1
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Получение сессии по ID
   * GET /api/v1/sessions/:id
   */
  async getSessionById(req, res, next) {
    try {
      const { id } = req.params;
      const { include_progress = false } = req.query;

      let session;
      if (include_progress === 'true') {
        session = await sessionModel.findByIdWithProgress(id);
      } else {
        session = await sessionModel.findById(id);
      }

      if (!session) {
        return res.status(404).json({
          success: false,
          error: 'Диагностическая сессия не найдена',
          errorType: 'NOT_FOUND',
          timestamp: new Date().toISOString()
        });
      }

      res.json({
        success: true,
        data: session,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Создание новой сессии диагностики
   * POST /api/v1/sessions
   */
  async createSession(req, res, next) {
    try {
      const sessionData = req.body;

      // Проверяем существование устройства
      if (sessionData.device_id) {
        const device = await deviceModel.findById(sessionData.device_id);
        if (!device || !device.is_active) {
          return res.status(400).json({
            success: false,
            error: 'Указанное устройство не найдено или неактивно',
            errorType: 'VALIDATION_ERROR',
            timestamp: new Date().toISOString()
          });
        }
      }

      // Проверяем существование проблемы
      if (sessionData.problem_id) {
        const problem = await problemModel.findById(sessionData.problem_id);
        if (!problem || !problem.is_active) {
          return res.status(400).json({
            success: false,
            error: 'Указанная проблема не найдена или неактивна',
            errorType: 'VALIDATION_ERROR',
            timestamp: new Date().toISOString()
          });
        }

        // Проверяем, что проблема принадлежит указанному устройству
        if (problem.device_id !== sessionData.device_id) {
          return res.status(400).json({
            success: false,
            error: 'Указанная проблема не принадлежит выбранному устройству',
            errorType: 'VALIDATION_ERROR',
            timestamp: new Date().toISOString()
          });
        }
      }

      // Проверяем уникальность session_id если указан
      if (sessionData.session_id) {
        const existingSession = await sessionModel.findOne({
          session_id: sessionData.session_id,
          is_active: true
        });

        if (existingSession) {
          return res.status(409).json({
            success: false,
            error: 'Сессия с таким идентификатором уже существует',
            errorType: 'DUPLICATE_ERROR',
            timestamp: new Date().toISOString()
          });
        }
      }

      const newSession = await sessionModel.createSession(sessionData);

      res.status(201).json({
        success: true,
        data: newSession,
        message: 'Диагностическая сессия успешно создана',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Обновление сессии
   * PUT /api/v1/sessions/:id
   */
  async updateSession(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Проверяем существование сессии
      const existingSession = await sessionModel.findById(id);
      if (!existingSession) {
        return res.status(404).json({
          success: false,
          error: 'Диагностическая сессия не найдена',
          errorType: 'NOT_FOUND',
          timestamp: new Date().toISOString()
        });
      }

      // Не разрешаем изменять завершенные сессии
      if (existingSession.end_time && !updateData.force_update) {
        return res.status(409).json({
          success: false,
          error: 'Нельзя изменять завершенную сессию',
          errorType: 'CONSTRAINT_ERROR',
          suggestion: 'Используйте параметр force_update=true для принудительного обновления',
          timestamp: new Date().toISOString()
        });
      }

      const updatedSession = await sessionModel.updateById(id, updateData);

      res.json({
        success: true,
        data: updatedSession,
        message: 'Диагностическая сессия успешно обновлена',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Завершение сессии
   * POST /api/v1/sessions/:id/complete
   */
  async completeSession(req, res, next) {
    try {
      const { id } = req.params;
      const completionData = req.body;

      // Проверяем существование сессии
      const existingSession = await sessionModel.findById(id);
      if (!existingSession) {
        return res.status(404).json({
          success: false,
          error: 'Диагностическая сессия не найдена',
          errorType: 'NOT_FOUND',
          timestamp: new Date().toISOString()
        });
      }

      // Проверяем, что сессия еще не завершена
      if (existingSession.end_time) {
        return res.status(409).json({
          success: false,
          error: 'Сессия уже завершена',
          errorType: 'CONSTRAINT_ERROR',
          timestamp: new Date().toISOString()
        });
      }

      const completedSession = await sessionModel.completeSession(id, completionData);

      res.json({
        success: true,
        data: completedSession,
        message: 'Диагностическая сессия успешно завершена',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Обновление прогресса сессии
   * POST /api/v1/sessions/:id/progress
   */
  async updateProgress(req, res, next) {
    try {
      const { id } = req.params;
      const { step_id, ...stepResult } = req.body;

      if (!step_id) {
        return res.status(400).json({
          success: false,
          error: 'Необходимо указать ID шага',
          errorType: 'VALIDATION_ERROR',
          timestamp: new Date().toISOString()
        });
      }

      // Проверяем существование сессии
      const existingSession = await sessionModel.findById(id);
      if (!existingSession) {
        return res.status(404).json({
          success: false,
          error: 'Диагностическая сессия не найдена',
          errorType: 'NOT_FOUND',
          timestamp: new Date().toISOString()
        });
      }

      // Проверяем, что сессия еще не завершена
      if (existingSession.end_time) {
        return res.status(409).json({
          success: false,
          error: 'Нельзя обновлять прогресс завершенной сессии',
          errorType: 'CONSTRAINT_ERROR',
          timestamp: new Date().toISOString()
        });
      }

      const updatedSession = await sessionModel.updateProgress(id, step_id, stepResult);

      res.json({
        success: true,
        data: updatedSession,
        message: 'Прогресс сессии обновлен',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Получение активных сессий
   * GET /api/v1/sessions/active
   */
  async getActiveSessions(req, res, next) {
    try {
      const { limit = 50, offset = 0 } = req.query;

      const options = {
        limit: Math.min(parseInt(limit), 100),
        offset: parseInt(offset)
      };

      const activeSessions = await sessionModel.getActiveSessions(options);

      res.json({
        success: true,
        data: activeSessions,
        total: activeSessions.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Получение статистики сессий
   * GET /api/v1/sessions/stats
   */
  async getSessionStats(req, res, next) {
    try {
      const { device_id, problem_id, date_from, date_to } = req.query;

      const filters = {};
      if (device_id) filters.device_id = device_id;
      if (problem_id) filters.problem_id = problem_id;
      if (date_from) filters.date_from = date_from;
      if (date_to) filters.date_to = date_to;

      const stats = await sessionModel.getSessionStats(filters);

      res.json({
        success: true,
        data: stats,
        filters: filters,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Получение популярных проблем
   * GET /api/v1/sessions/popular-problems
   */
  async getPopularProblems(req, res, next) {
    try {
      const { limit = 10, timeframe = '30 days' } = req.query;

      const popularProblems = await sessionModel.getPopularProblems(
        Math.min(parseInt(limit), 50),
        timeframe
      );

      res.json({
        success: true,
        data: popularProblems,
        timeframe,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Получение аналитики по времени
   * GET /api/v1/sessions/analytics
   */
  async getTimeAnalytics(req, res, next) {
    try {
      const { period = 'day', limit = 30 } = req.query;

      const validPeriods = ['hour', 'day', 'week', 'month'];
      if (!validPeriods.includes(period)) {
        return res.status(400).json({
          success: false,
          error: 'Неверный период. Доступные значения: hour, day, week, month',
          errorType: 'VALIDATION_ERROR',
          timestamp: new Date().toISOString()
        });
      }

      const analytics = await sessionModel.getTimeAnalytics(
        period,
        Math.min(parseInt(limit), 100)
      );

      res.json({
        success: true,
        data: analytics,
        period,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Удаление сессии
   * DELETE /api/v1/sessions/:id
   */
  async deleteSession(req, res, next) {
    try {
      const { id } = req.params;
      const { force = false } = req.query;

      // Проверяем существование сессии
      const existingSession = await sessionModel.findById(id);
      if (!existingSession) {
        return res.status(404).json({
          success: false,
          error: 'Диагностическая сессия не найдена',
          errorType: 'NOT_FOUND',
          timestamp: new Date().toISOString()
        });
      }

      // Не разрешаем удалять активные сессии без принуждения
      if (!existingSession.end_time && force !== 'true') {
        return res.status(409).json({
          success: false,
          error: 'Нельзя удалять активную сессию',
          errorType: 'CONSTRAINT_ERROR',
          suggestion: 'Завершите сессию или используйте параметр force=true',
          timestamp: new Date().toISOString()
        });
      }

      let deletedSession;
      if (force === 'true') {
        // Жесткое удаление
        deletedSession = await sessionModel.delete(id);
      } else {
        // Мягкое удаление
        deletedSession = await sessionModel.softDelete(id);
      }

      res.json({
        success: true,
        data: deletedSession,
        message: force === 'true' ? 'Сессия удалена безвозвратно' : 'Сессия архивирована',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Восстановление архивированной сессии
   * POST /api/v1/sessions/:id/restore
   */
  async restoreSession(req, res, next) {
    try {
      const { id } = req.params;

      const restoredSession = await sessionModel.restore(id);
      if (!restoredSession) {
        return res.status(404).json({
          success: false,
          error: 'Сессия не найдена или уже активна',
          errorType: 'NOT_FOUND',
          timestamp: new Date().toISOString()
        });
      }

      res.json({
        success: true,
        data: restoredSession,
        message: 'Диагностическая сессия успешно восстановлена',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Очистка старых сессий
   * POST /api/v1/sessions/cleanup
   */
  async cleanupOldSessions(req, res, next) {
    try {
      const { days_to_keep = 90 } = req.body;

      const cleanupResult = await sessionModel.cleanupOldSessions(parseInt(days_to_keep));

      res.json({
        success: true,
        data: cleanupResult,
        message: `Очистка завершена: удалено ${cleanupResult.deleted_sessions} сессий, архивировано ${cleanupResult.archived_sessions} сессий`,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Экспорт сессий
   * GET /api/v1/sessions/export
   */
  async exportSessions(req, res, next) {
    try {
      const { 
        format = 'json', 
        device_id, 
        problem_id, 
        date_from, 
        date_to,
        include_progress = false 
      } = req.query;

      const filters = { is_active: true };
      if (device_id) filters.device_id = device_id;
      if (problem_id) filters.problem_id = problem_id;
      if (date_from) filters.date_from = date_from;
      if (date_to) filters.date_to = date_to;

      let sessions = await sessionModel.findAll(filters);

      // Добавляем прогресс если запрошено
      if (include_progress === 'true') {
        for (let session of sessions) {
          const detailedSession = await sessionModel.findByIdWithProgress(session.id);
          if (detailedSession) {
            session.steps_progress = detailedSession.steps_progress;
            session.completion_percentage = detailedSession.completion_percentage;
          }
        }
      }

      if (format === 'json') {
        res.json({
          success: true,
          data: sessions,
          meta: {
            exportedAt: new Date().toISOString(),
            totalRecords: sessions.length,
            format: 'json',
            filters: filters,
            includeProgress: include_progress === 'true'
          }
        });
      } else {
        // Другие форматы можно добавить позже (CSV, XML и т.д.)
        res.status(400).json({
          success: false,
          error: 'Неподдерживаемый формат экспорта',
          supportedFormats: ['json'],
          timestamp: new Date().toISOString()
        });
      }
    } catch (error) {
      next(error);
    }
  }
}

// Создаем экземпляр контроллера
const sessionController = new SessionController();

// Применяем валидацию к методам
const validateSessionCreation = validateRequest(sessionValidation.create);
const validateSessionUpdate = validateRequest(sessionValidation.update);

// Экспортируем методы с примененной валидацией
export const getSessions = sessionController.getSessions.bind(sessionController);
export const getSessionById = sessionController.getSessionById.bind(sessionController);
export const createSession = [validateSessionCreation, sessionController.createSession.bind(sessionController)];
export const updateSession = [validateSessionUpdate, sessionController.updateSession.bind(sessionController)];
export const completeSession = sessionController.completeSession.bind(sessionController);
export const updateProgress = sessionController.updateProgress.bind(sessionController);
export const getActiveSessions = sessionController.getActiveSessions.bind(sessionController);
export const getSessionStats = sessionController.getSessionStats.bind(sessionController);
export const getPopularProblems = sessionController.getPopularProblems.bind(sessionController);
export const getTimeAnalytics = sessionController.getTimeAnalytics.bind(sessionController);
export const deleteSession = sessionController.deleteSession.bind(sessionController);
export const restoreSession = sessionController.restoreSession.bind(sessionController);
export const cleanupOldSessions = sessionController.cleanupOldSessions.bind(sessionController);
export const exportSessions = sessionController.exportSessions.bind(sessionController);

export default sessionController;
