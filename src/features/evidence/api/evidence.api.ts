import { apiClient } from "../../../services/api/client";
import type { ApiResult } from "../../../services/api/types";
import type { EvidenceCollection, EvidenceFilters, EvidenceStats, Observation } from "./evidence.types";

const base = (orgId: string) => `organizations/${orgId}/evidence`;

/** Evidence vault endpoints (org-scoped). */
export const evidenceApi = {
  search(orgId: string, filters: EvidenceFilters): Promise<ApiResult<Observation[]>> {
    // Build query params — omit falsy values so the backend never receives
    // empty strings, which could be misinterpreted as a filter value.
    const query: Record<string, string> = {};
    if (filters.kind)             query.kind             = filters.kind;
    if (filters.severity)         query.severity         = filters.severity;
    if (filters.status)           query.status           = filters.status;
    if (filters.plate)            query.plate            = filters.plate;
    if (filters.q)                query.q                = filters.q;
    if (filters.cursor)           query.cursor           = filters.cursor;
    if (filters.per_page)         query.per_page         = String(filters.per_page);
    // Batch 2 additions — forwarded to backend applyFacets() directly.
    if (filters.camera_source_id) query.camera_source_id = filters.camera_source_id;
    if (filters.from)             query.from             = filters.from;
    // `to` is stored as a plain YYYY-MM-DD date. Without a time component,
    // Carbon::parse() on the backend resolves to midnight UTC, which would
    // exclude all observations on that day after 00:00:00. Appending T23:59:59
    // makes Carbon parse to end-of-day so the selected date is fully included.
    if (filters.to)               query.to               = `${filters.to}T23:59:59`;
    if (filters.color)            query.color            = filters.color;
    if (filters.make)             query.make             = filters.make;
    if (filters.model)            query.model            = filters.model;
    if (filters.item)             query.item             = filters.item;
    return apiClient.get<Observation[]>(`${base(orgId)}/search`, { query });
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
