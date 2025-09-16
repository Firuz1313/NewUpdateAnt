import BaseModel from "./BaseModel.js";

class TVInterface extends BaseModel {
  constructor() {
    super("tv_interfaces");
  }

  // Определение схемы дл�� валидации
  getSchema() {
    return {
      name: { type: "string", required: true, minLength: 1, maxLength: 255 },
      description: { type: "string", required: false, maxLength: 1000 },
      type: {
        type: "string",
        required: true,
        enum: [
          "home",
          "settings",
          "channels",
          "apps",
          "guide",
          "no-signal",
          "error",
          "custom",
        ],
      },
      device_id: { type: "string", required: true },
      screenshot_url: { type: "string", required: false },
      screenshot_data: { type: "string", required: false }, // base64 data
      clickable_areas: { type: "array", required: false, default: [] },
      highlight_areas: { type: "array", required: false, default: [] },
      is_active: { type: "boolean", required: false, default: true },
      created_at: { type: "datetime", required: false },
      updated_at: { type: "datetime", required: false },
    };
  }

  // Получить все интерфейсы с возможностью фильтрации (оптимизированная версия)
  async getAll(filters = {}) {
    const startTime = Date.now();
    try {
      console.log("🔍 Starting optimized TV interfaces list query");

      // Включаем screenshot_data для изображений размером до 2MB, для больших - только метаданные
      let query = `
        SELECT
          ti.id,
          ti.name,
          ti.description,
          ti.type,
          ti.device_id,
          ti.screenshot_url,
          CASE
            WHEN LENGTH(ti.screenshot_data) <= 2097152 THEN ti.screenshot_data
            ELSE NULL
          END as screenshot_data,
          LENGTH(ti.screenshot_data) as screenshot_data_size,
          CASE WHEN ti.screenshot_data IS NOT NULL THEN true ELSE false END as has_screenshot_data,
          ti.is_active,
          ti.created_at,
          ti.updated_at,
          d.name as device_name,
          d.brand as device_brand,
          d.model as device_model
        FROM ${this.tableName} ti
        LEFT JOIN devices d ON ti.device_id = d.id
        WHERE ti.is_active = true
      `;

      const params = [];

      // Фильтр по device_id
      if (filters.device_id) {
        query += ` AND ti.device_id = $${params.length + 1}`;
        params.push(filters.device_id);
      }

      // Фильтр по активности
      if (filters.is_active !== undefined) {
        query += ` AND ti.is_active = $${params.length + 1}`;
        params.push(filters.is_active);
      }

      // Фильтр по типу
      if (filters.type) {
        query += ` AND ti.type = $${params.length + 1}`;
        params.push(filters.type);
      }

      // Поиск по названию или описанию
      if (filters.search) {
        query += ` AND (ti.name ILIKE $${params.length + 1} OR ti.description ILIKE $${params.length + 1})`;
        params.push(`%${filters.search}%`);
      }

      query += ` ORDER BY ti.created_at DESC`;

      // Лимит и смещение для пагинации
      if (filters.limit) {
        query += ` LIMIT $${params.length + 1}`;
        params.push(parseInt(filters.limit));

        if (filters.offset) {
          query += ` OFFSET $${params.length + 1}`;
          params.push(parseInt(filters.offset));
        }
      }

      const result = await this.query(query, params);

      const duration = Date.now() - startTime;
      console.log(
        `✅ Optimized TV interfaces list query completed in ${duration}ms`,
      );
      console.log(
        `📊 Returned ${result.rows.length} interfaces (screenshot_data excluded for performance)`,
      );

      return result.rows;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(
        `❌ TV interfaces list query failed after ${duration}ms:`,
        error,
      );
      throw error;
    }
  }

  // Получить интерфейсы по device_id
  async getByDeviceId(deviceId) {
    try {
      const query = `
        SELECT 
          ti.*,
          d.name as device_name,
          d.brand as device_brand,
          d.model as device_model
        FROM ${this.tableName} ti
        LEFT JOIN devices d ON ti.device_id = d.id
        WHERE ti.device_id = $1 AND ti.is_active = true
        ORDER BY ti.created_at DESC
      `;

      const result = await this.query(query, [deviceId]);
      return result.rows;
    } catch (error) {
      console.error("Error getting TV interfaces by device ID:", error);
      throw error;
    }
  }

