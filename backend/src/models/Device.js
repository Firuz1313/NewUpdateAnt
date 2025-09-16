import BaseModel from "./BaseModel.js";
import { query } from "../utils/database.js";

/**
 * Модель для работы с устройствами (ТВ-приставками)
 */
class Device extends BaseModel {
  constructor() {
    super("devices");
  }

  /**
   * Получение устройств с дополнительными данными (количество проблем)
   */
  async findAllWithStats(filters = {}, options = {}) {
    try {
      const { sql: baseQuery, values } = this.buildSelectQuery(
        filters,
        options,
      );

      // Расширяем запрос для получения статистики
      const sql = `
        SELECT 
          d.*,
          COUNT(p.id) as problems_count,
          COUNT(CASE WHEN p.status = 'published' THEN 1 END) as published_problems_count,
          COUNT(CASE WHEN p.is_active = true THEN 1 END) as active_problems_count
        FROM (${baseQuery}) d
        LEFT JOIN problems p ON d.id = p.device_id AND p.is_active = true
        GROUP BY d.id, d.name, d.brand, d.model, d.description, d.image_url, 
                 d.logo_url, d.color, d.order_index, d.status, d.is_active,
                 d.metadata, d.created_at, d.updated_at
        ORDER BY d.order_index ASC, d.created_at DESC
      `;

      const result = await query(sql, values);
      return result.rows.map((row) => ({
        ...row,
        problems_count: parseInt(row.problems_count || 0),
        published_problems_count: parseInt(row.published_problems_count || 0),
        active_problems_count: parseInt(row.active_problems_count || 0),
      }));
    } catch (error) {
      console.error(
        "Ошибка получения устройств со статистикой:",
        error.message,
      );
      throw error;
    }
  }

  /**
   * Получение устройства со статистикой по ID
   */
  async findByIdWithStats(id) {
    try {
      const sql = `
        SELECT 
          d.*,
          COUNT(p.id) as problems_count,
          COUNT(CASE WHEN p.status = 'published' THEN 1 END) as published_problems_count,
          COUNT(CASE WHEN p.is_active = true THEN 1 END) as active_problems_count,
          COUNT(r.id) as remotes_count,
          COUNT(CASE WHEN r.is_default = true THEN 1 END) as default_remotes_count
        FROM devices d
        LEFT JOIN problems p ON d.id = p.device_id AND p.is_active = true
        LEFT JOIN remotes r ON d.id = r.device_id AND r.is_active = true
        WHERE d.id = $1
        GROUP BY d.id
      `;

      const result = await query(sql, [id]);
      if (result.rows.length === 0) {
        return null;
      }

      const device = result.rows[0];
      return {
        ...device,
        problems_count: parseInt(device.problems_count || 0),
        published_problems_count: parseInt(
          device.published_problems_count || 0,
        ),
        active_problems_count: parseInt(device.active_problems_count || 0),
        remotes_count: parseInt(device.remotes_count || 0),
        default_remotes_count: parseInt(device.default_remotes_count || 0),
      };
    } catch (error) {
      console.error(
        "Ошибка получения устройства со статистикой:",
        error.message,
      );
      throw error;
    }
  }

  /**
   * Поиск устройств по тексту
   */
  async search(searchTerm, options = {}) {
    try {
      const sql = `
        SELECT 
          d.*,
          COUNT(p.id) as problems_count,
          ts_rank(
            to_tsvector('russian', d.name || ' ' || d.brand || ' ' || COALESCE(d.description, '')), 
            plainto_tsquery('russian', $1)
          ) as rank
        FROM devices d
        LEFT JOIN problems p ON d.id = p.device_id AND p.is_active = true
        WHERE d.is_active = true
          AND to_tsvector('russian', d.name || ' ' || d.brand || ' ' || COALESCE(d.description, ''))
              @@ plainto_tsquery('russian', $1)
        GROUP BY d.id
        ORDER BY rank DESC, d.order_index ASC
        LIMIT $2 OFFSET $3
      `;

      const limit = options.limit || 20;
      const offset = options.offset || 0;

      const result = await query(sql, [searchTerm, limit, offset]);
      return result.rows.map((row) => ({
        ...row,
        problems_count: parseInt(row.problems_count || 0),
        rank: parseFloat(row.rank || 0),
      }));
    } catch (error) {
      console.error("Ошибка поиска устройств:", error.message);
      throw error;
    }
  }

