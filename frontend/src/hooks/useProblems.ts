import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  problemsApi,
  ProblemFilters,
  ProblemCreateData,
  ProblemUpdateData,
} from "../api";
import { Problem } from "../types";

// Query keys
export const problemKeys = {
  all: ["problems"] as const,
  lists: () => [...problemKeys.all, "list"] as const,
  list: (filters: ProblemFilters) => [...problemKeys.lists(), filters] as const,
  details: () => [...problemKeys.all, "detail"] as const,
  detail: (id: string, includeDetails?: boolean) =>
    [...problemKeys.details(), id, includeDetails] as const,
  search: (query: string) => [...problemKeys.all, "search", query] as const,
  popular: (limit?: number) => [...problemKeys.all, "popular", limit] as const,
  byDevice: (deviceId: string) =>
    [...problemKeys.all, "byDevice", deviceId] as const,
  byCategory: (category: string) =>
    [...problemKeys.all, "byCategory", category] as const,
  stats: () => [...problemKeys.all, "stats"] as const,
};

// 🔧 FIX: Hooks for querying problems with optimizations
export const useProblems = (
  page: number = 1,
  limit: number = 20,
  filters: ProblemFilters = {},
) => {
  return useQuery({
    queryKey: problemKeys.list({ page, limit, ...filters }),
    queryFn: () => problemsApi.getProblems(page, limit, filters),
    staleTime: 10 * 60 * 1000,
    cacheTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    keepPreviousData: true,
    retry: 3,
  });
};

export const useProblem = (id: string, includeDetails: boolean = false) => {
  return useQuery({
    queryKey: problemKeys.detail(id, includeDetails),
    queryFn: () => problemsApi.getProblem(id, includeDetails),
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useProblemSearch = (query: string, limit: number = 20) => {
  return useQuery({
    queryKey: problemKeys.search(`${query}-${limit}`),
    queryFn: () => problemsApi.searchProblems(query, limit),
    enabled: query.length >= 2,
    staleTime: 30 * 1000, // 30 seconds
  });
};

export const usePopularProblems = (limit: number = 10) => {
  return useQuery({
    queryKey: problemKeys.popular(limit),
    queryFn: () => problemsApi.getPopularProblems(limit),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useProblemsByDevice = (
  deviceId: string,
  status?: string,
  limit: number = 20,
) => {
  return useQuery({
    queryKey: problemKeys.byDevice(`${deviceId}-${status}-${limit}`),
    queryFn: () => problemsApi.getProblemsByDevice(deviceId, status, limit),
    enabled: !!deviceId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useProblemsByCategory = (
  category: string,
  deviceId?: string,
  limit: number = 20,
) => {
  return useQuery({
    queryKey: problemKeys.byCategory(`${category}-${deviceId}-${limit}`),
    queryFn: () => problemsApi.getProblemsByCategory(category, deviceId, limit),
    enabled: !!category,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useProblemStats = () => {
  return useQuery({
    queryKey: problemKeys.stats(),
    queryFn: () => problemsApi.getProblemStats(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Mutation hooks
export const useCreateProblem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ProblemCreateData) => problemsApi.createProblem(data),
    onSuccess: (response, data) => {
      queryClient.invalidateQueries({ queryKey: problemKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: problemKeys.byDevice(data.deviceId),
      });
      queryClient.invalidateQueries({ queryKey: problemKeys.stats() });
    },
  });
};

export const useUpdateProblem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ProblemUpdateData }) =>
      problemsApi.updateProblem(id, data),
    onSuccess: (response, { id, data }) => {
      queryClient.invalidateQueries({ queryKey: problemKeys.lists() });
      queryClient.invalidateQueries({ queryKey: problemKeys.detail(id) });
      if (data.deviceId) {
        queryClient.invalidateQueries({
          queryKey: problemKeys.byDevice(data.deviceId),
        });
      }
      queryClient.invalidateQueries({ queryKey: problemKeys.stats() });
    },
  });
};

export const useDeleteProblem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, force = false }: { id: string; force?: boolean }) => {
      console.log(`🗑️ Hook: Deleting problem ${id} with force=${force}`);
      return problemsApi.deleteProblem(id, force);
    },
    onSuccess: (response, { id }) => {
      console.log(`�� Hook: Delete success for ${id}:`, response);
      queryClient.invalidateQueries({ queryKey: problemKeys.lists() });
      queryClient.removeQueries({ queryKey: problemKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: problemKeys.stats() });
    },
    onError: (error, { id }) => {
      console.error(`❌ Hook: Delete error for ${id}:`, error);
    },
  });
};

export const useRestoreProblem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => problemsApi.restoreProblem(id),
    onSuccess: (response, id) => {
      queryClient.invalidateQueries({ queryKey: problemKeys.lists() });
      queryClient.invalidateQueries({ queryKey: problemKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: problemKeys.stats() });
    },
  });
};

