import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useOrganization } from "../../../context/OrganizationContext";
import { cameraFeedsApi } from "../api/camera-feeds.api";
import { cameraFeedKeys } from "../api/camera-feeds.keys";
import type { CameraFeedFilters } from "../api/camera-feeds.types";

/** Cadence matches the live-feed's own push interval (a source pushes a fresh
 * snapshot every few seconds) — polling faster wouldn't show anything newer. */
const POLL_MS = 5000;

export function useCameraFeeds(filters: CameraFeedFilters) {
  const { activeId } = useOrganization();
  return useQuery({
    queryKey: cameraFeedKeys.list(activeId ?? "none", filters),
    queryFn: () => cameraFeedsApi.list(activeId as string, filters),
    enabled: Boolean(activeId),
    placeholderData: keepPreviousData,
    refetchInterval: POLL_MS,
  });
}
