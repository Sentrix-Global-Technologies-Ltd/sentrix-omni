import { apiClient } from "../../../services/api/client";
import type { ApiResult } from "../../../services/api/types";
import type { BridgeFilters, CameraBridge } from "./site-bridges.types";

const base = (orgId: string) => `organizations/${orgId}/vision-guard/bridges`;

/** Site Bridge admin endpoints (org-scoped) — machine credentials that
 * authenticate ingest for an organization's already-installed CCTV/NVR feeds.
 * No separate desktop agent application exists; whatever is on-site (a
 * Sentrix relay process, or the org's own NVR) authenticates with the key. */
export const siteBridgesApi = {
  list(orgId: string, filters: BridgeFilters): Promise<ApiResult<CameraBridge[]>> {
    return apiClient.get<CameraBridge[]>(base(orgId), {
      query: { status: filters.status || undefined, page: filters.page },
    });
  },

  // Onboard / rotate return a one-time bridge key (shown once).
  onboard(
    orgId: string,
    payload: { label: string },
  ): Promise<ApiResult<{ bridge: CameraBridge; bridge_key: string }>> {
    return apiClient.post<{ bridge: CameraBridge; bridge_key: string }>(base(orgId), payload);
  },
  activate(orgId: string, id: string): Promise<ApiResult<CameraBridge>> {
    return apiClient.post<CameraBridge>(`${base(orgId)}/${id}/activate`);
  },
  suspend(orgId: string, id: string): Promise<ApiResult<CameraBridge>> {
    return apiClient.post<CameraBridge>(`${base(orgId)}/${id}/suspend`);
  },
  revoke(orgId: string, id: string): Promise<ApiResult<CameraBridge>> {
    return apiClient.post<CameraBridge>(`${base(orgId)}/${id}/revoke`);
  },
  rotateKey(orgId: string, id: string): Promise<ApiResult<{ bridge: CameraBridge; bridge_key: string }>> {
    return apiClient.post<{ bridge: CameraBridge; bridge_key: string }>(
      `${base(orgId)}/${id}/rotate-key`,
    );
  },
};
