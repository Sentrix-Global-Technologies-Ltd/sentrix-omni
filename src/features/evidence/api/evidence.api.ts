import { apiClient } from "../../../services/api/client";
import type { ApiResult } from "../../../services/api/types";
import type { EvidenceFilters, EvidenceStats, Observation } from "./evidence.types";

const base = (orgId: string) => `organizations/${orgId}/evidence`;

/** Evidence vault endpoints (org-scoped). */
export const evidenceApi = {
  search(orgId: string, filters: EvidenceFilters): Promise<ApiResult<Observation[]>> {
    return apiClient.get<Observation[]>(`${base(orgId)}/search`, {
      query: {
        kind: filters.kind || undefined,
        severity: filters.severity || undefined,
        status: filters.status || undefined,
        plate: filters.plate || undefined,
        q: filters.q || undefined,
        cursor: filters.cursor || undefined,
      },
    });
  },

  stats(orgId: string): Promise<ApiResult<EvidenceStats>> {
    return apiClient.get<EvidenceStats>(`${base(orgId)}/stats`);
  },

  // --- Actions (server-confirmed) ---
  hold(orgId: string, id: string, hold: boolean): Promise<ApiResult<Observation>> {
    return apiClient.post<Observation>(`${base(orgId)}/${id}/hold`, { hold });
  },
  bookmark(orgId: string, id: string, bookmarked: boolean): Promise<ApiResult<Observation>> {
    return apiClient.post<Observation>(`${base(orgId)}/${id}/bookmark`, { bookmarked });
  },
};
