import type { EmergencyFilters } from "./emergencies.types";

/** Org-scoped, hierarchical query keys (realtime invalidates the tree by prefix). */
export const emergencyKeys = {
  all: (orgId: string) => ["emergencies", orgId] as const,
  list: (orgId: string, filters: EmergencyFilters) =>
    ["emergencies", orgId, "list", filters] as const,
  detail: (orgId: string, id: string) =>
    ["emergencies", orgId, "detail", id] as const,
};
