import BaseModel from "./BaseModel.js";

/**
 * Упрощенная модель для работы с отметками на TV интерфейсах
 * Совместима с существующей структурой таблицы
 */
class TVInterfaceMarkSimplified extends BaseModel {
  constructor() {
    super("tv_interface_marks");
  }

  /**
   * Получить все отметки для TV интерфейса с безопасным за��росом
   */
  async getByTVInterfaceId(tvInterfaceId, options = {}) {
    try {
      // Сначала проверяем, какие колонки реально существуют
      const columnsQuery = `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'tv_interface_marks'
      `;
      const columnsResult = await this.query(columnsQuery);
      const existingColumns = columnsResult.rows.map((row) => row.column_name);

      console.log(
        "📋 Existing columns in tv_interface_marks:",
        existingColumns,
      );

      // Строим запрос только с существующими колонками
      const baseColumns = [
        "id",
        "tv_interface_id",
        "name",
        "description",
        "position",
        "color",
        "is_active",
        "created_at",
        "updated_at",
      ];
      const safeColumns = baseColumns.filter((col) =>
        existingColumns.includes(col),
      );

      let query = `
        SELECT 
          ${safeColumns.map((col) => `tim.${col}`).join(", ")}
        FROM ${this.tableName} tim
        WHERE tim.tv_interface_id = $1
      `;

      const params = [tvInterfaceId];

      // Добавляем фильтры только если колонки существуют
      if (
        options.is_active !== undefined &&
        existingColumns.includes("is_active")
      ) {
        query += ` AND tim.is_active = $${params.length + 1}`;
        params.push(options.is_active);
      }

      query += ` ORDER BY tim.created_at ASC`;

      const result = await this.query(query, params);
      return result.rows.map((row) =>
        this.normalizeMarkData(row, existingColumns),
      );
    } catch (error) {
      console.error("Error getting TV interface marks:", error);
      throw error;
    }
  }

  /**
   * Получить отметки для шага (если колонка step_id существует)
   */
  async getByStepId(stepId) {
    try {
      // Проверяем существование колонки step_id
      const columnsQuery = `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'tv_interface_marks' AND column_name = 'step_id'
      `;
      const columnsResult = await this.query(columnsQuery);

      if (columnsResult.rows.length === 0) {
        // Колонка step_id не существует, возвращаем пустой массив
        console.log("⚠️ Column step_id does not exist, returning empty array");
        return [];
      }

      const query = `
        SELECT tim.*
        FROM ${this.tableName} tim
        WHERE tim.step_id = $1 AND tim.is_active = true
        ORDER BY tim.created_at ASC
      `;

      const result = await this.query(query, [stepId]);
      return result.rows.map((row) => this.normalizeMarkData(row));
    } catch (error) {
      console.error("Error getting marks by step ID:", error);
      // Возвращаем пустой массив вместо ошибки
      return [];
    }
  }

  /**
   * Создать новую отметку с базовыми полями
   */
  async create(data) {
    try {
      // Валидация обязательных полей
      if (!data.tv_interface_id) {
        throw new Error("TV interface ID обязателен");
      }

      if (!data.name || !data.name.trim()) {
        throw new Error("Название отметки обязательно");
      }

      if (!data.position || typeof data.position !== "object") {
        throw new Error("Позиция отметки обязательна");
      }

      // Проверяем существование TV интерфейса
      const tvInterfaceExists = await this.query(
        "SELECT id FROM tv_interfaces WHERE id = $1",
        [data.tv_interface_id],
      );
      if (tvInterfaceExists.rows.length === 0) {
        throw new Error("TV интерфейс не найден");
      }

      // Получаем список существующих колонок
      const columnsQuery = `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'tv_interface_marks'
      `;
      const columnsResult = await this.query(columnsQuery);
      const existingColumns = columnsResult.rows.map((row) => row.column_name);

      // Генерируем ID в том же формате, что и TV interfaces
      const timestamp = Date.now().toString(36);
      const randomPart = Math.random().toString(36).substr(2, 9);
      const markId = `tim_${timestamp}_${randomPart}`;

      const now = new Date().toISOString();
      const markData = {
        id: markId, // Используем кастомный ID вместо UUID
        tv_interface_id: data.tv_interface_id,
        name: data.name.trim(),
        description: data.description?.trim() || "",
        position: JSON.stringify(data.position),
        color: data.color || "#3b82f6",
        created_at: now,
        updated_at: now,
      };

      // Добавляем дополнительные поля только если они существуют в таблице
      if (existingColumns.includes("step_id")) {
        markData.step_id = data.step_id || null;
      }

      if (existingColumns.includes("mark_type")) {
        markData.mark_type = data.mark_type || "point";
      }

      if (existingColumns.includes("shape")) {
        markData.shape = data.shape || "circle";
      }

      if (existingColumns.includes("size")) {
        markData.size = data.size
          ? JSON.stringify(data.size)
          : JSON.stringify({ width: 20, height: 20 });
      }

      if (existingColumns.includes("is_active")) {
        markData.is_active = data.is_active !== false;
      }

      if (existingColumns.includes("is_visible")) {
        markData.is_visible = data.is_visible !== false;
      }

      if (existingColumns.includes("display_order")) {
        markData.display_order = data.display_order || 0;
      }

      if (existingColumns.includes("metadata")) {
        markData.metadata = JSON.stringify(data.metadata || {});
      }

      if (existingColumns.includes("tags")) {
        markData.tags = JSON.stringify(data.tags || []);
      }

      // Строим прямой INSERT запрос с нашими данными
      const columns = Object.keys(markData);
      const values = Object.values(markData);
      const placeholders = columns.map((_, index) => `$${index + 1}`);

      const insertQuery = `
        INSERT INTO ${this.tableName} (${columns.join(", ")})
        VALUES (${placeholders.join(", ")})
        RETURNING *
      `;

      console.log("🔧 Creating mark with custom ID:", markId);
      const result = await this.query(insertQuery, values);
      return await this.getById(result.rows[0].id);
    } catch (error) {
      console.error("Error creating TV interface mark:", error);
      throw error;
    }
  }

