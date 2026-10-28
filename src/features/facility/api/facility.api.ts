import { apiClient } from "../../../services/api/client";
import type { ApiResult } from "../../../services/api/types";
import type {
  AllOrgCamera,
  CreateBuildingPayload,
  CreateZonePayload,
  FacilityBuilding,
  FacilityMap,
  UpdateBuildingPayload,
  UpdateCameraPositionPayload,
  UpdateZonePayload,
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

  updateZone(orgId: string, buildingId: string, zoneId: string, payload: UpdateZonePayload): Promise<ApiResult<{ id: string }>> {
    return apiClient.patch<{ id: string }>(`${base(orgId)}/buildings/${buildingId}/zones/${zoneId}`, payload);
  },

  deleteZone(orgId: string, buildingId: string, zoneId: string): Promise<ApiResult<null>> {
    return apiClient.delete<null>(`${base(orgId)}/buildings/${buildingId}/zones/${zoneId}`);
  },

  /**
   * Persist a camera's building-relative map position (or clear it by passing null coords).
   * Calls the existing vision-guard PATCH endpoint — no new route needed.
   */
  updateCameraPosition(orgId: string, cameraId: string, payload: UpdateCameraPositionPayload): Promise<ApiResult<unknown>> {
    return apiClient.patch<unknown>(`organizations/${orgId}/vision-guard/camera-sources/${cameraId}`, payload);
  },

  /**
   * Fetch ALL org camera sources without any filter — same endpoint as
   * cameraFeedsApi.list() but with no query params. Used by the Facility Map
   * unplaced-cameras panel so cameras with no site/zone match still appear.
   */
  listAllCameraSources(orgId: string): Promise<ApiResult<AllOrgCamera[]>> {
    return apiClient.get<AllOrgCamera[]>(`organizations/${orgId}/vision-guard/sources`);
  },
};
