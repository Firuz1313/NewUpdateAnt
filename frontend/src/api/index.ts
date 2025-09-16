// Import and export client and error handling
import {
  apiClient,
  ApiClient,
  ApiError,
  handleApiError,
  createPaginatedRequest,
} from "./client";
export {
  apiClient,
  ApiClient,
  ApiError,
  handleApiError,
  createPaginatedRequest,
};

// Import API services
import { devicesApi } from "./devices";
import { problemsApi } from "./problems";
import { stepsApi } from "./steps";
import { sessionsApi } from "./sessions";
import { remotesApi } from "./remotes";
import { authApi } from "./auth";
import { usersApi } from "./users";
// Re-export API services
export {
  devicesApi,
  problemsApi,
  stepsApi,
  sessionsApi,
  remotesApi,
  authApi,
  usersApi,
};

// Export types for consumers
export type { ApiClientConfig, RequestOptions } from "./client";

export type {
  DeviceFilters,
  DeviceCreateData,
  DeviceUpdateData,
  DeviceStats,
  BulkUpdateItem,
} from "./devices";

export type {
  ProblemFilters,
  ProblemCreateData,
  ProblemUpdateData,
  ProblemStats,
  ProblemWithDetails,
} from "./problems";

export type {
  StepFilters,
  StepCreateData,
  StepUpdateData,
  StepWithDetails,
  StepUsageStats,
  StepOrderValidation,
  StepReorderRequest,
  StepInsertRequest,
} from "./steps";

export type {
  SessionFilters,
  SessionCreateData,
  SessionUpdateData,
  SessionProgressUpdate,
  SessionCompletionData,
  SessionWithProgress,
  SessionStepProgress,
  SessionStats,
  PopularProblem,
  TimeAnalytics,
  CleanupResult,
} from "./sessions";

// API Health check
export const checkApiHealth = async (): Promise<boolean> => {
  try {
    const response = await apiClient.get("/health");
    return response.status === "OK";
  } catch (error) {
    console.error("API health check failed:", error);
    return false;
  }
};

// API Info
export const getApiInfo = async () => {
  try {
    return await apiClient.get("/info");
  } catch (error) {
    console.error("Failed to get API info:", error);
    throw error;
  }
};

// API Documentation
export const getApiDocs = async () => {
  try {
    return await apiClient.get("/docs");
  } catch (error) {
    console.error("Failed to get API documentation:", error);
    throw error;
  }
};

// Combined API object for convenience
export const api = {
  devices: devicesApi,
  problems: problemsApi,
  steps: stepsApi,
  sessions: sessionsApi,
  remotes: remotesApi,
  health: checkApiHealth,
  info: getApiInfo,
  docs: getApiDocs,
};

export default api;
