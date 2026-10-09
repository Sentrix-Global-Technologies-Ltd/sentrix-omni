import { apiClient } from "../../../services/api/client";
import type { ApiResult } from "../../../services/api/types";
import type { Emergency, EmergencyEvidence, EmergencyFilters } from "./emergencies.types";

const base = (orgId: string) => `organizations/${orgId}/emergencies`;

/** Endpoint module — thin, typed wrapper over the API client. No logic. */
export const emergenciesApi = {
  list(orgId: string, filters: EmergencyFilters): Promise<ApiResult<Emergency[]>> {
    return apiClient.get<Emergency[]>(base(orgId), {
      query: {
        status: filters.status || undefined,
        severity: filters.severity || undefined,
        page: filters.page,
      },
    });
  },

  detail(orgId: string, id: string): Promise<ApiResult<Emergency>> {
    return apiClient.get<Emergency>(`${base(orgId)}/${id}`);
  },

  // --- Coordination actions (server-confirmed; backend enforces guards) ---
  acknowledge(orgId: string, id: string): Promise<ApiResult<Emergency>> {
    return apiClient.post<Emergency>(`${base(orgId)}/${id}/acknowledge`);
  },
  resolve(orgId: string, id: string, resolution?: string): Promise<ApiResult<Emergency>> {
    return apiClient.post<Emergency>(`${base(orgId)}/${id}/resolve`, {
      resolution: resolution || undefined,
    });
  },
  cancel(orgId: string, id: string): Promise<ApiResult<Emergency>> {
    return apiClient.post<Emergency>(`${base(orgId)}/${id}/cancel`);
  },

  // Captured SOS audio/video/photo — was only ever reachable by the consumer
  // themselves (me/emergencies/{id}/evidence); EmergencyController::evidence
  // adds the same org-scoped, permission-gated read for staff.
  evidence(orgId: string, id: string): Promise<ApiResult<EmergencyEvidence[]>> {
    return apiClient.get<EmergencyEvidence[]>(`${base(orgId)}/${id}/evidence`);
  },
};
