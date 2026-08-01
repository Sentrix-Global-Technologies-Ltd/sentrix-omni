import { apiClient } from "../../../services/api/client";
import type { ApiResult } from "../../../services/api/types";
import type { PlatformCommunityAlert, PlatformCommunityComment } from "./community.types";

export interface CommunityHotspotCell {
  cell: string;
  lat: number;
  lng: number;
  count: number;
}

export interface CommunityHotspots {
  cells: CommunityHotspotCell[];
}

export interface CommunityAlertFilters {
  status?: string;
  source?: string;
  category?: string;
  is_anonymous?: boolean;
  has_video?: boolean;
  search?: string;
  page?: number;
}

/** Community alerts — platform-wide (not organization-scoped) reads. */
export const communityApi = {
  hotspots(limit = 50): Promise<ApiResult<CommunityHotspots>> {
    return apiClient.get<CommunityHotspots>("community/hotspots", { query: { limit } });
  },

  /** Sentrix Console — moderation queue (v1/platform/community/alerts). */
  list(filters: CommunityAlertFilters): Promise<ApiResult<PlatformCommunityAlert[]>> {
    return apiClient.get<PlatformCommunityAlert[]>("platform/community/alerts", {
      query: {
        status: filters.status || undefined,
        source: filters.source || undefined,
        category: filters.category || undefined,
        is_anonymous: filters.is_anonymous === undefined ? undefined : String(filters.is_anonymous),
        has_video: filters.has_video === undefined ? undefined : String(filters.has_video),
        search: filters.search || undefined,
        page: filters.page,
      },
    });
  },
  show(id: string): Promise<ApiResult<PlatformCommunityAlert>> {
    return apiClient.get<PlatformCommunityAlert>(`platform/community/alerts/${id}`);
  },
  resolve(id: string): Promise<ApiResult<PlatformCommunityAlert>> {
    return apiClient.post<PlatformCommunityAlert>(`platform/community/alerts/${id}/resolve`);
  },
  comments(id: string, page = 1): Promise<ApiResult<PlatformCommunityComment[]>> {
    return apiClient.get<PlatformCommunityComment[]>(`platform/community/alerts/${id}/comments`, {
      query: { page },
    });
  },
  deleteComment(alertId: string, commentId: string): Promise<ApiResult<null>> {
    return apiClient.delete<null>(`platform/community/alerts/${alertId}/comments/${commentId}`);
  },
};
