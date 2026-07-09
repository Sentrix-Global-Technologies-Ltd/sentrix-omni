import { apiClient } from "../../../services/api/client";
import type { ApiResult } from "../../../services/api/types";
import type {
  DriverFilters,
  OpsDriver,
  OpsRide,
  RideFilters,
  RidesOverview,
} from "./ridesops.types";

/** Rides-Ops admin endpoints (platform/SuperAdmin) — /rides/admin/*. */
export const ridesOpsApi = {
  overview(): Promise<ApiResult<RidesOverview>> {
    return apiClient.get<RidesOverview>("rides/admin/overview");
  },

  rides(filters: RideFilters): Promise<ApiResult<OpsRide[]>> {
    return apiClient.get<OpsRide[]>("rides/admin/rides", {
      query: { status: filters.status || undefined, page: filters.page },
    });
  },

  drivers(filters: DriverFilters): Promise<ApiResult<OpsDriver[]>> {
    return apiClient.get<OpsDriver[]>("rides/admin/drivers", {
      query: {
        stage: filters.stage || undefined,
        availability: filters.availability || undefined,
        page: filters.page,
      },
    });
  },

  // --- Write actions (SuperAdmin; server-confirmed) ---
  cancelRide(id: string, reason?: string): Promise<ApiResult<OpsRide>> {
    return apiClient.post<OpsRide>(`rides/admin/rides/${id}/cancel`, { reason });
  },
  escalateRide(id: string, reason?: string): Promise<ApiResult<unknown>> {
    return apiClient.post<unknown>(`rides/admin/rides/${id}/escalate`, { reason });
  },
  reassignRide(id: string, driver_name?: string): Promise<ApiResult<OpsRide>> {
    return apiClient.post<OpsRide>(`rides/admin/rides/${id}/reassign`, { driver_name });
  },
  suspendDriver(id: string, reason?: string): Promise<ApiResult<OpsDriver>> {
    return apiClient.post<OpsDriver>(`rides/admin/drivers/${id}/suspend`, { reason });
  },
  reinstateDriver(id: string): Promise<ApiResult<OpsDriver>> {
    return apiClient.post<OpsDriver>(`rides/admin/drivers/${id}/reinstate`);
  },
  setSurge(payload: {
    multiplier?: number;
    zone?: string;
    note?: string;
    release?: boolean;
  }): Promise<ApiResult<unknown>> {
    return apiClient.post<unknown>("rides/admin/surge", payload);
  },
};
