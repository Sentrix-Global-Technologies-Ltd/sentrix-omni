import type { DetectionFilters } from "./detections.types";

/** Detections are organization-scoped. */
export const detectionKeys = {
  all: (orgId: string) => ["detections", orgId] as const,
  recent: (orgId: string, filters: DetectionFilters) => ["detections", orgId, "recent", filters] as const,
};