  // Создать новый интерфейс (оптимизированная версия)
  async create(data) {
    const startTime = Date.now();
    try {
      console.log(`🔧 Starting optimized TV interface creation`);

      // Валидация обязательных полей
      if (!data.name || !data.name.trim()) {
        throw new Error("Название интерфейса обязательно");
      }

      if (!data.type) {
        throw new Error("Тип интерфейса обязателен");
      }

      if (!data.device_id) {
        throw new Error("Устройство обязательно для выбора");
      }

      // Проверяем размер screenshot_data если он есть
      if (data.screenshot_data) {
        const screenshotSize = data.screenshot_data.length;
        const sizeInMB = (screenshotSize / 1024 / 1024).toFixed(2);
        console.log(
          `📷 Processing screenshot data during create: ${sizeInMB}MB`,
        );
      }

      // Проверяем существование устройства
      const deviceExists = await this.query(
        "SELECT id FROM devices WHERE id = $1",
        [data.device_id],
      );
      if (deviceExists.rows.length === 0) {
        throw new Error("Выбранное устройство не найдено");
      }

      // Проверяем какие колонки существуют в таблице
      const columnsQuery = `
        SELECT column_name
        FROM information_schema.columns
        WHERE table_name = 'tv_interfaces' AND column_name IN ('clickable_areas', 'highlight_areas');
      `;
      const existingColumns = await this.query(columnsQuery);
      const hasClickableAreas = existingColumns.rows.some(
        (row) => row.column_name === "clickable_areas",
      );
      const hasHighlightAreas = existingColumns.rows.some(
        (row) => row.column_name === "highlight_areas",
      );

      const now = new Date().toISOString();
      const tvInterfaceData = {
        name: data.name.trim(),
        description: data.description?.trim() || "",
        type: data.type,
        device_id: data.device_id,
        screenshot_url: data.screenshot_url || null,
        screenshot_data: data.screenshot_data || null,
        is_active: data.is_active !== undefined ? data.is_active : true,
        created_at: now,
        updated_at: now,
      };

      // Добавляем колонки только если они существуют
      if (hasClickableAreas) {
        tvInterfaceData.clickable_areas = JSON.stringify(
          data.clickable_areas || [],
        );
      }
      if (hasHighlightAreas) {
        tvInterfaceData.highlight_areas = JSON.stringify(
          data.highlight_areas || [],
        );
      }

      console.log(`🗃️ Executing optimized create operation`);
      const result = await super.create(tvInterfaceData);

      // Получаем созданный интерфейс с данными устройства с оптимизированным запросом
      console.log(`🔍 Fetching created interface with device data`);
      const created = await this.getById(result.id);

      const duration = Date.now() - startTime;
      console.log(
        `✅ Optimized TV interface creation completed in ${duration}ms`,
      );

      return created;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(
        `❌ TV interface creation failed after ${duration}ms:`,
        error.message,
      );
      throw error;
    }
  }