export const useDuplicateProblem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      targetDeviceId,
    }: {
      id: string;
      targetDeviceId?: string;
    }) => problemsApi.duplicateProblem(id, targetDeviceId),
    onSuccess: (response, { targetDeviceId }) => {
      queryClient.invalidateQueries({ queryKey: problemKeys.lists() });
      if (targetDeviceId) {
        queryClient.invalidateQueries({
          queryKey: problemKeys.byDevice(targetDeviceId),
        });
      }
      queryClient.invalidateQueries({ queryKey: problemKeys.stats() });
    },
  });
};

export const usePublishProblem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => problemsApi.publishProblem(id),
    onSuccess: (response, id) => {
      queryClient.invalidateQueries({ queryKey: problemKeys.lists() });
      queryClient.invalidateQueries({ queryKey: problemKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: problemKeys.popular() });
      queryClient.invalidateQueries({ queryKey: problemKeys.stats() });
    },
  });
};

export const useUnpublishProblem = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => problemsApi.unpublishProblem(id),
    onSuccess: (response, id) => {
      queryClient.invalidateQueries({ queryKey: problemKeys.lists() });
      queryClient.invalidateQueries({ queryKey: problemKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: problemKeys.popular() });
      queryClient.invalidateQueries({ queryKey: problemKeys.stats() });
    },
  });
};

export const useUpdateProblemStats = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      sessionResult,
    }: {
      id: string;
      sessionResult: "success" | "failure";
    }) => problemsApi.updateProblemStats(id, sessionResult),
    onSuccess: (response, { id }) => {
      queryClient.invalidateQueries({ queryKey: problemKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: problemKeys.stats() });
      queryClient.invalidateQueries({ queryKey: problemKeys.popular() });
    },
  });
};

export const useExportProblems = () => {
  return useMutation({
    mutationFn: ({
      format = "json",
      deviceId,
      includeSteps = false,
    }: {
      format?: string;
      deviceId?: string;
      includeSteps?: boolean;
    }) => problemsApi.exportProblems(format, deviceId, includeSteps),
  });
};

// Prefetch helper
export const usePrefetchProblem = () => {
  const queryClient = useQueryClient();

  return (id: string, includeDetails: boolean = false) => {
    queryClient.prefetchQuery({
      queryKey: problemKeys.detail(id, includeDetails),
      queryFn: () => problemsApi.getProblem(id, includeDetails),
      staleTime: 2 * 60 * 1000,
    });
  };
};

// Optimistic update helper
export const useOptimisticProblemUpdate = () => {
  const queryClient = useQueryClient();

  return (id: string, updateData: Partial<Problem>) => {
    queryClient.setQueryData(problemKeys.detail(id), (old: any) => {
      if (!old?.data) return old;
      return {
        ...old,
        data: { ...old.data, ...updateData },
      };
    });
  };
};

export default {
  useProblems,
  useProblem,
  useProblemSearch,
  usePopularProblems,
  useProblemsByDevice,
  useProblemsByCategory,
  useProblemStats,
  useCreateProblem,
  useUpdateProblem,
  useDeleteProblem,
  useRestoreProblem,
  useDuplicateProblem,
  usePublishProblem,
  useUnpublishProblem,
  useUpdateProblemStats,
  useExportProblems,
  usePrefetchProblem,
  useOptimisticProblemUpdate,
};
