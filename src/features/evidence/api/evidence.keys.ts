import type { EvidenceFilters } from "./evidence.types";

/** Evidence is organization-scoped — keys carry the active org id. */
export const evidenceKeys = {
  all: (orgId: string) => ["evidence", orgId] as const,
  search: (orgId: string, filters: EvidenceFilters) =>
    ["evidence", orgId, "search", filters] as const,
  stats: (orgId: string) => ["evidence", orgId, "stats"] as const,
};
