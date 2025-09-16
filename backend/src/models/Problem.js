import BaseModel from "./BaseModel.js";
import { query, transaction } from "../utils/database.js";

/**
 * Модель для работы с проблемами
 */
class Problem extends BaseModel {
  constructor() {
    super("problems");
  }

  /**
   * Получение проблем с информацией об устройстве и количестве шагов
   */
  async findAllWithDetails(filters = {}, options = {}) {
    try {
      let whereConditions = ["p.id IS NOT NULL"];
      const values = [];
      let paramIndex = 1;

      // Фильтр по устройству
      if (filters.device_id) {
        whereConditions.push(`p.device_id = $${paramIndex}`);
        values.push(filters.device_id);
        paramIndex++;
      }

      // Фильтр по категории
      if (filters.category) {
        whereConditions.push(`p.category = $${paramIndex}`);
        values.push(filters.category);
        paramIndex++;
      }

      // Фильтр по статусу
      if (filters.status) {
        whereConditions.push(`p.status = $${paramIndex}`);
        values.push(filters.status);
        paramIndex++;
      }

      // Фильтр по активности
      if (filters.is_active !== undefined) {
        whereConditions.push(`p.is_active = $${paramIndex}`);
        values.push(filters.is_active);
        paramIndex++;
      }

      // Поиск по тексту
      if (filters.search) {
        whereConditions.push(`(
          p.title ILIKE $${paramIndex} OR 
          p.description ILIKE $${paramIndex}
        )`);
        values.push(`%${filters.search}%`);
        paramIndex++;
      }

      const sql = `
        SELECT
          p.*,
          d.name as device_name,
          d.brand as device_brand,
          d.model as device_model,
          d.color as device_color,
          COUNT(DISTINCT ds.id) as steps_count,
          COUNT(DISTINCT CASE WHEN ds.is_active = true THEN ds.id END) as active_steps_count,
          COUNT(DISTINCT sess.id) as sessions_count,
          0 as successful_sessions_count
        FROM problems p
        LEFT JOIN devices d ON p.device_id = d.id
        LEFT JOIN diagnostic_steps ds ON p.id = ds.problem_id
        LEFT JOIN diagnostic_sessions sess ON p.id = sess.problem_id
        WHERE ${whereConditions.join(" AND ")}
        GROUP BY p.id, d.name, d.brand, d.model, d.color
        ORDER BY p.priority DESC, p.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      const limit = options.limit || 20;
      const offset = options.offset || 0;
      values.push(limit, offset);

      const result = await query(sql, values);
      return result.rows.map((row) => ({
        ...row,
        steps_count: parseInt(row.steps_count || 0),
        active_steps_count: parseInt(row.active_steps_count || 0),
        sessions_count: parseInt(row.sessions_count || 0),
        successful_sessions_count: parseInt(row.successful_sessions_count || 0),
      }));
    } catch (error) {
      console.error("Ошибка получения проблем с деталями:", error.message);
      throw error;
    }
  }

  /**
   * Получение проблемы по ID с полной информацией
   */
  async findByIdWithDetails(id) {
    try {
      const sql = `
        SELECT
          p.*,
          d.name as device_name,
          d.brand as device_brand,
          d.model as device_model,
          d.color as device_color,
          d.status as device_status,
          COUNT(DISTINCT ds.id) as steps_count,
          COUNT(DISTINCT CASE WHEN ds.is_active = true THEN ds.id END) as active_steps_count,
          COUNT(DISTINCT sess.id) as sessions_count,
          0 as successful_sessions_count,
          NULL as avg_completion_time
        FROM problems p
        LEFT JOIN devices d ON p.device_id = d.id
        LEFT JOIN diagnostic_steps ds ON p.id = ds.problem_id
        LEFT JOIN diagnostic_sessions sess ON p.id = sess.problem_id
        WHERE p.id = $1
        GROUP BY p.id, d.name, d.brand, d.model, d.color, d.status
      `;

      const result = await query(sql, [id]);
      if (result.rows.length === 0) {
        return null;
      }

      const problem = result.rows[0];
      return {
        ...problem,
        steps_count: parseInt(problem.steps_count || 0),
        active_steps_count: parseInt(problem.active_steps_count || 0),
        sessions_count: parseInt(problem.sessions_count || 0),
        successful_sessions_count: parseInt(
          problem.successful_sessions_count || 0,
        ),
        avg_completion_time: problem.avg_completion_time
          ? Math.round(parseFloat(problem.avg_completion_time))
          : null,
      };
    } catch (error) {
      console.error("Ошибка получения проблемы с деталями:", error.message);
      throw error;
    }
  }

  /**
   * Получение проблем по устройству
   */
  async findByDevice(deviceId, options = {}) {
    try {
      const filters = { device_id: deviceId, is_active: true };
      if (options.status) {
        filters.status = options.status;
      }

      return this.findAllWithDetails(filters, options);
    } catch (error) {
      console.error("Ошибка получения проблем по устройству:", error.message);
      throw error;
    }
  }

  /**
   * Поиск проблем по тексту
   */
  async search(searchTerm, options = {}) {
    try {
      const sql = `
        SELECT 
          p.*,
          d.name as device_name,
          d.brand as device_brand,
          d.model as device_model,
          d.color as device_color,
          COUNT(DISTINCT ds.id) as steps_count,
          ts_rank(
            to_tsvector('russian', p.title || ' ' || COALESCE(p.description, '')), 
            plainto_tsquery('russian', $1)
          ) as rank
        FROM problems p
        LEFT JOIN devices d ON p.device_id = d.id
        LEFT JOIN diagnostic_steps ds ON p.id = ds.problem_id AND ds.is_active = true
        WHERE p.is_active = true
          AND to_tsvector('russian', p.title || ' ' || COALESCE(p.description, ''))
              @@ plainto_tsquery('russian', $1)
        GROUP BY p.id, d.name, d.brand, d.model, d.color
        ORDER BY rank DESC, p.priority DESC
        LIMIT $2 OFFSET $3
      `;

      const limit = options.limit || 20;
      const offset = options.offset || 0;

      const result = await query(sql, [searchTerm, limit, offset]);
      return result.rows.map((row) => ({
        ...row,
        steps_count: parseInt(row.steps_count || 0),
        rank: parseFloat(row.rank || 0),
      }));
    } catch (error) {
      console.error("Ошибка поиска проблем:", error.message);
      throw error;
    }
  }

  /**
   * Получение популярных проблем
   */
  async getPopular(limit = 10) {
    try {
      const sql = `
        SELECT 
          p.*,
          d.name as device_name,
          d.brand as device_brand,
          d.color as device_color,
          COUNT(DISTINCT ds.id) as steps_count,
          p.completed_count,
          p.success_rate
        FROM problems p
        LEFT JOIN devices d ON p.device_id = d.id
        LEFT JOIN diagnostic_steps ds ON p.id = ds.problem_id AND ds.is_active = true
        WHERE p.is_active = true AND p.status = 'published'
        GROUP BY p.id, d.name, d.brand, d.color
        ORDER BY p.completed_count DESC, p.success_rate DESC
        LIMIT $1
      `;

      const result = await query(sql, [limit]);
      return result.rows.map((row) => ({
        ...row,
        steps_count: parseInt(row.steps_count || 0),
      }));
    } catch (error) {
      console.error("Ошибка получения популярных пробле��:", error.message);
      throw error;
    }
  }

  /**
   * Получение проблем по категории
   */
  async findByCategory(category, options = {}) {
    try {
      const filters = { category, is_active: true };
      if (options.device_id) {
        filters.device_id = options.device_id;
      }

      return this.findAllWithDetails(filters, options);
    } catch (error) {
      console.error("Ошибка получения проблем по категории:", error.message);
      throw error;
    }
  }

  /**
   * Дублирование проблемы
   */
  async duplicate(problemId, targetDeviceId = null) {
    try {
      return await transaction(async (client) => {
        // Получаем ори��инальную проблему
        const originalResult = await client.query(
          "SELECT * FROM problems WHERE id = $1",
          [problemId],
        );

        if (originalResult.rows.length === 0) {
          throw new Error("Проблема не найдена");
        }

        const original = originalResult.rows[0];

        // Создаем дубликат
        const newProblem = {
          ...original,
          id: this.generateId(),
          title: `${original.title} (копия)`,
          device_id: targetDeviceId || original.device_id,
          status: "draft",
          completed_count: 0,
          created_at: this.createTimestamp(),
          updated_at: this.createTimestamp(),
        };

        delete newProblem.id; // Удаляем, чтобы использовать новый сгенерированный
        const prepared = this.prepareForInsert(newProblem);

        const { sql: insertSql, values: insertValues } =
          this.buildInsertQuery(prepared);
        const insertResult = await client.query(insertSql, insertValues);
        const duplicatedProblem = insertResult.rows[0];

        // Дублируем связанные шаги
        const stepsResult = await client.query(
          "SELECT * FROM diagnostic_steps WHERE problem_id = $1 ORDER BY step_number",
          [problemId],
        );

        for (const step of stepsResult.rows) {
          const newStep = {
            ...step,
            id: this.generateId(),
            problem_id: duplicatedProblem.id,
            device_id: targetDeviceId || step.device_id,
            created_at: this.createTimestamp(),
            updated_at: this.createTimestamp(),
          };

          delete newStep.id;

          const stepColumns = Object.keys(newStep);
          const stepValues = Object.values(newStep);
          const stepPlaceholders = stepColumns.map(
            (_, index) => `$${index + 1}`,
          );

          await client.query(
            `INSERT INTO diagnostic_steps (${stepColumns.join(", ")}) VALUES (${stepPlaceholders.join(", ")})`,
            stepValues,
          );
        }

        return duplicatedProblem;
      });
    } catch (error) {
      console.error("Ошибка дублирования проблемы:", error.message);
      throw error;
    }
  }

  /**
   * Обновление статистики проблемы
   */
  async updateStats(problemId, sessionResult) {
    try {
      const sql = `
        UPDATE problems 
        SET 
          completed_count = completed_count + 1,
          success_rate = (
            SELECT ROUND(
              (COUNT(CASE WHEN success = true THEN 1 END) * 100.0) / 
              NULLIF(COUNT(*), 0)
            )::integer
            FROM diagnostic_sessions 
            WHERE problem_id = $1 AND is_active = true
          ),
          updated_at = $2
        WHERE id = $1
        RETURNING *
      `;

      const result = await query(sql, [problemId, this.createTimestamp()]);
      return result.rows[0];
    } catch (error) {
      console.error("Ошибка обновления статистики проблемы:", error.message);
      throw error;
    }
  }

  /**
   * Проверка возможности удаления проблемы
   */
  async canDelete(id) {
    try {
      const sql = `
        SELECT
          COUNT(ds.id) as steps_count,
          COUNT(sess.id) as sessions_count
        FROM problems p
        LEFT JOIN diagnostic_steps ds ON p.id = ds.problem_id AND ds.is_active = true
        LEFT JOIN diagnostic_sessions sess ON p.id = sess.problem_id
        WHERE p.id = $1
        GROUP BY p.id
      `;

      const result = await query(sql, [id]);
      if (result.rows.length === 0) {
        return { canDelete: false, reason: "Проблема не найдена" };
      }

      const stats = result.rows[0];
      const stepsCount = parseInt(stats.steps_count || 0);
      const sessionsCount = parseInt(stats.sessions_count || 0);

      if (sessionsCount > 0) {
        return {
          canDelete: false,
          reason: `Невозможно удалить проблему с ${sessionsCount} связанными сессиями диагностики`,
        };
      }

      if (stepsCount > 0) {
        return {
          canDelete: false,
          reason: `Проблема содержит ${stepsCount} ��иагностических шагов. Сначала удалите их.`,
          suggestion: "Можно архивировать проблему вместо удаления",
        };
      }

      return { canDelete: true };
    } catch (error) {
      console.error(
        "Ошибка проверки возможности удаления проблемы:",
        error.message,
      );
      throw error;
    }
  }

  /**
   * Получение статистики по проблемам
   */
  async getStats() {
    try {
      const sql = `
        SELECT 
          COUNT(*) as total_problems,
          COUNT(CASE WHEN is_active = true THEN 1 END) as active_problems,
          COUNT(CASE WHEN status = 'published' THEN 1 END) as published_problems,
          COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_problems,
          COUNT(CASE WHEN category = 'critical' THEN 1 END) as critical_problems,
          COUNT(CASE WHEN category = 'moderate' THEN 1 END) as moderate_problems,
          COUNT(CASE WHEN category = 'minor' THEN 1 END) as minor_problems,
          AVG(success_rate) as avg_success_rate,
          SUM(completed_count) as total_completions
        FROM problems
      `;

      const result = await query(sql);
      const stats = result.rows[0];

      return {
        total: parseInt(stats.total_problems || 0),
        active: parseInt(stats.active_problems || 0),
        published: parseInt(stats.published_problems || 0),
        draft: parseInt(stats.draft_problems || 0),
        critical: parseInt(stats.critical_problems || 0),
        moderate: parseInt(stats.moderate_problems || 0),
        minor: parseInt(stats.minor_problems || 0),
        avgSuccessRate: Math.round(parseFloat(stats.avg_success_rate || 0)),
        totalCompletions: parseInt(stats.total_completions || 0),
      };
    } catch (error) {
      console.error("Ошибка получения статистики проблем:", error.message);
      throw error;
    }
  }

  /**
   * Публикация проблемы
   */
  async publish(id) {
    try {
      // Проверяем, что у проблемы есть хотя бы один активный шаг
      const stepsCheck = await query(
        "SELECT COUNT(*) as count FROM diagnostic_steps WHERE problem_id = $1 AND is_active = true",
        [id],
      );

      if (parseInt(stepsCheck.rows[0].count) === 0) {
        throw new Error(
          "Невозможно опубликовать проблему без диагностических шагов",
        );
      }

      const sql = `
        UPDATE problems 
        SET status = 'published', updated_at = $2
        WHERE id = $1 AND is_active = true
        RETURNING *
      `;

      const result = await query(sql, [id, this.createTimestamp()]);
      return result.rows[0];
    } catch (error) {
      console.error("Ошибка публикации проблемы:", error.message);
      throw error;
    }
  }

  /**
   * Снятие с публикации
   */
  async unpublish(id) {
    try {
      const sql = `
        UPDATE problems 
        SET status = 'draft', updated_at = $2
        WHERE id = $1 AND is_active = true
        RETURNING *
      `;

      const result = await query(sql, [id, this.createTimestamp()]);
      return result.rows[0];
    } catch (error) {
      console.error("Ошибка снятия проблемы с публикации:", error.message);
      throw error;
    }
  }
}

export default Problem;
