import { query, transaction } from "../utils/database.js";
import { v4 as uuidv4 } from "uuid";

/**
 * Базовая модель с общими методами для всех сущностей
 */
class BaseModel {
  constructor(tableName, validationRules = {}) {
    this.tableName = tableName;
    this.validationRules = validationRules;
  }

  /**
   * Выполнение SQL запроса
   */
  async query(sql, params = []) {
    return await query(sql, params);
  }

  /**
   * Генерация уникального ID
   */
  generateId() {
    // Используем более надежную генерацию ID с префиксом таблицы
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substr(2, 9);
    const tablePart = this.tableName.substr(0, 3); // Первые 3 символа названия таблицы
    const microTime = process.hrtime.bigint().toString(36).substr(-4); // Микросекунды для уникальности

    return `${tablePart}_${timestamp}_${randomPart}_${microTime}`;
  }

  /**
   * Создание временной метки
   */
  createTimestamp() {
    return new Date().toISOString();
  }

  /**
   * Подготовка данных для вставки
   */
  prepareForInsert(data) {
    const prepared = {
      ...data,
      id: data.id || this.generateId(),
      created_at: this.createTimestamp(),
      updated_at: this.createTimestamp(),
      is_active: data.is_active !== undefined ? data.is_active : true,
    };

    // Конвертируем объекты и массивы в JSON строки для PostgreSQL JSONB полей
    return this.serializeJsonFields(prepared);
  }

  /**
   * ��одготовка данных для обновления
   */
  prepareForUpdate(data) {
    const prepared = {
      ...data,
      updated_at: this.createTimestamp(),
    };

    // Удаляем поля, которые нельзя об��овлять
    delete prepared.id;
    delete prepared.created_at;

    // Конвертируем объекты и массивы в JSON строки для PostgreSQL JSONB полей
    return this.serializeJsonFields(prepared);
  }

  /**
   * Сериализация JSON полей для PostgreSQL
   */
  serializeJsonFields(data) {
    const serialized = { ...data };

    // Список полей, которые должны быть сериализованы в JSON
    const jsonFields = [
      "tags",
      "metadata",
      "buttons",
      "zones",
      "clickable_areas",
      "highlight_areas",
      "validation_rules",
      "failure_actions",
      "media",
      "next_step_conditions",
      "dimensions",
      "breakpoints",
      "permissions",
      "preferences",
      "changes",
      "error_steps",
      "feedback",
      "user_input",
      "coordinates",
      "api_settings",
      "email_settings",
      "storage_settings",
      "supported_languages",
    ];

    for (const field of jsonFields) {
      if (serialized[field] !== undefined && serialized[field] !== null) {
        if (typeof serialized[field] === "object") {
          // Конвертируем объекты и массивы в JSON строки
          serialized[field] = JSON.stringify(serialized[field]);
        }
      }
    }

    return serialized;
  }

  /**
   * Построение SQL запроса для вставки
   */
  buildInsertQuery(data) {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = columns.map((_, index) => `$${index + 1}`);

    const sql = `
      INSERT INTO ${this.tableName} (${columns.join(", ")})
      VALUES (${placeholders.join(", ")})
      RETURNING *
    `;

    return { sql, values };
  }

  /**
   * Построение SQL запроса для обновления
   */
  buildUpdateQuery(id, data) {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const setClause = columns.map((col, index) => `${col} = $${index + 2}`);

    const sql = `
      UPDATE ${this.tableName}
      SET ${setClause.join(", ")}
      WHERE id = $1
      RETURNING *
    `;

    return { sql, values: [id, ...values] };
  }

