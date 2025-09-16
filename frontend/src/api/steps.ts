import { apiClient } from "./client";
import { Step, APIResponse, PaginatedResponse, FilterOptions } from "../types";

export interface StepFilters extends FilterOptions {
  problemId?: string;
  deviceId?: string;
  includeDetails?: boolean;
}

export interface StepCreateData {
  id?: string;
  problemId: string;
  deviceId: string;
  stepNumber?: number;
  title: string;
  description?: string;
  instruction: string;
  estimatedTime?: number;
  highlightRemoteButton?: string;
  highlightTVArea?: string;
  tvInterfaceId?: string;
  remoteId?: string;
  actionType?: string;
  buttonPosition?: { x: number; y: number };
  svgPath?: string;
  zoneId?: string;
  requiredAction?: string;
  validationRules?: any[];
  successCondition?: string;
  failureActions?: any[];
  hint?: string;
  warningText?: string;
  successText?: string;
  media?: any[];
  nextStepConditions?: any[];
  metadata?: Record<string, any>;
}

export interface StepUpdateData extends Partial<StepCreateData> {
  isActive?: boolean;
}

export interface StepWithDetails extends Step {
  remoteName?: string;
  remoteManufacturer?: string;
  remoteModel?: string;
  tvInterfaceName?: string;
  tvInterfaceType?: string;
  problemTitle?: string;
  problemDeviceId?: string;
  deviceName?: string;
  deviceBrand?: string;
  remoteImageData?: string;
  remoteDimensions?: { width: number; height: number };
  tvScreenshotData?: string;
}

export interface StepUsageStats {
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  skippedExecutions: number;
  avgTimeSpent: number | null;
  minTimeSpent: number | null;
  maxTimeSpent: number | null;
  successRate: number;
}

export interface StepOrderValidation {
  isValid: boolean;
  duplicates: Array<{ step_number: number; count: number }>;
}

export interface StepReorderRequest {
  problemId: string;
  stepIds: string[];
}

export interface StepInsertRequest {
  problemId: string;
  afterStepNumber: number;
  [key: string]: any;
}

// Transform camelCase to snake_case for backend
const transformToBackend = (data: any) => {
  const transformed: any = {};

  // Direct field mappings
  const fieldMappings: Record<string, string> = {
    problemId: "problem_id",
    deviceId: "device_id",
    stepNumber: "step_number",
    estimatedTime: "estimated_time",
    highlightRemoteButton: "highlight_remote_button",
    highlightTVArea: "highlight_tv_area",
    tvInterfaceId: "tv_interface_id",
    remoteId: "remote_id",
    actionType: "action_type",
    buttonPosition: "button_position",
    svgPath: "svg_path",
    zoneId: "zone_id",
    requiredAction: "required_action",
    validationRules: "validation_rules",
    successCondition: "success_condition",
    failureActions: "failure_actions",
    warningText: "warning_text",
    successText: "success_text",
    nextStepConditions: "next_step_conditions",
    isActive: "is_active",
  };

  Object.keys(data).forEach((key) => {
    const backendKey = fieldMappings[key] || key;
    transformed[backendKey] = data[key];
  });

  return transformed;
};

// Helper function to normalize button coordinates (convert old pixel coordinates to 0-1 range)
const normalizeButtonPosition = (
  position: { x: number; y: number } | null,
): { x: number; y: number } | null => {
  if (!position || typeof position !== "object") return null;

  // If coordinates are already normalized (0-1), return as is
  if (position.x <= 1 && position.y <= 1) {
    return position;
  }

  // Convert old pixel coordinates to normalized (0-1) format
  // Standard canvas size for remotes: 400x600
  const canvasWidth = 400;
  const canvasHeight = 600;

  const normalizedX = Math.min(position.x / canvasWidth, 1);
  const normalizedY = Math.min(position.y / canvasHeight, 1);

  console.log("🔄 API: Converting old pixel coordinates to normalized:", {
    original: position,
    normalized: { x: normalizedX, y: normalizedY },
    canvasSize: { width: canvasWidth, height: canvasHeight },
  });

  return { x: normalizedX, y: normalizedY };
};

