import type { GateFilters, PassFilters } from "./access.types";

/** Access is organization-scoped. */
export const accessKeys = {
  all: (orgId: string) => ["access", orgId] as const,
  passes: (orgId: string, filters: PassFilters) => ["access", orgId, "passes", filters] as const,
  gate: (orgId: string, filters: GateFilters) => ["access", orgId, "gate", filters] as const,
};
