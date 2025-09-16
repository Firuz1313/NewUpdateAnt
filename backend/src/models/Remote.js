import BaseModel from "./BaseModel.js";

/**
 * Remote Model - Модель пультов дистанционного управления
 *
 * Управляет интерактивными моделями пультов ДУ для различных устройств.
 * Поддерживает SVG-графику, кликабельные зоны и кнопки.
 */
class Remote extends BaseModel {
  constructor() {
    super("remotes");
  }

  /**
   * Переопределяем create для автоматической установки default
   */
  async create(data) {
    try {
      // Если пульт привязан к устройству, проверяем есть ли уже пульты для этого устройства
      if (data.device_id && data.device_id !== "universal") {
        const existingRemotes = await this.query(
          `SELECT COUNT(*) as count FROM ${this.tableName}
           WHERE device_id = $1 AND is_active = true`,
          [data.device_id],
        );

        const count = parseInt(existingRemotes.rows[0]?.count || 0);

        // Если это первый пульт для устройства, автоматически делаем его default
        if (count === 0) {
          data.is_default = true;
        }
      }

      return await super.create(data);
    } catch (error) {
      throw this.handleError(error, "create");
    }
  }

  /**
   * Валидация данных пульта
   */
  validateData(data, isUpdate = false) {
    const errors = [];

    // Обязательные поля при создании
    if (!isUpdate) {
      if (!data.name) errors.push("Название пульта обязательно");
      if (!data.manufacturer) errors.push("Производитель обязателен");
      if (!data.model) errors.push("Модель обязательна");
    }

    // Валидация layout
    const validLayouts = ["standard", "compact", "smart", "custom"];
    if (data.layout && !validLayouts.includes(data.layout)) {
      errors.push(`Layout должен быть одним из: ${validLayouts.join(", ")}`);
    }

    // Валидация dimensions (должен быть объект с width/height)
    if (data.dimensions) {
      if (typeof data.dimensions !== "object") {
        errors.push("Dimensions должен быть объектом");
      } else {
        if (!data.dimensions.width || !data.dimensions.height) {
          errors.push("Dimensions должен содержать width и height");
        }
      }
    }

    // Валидация buttons (должен быть массив)
    if (data.buttons && !Array.isArray(data.buttons)) {
      errors.push("Buttons должен быть массивом");
    }

    // Валидация zones (должен быть массив)
    if (data.zones && !Array.isArray(data.zones)) {
      errors.push("Zones должен быть массивом");
    }

    return errors;
  }

  /**
   * Получить пульты для конкретного устройства
   */
  async getByDevice(deviceId) {
    try {
      const result = await this.query(
        `SELECT * FROM ${this.tableName} 
         WHERE device_id = $1 AND is_active = true 
         ORDER BY is_default DESC, usage_count DESC, name`,
        [deviceId],
      );

      return this.formatResponse(result.rows);
    } catch (error) {
      throw this.handleError(error, "getByDevice");
    }
  }

  /**
   * Получить пульт по умолчанию для устройства
   */
  async getDefaultForDevice(deviceId) {
    try {
      // Сначала пытаемся найти пульт, явно помеченный как default
      let result = await this.query(
        `SELECT * FROM ${this.tableName}
         WHERE device_id = $1 AND is_default = true AND is_active = true
         LIMIT 1`,
        [deviceId],
      );

      if (result.rows[0]) {
        return this.formatResponse(result.rows[0]);
      }

      // Если нет явно назначенного default, возвращаем наиболее используемый пульт
      result = await this.query(
        `SELECT * FROM ${this.tableName}
         WHERE device_id = $1 AND is_active = true
         ORDER BY usage_count DESC, created_at ASC
         LIMIT 1`,
        [deviceId],
      );

      if (result.rows[0]) {
        // Автоматически устанавливаем найденный пульт как default
        const remote = result.rows[0];
        await this.query(
          `UPDATE ${this.tableName}
           SET is_default = true, updated_at = NOW()
           WHERE id = $1`,
          [remote.id],
        );

        return this.formatResponse({ ...remote, is_default: true });
      }

      return null;
    } catch (error) {
      throw this.handleError(error, "getDefaultForDevice");
    }
  }

  /**
   * Установить пульт как default для устройства
   */
  async setAsDefault(remoteId, deviceId) {
    try {
      await this.transaction(async (client) => {
        // Снимаем default со всех пультов устройства
        await client.query(
          `UPDATE ${this.tableName} 
           SET is_default = false, updated_at = NOW() 
           WHERE device_id = $1`,
          [deviceId],
        );

        // Устанавливаем default для выбранного пульта
        await client.query(
          `UPDATE ${this.tableName} 
           SET is_default = true, updated_at = NOW() 
           WHERE id = $1 AND device_id = $2`,
          [remoteId, deviceId],
        );
      });

      return { success: true, message: "Пульт установлен как default" };
    } catch (error) {
      throw this.handleError(error, "setAsDefault");
    }
  }