// Transform snake_case to camelCase for frontend
const transformFromBackend = (data: any): any => {
  if (!data) return data;

  const fieldMappings: Record<string, string> = {
    problem_id: "problemId",
    device_id: "deviceId",
    step_number: "stepNumber",
    estimated_time: "estimatedTime",
    highlight_remote_button: "highlightRemoteButton",
    highlight_tv_area: "highlightTVArea",
    tv_interface_id: "tvInterfaceId",
    remote_id: "remoteId",
    action_type: "actionType",
    button_position: "buttonPosition",
    svg_path: "svgPath",
    zone_id: "zoneId",
    required_action: "requiredAction",
    validation_rules: "validationRules",
    success_condition: "successCondition",
    failure_actions: "failureActions",
    warning_text: "warningText",
    success_text: "successText",
    next_step_conditions: "nextStepConditions",
    is_active: "isActive",
    created_at: "createdAt",
    updated_at: "updatedAt",
  };

  const transformed: any = {};
  Object.keys(data).forEach((key) => {
    const frontendKey = fieldMappings[key] || key;
    let value = data[key];

    // Special handling for button_position - normalize old pixel coordinates
    if (key === "button_position" && value) {
      value = normalizeButtonPosition(value);
    }

    transformed[frontendKey] = value;
  });

  return transformed;
};

export class StepsApi {
  private readonly basePath = "/steps";

  /**
   * Получение списка шагов
   */
  async getSteps(
    page: number = 1,
    limit: number = 20,
    filters: StepFilters = {},
  ): Promise<PaginatedResponse<StepWithDetails>> {
    const { getCache, setCache, buildKey } = await import("./cache");
    const key = buildKey("steps:get", { page, limit, filters });
    const cached = getCache<PaginatedResponse<StepWithDetails>>(key);
    if (cached) return cached;

    const response = await apiClient.get<PaginatedResponse<StepWithDetails>>(
      this.basePath,
      {
        params: {
          page,
          limit,
          problem_id: filters.problemId,
          device_id: filters.deviceId,
          include_details: filters.includeDetails,
          ...filters,
        },
      },
    );

    if (response.data && Array.isArray(response.data)) {
      response.data = response.data.map(transformFromBackend);
    }

    setCache(key, response);
    return response;
  }

  /**
   * Получение всех шагов (для совместимости)
   */
  async getAll(): Promise<StepWithDetails[]> {
    try {
      const response = await this.getSteps(1, 1000);
      return response.data || [];
    } catch (error) {
      console.error("Error getting all steps:", error);
      return [];
    }
  }

  /**
   * Получение шага по ID
   */
  async getStep(
    id: string,
    includeDetails: boolean = false,
    includeStats: boolean = false,
  ): Promise<APIResponse<StepWithDetails & { usageStats?: StepUsageStats }>> {
    const response = await apiClient.get<
      APIResponse<StepWithDetails & { usageStats?: StepUsageStats }>
    >(`${this.basePath}/${id}`, {
      params: { include_details: includeDetails, include_stats: includeStats },
    });

    // Transform data from backend
    if (response.data) {
      response.data = transformFromBackend(response.data);
    }

    return response;
  }

  /**
   * Создание нового шага
   */
  async createStep(data: StepCreateData): Promise<APIResponse<Step>> {
    console.log("Creating step with data:", data);

    // Transform data for backend
    const backendData = transformToBackend(data);
    console.log("Transformed data for backend:", backendData);

    const response = await apiClient.post<APIResponse<Step>>(
      this.basePath,
      backendData,
    );

    if (response.data) {
      response.data = transformFromBackend(response.data);
    }

    const { invalidateCache } = await import("./cache");
    invalidateCache("steps:");
    return response;
  }

  /**
   * Обновление шага
   */
  async updateStep(
    id: string,
    data: StepUpdateData,
  ): Promise<APIResponse<Step>> {
    console.log("Updating step with data:", data);

    // Transform data for backend
    const backendData = transformToBackend(data);
    console.log("Transformed data for backend:", backendData);

    const response = await apiClient.put<APIResponse<Step>>(
      `${this.basePath}/${id}`,
      backendData,
    );

    if (response.data) {
      response.data = transformFromBackend(response.data);
    }

    const { invalidateCache } = await import("./cache");
    invalidateCache("steps:");
    return response;
  }

  /**
   * Удалени�� шага
   */
  async deleteStep(
    id: string,
    force: boolean = false,
    reorder: boolean = true,
  ): Promise<APIResponse<Step>> {
    const response = await apiClient.delete<APIResponse<Step>>(
      `${this.basePath}/${id}`,
      { params: { force, reorder } },
    );

    if (response.data) {
      response.data = transformFromBackend(response.data);
    }

    const { invalidateCache } = await import("./cache");
    invalidateCache("steps:");
    return response;
  }

  /**
   * Восстановление архивированно��о шага
   */
  async restoreStep(id: string): Promise<APIResponse<Step>> {
    const response = await apiClient.post<APIResponse<Step>>(
      `${this.basePath}/${id}/restore`,
    );

    // Transform response from backend
    if (response.data) {
      response.data = transformFromBackend(response.data);
    }

    return response;
  }

