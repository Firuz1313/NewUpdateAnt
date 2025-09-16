import { apiClient } from "./client";
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
   * Получение списка устройств
   */
  async getDevices(
    page: number = 1,
    limit: number = 20,
    filters: DeviceFilters = {},
  ): Promise<PaginatedResponse<Device>> {
    return apiClient.get<PaginatedResponse<Device>>(this.basePath, {
      params: {
        page,
        limit,
        ...filters,
      },
    });
  }

  /**
   * Получение устройства по ID
   */
  async getDevice(
    id: string,
    includeStats: boolean = false,
  ): Promise<APIResponse<Device>> {
    return apiClient.get<APIResponse<Device>>(`${this.basePath}/${id}`, {
      params: { include_stats: includeStats },
    });
  }

  /**
   * Создание нового устройства
   */
  async createDevice(data: DeviceCreateData): Promise<APIResponse<Device>> {
    return apiClient.post<APIResponse<Device>>(this.basePath, data);
  }

  /**
   * Обновление устройства
   */
  async updateDevice(
    id: string,
    data: DeviceUpdateData,
  ): Promise<APIResponse<Device>> {
    return apiClient.put<APIResponse<Device>>(`${this.basePath}/${id}`, data);
  }

  /**
   * Удаление устройства
   */
  async deleteDevice(
    id: string,
    force: boolean = false,
  ): Promise<APIResponse<Device>> {
    return apiClient.delete<APIResponse<Device>>(`${this.basePath}/${id}`, {
      params: { force },
    });
  }

  /**
   * Восстановление архивированного устройства
   */
  async restoreDevice(id: string): Promise<APIResponse<Device>> {
    return apiClient.post<APIResponse<Device>>(
      `${this.basePath}/${id}/restore`,
    );
  }

  /**
   * Поиск устройств
   */
  async searchDevices(
    query: string,
    limit: number = 20,
    offset: number = 0,
  ): Promise<APIResponse<Device[]>> {
    return apiClient.get<APIResponse<Device[]>>(`${this.basePath}/search`, {
      params: { q: query, limit, offset },
    });
  }

  /**
   * Получение популярных устройств
   */
  async getPopularDevices(limit: number = 10): Promise<APIResponse<Device[]>> {
    return apiClient.get<APIResponse<Device[]>>(`${this.basePath}/popular`, {
      params: { limit },
    });
  }

  /**
   * Получение статистики устройств
   */
  async getDeviceStats(): Promise<APIResponse<DeviceStats>> {
    return apiClient.get<APIResponse<DeviceStats>>(`${this.basePath}/stats`);
  }

  /**
   * Изменение порядка устройств
   */
  async reorderDevices(deviceIds: string[]): Promise<APIResponse<Device[]>> {
    return apiClient.put<APIResponse<Device[]>>(`${this.basePath}/reorder`, {
      deviceIds,
    });
  }

  /**
   * Массовое обновление устройств
   */
  async bulkUpdateDevices(
    updates: BulkUpdateItem[],
  ): Promise<APIResponse<Device[]>> {
    return apiClient.put<APIResponse<Device[]>>(`${this.basePath}/bulk`, {
      updates,
    });
  }

  /**
   * Экспорт устройств
   */
  async exportDevices(
    format: string = "json",
    includeProblems: boolean = false,
  ): Promise<APIResponse<Device[]>> {
    return apiClient.get<APIResponse<Device[]>>(`${this.basePath}/export`, {
      params: { format, include_problems: includeProblems },
    });
  }
}

// Export singleton instance
export const devicesApi = new DevicesApi();
export default devicesApi;