  /**
   * Получение популярных устройств (по количеству решенных проблем)
   */
  async getPopular(limit = 10) {
    try {
      const sql = `
        SELECT 
          d.*,
          COUNT(p.id) as problems_count,
          SUM(p.completed_count) as total_completions,
          AVG(p.success_rate) as avg_success_rate
        FROM devices d
        LEFT JOIN problems p ON d.id = p.device_id 
          AND p.is_active = true 
          AND p.status = 'published'
        WHERE d.is_active = true
        GROUP BY d.id
        ORDER BY total_completions DESC NULLS LAST, problems_count DESC
        LIMIT $1
      `;

      const result = await query(sql, [limit]);
      return result.rows.map((row) => ({
        ...row,
        problems_count: parseInt(row.problems_count || 0),
        total_completions: parseInt(row.total_completions || 0),
        avg_success_rate: parseFloat(row.avg_success_rate || 0),
      }));
    } catch (error) {
      console.error("Ошибка получения популярных устройств:", error.message);
      throw error;
    }
  }

  /**
   * Обновление порядка сортировки устройств
   */
  async updateOrder(deviceIds) {
    try {
      const updatePromises = deviceIds.map((deviceId, index) => {
        const sql = `
          UPDATE devices 
          SET order_index = $1, updated_at = $2 
          WHERE id = $3
          RETURNING id, order_index
        `;
        return query(sql, [index + 1, this.createTimestamp(), deviceId]);
      });

      const results = await Promise.all(updatePromises);
      return results.map((result) => result.rows[0]).filter(Boolean);
    } catch (error) {
      console.error("Ошибка обновления порядка устройств:", error.message);
      throw error;
    }
  }

  /**
   * Проверка возможности удаления устройства
   */
  async canDelete(id) {
    try {
      const sql = `
        SELECT
          COUNT(p.id) as problems_count,
          COUNT(CASE WHEN p.status = 'published' THEN 1 END) as published_problems_count,
          COUNT(r.id) as remotes_count,
          COUNT(ds.id) as active_sessions_count
        FROM devices d
        LEFT JOIN problems p ON d.id = p.device_id AND p.is_active = true
        LEFT JOIN remotes r ON d.id = r.device_id AND r.is_active = true
        LEFT JOIN diagnostic_sessions ds ON d.id = ds.device_id
          AND ds.is_active = true
          AND ds.end_time IS NULL
        WHERE d.id = $1
        GROUP BY d.id
      `;

      const result = await query(sql, [id]);
      if (result.rows.length === 0) {
        return { canDelete: false, reason: "Устройство не найдено" };
      }

      const stats = result.rows[0];
      const problemsCount = parseInt(stats.problems_count || 0);
      const publishedProblemsCount = parseInt(
        stats.published_problems_count || 0,
      );
      const remotesCount = parseInt(stats.remotes_count || 0);
      const activeSessionsCount = parseInt(stats.active_sessions_count || 0);

      if (activeSessionsCount > 0) {
        return {
          canDelete: false,
          reason: `Невозможно удалить устройство с ${activeSessionsCount} активными сессиями диагностики`,
        };
      }

      if (publishedProblemsCount > 0) {
        return {
          canDelete: false,
          reason: `Невозможно удалить устройство с ${publishedProblemsCount} опубликованными проблемами`,
        };
      }

      if (problemsCount > 0) {
        return {
          canDelete: false,
          reason: `Устройство содержит ${problemsCount} проблем. Сначала удалите или переместите их.`,
          suggestion: "Можно архивировать устройство вместо удаления",
        };
      }

      if (remotesCount > 0) {
        return {
          canDelete: false,
          reason: `Устройство содержит ${remotesCount} пультов. Сначала удалите или переместите их.`,
          suggestion: "Можно архивировать устройство вместо удаления",
        };
      }

      return { canDelete: true };
    } catch (error) {
      console.error(
        "Ошибка проверки возможности удаления устройства:",
        error.message,
      );
      throw error;
    }
  }

