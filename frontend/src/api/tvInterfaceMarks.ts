// TV Interface Marks API Client
import { apiClient, handleApiError } from "./client";

// API endpoint base
const API_ENDPOINT = "/tv-interface-marks";

// Types
export interface TVInterfaceMark {
  id: string;
  tv_interface_id: string;
  step_id?: string;
  name: string;
  description: string;
  mark_type: "point" | "zone" | "area";
  shape: "circle" | "rectangle" | "polygon" | "ellipse";
  position: { x: number; y: number };
  size?: { width: number; height: number };
  coordinates?: { x: number; y: number }[];
  color: string;
  background_color?: string;
  border_color?: string;
  border_width: number;
  opacity: number;
  is_clickable: boolean;
  is_highlightable: boolean;
  click_action?: string;
  hover_action?: string;
  action_value?: string;
  action_description?: string;
  expected_result?: string;
  hint_text?: string;
  tooltip_text?: string;
  warning_text?: string;
  animation?: "pulse" | "glow" | "bounce" | "shake" | "fade" | "blink" | "none";
  animation_duration?: number;
  animation_delay?: number;
  display_order: number;
  priority: "low" | "normal" | "high" | "critical";
  is_active: boolean;
  is_visible: boolean;
  metadata?: Record<string, any>;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export interface CreateTVInterfaceMarkData {
  tv_interface_id: string;
  step_id?: string;
  name: string;
  description?: string;
  mark_type: "point" | "zone" | "area";
  shape: "circle" | "rectangle" | "polygon" | "ellipse";
  position: { x: number; y: number };
  size?: { width: number; height: number };
  coordinates?: { x: number; y: number }[];
  color?: string;
  background_color?: string;
  border_color?: string;
  border_width?: number;
  opacity?: number;
  is_clickable?: boolean;
  is_highlightable?: boolean;
  click_action?: string;
  hover_action?: string;
  action_value?: string;
  action_description?: string;
  expected_result?: string;
  hint_text?: string;
  tooltip_text?: string;
  warning_text?: string;
  animation?: "pulse" | "glow" | "bounce" | "shake" | "fade" | "blink" | "none";
  animation_duration?: number;
  animation_delay?: number;
  display_order?: number;
  priority?: "low" | "normal" | "high" | "critical";
  is_active?: boolean;
  is_visible?: boolean;
  metadata?: Record<string, any>;
  tags?: string[];
}

export interface UpdateTVInterfaceMarkData {
  name?: string;
  description?: string;
  mark_type?: "point" | "zone" | "area";
  shape?: "circle" | "rectangle" | "polygon" | "ellipse";
  position?: { x: number; y: number };
  size?: { width: number; height: number };
  coordinates?: { x: number; y: number }[];
  color?: string;
  background_color?: string;
  border_color?: string;
  border_width?: number;
  opacity?: number;
  is_clickable?: boolean;
  is_highlightable?: boolean;
  click_action?: string;
  hover_action?: string;
  action_value?: string;
  action_description?: string;
  expected_result?: string;
  hint_text?: string;
  tooltip_text?: string;
  warning_text?: string;
  animation?: "pulse" | "glow" | "bounce" | "shake" | "fade" | "blink" | "none";
  animation_duration?: number;
  animation_delay?: number;
  display_order?: number;
  priority?: "low" | "normal" | "high" | "critical";
  is_active?: boolean;
  is_visible?: boolean;
  metadata?: Record<string, any>;
  tags?: string[];
}

export interface TVInterfaceMarkFilters {
  tv_interface_id?: string;
  step_id?: string;
  mark_type?: string;
  shape?: string;
  is_clickable?: boolean;
  is_highlightable?: boolean;
  is_active?: boolean;
  is_visible?: boolean;
  priority?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface TVInterfaceMarkApiResponse {
  success: boolean;
  data?: TVInterfaceMark;
  error?: string;
  message?: string;
  timestamp?: string;
}

export interface TVInterfaceMarkListResponse {
  success: boolean;
  data?: TVInterfaceMark[];
  error?: string;
  message?: string;
  timestamp?: string;
}

export interface TVInterfaceMarkStatsResponse {
  success: boolean;
  data?: {
    total: number;
    active: number;
    visible: number;
    points: number;
    zones: number;
    areas: number;
    interfaces_with_marks: number;
    steps_with_marks: number;
  };
  error?: string;
  message?: string;
  timestamp?: string;
}

// TV Interface Marks API service
export const tvInterfaceMarksAPI = {
  // Get marks by TV interface ID
  async getByTVInterfaceId(
    tvInterfaceId: string,
    filters?: TVInterfaceMarkFilters,
  ): Promise<TVInterfaceMarkListResponse> {
    try {
      const response = await apiClient.get<TVInterfaceMarkListResponse>(
        `${API_ENDPOINT}/tv-interface/${tvInterfaceId}`,
        { params: filters },
      );

      return {
        success: true,
        data: response.data || [],
      };
    } catch (error) {
      return {
        success: false,
        error: handleApiError(error),
      };
    }
  },

  // Get marks by step ID
  async getByStepId(stepId: string): Promise<TVInterfaceMarkListResponse> {
    try {
      const response = await apiClient.get<TVInterfaceMarkListResponse>(
        `${API_ENDPOINT}/step/${stepId}`,
      );

      return {
        success: true,
        data: response.data || [],
      };
    } catch (error) {
      return {
        success: false,
        error: handleApiError(error),
      };
    }
  },

  // Get mark by ID
  async getById(id: string): Promise<TVInterfaceMarkApiResponse> {
    try {
      if (!id) {
        return {
          success: false,
          error: "ID отметки обязателен",
        };
      }

      const response = await apiClient.get<TVInterfaceMarkApiResponse>(
        `${API_ENDPOINT}/${id}`,
      );

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: handleApiError(error),
      };
    }
  },

