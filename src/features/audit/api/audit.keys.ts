import type { AuditFilters } from "./audit.types";

export const auditKeys = {
  all: (orgId: string) => ["audit", orgId] as const,
  list: (orgId: string, filters: AuditFilters) =>
    ["audit", orgId, "list", filters] as const,
};
