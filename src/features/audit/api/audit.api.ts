import { apiClient } from "../../../services/api/client";
import type { ApiResult } from "../../../services/api/types";
import type { AuditFilters, AuditLog } from "./audit.types";

const base = (orgId: string) => `organizations/${orgId}/audit-logs`;

export const auditApi = {
  list(orgId: string, filters: AuditFilters): Promise<ApiResult<AuditLog[]>> {
    return apiClient.get<AuditLog[]>(base(orgId), {
      query: { action: filters.action || undefined, cursor: filters.cursor || undefined },
    });
  },
};