  /**
   * Обновить отметку
   */
  async update(id, data) {
    try {
      const existing = await this.getById(id);
      if (!existing) {
        throw new Error("Отметка не найдена");
      }

      // Получаем список существующих колонок
      const columnsQuery = `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'tv_interface_marks'
      `;
      const columnsResult = await this.query(columnsQuery);
      const existingColumns = columnsResult.rows.map((row) => row.column_name);

      const updateData = {
        updated_at: new Date().toISOString(),
      };

      // Обновляем только переданные поля если они существуют в таблице
      if (data.name !== undefined) updateData.name = data.name.trim();
      if (data.description !== undefined)
        updateData.description = data.description?.trim() || "";
      if (data.position !== undefined)
        updateData.position = JSON.stringify(data.position);
      if (data.color !== undefined) updateData.color = data.color;

      if (
        data.mark_type !== undefined &&
        existingColumns.includes("mark_type")
      ) {
        updateData.mark_type = data.mark_type;
      }

      if (data.shape !== undefined && existingColumns.includes("shape")) {
        updateData.shape = data.shape;
      }

      if (data.size !== undefined && existingColumns.includes("size")) {
        updateData.size = JSON.stringify(data.size);
      }

      if (
        data.is_active !== undefined &&
        existingColumns.includes("is_active")
      ) {
        updateData.is_active = data.is_active;
      }

      if (
        data.is_visible !== undefined &&
        existingColumns.includes("is_visible")
      ) {
        updateData.is_visible = data.is_visible;
      }

      if (
        data.display_order !== undefined &&
        existingColumns.includes("display_order")
      ) {
        updateData.display_order = data.display_order;
      }

      if (data.metadata !== undefined && existingColumns.includes("metadata")) {
        updateData.metadata = JSON.stringify(data.metadata);
      }

      if (data.tags !== undefined && existingColumns.includes("tags")) {
        updateData.tags = JSON.stringify(data.tags);
      }

      await super.updateById(id, updateData);
      return await this.getById(id);
    } catch (error) {
      console.error("Error updating TV interface mark:", error);
      throw error;
    }
  }

  /**
   * Получить отметку по ID с безопасным запросом
   */
  async getById(id) {
    try {
      // Получаем список существующих колонок
      const columnsQuery = `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'tv_interface_marks'
      `;
      const columnsResult = await this.query(columnsQuery);
      const existingColumns = columnsResult.rows.map((row) => row.column_name);

      const query = `SELECT * FROM ${this.tableName} WHERE id = $1`;
      const result = await this.query(query, [id]);

      if (result.rows.length === 0) {
        return null;
      }

      return this.normalizeMarkData(result.rows[0], existingColumns);
    } catch (error) {
      console.error("Error getting TV interface mark by ID:", error);
      throw error;
    }
  }

  /**
   * Удалить отметки для TV интерфейса
   */
  async deleteByTVInterfaceId(tvInterfaceId) {
    try {
      const query = `DELETE FROM ${this.tableName} WHERE tv_interface_id = $1`;
      const result = await this.query(query, [tvInterfaceId]);
      return result.rowCount;
    } catch (error) {
      console.error("Error deleting marks by TV interface ID:", error);
      throw error;
    }
  }