  /**
   * Построение SQL запроса для выборки с фильтрами
   */
  buildSelectQuery(filters = {}, options = {}) {
    let sql = `SELECT * FROM ${this.tableName}`;
    const values = [];
    const conditions = [];
    let paramIndex = 1;

    // Базовые фильтры
    if (filters.id) {
      conditions.push(`id = $${paramIndex}`);
      values.push(filters.id);
      paramIndex++;
    }

    if (filters.is_active !== undefined) {
      conditions.push(`is_active = $${paramIndex}`);
      values.push(filters.is_active);
      paramIndex++;
    }

    if (filters.status) {
      if (Array.isArray(filters.status)) {
        // Поддержка массива статусов
        const placeholders = filters.status.map(() => `$${paramIndex++}`);
        conditions.push(`status IN (${placeholders.join(", ")})`);
        values.push(...filters.status);
      } else {
        // Одиночный статус
        conditions.push(`status = $${paramIndex}`);
        values.push(filters.status);
        paramIndex++;
      }
    }

    if (filters.name) {
      conditions.push(`name = $${paramIndex}`);
      values.push(filters.name);
      paramIndex++;
    }

    if (filters.created_after) {
      conditions.push(`created_at >= $${paramIndex}`);
      values.push(filters.created_after);
      paramIndex++;
    }

    if (filters.created_before) {
      conditions.push(`created_at <= $${paramIndex}`);
      values.push(filters.created_before);
      paramIndex++;
    }

    // Поиск по тексту (если поддерживается)
    if (filters.search && options.searchFields) {
      const searchConditions = options.searchFields.map(
        (field) => `${field} ILIKE $${paramIndex}`,
      );
      conditions.push(`(${searchConditions.join(" OR ")})`);
      values.push(`%${filters.search}%`);
      paramIndex++;
    }

    // Доба��ляем WHERE условия
    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(" AND ")}`;
    }

    // Сортировка
    const sortBy = options.sortBy || "created_at";
    const sortOrder = options.sortOrder || "DESC";
    sql += ` ORDER BY ${sortBy} ${sortOrder}`;

    // Пагинация
    if (options.limit) {
      sql += ` LIMIT $${paramIndex}`;
      values.push(options.limit);
      paramIndex++;

      if (options.offset) {
        sql += ` OFFSET $${paramIndex}`;
        values.push(options.offset);
        paramIndex++;
      }
    }

    return { sql, values };
  }

  /**
   * Создание записи
   */
  async create(data) {
    try {
      const prepared = this.prepareForInsert(data);
      const { sql, values } = this.buildInsertQuery(prepared);
      const result = await query(sql, values);
      return result.rows[0];
    } catch (error) {
      console.error(
        `Ошибка с��здания записи в ${this.tableName}:`,
        error.message,
      );
      throw error;
    }
  }

  /**
   * Получение записи по ID
   */
  async findById(id) {
    try {
      const sql = `SELECT * FROM ${this.tableName} WHERE id = $1`;
      const result = await query(sql, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error(
        `Ошибка получения записи из ${this.tableName}:`,
        error.message,
      );
      throw error;
    }
  }

  /**
   * Получение всех записей с фильтрами
   */
  async findAll(filters = {}, options = {}) {
    try {
      const { sql, values } = this.buildSelectQuery(filters, options);
      const result = await query(sql, values);
      return result.rows;
    } catch (error) {
      console.error(
        `Ошибка получения записей из ${this.tableName}:`,
        error.message,
      );
      throw error;
    }
  }

  /**
   * Получение одной записи с фильтрами
   */
  async findOne(filters = {}) {
    try {
      const { sql, values } = this.buildSelectQuery(filters, { limit: 1 });
      const result = await query(sql, values);
      return result.rows[0] || null;
    } catch (error) {
      console.error(
        `Ошибка получения записи из ${this.tableName}:`,
        error.message,
      );
      throw error;
    }
  }

  /**
   * Обновление записи по ID
   */
  async updateById(id, data) {
    try {
      const prepared = this.prepareForUpdate(data);
      const { sql, values } = this.buildUpdateQuery(id, prepared);
      const result = await query(sql, values);
      return result.rows[0] || null;
    } catch (error) {
      console.error(
        `Ошибка обновления записи в ${this.tableName}:`,
        error.message,
      );
      throw error;
    }
  }

  /**
   * Мягкое удаление (установка is_active = false)
   */
  async softDelete(id) {
    try {
      const sql = `
        UPDATE ${this.tableName}
        SET is_active = false, updated_at = $2
        WHERE id = $1
        RETURNING *
      `;
      const result = await query(sql, [id, this.createTimestamp()]);
      return result.rows[0] || null;
    } catch (error) {
      console.error(
        `Ошибка мягкого удаления запис�� из ${this.tableName}:`,
        error.message,
      );
      throw error;
    }
  }

  /**
   * Жесткое удаление
   */
  async delete(id) {
    try {
      const sql = `DELETE FROM ${this.tableName} WHERE id = $1 RETURNING *`;
      const result = await query(sql, [id]);
      return result.rows[0] || null;
    } catch (error) {
      console.error(
        `Ошибка удаления записи из ${this.tableName}:`,
        error.message,
      );
      throw error;
    }
  }

  /**
   * Подсчет записей с фильтрами
   */
  async count(filters = {}) {
    try {
      let sql = `SELECT COUNT(*) as total FROM ${this.tableName}`;
      const values = [];
      const conditions = [];
      let paramIndex = 1;

      if (filters.is_active !== undefined) {
        conditions.push(`is_active = $${paramIndex}`);
        values.push(filters.is_active);
        paramIndex++;
      }

      if (filters.status) {
        if (Array.isArray(filters.status)) {
          // Поддержка массива статусов
          const placeholders = filters.status.map(() => `$${paramIndex++}`);
          conditions.push(`status IN (${placeholders.join(", ")})`);
          values.push(...filters.status);
        } else {
          // Одиночный статус
          conditions.push(`status = $${paramIndex}`);
          values.push(filters.status);
          paramIndex++;
        }
      }

      if (conditions.length > 0) {
        sql += ` WHERE ${conditions.join(" AND ")}`;
      }

      const result = await query(sql, values);
      return parseInt(result.rows[0].total);
    } catch (error) {
      console.error(
        `Ошибка подсчета записей в ${this.tableName}:`,
        error.message,
      );
      throw error;
    }
  }

  /**
   * Массовое создание записей
   */
  async bulkCreate(dataArray) {
    try {
      return await transaction(async (client) => {
        const results = [];

        for (const data of dataArray) {
          const prepared = this.prepareForInsert(data);
          const { sql, values } = this.buildInsertQuery(prepared);
          const result = await client.query(sql, values);
          results.push(result.rows[0]);
        }

        return results;
      });
    } catch (error) {
      console.error(
        `Ошибка массового создания записей в ${this.tableName}:`,
        error.message,
      );
      throw error;
    }
  }

  /**
   * Ма��совое обновление записей
   */
  async bulkUpdate(updates) {
    try {
      return await transaction(async (client) => {
        const results = [];

        for (const { id, data } of updates) {
          const prepared = this.prepareForUpdate(data);
          const { sql, values } = this.buildUpdateQuery(id, prepared);
          const result = await client.query(sql, values);
          if (result.rows[0]) {
            results.push(result.rows[0]);
          }
        }

        return results;
      });
    } catch (error) {
      console.error(
        `Ошибка массового обновления записей в ${this.tableName}:`,
        error.message,
      );
      throw error;
    }
  }

  /**
   * Проверка существования записи
   */
  async exists(id) {
    try {
      const sql = `SELECT EXISTS(SELECT 1 FROM ${this.tableName} WHERE id = $1)`;
      const result = await query(sql, [id]);
      return result.rows[0].exists;
    } catch (error) {
      console.error(
        `Ошибка проверки существования записи в ${this.tableName}:`,
        error.message,
      );
      throw error;
    }
  }

  /**
   * Получение активных записей
   */
  async getActive(options = {}) {
    return this.findAll({ is_active: true }, options);
  }

  /**
   * Получение архивных записей
   */
  async getArchived(options = {}) {
    return this.findAll({ is_active: false }, options);
  }

  /**
   * Восстановление мягко удаленной записи
   */
  async restore(id) {
    try {
      const sql = `
        UPDATE ${this.tableName}
        SET is_active = true, updated_at = $2
        WHERE id = $1
        RETURNING *
      `;
      const result = await query(sql, [id, this.createTimestamp()]);
      return result.rows[0] || null;
    } catch (error) {
      console.error(
        `Ошибка восстановления записи в ${this.tableName}:`,
        error.message,
      );
      throw error;
    }
  }
}

export default BaseModel;
