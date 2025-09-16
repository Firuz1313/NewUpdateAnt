import Problem from "../models/Problem.js";
import Device from "../models/Device.js";
import {
  problemValidation,
  validateRequest,
} from "../middleware/validateRequest.js";

const problemModel = new Problem();
const deviceModel = new Device();

/**
 * Контроллер для управления проблемами
 */
class ProblemController {
  constructor() {
    // Простая защита от спама - храним последние создания по IP
    this.lastCreationsByIP = new Map();
    this.SPAM_PROTECTION_WINDOW = 5000; // 5 секунд между созданиями с одного IP
  }
  /**
   * Получение списка проблем
   * GET /api/v1/problems
   */
  async getProblems(req, res, next) {
    try {
      const {
        search,
        device_id,
        category,
        status,
        is_active,
        page = 1,
        limit = 20,
        sort = "priority",
        order = "desc",
        include_details = false,
        admin = false,
      } = req.query;

      const filters = {};
      if (search) filters.search = search;
      if (device_id) filters.device_id = device_id;
      if (category) filters.category = category;
      if (status) filters.status = status;

      // Set is_active filter only if explicitly requested
      if (is_active !== undefined) {
        filters.is_active = is_active === "true";
      }

      const options = {
        limit: Math.min(parseInt(limit), 100),
        offset: (parseInt(page) - 1) * Math.min(parseInt(limit), 100),
        sortBy: sort,
        sortOrder: order.toUpperCase(),
      };

      let problems;
      if (include_details === "true" || admin === "true") {
        problems = await problemModel.findAllWithDetails(filters, options);
      } else {
        problems = await problemModel.findAll(filters, options);
      }

      // Подсчет общего количества для пагинации
      const total = await problemModel.count(filters);
      const totalPages = Math.ceil(total / options.limit);

      res.json({
        success: true,
        data: problems,
        pagination: {
          page: parseInt(page),
          limit: options.limit,
          total,
          totalPages,
          hasNext: parseInt(page) < totalPages,
          hasPrev: parseInt(page) > 1,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Получение проблемы по ID
   * GET /api/v1/problems/:id
   */
  async getProblemById(req, res, next) {
    try {
      const { id } = req.params;
      const { include_details = false } = req.query;

      let problem;
      if (include_details === "true") {
        problem = await problemModel.findByIdWithDetails(id);
      } else {
        problem = await problemModel.findById(id);
      }

      if (!problem) {
        return res.status(404).json({
          success: false,
          error: "Проблема не найдена",
          errorType: "NOT_FOUND",
          timestamp: new Date().toISOString(),
        });
      }

      res.json({
        success: true,
        data: problem,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Создание новой проблемы
   * POST /api/v1/problems
   */
  async createProblem(req, res, next) {
    try {
      const problemData = req.body;
      const clientIP =
        req.ip ||
        req.connection.remoteAddress ||
        req.headers["x-forwarded-for"];

      // Простая защита от спама
      const now = Date.now();
      const lastCreation = this.lastCreationsByIP.get(clientIP);

      if (lastCreation && now - lastCreation < this.SPAM_PROTECTION_WINDOW) {
        console.warn(
          `⚠️  Обнаружена попытка спама от IP: ${clientIP}. Последнее создание: ${new Date(lastCreation).toISOString()}`,
        );
        return res.status(429).json({
          success: false,
          error:
            "Слишком частые запросы на создание проблем. Подождите несколько секунд.",
          errorType: "RATE_LIMIT",
          retryAfter: Math.ceil(
            (this.SPAM_PROTECTION_WINDOW - (now - lastCreation)) / 1000,
          ),
          timestamp: new Date().toISOString(),
        });
      }

      // Проверяем существов��ние устройства
      if (problemData.device_id) {
        const device = await deviceModel.findById(problemData.device_id);
        if (!device || !device.is_active) {
          return res.status(400).json({
            success: false,
            error: "Указанное устройство не найдено или неактивно",
            errorType: "VALIDATION_ERROR",
            timestamp: new Date().toISOString(),
          });
        }
      }

      // Проверяем уникальность названия для устройства (только среди актив��ых и опубликованных проблем)
      if (problemData.device_id && problemData.title) {
        // Нормализуем название для сравнения
        const normalizedTitle = problemData.title.trim().toLowerCase();

        console.log(
          `🔍 Проверка уникальности названия: "${problemData.title}" (нормализовано: "${normalizedTitle}") для устройства: ${problemData.device_id}`,
        );

        // Используем SQL запрос для case-insensitive поиска
        const checkSql = `
          SELECT id, title, status, created_at
          FROM problems
          WHERE LOWER(TRIM(title)) = $1
            AND device_id = $2
            AND is_active = true
            AND status IN ('published', 'draft')
          LIMIT 1
        `;

        const checkResult = await problemModel.query(checkSql, [
          normalizedTitle,
          problemData.device_id,
        ]);
        const existingProblem = checkResult.rows[0];

        if (existingProblem) {
          console.warn(
            `⚠️  Попытка создать дубликат проблемы: "${problemData.title}" для устройства ${problemData.device_id}`,
          );
          console.warn(
            `⚠️  Существующая про��лема ID: ${existingProblem.id}, статус: ${existingProblem.status}`,
          );

          return res.status(409).json({
            success: false,
            error:
              "Проблема с таким названием уже существует для данного устройства",
            errorType: "DUPLICATE_ERROR",
            details: {
              message:
                "Название проблем�� должно быть уникальным для каждого устройства",
              suggestions: [
                "Измените название проблемы",
                "Добавьте уточняющие детали к названию",
                "Проверьте, можно ли дополнить существующую проблему",
              ],
            },
            existingProblem: {
              id: existingProblem.id,
              title: existingProblem.title,
              status: existingProblem.status,
              created_at: existingProblem.created_at,
            },
            timestamp: new Date().toISOString(),
          });
        }
      }

      // Гарантируем уникальность ID при создании
      let attempts = 0;
      let newProblem = null;
      const maxAttempts = 5;

      while (attempts < maxAttempts && !newProblem) {
        try {
          // Генерируем новый ID для каждой попытки
          const uniqueProblemData = {
            ...problemData,
            id: undefined, // Позволяем BaseModel сгенерировать новый ID
          };

          newProblem = await problemModel.create(uniqueProblemData);

          console.log(
            `✅ Проблема создана с ID: ${newProblem.id} (попытка ${attempts + 1})`,
          );

          // Записываем время создания для защиты от спама
          this.lastCreationsByIP.set(clientIP, Date.now());

          // Очищаем старые записи (оставляем только последние 100)
          if (this.lastCreationsByIP.size > 100) {
            const entries = Array.from(this.lastCreationsByIP.entries());
            const sortedEntries = entries
              .sort((a, b) => b[1] - a[1])
              .slice(0, 50);
            this.lastCreationsByIP.clear();
            sortedEntries.forEach(([ip, time]) =>
              this.lastCreationsByIP.set(ip, time),
            );
          }

          break;
        } catch (error) {
          attempts++;
          if (error.code === "23505" && error.detail?.includes("id")) {
            // Конфликт по ID, пробуем еще раз
            console.warn(
              `⚠️  Конфликт ID при создании проблемы, попытка ${attempts}/${maxAttempts}`,
            );
            if (attempts >= maxAttempts) {
              throw new Error(
                "Не удалось создать уникальный ID после нескольких попыток",
              );
            }
          } else {
            // Другая ошибка, пробрасываем дальше
            throw error;
          }
        }
      }

      res.status(201).json({
        success: true,
        data: newProblem,
        message: "Проблема успешно создана",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Обновление проблемы
   * PUT /api/v1/problems/:id
   */
  async updateProblem(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Проверяем су��ествование проблемы
      const existingProblem = await problemModel.findById(id);
      if (!existingProblem) {
        return res.status(404).json({
          success: false,
          error: "Проблема не найдена",
          errorType: "NOT_FOUND",
          timestamp: new Date().toISOString(),
        });
      }

      // Проверяем существование устройства при изменении
      if (
        updateData.device_id &&
        updateData.device_id !== existingProblem.device_id
      ) {
        const device = await deviceModel.findById(updateData.device_id);
        if (!device || !device.is_active) {
          return res.status(400).json({
            success: false,
            error: "Указанное устройство не найдено или неактивно",
            errorType: "VALIDATION_ERROR",
            timestamp: new Date().toISOString(),
          });
        }
      }

      // Проверяем уникальность названия при изменении
      if (
        updateData.title &&
        updateData.title.trim().toLowerCase() !==
          existingProblem.title.trim().toLowerCase()
      ) {
        const deviceIdToCheck =
          updateData.device_id || existingProblem.device_id;
        const normalizedTitle = updateData.title.trim().toLowerCase();

        console.log(
          `🔍 Проверка уникальности при обновлении: "${updateData.title}" для устройства: ${deviceIdToCheck}`,
        );

        // Используем SQL запрос для case-insensitive поиска
        const checkSql = `
          SELECT id, title, status, created_at
          FROM problems
          WHERE LOWER(TRIM(title)) = $1
            AND device_id = $2
            AND is_active = true
            AND id != $3
          LIMIT 1
        `;

        const checkResult = await problemModel.query(checkSql, [
          normalizedTitle,
          deviceIdToCheck,
          id,
        ]);
        const duplicateProblem = checkResult.rows[0];

        if (duplicateProblem) {
          return res.status(409).json({
            success: false,
            error:
              "Проблема с таким названием уже существует для данного устройст��а",
            errorType: "DUPLICATE_ERROR",
            timestamp: new Date().toISOString(),
          });
        }
      }

      const updatedProblem = await problemModel.updateById(id, updateData);

      res.json({
        success: true,
        data: updatedProblem,
        message: "Проблема успешно обновлена",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Удаление проблемы
   * DELETE /api/v1/problems/:id
   */
  async deleteProblem(req, res, next) {
    try {
      const { id } = req.params;
      const { force = false } = req.query;

      // Проверяем существование проблемы
      const existingProblem = await problemModel.findById(id);
      if (!existingProblem) {
        return res.status(404).json({
          success: false,
          error: "Проблема не найдена",
          errorType: "NOT_FOUND",
          timestamp: new Date().toISOString(),
        });
      }

      // ��роверяем возможность удаления
      const deleteCheck = await problemModel.canDelete(id);
      if (!deleteCheck.canDelete && force !== "true") {
        return res.status(409).json({
          success: false,
          error: deleteCheck.reason,
          errorType: "CONSTRAINT_ERROR",
          suggestion: deleteCheck.suggestion,
          canForceDelete: false,
          timestamp: new Date().toISOString(),
        });
      }

      let deletedProblem;
      // force=true или "true" означает жесткое удаление
      // force=false или "false" означает мягкое удаление
      // По умолчанию (если force не указан) - жесткое удаление
      if (force === "true" || force === true || force === undefined) {
        // Жесткое удаление - полное удаление из базы
        deletedProblem = await problemModel.delete(id);
      } else {
        // Мягкое удаление (архивирование)
        deletedProblem = await problemModel.softDelete(id);
      }

      res.json({
        success: true,
        data: deletedProblem,
        message:
          force === "true" || force === true || force === undefined
            ? "Проблема удалена безвозвратно"
            : "Проблема архивирована",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Восстановление архивированной проблемы
   * POST /api/v1/problems/:id/restore
   */
  async restoreProblem(req, res, next) {
    try {
      const { id } = req.params;

      const restoredProblem = await problemModel.restore(id);
      if (!restoredProblem) {
        return res.status(404).json({
          success: false,
          error: "Проблема не найдена или уже активна",
          errorType: "NOT_FOUND",
          timestamp: new Date().toISOString(),
        });
      }

      res.json({
        success: true,
        data: restoredProblem,
        message: "Проблема успешно восстановлена",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * ��оиск проблем
   * GET /api/v1/problems/search
   */
  async searchProblems(req, res, next) {
    try {
      const { q: searchTerm, limit = 20, offset = 0 } = req.query;

      if (!searchTerm || searchTerm.trim().length < 2) {
        return res.status(400).json({
          success: false,
          error: "Поисковый запрос должен содержать минимум 2 символа",
          errorType: "VALIDATION_ERROR",
          timestamp: new Date().toISOString(),
        });
      }

      const problems = await problemModel.search(searchTerm.trim(), {
        limit: Math.min(parseInt(limit), 50),
        offset: parseInt(offset),
      });

      res.json({
        success: true,
        data: problems,
        query: searchTerm.trim(),
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Получение популярных проблем
   * GET /api/v1/problems/popular
   */
  async getPopularProblems(req, res, next) {
    try {
      const { limit = 10 } = req.query;

      const problems = await problemModel.getPopular(
        Math.min(parseInt(limit), 20),
      );

      res.json({
        success: true,
        data: problems,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Получение проблем по устройству
   * GET /api/v1/problems/device/:deviceId
   */
  async getProblemsByDevice(req, res, next) {
    try {
      const { deviceId } = req.params;
      const { status, limit = 20, offset = 0 } = req.query;

      // Проверяем существование устройства
      const device = await deviceModel.findById(deviceId);
      if (!device) {
        return res.status(404).json({
          success: false,
          error: "Устройство не найдено",
          errorType: "NOT_FOUND",
          timestamp: new Date().toISOString(),
        });
      }

      const options = {
        status,
        limit: Math.min(parseInt(limit), 50),
        offset: parseInt(offset),
      };

      const problems = await problemModel.findByDevice(deviceId, options);

      res.json({
        success: true,
        data: problems,
        device: {
          id: device.id,
          name: device.name,
          brand: device.brand,
          model: device.model,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Получение проблем по категории
   * GET /api/v1/problems/category/:category
   */
  async getProblemsByCategory(req, res, next) {
    try {
      const { category } = req.params;
      const { device_id, limit = 20, offset = 0 } = req.query;

      const options = {
        device_id,
        limit: Math.min(parseInt(limit), 50),
        offset: parseInt(offset),
      };

      const problems = await problemModel.findByCategory(category, options);

      res.json({
        success: true,
        data: problems,
        category,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Дублирование проблемы
   * POST /api/v1/problems/:id/duplicate
   */
  async duplicateProblem(req, res, next) {
    try {
      const { id } = req.params;
      const { target_device_id } = req.body;

      // Проверяем существование проблемы
      const existingProblem = await problemModel.findById(id);
      if (!existingProblem) {
        return res.status(404).json({
          success: false,
          error: "Проблема не найдена",
          errorType: "NOT_FOUND",
          timestamp: new Date().toISOString(),
        });
      }

      // Проверяем целевое устройство если указано
      if (target_device_id) {
        const targetDevice = await deviceModel.findById(target_device_id);
        if (!targetDevice || !targetDevice.is_active) {
          return res.status(400).json({
            success: false,
            error: "Целевое устройство не найдено или неактивно",
            errorType: "VALIDATION_ERROR",
            timestamp: new Date().toISOString(),
          });
        }
      }

      const duplicatedProblem = await problemModel.duplicate(
        id,
        target_device_id,
      );

      res.status(201).json({
        success: true,
        data: duplicatedProblem,
        message: "Проблема успешно продублирована",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Публикация проблемы
   * POST /api/v1/problems/:id/publish
   */
  async publishProblem(req, res, next) {
    try {
      const { id } = req.params;

      const publishedProblem = await problemModel.publish(id);
      if (!publishedProblem) {
        return res.status(404).json({
          success: false,
          error: "Проблема не найдена",
          errorType: "NOT_FOUND",
          timestamp: new Date().toISOString(),
        });
      }

      res.json({
        success: true,
        data: publishedProblem,
        message: "Проблема успешно опубликована",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Снятие проблемы с публикации
   * POST /api/v1/problems/:id/unpublish
   */
  async unpublishProblem(req, res, next) {
    try {
      const { id } = req.params;

      const unpublishedProblem = await problemModel.unpublish(id);
      if (!unpublishedProblem) {
        return res.status(404).json({
          success: false,
          error: "Проблема не найдена",
          errorType: "NOT_FOUND",
          timestamp: new Date().toISOString(),
        });
      }

      res.json({
        success: true,
        data: unpublishedProblem,
        message: "Проблема снята с публикации",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Получение статистики проблем
   * GET /api/v1/problems/stats
   */
  async getProblemStats(req, res, next) {
    try {
      const stats = await problemModel.getStats();

      res.json({
        success: true,
        data: stats,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Обновление статистики проблемы
   * POST /api/v1/problems/:id/update-stats
   */
  async updateProblemStats(req, res, next) {
    try {
      const { id } = req.params;
      const { session_result } = req.body;

      if (!session_result || !["success", "failure"].includes(session_result)) {
        return res.status(400).json({
          success: false,
          error: "Резуль��ат сессии должен быть success или failure",
          errorType: "VALIDATION_ERROR",
          timestamp: new Date().toISOString(),
        });
      }

      const updatedProblem = await problemModel.updateStats(id, session_result);
      if (!updatedProblem) {
        return res.status(404).json({
          success: false,
          error: "Проблема не найдена",
          errorType: "NOT_FOUND",
          timestamp: new Date().toISOString(),
        });
      }

      res.json({
        success: true,
        data: updatedProblem,
        message: "Статистика проблемы обновлена",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Экспорт проблем
   * GET /api/v1/problems/export
   */
  async exportProblems(req, res, next) {
    try {
      const { format = "json", device_id, include_steps = false } = req.query;

      const filters = { is_active: true };
      if (device_id) filters.device_id = device_id;

      const problems = await problemModel.findAllWithDetails(filters);

      let exportData = problems;

      if (include_steps === "true") {
        // Здесь можно добавить логику включения шагов диагностики
        // Для этого понадобится импорт DiagnosticStep модели
      }

      if (format === "json") {
        res.json({
          success: true,
          data: exportData,
          meta: {
            exportedAt: new Date().toISOString(),
            totalRecords: exportData.length,
            format: "json",
            filters: filters,
          },
        });
      } else {
        // Другие форматы можно добавить позже (CSV, XML и т.д.)
        res.status(400).json({
          success: false,
          error: "Неподдерживаемый формат экспорта",
          supportedFormats: ["json"],
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      next(error);
    }
  }
}

// Создаем экземпляр контроллера
const problemController = new ProblemController();

// Применяем валидацию к методам
const validateProblemCreation = validateRequest(problemValidation.create);
const validateProblemUpdate = validateRequest(problemValidation.update);

// Экспортируем методы с примененной валидацией
export const getProblems =
  problemController.getProblems.bind(problemController);
export const getProblemById =
  problemController.getProblemById.bind(problemController);
export const createProblem = [
  validateProblemCreation,
  problemController.createProblem.bind(problemController),
];
export const updateProblem = [
  validateProblemUpdate,
  problemController.updateProblem.bind(problemController),
];
export const deleteProblem =
  problemController.deleteProblem.bind(problemController);
export const restoreProblem =
  problemController.restoreProblem.bind(problemController);
export const searchProblems =
  problemController.searchProblems.bind(problemController);
export const getPopularProblems =
  problemController.getPopularProblems.bind(problemController);
export const getProblemsByDevice =
  problemController.getProblemsByDevice.bind(problemController);
export const getProblemsByCategory =
  problemController.getProblemsByCategory.bind(problemController);
export const duplicateProblem =
  problemController.duplicateProblem.bind(problemController);
export const publishProblem =
  problemController.publishProblem.bind(problemController);
export const unpublishProblem =
  problemController.unpublishProblem.bind(problemController);
export const getProblemStats =
  problemController.getProblemStats.bind(problemController);
export const updateProblemStats =
  problemController.updateProblemStats.bind(problemController);
export const exportProblems =
  problemController.exportProblems.bind(problemController);

export default problemController;
