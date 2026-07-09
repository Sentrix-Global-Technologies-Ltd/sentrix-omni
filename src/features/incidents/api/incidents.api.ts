import { apiClient } from "../../../services/api/client";
import type { ApiResult } from "../../../services/api/types";
import type {
  CreateIncidentInput,
  Incident,
  IncidentDetail,
  IncidentFilters,
  TimelineEntry,
  UpdateIncidentInput,
} from "./incidents.types";

const base = (orgId: string) => `organizations/${orgId}/incidents`;

/** Endpoint module — thin, typed wrapper over the API client. No logic. */
export const incidentsApi = {
  list(orgId: string, filters: IncidentFilters): Promise<ApiResult<Incident[]>> {
    return apiClient.get<Incident[]>(base(orgId), {
      query: {
        status: filters.status || undefined,
        severity: filters.severity || undefined,
        page: filters.page,
      },
    });
  },

  detail(orgId: string, id: string): Promise<ApiResult<IncidentDetail>> {
    return apiClient.get<IncidentDetail>(`${base(orgId)}/${id}`);
  },

  create(orgId: string, data: CreateIncidentInput): Promise<ApiResult<Incident>> {
    return apiClient.post<Incident>(base(orgId), data);
  },

  update(orgId: string, id: string, data: UpdateIncidentInput): Promise<ApiResult<Incident>> {
    return apiClient.patch<Incident>(`${base(orgId)}/${id}`, data);
  },

  timeline(orgId: string, id: string): Promise<ApiResult<TimelineEntry[]>> {
    return apiClient.get<TimelineEntry[]>(`${base(orgId)}/${id}/timeline`);
  },

  // --- Workflow transitions (server-confirmed; backend enforces guards) ---
  investigate(orgId: string, id: string): Promise<ApiResult<Incident>> {
    return apiClient.post<Incident>(`${base(orgId)}/${id}/investigate`);
  },
  escalate(orgId: string, id: string): Promise<ApiResult<Incident>> {
    return apiClient.post<Incident>(`${base(orgId)}/${id}/escalate`);
  },
  resolve(orgId: string, id: string): Promise<ApiResult<Incident>> {
    return apiClient.post<Incident>(`${base(orgId)}/${id}/resolve`);
  },
  close(orgId: string, id: string): Promise<ApiResult<Incident>> {
    return apiClient.post<Incident>(`${base(orgId)}/${id}/close`);
  },
};
