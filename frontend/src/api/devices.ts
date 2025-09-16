import { apiClient } from "./client";
import { getCache, setCache, invalidateCache, buildKey } from "./cache";
import {
  Device,
  APIResponse,
  PaginatedResponse,
  FilterOptions,
} from "../types";

export interface DeviceFilters extends FilterOptions {
  status?: "active" | "inactive" | "maintenance";
  brand?: string;
  include_stats?: boolean;
  admin?: boolean;
}

export interface DeviceCreateData {
  id?: string;
  name: string;
  brand: string;
  model: string;
  description?: string;
  imageUrl?: string;
  logoUrl?: string;
  color?: string;
  orderIndex?: number;
  status?: "active" | "inactive" | "maintenance";
  metadata?: Record<string, any>;
}

export interface DeviceUpdateData extends Partial<DeviceCreateData> {
  isActive?: boolean;
}

export interface DeviceStats {
  total: number;
  active: number;
  inactive: number;
  maintenance: number;
  popularDevices: Device[];
  recentlyAdded: Device[];
}

export interface BulkUpdateItem {
  id: string;
  data: DeviceUpdateData;
}

export class DevicesApi {
  private readonly basePath = "/devices";

  /**
   * Получение списка устройств (с кэшированием)
   */
  async getDevices(
    page: number = 1,
    limit: number = 20,
    filters: DeviceFilters = {},
  ): Promise<PaginatedResponse<Device>> {
    const key = buildKey("devices:get", { page, limit, filters });
    const cached = getCache<PaginatedResponse<Device>>(key);
    if (cached) return cached;

    const res = await apiClient.get<PaginatedResponse<Device>>(this.basePath, {
      params: {
        page,
        limit,
        ...filters,
      },
    });
    setCache(key, res);
    return res;
  }

  /**
   * Получение устройства по ID (с кэшированием)
   */
  async getDevice(
    id: string,
    includeStats: boolean = false,
  ): Promise<APIResponse<Device>> {
    const key = buildKey("devices:getById", { id, includeStats });
    const cached = getCache<APIResponse<Device>>(key);
    if (cached) return cached;

    const res = await apiClient.get<APIResponse<Device>>(
      `${this.basePath}/${id}`,
      {
        params: { include_stats: includeStats },
      },
    );
    setCache(key, res);
    return res;
  }

  /**
   * Создание нового устройства (инвалидирует кэш)
   */
  async createDevice(data: DeviceCreateData): Promise<APIResponse<Device>> {
    const res = await apiClient.post<APIResponse<Device>>(this.basePath, data);
    invalidateCache("devices:");
    return res;
  }

  /**
   * Обновление устройства (инвалидирует кэш)
   */
  async updateDevice(
    id: string,
    data: DeviceUpdateData,
  ): Promise<APIResponse<Device>> {
    const res = await apiClient.put<APIResponse<Device>>(
      `${this.basePath}/${id}`,
      data,
    );
    invalidateCache("devices:");
    return res;
  }

  /**
   * Удаление устройства (инвалидирует кэш)
   */
  async deleteDevice(
    id: string,
    force: boolean = false,
  ): Promise<APIResponse<Device>> {
    const res = await apiClient.delete<APIResponse<Device>>(
      `${this.basePath}/${id}`,
      {
        params: { force },
      },
    );
    invalidateCache("devices:");
    return res;
  }

  /**
   * Восстановление архивированного устройства (инвалидирует кэш)
   */
  async restoreDevice(id: string): Promise<APIResponse<Device>> {
    const res = await apiClient.post<APIResponse<Device>>(
      `${this.basePath}/${id}/restore`,
    );
    invalidateCache("devices:");
    return res;
  }

  /**
   * Поиск устройств (с ��эшированием)
   */
  async searchDevices(
    query: string,
    limit: number = 20,
    offset: number = 0,
  ): Promise<APIResponse<Device[]>> {
    const key = buildKey("devices:search", { query, limit, offset });
    const cached = getCache<APIResponse<Device[]>>(key, 2 * 60 * 1000);
    if (cached) return cached;

    const res = await apiClient.get<APIResponse<Device[]>>(
      `${this.basePath}/search`,
      {
        params: { q: query, limit, offset },
      },
    );
    setCache(key, res);
    return res;
  }

  /**
   * Получение популярных устройств (с кэшированием)
   */
  async getPopularDevices(limit: number = 10): Promise<APIResponse<Device[]>> {
    const key = `devices:popular:${limit}`;
    const cached = getCache<APIResponse<Device[]>>(key);
    if (cached) return cached;

    const res = await apiClient.get<APIResponse<Device[]>>(
      `${this.basePath}/popular`,
      {
        params: { limit },
      },
    );
    setCache(key, res);
    return res;
  }

  /**
   * Получение статистики устройств (с кэшированием)
   */
  async getDeviceStats(): Promise<APIResponse<DeviceStats>> {
    const key = `devices:stats`;
    const cached = getCache<APIResponse<DeviceStats>>(key);
    if (cached) return cached;

    const res = await apiClient.get<APIResponse<DeviceStats>>(
      `${this.basePath}/stats`,
    );
    setCache(key, res);
    return res;
  }

  /**
   * Изменение порядка устройств (инвалидирует кэш)
   */
  async reorderDevices(deviceIds: string[]): Promise<APIResponse<Device[]>> {
    const res = await apiClient.put<APIResponse<Device[]>>(
      `${this.basePath}/reorder`,
      {
        deviceIds,
      },
    );
    invalidateCache("devices:");
    return res;
  }

  /**
   * Массовое обновление устройств (инвалидирует кэш)
   */
  async bulkUpdateDevices(
    updates: BulkUpdateItem[],
  ): Promise<APIResponse<Device[]>> {
    const res = await apiClient.put<APIResponse<Device[]>>(
      `${this.basePath}/bulk`,
      {
        updates,
      },
    );
    invalidateCache("devices:");
    return res;
  }

  /**
   * Экспорт устройств (с кэшированием по параметрам)
   */
  async exportDevices(
    format: string = "json",
    includeProblems: boolean = false,
  ): Promise<APIResponse<Device[]>> {
    const key = buildKey("devices:export", { format, includeProblems });
    const cached = getCache<APIResponse<Device[]>>(key, 60 * 60 * 1000);
    if (cached) return cached;

    const res = await apiClient.get<APIResponse<Device[]>>(
      `${this.basePath}/export`,
      {
        params: { format, include_problems: includeProblems },
      },
    );
    setCache(key, res);
    return res;
  }
}

// Export singleton instance
export const devicesApi = new DevicesApi();
export default devicesApi;
