import type { BridgeFilters } from "./site-bridges.types";

/** Site Bridges are organization-scoped. */
export const siteBridgeKeys = {
  all: (orgId: string) => ["site-bridges", orgId] as const,
  list: (orgId: string, filters: BridgeFilters) => ["site-bridges", orgId, "list", filters] as const,
};
