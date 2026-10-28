import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useOrganization } from "../../../context/OrganizationContext";
import { detectionsApi } from "../api/detections.api";
import { detectionKeys } from "../api/detections.keys";
import type { RecentDetectionsFilters } from "../api/detections.types";

/**
 * Polling interval for the recent-detections list.
 *
 * The detections endpoint is a snapshot query, not a push stream — there is
 * no WebSocket channel for raw detection events. 30 s keeps the timeline
 * reasonably fresh without flooding the API.
 */
export const DETECTIONS_POLL_MS = 30_000;

/**
 * Fetches the most-recent detection events for the active organization,
 * refreshing every 30 seconds.
 *
 * Optional `cameraSourceId` restricts the query to one camera.
 * Changing it produces a separate cache entry so records are never mixed.
 */
export function useRecentDetections(filters: RecentDetectionsFilters = {}) {
  const { activeId } = useOrganization();
  const limit = filters.limit ?? 50;
  const cameraSourceId = filters.cameraSourceId ?? null;

  return useQuery({
    queryKey: detectionKeys.recent(activeId ?? "none", limit, cameraSourceId),
    queryFn: () => detectionsApi.recent(activeId as string, { limit, cameraSourceId }),
    enabled: Boolean(activeId),
    placeholderData: keepPreviousData,
    refetchInterval: DETECTIONS_POLL_MS,
  });
}
