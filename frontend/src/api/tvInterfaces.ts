import {
  TVInterface,
  CreateTVInterfaceData,
  UpdateTVInterfaceData,
  TVInterfaceFilters,
  TVInterfaceApiResponse,
  TVInterfaceListResponse,
} from "@/types/tvInterface";
import { apiClient, handleApiError } from "./client";
import { getCache, setCache, invalidateCache, buildKey } from "./cache";

// API endpoint base
const API_ENDPOINT = "/tv-interfaces";

// TV Interface API service
export const tvInterfacesAPI = {
  // Получить все TV интерфейсы
  async getAll(filters?: TVInterfaceFilters): Promise<TVInterfaceListResponse> {
    try {
      const key = buildKey("tv-interfaces:getAll", filters || {});
      const cached = getCache<TVInterface[]>(key);
      if (cached) return { success: true, data: cached };

      const response = await apiClient.get<TVInterfaceListResponse>(
        API_ENDPOINT,
        { params: filters },
      );

      const data = response.data || [];
      setCache(key, data);
      return { success: true, data };
    } catch (error) {
      return { success: false, error: handleApiError(error) };
    }
  },

  // Получить TV интерфейс по ID
  async getById(id: string): Promise<TVInterfaceApiResponse> {
    try {
      if (!id) {
        return { success: false, error: "ID TV интерфейса обязателен" };
      }
      const key = `tv-interfaces:getById:${id}`;
      const cached = getCache<TVInterface>(key);
      if (cached) return { success: true, data: cached };

      const response = await apiClient.get<TVInterfaceApiResponse>(
        `${API_ENDPOINT}/${id}`,
      );

      setCache(key, response.data);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: handleApiError(error) };
    }
  },

  // Получить TV интерфейсы по deviceId
  async getByDeviceId(deviceId: string): Promise<TVInterfaceListResponse> {
    try {
      if (!deviceId) {
        return { success: false, error: "ID устройства обязателен" };
      }
      const key = `tv-interfaces:getByDeviceId:${deviceId}`;
      const cached = getCache<TVInterface[]>(key);
      if (cached) return { success: true, data: cached };

      const response = await apiClient.get<TVInterfaceListResponse>(
        `${API_ENDPOINT}/device/${deviceId}`,
      );

      const data = response.data || [];
      setCache(key, data);
      return { success: true, data };
    } catch (error) {
      return { success: false, error: handleApiError(error) };
    }
  },

  // Создать новый TV интерфейс
  async create(data: CreateTVInterfaceData): Promise<TVInterfaceApiResponse> {
    try {
      // Валидация на фронтенде
      if (!data.name?.trim()) {
        return {
          success: false,
          error: "Название интерфейса обязательно",
        };
      }

      if (!data.type) {
        return {
          success: false,
          error: "Тип интерфейса обязателен",
        };
      }

      if (!data.deviceId) {
        return {
          success: false,
          error: "Выберите устройство",
        };
      }

      // Подготавливае�� данные для отправки на бэкенд
      const requestData = {
        name: data.name.trim(),
        description: data.description?.trim() || "",
        type: data.type,
        device_id: data.deviceId,
        screenshot_data: data.screenshotData,
        clickable_areas: data.clickableAreas || [],
        highlight_areas: data.highlightAreas || [],
      };

      const response = await apiClient.post<TVInterfaceApiResponse>(
        API_ENDPOINT,
        requestData,
      );

      // invalidate caches
      invalidateCache("tv-interfaces:");

      return {
        success: true,
        data: response.data,
        message: response.message || "TV интерфейс успешно создан",
      };
    } catch (error) {
      return {
        success: false,
        error: handleApiError(error),
      };
    }
  },

  // Обновить TV интерфейс
  async update(
    id: string,
    data: UpdateTVInterfaceData,
  ): Promise<TVInterfaceApiResponse> {
    try {
      if (!id) {
        return {
          success: false,
          error: "ID TV интерфейса обязателен",
        };
      }

      // Подготавливаем данные для отправки на бэкенд
      const requestData: Record<string, any> = {};

      if (data.name !== undefined) requestData.name = data.name.trim();
      if (data.description !== undefined)
        requestData.description = data.description?.trim() || "";
      if (data.type !== undefined) requestData.type = data.type;
      if (data.deviceId !== undefined) requestData.device_id = data.deviceId;
      if (data.screenshotData !== undefined)
        requestData.screenshot_data = data.screenshotData;
      if (data.clickableAreas !== undefined)
        requestData.clickable_areas = data.clickableAreas;
      if (data.highlightAreas !== undefined)
        requestData.highlight_areas = data.highlightAreas;
      if (data.isActive !== undefined) requestData.is_active = data.isActive;

      const response = await apiClient.put<TVInterfaceApiResponse>(
        `${API_ENDPOINT}/${id}`,
        requestData,
      );

      // update and invalidate caches
      setCache(`tv-interfaces:getById:${id}`, response.data);
      invalidateCache("tv-interfaces:getAll");
      invalidateCache("tv-interfaces:getByDeviceId");

      return {
        success: true,
        data: response.data,
        message: response.message || "TV интерфейс успешно обновлен",
      };
    } catch (error) {
      return {
        success: false,
        error: handleApiError(error),
      };
    }
  },

  // Удалить TV интерфейс
  async delete(id: string): Promise<TVInterfaceApiResponse> {
    try {
      if (!id) {
        return {
          success: false,
          error: "ID TV интерфейса обязателен",
        };
      }

      const response = await apiClient.delete<TVInterfaceApiResponse>(
        `${API_ENDPOINT}/${id}`,
      );

      // invalidate
      invalidateCache("tv-interfaces:");

      return {
        success: true,
        message: response.message || "TV интерфейс успешно удален",
      };
    } catch (error) {
      return {
        success: false,
        error: handleApiError(error),
      };
    }
  },

  // Активировать/деактивировать TV интерфейс
  async toggleStatus(id: string): Promise<TVInterfaceApiResponse> {
    try {
      if (!id) {
        return {
          success: false,
          error: "ID TV интерфейса обязателен",
        };
      }

      const response = await apiClient.patch<TVInterfaceApiResponse>(
        `${API_ENDPOINT}/${id}/toggle`,
      );

      // invalidate related caches
      setCache(`tv-interfaces:getById:${id}`, response.data);
      invalidateCache("tv-interfaces:getAll");
      invalidateCache("tv-interfaces:getByDeviceId");

      return {
        success: true,
        data: response.data,
        message: response.message || "Статус TV интерфейса изменен",
      };
    } catch (error) {
      return {
        success: false,
        error: handleApiError(error),
      };
    }
  },

  // Дублировать TV интерфейс
  async duplicate(
    id: string,
    newName?: string,
  ): Promise<TVInterfaceApiResponse> {
    try {
      if (!id) {
        return {
          success: false,
          error: "ID TV интерфейса обязателен",
        };
      }

      const requestData = newName ? { name: newName } : {};

      const response = await apiClient.post<TVInterfaceApiResponse>(
        `${API_ENDPOINT}/${id}/duplicate`,
        requestData,
      );

      invalidateCache("tv-interfaces:");

      return {
        success: true,
        data: response.data,
        message: response.message || "TV интерфейс успешно дублирован",
      };
    } catch (error) {
      return {
        success: false,
        error: handleApiError(error),
      };
    }
  },

  // Получить статистику TV интерфейсов
  async getStats(): Promise<TVInterfaceApiResponse> {
    try {
      const key = `tv-interfaces:getStats`;
      const cached = getCache<any>(key);
      if (cached) return { success: true, data: cached };

      const response = await apiClient.get<TVInterfaceApiResponse>(
        `${API_ENDPOINT}/stats`,
      );

      setCache(key, response.data);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: handleApiError(error),
      };
    }
  },

  // Экспортировать TV интерфейс
  async export(id: string): Promise<TVInterfaceApiResponse> {
    try {
      if (!id) {
        return {
          success: false,
          error: "ID TV интерфейса обязателен",
        };
      }

      const response = await apiClient.get<TVInterfaceApiResponse>(
        `${API_ENDPOINT}/${id}/export`,
      );

      return {
        success: true,
        data: response.data,
        message: response.message || "TV интерфейс успешно экспортирован",
      };
    } catch (error) {
      return {
        success: false,
        error: handleApiError(error),
      };
    }
  },
};

export default tvInterfacesAPI;
