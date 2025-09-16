import { apiClient, handleApiError } from "./client";
import { getCache, setCache, invalidateCache, buildKey } from "./cache";
import type { Remote } from "@/types";

// Типы для API
export interface RemoteFilters {
  page?: number;
  limit?: number;
  search?: string;
  device_id?: string;
  layout?: "standard" | "compact" | "smart" | "custom";
  manufacturer?: string;
  sort?:
    | "name_asc"
    | "name_desc"
    | "usage_count_asc"
    | "usage_count_desc"
    | "created_at_asc"
    | "created_at_desc"
    | "manufacturer_asc"
    | "manufacturer_desc";
}

export interface RemoteCreateData {
  name: string;
  manufacturer: string;
  model: string;
  device_id?: string | null;
  description?: string;
  layout?: "standard" | "compact" | "smart" | "custom";
  color_scheme?: string;
  image_url?: string;
  image_data?: string;
  svg_data?: string;
  dimensions?: {
    width: number;
    height: number;
  };
  buttons?: Array<{
    id: string;
    name: string;
    x: number;
    y: number;
    width: number;
    height: number;
    type?: string;
    action?: string;
    svg_path?: string;
    key_code?: string;
  }>;
  zones?: Array<{
    id: string;
    name: string;
    x: number;
    y: number;
    width: number;
    height: number;
    color?: string;
    description?: string;
  }>;
  is_default?: boolean;
  is_active?: boolean;
  metadata?: Record<string, any>;
}

export interface RemoteUpdateData extends Partial<RemoteCreateData> {}

export interface RemoteDuplicateData {
  name?: string;
  device_id?: string | null;
  description?: string;
}

export interface RemoteStats {
  total_remotes: number;
  default_remotes: number;
  avg_usage: number;
  max_usage: number;
  recently_used: number;
}

/**
 * API для работы с пультами дистанционного управления
 */
