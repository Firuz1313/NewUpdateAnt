import BaseModel from "./BaseModel.js";

/**
 * Модель для работы с отметками на TV интерфейсах
 */
class TVInterfaceMark extends BaseModel {
  constructor() {
    super("tv_interface_marks");
  }

  // Определение схемы для валидации
  getSchema() {
    return {
      tv_interface_id: { type: "string", required: true },
      step_id: { type: "string", required: false },
      name: { type: "string", required: true, minLength: 1, maxLength: 255 },
      description: { type: "string", required: false, maxLength: 1000 },
      mark_type: {
        type: "string",
        required: true,
        enum: ["point", "zone", "area"],
      },
      shape: {
        type: "string",
        required: true,
        enum: ["circle", "rectangle", "polygon", "ellipse"],
      },
      position: { type: "object", required: true },
      size: { type: "object", required: false },
      coordinates: { type: "object", required: false },
      color: { type: "string", required: false, default: "#3b82f6" },
      background_color: { type: "string", required: false },
      border_color: { type: "string", required: false },
      border_width: { type: "number", required: false, default: 2 },
      opacity: { type: "number", required: false, default: 0.8 },
      is_clickable: { type: "boolean", required: false, default: true },
      is_highlightable: { type: "boolean", required: false, default: true },
      click_action: { type: "string", required: false },
      hover_action: { type: "string", required: false },
      action_value: { type: "string", required: false },
      action_description: { type: "string", required: false },
      expected_result: { type: "string", required: false },
      hint_text: { type: "string", required: false },
      tooltip_text: { type: "string", required: false },
      warning_text: { type: "string", required: false },
      animation: {
        type: "string",
        required: false,
        enum: ["pulse", "glow", "bounce", "shake", "fade", "blink", "none"],
      },
      animation_duration: { type: "number", required: false, default: 1000 },
      animation_delay: { type: "number", required: false, default: 0 },
      display_order: { type: "number", required: false, default: 0 },
      priority: {
        type: "string",
        required: false,
        enum: ["low", "normal", "high", "critical"],
        default: "normal",
      },
      is_active: { type: "boolean", required: false, default: true },
      is_visible: { type: "boolean", required: false, default: true },
      metadata: { type: "object", required: false, default: {} },
      tags: { type: "array", required: false, default: [] },
    };
  }

  /**
   * Получить все отметки для TV интерфейса
   */
  async getByTVInterfaceId(tvInterfaceId, options = {}) {
    try {
      let query = `
        SELECT 
          tim.*,
          tv.name as tv_interface_name,
          tv.type as tv_interface_type,
          ds.title as step_title,
          ds.step_number
        FROM ${this.tableName} tim
        LEFT JOIN tv_interfaces tv ON tim.tv_interface_id = tv.id
        LEFT JOIN diagnostic_steps ds ON tim.step_id = ds.id
        WHERE tim.tv_interface_id = $1
      `;

      const params = [tvInterfaceId];

      // Фильтр по активности
      if (options.is_active !== undefined) {
        query += ` AND tim.is_active = $${params.length + 1}`;
        params.push(options.is_active);
      }

      // Фильтр по видимости
      if (options.is_visible !== undefined) {
        query += ` AND tim.is_visible = $${params.length + 1}`;
        params.push(options.is_visible);
      }

      // Фильтр по типу отметки
      if (options.mark_type) {
        query += ` AND tim.mark_type = $${params.length + 1}`;
        params.push(options.mark_type);
      }

      // Фильтр по шагу
      if (options.step_id) {
        query += ` AND tim.step_id = $${params.length + 1}`;
        params.push(options.step_id);
      }

      query += ` ORDER BY tim.display_order ASC, tim.created_at ASC`;

      const result = await this.query(query, params);
      return result.rows.map(this.normalizeMarkData);
    } catch (error) {
      console.error("Error getting TV interface marks:", error);
      throw error;
    }
  }

  /**
   * Получить отметки для шага
   */
  async getByStepId(stepId) {
    try {
      const query = `
        SELECT 
          tim.*,
          tv.name as tv_interface_name,
          tv.type as tv_interface_type
        FROM ${this.tableName} tim
        LEFT JOIN tv_interfaces tv ON tim.tv_interface_id = tv.id
        WHERE tim.step_id = $1 AND tim.is_active = true
        ORDER BY tim.display_order ASC, tim.created_at ASC
      `;

      const result = await this.query(query, [stepId]);
      return result.rows.map(this.normalizeMarkData);
    } catch (error) {
      console.error("Error getting marks by step ID:", error);
      throw error;
    }
  }