  /**
   * Получение шагов по проблеме
   */
  async getStepsByProblem(
    problemId: string,
    isActive: boolean = true,
  ): Promise<APIResponse<StepWithDetails[]>> {
    const { getCache, setCache, buildKey } = await import("./cache");
    const key = buildKey("steps:byProblem", { problemId, isActive });
    const cached = getCache<APIResponse<StepWithDetails[]>>(key);
    if (cached) return cached;

    const response = await apiClient.get<APIResponse<StepWithDetails[]>>(
      `${this.basePath}/problem/${problemId}`,
      { params: { is_active: isActive } },
    );

    if (response.data && Array.isArray(response.data)) {
      response.data = response.data.map(transformFromBackend);
    }

    setCache(key, response);
    return response;
  }

  /**
   * Поиск шагов
   */
  async searchSteps(
    query: string,
    limit: number = 20,
    offset: number = 0,
  ): Promise<APIResponse<StepWithDetails[]>> {
    const response = await apiClient.get<APIResponse<StepWithDetails[]>>(
      `${this.basePath}/search`,
      {
        params: { q: query, limit, offset },
      },
    );

    // Transform data from backend
    if (response.data && Array.isArray(response.data)) {
      response.data = response.data.map(transformFromBackend);
    }

    return response;
  }

  /**
   * Переупорядочивание шагов
   */
  async reorderSteps(
    problemId: string,
    stepIds: string[],
  ): Promise<APIResponse<Step[]>> {
    const response = await apiClient.put<APIResponse<Step[]>>(
      `${this.basePath}/reorder`,
      { problem_id: problemId, step_ids: stepIds },
    );

    if (response.data && Array.isArray(response.data)) {
      response.data = response.data.map(transformFromBackend);
    }

    const { invalidateCache } = await import("./cache");
    invalidateCache("steps:");
    return response;
  }

  /**
   * Вставка шага между существующими шагами
   */
  async insertStep(
    problemId: string,
    afterStepNumber: number,
    stepData: Omit<StepCreateData, "problemId">,
  ): Promise<APIResponse<Step>> {
    const backendData = transformToBackend(stepData);

    const response = await apiClient.post<APIResponse<Step>>(
      `${this.basePath}/insert`,
      {
        problem_id: problemId,
        after_step_number: afterStepNumber,
        ...backendData,
      },
    );

    if (response.data) {
      response.data = transformFromBackend(response.data);
    }

    const { invalidateCache } = await import("./cache");
    invalidateCache("steps:");
    return response;
  }

  /**
   * Дублирование шага
   */
  async duplicateStep(
    id: string,
    targetProblemId?: string,
  ): Promise<APIResponse<Step>> {
    const response = await apiClient.post<APIResponse<Step>>(
      `${this.basePath}/${id}/duplicate`,
      { target_problem_id: targetProblemId },
    );

    if (response.data) {
      response.data = transformFromBackend(response.data);
    }

    const { invalidateCache } = await import("./cache");
    invalidateCache("steps:");
    return response;
  }

  /**
   * Получение следующего шага
   */
  async getNextStep(id: string): Promise<APIResponse<Step>> {
    const response = await apiClient.get<APIResponse<Step>>(
      `${this.basePath}/${id}/next`,
    );

    // Transform response from backend
    if (response.data) {
      response.data = transformFromBackend(response.data);
    }

    return response;
  }

  /**
   * Получение ��редыдущего шага
   */
  async getPreviousStep(id: string): Promise<APIResponse<Step>> {
    const response = await apiClient.get<APIResponse<Step>>(
      `${this.basePath}/${id}/previous`,
    );

    // Transform response from backend
    if (response.data) {
      response.data = transformFromBackend(response.data);
    }

    return response;
  }

  /**
   * Получение статистики использования шага
   */
  async getStepStats(id: string): Promise<APIResponse<StepUsageStats>> {
    return apiClient.get<APIResponse<StepUsageStats>>(
      `${this.basePath}/${id}/stats`,
    );
  }

  /**
   * Валидация порядка шагов в проблеме
   */
  async validateStepOrder(
    problemId: string,
  ): Promise<APIResponse<StepOrderValidation>> {
    return apiClient.get<APIResponse<StepOrderValidation>>(
      `${this.basePath}/validate/${problemId}`,
    );
  }

  /**
   * Автоматическое испр��вление нумерации шагов
   */
  async fixStepNumbering(problemId: string): Promise<APIResponse<Step[]>> {
    const response = await apiClient.post<APIResponse<Step[]>>(
      `${this.basePath}/fix-numbering/${problemId}`,
    );

    if (response.data && Array.isArray(response.data)) {
      response.data = response.data.map(transformFromBackend);
    }

    const { invalidateCache } = await import("./cache");
    invalidateCache("steps:");
    return response;
  }
}

// Export singleton instance
export const stepsApi = new StepsApi();
export default stepsApi;
