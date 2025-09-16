import DiagnosticStep from "../models/DiagnosticStep.js";
import Problem from "../models/Problem.js";
import {
  stepValidation,
  validateRequest,
} from "../middleware/validateRequest.js";

const stepModel = new DiagnosticStep();
const problemModel = new Problem();

/**
 * Контроллер для управления диагностическими шагами
 */
class StepController {
  /**
   * Получение списка шагов
   * GET /api/v1/steps
   */
  async getSteps(req, res, next) {
    try {
      const {
        problem_id,
        device_id,
        search,
        is_active,
        page = 1,
        limit = 20,
        sort = "step_number",
        order = "asc",
        include_details = false,
      } = req.query;

      const filters = {};
      if (problem_id) filters.problem_id = problem_id;
      if (device_id) filters.device_id = device_id;
      if (search) filters.search = search;
      if (is_active !== undefined) filters.is_active = is_active === "true";

      const options = {
        limit: Math.min(parseInt(limit), 100),
        offset: (parseInt(page) - 1) * Math.min(parseInt(limit), 100),
        sortBy: sort,
        sortOrder: order.toUpperCase(),
      };

      let steps;
      if (include_details === "true") {
        // Получаем шаги с дополнительной информацией
        if (problem_id) {
          steps = await stepModel.findByProblem(problem_id, {
            is_active: filters.is_active,
          });
        } else {
          steps = await stepModel.findAll(filters, options);
        }
      } else {
        steps = await stepModel.findAll(filters, options);
      }

      // Подсчет общего количества для пагинации
      const total = await stepModel.count(filters);
      const totalPages = Math.ceil(total / options.limit);

      res.json({
        success: true,
        data: steps,
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
   * Получение шага по ID
   * GET /api/v1/steps/:id
   */
  async getStepById(req, res, next) {
    try {
      const { id } = req.params;
      const { include_details = false, include_stats = false } = req.query;

      let step;
      if (include_details === "true") {
        step = await stepModel.findByIdWithDetails(id);
      } else {
        step = await stepModel.findById(id);
      }

      if (!step) {
        return res.status(404).json({
          success: false,
          error: "Диагностический шаг не найден",
          errorType: "NOT_FOUND",
          timestamp: new Date().toISOString(),
        });
      }

      // Добавляем статистику использования если запрошено
      if (include_stats === "true") {
        const stats = await stepModel.getUsageStats(id);
        step.usage_stats = stats;
      }

      res.json({
        success: true,
        data: step,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Создание нового шага
   * POST /api/v1/steps
   */
  async createStep(req, res, next) {
    try {
      const stepData = req.body;

      // Проверяем существование проблемы
      if (stepData.problem_id) {
        const problem = await problemModel.findById(stepData.problem_id);
        if (!problem || !problem.is_active) {
          return res.status(400).json({
            success: false,
            error: "Указанная проблема не найдена или неактивна",
            errorType: "VALIDATION_ERROR",
            timestamp: new Date().toISOString(),
          });
        }
      }

      // Проверяем уникальность номера шага в рамках проблемы (если номер указан)
      if (stepData.step_number && stepData.problem_id) {
        const existingStep = await stepModel.findOne({
          problem_id: stepData.problem_id,
          step_number: stepData.step_number,
          is_active: true,
        });

        if (existingStep) {
          return res.status(409).json({
            success: false,
            error: `Шаг с номером ${stepData.step_number} уже существует для данной проблемы`,
            errorType: "DUPLICATE_ERROR",
            timestamp: new Date().toISOString(),
          });
        }
      }

      // Создаем шаг с автоматической нумерацией если номер не указан
      let newStep;
      if (stepData.step_number) {
        newStep = await stepModel.create(stepData);
      } else {
        newStep = await stepModel.createWithAutoNumber(stepData);
      }

      res.status(201).json({
        success: true,
        data: newStep,
        message: "Диагностический шаг успешно создан",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Обновление шага
   * PUT /api/v1/steps/:id
   */
  async updateStep(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Проверяем существование шага
      const existingStep = await stepModel.findById(id);
      if (!existingStep) {
        return res.status(404).json({
          success: false,
          error: "Диагностический шаг не найден",
          errorType: "NOT_FOUND",
          timestamp: new Date().toISOString(),
        });
      }

      // Проверяем существование проблемы при изменении
      if (
        updateData.problem_id &&
        updateData.problem_id !== existingStep.problem_id
      ) {
        const problem = await problemModel.findById(updateData.problem_id);
        if (!problem || !problem.is_active) {
          return res.status(400).json({
            success: false,
            error: "Указанная проблема не найдена или неактивна",
            errorType: "VALIDATION_ERROR",
            timestamp: new Date().toISOString(),
          });
        }
      }

      // Проверяем уникальность номера шага при изменении
      if (
        updateData.step_number &&
        updateData.step_number !== existingStep.step_number
      ) {
        const problemIdToCheck =
          updateData.problem_id || existingStep.problem_id;
        const duplicateStep = await stepModel.findOne({
          problem_id: problemIdToCheck,
          step_number: updateData.step_number,
          is_active: true,
        });

        if (duplicateStep && duplicateStep.id !== id) {
          return res.status(409).json({
            success: false,
            error: `Шаг с номером ${updateData.step_number} уже существует для данной проблемы`,
            errorType: "DUPLICATE_ERROR",
            timestamp: new Date().toISOString(),
          });
        }
      }

      const updatedStep = await stepModel.updateById(id, updateData);

      res.json({
        success: true,
        data: updatedStep,
        message: "Диагностический шаг успешно обновлен",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Удаление шага
   * DELETE /api/v1/steps/:id
   */
  async deleteStep(req, res, next) {
    try {
      const { id } = req.params;
      const { force = false, reorder = true } = req.query;

      // Проверяем с��ществование шага
      const existingStep = await stepModel.findById(id);
      if (!existingStep) {
        return res.status(404).json({
          success: false,
          error: "Диагностический шаг не найден",
          errorType: "NOT_FOUND",
          timestamp: new Date().toISOString(),
        });
      }

      // Проверяем возможность удаления
      const deleteCheck = await stepModel.canDelete(id);
      if (!deleteCheck.canDelete && force !== "true") {
        return res.status(409).json({
          success: false,
          error: deleteCheck.reason,
          errorType: "CONSTRAINT_ERROR",
          timestamp: new Date().toISOString(),
        });
      }

      let deletedStep;
      if (reorder === "true") {
        // Удаление с переупорядочиванием
        deletedStep = await stepModel.deleteWithReorder(id);
      } else if (force === "true") {
        // Жесткое удаление
        deletedStep = await stepModel.delete(id);
      } else {
        // Мягкое удаление
        deletedStep = await stepModel.softDelete(id);
      }

      res.json({
        success: true,
        data: deletedStep,
        message:
          force === "true" ? "Шаг удален безвозвратно" : "Шаг архивирован",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Восстановление архивированного шага
   * POST /api/v1/steps/:id/restore
   */
  async restoreStep(req, res, next) {
    try {
      const { id } = req.params;

      const restoredStep = await stepModel.restore(id);
      if (!restoredStep) {
        return res.status(404).json({
          success: false,
          error: "Шаг не найден или уже активен",
          errorType: "NOT_FOUND",
          timestamp: new Date().toISOString(),
        });
      }

      res.json({
        success: true,
        data: restoredStep,
        message: "Диагностический шаг успешно восстановлен",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Получение шагов по проблеме
   * GET /api/v1/steps/problem/:problemId
   */
  async getStepsByProblem(req, res, next) {
    try {
      const { problemId } = req.params;
      const { is_active = true } = req.query;

      // Проверяем существование проблемы
      const problem = await problemModel.findById(problemId);
      if (!problem) {
        return res.status(404).json({
          success: false,
          error: "Проблема не найдена",
          errorType: "NOT_FOUND",
          timestamp: new Date().toISOString(),
        });
      }

      const steps = await stepModel.findByProblem(problemId, {
        is_active: is_active === "true",
      });

      res.json({
        success: true,
        data: steps,
        problem: {
          id: problem.id,
          title: problem.title,
          device_id: problem.device_id,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Поиск шагов
   * GET /api/v1/steps/search
   */
  async searchSteps(req, res, next) {
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

      const steps = await stepModel.search(searchTerm.trim(), {
        limit: Math.min(parseInt(limit), 50),
        offset: parseInt(offset),
      });

      res.json({
        success: true,
        data: steps,
        query: searchTerm.trim(),
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Переупорядочивание шагов
   * PUT /api/v1/steps/reorder
   */
  async reorderSteps(req, res, next) {
    try {
      const { problem_id, step_ids } = req.body;

      if (!problem_id || !Array.isArray(step_ids) || step_ids.length === 0) {
        return res.status(400).json({
          success: false,
          error: "Необходимо указать ID проблемы и массив ID шагов",
          errorType: "VALIDATION_ERROR",
          timestamp: new Date().toISOString(),
        });
      }

      // Проверяем существование проблемы
      const problem = await problemModel.findById(problem_id);
      if (!problem) {
        return res.status(404).json({
          success: false,
          error: "Проблема не найдена",
          errorType: "NOT_FOUND",
          timestamp: new Date().toISOString(),
        });
      }

      const reorderedSteps = await stepModel.reorderSteps(problem_id, step_ids);

      res.json({
        success: true,
        data: reorderedSteps,
        message: "Порядок шагов обновлен",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Вставка шага между существующими шагами
   * POST /api/v1/steps/insert
   */
  async insertStep(req, res, next) {
    try {
      const { problem_id, after_step_number, ...stepData } = req.body;

      if (!problem_id || after_step_number === undefined) {
        return res.status(400).json({
          success: false,
          error:
            "Необходимо указать ID проблемы и номер шага, после которого вставить новый",
          errorType: "VALIDATION_ERROR",
          timestamp: new Date().toISOString(),
        });
      }

      // Проверяем существование проблемы
      const problem = await problemModel.findById(problem_id);
      if (!problem) {
        return res.status(404).json({
          success: false,
          error: "Проблема не найдена",
          errorType: "NOT_FOUND",
          timestamp: new Date().toISOString(),
        });
      }

      const insertedStep = await stepModel.insertStep(
        problem_id,
        after_step_number,
        stepData,
      );

      res.status(201).json({
        success: true,
        data: insertedStep,
        message: `Шаг вставлен после шага №${after_step_number}`,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Дублирование шага
   * POST /api/v1/steps/:id/duplicate
   */
  async duplicateStep(req, res, next) {
    try {
      const { id } = req.params;
      const { target_problem_id } = req.body;

      // Проверяем существование шага
      const existingStep = await stepModel.findById(id);
      if (!existingStep) {
        return res.status(404).json({
          success: false,
          error: "Диагностический шаг не найден",
          errorType: "NOT_FOUND",
          timestamp: new Date().toISOString(),
        });
      }

      // Проверяем целевую проблему если указана
      if (target_problem_id) {
        const targetProblem = await problemModel.findById(target_problem_id);
        if (!targetProblem || !targetProblem.is_active) {
          return res.status(400).json({
            success: false,
            error: "Целевая проблема не найдена или неактивна",
            errorType: "VALIDATION_ERROR",
            timestamp: new Date().toISOString(),
          });
        }
      }

      const duplicatedStep = await stepModel.duplicate(id, target_problem_id);

      res.status(201).json({
        success: true,
        data: duplicatedStep,
        message: "Диагностический шаг успешно продублирован",
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Получение следующего шага
   * GET /api/v1/steps/:id/next
   */
  async getNextStep(req, res, next) {
    try {
      const { id } = req.params;

      const nextStep = await stepModel.getNextStep(id);
      if (!nextStep) {
        return res.status(404).json({
          success: false,
          error: "Следующий шаг не найден",
          errorType: "NOT_FOUND",
          timestamp: new Date().toISOString(),
        });
      }

      res.json({
        success: true,
        data: nextStep,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Получение предыдущего шага
   * GET /api/v1/steps/:id/previous
   */
  async getPreviousStep(req, res, next) {
    try {
      const { id } = req.params;

      const previousStep = await stepModel.getPreviousStep(id);
      if (!previousStep) {
        return res.status(404).json({
          success: false,
          error: "Предыдущий шаг не найден",
          errorType: "NOT_FOUND",
          timestamp: new Date().toISOString(),
        });
      }

      res.json({
        success: true,
        data: previousStep,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Получение статистики использования шага
   * GET /api/v1/steps/:id/stats
   */
  async getStepStats(req, res, next) {
    try {
      const { id } = req.params;

      // Проверяем существование шага
      const step = await stepModel.findById(id);
      if (!step) {
        return res.status(404).json({
          success: false,
          error: "Диагностический шаг не найден",
          errorType: "NOT_FOUND",
          timestamp: new Date().toISOString(),
        });
      }

      const stats = await stepModel.getUsageStats(id);

      res.json({
        success: true,
        data: stats,
        step: {
          id: step.id,
          title: step.title,
          step_number: step.step_number,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Валидация порядка шагов в проблеме
   * GET /api/v1/steps/validate/:problemId
   */
  async validateStepOrder(req, res, next) {
    try {
      const { problemId } = req.params;

      // Проверяем существование проблемы
      const problem = await problemModel.findById(problemId);
      if (!problem) {
        return res.status(404).json({
          success: false,
          error: "Проблема не найдена",
          errorType: "NOT_FOUND",
          timestamp: new Date().toISOString(),
        });
      }

      const validation = await stepModel.validateStepOrder(problemId);

      res.json({
        success: true,
        data: validation,
        problem: {
          id: problem.id,
          title: problem.title,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Автоматическое исправление нумерации шагов
   * POST /api/v1/steps/fix-numbering/:problemId
   */
  async fixStepNumbering(req, res, next) {
    try {
      const { problemId } = req.params;

      // Проверяем существование проблемы
      const problem = await problemModel.findById(problemId);
      if (!problem) {
        return res.status(404).json({
          success: false,
          error: "Проблема не найдена",
          errorType: "NOT_FOUND",
          timestamp: new Date().toISOString(),
        });
      }

      const fixedSteps = await stepModel.fixStepNumbering(problemId);

      res.json({
        success: true,
        data: fixedSteps,
        message: `Исправлена нумерация для ${fixedSteps.length} шагов`,
        problem: {
          id: problem.id,
          title: problem.title,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      next(error);
    }
  }
}

// Создаем экземпляр контроллера
const stepController = new StepController();

// Применяем валидацию к методам
const validateStepCreation = validateRequest(stepValidation.create);
const validateStepUpdate = validateRequest(stepValidation.update);

// Экспортируем методы с примененной валидацией
export const getSteps = stepController.getSteps.bind(stepController);
export const getStepById = stepController.getStepById.bind(stepController);
export const createStep = [
  validateStepCreation,
  stepController.createStep.bind(stepController),
];
export const updateStep = [
  validateStepUpdate,
  stepController.updateStep.bind(stepController),
];
export const deleteStep = stepController.deleteStep.bind(stepController);
export const restoreStep = stepController.restoreStep.bind(stepController);
export const getStepsByProblem =
  stepController.getStepsByProblem.bind(stepController);
export const searchSteps = stepController.searchSteps.bind(stepController);
export const reorderSteps = stepController.reorderSteps.bind(stepController);
export const insertStep = stepController.insertStep.bind(stepController);
export const duplicateStep = stepController.duplicateStep.bind(stepController);
export const getNextStep = stepController.getNextStep.bind(stepController);
export const getPreviousStep =
  stepController.getPreviousStep.bind(stepController);
export const getStepStats = stepController.getStepStats.bind(stepController);
export const validateStepOrder =
  stepController.validateStepOrder.bind(stepController);
export const fixStepNumbering =
  stepController.fixStepNumbering.bind(stepController);

export default stepController;
