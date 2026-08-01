import { apiClient } from "../../../services/api/client";
import type { ApiResult } from "../../../services/api/types";
import type { RetentionExport, StorageUsage } from "./retention.types";

const base = (orgId: string) => `organizations/${orgId}`;

/** Retention / storage endpoints (org-scoped). */
export const retentionApi = {
  storage(orgId: string): Promise<ApiResult<StorageUsage>> {
    return apiClient.get<StorageUsage>(`${base(orgId)}/storage`);
  },
  sweep(orgId: string): Promise<ApiResult<{ moved: Record<string, number> }>> {
    return apiClient.post<{ moved: Record<string, number> }>(`${base(orgId)}/retention/sweep`);
  },
  archive(orgId: string): Promise<ApiResult<RetentionExport>> {
    return apiClient.post<RetentionExport>(`${base(orgId)}/evidence/archive/export`);
  },
  purge(orgId: string): Promise<ApiResult<{ purged: number }>> {
    return apiClient.post<{ purged: number }>(`${base(orgId)}/evidence/purge`);
  },
  /** The Exports tab: append-only history of every archive manifest. */
  exports(orgId: string, cursor?: string): Promise<ApiResult<RetentionExport[]>> {
    return apiClient.get<RetentionExport[]>(`${base(orgId)}/evidence/exports`, {
      query: { cursor: cursor || undefined },
    });
  },
};
