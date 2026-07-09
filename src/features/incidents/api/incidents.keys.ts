import type { IncidentFilters } from "./incidents.types";

/**
 * Query-key factory (org-scoped, hierarchical). Realtime invalidates the whole
 * tree by prefix: invalidating `all(orgId)` refetches every mounted list+detail.
 */
export const incidentKeys = {
  all: (orgId: string) => ["incidents", orgId] as const,
  list: (orgId: string, filters: IncidentFilters) =>
    ["incidents", orgId, "list", filters] as const,
  detail: (orgId: string, id: string) =>
    ["incidents", orgId, "detail", id] as const,
};
