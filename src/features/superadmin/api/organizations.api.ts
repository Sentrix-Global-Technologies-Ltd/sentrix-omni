import { apiClient } from "../../../services/api/client";
import type { ApiResult } from "../../../services/api/types";
import type { PlatformOrganization, PlatformOrganizationFilters } from "./organizations.types";

/** Sentrix Console (platform-staff) — cross-tenant organization directory. Not org-scoped. */
export const platformOrganizationsApi = {
  list(filters: PlatformOrganizationFilters): Promise<ApiResult<PlatformOrganization[]>> {
    return apiClient.get<PlatformOrganization[]>("platform/organizations", {
      query: {
        q: filters.q || undefined,
        region: filters.region || undefined,
        page: filters.page,
        per_page: filters.per_page,
      },
    });
  },

  detail(id: string): Promise<ApiResult<PlatformOrganization>> {
    return apiClient.get<PlatformOrganization>(`platform/organizations/${id}`);
  },
};
