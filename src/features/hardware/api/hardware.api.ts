import { apiClient } from "../../../services/api/client";
import type { ApiResult } from "../../../services/api/types";
import type { Device, DeviceFilters, DiagnoseResult, RegisterDevicePayload, TransitionDeviceStatusPayload } from "./hardware.types";

const base = (orgId: string) => `organizations/${orgId}/hardware`;

/** Hardware (device fleet) endpoints (org-scoped). */
export const hardwareApi = {
  list(orgId: string, filters: DeviceFilters): Promise<ApiResult<Device[]>> {
    return apiClient.get<Device[]>(base(orgId), {
      query: {
        status: filters.status || undefined,
        kind: filters.kind || undefined,
        page: filters.page,
        exclude_retired: filters.excludeRetired ? "true" : undefined,
      },
    });
  },
  create(orgId: string, payload: RegisterDevicePayload): Promise<ApiResult<Device>> {
    return apiClient.post<Device>(base(orgId), payload);
  },
  resync(orgId: string, id: string): Promise<ApiResult<Device>> {
    return apiClient.post<Device>(`${base(orgId)}/${id}/resync`);
  },
  diagnose(orgId: string, id: string): Promise<ApiResult<DiagnoseResult>> {
    return apiClient.post<DiagnoseResult>(`${base(orgId)}/${id}/diagnose`);
  },
  transition(orgId: string, id: string, payload: TransitionDeviceStatusPayload): Promise<ApiResult<Device>> {
    return apiClient.patch<Device>(`${base(orgId)}/${id}/status`, payload);
  },
};
