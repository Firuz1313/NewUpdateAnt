import { apiClient } from "./client";
import {
  DiagnosticSession,
  APIResponse,
  PaginatedResponse,
  FilterOptions,
} from "../types";

export interface SessionFilters extends FilterOptions {
  deviceId?: string;
  problemId?: string;
  sessionId?: string;
  success?: boolean;
  isActive?: boolean;
  dateFrom?: string;
  dateTo?: string;
  includeProgress?: boolean;
}

export interface SessionCreateData {
  id?: string;
  deviceId: string;
  problemId: string;
  userId?: string;
  sessionId: string;
  userAgent?: string;
  ipAddress?: string;
  metadata?: Record<string, any>;
}

export interface SessionUpdateData {
  completedSteps?: number;
  success?: boolean;
  duration?: number;
  errorSteps?: string[];
  feedback?: any;
  endTime?: string;
  metadata?: Record<string, any>;
  forceUpdate?: boolean;
}

export interface SessionProgressUpdate {
  stepId: string;
  stepNumber?: number;
  completed?: boolean;
  result?: "success" | "failure" | "skipped";
  timeSpent?: number;
  userInput?: string;
  errors?: any[];
  metadata?: Record<string, any>;
}

export interface SessionCompletionData {
  success?: boolean;
  feedback?: any;
  errorSteps?: string[];
  metadata?: Record<string, any>;
}

export interface SessionWithProgress extends DiagnosticSession {
  deviceName?: string;
  deviceBrand?: string;
  deviceModel?: string;
  problemTitle?: string;
  problemCategory?: string;
  problemEstimatedTime?: number;
  currentDuration?: number;
  stepsProgress?: SessionStepProgress[];
  completionPercentage?: number;
  elapsedSeconds?: number;
}

export interface SessionStepProgress {
  id: string;
  stepId: string;
  stepNumber: number;
  stepTitle?: string;
  stepDescription?: string;
  stepEstimatedTime?: number;
  completed: boolean;
  result?: "success" | "failure" | "skipped";
  timeSpent?: number;
  userInput?: string;
  errors?: any[];
  startedAt?: string;
  completedAt?: string;
  metadata?: Record<string, any>;
}

export interface SessionStats {
  totalSessions: number;
  successfulSessions: number;
  failedSessions: number;
  activeSessions: number;
  successRate: number;
  avgDuration: number | null;
  minDuration: number | null;
  maxDuration: number | null;
  avgCompletionRate: number;
}

export interface PopularProblem {
  id: string;
  title: string;
  category: string;
  deviceName: string;
  sessionCount: number;
  successfulCount: number;
  successRate: number;
  avgDuration: number | null;
  avgCompletionRate: number;
}

export interface TimeAnalytics {
  period: string;
  periodStart: string;
  totalSessions: number;
  successfulSessions: number;
  successRate: number;
  avgDuration: number | null;
  avgCompletionRate: number;
}

export interface CleanupResult {
  deletedSessions: number;
  archivedSessions: number;
}

export class SessionsApi {
  private readonly basePath = "/sessions";

  /**
   * Получение списка сессий
   */
  async getSessions(
    page: number = 1,
    limit: number = 20,
    filters: SessionFilters = {},
  ): Promise<PaginatedResponse<SessionWithProgress>> {
    return apiClient.get<PaginatedResponse<SessionWithProgress>>(
      this.basePath,
      {
        params: {
          page,
          limit,
          ...filters,
        },
      },
    );
  }

  /**
   * Получение сессии по ID
   */
  async getSession(
    id: string,
    includeProgress: boolean = false,
  ): Promise<APIResponse<SessionWithProgress>> {
    return apiClient.get<APIResponse<SessionWithProgress>>(
      `${this.basePath}/${id}`,
      {
        params: { include_progress: includeProgress },
      },
    );
  }

  /**
   * Создание новой сессии
   */
  async createSession(
    data: SessionCreateData,
  ): Promise<APIResponse<DiagnosticSession>> {
    return apiClient.post<APIResponse<DiagnosticSession>>(this.basePath, data);
  }

