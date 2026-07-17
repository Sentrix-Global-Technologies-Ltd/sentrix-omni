import { useQuery } from "@tanstack/react-query";
import { communityApi } from "../api/community.api";

/** Coarse community-alert density cells for the Operations Command Center. */
export function useCommunityHotspots(limit = 10) {
  return useQuery({
    queryKey: ["community", "hotspots", limit],
    queryFn: () => communityApi.hotspots(limit),
    staleTime: 30_000,
  });
}