  /**
   * Создать новую отметку
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
        [data.tv_interface_id]
      );
      if (tvInterfaceExists.rows.length === 0) {
        throw new Error("TV интерфейс не найден");
      }

      // Проверяем существование шага (если указан)
      if (data.step_id) {
        const stepExists = await this.query(
          "SELECT id FROM diagnostic_steps WHERE id = $1",
          [data.step_id]
        );
        if (stepExists.rows.length === 0) {
          throw new Error("Шаг не найден");
        }
      }

      const now = new Date().toISOString();
      const markData = {
        tv_interface_id: data.tv_interface_id,
        step_id: data.step_id || null,
        name: data.name.trim(),
        description: data.description?.trim() || "",
        mark_type: data.mark_type || "point",
        shape: data.shape || "circle",
        position: JSON.stringify(data.position),
        size: data.size ? JSON.stringify(data.size) : JSON.stringify({ width: 20, height: 20 }),
        coordinates: data.coordinates ? JSON.stringify(data.coordinates) : null,
        color: data.color || "#3b82f6",
        background_color: data.background_color,
        border_color: data.border_color || "#3b82f6",
        border_width: data.border_width || 2,
        opacity: data.opacity || 0.8,
        is_clickable: data.is_clickable !== false,
        is_highlightable: data.is_highlightable !== false,
        click_action: data.click_action,
        hover_action: data.hover_action,
        action_value: data.action_value,
        action_description: data.action_description,
        expected_result: data.expected_result,
        hint_text: data.hint_text,
        tooltip_text: data.tooltip_text,
        warning_text: data.warning_text,
        animation: data.animation || "none",
        animation_duration: data.animation_duration || 1000,
        animation_delay: data.animation_delay || 0,
        display_order: data.display_order || 0,
        priority: data.priority || "normal",
        is_active: data.is_active !== false,
        is_visible: data.is_visible !== false,
        metadata: JSON.stringify(data.metadata || {}),
        tags: JSON.stringify(data.tags || []),
        created_at: now,
        updated_at: now,
      };

      const result = await super.create(markData);
      return await this.getById(result.id);
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

      const updateData = {
        updated_at: new Date().toISOString(),
      };

      // Обновляем только переданные поля
      if (data.name !== undefined) updateData.name = data.name.trim();
      if (data.description !== undefined) updateData.description = data.description?.trim() || "";
      if (data.mark_type !== undefined) updateData.mark_type = data.mark_type;
      if (data.shape !== undefined) updateData.shape = data.shape;
      if (data.position !== undefined) updateData.position = JSON.stringify(data.position);
      if (data.size !== undefined) updateData.size = JSON.stringify(data.size);
      if (data.coordinates !== undefined) updateData.coordinates = JSON.stringify(data.coordinates);
      if (data.color !== undefined) updateData.color = data.color;
      if (data.background_color !== undefined) updateData.background_color = data.background_color;
      if (data.border_color !== undefined) updateData.border_color = data.border_color;
      if (data.border_width !== undefined) updateData.border_width = data.border_width;
      if (data.opacity !== undefined) updateData.opacity = data.opacity;
      if (data.is_clickable !== undefined) updateData.is_clickable = data.is_clickable;
      if (data.is_highlightable !== undefined) updateData.is_highlightable = data.is_highlightable;
      if (data.click_action !== undefined) updateData.click_action = data.click_action;
      if (data.hover_action !== undefined) updateData.hover_action = data.hover_action;
      if (data.action_value !== undefined) updateData.action_value = data.action_value;
      if (data.action_description !== undefined) updateData.action_description = data.action_description;
      if (data.expected_result !== undefined) updateData.expected_result = data.expected_result;
      if (data.hint_text !== undefined) updateData.hint_text = data.hint_text;
      if (data.tooltip_text !== undefined) updateData.tooltip_text = data.tooltip_text;
      if (data.warning_text !== undefined) updateData.warning_text = data.warning_text;
      if (data.animation !== undefined) updateData.animation = data.animation;
      if (data.animation_duration !== undefined) updateData.animation_duration = data.animation_duration;
      if (data.animation_delay !== undefined) updateData.animation_delay = data.animation_delay;
      if (data.display_order !== undefined) updateData.display_order = data.display_order;
      if (data.priority !== undefined) updateData.priority = data.priority;
      if (data.is_active !== undefined) updateData.is_active = data.is_active;
      if (data.is_visible !== undefined) updateData.is_visible = data.is_visible;
      if (data.metadata !== undefined) updateData.metadata = JSON.stringify(data.metadata);
      if (data.tags !== undefined) updateData.tags = JSON.stringify(data.tags);

      await super.updateById(id, updateData);
      return await this.getById(id);
    } catch (error) {
      console.error("Error updating TV interface mark:", error);
      throw error;
    }
  }

  /**
   * Получить отметку по ID с полной информацией
   */
  async getById(id) {
    try {
      const query = `
        SELECT 
          tim.*,
          tv.name as tv_interface_name,
          tv.type as tv_interface_type,
          ds.title as step_title,
          ds.step_number
        FROM ${this.tableName} tim
        LEFT JOIN tv_interfaces tv ON tim.tv_interface_id = tv.id
        LEFT JOIN diagnostic_steps ds ON tim.step_id = ds.id
        WHERE tim.id = $1
      `;

      const result = await this.query(query, [id]);

      if (result.rows.length === 0) {
        return null;
      }

      return this.normalizeMarkData(result.rows[0]);
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
      const query = `DELETE FROM ${this.tableName} WHERE step_id = $1`;
      const result = await this.query(query, [stepId]);
      return result.rowCount;
    } catch (error) {
      console.error("Error deleting marks by step ID:", error);
      throw error;
    }
  }