  // Обновить интерфейс (оптимизированная версия)
  async update(id, data) {
    const startTime = Date.now();
    try {
      console.log(`🔧 Starting optimized TV interface update: ${id}`);

      // Валидация device_id если он передан (без дополнительного запроса к текущему интерфейсу)
      if (data.device_id) {
        const deviceExists = await this.query(
          "SELECT id FROM devices WHERE id = $1",
          [data.device_id],
        );
        if (deviceExists.rows.length === 0) {
          throw new Error("Выбранное устройст��о не найдено");
        }
      }

      const updateData = {
        updated_at: new Date().toISOString(),
      };

      // Обновляем только переданные поля
      if (data.name !== undefined) updateData.name = data.name.trim();
      if (data.description !== undefined)
        updateData.description = data.description?.trim() || "";
      if (data.type !== undefined) updateData.type = data.type;
      if (data.device_id !== undefined) updateData.device_id = data.device_id;
      if (data.screenshot_url !== undefined)
        updateData.screenshot_url = data.screenshot_url;
      if (data.screenshot_data !== undefined) {
        updateData.screenshot_data = data.screenshot_data;
        const sizeInMB = (data.screenshot_data.length / 1024 / 1024).toFixed(2);
        console.log(`📷 Processing screenshot data: ${sizeInMB}MB`);
      }
      if (data.clickable_areas !== undefined)
        updateData.clickable_areas = JSON.stringify(data.clickable_areas);
      if (data.highlight_areas !== undefined)
        updateData.highlight_areas = JSON.stringify(data.highlight_areas);
      if (data.is_active !== undefined) updateData.is_active = data.is_active;

      // Объединенный запрос: обновление + возвр��т с JOIN в одн��й операци��
      const updateFields = [];
      const updateValues = [];
      let paramIndex = 1;

      Object.keys(updateData).forEach((key) => {
        updateFields.push(`${key} = $${paramIndex}`);
        updateValues.push(updateData[key]);
        paramIndex++;
      });

      updateValues.push(id); // ID для WHERE условия

      const query = `
        UPDATE ${this.tableName}
        SET ${updateFields.join(", ")}
        WHERE id = $${paramIndex} AND is_active = true
        RETURNING *
      `;

      console.log(`🗃️ Executing optimized update query`);
      const updateResult = await this.query(query, updateValues);

      if (updateResult.rows.length === 0) {
        throw new Error("TV интерфейс не найден или уже удален");
      }

      const updatedInterface = updateResult.rows[0];

      // Получаем данные устройства отдельным быстрым запросом только если нужно
      const deviceQuery = `
        SELECT name as device_name, brand as device_brand, model as device_model
        FROM devices
        WHERE id = $1
      `;
      const deviceResult = await this.query(deviceQuery, [
        updatedInterface.device_id,
      ]);

      // Объед��няем результат
      const result = {
        ...updatedInterface,
        device_name: deviceResult.rows[0]?.device_name || null,
        device_brand: deviceResult.rows[0]?.device_brand || null,
        device_model: deviceResult.rows[0]?.device_model || null,
      };

      // Парсим JSON поля если они существуют
      if (result.clickable_areas) {
        try {
          result.clickable_areas = JSON.parse(result.clickable_areas);
        } catch (e) {
          result.clickable_areas = [];
        }
      } else {
        result.clickable_areas = [];
      }

      if (result.highlight_areas) {
        try {
          result.highlight_areas = JSON.parse(result.highlight_areas);
        } catch (e) {
          result.highlight_areas = [];
        }
      } else {
        result.highlight_areas = [];
      }

      const duration = Date.now() - startTime;
      console.log(
        `✅ Optimized TV interface update completed in ${duration}ms`,
      );

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(
        `❌ TV interface update failed after ${duration}ms:`,
        error.message,
      );
      throw error;
    }
  }