  /**
   * Инкремент счетчика использования
   */
  async incrementUsage(remoteId) {
    try {
      const result = await this.query(
        `UPDATE ${this.tableName} 
         SET usage_count = usage_count + 1, 
             last_used = NOW(), 
             updated_at = NOW() 
         WHERE id = $1 AND is_active = true 
         RETURNING usage_count`,
        [remoteId],
      );

      return result.rows[0] || null;
    } catch (error) {
      throw this.handleError(error, "incrementUsage");
    }
  }

  /**
   * Дублировать пульт
   */
  async duplicate(remoteId, newData = {}) {
    try {
      const original = await this.findById(remoteId);
      if (!original) {
        throw new Error("Пульт для ду��лирования не найден");
      }

      const duplicateData = {
        ...original,
        id: undefined, // будет сгенерирован новый
        name: newData.name || `${original.name} (копия)`,
        is_default: false, // копия не может быть default
        usage_count: 0,
        last_used: null,
        created_at: undefined,
        updated_at: undefined,
        ...newData,
      };

      return await this.create(duplicateData);
    } catch (error) {
      throw this.handleError(error, "duplicate");
    }
  }

  /**
   * Получить статистику исполь��ования пультов
   */
  async getUsageStats(deviceId = null) {
    try {
      let query = `
        SELECT 
          COUNT(*) as total_remotes,
          COUNT(CASE WHEN is_default = true THEN 1 END) as default_remotes,
          AVG(usage_count) as avg_usage,
          MAX(usage_count) as max_usage,
          COUNT(CASE WHEN last_used > NOW() - INTERVAL '30 days' THEN 1 END) as recently_used
        FROM ${this.tableName} 
        WHERE is_active = true
      `;

      const params = [];
      if (deviceId) {
        query += " AND device_id = $1";
        params.push(deviceId);
      }

      const result = await this.query(query, params);
      return result.rows[0];
    } catch (error) {
      throw this.handleError(error, "getUsageStats");
    }
  }

  /**
   * Поиск пультов
   */
  async search(searchTerm, filters = {}) {
    try {
      let query = `
        SELECT r.*, d.name as device_name 
        FROM ${this.tableName} r
        LEFT JOIN devices d ON r.device_id = d.id
        WHERE r.is_active = true
      `;
      const params = [];
      let paramCounter = 1;

      if (searchTerm) {
        query += ` AND (r.name ILIKE $${paramCounter} OR r.manufacturer ILIKE $${paramCounter} OR r.model ILIKE $${paramCounter})`;
        params.push(`%${searchTerm}%`);
        paramCounter++;
      }

      if (filters.deviceId) {
        query += ` AND r.device_id = $${paramCounter}`;
        params.push(filters.deviceId);
        paramCounter++;
      }

      if (filters.layout) {
        query += ` AND r.layout = $${paramCounter}`;
        params.push(filters.layout);
        paramCounter++;
      }

      if (filters.manufacturer) {
        query += ` AND r.manufacturer = $${paramCounter}`;
        params.push(filters.manufacturer);
        paramCounter++;
      }

      query += " ORDER BY r.usage_count DESC, r.name";

      if (filters.limit) {
        query += ` LIMIT $${paramCounter}`;
        params.push(filters.limit);
      }

      const result = await this.query(query, params);
      return this.formatResponse(result.rows);
    } catch (error) {
      throw this.handleError(error, "search");
    }
  }

  /**
   * Форматирование ответа с преобразованием типов
   */
  formatResponse(data) {
    if (Array.isArray(data)) {
      return data.map((item) => this.formatResponse(item));
    }

    if (!data) return data;

    return {
      ...data,
      // Парсим JSON поля
      dimensions:
        typeof data.dimensions === "string"
          ? JSON.parse(data.dimensions)
          : data.dimensions,
      buttons:
        typeof data.buttons === "string"
          ? JSON.parse(data.buttons)
          : data.buttons,
      zones:
        typeof data.zones === "string" ? JSON.parse(data.zones) : data.zones,
      metadata:
        typeof data.metadata === "string"
          ? JSON.parse(data.metadata)
          : data.metadata,
      // Преобразуем числовые поля
      usage_count: parseInt(data.usage_count) || 0,
    };
  }
}

export default Remote;