  /**
   * Удалить отметки для шага
   */
  async deleteByStepId(stepId) {
    try {
      // Проверяем существование колонки step_id
      const columnsQuery = `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'tv_interface_marks' AND column_name = 'step_id'
      `;
      const columnsResult = await this.query(columnsQuery);

      if (columnsResult.rows.length === 0) {
        console.log(
          "⚠️ Column step_id does not exist, cannot delete by step ID",
        );
        return 0;
      }

      const query = `DELETE FROM ${this.tableName} WHERE step_id = $1`;
      const result = await this.query(query, [stepId]);
      return result.rowCount;
    } catch (error) {
      console.error("Error deleting marks by step ID:", error);
      return 0;
    }
  }

  /**
   * Обновить порядок отображения отметок (если колонка display_order существует)
   */
  async reorder(tvInterfaceId, markIds) {
    try {
      // Проверяем существование колонки display_order
      const columnsQuery = `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'tv_interface_marks' AND column_name = 'display_order'
      `;
      const columnsResult = await this.query(columnsQuery);

      if (columnsResult.rows.length === 0) {
        console.log("⚠️ Column display_order does not exist, cannot reorder");
        return true;
      }

      // Используем простой подход без транзакций
      for (let i = 0; i < markIds.length; i++) {
        await this.query(
          `UPDATE ${this.tableName} SET display_order = $1, updated_at = NOW() WHERE id = $2 AND tv_interface_id = $3`,
          [i, markIds[i], tvInterfaceId],
        );
      }

      return true;
    } catch (error) {
      console.error("Error reordering TV interface marks:", error);
      throw error;
    }
  }

  /**
   * Нормализация данных отметки (безопасная версия)
   */
  normalizeMarkData(mark, existingColumns = null) {
    if (!mark) return null;

    const normalized = { ...mark };

    // Безопасный парсинг JSON полей
    try {
      if (mark.position && typeof mark.position === "string") {
        normalized.position = JSON.parse(mark.position);
      }
    } catch (e) {
      normalized.position = { x: 0, y: 0 };
    }

    try {
      if (mark.size && typeof mark.size === "string") {
        normalized.size = JSON.parse(mark.size);
      }
    } catch (e) {
      normalized.size = { width: 20, height: 20 };
    }

    try {
      if (mark.coordinates && typeof mark.coordinates === "string") {
        normalized.coordinates = JSON.parse(mark.coordinates);
      }
    } catch (e) {
      normalized.coordinates = null;
    }

    try {
      if (mark.metadata && typeof mark.metadata === "string") {
        normalized.metadata = JSON.parse(mark.metadata);
      }
    } catch (e) {
      normalized.metadata = {};
    }

    try {
      if (mark.tags && typeof mark.tags === "string") {
        normalized.tags = JSON.parse(mark.tags);
      }
    } catch (e) {
      normalized.tags = [];
    }

    return normalized;
  }

  /**
   * Получить статистику отметок (безопасная версия)
   */
  async getStats() {
    try {
      // Проверяем существующие колонки
      const columnsQuery = `
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'tv_interface_marks'
      `;
      const columnsResult = await this.query(columnsQuery);
      const existingColumns = columnsResult.rows.map((row) => row.column_name);

      // Создаем базовый запрос статистики
      let query = `SELECT COUNT(*) as total FROM ${this.tableName}`;

      // Добавляем дополнительную статистику только для существующих колонок
      const statFields = ["COUNT(*) as total"];

      if (existingColumns.includes("is_active")) {
        statFields.push(
          "COUNT(CASE WHEN is_active = true THEN 1 END) as active",
        );
      }

      if (existingColumns.includes("is_visible")) {
        statFields.push(
          "COUNT(CASE WHEN is_visible = true THEN 1 END) as visible",
        );
      }

      if (existingColumns.includes("mark_type")) {
        statFields.push(
          "COUNT(CASE WHEN mark_type = 'point' THEN 1 END) as points",
        );
        statFields.push(
          "COUNT(CASE WHEN mark_type = 'zone' THEN 1 END) as zones",
        );
        statFields.push(
          "COUNT(CASE WHEN mark_type = 'area' THEN 1 END) as areas",
        );
      }

      statFields.push(
        "COUNT(DISTINCT tv_interface_id) as interfaces_with_marks",
      );

      if (existingColumns.includes("step_id")) {
        statFields.push("COUNT(DISTINCT step_id) as steps_with_marks");
      }

      query = `SELECT ${statFields.join(", ")} FROM ${this.tableName}`;

      const result = await this.query(query);
      return result.rows[0];
    } catch (error) {
      console.error("Error getting TV interface marks stats:", error);
      // Возвращаем базовую статистику при ошибке
      return {
        total: 0,
        active: 0,
        visible: 0,
        interfaces_with_marks: 0,
      };
    }
  }
}

export default TVInterfaceMarkSimplified;
