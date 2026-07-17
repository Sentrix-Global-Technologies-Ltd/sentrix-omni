import { apiClient } from "../../../services/api/client";
import type { ApiResult } from "../../../services/api/types";

export interface CommunityHotspotCell {
  cell: string;
  lat: number;
  lng: number;
  count: number;
}

export interface CommunityHotspots {
  cells: CommunityHotspotCell[];
}

/** Community alerts — platform-wide (not organization-scoped) reads. */
export const communityApi = {
  hotspots(limit = 50): Promise<ApiResult<CommunityHotspots>> {
    return apiClient.get<CommunityHotspots>("community/hotspots", { query: { limit } });
  },
};