  /**
   * Получение статистики по всем устройствам
   */
  async getStats() {
    try {
      const sql = `
        SELECT 
          COUNT(*) as total_devices,
          COUNT(CASE WHEN is_active = true THEN 1 END) as active_devices,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as working_devices,
          COUNT(CASE WHEN status = 'maintenance' THEN 1 END) as maintenance_devices,
          COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive_devices
        FROM devices
      `;

      const result = await query(sql);
      const stats = result.rows[0];

      return {
        total: parseInt(stats.total_devices || 0),
        active: parseInt(stats.active_devices || 0),
        working: parseInt(stats.working_devices || 0),
        maintenance: parseInt(stats.maintenance_devices || 0),
        inactive: parseInt(stats.inactive_devices || 0),
      };
    } catch (error) {
      console.error("Ошибка получения статистики устройств:", error.message);
      throw error;
    }
  }

  /**
   * Получение устройств для админ панели с расширенной информацией
   */
  async getForAdmin(filters = {}, options = {}) {
    try {
      // Строим базовый запрос с учетом фильтров
      let whereConditions = ["d.id IS NOT NULL"];
      const values = [];
      let paramIndex = 1;

      if (filters.search) {
        whereConditions.push(`(
          d.name ILIKE $${paramIndex} OR 
          d.brand ILIKE $${paramIndex} OR 
          d.model ILIKE $${paramIndex}
        )`);
        values.push(`%${filters.search}%`);
        paramIndex++;
      }

      if (filters.status) {
        whereConditions.push(`d.status = $${paramIndex}`);
        values.push(filters.status);
        paramIndex++;
      }

      if (filters.is_active !== undefined) {
        whereConditions.push(`d.is_active = $${paramIndex}`);
        values.push(filters.is_active);
        paramIndex++;
      }

      const sql = `
        SELECT 
          d.*,
          COUNT(DISTINCT p.id) as problems_count,
          COUNT(DISTINCT CASE WHEN p.status = 'published' THEN p.id END) as published_problems_count,
          COUNT(DISTINCT r.id) as remotes_count,
          COUNT(DISTINCT tv.id) as tv_interfaces_count,
          MAX(ds.start_time) as last_diagnostic_session
        FROM devices d
        LEFT JOIN problems p ON d.id = p.device_id
        LEFT JOIN remotes r ON d.id = r.device_id AND r.is_active = true
        LEFT JOIN tv_interfaces tv ON d.id = tv.device_id AND tv.is_active = true
        LEFT JOIN diagnostic_sessions ds ON d.id = ds.device_id AND ds.is_active = true
        WHERE ${whereConditions.join(" AND ")}
        GROUP BY d.id
        ORDER BY d.order_index ASC, d.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      const limit = options.limit || 50;
      const offset = options.offset || 0;
      values.push(limit, offset);

      const result = await query(sql, values);
      return result.rows.map((row) => ({
        ...row,
        problems_count: parseInt(row.problems_count || 0),
        published_problems_count: parseInt(row.published_problems_count || 0),
        remotes_count: parseInt(row.remotes_count || 0),
        tv_interfaces_count: parseInt(row.tv_interfaces_count || 0),
      }));
    } catch (error) {
      console.error(
        "Ошибка получения устройств для админ панели:",
        error.message,
      );
      throw error;
    }
  }
}

export default Device;
