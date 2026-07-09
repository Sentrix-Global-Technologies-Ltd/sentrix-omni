import { apiClient } from "../../../services/api/client";
import type { ApiResult } from "../../../services/api/types";

const base = (orgId: string) => `organizations/${orgId}`;

/** Retention / storage endpoints (org-scoped). */
export const retentionApi = {
  storage(orgId: string): Promise<ApiResult<Record<string, unknown>>> {
    return apiClient.get<Record<string, unknown>>(`${base(orgId)}/storage`);
  },
  sweep(orgId: string): Promise<ApiResult<unknown>> {
    return apiClient.post<unknown>(`${base(orgId)}/retention/sweep`);
  },
  archive(orgId: string): Promise<ApiResult<unknown>> {
    return apiClient.post<unknown>(`${base(orgId)}/evidence/archive/export`);
  },
  purge(orgId: string): Promise<ApiResult<unknown>> {
    return apiClient.post<unknown>(`${base(orgId)}/evidence/purge`);
  },
};
