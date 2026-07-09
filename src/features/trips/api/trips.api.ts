import { apiClient } from "../../../services/api/client";
import type { ApiResult } from "../../../services/api/types";
import type { CreateTripInput, Trip, TripFilters, UpdateTripInput } from "./trips.types";

const base = (orgId: string) => `organizations/${orgId}/trips`;

/** Trip endpoints (org-scoped). */
export const tripsApi = {
  list(orgId: string, filters: TripFilters): Promise<ApiResult<Trip[]>> {
    return apiClient.get<Trip[]>(base(orgId), {
      query: { status: filters.status || undefined, page: filters.page },
    });
  },
  detail(orgId: string, id: string): Promise<ApiResult<Trip>> {
    return apiClient.get<Trip>(`${base(orgId)}/${id}`);
  },
  create(orgId: string, data: CreateTripInput): Promise<ApiResult<Trip>> {
    return apiClient.post<Trip>(base(orgId), data);
  },
  update(orgId: string, id: string, data: UpdateTripInput): Promise<ApiResult<Trip>> {
    return apiClient.patch<Trip>(`${base(orgId)}/${id}`, data);
  },
  complete(orgId: string, id: string): Promise<ApiResult<Trip>> {
    return apiClient.post<Trip>(`${base(orgId)}/${id}/complete`);
  },
  cancel(orgId: string, id: string): Promise<ApiResult<Trip>> {
    return apiClient.post<Trip>(`${base(orgId)}/${id}/cancel`);
  },
};
