import type { AssignmentFilters } from "./assignments.types";

/** Org-scoped, hierarchical query keys (realtime invalidates the tree by prefix). */
export const assignmentKeys = {
  all: (orgId: string) => ["assignments", orgId] as const,
  list: (orgId: string, filters: AssignmentFilters) =>
    ["assignments", orgId, "list", filters] as const,
  detail: (orgId: string, id: string) =>
    ["assignments", orgId, "detail", id] as const,
  recommendations: (orgId: string, id: string) =>
    ["assignments", orgId, "detail", id, "recommendations"] as const,
};
