import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { coordinationApi } from "../api/coordination.api";
import { coordinationKeys } from "../api/coordination.keys";
import type { DutyFilters, MutualAidFilters, TaskingFilters, ThreadFilters } from "../api/coordination.types";

export function useMutualAid(filters: MutualAidFilters) {
  return useQuery({
    queryKey: coordinationKeys.mutualAid(filters),
    queryFn: () => coordinationApi.mutualAid(filters),
    placeholderData: keepPreviousData,
  });
}

export function useTaskings(filters: TaskingFilters) {
  return useQuery({
    queryKey: coordinationKeys.taskings(filters),
    queryFn: () => coordinationApi.taskings(filters),
    placeholderData: keepPreviousData,
  });
}

export function useDutyEntries(filters: DutyFilters) {
  return useQuery({
    queryKey: coordinationKeys.duty(filters),
    queryFn: () => coordinationApi.duty(filters),
    placeholderData: keepPreviousData,
  });
}

/** A unit's comms thread. Disabled until a unit is actually selected. */
export function useUnitThread(unitId: string, filters: ThreadFilters) {
  return useQuery({
    queryKey: coordinationKeys.thread(unitId, filters),
    queryFn: () => coordinationApi.thread(unitId, filters),
    enabled: Boolean(unitId),
    placeholderData: keepPreviousData,
  });
}

export function useCoordinationAnalytics(days?: number) {
  return useQuery({
    queryKey: coordinationKeys.analytics(days),
    queryFn: () => coordinationApi.analytics(days),
  });
}
