import type { TripFilters } from "./trips.types";

/** Trips are organization-scoped. */
export const tripKeys = {
  all: (orgId: string) => ["trips", orgId] as const,
  list: (orgId: string, filters: TripFilters) => ["trips", orgId, "list", filters] as const,
  detail: (orgId: string, id: string) => ["trips", orgId, "detail", id] as const,
};
