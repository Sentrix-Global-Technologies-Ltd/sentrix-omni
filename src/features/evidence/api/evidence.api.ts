import { apiClient } from "../../../services/api/client";
import type { ApiResult } from "../../../services/api/types";
import type { EvidenceCollection, EvidenceFilters, EvidenceStats, Observation } from "./evidence.types";

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

  // --- Collections (case-file groupings over existing observations) ---
  listCollections(orgId: string, page = 1): Promise<ApiResult<EvidenceCollection[]>> {
    return apiClient.get<EvidenceCollection[]>(`${base(orgId)}/collections`, { query: { page } });
  },
  getCollection(orgId: string, id: string): Promise<ApiResult<EvidenceCollection>> {
    return apiClient.get<EvidenceCollection>(`${base(orgId)}/collections/${id}`);
  },
  createCollection(
    orgId: string,
    payload: { name: string; description?: string; observation_ids?: string[] },
  ): Promise<ApiResult<EvidenceCollection>> {
    return apiClient.post<EvidenceCollection>(`${base(orgId)}/collections`, payload);
  },
  updateCollection(
    orgId: string,
    id: string,
    payload: { name?: string; description?: string },
  ): Promise<ApiResult<EvidenceCollection>> {
    return apiClient.patch<EvidenceCollection>(`${base(orgId)}/collections/${id}`, payload);
  },
  deleteCollection(orgId: string, id: string): Promise<ApiResult<null>> {
    return apiClient.delete<null>(`${base(orgId)}/collections/${id}`);
  },
  addToCollection(orgId: string, id: string, observationIds: string[]): Promise<ApiResult<EvidenceCollection>> {
    return apiClient.post<EvidenceCollection>(`${base(orgId)}/collections/${id}/observations`, {
      observation_ids: observationIds,
    });
  },
  removeFromCollection(orgId: string, id: string, observationIds: string[]): Promise<ApiResult<EvidenceCollection>> {
    return apiClient.delete<EvidenceCollection>(`${base(orgId)}/collections/${id}/observations`, {
      observation_ids: observationIds,
    });
  },
};
