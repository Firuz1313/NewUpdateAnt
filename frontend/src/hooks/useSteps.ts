import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { stepsApi, StepFilters, StepCreateData, StepUpdateData } from "../api";

// Query keys
export const stepKeys = {
  all: ["steps"] as const,
  lists: () => [...stepKeys.all, "list"] as const,
  list: (filters: StepFilters) => [...stepKeys.lists(), filters] as const,
  details: () => [...stepKeys.all, "detail"] as const,
  detail: (id: string, includeDetails?: boolean) =>
    [...stepKeys.details(), id, includeDetails] as const,
  byProblem: (problemId: string) =>
    [...stepKeys.all, "byProblem", problemId] as const,
  stats: () => [...stepKeys.all, "stats"] as const,
};

// Query hooks
export const useSteps = (
  page: number = 1,
  limit: number = 20,
  filters: StepFilters = {},
) => {
  return useQuery({
    queryKey: stepKeys.list({ page, limit, ...filters }),
    queryFn: () => stepsApi.getSteps(page, limit, filters),
    staleTime: 10 * 60 * 1000,
    cacheTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false,
    keepPreviousData: true,
    retry: 3,
  });
};

export const useStep = (id: string, includeDetails: boolean = false) => {
  return useQuery({
    queryKey: stepKeys.detail(id, includeDetails),
    queryFn: () => stepsApi.getStep(id, includeDetails),
    enabled: !!id,
    staleTime: 2 * 60 * 1000,
  });
};

export const useStepsByProblem = (problemId: string) => {
  return useQuery({
    queryKey: stepKeys.byProblem(problemId),
    queryFn: () => stepsApi.getStepsByProblem(problemId),
    enabled: !!problemId,
    staleTime: 5 * 60 * 1000,
  });
};

export const useStepStats = () => {
  return useQuery({
    queryKey: stepKeys.stats(),
    queryFn: () => stepsApi.getStepStats(),
    staleTime: 5 * 60 * 1000,
  });
};

// Mutation hooks
export const useCreateStep = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: StepCreateData) => stepsApi.createStep(data),
    onSuccess: (response, data) => {
      queryClient.invalidateQueries({ queryKey: stepKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: stepKeys.byProblem(data.problemId),
      });
      queryClient.invalidateQueries({ queryKey: stepKeys.stats() });
    },
  });
};

export const useUpdateStep = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: StepUpdateData }) =>
      stepsApi.updateStep(id, data),
    onSuccess: (response, { id, data }) => {
      queryClient.invalidateQueries({ queryKey: stepKeys.lists() });
      queryClient.invalidateQueries({ queryKey: stepKeys.detail(id) });
      if (data.problemId) {
        queryClient.invalidateQueries({
          queryKey: stepKeys.byProblem(data.problemId),
        });
      }
      queryClient.invalidateQueries({ queryKey: stepKeys.stats() });
    },
  });
};

export const useDeleteStep = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => stepsApi.deleteStep(id),
    onSuccess: (response, id) => {
      queryClient.invalidateQueries({ queryKey: stepKeys.lists() });
      queryClient.removeQueries({ queryKey: stepKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: stepKeys.stats() });
    },
  });
};

export default {
  useSteps,
  useStep,
  useStepsByProblem,
  useStepStats,
  useCreateStep,
  useUpdateStep,
  useDeleteStep,
};