  // Получить интерфейс по ID с полными данными включая screenshot_data
  async getById(id) {
    const startTime = Date.now();
    try {
      console.log(`🔍 Starting TV interface by ID query: ${id}`);

      const query = `
        SELECT
          ti.*,
          d.name as device_name,
          d.brand as device_brand,
          d.model as device_model
        FROM ${this.tableName} ti
        LEFT JOIN devices d ON ti.device_id = d.id
        WHERE ti.id = $1 AND ti.is_active = true
      `;

      const result = await this.query(query, [id]);

      if (result.rows.length === 0) {
        return null;
      }

      const tvInterface = result.rows[0];

      // Логируем размер screenshot_data если он есть
      if (tvInterface.screenshot_data) {
        const sizeInMB = (
          tvInterface.screenshot_data.length /
          1024 /
          1024
        ).toFixed(2);
        console.log(`📷 Interface ${id} has screenshot data: ${sizeInMB}MB`);
      }

      // Парсим JSON поля если они существуют
      if (tvInterface.hasOwnProperty("clickable_areas")) {
        if (tvInterface.clickable_areas) {
          try {
            tvInterface.clickable_areas = JSON.parse(
              tvInterface.clickable_areas,
            );
          } catch (e) {
            tvInterface.clickable_areas = [];
          }
        } else {
          tvInterface.clickable_areas = [];
        }
      } else {
        tvInterface.clickable_areas = [];
      }

      if (tvInterface.hasOwnProperty("highlight_areas")) {
        if (tvInterface.highlight_areas) {
          try {
            tvInterface.highlight_areas = JSON.parse(
              tvInterface.highlight_areas,
            );
          } catch (e) {
            tvInterface.highlight_areas = [];
          }
        } else {
          tvInterface.highlight_areas = [];
        }
      } else {
        tvInterface.highlight_areas = [];
      }

      const duration = Date.now() - startTime;
      console.log(`✅ TV interface by ID query completed in ${duration}ms`);

      return tvInterface;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(
        `❌ TV interface by ID query failed after ${duration}ms:`,
        error,
      );
      throw error;
    }
  }

  // Получить интерфейс по ID без screenshot_data для оптимизации
  async getByIdLightweight(id) {
    const startTime = Date.now();
    try {
      console.log(`🔍 Starting lightweight TV interface query: ${id}`);

      const query = `
        SELECT
          ti.id,
          ti.name,
          ti.description,
          ti.type,
          ti.device_id,
          ti.screenshot_url,
          LENGTH(ti.screenshot_data) as screenshot_data_size,
          CASE WHEN ti.screenshot_data IS NOT NULL THEN true ELSE false END as has_screenshot_data,
          ti.is_active,
          ti.created_at,
          ti.updated_at,
          d.name as device_name,
          d.brand as device_brand,
          d.model as device_model
        FROM ${this.tableName} ti
        LEFT JOIN devices d ON ti.device_id = d.id
        WHERE ti.id = $1 AND ti.is_active = true
      `;

      const result = await this.query(query, [id]);

      if (result.rows.length === 0) {
        return null;
      }

      const duration = Date.now() - startTime;
      console.log(
        `✅ Lightweight TV interface query completed in ${duration}ms`,
      );

      return result.rows[0];
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(
        `❌ Lightweight TV interface query failed after ${duration}ms:`,
        error,
      );
      throw error;
    }
  }

  // Переключить статус активности
  async toggleStatus(id) {
    try {
      const existing = await this.getById(id);
      if (!existing) {
        throw new Error("TV интерфейс не найден");
      }

      const newStatus = !existing.is_active;
      await this.update(id, { is_active: newStatus });

      return await this.getById(id);
    } catch (error) {
      console.error("Error toggling TV interface status:", error);
      throw error;
    }
  }

  // Дублировать интерфейс
  async duplicate(id, newName) {
    try {
      const original = await this.getById(id);
      if (!original) {
        throw new Error("TV интерфейс не найден");
      }

      const duplicateData = {
        name: newName || `${original.name} (копия)`,
        description: original.description,
        type: original.type,
        device_id: original.device_id,
        screenshot_url: original.screenshot_url,
        screenshot_data: original.screenshot_data,
        clickable_areas: original.clickable_areas,
        highlight_areas: original.highlight_areas,
        is_active: false, // Копия создается неактивной
      };

      return await this.create(duplicateData);
    } catch (error) {
      console.error("Error duplicating TV interface:", error);
      throw error;
    }
  }

  // Получить статистику
  async getStats() {
    try {
      const query = `
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN is_active = true THEN 1 END) as active,
          COUNT(CASE WHEN is_active = false THEN 1 END) as inactive,
          COUNT(DISTINCT device_id) as devices_with_interfaces
        FROM ${this.tableName} 
        WHERE is_active = true
      `;

      const result = await this.query(query);
      return result.rows[0];
    } catch (error) {
      console.error("Error getting TV interface stats:", error);
      throw error;
    }
  }
}

export default TVInterface;
