import { apiClient } from "../../../services/api/client";
import type { ApiResult } from "../../../services/api/types";
import type {
  CreateBuildingPayload,
  CreateZonePayload,
  FacilityBuilding,
  FacilityMap,
  UpdateBuildingPayload,
} from "./facility.types";

const base = (orgId: string) => `organizations/${orgId}/facility`;

export const facilityApi = {
  map(orgId: string): Promise<ApiResult<FacilityMap>> {
    return apiClient.get<FacilityMap>(`${base(orgId)}/map`);
  },

  createBuilding(orgId: string, payload: CreateBuildingPayload): Promise<ApiResult<FacilityBuilding>> {
    return apiClient.post<FacilityBuilding>(`${base(orgId)}/buildings`, payload);
  },

  updateBuilding(orgId: string, buildingId: string, payload: UpdateBuildingPayload): Promise<ApiResult<FacilityBuilding>> {
    return apiClient.patch<FacilityBuilding>(`${base(orgId)}/buildings/${buildingId}`, payload);
  },

  deleteBuilding(orgId: string, buildingId: string): Promise<ApiResult<null>> {
    return apiClient.delete<null>(`${base(orgId)}/buildings/${buildingId}`);
  },

  createZone(orgId: string, buildingId: string, payload: CreateZonePayload): Promise<ApiResult<{ id: string }>> {
    return apiClient.post<{ id: string }>(`${base(orgId)}/buildings/${buildingId}/zones`, payload);
  },

  deleteZone(orgId: string, buildingId: string, zoneId: string): Promise<ApiResult<null>> {
    return apiClient.delete<null>(`${base(orgId)}/buildings/${buildingId}/zones/${zoneId}`);
  },
};
