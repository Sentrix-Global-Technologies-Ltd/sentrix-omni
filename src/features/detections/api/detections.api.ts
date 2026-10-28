import { apiClient } from "../../../services/api/client";
import type { ApiResult } from "../../../services/api/types";
import type { DetectionEvent, DetectionFilters } from "./detections.types";

const base = (orgId: string) => `organizations/${orgId}/detections`;

/** Org-scoped, dashboard-facing view of Ingest detections — the Command
 * Center's Camera Wall recent-detections list. Read-only. */
export const detectionsApi = {
  recent(orgId: string, filters: DetectionFilters): Promise<ApiResult<DetectionEvent[]>> {
    return apiClient.get<DetectionEvent[]>(`${base(orgId)}/recent`, {
      query: {
        limit: filters.limit,
        ...(filters.triggered !== undefined && { triggered: filters.triggered }),
      },
    });
  },
};
