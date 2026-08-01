import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { communityApi } from "../api/community.api";
import type { CommunityAlertFilters } from "../api/community.api";

/** Sentrix Console — the community-alert moderation queue. */
export function useCommunityAlerts(filters: CommunityAlertFilters) {
  return useQuery({
    queryKey: ["superadmin", "community-alerts", "list", filters],
    queryFn: () => communityApi.list(filters),
    placeholderData: keepPreviousData,
  });
}

/** A single alert's discussion thread — fetched on demand when a moderator opens it. */
export function useCommunityComments(alertId: string | null, page = 1) {
  return useQuery({
    queryKey: ["superadmin", "community-alerts", "comments", alertId, page],
    queryFn: () => communityApi.comments(alertId as string, page),
    enabled: alertId !== null,
    placeholderData: keepPreviousData,
  });
}
