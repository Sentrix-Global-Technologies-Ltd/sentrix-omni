import { apiClient } from "../../../services/api/client";
import type { ApiResult } from "../../../services/api/types";
import type { DetectionEvent, RecentDetectionsFilters } from "./detections.types";

const base = (orgId: string) => `organizations/${orgId}/detections`;

/** Thin, typed wrapper over the Ingest detections endpoint. No domain logic. */
export const detectionsApi = {
  /**
   * Most-recent detection events for an organization, newest first.
   * Returns up to `limit` records (max 50 enforced by backend).
   */
  recent(orgId: string, filters: RecentDetectionsFilters = {}): Promise<ApiResult<DetectionEvent[]>> {
    return apiClient.get<DetectionEvent[]>(`${base(orgId)}/recent`, {
      query: {
        limit: filters.limit,
        camera_source_id: filters.cameraSourceId ?? undefined,
        incident_id: filters.incidentId ?? undefined,
      },
    });
  },
};
