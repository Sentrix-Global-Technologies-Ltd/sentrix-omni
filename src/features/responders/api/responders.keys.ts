import type { ResponderFilters } from "./responders.types";

/** Org-scoped, hierarchical query keys (realtime invalidates the tree by prefix). */
export const responderKeys = {
  all: (orgId: string) => ["responders", orgId] as const,
  list: (orgId: string, filters: ResponderFilters) =>
    ["responders", orgId, "list", filters] as const,
  detail: (orgId: string, id: string) =>
    ["responders", orgId, "detail", id] as const,
  assignments: (orgId: string, id: string) =>
    ["responders", orgId, "detail", id, "assignments"] as const,
};