export const remotesApi = {
  /**
   * Получение списка пультов с пагинацией и фильтрами (кэшируется)
   */
  async getAll(filters: RemoteFilters = {}) {
    try {
      const key = buildKey("remotes:getAll", filters || {});
      const cached = getCache<any>(key);
      if (cached) return cached;

      const params = new URLSearchParams();
      if (filters.page) params.append("page", filters.page.toString());
      if (filters.limit) params.append("limit", filters.limit.toString());
      if (filters.search) params.append("search", filters.search);
      if (filters.device_id) params.append("device_id", filters.device_id);
      if (filters.layout) params.append("layout", filters.layout);
      if (filters.manufacturer)
        params.append("manufacturer", filters.manufacturer);
      if (filters.sort) params.append("sort", filters.sort);

      const queryString = params.toString();
      const url = queryString ? `/remotes?${queryString}` : "/remotes";

      const res = await apiClient.get(url);
      setCache(key, res);
      return res;
    } catch (error) {
      throw handleApiError(error, "Failed to fetch remotes");
    }
  },

  /**
   * Получение пульта по ID (кэшируется)
   */
  async getById(id: string): Promise<Remote> {
    try {
      const key = `remotes:getById:${id}`;
      const cached = getCache<any>(key);
      if (cached) return cached?.data ?? cached;

      const response = await apiClient.get<any>(`/remotes/${id}`);
      setCache(key, response);
      return response?.data ?? response;
    } catch (error) {
      throw handleApiError(error, `Failed to fetch remote ${id}`);
    }
  },

  /**
   * Создание нового пульта (инвалидирует кэш)
   */
  async create(data: RemoteCreateData): Promise<Remote> {
    try {
      const response = await apiClient.post("/remotes", data);
      invalidateCache("remotes:");
      return response.data;
    } catch (error) {
      throw handleApiError(error, "Failed to create remote");
    }
  },

  /**
   * Обновление пульта (инвалидирует кэш)
   */
  async update(id: string, data: RemoteUpdateData): Promise<Remote> {
    try {
      const response = await apiClient.put(`/remotes/${id}`, data);
      invalidateCache("remotes:");
      return response.data;
    } catch (error) {
      throw handleApiError(error, `Failed to update remote ${id}`);
    }
  },

  /**
   * Удаление пульта (мягкое удаление) (инвалидирует кэш)
   */
  async delete(id: string): Promise<Remote> {
    try {
      const response = await apiClient.delete(`/remotes/${id}`);
      invalidateCache("remotes:");
      return response.data;
    } catch (error) {
      throw handleApiError(error, `Failed to delete remote ${id}`);
    }
  },

  /**
   * Получение пультов для конкретного устройства (кэшируется)
   */
  async getByDevice(deviceId: string): Promise<Remote[]> {
    try {
      const key = `remotes:getByDevice:${deviceId}`;
      const cached = getCache<any>(key);
      if (cached) return cached?.data ?? cached;

      const response = await apiClient.get<any>(`/remotes/device/${deviceId}`);
      setCache(key, response);
      return response?.data ?? response;
    } catch (error: any) {
      // Handle 404 gracefully - no remotes found for device
      if (error?.response?.status === 404 || error?.status === 404) {
        console.log(`No remotes found for device ${deviceId} (404 - expected)`);
        return [];
      }
      throw handleApiError(
        error,
        `Failed to fetch remotes for device ${deviceId}`,
      );
    }
  },

  /**
   * ��олучение пульта по умолчанию для устройства
   */
  async getDefaultForDevice(deviceId: string): Promise<Remote> {
    try {
      const response = await apiClient.get<any>(
        `/remotes/device/${deviceId}/default`,
      );
      return response?.data ?? response;
    } catch (error: any) {
      // Handle 404 gracefully - no default remote found for device
      if (error?.response?.status === 404 || error?.status === 404) {
        console.log(
          `No default remote found for device ${deviceId} (404 - expected)`,
        );
        throw new Error(`NO_DEFAULT_REMOTE_FOR_DEVICE_${deviceId}`);
      }
      throw handleApiError(
        error,
        `Failed to fetch default remote for device ${deviceId}`,
      );
    }
  },

  /**
   * Установка пульта как default для устройства (инвалидирует кэш)
   */
  async setAsDefault(remoteId: string, deviceId: string): Promise<void> {
    try {
      await apiClient.post(`/remotes/${remoteId}/set-default/${deviceId}`);
      invalidateCache("remotes:");
    } catch (error) {
      throw handleApiError(
        error,
        `Failed to set remote ${remoteId} as default for device ${deviceId}`,
      );
    }
  },

  /**
   * Дублирова��ие пульта (инвалидирует кэш)
   */
  async duplicate(id: string, data: RemoteDuplicateData = {}): Promise<Remote> {
    try {
      const response = await apiClient.post(`/remotes/${id}/duplicate`, data);
      invalidateCache("remotes:");
      return response.data;
    } catch (error) {
      throw handleApiError(error, `Failed to duplicate remote ${id}`);
    }
  },

  /**
   * Инкремент счетчика использования (инвалидирует кэш по id)
   */
  async incrementUsage(id: string): Promise<{ usage_count: number }> {
    try {
      const response = await apiClient.post(`/remotes/${id}/use`);
      invalidateCache(`remotes:getById:${id}`);
      return response.data;
    } catch (error) {
      throw handleApiError(error, `Failed to increment usage for remote ${id}`);
    }
  },

  /**
   * Получение статистики использования пультов (кэшируется)
   */
  async getStats(deviceId?: string): Promise<RemoteStats> {
    try {
      const key = deviceId ? `remotes:stats:${deviceId}` : "remotes:stats:all";
      const cached = getCache<any>(key);
      if (cached) return cached?.data ?? cached;

      const url = deviceId
        ? `/remotes/stats?device_id=${deviceId}`
        : "/remotes/stats";
      const response = await apiClient.get(url);
      setCache(key, response);
      return response.data;
    } catch (error) {
      throw handleApiError(error, "Failed to fetch remote stats");
    }
  },

  /**
   * Поиск пультов (использует кэширование getAll)
   */
  async search(
    query: string,
    filters: Omit<RemoteFilters, "search"> = {},
  ): Promise<Remote[]> {
    try {
      return await this.getAll({ ...filters, search: query });
    } catch (error) {
      throw handleApiError(
        error,
        `Failed to search remotes with query: ${query}`,
      );
    }
  },
};

export default remotesApi;
