import type { DeviceFilters } from "./hardware.types";

/** Hardware is organization-scoped. */
export const hardwareKeys = {
  all: (orgId: string) => ["hardware", orgId] as const,
  list: (orgId: string, filters: DeviceFilters) => ["hardware", orgId, "list", filters] as const,
};
