/**
 * Organization endpoints (subset needed by the shell). Mirrors the backend
 * `/api/v1/organizations` contracts; no domain logic here.
 */

import { apiClient } from "./client";
import type { ApiResult, Organization } from "./types";

export const organizationsApi = {
  /** List organizations the current user belongs to. */
  list(): Promise<ApiResult<Organization[]>> {
    return apiClient.get<Organization[]>("organizations");
  },

  /** Switch the user's active organization (POST organizations/{id}/switch). */
  switch(organizationId: string): Promise<ApiResult<Organization>> {
    return apiClient.post<Organization>(
      `organizations/${organizationId}/switch`,
    );
  },
};
