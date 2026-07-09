import type { DriverFilters, RideFilters } from "./ridesops.types";

/** Rides-Ops is platform-scoped (SuperAdmin), not org-scoped. */
export const ridesOpsKeys = {
  all: () => ["rides-ops"] as const,
  overview: () => ["rides-ops", "overview"] as const,
  rides: (filters: RideFilters) => ["rides-ops", "rides", filters] as const,
  drivers: (filters: DriverFilters) => ["rides-ops", "drivers", filters] as const,
};
