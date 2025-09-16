import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  devicesApi,
  DeviceFilters,
  DeviceCreateData,
  DeviceUpdateData,
} from "../api";
import { Device } from "../types";

// Query keys
export const deviceKeys = {
  all: ["devices"] as const,
  lists: () => [...deviceKeys.all, "list"] as const,
  list: (filters: DeviceFilters) => [...deviceKeys.lists(), filters] as const,
  details: () => [...deviceKeys.all, "detail"] as const,
  detail: (id: string, includeStats?: boolean) =>
    [...deviceKeys.details(), id, includeStats] as const,
  search: (query: string) => [...deviceKeys.all, "search", query] as const,
  popular: (limit?: number) => [...deviceKeys.all, "popular", limit] as const,
  stats: () => [...deviceKeys.all, "stats"] as const,
};

// 🔧 FIX: Hooks for querying devices with optimizations
export const useDevices = (
  page: number = 1,
  limit: number = 20,
  filters: DeviceFilters = {},
) => {
  return useQuery({
    queryKey: deviceKeys.list({ page, limit, ...filters }),
    queryFn: () => devicesApi.getDevices(page, limit, filters),
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 5 * 60 * 1000, // 5 minutes cache
    refetchOnWindowFocus: false,
    keepPreviousData: true,
    retry: 3,
  });
};

export const useDevice = (id: string, includeStats: boolean = false) => {
  return useQuery({
    queryKey: deviceKeys.detail(id, includeStats),
    queryFn: () => devicesApi.getDevice(id, includeStats),
    enabled: !!id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useDeviceSearch = (query: string, limit: number = 20) => {
  return useQuery({
    queryKey: deviceKeys.search(`${query}-${limit}`),
    queryFn: () => devicesApi.searchDevices(query, limit),
    enabled: query.length >= 2,
    staleTime: 30 * 1000, // 30 seconds
  });
};

export const usePopularDevices = (limit: number = 10) => {
  return useQuery({
    queryKey: deviceKeys.popular(limit),
    queryFn: () => devicesApi.getPopularDevices(limit),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useDeviceStats = () => {
  return useQuery({
    queryKey: deviceKeys.stats(),
    queryFn: () => devicesApi.getDeviceStats(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// Mutation hooks
export const useCreateDevice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: DeviceCreateData) => devicesApi.createDevice(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: deviceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: deviceKeys.stats() });
    },
  });
};

export const useUpdateDevice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: DeviceUpdateData }) =>
      devicesApi.updateDevice(id, data),
    onSuccess: (response, { id }) => {
      queryClient.invalidateQueries({ queryKey: deviceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: deviceKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: deviceKeys.stats() });
    },
  });
};

export const useDeleteDevice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, force = false }: { id: string; force?: boolean }) =>
      devicesApi.deleteDevice(id, force),
    onSuccess: (response, { id }) => {
      queryClient.invalidateQueries({ queryKey: deviceKeys.lists() });
      queryClient.removeQueries({ queryKey: deviceKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: deviceKeys.stats() });
    },
  });
};

export const useRestoreDevice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => devicesApi.restoreDevice(id),
    onSuccess: (response, id) => {
      queryClient.invalidateQueries({ queryKey: deviceKeys.lists() });
      queryClient.invalidateQueries({ queryKey: deviceKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: deviceKeys.stats() });
    },
  });
};

export const useReorderDevices = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (deviceIds: string[]) => devicesApi.reorderDevices(deviceIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: deviceKeys.lists() });
    },
  });
};

export const useBulkUpdateDevices = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (updates: Array<{ id: string; data: DeviceUpdateData }>) =>
      devicesApi.bulkUpdateDevices(updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: deviceKeys.all });
    },
  });
};

export const useExportDevices = () => {
  return useMutation({
    mutationFn: ({
      format = "json",
      includeProblems = false,
    }: {
      format?: string;
      includeProblems?: boolean;
    }) => devicesApi.exportDevices(format, includeProblems),
  });
};

// Prefetch helper
export const usePrefetchDevice = () => {
  const queryClient = useQueryClient();

  return (id: string, includeStats: boolean = false) => {
    queryClient.prefetchQuery({
      queryKey: deviceKeys.detail(id, includeStats),
      queryFn: () => devicesApi.getDevice(id, includeStats),
      staleTime: 2 * 60 * 1000,
    });
  };
};

// Optimistic update helper
export const useOptimisticDeviceUpdate = () => {
  const queryClient = useQueryClient();

  return (id: string, updateData: Partial<Device>) => {
    queryClient.setQueryData(deviceKeys.detail(id), (old: any) => {
      if (!old?.data) return old;
      return {
        ...old,
        data: { ...old.data, ...updateData },
      };
    });
  };
};

export default {
  useDevices,
  useDevice,
  useDeviceSearch,
  usePopularDevices,
  useDeviceStats,
  useCreateDevice,
  useUpdateDevice,
  useDeleteDevice,
  useRestoreDevice,
  useReorderDevices,
  useBulkUpdateDevices,
  useExportDevices,
  usePrefetchDevice,
  useOptimisticDeviceUpdate,
};
