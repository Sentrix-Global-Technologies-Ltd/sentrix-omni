import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { platformOrganizationsApi } from "../api/organizations.api";
import { platformOrganizationKeys } from "../api/organizations.keys";
import type { PlatformOrganizationFilters } from "../api/organizations.types";

/** Paginated cross-tenant organization directory (platform/SuperAdmin), filtered. */
export function usePlatformOrganizations(filters: PlatformOrganizationFilters, enabled = true) {
  return useQuery({
    queryKey: platformOrganizationKeys.list(filters),
    queryFn: () => platformOrganizationsApi.list(filters),
    placeholderData: keepPreviousData,
    enabled,
  });
}

/** Organization detail (platform/SuperAdmin cross-tenant view). */
export function usePlatformOrganization(id: string) {
  return useQuery({
    queryKey: platformOrganizationKeys.detail(id),
    queryFn: () => platformOrganizationsApi.detail(id),
    enabled: Boolean(id),
  });
}
