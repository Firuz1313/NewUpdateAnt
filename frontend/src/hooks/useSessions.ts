import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  sessionsApi,
  SessionFilters,
  SessionCreateData,
  SessionUpdateData,
} from "../api";

// Query keys
export const sessionKeys = {
  all: ["sessions"] as const,
  lists: () => [...sessionKeys.all, "list"] as const,
  list: (filters: SessionFilters) => [...sessionKeys.lists(), filters] as const,
  details: () => [...sessionKeys.all, "detail"] as const,
  detail: (id: string, includeProgress?: boolean) =>
    [...sessionKeys.details(), id, includeProgress] as const,
  active: () => [...sessionKeys.all, "active"] as const,
  stats: () => [...sessionKeys.all, "stats"] as const,
  analytics: (period: string) =>
    [...sessionKeys.all, "analytics", period] as const,
};

// Query hooks
export const useSessions = (
  page: number = 1,
  limit: number = 20,
  filters: SessionFilters = {},
) => {
  return useQuery({
    queryKey: sessionKeys.list({ page, limit, ...filters }),
    queryFn: () => sessionsApi.getSessions(page, limit, filters),
    staleTime: 1 * 60 * 1000, // 1 minute (shorter for sessions)
    cacheTime: 3 * 60 * 1000, // 3 minutes
    refetchOnWindowFocus: false,
    keepPreviousData: true,
    retry: 3,
  });
};

export const useSession = (id: string, includeProgress: boolean = false) => {
  return useQuery({
    queryKey: sessionKeys.detail(id, includeProgress),
    queryFn: () => sessionsApi.getSession(id, includeProgress),
    enabled: !!id,
    staleTime: 30 * 1000, // 30 seconds for session details
  });
};

export const useActiveSessions = () => {
  return useQuery({
    queryKey: sessionKeys.active(),
    queryFn: () => sessionsApi.getActiveSessions(),
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // Auto-refresh every minute
  });
};

export const useSessionStats = () => {
  return useQuery({
    queryKey: sessionKeys.stats(),
    queryFn: () => sessionsApi.getSessionStats(),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useSessionAnalytics = (period: string = "week") => {
  return useQuery({
    queryKey: sessionKeys.analytics(period),
    queryFn: () => sessionsApi.getSessionAnalytics(period),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Mutation hooks
export const useCreateSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SessionCreateData) => sessionsApi.createSession(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: sessionKeys.active() });
      queryClient.invalidateQueries({ queryKey: sessionKeys.stats() });
    },
  });
};

export const useUpdateSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: SessionUpdateData }) =>
      sessionsApi.updateSession(id, data),
    onSuccess: (response, { id }) => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.lists() });
      queryClient.invalidateQueries({ queryKey: sessionKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: sessionKeys.active() });
      queryClient.invalidateQueries({ queryKey: sessionKeys.stats() });
    },
  });
};

export const useCompleteSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      sessionId,
      success,
      feedback,
    }: {
      sessionId: string;
      success: boolean;
      feedback?: any;
    }) => sessionsApi.completeSession(sessionId, success, feedback),
    onSuccess: (response, { sessionId }) => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: sessionKeys.detail(sessionId),
      });
      queryClient.invalidateQueries({ queryKey: sessionKeys.active() });
      queryClient.invalidateQueries({ queryKey: sessionKeys.stats() });
    },
  });
};

export const useDeleteSession = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => sessionsApi.deleteSession(id),
    onSuccess: (response, id) => {
      queryClient.invalidateQueries({ queryKey: sessionKeys.lists() });
      queryClient.removeQueries({ queryKey: sessionKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: sessionKeys.active() });
      queryClient.invalidateQueries({ queryKey: sessionKeys.stats() });
    },
  });
};

export default {
  useSessions,
  useSession,
  useActiveSessions,
  useSessionStats,
  useSessionAnalytics,
  useCreateSession,
  useUpdateSession,
  useCompleteSession,
  useDeleteSession,
};
