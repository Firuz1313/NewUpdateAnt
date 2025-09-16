import BaseModel from "./BaseModel.js";
import { query, transaction } from "../utils/database.js";

/**
 * Модель для работы с диагностическими шагами
 */
class DiagnosticStep extends BaseModel {
  constructor() {
    super("diagnostic_steps");
  }

  /**
   * Получение шагов по проблеме с сортировкой по номеру шага
   */
  async findByProblem(problemId, options = {}) {
    try {
      const filters = { problem_id: problemId };
      if (options.is_active !== undefined) {
        filters.is_active = options.is_active;
      }

      const sql = `
        SELECT 
          ds.*,
          r.name as remote_name,
          r.manufacturer as remote_manufacturer,
          r.model as remote_model,
          tv.name as tv_interface_name,
          tv.type as tv_interface_type
        FROM diagnostic_steps ds
        LEFT JOIN remotes r ON ds.remote_id = r.id
        LEFT JOIN tv_interfaces tv ON ds.tv_interface_id = tv.id
        WHERE ds.problem_id = $1 ${options.is_active !== undefined ? "AND ds.is_active = $2" : ""}
        ORDER BY ds.step_number ASC
      `;

      const values = [problemId];
      if (options.is_active !== undefined) {
        values.push(options.is_active);
      }

      const result = await query(sql, values);
      return result.rows;
    } catch (error) {
      console.error("Ошибка получения шагов по проблеме:", error.message);
      throw error;
    }
  }

