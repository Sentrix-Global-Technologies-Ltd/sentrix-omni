import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useOrganization } from "../../../context/OrganizationContext";
import { detectionsApi } from "../api/detections.api";
import { detectionKeys } from "../api/detections.keys";
import type { DetectionFilters } from "../api/detections.types";

/** Polls at the same cadence as the camera feed snapshots, since a detection
 * is emitted off the same pipeline. */
const POLL_MS = 5000;

export function useRecentDetections(filters: DetectionFilters) {
  const { activeId } = useOrganization();
  return useQuery({
    queryKey: detectionKeys.recent(activeId ?? "none", filters),
    queryFn: () => detectionsApi.recent(activeId as string, filters),
    enabled: Boolean(activeId),
    placeholderData: keepPreviousData,
    refetchInterval: POLL_MS,
  });
}