  /**
   * Обновление сессии
   */
  async updateSession(
    id: string,
    data: SessionUpdateData,
  ): Promise<APIResponse<DiagnosticSession>> {
    return apiClient.put<APIResponse<DiagnosticSession>>(
      `${this.basePath}/${id}`,
      data,
    );
  }

  /**
   * Завершение сессии
   */
  async completeSession(
    id: string,
    data: SessionCompletionData,
  ): Promise<APIResponse<DiagnosticSession>> {
    return apiClient.post<APIResponse<DiagnosticSession>>(
      `${this.basePath}/${id}/complete`,
      data,
    );
  }

  /**
   * Обновление прогресса сессии
   */
  async updateProgress(
    id: string,
    progressData: SessionProgressUpdate,
  ): Promise<APIResponse<DiagnosticSession>> {
    return apiClient.post<APIResponse<DiagnosticSession>>(
      `${this.basePath}/${id}/progress`,
      progressData,
    );
  }

  /**
   * Получение активных сессий
   */
  async getActiveSessions(
    limit: number = 50,
    offset: number = 0,
  ): Promise<APIResponse<SessionWithProgress[]>> {
    return apiClient.get<APIResponse<SessionWithProgress[]>>(
      `${this.basePath}/active`,
      {
        params: { limit, offset },
      },
    );
  }

  /**
   * Получение статистики сессий
   */
  async getSessionStats(
    filters: {
      deviceId?: string;
      problemId?: string;
      dateFrom?: string;
      dateTo?: string;
    } = {},
  ): Promise<APIResponse<SessionStats>> {
    return apiClient.get<APIResponse<SessionStats>>(`${this.basePath}/stats`, {
      params: filters,
    });
  }

  /**
   * Получение популярных проблем
   */
  async getPopularProblems(
    limit: number = 10,
    timeframe: string = "30 days",
  ): Promise<APIResponse<PopularProblem[]>> {
    return apiClient.get<APIResponse<PopularProblem[]>>(
      `${this.basePath}/popular-problems`,
      {
        params: { limit, timeframe },
      },
    );
  }

  /**
   * Получение аналитики по времени
   */
  async getTimeAnalytics(
    period: "hour" | "day" | "week" | "month" = "day",
    limit: number = 30,
  ): Promise<APIResponse<TimeAnalytics[]>> {
    return apiClient.get<APIResponse<TimeAnalytics[]>>(
      `${this.basePath}/analytics`,
      {
        params: { period, limit },
      },
    );
  }

  /**
   * Удаление сессии
   */
  async deleteSession(
    id: string,
    force: boolean = false,
  ): Promise<APIResponse<DiagnosticSession>> {
    return apiClient.delete<APIResponse<DiagnosticSession>>(
      `${this.basePath}/${id}`,
      {
        params: { force },
      },
    );
  }

  /**
   * Восстановление архивированной сессии
   */
  async restoreSession(id: string): Promise<APIResponse<DiagnosticSession>> {
    return apiClient.post<APIResponse<DiagnosticSession>>(
      `${this.basePath}/${id}/restore`,
    );
  }

  /**
   * Очистка старых сессий
   */
  async cleanupOldSessions(
    daysToKeep: number = 90,
  ): Promise<APIResponse<CleanupResult>> {
    return apiClient.post<APIResponse<CleanupResult>>(
      `${this.basePath}/cleanup`,
      {
        days_to_keep: daysToKeep,
      },
    );
  }

  /**
   * Экспорт сессий
   */
  async exportSessions(
    format: string = "json",
    filters: {
      deviceId?: string;
      problemId?: string;
      dateFrom?: string;
      dateTo?: string;
      includeProgress?: boolean;
    } = {},
  ): Promise<APIResponse<SessionWithProgress[]>> {
    return apiClient.get<APIResponse<SessionWithProgress[]>>(
      `${this.basePath}/export`,
      {
        params: { format, ...filters },
      },
    );
  }
}

// Export singleton instance
export const sessionsApi = new SessionsApi();
export default sessionsApi;