  /**
   * Получение шага по ID с дополнительной информацией
   */
  async findByIdWithDetails(id) {
    try {
      const sql = `
        SELECT 
          ds.*,
          p.title as problem_title,
          p.device_id as problem_device_id,
          d.name as device_name,
          d.brand as device_brand,
          r.name as remote_name,
          r.manufacturer as remote_manufacturer,
          r.image_data as remote_image_data,
          r.dimensions as remote_dimensions,
          tv.name as tv_interface_name,
          tv.type as tv_interface_type,
          tv.screenshot_data as tv_screenshot_data
        FROM diagnostic_steps ds
        LEFT JOIN problems p ON ds.problem_id = p.id
        LEFT JOIN devices d ON ds.device_id = d.id
        LEFT JOIN remotes r ON ds.remote_id = r.id
        LEFT JOIN tv_interfaces tv ON ds.tv_interface_id = tv.id
        WHERE ds.id = $1
      `;

      const result = await query(sql, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error("Ошибка получения шага с деталями:", error.message);
      throw error;
    }
  }

  /**
   * Создание нового шага с автоматической нумерацией
   */
  async createWithAutoNumber(data) {
    try {
      return await transaction(async (client) => {
        // Получаем максимальный номер шага для данной проблемы
        const maxNumberResult = await client.query(
          "SELECT COALESCE(MAX(step_number), 0) as max_number FROM diagnostic_steps WHERE problem_id = $1",
          [data.problem_id],
        );

        const nextStepNumber = parseInt(maxNumberResult.rows[0].max_number) + 1;

        // Создаем шаг с новым номером
        const stepData = {
          ...data,
          step_number: data.step_number || nextStepNumber,
        };

        const prepared = this.prepareForInsert(stepData);
        const { sql, values } = this.buildInsertQuery(prepared);
        const result = await client.query(sql, values);

        return result.rows[0];
      });
    } catch (error) {
      console.error("Ошибка создания шага с автонумерацией:", error.message);
      throw error;
    }
  }

  /**
   * Переупорядочивание шагов
   */
  async reorderSteps(problemId, stepIds) {
    try {
      return await transaction(async (client) => {
        const results = [];

        for (let i = 0; i < stepIds.length; i++) {
          const stepId = stepIds[i];
          const newStepNumber = i + 1;

          const result = await client.query(
            `
            UPDATE diagnostic_steps 
            SET step_number = $1, updated_at = $2
            WHERE id = $3 AND problem_id = $4
            RETURNING *
          `,
            [newStepNumber, this.createTimestamp(), stepId, problemId],
          );

          if (result.rows[0]) {
            results.push(result.rows[0]);
          }
        }

        return results;
      });
    } catch (error) {
      console.error("Ошибка переупорядочивания шагов:", error.message);
      throw error;
    }
  }

  /**
   * Вставка шага между существующими шагами
   */
  async insertStep(problemId, afterStepNumber, stepData) {
    try {
      return await transaction(async (client) => {
        // Сдвигаем все шаги после указанной позиции
        await client.query(
          `
          UPDATE diagnostic_steps 
          SET step_number = step_number + 1, updated_at = $1
          WHERE problem_id = $2 AND step_number > $3
        `,
          [this.createTimestamp(), problemId, afterStepNumber],
        );

        // Создаем новый шаг
        const newStepData = {
          ...stepData,
          problem_id: problemId,
          step_number: afterStepNumber + 1,
        };

        const prepared = this.prepareForInsert(newStepData);
        const { sql, values } = this.buildInsertQuery(prepared);
        const result = await client.query(sql, values);

        return result.rows[0];
      });
    } catch (error) {
      console.error("Ошибка вставки шага:", error.message);
      throw error;
    }
  }

  /**
   * Удаление шага с переупорядочиванием
   */
  async deleteWithReorder(stepId) {
    try {
      return await transaction(async (client) => {
        // Получаем информацию о шаге перед удалением
        const stepResult = await client.query(
          "SELECT problem_id, step_number FROM diagnostic_steps WHERE id = $1",
          [stepId],
        );

        if (stepResult.rows.length === 0) {
          throw new Error("Шаг не найден");
        }

        const { problem_id, step_number } = stepResult.rows[0];

        // Удаляем шаг
        const deleteResult = await client.query(
          "DELETE FROM diagnostic_steps WHERE id = $1 RETURNING *",
          [stepId],
        );

        // Сдвигаем номера всех последующих шагов
        await client.query(
          `
          UPDATE diagnostic_steps 
          SET step_number = step_number - 1, updated_at = $1
          WHERE problem_id = $2 AND step_number > $3
        `,
          [this.createTimestamp(), problem_id, step_number],
        );

        return deleteResult.rows[0];
      });
    } catch (error) {
      console.error(
        "Ошибка удаления шага с переупорядочиванием:",
        error.message,
      );
      throw error;
    }
  }

  /**
   * Дублирование шага
   */
  async duplicate(stepId, targetProblemId = null) {
    try {
      return await transaction(async (client) => {
        // Получаем оригинальный шаг
        const originalResult = await client.query(
          "SELECT * FROM diagnostic_steps WHERE id = $1",
          [stepId],
        );

        if (originalResult.rows.length === 0) {
          throw new Error("Шаг не найден");
        }

        const original = originalResult.rows[0];
        const problemId = targetProblemId || original.problem_id;

        // Получаем максимальный номер шага для целевой проблемы
        const maxNumberResult = await client.query(
          "SELECT COALESCE(MAX(step_number), 0) as max_number FROM diagnostic_steps WHERE problem_id = $1",
          [problemId],
        );

        const nextStepNumber = parseInt(maxNumberResult.rows[0].max_number) + 1;

        // Создаем дубликат
        const newStep = {
          ...original,
          id: this.generateId(),
          problem_id: problemId,
          step_number: nextStepNumber,
          title: `${original.title} (копия)`,
          created_at: this.createTimestamp(),
          updated_at: this.createTimestamp(),
        };

        delete newStep.id; // Удаляем, чтобы использовать новый сгенерированный
        const prepared = this.prepareForInsert(newStep);

        const { sql, values } = this.buildInsertQuery(prepared);
        const result = await client.query(sql, values);

        return result.rows[0];
      });
    } catch (error) {
      console.error("Ошибка дублирования шага:", error.message);
      throw error;
    }
  }

  /**
   * Поиск шагов по тексту
   */
  async search(searchTerm, options = {}) {
    try {
      const sql = `
        SELECT 
          ds.*,
          p.title as problem_title,
          d.name as device_name,
          d.brand as device_brand,
          ts_rank(
            to_tsvector('russian', ds.title || ' ' || COALESCE(ds.description, '') || ' ' || ds.instruction), 
            plainto_tsquery('russian', $1)
          ) as rank
        FROM diagnostic_steps ds
        LEFT JOIN problems p ON ds.problem_id = p.id
        LEFT JOIN devices d ON ds.device_id = d.id
        WHERE ds.is_active = true
          AND to_tsvector('russian', ds.title || ' ' || COALESCE(ds.description, '') || ' ' || ds.instruction)
              @@ plainto_tsquery('russian', $1)
        ORDER BY rank DESC, ds.step_number ASC
        LIMIT $2 OFFSET $3
      `;

      const limit = options.limit || 20;
      const offset = options.offset || 0;

      const result = await query(sql, [searchTerm, limit, offset]);
      return result.rows.map((row) => ({
        ...row,
        rank: parseFloat(row.rank || 0),
      }));
    } catch (error) {
      console.error("Ошибка поиска шагов:", error.message);
      throw error;
    }
  }

  /**
   * Получение статистики использования шагов
   */
  async getUsageStats(stepId) {
    try {
      const sql = `
        SELECT 
          COUNT(ss.id) as total_executions,
          COUNT(CASE WHEN ss.completed = true THEN 1 END) as successful_executions,
          COUNT(CASE WHEN ss.result = 'failure' THEN 1 END) as failed_executions,
          COUNT(CASE WHEN ss.result = 'skipped' THEN 1 END) as skipped_executions,
          AVG(ss.time_spent) as avg_time_spent,
          MIN(ss.time_spent) as min_time_spent,
          MAX(ss.time_spent) as max_time_spent
        FROM diagnostic_steps ds
        LEFT JOIN session_steps ss ON ds.id = ss.step_id
        WHERE ds.id = $1
        GROUP BY ds.id
      `;

      const result = await query(sql, [stepId]);
      if (result.rows.length === 0) {
        return {
          total_executions: 0,
          successful_executions: 0,
          failed_executions: 0,
          skipped_executions: 0,
          avg_time_spent: null,
          min_time_spent: null,
          max_time_spent: null,
          success_rate: 0,
        };
      }

      const stats = result.rows[0];
      const totalExecutions = parseInt(stats.total_executions || 0);
      const successfulExecutions = parseInt(stats.successful_executions || 0);

      return {
        total_executions: totalExecutions,
        successful_executions: successfulExecutions,
        failed_executions: parseInt(stats.failed_executions || 0),
        skipped_executions: parseInt(stats.skipped_executions || 0),
        avg_time_spent: stats.avg_time_spent
          ? Math.round(parseFloat(stats.avg_time_spent))
          : null,
        min_time_spent: stats.min_time_spent
          ? parseInt(stats.min_time_spent)
          : null,
        max_time_spent: stats.max_time_spent
          ? parseInt(stats.max_time_spent)
          : null,
        success_rate:
          totalExecutions > 0
            ? Math.round((successfulExecutions / totalExecutions) * 100)
            : 0,
      };
    } catch (error) {
      console.error(
        "Ошибка получения статистики использования шага:",
        error.message,
      );
      throw error;
    }
  }

  /**
   * Проверка возможности удаления шага
   */
  async canDelete(id) {
    try {
      // Сначала проверяем, существует ли шаг
      const stepCheck = await query(
        "SELECT id FROM diagnostic_steps WHERE id = $1",
        [id],
      );
      if (stepCheck.rows.length === 0) {
        return { canDelete: false, reason: "Шаг не найден" };
      }

      // Проверяем, существуют ли таблицы сессий
      const tablesExistCheck = await query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = 'session_steps'
        ) as session_steps_exists,
        EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name = 'diagnostic_sessions'
        ) as diagnostic_sessions_exists
      `);

      const { session_steps_exists, diagnostic_sessions_exists } =
        tablesExistCheck.rows[0];

      // Если таблицы сессий не существуют, разрешаем удаление
      if (!session_steps_exists || !diagnostic_sessions_exists) {
        console.log("Таблицы сессий не найде��ы, разрешаем удаление шага");
        return { canDelete: true };
      }

      // Если таблицы существуют, проверяем активные сессии
      // Используем CAST для приведения типов
      const sql = `
        SELECT
          COUNT(ss.id) as session_steps_count,
          COUNT(CASE WHEN sess.end_time IS NULL THEN 1 END) as active_sessions_count
        FROM diagnostic_steps ds
        LEFT JOIN session_steps ss ON CAST(ds.id AS TEXT) = CAST(ss.step_id AS TEXT)
        LEFT JOIN diagnostic_sessions sess ON ss.session_id = sess.id AND sess.is_active = true
        WHERE ds.id = $1
        GROUP BY ds.id
      `;

      const result = await query(sql, [id]);

      if (result.rows.length === 0) {
        // Если нет результатов в LEFT JOIN, значит нет связанных сессий
        return { canDelete: true };
      }

      const stats = result.rows[0];
      const activeSessionsCount = parseInt(stats.active_sessions_count || 0);

      if (activeSessionsCount > 0) {
        return {
          canDelete: false,
          reason: `Невозможно удалить шаг, используемый в ${activeSessionsCount} активных сессиях диагно��тики`,
        };
      }

      return { canDelete: true };
    } catch (error) {
      console.error(
        "Ошибка проверки возможности удаления шага:",
        error.message,
      );
      // В случае ошибки разрешаем удаление (fail-safe)
      console.log("Разрешаем удаление из-за ошибки проверки");
      return { canDelete: true };
    }
  }

  /**
   * Получение следующего шага
   */
  async getNextStep(currentStepId) {
    try {
      const sql = `
        SELECT ds2.*
        FROM diagnostic_steps ds1
        JOIN diagnostic_steps ds2 ON ds1.problem_id = ds2.problem_id 
          AND ds2.step_number = ds1.step_number + 1
          AND ds2.is_active = true
        WHERE ds1.id = $1 AND ds1.is_active = true
      `;

      const result = await query(sql, [currentStepId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error("Ошибка получения следующего шага:", error.message);
      throw error;
    }
  }

  /**
   * Получение предыдущего шага
   */
  async getPreviousStep(currentStepId) {
    try {
      const sql = `
        SELECT ds2.*
        FROM diagnostic_steps ds1
        JOIN diagnostic_steps ds2 ON ds1.problem_id = ds2.problem_id 
          AND ds2.step_number = ds1.step_number - 1
          AND ds2.is_active = true
        WHERE ds1.id = $1 AND ds1.is_active = true
      `;

      const result = await query(sql, [currentStepId]);
      return result.rows[0] || null;
    } catch (error) {
      console.error("Ошибка получения предыдущего шага:", error.message);
      throw error;
    }
  }

  /**
   * Валидация порядка шагов в проблеме
   */
  async validateStepOrder(problemId) {
    try {
      const sql = `
        SELECT step_number, COUNT(*) as count
        FROM diagnostic_steps 
        WHERE problem_id = $1 AND is_active = true
        GROUP BY step_number
        HAVING COUNT(*) > 1
      `;

      const result = await query(sql, [problemId]);
      return {
        isValid: result.rows.length === 0,
        duplicates: result.rows,
      };
    } catch (error) {
      console.error("Ошибка валидации порядка шагов:", error.message);
      throw error;
    }
  }

  /**
   * Автоматическое исправление нумерации шагов
   */
  async fixStepNumbering(problemId) {
    try {
      return await transaction(async (client) => {
        // Получаем все шаги проблемы, отсортированные по текущей нумерации
        const stepsResult = await client.query(
          `
          SELECT id, step_number 
          FROM diagnostic_steps 
          WHERE problem_id = $1 AND is_active = true
          ORDER BY step_number ASC, created_at ASC
        `,
          [problemId],
        );

        const results = [];

        // Перенумеровываем шаги
        for (let i = 0; i < stepsResult.rows.length; i++) {
          const step = stepsResult.rows[i];
          const newStepNumber = i + 1;

          if (step.step_number !== newStepNumber) {
            const result = await client.query(
              `
              UPDATE diagnostic_steps 
              SET step_number = $1, updated_at = $2
              WHERE id = $3
              RETURNING *
            `,
              [newStepNumber, this.createTimestamp(), step.id],
            );

            results.push(result.rows[0]);
          }
        }

        return results;
      });
    } catch (error) {
      console.error("Ошибка исправления нумерации шагов:", error.message);
      throw error;
    }
  }
}

export default DiagnosticStep;
