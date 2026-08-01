import { apiClient } from "../../../services/api/client";
import type { ApiResult } from "../../../services/api/types";
import type { RoadSegment } from "./road-risk.types";

export interface RoadRiskSegmentFilters {
  active?: boolean;
  band?: string;
  search?: string;
  page?: number;
}

export interface RoadSegmentPayload {
  name: string;
  area?: string | null;
  lat: number;
  lng: number;
  radius_m?: number;
  active?: boolean;
}

/** Sentrix Console — curates the road-segment safety scoring feed (v1/platform/road-risk/segments). */
export const roadRiskApi = {
  list(filters: RoadRiskSegmentFilters): Promise<ApiResult<RoadSegment[]>> {
    return apiClient.get<RoadSegment[]>("platform/road-risk/segments", {
      query: {
        active: filters.active === undefined ? undefined : String(filters.active),
        band: filters.band || undefined,
        search: filters.search || undefined,
        page: filters.page,
      },
    });
  },
  create(payload: RoadSegmentPayload): Promise<ApiResult<RoadSegment>> {
    return apiClient.post<RoadSegment>("platform/road-risk/segments", payload);
  },
  update(id: string, payload: Partial<RoadSegmentPayload>): Promise<ApiResult<RoadSegment>> {
    return apiClient.patch<RoadSegment>(`platform/road-risk/segments/${id}`, payload);
  },
  recompute(id: string): Promise<ApiResult<RoadSegment>> {
    return apiClient.post<RoadSegment>(`platform/road-risk/segments/${id}/recompute`);
  },
};
