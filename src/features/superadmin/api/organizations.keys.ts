import type { PlatformOrganizationFilters } from "./organizations.types";

/** Platform organization directory keys (SuperAdmin/platform-staff, not org-scoped). */
export const platformOrganizationKeys = {
  all: () => ["platform-organizations"] as const,
  list: (filters: PlatformOrganizationFilters) => ["platform-organizations", "list", filters] as const,
  detail: (id: string) => ["platform-organizations", "detail", id] as const,
};
