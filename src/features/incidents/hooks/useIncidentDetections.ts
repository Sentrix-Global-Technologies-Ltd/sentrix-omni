import { useQuery } from "@tanstack/react-query";
import { useOrganization } from "../../../context/OrganizationContext";
import { detectionsApi } from "../../camera-feeds/api/detections.api";
import type { DetectionEvent } from "../../camera-feeds/api/detections.types";
import type { ApiResult } from "../../../services/api/types";

/**
 * TanStack Query key factory for incident-scoped detection queries.
 * Separate from the Camera Wall's recent-detections key so they never
 * share or pollute each other's cache entries.
 */
export const incidentDetectionKeys = {
  forIncident: (orgId: string, incidentId: string) =>
    ["detections", orgId, "incident", incidentId] as const,
};

/**
 * Fetches all detection events associated with a specific incident.
 *
 * Uses GET /api/v1/organizations/{org}/detections/recent?incident_id={id}
 * with limit=50 (the backend MAX_LIMIT). The backend verifies that the
 * incident belongs to the authenticated organization and that the user is
 * authorized to view it before scoping the detection query.
 *
 * Returns undefined data (disabled) when either orgId or incidentId is absent.
 * Does not poll — incident detection events are immutable once recorded.
 */
export function useIncidentDetections(incidentId: string | null | undefined): {
  data: ApiResult<DetectionEvent[]> | undefined;
  isLoading: boolean;
  error: Error | null;
} {
  const { activeId } = useOrganization();

  return useQuery({
    queryKey: incidentDetectionKeys.forIncident(activeId ?? "none", incidentId ?? "none"),
    queryFn: () =>
      detectionsApi.recent(activeId as string, {
        incidentId,
        limit: 50,
      }),
    enabled: Boolean(activeId && incidentId),
  });
}
