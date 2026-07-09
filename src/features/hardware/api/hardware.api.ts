import { apiClient } from "../../../services/api/client";
import type { ApiResult } from "../../../services/api/types";
import type { Device, DeviceFilters } from "./hardware.types";

const base = (orgId: string) => `organizations/${orgId}/hardware`;

/** Hardware (device fleet) endpoints (org-scoped). */
export const hardwareApi = {
  list(orgId: string, filters: DeviceFilters): Promise<ApiResult<Device[]>> {
    return apiClient.get<Device[]>(base(orgId), {
      query: {
        status: filters.status || undefined,
        kind: filters.kind || undefined,
        page: filters.page,
      },
    });
  },
  resync(orgId: string, id: string): Promise<ApiResult<Device>> {
    return apiClient.post<Device>(`${base(orgId)}/${id}/resync`);
  },
  diagnose(orgId: string, id: string): Promise<ApiResult<unknown>> {
    return apiClient.post<unknown>(`${base(orgId)}/${id}/diagnose`);
  },
};