  // Create new mark
  async create(
    data: CreateTVInterfaceMarkData,
  ): Promise<TVInterfaceMarkApiResponse> {
    try {
      if (!data.tv_interface_id) {
        return {
          success: false,
          error: "TV интерфейс обязателен",
        };
      }

      if (!data.name?.trim()) {
        return {
          success: false,
          error: "Название отметки обязательно",
        };
      }

      if (!data.position) {
        return {
          success: false,
          error: "Позиция отметки обязательна",
        };
      }

      const response = await apiClient.post<TVInterfaceMarkApiResponse>(
        API_ENDPOINT,
        data,
      );

      return {
        success: true,
        data: response.data,
        message: response.message || "Отметка успешно создана",
      };
    } catch (error) {
      return {
        success: false,
        error: handleApiError(error),
      };
    }
  },

  // Update mark
  async update(
    id: string,
    data: UpdateTVInterfaceMarkData,
  ): Promise<TVInterfaceMarkApiResponse> {
    try {
      if (!id) {
        return {
          success: false,
          error: "ID отметки обязателен",
        };
      }

      const response = await apiClient.put<TVInterfaceMarkApiResponse>(
        `${API_ENDPOINT}/${id}`,
        data,
      );

      return {
        success: true,
        data: response.data,
        message: response.message || "Отметка успешно обновлена",
      };
    } catch (error) {
      return {
        success: false,
        error: handleApiError(error),
      };
    }
  },

  // Delete mark
  async delete(id: string): Promise<TVInterfaceMarkApiResponse> {
    try {
      if (!id) {
        return {
          success: false,
          error: "ID отметки обязателен",
        };
      }

      const response = await apiClient.delete<TVInterfaceMarkApiResponse>(
        `${API_ENDPOINT}/${id}`,
      );

      return {
        success: true,
        message: response.message || "Отметка успешно удалена",
      };
    } catch (error) {
      return {
        success: false,
        error: handleApiError(error),
      };
    }
  },

  // Delete all marks for TV interface
  async deleteByTVInterfaceId(
    tvInterfaceId: string,
  ): Promise<TVInterfaceMarkApiResponse> {
    try {
      if (!tvInterfaceId) {
        return {
          success: false,
          error: "ID TV интерфейса обязателен",
        };
      }

      const response = await apiClient.delete<TVInterfaceMarkApiResponse>(
        `${API_ENDPOINT}/tv-interface/${tvInterfaceId}`,
      );

      return {
        success: true,
        message: response.message || "Отметки TV интерфейса успешно удалены",
      };
    } catch (error) {
      return {
        success: false,
        error: handleApiError(error),
      };
    }
  },

  // Delete all marks for step
  async deleteByStepId(stepId: string): Promise<TVInterfaceMarkApiResponse> {
    try {
      if (!stepId) {
        return {
          success: false,
          error: "ID шага обязателен",
        };
      }

      const response = await apiClient.delete<TVInterfaceMarkApiResponse>(
        `${API_ENDPOINT}/step/${stepId}`,
      );

      return {
        success: true,
        message: response.message || "Отметки шага успешно удалены",
      };
    } catch (error) {
      return {
        success: false,
        error: handleApiError(error),
      };
    }
  },

  // Reorder marks for TV interface
  async reorderMarks(
    tvInterfaceId: string,
    markIds: string[],
  ): Promise<TVInterfaceMarkApiResponse> {
    try {
      if (!tvInterfaceId) {
        return {
          success: false,
          error: "ID TV интерфейса обязателен",
        };
      }

      if (!Array.isArray(markIds) || markIds.length === 0) {
        return {
          success: false,
          error: "Список ID отметок обязателен",
        };
      }

      const response = await apiClient.put<TVInterfaceMarkApiResponse>(
        `${API_ENDPOINT}/tv-interface/${tvInterfaceId}/reorder`,
        { markIds },
      );

      return {
        success: true,
        data: response.data,
        message: response.message || "Порядок отметок успешно изменен",
      };
    } catch (error) {
      return {
        success: false,
        error: handleApiError(error),
      };
    }
  },

  // Get marks statistics
  async getStats(): Promise<TVInterfaceMarkStatsResponse> {
    try {
      const response = await apiClient.get<TVInterfaceMarkStatsResponse>(
        `${API_ENDPOINT}/stats`,
      );

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: handleApiError(error),
      };
    }
  },
};

export default tvInterfaceMarksAPI;
