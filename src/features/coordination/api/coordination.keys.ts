import type { DutyFilters, MutualAidFilters, TaskingFilters, ThreadFilters } from "./coordination.types";

/** Coordination is platform-scoped (SuperAdmin), not org-scoped. */
export const coordinationKeys = {
  all: () => ["coordination"] as const,
  mutualAid: (filters: MutualAidFilters) => ["coordination", "mutual-aid", filters] as const,
  taskings: (filters: TaskingFilters) => ["coordination", "taskings", filters] as const,
  duty: (filters: DutyFilters) => ["coordination", "duty", filters] as const,
  thread: (unitId: string, filters: ThreadFilters) => ["coordination", "thread", unitId, filters] as const,
  analytics: (days?: number) => ["coordination", "analytics", days] as const,
};