  /**
   * Обновить порядок отображения отметок
   */
  async reorder(tvInterfaceId, markIds) {
    try {
      const client = await this.getClient();
      await client.query("BEGIN");

      try {
        for (let i = 0; i < markIds.length; i++) {
          await client.query(
            `UPDATE ${this.tableName} SET display_order = $1, updated_at = NOW() WHERE id = $2 AND tv_interface_id = $3`,
            [i, markIds[i], tvInterfaceId]
          );
        }

        await client.query("COMMIT");
        return true;
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      console.error("Error reordering TV interface marks:", error);
      throw error;
    }
  }

  /**
   * Нормализация данных отметки (парсинг JSON полей)
   */
  normalizeMarkData(mark) {
    if (!mark) return null;

    // Парсим JSON поля
    const normalized = { ...mark };

    try {
      normalized.position = JSON.parse(mark.position || "{}");
    } catch (e) {
      normalized.position = {};
    }

    try {
      normalized.size = JSON.parse(mark.size || '{"width": 20, "height": 20}');
    } catch (e) {
      normalized.size = { width: 20, height: 20 };
    }

    try {
      normalized.coordinates = mark.coordinates ? JSON.parse(mark.coordinates) : null;
    } catch (e) {
      normalized.coordinates = null;
    }

    try {
      normalized.metadata = JSON.parse(mark.metadata || "{}");
    } catch (e) {
      normalized.metadata = {};
    }

    try {
      normalized.tags = JSON.parse(mark.tags || "[]");
    } catch (e) {
      normalized.tags = [];
    }

    return normalized;
  }

  /**
   * Получить статистику отметок
   */
  async getStats() {
    try {
      const query = `
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN is_active = true THEN 1 END) as active,
          COUNT(CASE WHEN is_visible = true THEN 1 END) as visible,
          COUNT(CASE WHEN mark_type = 'point' THEN 1 END) as points,
          COUNT(CASE WHEN mark_type = 'zone' THEN 1 END) as zones,
          COUNT(CASE WHEN mark_type = 'area' THEN 1 END) as areas,
          COUNT(DISTINCT tv_interface_id) as interfaces_with_marks,
          COUNT(DISTINCT step_id) as steps_with_marks
        FROM ${this.tableName}
      `;

      const result = await this.query(query);
      return result.rows[0];
    } catch (error) {
      console.error("Error getting TV interface marks stats:", error);
      throw error;
    }
  }
}

export default TVInterfaceMark;
